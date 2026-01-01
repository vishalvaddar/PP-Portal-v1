const path = require("path");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const fs = require("fs/promises");
const format = require("pg-format");
const { existsSync: fsExistsSync } = require("fs");
const NO_INTERVIEWER_ID = "NO_ONE";

const InterviewModel = {
  async getExamCenters() {
    try {
      const { rows } = await pool.query(`
                SELECT pp_exam_centre_id, pp_exam_centre_name
                FROM pp.pp_exam_centre
                ORDER BY pp_exam_centre_name ASC;
            `);
      return rows;
    } catch (error) {
      console.error("Error fetching exam centers:", error);
      throw error;
    }
  },

  async getAllStates() {
    try {
      const result = await pool.query(`
                SELECT juris_code, juris_name
                FROM pp.jurisdiction
                WHERE LOWER(juris_type) = 'state';
            `);
      return result.rows;
    } catch (error) {
      console.error("InterviewModel.getAllStates - Error:", error);
      throw error;
    }
  },

  async getDivisionsByState(stateName) {
    try {
      const result = await pool.query(
        `
        SELECT juris_code, juris_name
        FROM pp.jurisdiction AS division
        WHERE division.parent_juris IN (
          SELECT state.juris_code
          FROM pp.jurisdiction AS state
          WHERE LOWER(TRIM(state.juris_name)) = LOWER(TRIM($1))
        )
        AND LOWER(division.juris_type) = 'division';
        `,
        [stateName]
      );
      return result.rows;
    } catch (error) {
      console.error("InterviewModel.getDivisionsByState - Error:", error);
      throw error;
    }
  },

  async getDistrictsByDivision(divisionName) {
    try {
      const result = await pool.query(
        `
        SELECT juris_code, juris_name
        FROM pp.jurisdiction AS district
        WHERE district.parent_juris IN (
          SELECT division.juris_code
          FROM pp.jurisdiction AS division
          WHERE LOWER(TRIM(division.juris_name)) = LOWER(TRIM($1))
        )
        AND LOWER(district.juris_type) = 'education district';
        `,
        [divisionName]
      );
      return result.rows;
    } catch (error) {
      console.error("InterviewModel.getDistrictsByDivision - Error:", error);
      throw error;
    }
  },

  async getBlocksByDistrict(stateName, divisionName, districtName) {
    try {
      const result = await pool.query(
        `
                SELECT
                    j.juris_code,
                    j.juris_name,
                    CASE
                        WHEN j.juris_code IN (
                            SELECT sbj.juris_code
                            FROM pp.shortlist_batch_jurisdiction AS sbj
                            JOIN pp.shortlist_batch AS sb ON sbj.shortlist_batch_id = sb.shortlist_batch_id
                            WHERE sb.frozen_yn = 'Y'
                        )
                        THEN TRUE ELSE FALSE
                    END AS is_frozen_block
                FROM pp.jurisdiction AS j
                WHERE LOWER(j.juris_type) = 'block'
                    AND j.parent_juris IN (
                        -- Subquery to find the specific District's juris_code
                        SELECT district.juris_code
                        FROM pp.jurisdiction AS district
                        WHERE LOWER(TRIM(district.juris_name)) = LOWER(TRIM($3)) -- Match District Name ($3)
                          AND LOWER(district.juris_type) = 'education district'
                          -- Ensure the District belongs to the specified Division
                          AND district.parent_juris IN ( 
                            SELECT division.juris_code
                            FROM pp.jurisdiction AS division
                            WHERE LOWER(TRIM(division.juris_name)) = LOWER(TRIM($2)) -- Match Division Name ($2)
                              AND LOWER(division.juris_type) = 'division'
                              -- Ensure the Division belongs to the specified State
                              AND division.parent_juris IN (
                                SELECT state.juris_code
                                FROM pp.jurisdiction AS state
                                WHERE LOWER(TRIM(state.juris_name)) = LOWER(TRIM($1)) -- Match State Name ($1)
                                  AND LOWER(state.juris_type) = 'state'
                              )
                          )
                    );
                `,
        [stateName, divisionName, districtName]
      );
      return result.rows;
    } catch (error) {
      console.error("InterviewModel.getBlocksByDistrict - Error:", error);
      throw error;
    }
  },

 async getUnassignedStudents(centerName, nmmsYear) {
    try {
        const { rows } = await pool.query(
            `WITH LatestInterview AS (
                SELECT
                    si.applicant_id,
                    si.interview_round,
                    si.status,
                    si.interview_result,
                    ROW_NUMBER() OVER (
                        PARTITION BY si.applicant_id
                        ORDER BY si.interview_round DESC, si.interview_date DESC NULLS LAST
                    ) AS rn
                FROM pp.student_interview si
                JOIN pp.applicant_primary_info api_sub 
                    ON si.applicant_id = api_sub.applicant_id 
                WHERE api_sub.nmms_year = $2
            )
            SELECT
                api.applicant_id,
                api.student_name,
                COALESCE(inst.institute_name, '-') AS institute_name,
                exam.pp_exam_score,
                centre.pp_exam_centre_name,
                COALESCE(li.interview_round, 0) AS current_max_round,
                COALESCE(li.status, 'NOT ASSIGNED') AS latest_interview_status
            FROM pp.applicant_primary_info api
            JOIN pp.exam_results exam 
                ON api.applicant_id = exam.applicant_id
            JOIN pp.applicant_exam ap 
                ON ap.applicant_id = exam.applicant_id
            JOIN pp.examination e 
                ON e.exam_id = ap.exam_id
            JOIN pp.pp_exam_centre centre 
                ON e.pp_exam_centre_id = centre.pp_exam_centre_id
            LEFT JOIN pp.institute inst 
                ON api.current_institute_dise_code = inst.dise_code
            LEFT JOIN LatestInterview li 
                ON api.applicant_id = li.applicant_id 
                AND li.rn = 1
            WHERE
                -- Case-insensitive comparison for input center name
                LOWER(TRIM(centre.pp_exam_centre_name)) = LOWER(TRIM($1))
                AND api.nmms_year = $2
                AND exam.pp_exam_cleared = 'Y'
                AND exam.interview_required_yn = 'Y'
                AND (
                    li.applicant_id IS NULL
                    OR (
                        -- Updated to match UPPERCASE constraints: 'RESCHEDULED'
                        TRIM(UPPER(li.status)) = 'RESCHEDULED'
                        -- Updated to match UPPERCASE constraint: 'ANOTHER INTERVIEW REQUIRED'
                        AND TRIM(UPPER(li.interview_result)) = 'ANOTHER INTERVIEW REQUIRED'
                        AND li.interview_round < 3
                    )
                    -- Updated to match UPPERCASE constraint: 'CANCELLED'
                    OR TRIM(UPPER(li.status)) = 'CANCELLED'
                )
            ORDER BY api.student_name ASC;`,
            [centerName, nmmsYear]
        );
        return rows;
    } catch (error) {
        console.error("Error fetching unassigned students:", error);
        throw error;
    }
},
async getStudentsByInterviewer(interviewerName, nmmsYear) {
    try {
      const { rows } = await pool.query(
        `
        -- Fetch students assigned to a specific interviewer for a specific NMMS year
        -- filter for interviews that are SCHEDULED and do not yet have a result.
        SELECT
            a.student_name,
            a.applicant_id,
            s.interview_round
        FROM pp.student_interview s
        JOIN pp.interviewer i ON i.interviewer_id = s.interviewer_id
        JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
        WHERE 
            -- Case-insensitive comparison for the interviewer name
            LOWER(TRIM(i.interviewer_name)) = LOWER(TRIM($1))
            AND a.nmms_year = $2
            -- Matching the exact UPPERCASE status from the database CHECK constraint
            AND UPPER(TRIM(s.status)) = 'SCHEDULED'
            AND s.interview_result IS NULL;
        `,
        [interviewerName, nmmsYear]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching students by interviewer:", error);
      throw error;
    }
  },

  async getInterviewers() {
    try {
      const { rows } = await pool.query(`
                SELECT interviewer_id, interviewer_name
                FROM pp.interviewer
                ORDER BY interviewer_name ASC;
            `);
      return rows;
    } catch (error) {
      console.error("Error fetching interviewers:", error);
      throw error;
    }
  },

async getUnassignedStudentsByBlock(
    stateName,
    districtName,
    blockName,
    nmmsYear
) {
    try {
        const { rows } = await pool.query(
            `WITH LatestInterview AS (
                SELECT
                    si.applicant_id,
                    si.interview_round,
                    si.status,
                    si.interview_result,
                    ROW_NUMBER() OVER (
                        PARTITION BY si.applicant_id
                        ORDER BY si.interview_round DESC, si.interview_date DESC NULLS LAST
                    ) AS rn
                FROM pp.student_interview si
            ) 
            SELECT
                api.applicant_id,
                api.student_name,
                COALESCE(inst.institute_name, '-') AS institute_name,
                COALESCE(exam.pp_exam_score, 0) AS pp_exam_score,
                COALESCE(centre.pp_exam_centre_name, '-') AS pp_exam_centre_name,
                COALESCE(sj.juris_name, '-') AS state_name,
                COALESCE(dj.juris_name, '-') AS district_name,
                COALESCE(bj.juris_name, '-') AS block_name,
                COALESCE(li.interview_round, 0) AS current_max_round,
                COALESCE(li.status, 'NOT ASSIGNED') AS latest_interview_status
            FROM pp.applicant_primary_info api
            LEFT JOIN pp.exam_results exam 
                ON api.applicant_id = exam.applicant_id 
                AND exam.pp_exam_cleared = 'Y'
                AND exam.interview_required_yn = 'Y'
            LEFT JOIN pp.applicant_exam ap 
                ON ap.applicant_id = api.applicant_id
            LEFT JOIN pp.examination e 
                ON e.exam_id = ap.exam_id
            LEFT JOIN pp.pp_exam_centre centre 
                ON e.pp_exam_centre_id = centre.pp_exam_centre_id
            LEFT JOIN pp.institute inst 
                ON api.current_institute_dise_code = inst.dise_code
            LEFT JOIN LatestInterview li 
                ON api.applicant_id = li.applicant_id 
                AND li.rn = 1
            LEFT JOIN pp.jurisdiction sj 
                ON api.app_state = sj.juris_code
            LEFT JOIN pp.jurisdiction dj 
                ON api.district = dj.juris_code
            LEFT JOIN pp.jurisdiction bj 
                ON api.nmms_block = bj.juris_code
            WHERE
                -- Case-insensitive and trimmed comparison for jurisdiction names
                LOWER(TRIM(sj.juris_name)) = LOWER(TRIM($1))
                AND LOWER(TRIM(dj.juris_name)) = LOWER(TRIM($2))
                AND LOWER(TRIM(bj.juris_name)) = LOWER(TRIM($3))
                AND api.nmms_year = $4
                AND (
                    li.applicant_id IS NULL
                    OR (
                        -- Matching constraints for STATUS and RESULT
                        UPPER(TRIM(li.status)) = 'RESCHEDULED'
                        AND UPPER(TRIM(li.interview_result)) = 'ANOTHER INTERVIEW REQUIRED'
                        AND li.interview_round < 3
                    )
                    OR UPPER(TRIM(li.status)) = 'CANCELLED'
                )
            ORDER BY api.student_name ASC;`,
            [stateName, districtName, blockName, nmmsYear]
        );
        return rows;
    } catch (error) {
        console.error("Error fetching unassigned students by block:", error);
        throw error;
    }
},

async assignStudents(applicantIds, interviewerId, nmmsYear) {
    const client = await pool.connect();
    const results = { results: [] };

    try {
      await client.query("BEGIN"); // Start transaction

      for (const applicantId of applicantIds) {
        // 1. Get the student's last interview details
        const lastInterviewQuery = `
          SELECT interview_id, interview_round, status, interview_result
          FROM pp.student_interview
          WHERE applicant_id = $1
          ORDER BY interview_round DESC
          LIMIT 1;
        `;
        const lastInterviewRes = await client.query(lastInterviewQuery, [applicantId]);
        const lastInterview = lastInterviewRes.rows[0];

        let nextRound = 1;
        let actionTaken = false;

        if (lastInterview) {
          // Normalize status and result for comparison
          const status = lastInterview.status ? lastInterview.status.toUpperCase().trim() : null;
          const result = lastInterview.interview_result ? lastInterview.interview_result.toUpperCase().trim() : null;

          // A. Check if max rounds (3) have been reached
          if (lastInterview.interview_round >= 3) {
            results.results.push({
              applicantId,
              status: "Skipped",
              reason: "Max rounds reached (3 rounds completed).",
            });
            continue;
          }

          // B. Scenario 1: Eligibility for NEXT ROUND (Round 2 or 3)
          if (status === "RESCHEDULED" && result === "ANOTHER INTERVIEW REQUIRED") {
            nextRound = lastInterview.interview_round + 1;
          } 
          // C. Scenario 2: Fix CANCELLED record (Update instead of Insert)
          else if (status === "CANCELLED") {
            const updateCanceledQuery = `
              UPDATE pp.student_interview
              SET interviewer_id = $1,
                  status = 'SCHEDULED' 
              WHERE interview_id = $2
                AND applicant_id = $3
              RETURNING interview_round;
            `;
            const updateRes = await client.query(updateCanceledQuery, [
              interviewerId,
              lastInterview.interview_id,
              applicantId,
            ]);

            if (updateRes.rowCount > 0) {
              results.results.push({
                applicantId,
                status: "Assigned",
                interviewRound: lastInterview.interview_round,
              });
              actionTaken = true;
            }
            if (actionTaken) continue;
          } 
          // D. Scenario 3: Already Scheduled or Ineligible
          else {
            results.results.push({
              applicantId,
              status: "Skipped",
              reason: `Current status (${status}) or result (${result || 'NONE'}) does not allow reassignment.`,
            });
            continue;
          }
        }

        // 2. Check for duplicate assignment to same interviewer in any round
        const alreadyAssignedQuery = `
          SELECT 1 FROM pp.student_interview
          WHERE applicant_id = $1 AND interviewer_id = $2;
        `;
        const alreadyAssignedRes = await client.query(alreadyAssignedQuery, [applicantId, interviewerId]);
        
        if (alreadyAssignedRes.rowCount > 0) {
          results.results.push({
            applicantId,
            status: "Skipped",
            reason: "Already assigned to this interviewer in a previous round.",
          });
          continue;
        }

        // 3. Insert New Round (Round 1, or subsequent round if eligibility met)
        const insertQuery = `
          INSERT INTO pp.student_interview (interviewer_id, applicant_id, interview_round, status)
          SELECT $1, $2, $3, 'SCHEDULED'
          FROM pp.applicant_primary_info api
          WHERE api.applicant_id = $2 AND api.nmms_year = $4
          RETURNING interview_round;
        `;

        const insertRes = await client.query(insertQuery, [
          interviewerId,
          applicantId,
          nextRound,
          nmmsYear,
        ]);

        if (insertRes.rowCount > 0) {
          results.results.push({
            applicantId,
            status: "Assigned",
            interviewRound: insertRes.rows[0].interview_round,
          });
        } else {
          results.results.push({
            applicantId,
            status: "Skipped",
            reason: "Student data not found for the specified year.",
          });
        }
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in assignStudents:", error);
      throw error;
    } finally {
      client.release();
    }
  },

async assignStudents(applicantIds, interviewerId, nmmsYear) {
    const client = await pool.connect();
    const results = { results: [] };

    try {
      await client.query("BEGIN"); // Start transaction

      for (const applicantId of applicantIds) {
        // 1. Get the student's last interview details
        const lastInterviewQuery = `
          SELECT interview_id, interview_round, status, interview_result
          FROM pp.student_interview
          WHERE applicant_id = $1
          ORDER BY interview_round DESC
          LIMIT 1;
        `;
        const lastInterviewRes = await client.query(lastInterviewQuery, [applicantId]);
        const lastInterview = lastInterviewRes.rows[0];

        let nextRound = 1;
        let actionTaken = false;

        if (lastInterview) {
          // Normalize status and result for comparison
          const status = lastInterview.status ? lastInterview.status.toUpperCase().trim() : null;
          const result = lastInterview.interview_result ? lastInterview.interview_result.toUpperCase().trim() : null;

          // A. Check if max rounds (3) have been reached
          if (lastInterview.interview_round >= 3) {
            results.results.push({
              applicantId,
              status: "Skipped",
              reason: "Max rounds reached (3 rounds completed).",
            });
            continue;
          }

          // B. Scenario 1: Eligibility for NEXT ROUND (Round 2 or 3)
          if (status === "RESCHEDULED" && result === "ANOTHER INTERVIEW REQUIRED") {
            nextRound = lastInterview.interview_round + 1;
          } 
          // C. Scenario 2: Fix CANCELLED record (Update instead of Insert)
          else if (status === "CANCELLED") {
            const updateCanceledQuery = `
              UPDATE pp.student_interview
              SET interviewer_id = $1,
                  status = 'SCHEDULED' 
              WHERE interview_id = $2
                AND applicant_id = $3
              RETURNING interview_round;
            `;
            const updateRes = await client.query(updateCanceledQuery, [
              interviewerId,
              lastInterview.interview_id,
              applicantId,
            ]);

            if (updateRes.rowCount > 0) {
              results.results.push({
                applicantId,
                status: "Assigned",
                interviewRound: lastInterview.interview_round,
              });
              actionTaken = true;
            }
            if (actionTaken) continue;
          } 
          // D. Scenario 3: Already Scheduled or Ineligible
          else {
            results.results.push({
              applicantId,
              status: "Skipped",
              reason: `Current status (${status}) or result (${result || 'NONE'}) does not allow reassignment.`,
            });
            continue;
          }
        }

        // 2. Check for duplicate assignment to same interviewer in any round
        const alreadyAssignedQuery = `
          SELECT 1 FROM pp.student_interview
          WHERE applicant_id = $1 AND interviewer_id = $2;
        `;
        const alreadyAssignedRes = await client.query(alreadyAssignedQuery, [applicantId, interviewerId]);
        
        if (alreadyAssignedRes.rowCount > 0) {
          results.results.push({
            applicantId,
            status: "Skipped",
            reason: "Already assigned to this interviewer in a previous round.",
          });
          continue;
        }

        // 3. Insert New Round (Round 1, or subsequent round if eligibility met)
        const insertQuery = `
          INSERT INTO pp.student_interview (interviewer_id, applicant_id, interview_round, status)
          SELECT $1, $2, $3, 'SCHEDULED'
          FROM pp.applicant_primary_info api
          WHERE api.applicant_id = $2 AND api.nmms_year = $4
          RETURNING interview_round;
        `;

        const insertRes = await client.query(insertQuery, [
          interviewerId,
          applicantId,
          nextRound,
          nmmsYear,
        ]);

        if (insertRes.rowCount > 0) {
          results.results.push({
            applicantId,
            status: "Assigned",
            interviewRound: insertRes.rows[0].interview_round,
          });
        } else {
          results.results.push({
            applicantId,
            status: "Skipped",
            reason: "Student data not found for the specified year.",
          });
        }
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in assignStudents:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  
async getReassignableStudents(centerName, nmmsYear) {
    try {
      const { rows } = await pool.query(
        `SELECT
            api.applicant_id,
            api.student_name,
            inst.institute_name,
            exam.pp_exam_score,
            centre.pp_exam_centre_name,
            si.interview_round,
            i.interviewer_name AS current_interviewer,
            si.interviewer_id AS current_interviewer_id
        FROM pp.applicant_primary_info api
        JOIN pp.exam_results exam 
            ON api.applicant_id = exam.applicant_id
        JOIN pp.applicant_exam ap 
            ON ap.applicant_id = exam.applicant_id
        JOIN pp.examination e 
            ON e.exam_id = ap.exam_id
        JOIN pp.pp_exam_centre centre 
            ON e.pp_exam_centre_id = centre.pp_exam_centre_id
        LEFT JOIN pp.institute inst 
            ON api.current_institute_dise_code = inst.dise_code
        JOIN pp.student_interview si 
            ON api.applicant_id = si.applicant_id
        LEFT JOIN pp.interviewer i 
            ON si.interviewer_id = i.interviewer_id
        WHERE
            -- Case-insensitive comparison for center name
            LOWER(TRIM(centre.pp_exam_centre_name)) = LOWER(TRIM($1))
            AND api.nmms_year = $2
            AND exam.pp_exam_cleared = 'Y'
            AND exam.interview_required_yn = 'Y'
            -- Standardizing to UPPERCASE to match database CHECK constraints
            AND (UPPER(TRIM(si.status)) = 'SCHEDULED' OR UPPER(TRIM(si.status)) = 'RESCHEDULED')
            AND (UPPER(TRIM(si.interview_result)) = 'ANOTHER INTERVIEW REQUIRED' OR si.interview_result IS NULL)
            AND si.interview_round = (
                SELECT MAX(sub_si.interview_round)
                FROM pp.student_interview sub_si
                JOIN pp.applicant_primary_info sub_api 
                    ON sub_si.applicant_id = sub_api.applicant_id
                WHERE sub_si.applicant_id = si.applicant_id
                    AND sub_api.nmms_year = $2
            )
        ORDER BY api.student_name ASC;`,
        [centerName, nmmsYear]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching reassignable students:", error);
      throw error;
    }
  },

async reassignStudents(applicantIds, newInterviewerId, nmmsYear) {
    const client = await pool.connect();
    const results = { results: [] };
    const isCancellation = String(newInterviewerId) === NO_INTERVIEWER_ID;

    let numericNewInterviewerId = null;
    if (!isCancellation) {
        numericNewInterviewerId = Number(newInterviewerId);
    }

    try {
        await client.query("BEGIN");

        for (const applicantId of applicantIds) {
            let updateQuery;
            let updateParams;

            if (isCancellation) {
                // Cancellation logic: Set interviewer to NULL and status to CANCELLED
                // Using UPPER(status) for comparison to ensure robustness
                updateQuery = `
                    UPDATE pp.student_interview si
                    SET interviewer_id = NULL, 
                        status = 'CANCELLED'
                    FROM pp.applicant_primary_info api
                    WHERE si.applicant_id = api.applicant_id 
                      AND si.applicant_id = $1 
                      AND api.nmms_year = $2
                      AND UPPER(TRIM(si.status)) IN ('SCHEDULED', 'RESCHEDULED')
                    RETURNING si.interview_round, si.status;`;
                updateParams = [applicantId, nmmsYear];
            } else {
                // Reassignment logic: Set status to RESCHEDULED
                updateQuery = `
                    UPDATE pp.student_interview si
                    SET interviewer_id = $1, 
                        status = 'RESCHEDULED'
                    FROM pp.applicant_primary_info api
                    WHERE si.applicant_id = $2 
                      AND api.applicant_id = si.applicant_id 
                      AND api.nmms_year = $3
                      AND UPPER(TRIM(si.status)) IN ('SCHEDULED', 'RESCHEDULED')
                      AND si.interview_result IS NULL
                      -- Only update if the interviewer is actually DIFFERENT
                      AND si.interviewer_id IS DISTINCT FROM $1
                    RETURNING si.interview_round, si.status;`;
                updateParams = [numericNewInterviewerId, applicantId, nmmsYear];
            }

            const updateRes = await client.query(updateQuery, updateParams);

            if (updateRes.rowCount > 0) {
                // Return success result
                results.results.push({
                    applicantId,
                    status: updateRes.rows[0].status, 
                    interviewRound: updateRes.rows[0].interview_round,
                });
            } else {
                // Handle cases where update didn't occur (same interviewer or invalid status)
                results.results.push({ 
                    applicantId, 
                    status: "Skipped", 
                    reason: isCancellation ? "Already unassigned or not in a cancellable state" : "Student is already assigned to this interviewer or has a finalized result" 
                });
            }
        }

        await client.query("COMMIT");
        return results;
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error in reassignStudents model:", error);
        throw error;
    } finally {
        client.release();
    }
},

 getStudentsForVerification: async () => {
    try {
      // Use native JS to get the current year for the NMMS cycle
      const currentYear = new Date().getFullYear();
      
      const query = `
        SELECT 
            a.student_name, 
            a.applicant_id
        FROM pp.student_interview s
        JOIN pp.applicant_primary_info a
            ON a.applicant_id = s.applicant_id
        WHERE 
            -- Match the exact 'Y' value from your CHECK constraint
            UPPER(TRIM(s.home_verification_req_yn)) = 'Y'
            AND a.nmms_year = $1
            -- Ensure we only fetch students who haven't been verified yet
            AND a.applicant_id NOT IN (
                SELECT applicant_id 
                FROM pp.home_verification
            );
      `;

      const { rows } = await pool.query(query, [currentYear]);
      return rows;
    } catch (error) {
      console.error("Error in getStudentsForVerification:", error);
      throw new Error("Could not fetch students for verification.");
    }
  },

  async submitInterviewDetails(applicantId, interviewData, uploadedFile) {
    const {
      interviewDate,
      interviewTime,
      interviewMode,
      interviewStatus,
      lifeGoalsAndZeal,
      commitmentToLearning,
      integrity,
      communicationSkills,
      homeVerificationRequired,
      interviewResult,
      remarks,
      nmmsYear,
    } = interviewData;

    const client = await pool.connect();
    let originalFilePath = uploadedFile?.path;
    let finalTargetPath = null;

    try {
      await client.query("BEGIN");

      // 1. VALIDATION
      if (!uploadedFile) {
        throw new Error("No file was uploaded. File upload is mandatory.");
      }
      if (!remarks || remarks.trim() === "") {
        throw new Error("Remarks field is mandatory.");
      }

      // 2. FILE HANDLING (RENAME & CUSTOMIZE)
      const fileExtension = path.extname(uploadedFile.filename);
      const dbDocType = fileExtension.substring(1).toUpperCase();
      const newFileName = `INTERVIEW-${applicantId}-${nmmsYear}${fileExtension}`;
      const targetDirectory = path.dirname(originalFilePath);

      finalTargetPath = path.join(targetDirectory, newFileName);
      await fs.rename(originalFilePath, finalTargetPath);

      // 3. LOGIC PROCESSING
      // Ensure interviewResult matches exact UPPERCASE constraint values
      const dbInterviewResult = interviewResult.toUpperCase().trim();
      
      const isHomeVerificationRequired =
        homeVerificationRequired === "Required" ||
        dbInterviewResult === "HOME VERIFICATION REQUIRED";
      
      const homeVerificationYN = isHomeVerificationRequired ? "Y" : "N";

      const dbStatus = interviewStatus.toUpperCase().trim();
      const dbMode = interviewMode.toUpperCase().trim();

      // 4. DATABASE UPDATE
      const updateResult = await client.query(
        `UPDATE pp.student_interview
         SET
            interview_date = $1, 
            interview_time = $2, 
            interview_mode = $3, 
            status = $4, 
            life_goals_and_zeal = $5, 
            commitment_to_learning = $6, 
            integrity = $7, 
            communication_skills = $8, 
            home_verification_req_yn = $9, 
            interview_result = $10, 
            doc_name = $11, 
            doc_type = $12, 
            remarks = $13
         WHERE applicant_id = $14 
           AND UPPER(TRIM(status)) = 'SCHEDULED' 
           AND interview_result IS NULL
         RETURNING *;`,
        [
          interviewDate,
          interviewTime,
          dbMode,
          dbStatus,
          lifeGoalsAndZeal,
          commitmentToLearning,
          integrity,
          communicationSkills,
          homeVerificationYN,
          dbInterviewResult,
          newFileName,
          dbDocType,
          remarks,
          applicantId,
        ]
      );

      if (updateResult.rowCount === 0) {
        throw new Error("Update failed. No matching scheduled interview found.");
      }

      // 5. CONDITIONAL INSERT FOR 'ACCEPTED'
      if (dbInterviewResult === "ACCEPTED") {
        const insertQuery = `
          INSERT INTO pp.student_master (
            applicant_id, student_name, father_name, mother_name,
            father_occupation, mother_occupation, gender,
            contact_no1, contact_no2, current_institute_dise_code,
            previous_institute_dise_code, home_address
          )
          SELECT
            p.applicant_id, p.student_name, p.father_name, p.mother_name,
            s.father_occupation, s.mother_occupation, p.gender,
            p.contact_no1, p.contact_no2, p.current_institute_dise_code,
            p.previous_institute_dise_code, p.home_address
          FROM pp.applicant_primary_info p
          LEFT JOIN pp.applicant_secondary_info s ON p.applicant_id = s.applicant_id
          WHERE p.applicant_id = $1;
        `;
        await client.query(insertQuery, [applicantId]);
      }

      await client.query("COMMIT");
      return updateResult.rows[0];

    } catch (error) {
      await client.query("ROLLBACK");
      // Cleanup file on failure
      if (finalTargetPath && fsExistsSync(finalTargetPath)) await fs.unlink(finalTargetPath);
      console.error("Error submitting interview details:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  
 submitHomeVerification: async (data, fileData) => {
    const client = await pool.connect();
    let originalFilePath = null;
    let finalTargetPath = null;

    try {
      await client.query("BEGIN");

      const {
        applicantId,
        dateOfVerification,
        remarks,
        status,
        verifiedBy,
        verificationType,
      } = data;

      const nmmsYear = new Date().getFullYear();

      // --- 1. FILE HANDLING (RENAME & CUSTOMIZE) ---
      let docName = null;
      let docType = null;
      let newFileName = null;

      if (fileData) {
        originalFilePath = fileData.path;
        const fileExtension = path.extname(fileData.filename);
        docType = fileExtension.substring(1).toUpperCase();

        // Custom name format: HOME-VERI-{applicantId}-{nmmsYear}.ext
        newFileName = `HOME-VERI-${applicantId}-${nmmsYear}${fileExtension}`;
        const targetDirectory = path.dirname(originalFilePath);
        finalTargetPath = path.join(targetDirectory, newFileName);

        // Rename the file to the custom standardized name
        await fs.rename(originalFilePath, finalTargetPath);
        docName = newFileName;
      }

      // --- 2. DATABASE INSERTION (pp.home_verification) ---
      // Force status and type to UPPERCASE to match CHECK constraints
      const dbStatus = status.toUpperCase().trim();
      const dbVerificationType = verificationType.toUpperCase().trim();
      const rejectionReasonId = dbStatus === "REJECTED" ? 1 : null;

      const insertQuery = `
        INSERT INTO pp.home_verification (
            applicant_id, 
            date_of_verification, 
            remarks, 
            status, 
            verified_by, 
            rejection_reason_id, 
            verification_type, 
            doc_name, 
            doc_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *;
      `;

      const values = [
        applicantId,
        dateOfVerification,
        remarks,
        dbStatus,
        verifiedBy,
        rejectionReasonId,
        dbVerificationType,
        docName,
        docType,
      ];

      const result = await client.query(insertQuery, values);

      // --- 3. CONDITIONAL INSERT (pp.student_master) ---
      if (dbStatus === "ACCEPTED") {
        const masterInsertQuery = `
          INSERT INTO pp.student_master (
              applicant_id,
              student_name,
              father_name,
              mother_name,
              father_occupation,
              mother_occupation,
              gender,
              contact_no1,
              contact_no2,
              current_institute_dise_code,
              previous_institute_dise_code,
              home_address
          )
          SELECT
              p.applicant_id,
              p.student_name,
              p.father_name,
              p.mother_name,
              s.father_occupation,
              s.mother_occupation,
              p.gender,
              p.contact_no1,
              p.contact_no2,
              p.current_institute_dise_code,
              p.previous_institute_dise_code,
              p.home_address
          FROM pp.applicant_primary_info p
          LEFT JOIN pp.applicant_secondary_info s 
            ON p.applicant_id = s.applicant_id
          WHERE p.applicant_id = $1;
        `;
        await client.query(masterInsertQuery, [applicantId]);
      }

      await client.query("COMMIT");
      return result.rows[0];

    } catch (error) {
      await client.query("ROLLBACK");

      // 🛑 CLEANUP: Delete file if transaction fails
      if (finalTargetPath && fsExistsSync(finalTargetPath)) {
        await fs.unlink(finalTargetPath);
      } else if (originalFilePath && fsExistsSync(originalFilePath)) {
        await fs.unlink(originalFilePath);
      }

      console.error("Error in submitHomeVerification:", error);
      throw new Error(`Home verification failed: ${error.message}`);
    } finally {
      client.release();
    }
  },

 async getAssignmentReportData(interviewerId, nmmsYear, applicantIds) {
    if (!applicantIds || applicantIds.length === 0) {
      return [];
    }

    // 1. Prepare parameters
    const applicantIdsFormatted = applicantIds.map(String);
    const nmmsYearNum = parseInt(nmmsYear, 10);

    // ---------------------------------------------------------------------
    // QUERY 1: Fetch Primary, Secondary, and Jurisdiction Profile Data
    // ---------------------------------------------------------------------
    const profileSql = format(
      `
        SELECT
            -- Primary Info
            API.applicant_id,
            API.nmms_reg_number,
            API.student_name AS "Student Name",
            API.contact_no1 AS "Contact No 1",
            API.contact_no2 AS "Contact No 2",
            CUR_INST.institute_name AS "Current School Name",
            PREV_INST.institute_name AS "Previous School Name",
            API.gmat_score,
            API.sat_score,
            E.pp_exam_score,

            -- Jurisdiction Info
            SJ.juris_name AS "State Name",
            DJ.juris_name AS "District Name",
            BJ.juris_name AS "Block Name",

            -- Secondary Info
            S.village,
            S.father_occupation,
            S.mother_occupation,
            S.father_education,
            S.mother_education,
            S.household_size,
            S.own_house,
            S.smart_phone_home,
            S.internet_facility_home,
            S.career_goals,
            S.subjects_of_interest,
            S.transportation_mode,
            S.distance_to_school,
            S.num_two_wheelers,
            S.num_four_wheelers,
            S.irrigation_land,
            S.neighbor_name,
            S.neighbor_phone,
            S.favorite_teacher_name,
            S.favorite_teacher_phone

        FROM
            pp.applicant_primary_info API
        LEFT JOIN pp.applicant_secondary_info S
            ON S.applicant_id = API.applicant_id
        LEFT JOIN pp.exam_results E
            ON E.applicant_id = API.applicant_id
        LEFT JOIN pp.institute CUR_INST
            ON API.current_institute_dise_code = CUR_INST.dise_code
        LEFT JOIN pp.institute PREV_INST
            ON API.previous_institute_dise_code = PREV_INST.dise_code
        LEFT JOIN pp.jurisdiction SJ
            ON API.app_state = SJ.juris_code
        LEFT JOIN pp.jurisdiction DJ
            ON API.district = DJ.juris_code
        LEFT JOIN pp.jurisdiction BJ
            ON API.nmms_block = BJ.juris_code
        WHERE
            API.nmms_year = %s
            AND API.applicant_id IN (%L)
        ORDER BY API.student_name ASC;
    `,
      nmmsYearNum,
      applicantIdsFormatted
    );

    let profileRows = [];
    try {
      const profileResult = await pool.query(profileSql);
      profileRows = profileResult.rows;
    } catch (error) {
      console.error("Error fetching student profile data:", error);
      throw new Error("Database query failed for student profiles.");
    }

    if (profileRows.length === 0) {
      return [];
    }

    // ---------------------------------------------------------------------
    // QUERY 2: Fetch ALL Interview Data for categorized display
    // ---------------------------------------------------------------------
    const studentIdsToFetch = profileRows.map((row) => row.applicant_id);

    const interviewSql = format(
      `
        SELECT
            S.applicant_id,
            I.interviewer_name,
            S.interview_round AS "Interview Round",
            S.interview_date AS "Interview Date",
            S.interview_time AS "Interview Time",
            S.interview_mode AS "Interview Mode",
            S.status AS "Assignment Status",
            
            S.life_goals_and_zeal AS "Life Goals and Zeal",
            S.commitment_to_learning AS "Commitment to Learning",
            S.integrity AS "Integrity",
            S.communication_skills AS "Communication Skills",
            S.interview_result AS "Interview Result",
            
            I.interviewer_name AS "Assigned Interviewer Name"
        FROM
            pp.student_interview S
        JOIN pp.interviewer I
            ON I.interviewer_id = S.interviewer_id
        WHERE
            S.applicant_id IN (%L)
        ORDER BY
            S.applicant_id ASC, S.interview_round DESC;
    `,
      studentIdsToFetch
    );

    let interviewRecordsMap = new Map();
    try {
      const interviewResult = await pool.query(interviewSql);
      interviewResult.rows.forEach((row) => {
        const applicantId = row.applicant_id;
        if (!interviewRecordsMap.has(applicantId)) {
          interviewRecordsMap.set(applicantId, []);
        }
        interviewRecordsMap.get(applicantId).push(row);
      });
    } catch (error) {
      console.error("Error fetching ALL interview data:", error);
      throw new Error("Database query failed for interview data.");
    }

    // ---------------------------------------------------------------------
    // 3. MERGE and Structure Data for Display
    // ---------------------------------------------------------------------
    const finalReport = profileRows.map((student) => {
      const allInterviewRecords = interviewRecordsMap.get(student.applicant_id) || [];

      let pendingAssignment = null;
      let completedRounds = [];

      allInterviewRecords.forEach((record) => {
        const result = record["Interview Result"] ? record["Interview Result"].trim().toUpperCase() : null;
        const status = record["Assignment Status"] ? record["Assignment Status"].trim().toUpperCase() : null;

        // Categorize as completed if it has a final result that isn't excluded
        if (
          result &&
          result !== "PENDING" &&
          status !== "CANCELLED" &&
          status !== "SKIPPED"
        ) {
          completedRounds.push(record);
        } else if (!pendingAssignment) {
          // The first record found (highest round) without a final result is the pending one
          pendingAssignment = record;
        }
      });

      return {
        ...student,
        "Pending Assignment": pendingAssignment,
        "Completed Rounds": completedRounds,
      };
    });

    return finalReport;
  },
};

module.exports = InterviewModel;
