const path = require("path");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const fs = require("fs/promises");
const format = require("pg-format");
const { existsSync: fsExistsSync } = require('fs');
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
      console.error(
        "InterviewModel.getDistrictsByDivision - Error:",
        error
      );
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
      console.error(
        "InterviewModel.getBlocksByDistrict - Error:",
        error
      );
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
    COALESCE(li.status, 'Not Assigned') AS latest_interview_status
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
    LOWER(TRIM(centre.pp_exam_centre_name)) = LOWER(TRIM($1))
    AND api.nmms_year = $2
    AND exam.pp_exam_cleared = 'Y'
    AND exam.interview_required_yn = 'Y'
    AND (
        li.applicant_id IS NULL
        OR (
            li.status = 'RESCHEDULED'
            AND li.interview_result = 'Another Interview Required'
            AND li.interview_round < 3
        )
        OR li.status = 'CANCELLED'
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
    COALESCE(li.status, 'Not Assigned') AS latest_interview_status
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
    LOWER(TRIM(sj.juris_name)) = LOWER(TRIM($1))
    AND LOWER(TRIM(dj.juris_name)) = LOWER(TRIM($2))
    AND LOWER(TRIM(bj.juris_name)) = LOWER(TRIM($3))
    AND api.nmms_year = $4
    AND (
        li.applicant_id IS NULL
        OR (
            li.status = 'RESCHEDULED'
            AND li.interview_result = 'Another Interview Required'
            AND li.interview_round < 3
        )
        OR li.status = 'CANCELLED'
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
            const lastInterviewRes = await client.query(lastInterviewQuery, [
                applicantId,
            ]);
            const lastInterview = lastInterviewRes.rows[0];

            let nextRound = 1;
            let actionTaken = false; // Flag to check if an action (insert/update) was executed

            if (lastInterview) {
                const status = lastInterview.status;
                const result = lastInterview.interview_result;

                // A. Check if max rounds (3) have been reached
                if (lastInterview.interview_round >= 3) {
                    results.results.push({
                        applicantId,
                        status: "Skipped",
                        reason: "Max rounds reached (3 rounds completed).",
                    });
                    continue; 
                }

                // B. Check eligibility for NEXT ROUND (Round 2 or 3)
                if (
                    status === "RESCHEDULED" && 
                    result === "Another Interview Required"
                ) {
                    nextRound = lastInterview.interview_round + 1;
                } else if (status === "CANCELLED" && result === null) { 
                    // C. SCENARIO 2: FIX CANCELED INTERVIEW (UPDATE EXISTING RECORD)
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
                    } else {
                        results.results.push({
                            applicantId,
                            status: "Skipped",
                            reason: "Could not update cancelled record.",
                        });
                    }
                    continue;
                } else {
                    // D. Skip if ineligible
                    const skipReason = `Last interview status (${status}) does not allow a new assignment (requires 'RESCHEDULED'/'Another Interview Required' OR 'CANCELLED'/NULL).`;
                    results.results.push({
                        applicantId,
                        status: "Skipped",
                        reason: skipReason,
                    });
                    continue;
                }
            }

            if (actionTaken) {
                continue;
            }

            // 2. Check if the student is already assigned to this specific interviewer
            const alreadyAssignedQuery = `
                SELECT 1
                FROM pp.student_interview
                WHERE applicant_id = $1 AND interviewer_id = $2;
            `;
            const alreadyAssignedRes = await client.query(alreadyAssignedQuery, [
                applicantId,
                interviewerId,
            ]);
            if (alreadyAssignedRes.rowCount > 0) {
                results.results.push({
                    applicantId,
                    status: "Skipped",
                    reason: "Already assigned to this interviewer in previous round.",
                });
                continue; 
            }

            // 3. If eligible or Round 1, proceed with the actual insertion
            const insertQuery = `INSERT INTO pp.student_interview (interviewer_id, applicant_id, interview_round, status)
SELECT
    $1,
    $2,
    $3,
    'SCHEDULED'
FROM pp.applicant_primary_info api
WHERE api.applicant_id = $2 AND api.nmms_year = $4
RETURNING *;`; // <-- Applied leading whitespace fix here
            
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
                    reason: "Student not found for the specified NMMS year.",
                });
            }
        }

        await client.query("COMMIT"); // Commit transaction
        return results;
    } catch (error) {
        await client.query("ROLLBACK"); // Rollback on error
        console.error("Error assigning students:", error);
        throw error;
    } finally {
        client.release(); // Release client back to pool
    }
},

async getReassignableStudentsByBlock(
    stateName,
    districtName,
    blockName,
    nmmsYear
) {
    try {
        const { rows } = await pool.query(
            `SELECT
    api.applicant_id,
    api.student_name,
    inst.institute_name,
    exam.pp_exam_score,
    si.interview_round,
    i.interviewer_name AS current_interviewer,
    si.interviewer_id AS current_interviewer_id
FROM pp.applicant_primary_info api
JOIN pp.exam_results exam
    ON api.applicant_id = exam.applicant_id
LEFT JOIN pp.institute inst
    ON api.current_institute_dise_code = inst.dise_code
JOIN pp.student_interview si
    ON api.applicant_id = si.applicant_id
LEFT JOIN pp.interviewer i
    ON si.interviewer_id = i.interviewer_id
JOIN pp.jurisdiction sj
    ON api.app_state = sj.juris_code
JOIN pp.jurisdiction dj
    ON api.district = dj.juris_code
JOIN pp.jurisdiction bj
    ON api.nmms_block = bj.juris_code
WHERE
    api.nmms_year = $4
    AND LOWER(TRIM(sj.juris_name)) = LOWER(TRIM($1))
    AND LOWER(TRIM(dj.juris_name)) = LOWER(TRIM($2))
    AND LOWER(TRIM(bj.juris_name)) = LOWER(TRIM($3))
    AND exam.pp_exam_cleared = 'Y'
    AND exam.interview_required_yn = 'Y'
    AND (si.status = 'SCHEDULED' OR si.status = 'RESCHEDULED')
    AND (si.interview_result = 'Another Interview Required' OR si.interview_result IS NULL)
    AND si.interview_round = (
        SELECT MAX(sub_si.interview_round)
        FROM pp.student_interview sub_si
        JOIN pp.applicant_primary_info sub_api
            ON sub_si.applicant_id = sub_api.applicant_id
        WHERE sub_si.applicant_id = si.applicant_id
            AND sub_api.nmms_year = $4
    )
ORDER BY api.student_name ASC;`,
            [stateName, districtName, blockName, nmmsYear]
        );
        return rows;
    } catch (error) {
        console.error("Error fetching reassignable students by block:", error);
        throw error;
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
    LOWER(TRIM(centre.pp_exam_centre_name)) = LOWER(TRIM($1))
    AND api.nmms_year = $2
    AND exam.pp_exam_cleared = 'Y'
    AND exam.interview_required_yn = 'Y'
    AND (si.status = 'SCHEDULED' OR si.status = 'RESCHEDULED')
    AND (si.interview_result = 'Another Interview Required' OR si.interview_result IS NULL)
    AND si.interview_round = (
        SELECT MAX(sub_si.interview_round)
        FROM pp.student_interview sub_si
        JOIN pp.applicant_primary_info sub_api 
            ON sub_si.applicant_id = sub_api.applicant_id
        WHERE sub_si.applicant_id = si.applicant_id
            AND sub_api.nmms_year = $2
    )
ORDER BY api.student_name ASC;
`,
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
        if (isNaN(numericNewInterviewerId)) {
            throw new Error(
                'Invalid newInterviewerId provided. Must be a valid numeric ID or "NO_ONE".'
            );
        }
    }

    try {
        await client.query("BEGIN"); // Start transaction

        for (const applicantId of applicantIds) {
            let updateQuery;
            let updateParams;
            let statusToReturn;

            if (isCancellation) {
                // 🔥 CORRECTION APPLIED: Removed all leading whitespace from the SQL string.
                updateQuery = `
UPDATE pp.student_interview si
SET interviewer_id = NULL,
status = 'CANCELLED'
FROM pp.applicant_primary_info api
WHERE
    si.applicant_id = api.applicant_id
    AND si.applicant_id = $1
    AND api.nmms_year = $2
    AND si.status IN ('SCHEDULED', 'RESCHEDULED')
    AND si.interview_round = (
        SELECT MAX(interview_round)
        FROM pp.student_interview
        WHERE applicant_id = si.applicant_id
    )
RETURNING si.interview_round;
`;
                updateParams = [applicantId, nmmsYear];
                statusToReturn = "CANCELLED";
            } else {
                // 🔥 CORRECTION APPLIED: Removed all leading whitespace from the SQL string.
                updateQuery = `
UPDATE pp.student_interview si
SET interviewer_id = $1
FROM pp.applicant_primary_info api
WHERE
    si.applicant_id = $2
    AND api.applicant_id = si.applicant_id
    AND api.nmms_year = $3
    AND si.status = 'SCHEDULED'
    AND si.interview_result IS NULL
    AND si.interviewer_id IS DISTINCT FROM $1
    AND NOT EXISTS (
        SELECT 1
        FROM pp.student_interview si2
        WHERE
            si2.applicant_id = si.applicant_id
            AND si2.interviewer_id = $1
            AND si2.status IN ('SCHEDULED', 'RESCHEDULED')
            AND si2.interview_round <> si.interview_round
    )
RETURNING si.interview_round;
`;
                updateParams = [numericNewInterviewerId, applicantId, nmmsYear];
                statusToReturn = "RESCHEDULED";
            }

            const updateRes = await client.query(updateQuery, updateParams);

            if (updateRes.rowCount > 0) {
                results.results.push({
                    applicantId,
                    status: statusToReturn,
                    interviewRound: updateRes.rows[0].interview_round,
                });
            } else {
                let reason = isCancellation
                    ? "No scheduled/rescheduled interview found to cancel (student not eligible or row already updated)."
                    : "Reassignment conditions not met (e.g., same interviewer, no pending interview).";

                results.results.push({ applicantId, status: "Skipped", reason });
            }
        }

        await client.query("COMMIT");
        return results;
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error reassigning/cancelling students:", error);
        throw error;
    } finally {
        client.release();
    }
},

  async getStudentsByInterviewer(interviewerName, nmmsYear) {
    try {
      const { rows } = await pool.query(
        `
                -- This query fetches students who are currently assigned to a specific interviewer,
                -- for a given NMMS year, and have an interview that is scheduled but not yet completed.
                SELECT
                    a.student_name,
                    a.applicant_id,
                    s.interview_round
                FROM pp.student_interview s
                JOIN pp.interviewer i ON i.interviewer_id = s.interviewer_id
                JOIN pp.applicant_primary_info a ON a.applicant_id = s.applicant_id
                WHERE i.interviewer_name = $1
                AND a.nmms_year = $2
                AND s.status = 'SCHEDULED'
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
    let targetPath = null;

    try {
        await client.query("BEGIN");

        if (!uploadedFile) {
            throw new Error("No file was uploaded. File upload is mandatory.");
        }
        if (!remarks || remarks.trim() === "") {
            throw new Error("Remarks field is mandatory.");
        }

        // Get the file extension and the mimetype
        const fileExtension = path.extname(uploadedFile.name);
        
        // 🔥 CORRECTION 1: Derive a short, clean doc type (e.g., 'PDF') for VARCHAR(40) column.
        const dbDocType = fileExtension.substring(1).toUpperCase(); 

        // Construct the new unique and identifiable filename
        const newFileName = `interview-${applicantId}-${nmmsYear}${fileExtension}`;

        // Use cohort-year for folder structure
        const cohortFolder = `cohort-${nmmsYear}`;
        const baseDirectory = path.join(
            __dirname,
            "..",
            "..",
            "Data",
            "Interview-data"
        );
        const targetDirectory = path.join(baseDirectory, cohortFolder);
        targetPath = path.join(targetDirectory, newFileName);

        // Ensure the target directory exists (uses Promises API)
        await fs.mkdir(targetDirectory, { recursive: true });

        // Move the file to the target path (File upload middleware handles this as a Promise)
        await uploadedFile.mv(targetPath);

        // HOME VERIFICATION LOGIC
        const isHomeVerificationRequired =
            homeVerificationRequired === "Required" ||
            interviewResult === "Home Verification Required";
        const homeVerificationYN = isHomeVerificationRequired ? "Y" : "N";

        // 🔥 CORRECTION 2: Ensure status and mode are UPPERCASE for database CHECK constraint.
        const dbStatus = interviewStatus.toUpperCase();
        const dbMode = interviewMode.toUpperCase();

        // Update the database
        const result = await client.query(
            `
                UPDATE pp.student_interview
                SET
                    interview_date = $1, interview_time = $2, interview_mode = $3, status = $4, 
                    life_goals_and_zeal = $5, commitment_to_learning = $6, integrity = $7, 
                    communication_skills = $8, home_verification_req_yn = $9, interview_result = $10, 
                    doc_name = $11, doc_type = $12, remarks = $13
                WHERE applicant_id = $14 AND status = 'SCHEDULED' AND interview_result IS NULL
                RETURNING *;
                `,
            [
                interviewDate,
                interviewTime,
                dbMode,               // $3: Uppercase mode (e.g., 'ONLINE')
                dbStatus,             // $4: Uppercase status (e.g., 'COMPLETED' or 'RESCHEDULED')
                lifeGoalsAndZeal,
                commitmentToLearning,
                integrity,
                communicationSkills,
                homeVerificationYN,
                interviewResult,
                newFileName,
                dbDocType,            // $12: Short, uppercase file extension (e.g., 'PDF')
                remarks,
                applicantId,
            ]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            
            // Revert file upload
            if (fsExistsSync(targetPath)) { 
                await fs.unlink(targetPath);
            }
            
            console.error(
                `UPDATE FAILED for applicant ${applicantId}. Check current DB status to see why status/interview_result condition failed.`
            );
            throw new Error(
                "Update failed. No matching scheduled interview found, or record was already updated/finalized."
            );
        }

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        
        // Revert file upload on error
        if (targetPath && fsExistsSync(targetPath)) {
            await fs.unlink(targetPath);
        }
        
        console.error("Error submitting interview details:", error);
        throw error;
    } finally {
        client.release();
    }
},

  getStudentsForVerification: async () => {
    try {
      // Replaced EXTRACT(YEAR FROM CURRENT_DATE) with native JS
      const currentYear = new Date().getFullYear();
      const query = `
                SELECT a.student_name, a.applicant_id
                FROM pp.student_interview s
                JOIN pp.applicant_primary_info a
                    ON a.applicant_id = s.applicant_id
                WHERE s.home_verification_req_yn = 'Y'
                AND a.nmms_year = $1
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


  submitHomeVerification: async (data, fileData) => {
    const client = await pool.connect();
    let targetPath = null;

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

      // --- 1. File Handling ---
      let docName = null;
      let docType = null;

      if (fileData && typeof fileData.mv === "function") {
        const originalName = fileData.name || fileData.originalFilename;
        if (!originalName) {
          throw new Error("Uploaded file object is missing a name property.");
        }
        const fileExtension = path.extname(originalName);

        // Define components of the target path
        const baseDirectory = path.join(
          __dirname,
          "..",
          "..",
          "Data",
          "home-verification-data"
        );
        const cohortFolder = `cohort-${nmmsYear}`;

        // Construct the full path to the directory where the file will land
        const finalTargetDirectory = path.join(baseDirectory, cohortFolder);

        // Define the final file name only
        const fileNameOnly = `home-veri-${applicantId}-${nmmsYear}${fileExtension}`;

        // Construct the full target path for the file
        targetPath = path.join(finalTargetDirectory, fileNameOnly);

        // Ensure the entire directory path exists recursively
        await fs.mkdir(finalTargetDirectory, { recursive: true });

        // Move the file
        await fileData.mv(targetPath);

        // Store file info for DB (doc_name includes cohort/appli structure)
        docName = path.join(cohortFolder, fileNameOnly);
        docType = fileExtension.substring(1).toUpperCase(); // e.g., 'PDF', 'JPEG'
      }

      // --- 2. Database Insertion ---
      
      // Convert status and verificationType to uppercase to satisfy DB CHECK constraints
      const dbStatus = status.toUpperCase();
      const dbVerificationType = verificationType.toUpperCase();
      
      // Determine rejection reason ID (assuming 1 is the ID for "Rejected")
      const rejectionReasonId = dbStatus === "REJECTED" ? 1 : null; 

      // 🔥 FIX 1: Used single-line SQL to resolve syntax error
      const insertQuery = `INSERT INTO pp.home_verification (applicant_id, date_of_verification, remarks, status, verified_by, rejection_reason_id, verification_type, doc_name, doc_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;

      const values = [
        applicantId,
        dateOfVerification,
        remarks,
        dbStatus,             // $4: Must be 'ACCEPTED' or 'REJECTED'
        verifiedBy,
        rejectionReasonId,
        dbVerificationType,   // $7: Must be 'PHYSICAL' or 'VIRTUAL'
        docName,
        docType,
      ];

      const result = await client.query(insertQuery, values);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      
      // 🔥 FIX 2: Use the imported synchronous function fsExistsSync to check for file existence
      if (targetPath && fsExistsSync(targetPath)) { 
        await fs.unlink(targetPath); // Use promise-based fs.unlink for deletion
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

  
    const profileSql = format(
      `
        SELECT
            -- Primary Info
            api.applicant_id,
            api.nmms_reg_number,
            api.student_name AS "Student Name",
            api.contact_no1 AS "Contact No 1",
            api.contact_no2 AS "Contact No 2",
            cur_inst.institute_name AS "Current School Name",
            prev_inst.institute_name AS "Previous School Name",
            api.gmat_score,
            api.sat_score,
            e.pp_exam_score,

            -- Jurisdiction Info
            sj.juris_name AS "State Name",
            dj.juris_name AS "District Name",
            bj.juris_name AS "Block Name",

            -- Secondary Info (All requested fields)
            s.village,
            s.father_occupation,
            s.mother_occupation,
            s.father_education,
            s.mother_education,
            s.household_size,
            s.own_house,
            s.smart_phone_home,
            s.internet_facility_home,
            s.career_goals,
            s.subjects_of_interest,
            s.transportation_mode,
            s.distance_to_school,
            s.num_two_wheelers,
            s.num_four_wheelers,
            s.irrigation_land,
            s.neighbor_name,
            s.neighbor_phone,
            s.favorite_teacher_name,
            s.favorite_teacher_phone

        FROM
            pp.applicant_primary_info api
        LEFT JOIN pp.applicant_secondary_info s
            ON s.applicant_id = api.applicant_id
        LEFT JOIN pp.exam_results e
            ON e.applicant_id = api.applicant_id
        LEFT JOIN pp.institute cur_inst
            ON api.current_institute_dise_code = cur_inst.dise_code
        LEFT JOIN pp.institute prev_inst
            ON api.previous_institute_dise_code = prev_inst.dise_code
        LEFT JOIN pp.jurisdiction sj
            ON api.app_state = sj.juris_code
        LEFT JOIN pp.jurisdiction dj
            ON api.district = dj.juris_code
        LEFT JOIN pp.jurisdiction bj
            ON api.nmms_block = bj.juris_code
        WHERE
            api.nmms_year = %s
            AND api.applicant_id IN (%L)
        ORDER BY api.student_name ASC;
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
    // QUERY 2: Fetch ALL Interview Data, ordered by round DESC.
    // ---------------------------------------------------------------------
    const studentIdsToFetch = profileRows.map((row) => row.applicant_id);

    const interviewSql = format(
      `
        SELECT
            s.applicant_id,
            i.interviewer_name,
            s.interview_round AS "Interview Round",
            s.interview_date AS "Interview Date",
            s.interview_time AS "Interview Time",
            s.interview_mode AS "Interview Mode",
            s.status AS "Assignment Status",
            
            s.life_goals_and_zeal AS "Life Goals and Zeal",
            s.commitment_to_learning AS "Commitment to Learning",
            s.integrity AS "Integrity",
            s.communication_skills AS "Communication Skills",
            s.interview_result AS "Interview Result",
            
            i.interviewer_name AS "Assigned Interviewer Name"
        FROM
            pp.student_interview s
        JOIN pp.interviewer i
            ON i.interviewer_id = s.interviewer_id
        WHERE
            s.applicant_id IN (%L)
        ORDER BY
            s.applicant_id ASC, s.interview_round DESC;
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
      const allInterviewRecords =
        interviewRecordsMap.get(student.applicant_id) || [];

      let pendingAssignment = null;
      let completedRounds = [];

      // Categorize records:
      allInterviewRecords.forEach((record) => {
        const result = record["Interview Result"];
        if (
          result &&
          result !== "Pending" &&
          result !== "Cancelled" &&
          result !== "Skipped"
        ) {
          completedRounds.push(record);
        } else if (!pendingAssignment) {
          // The first record found (highest round) without a final result is the pending assignment.
          pendingAssignment = record;
        }
      });

      // Merge the profile data with a structured interview object
      const mergedStudent = {
        ...student,
        "Pending Assignment": pendingAssignment,
        "Completed Rounds": completedRounds,
      };

      return mergedStudent;
    });

    return finalReport;
  },
};

module.exports = InterviewModel;
