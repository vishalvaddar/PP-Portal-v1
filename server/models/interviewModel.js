const pool = require("../config/db");

const InterviewModel = {
  // Fetches a list of all available exam centers
  async getExamCenters() {
    try {
      const { rows } = await pool.query(`
        SELECT pp_exam_centre_id, pp_exam_centre_name
        FROM pp.pp_exam_centre
        ORDER BY pp_exam_centre_name ASC;
      `);
      return rows;
    } catch (error) {
      console.error('Error fetching exam centers:', error);
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
      console.error("GenerateShortlistModel.getAllStates - Error:", error);
      throw error;
    }
  },

  async getDistrictsByState(stateName) {
    try {
      const result = await pool.query(
        `
        SELECT juris_code, juris_name
        FROM pp.jurisdiction AS district
        WHERE district.parent_juris IN (
          SELECT state.juris_code
          FROM pp.jurisdiction AS state
          WHERE LOWER(TRIM(state.juris_name)) = LOWER(TRIM($1))
        )
        AND LOWER(district.juris_type) = 'education district';
        `,
        [stateName]
      );
      return result.rows;
    } catch (error) {
      console.error("GenerateShortlistModel.getDistrictsByState - Error:", error);
      throw error;
    }
  },

  async getBlocksByDistrict(districtName) {
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
            SELECT juris_code
            FROM pp.jurisdiction
            WHERE LOWER(TRIM(juris_name)) = LOWER(TRIM($1))
              AND juris_type = 'EDUCATION DISTRICT'
          );
        `,
        [districtName]
      );
      return result.rows;
    } catch (error) {
      console.error("GenerateShortlistModel.getBlocksByDistrict - Error:", error);
      throw error;
    }
  },

  // Fetches students who are eligible for an interview but have not been assigned yet.
  // This includes students with no prior interviews or those with a 'Rescheduled' status
  // from a previous round.
  async getUnassignedStudents(centerName, nmmsYear) {
    try {
      const { rows } = await pool.query(
        `
        WITH LatestInterview AS (
          SELECT
            si.applicant_id,
            si.interview_round,
            si.status,
            si.interview_result,
            -- ROW_NUMBER() assumes you want the very latest based on round and date.
            -- If multiple entries exist for the same max round, it picks one.
            ROW_NUMBER() OVER(PARTITION BY si.applicant_id ORDER BY si.interview_round DESC, si.interview_date DESC NULLS LAST) as rn
          FROM pp.student_interview si
          JOIN pp.applicant_primary_info api_sub ON si.applicant_id = api_sub.applicant_id
          WHERE api_sub.nmms_year = $2
        )
        SELECT
          api.applicant_id,
          api.student_name,
          inst.institute_name,
          exam.pp_exam_score,
          centre.pp_exam_centre_name,
          COALESCE(li.interview_round, 0) AS current_max_round,
          COALESCE(li.status, 'None') AS latest_interview_status
        FROM pp.applicant_primary_info api
        JOIN pp.exam_results exam ON api.applicant_id = exam.applicant_id
        JOIN pp.applicant_exam ap ON ap.applicant_id = exam.applicant_id
        JOIN pp.examination e ON e.exam_id = ap.exam_id
        JOIN pp.pp_exam_centre centre ON e.pp_exam_centre_id = centre.pp_exam_centre_id
        LEFT JOIN pp.institute inst ON api.current_institute_dise_code = inst.dise_code
        LEFT JOIN LatestInterview li ON api.applicant_id = li.applicant_id AND li.rn = 1
        WHERE
          centre.pp_exam_centre_name = $1
          AND api.nmms_year = $2
          AND exam.pp_exam_cleared = 'Y'
          AND exam.interview_required_yn = 'Y'
          AND (
            li.applicant_id IS NULL -- Applicant has no interview records
            OR (
              li.status = 'Rescheduled' -- Latest interview was rescheduled
              AND li.interview_result = 'next round' -- And result indicated next round
              AND li.interview_round < 3 -- And it's less than round 3
            )
          )
        ORDER BY api.student_name ASC;
        `,
        [centerName, nmmsYear]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching unassigned students:', error);
      throw error;
    }
  },

  // Fetches students eligible for interview by block.
  // The original query was missing the function signature and error handling.
  async getUnassignedStudentsByBlock(stateName, districtName, blockName, nmmsYear) {
    try {
      const { rows } = await pool.query(
        `
        WITH LatestInterview AS (
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
          WHERE api_sub.nmms_year = $4
        )
        SELECT
          api.applicant_id,
          api.student_name,
          inst.institute_name,
          exam.pp_exam_score,
          centre.pp_exam_centre_name,
          sj.juris_name AS state_name,
          dj.juris_name AS district_name,
          bj.juris_name AS block_name,
          COALESCE(li.interview_round, 0) AS current_max_round,
          COALESCE(li.status, 'None') AS latest_interview_status
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
        JOIN pp.jurisdiction sj 
          ON api.app_state = sj.juris_code
        JOIN pp.jurisdiction dj 
          ON api.district = dj.juris_code
        JOIN pp.jurisdiction bj 
          ON api.nmms_block = bj.juris_code
        WHERE
          LOWER(TRIM(sj.juris_name)) = LOWER(TRIM($1))
          AND LOWER(TRIM(dj.juris_name)) = LOWER(TRIM($2))
          AND LOWER(TRIM(bj.juris_name)) = LOWER(TRIM($3))
          AND api.nmms_year = $4
          AND exam.pp_exam_cleared = 'Y'
          AND exam.interview_required_yn = 'Y'
          AND (
            li.applicant_id IS NULL
            OR (
              li.status = 'Rescheduled'
              AND li.interview_result = 'next round'
              AND li.interview_round < 3
            )
          )
        ORDER BY api.student_name ASC;
        `,
        [stateName, districtName, blockName, nmmsYear]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching unassigned students by block:", error);
      throw error;
    }
  },

  // Fetches students eligible for reassignment by block.
  // The original query was missing the function signature and error handling.
  async getReassignableStudentsByBlock(stateName, districtName, blockName, nmmsYear) {
    try {
      const { rows } = await pool.query(
        `
        SELECT
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
        JOIN pp.applicant_exam ap
          ON ap.applicant_id = exam.applicant_id
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
          AND si.status = 'Scheduled'
          AND si.interview_result IS NULL
          AND si.interview_round = (
            SELECT MAX(sub_si.interview_round)
            FROM pp.student_interview sub_si
            JOIN pp.applicant_primary_info sub_api
              ON sub_si.applicant_id = sub_api.applicant_id
            WHERE sub_si.applicant_id = si.applicant_id
              AND sub_api.nmms_year = $4
          )
        ORDER BY api.student_name ASC;
        `,
        [stateName, districtName, blockName, nmmsYear]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching reassignable students by block:", error);
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
      console.error('Error fetching interviewers:', error);
      throw error;
    }
  },

  // Assigns students to an interviewer, handling new assignments and reassignments from 'Rescheduled' status.
  async assignStudents(applicantIds, interviewerId, nmmsYear) {
    const client = await pool.connect();
    const results = [];

    try {
      await client.query('BEGIN'); // Start transaction

      for (const applicantId of applicantIds) {
        // First, get the student's last interview details and check max rounds
        const lastInterviewQuery = `
          SELECT interview_round, status, interview_result
          FROM pp.student_interview
          WHERE applicant_id = $1
          ORDER BY interview_round DESC
          LIMIT 1;
        `;
        const lastInterviewRes = await client.query(lastInterviewQuery, [applicantId]);
        const lastInterview = lastInterviewRes.rows[0];

        let nextRound = 1;
        if (lastInterview) {
          // Check if max rounds (3) have been reached
          if (lastInterview.interview_round >= 3) {
            results.push({ applicantId, status: 'Skipped', reason: 'Max rounds reached (3 rounds completed).' });
            continue; // Skip to the next applicant
          }

          // Check if the last round was "Rescheduled" for the "next round"
          if (lastInterview.status !== 'Rescheduled' || lastInterview.interview_result !== 'next round') {
            results.push({ applicantId, status: 'Skipped', reason: 'Last interview status is not "Rescheduled" for next round.' });
            continue; // Skip to the next applicant
          }

          // If it passed the checks, calculate the next round number
          nextRound = lastInterview.interview_round + 1;
        }

        // Check if the student is already assigned to this specific interviewer
        const alreadyAssignedQuery = `
          SELECT 1
          FROM pp.student_interview
          WHERE applicant_id = $1 AND interviewer_id = $2;
        `;
        const alreadyAssignedRes = await client.query(alreadyAssignedQuery, [applicantId, interviewerId]);
        if (alreadyAssignedRes.rowCount > 0) {
          results.push({ applicantId, status: 'Skipped', reason: 'Already assigned to this interviewer in previous round.' });
          continue; // Skip to the next applicant
        }

        // If all checks pass, proceed with the actual insertion
        const insertQuery = `
          INSERT INTO pp.student_interview (interviewer_id, applicant_id, interview_round, status)
          SELECT
            $1,
            $2,
            $3,
            'Scheduled'
          FROM pp.applicant_primary_info api
          WHERE api.applicant_id = $2 AND api.nmms_year = $4
          RETURNING *;
        `;
        const insertRes = await client.query(insertQuery, [interviewerId, applicantId, nextRound, nmmsYear]);

        if (insertRes.rowCount > 0) {
          results.push({ applicantId, status: 'Assigned', interviewRound: insertRes.rows[0].interview_round });
        } else {
          // This case handles when the student's NMMS year doesn't match
          results.push({ applicantId, status: 'Skipped', reason: 'Student not found for the specified NMMS year.' });
        }
      }

      await client.query('COMMIT'); // Commit transaction
      return results;
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on error
      console.error('Error assigning students:', error);
      throw error;
    } finally {
      client.release(); // Release client back to pool
    }
  },

  // Fetches a list of students currently scheduled for an interview who can be reassigned
  async getReassignableStudents(centerName, nmmsYear) {
    try {
      const { rows } = await pool.query(
        `
        SELECT
          api.applicant_id,
          api.student_name,
          inst.institute_name,
          exam.pp_exam_score,
          centre.pp_exam_centre_name,
          si.interview_round,
          i.interviewer_name AS current_interviewer,
          si.interviewer_id as current_interviewer_id
        FROM pp.applicant_primary_info api
        JOIN pp.exam_results exam ON api.applicant_id = exam.applicant_id
        JOIN pp.applicant_exam ap ON ap.applicant_id = exam.applicant_id
        JOIN pp.examination e ON e.exam_id = ap.exam_id
        JOIN pp.pp_exam_centre centre ON e.pp_exam_centre_id = centre.pp_exam_centre_id
        LEFT JOIN pp.institute inst ON api.current_institute_dise_code = inst.dise_code
        JOIN pp.student_interview si ON api.applicant_id = si.applicant_id
        LEFT JOIN pp.interviewer i ON si.interviewer_id = i.interviewer_id
        WHERE
          centre.pp_exam_centre_name = $1
          AND api.nmms_year = $2
          AND exam.pp_exam_cleared = 'Y'
          AND exam.interview_required_yn = 'Y'
          AND si.status = 'Scheduled'
          AND si.interview_result IS NULL -- Only show if not yet completed/resulted
          AND si.interview_round = ( -- Get the latest scheduled round for this applicant for this NMMS year
            SELECT MAX(sub_si.interview_round)
            FROM pp.student_interview sub_si
            JOIN pp.applicant_primary_info sub_api ON sub_si.applicant_id = sub_api.applicant_id
            WHERE sub_si.applicant_id = si.applicant_id
              AND sub_api.nmms_year = $2 -- Crucial: filter by NMMS year for max round
          )
        ORDER BY api.student_name ASC;
        `,
        [centerName, nmmsYear]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching reassignable students:', error);
      throw error;
    }
  },

  // Reassigns students who are currently scheduled to a new interviewer.
  async reassignStudents(applicantIds, newInterviewerId, nmmsYear) {
    const client = await pool.connect();
    const results = [];

    try {
      await client.query('BEGIN'); // Start transaction

      // Ensure the newInterviewerId is a number for a correct comparison
      const numericNewInterviewerId = Number(newInterviewerId);
      if (isNaN(numericNewInterviewerId)) {
        throw new Error('Invalid newInterviewerId provided. Must be a number.');
      }

      for (const applicantId of applicantIds) {
        // The single UPDATE query performs all necessary checks in its WHERE clause.
        const updateRes = await client.query(
          `
          UPDATE pp.student_interview si
          SET interviewer_id = $1
          FROM pp.applicant_primary_info api
          WHERE
            si.applicant_id = $2
            AND api.applicant_id = si.applicant_id
            AND api.nmms_year = $3
            AND si.status = 'Scheduled'
            AND si.interview_result IS NULL
            AND si.interviewer_id IS DISTINCT FROM $1
            AND NOT EXISTS (
              SELECT 1
              FROM pp.student_interview si2
              WHERE
                si2.applicant_id = si.applicant_id
                AND si2.interviewer_id = $1
                AND si2.status IN ('Scheduled', 'Rescheduled')
                AND si2.interview_round <> si.interview_round
            )
          RETURNING si.interview_round, si.interviewer_id;
          `,
          [numericNewInterviewerId, applicantId, nmmsYear]
        );

        if (updateRes.rowCount > 0) {
          results.push({ applicantId, status: 'Reassigned', interviewRound: updateRes.rows[0].interview_round });
        } else {
          results.push({ applicantId, status: 'Skipped', reason: 'Reassignment conditions not met (e.g., same interviewer, no pending interview, or student not found).' });
        }
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error reassigning students:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Fetches a list of students assigned to a specific interviewer
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
          AND s.status = 'Scheduled'
          AND s.interview_result IS NULL;
        `,
        [interviewerName, nmmsYear]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching students by interviewer:', error);
      throw error;
    }
  },


  /**
   * Updates the student_interview table with the results of a completed interview.
   * @param {number} applicantId The ID of the student being interviewed.
   * @param {Object} interviewData An object containing all the interview details.
   * @returns {Object} The updated row or a status message.
   */
  async submitInterviewDetails(applicantId, interviewData) {
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
      interviewResult
    } = interviewData;

    try {
      // Convert the boolean `homeVerificationRequired` back to a 'Y' or 'N' string
      const homeVerificationYN = homeVerificationRequired ? 'Y' : 'N';

      const result = await pool.query(
        `
        UPDATE pp.student_interview
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
          interview_result = $10
        WHERE applicant_id = $11
          AND status = 'Scheduled'
          AND interview_result IS NULL
        RETURNING *;
        `,
        [
          interviewDate,
          interviewTime,
          interviewMode,
          interviewStatus,
          lifeGoalsAndZeal,
          commitmentToLearning,
          integrity,
          communicationSkills,
          homeVerificationYN,
          interviewResult,
          applicantId
        ]
      );

      if (result.rowCount === 0) {
        throw new Error('No scheduled interview found for this student to update.');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error submitting interview details:', error);
      throw error;
    }
  }
};

module.exports = InterviewModel;
