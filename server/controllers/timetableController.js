const pool = require("../config/db");



const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// ======================================================
//  GET ACTIVE COHORTS
// ======================================================
const getActiveCohorts = async (req, res) => {
    try {
        const query = `
            SELECT *
            FROM pp.cohort
            WHERE end_date IS NULL
            ORDER BY start_date DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching active cohorts:", error);
        res.status(500).json({ message: "Server error while fetching active cohorts." });
    }
};

// ======================================================
//  GET TIMETABLE BY BATCH — USING NEW DB STRUCTURE
// ======================================================
const getTimeTableByBatch = async (req, res) => {
    const { batchId } = req.params;

    if (!batchId) {
        return res.status(400).json({ message: "Batch ID is required." });
    }

    try {
        const query = `
            SELECT 
                tt.timetable_id AS id,
                tt.day_of_week,
                TO_CHAR(tt.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(tt.end_time, 'HH12:MI AM') AS time,

                c.classroom_id,
                c.classroom_name,

                s.subject_name AS subject,
                u.user_name AS teacher,
                p.platform_name AS platform

            FROM pp.timetable tt
            JOIN pp.classroom c ON c.classroom_id = tt.classroom_id
            JOIN pp.classroom_batch cb ON cb.classroom_id = c.classroom_id
            LEFT JOIN pp.subject s ON c.subject_id = s.subject_id
            LEFT JOIN pp.teacher t ON c.teacher_id = t.teacher_id
            LEFT JOIN pp.user u ON t.user_id = u.user_id
            LEFT JOIN pp.teaching_platform p ON c.platform_id = p.platform_id

            WHERE cb.batch_id = $1

            ORDER BY
                CASE UPPER(tt.day_of_week)
                    WHEN 'SUNDAY' THEN 1
                    WHEN 'MONDAY' THEN 2
                    WHEN 'TUESDAY' THEN 3
                    WHEN 'WEDNESDAY' THEN 4
                    WHEN 'THURSDAY' THEN 5
                    WHEN 'FRIDAY' THEN 6
                    WHEN 'SATURDAY' THEN 7
                END,
                tt.start_time;
        `;

        const { rows } = await pool.query(query, [batchId]);

        // Group timetable slots by day
        const timetable = rows.reduce((acc, slot) => {
            const day = slot.day_of_week;
            if (!acc[day]) acc[day] = [];
            acc[day].push(slot);
            return acc;
        }, {});

        res.status(200).json(timetable);

    } catch (error) {
        console.error("Error fetching timetable:", error);
        res.status(500).json({ message: "Server error while fetching timetable." });
    }
};

// ======================================================
//  ADD NEW TIMETABLE SLOT — NEW LOGIC (classroom + timetable)
// ======================================================
const addTimetableSlot = async (req, res) => {
    const { batchId, subjectId, teacherId, platformId, dayOfWeek, startTime, endTime } = req.body;

    if (!batchId || !dayOfWeek || !startTime) {
        return res.status(400).json({ message: "Batch, day, and start time are required." });
    }

    try {
        // 1. Create classroom
        const className = `AUTO-${subjectId}-${teacherId}-${platformId}`;
        const classroomRes = await pool.query(
            `INSERT INTO pp.classroom (classroom_name, subject_id, teacher_id, platform_id)
             VALUES ($1, $2, $3, $4)
             RETURNING classroom_id`,
            [className, subjectId, teacherId, platformId]
        );

        const classroomId = classroomRes.rows[0].classroom_id;

        // 2. Map classroom → batch
        await pool.query(
            `INSERT INTO pp.classroom_batch (classroom_id, batch_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [classroomId, batchId]
        );

        // 3. Add timetable entry
        const ttRes = await pool.query(
            `INSERT INTO pp.timetable (classroom_id, day_of_week, start_time, end_time)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [classroomId, dayOfWeek, startTime, endTime]
        );

        res.status(201).json({ message: "Timetable slot added successfully.", slot: ttRes.rows[0] });

    } catch (error) {
        console.error("Error adding timetable slot:", error);
        res.status(500).json({ message: "Server error while adding slot." });
    }
};

// ======================================================
//  UPDATE TIMETABLE SLOT
// ======================================================
const updateTimetableSlot = async (req, res) => {
    const { slotId } = req.params;
    const { subjectId, teacherId, platformId, dayOfWeek, startTime, endTime } = req.body;

    try {
        // 1. Fetch classroom
        const ttRes = await pool.query(
            `SELECT classroom_id FROM pp.timetable WHERE timetable_id = $1`,
            [slotId]
        );

        if (ttRes.rows.length === 0) {
            return res.status(404).json({ message: "Slot not found." });
        }

        const classroomId = ttRes.rows[0].classroom_id;

        // 2. Update classroom
        await pool.query(
            `UPDATE pp.classroom
             SET subject_id = $1, teacher_id = $2, platform_id = $3
             WHERE classroom_id = $4`,
            [subjectId, teacherId, platformId, classroomId]
        );

        // 3. Update timetable slot
        const updateRes = await pool.query(
            `UPDATE pp.timetable
             SET day_of_week = $1, start_time = $2, end_time = $3
             WHERE timetable_id = $4
             RETURNING *`,
            [dayOfWeek, startTime, endTime, slotId]
        );

        res.status(200).json({ message: "Timetable slot updated successfully.", slot: updateRes.rows[0] });

    } catch (error) {
        console.error("Error updating timetable slot:", error);
        res.status(500).json({ message: "Server error while updating slot." });
    }
};

// ======================================================
//  DELETE TIMETABLE SLOT
// ======================================================
const deleteTimetableSlot = async (req, res) => {
    const { slotId } = req.params;

    try {
        const result = await pool.query("DELETE FROM pp.timetable WHERE timetable_id = $1", [slotId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Slot not found." });
        }

        res.status(200).json({ message: "Timetable slot deleted successfully." });

    } catch (error) {
        console.error("Error deleting timetable slot:", error);
        res.status(500).json({ message: "Server error while deleting slot." });
    }
};

// ======================================================
//  SUBJECT API
// ======================================================
const getSubjects = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT subject_id, subject_name, subject_code
            FROM pp.subject
            ORDER BY subject_name
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ======================================================
//  TEACHER API (NEW TABLE)
// ======================================================
const getTeachers = async (req, res ) => {
    try {
        const { rows } = await pool.query(`
            SELECT teacher_id, user_name
            FROM pp.teacher, pp.user
            WHERE pp.teacher.user_id = pp.user.user_id
            ORDER BY user_name
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ======================================================
//  PLATFORM API (NEW TABLE: teaching_platform)
// ======================================================
const getPlatforms = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT platform_id, platform_name
            FROM pp.teaching_platform
            ORDER BY platform_name
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching platforms:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ======================================================
//  GET BATCHES OF COHORT
// ======================================================
const getBatchesByCohort = async (req, res) => {
    try {
        const { cohortId } = req.params;

        if (!cohortId) {
            return res.status(400).json({ error: "Cohort ID parameter is required" });
        }

        const result = await pool.query(
            `SELECT batch_id, batch_name
             FROM pp.batch
             WHERE cohort_number = $1
             ORDER BY batch_name`,
            [cohortId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching batches by cohort:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ======================================================
//  ADD SUBJECT / PLATFORM
// ======================================================
const addSubject = async (req, res) => {
    const { subject_name, subject_code } = req.body;
    if (!subject_name || !subject_code) {
        return res.status(400).json({ message: "Subject name and code are required." });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO pp.subject (subject_name, subject_code) VALUES ($1, $2) RETURNING *`,
            [subject_name, subject_code]
        );
        res.status(201).json({ message: "Subject added successfully.", subject: rows[0] });
    } catch (error) {
        console.error("Error adding subject:", error);
        res.status(500).json({ message: "Server error while adding subject." });
    }
};

const addPlatform = async (req, res) => {
    const { platform_name } = req.body;
    if (!platform_name) {
        return res.status(400).json({ message: "Platform name is required." });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO pp.teaching_platform (platform_name) VALUES ($1) RETURNING *`,
            [platform_name]
        );
        res.status(201).json({ message: "Platform added successfully.", platform: rows[0] });
    } catch (error) {
        console.error("Error adding platform:", error);
        res.status(500).json({ message: "Server error while adding platform." });
    }
};

// ======================================================
//  DELETE SUBJECT / PLATFORM
// ======================================================
const deleteSubject = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM pp.subject WHERE subject_id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Subject not found." });
        }
        res.status(200).json({ message: "Subject deleted successfully." });
    } catch (error) {
        console.error("Error deleting subject:", error);
        res.status(500).json({ message: "Server error while deleting subject." });
    }
};

const deletePlatform = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM pp.teaching_platform WHERE platform_id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Platform not found." });
        }
        res.status(200).json({ message: "Platform deleted successfully." });
    } catch (error) {
        console.error("Error deleting platform:", error);
        res.status(500).json({ message: "Server error while deleting platform." });
    }
};



//=====================my code==========================

const getSubjectsForTimeTable = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            
SELECT subject_id,subject_name,subject_code,CAST
(SUBSTRING(subject_code FROM '[0-9]+') AS INTEGER) AS grade,
SUBSTRING(subject_code FROM '[0-9]+')||'-'||subject_name AS grade_subject FROM pp.subject ORDER BY grade
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ message: "Server error." });
    }
};

const getTeachersForTimeTable = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            select teacher_id,teacher_name from pp.teacher t 
	order by teacher_id;
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ message: "Server error." });
    }
};



const getBatchesByGrades = async (req, res) => {

try {

    /* Grades coming from frontend */
    // Example: { grades:[9,10] }

    const grades = req.body.grades;

    if (!grades || grades.length === 0) {
        return res.json([]);
    }

    /* Convert grades array into placeholders */
    // [9,10] → $1,$2

    const placeholders = grades
        .map((_, i) => `$${i + 1}`)
        .join(",");

    /* Query */

    const query = `
    SELECT 
        'B' || 
        LPAD(c.current_grade::text, 2, '0') || 
        '-' || 
        LPAD(SPLIT_PART(b.batch_name, '-', 2), 2, '0') AS id,
        c.current_grade AS grade,
        b.medium
    FROM pp.batch b
    JOIN pp.cohort c
    ON c.cohort_number = b.cohort_number
    WHERE c.current_grade IN (${placeholders})
    ORDER BY id
    `;

    /* Execute query */

    const result = await pool.query(query, grades);

    /* Send response */
      res.json(result.rows);

}
catch (err) {

    console.log(err);
    res.status(500).send("Server Error");

}

};

const getBatchesByGradeMediumAndSubjectIds = async (req, res) => {
  try {
    const { grade, medium } = req.body; // single values

    if (!grade || !medium) {
      return res.status(400).json({ error: "Grade and medium are required" });
    }

    const query = `
      SELECT 
          'B' || 
          LPAD(c.current_grade::text, 2, '0') || 
          '-' || 
          LPAD(SPLIT_PART(b.batch_name, '-', 2), 2, '0') AS id,
          c.current_grade AS grade,
          b.medium
      FROM pp.batch b
      JOIN pp.cohort c
      ON c.cohort_number = b.cohort_number
      WHERE c.current_grade = $1
        AND b.medium = $2
      ORDER BY id
    `;
    const result = await pool.query(query, [grade, medium]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};



const getSubjectsByteacher = async (req, res) => {
  try {

    const teacherId = req.body.teacherId;
    const query = `
      SELECT 
        t.teacher_id,
        s.subject_name as subject,
        s.subject_id as subject_id,
        ts.medium,
        CAST(
            REGEXP_REPLACE(s.subject_code,'[^0-9]','','g')
            AS INTEGER
        ) AS grade
      FROM pp.teacher t
      JOIN pp.teacher_subject ts
        ON t.teacher_id = ts.teacher_id
      JOIN pp.subject s
        ON s.subject_id = ts.subject_id
      WHERE t.teacher_id = $1
      ORDER BY t.teacher_id
    `;

    const result = await pool.query(query, [teacherId]);

    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};


const getCanTeachByTeacherIds = async (req, res) => {

try {

    /* Teacher IDs from frontend */
    // Example: { teacherIds:[1,2,3] }

    let teacherIds = req.body.teacherIds || [];

    if(teacherIds.length === 0){
        return res.json([]);
    }

    /* Remove duplicates */

    teacherIds = [...new Set(teacherIds)];
    /* Create placeholders */
    // [1,2] → $1,$2

    const placeholders = teacherIds
        .map((_,i)=>`$${i+1}`)
        .join(",");

    /* Query */

    const query = `

    SELECT 
        t.teacher_id,
        s.subject_name as subject,
        ts.medium,

        CAST(
            REGEXP_REPLACE(s.subject_code,'[^0-9]','','g')
            AS INTEGER
        ) AS grade

    FROM pp.teacher t

    JOIN pp.teacher_subject ts
    ON t.teacher_id = ts.teacher_id

    JOIN pp.subject s
    ON s.subject_id = ts.subject_id

    WHERE t.teacher_id IN (${placeholders})

    ORDER BY t.teacher_id

    `;

    const result = await pool.query(query,teacherIds);
    res.json(result.rows);

}
catch(err){

console.log(err);
res.status(500).send("Server Error");

}

};




const getTeachersBySubjects = async (req, res) => {
  try {
    const subjectIds = req.body.subjectIds;
    if (!subjectIds || subjectIds.length === 0) {
      return res.json([]);
    }
    const placeholders = subjectIds.map((_, i) => `$${i + 1}`).join(",");
    const query = `
      SELECT 
        a.teacher_id,
        a.teacher_name
      FROM pp.teacher a
      JOIN pp.teacher_subject b 
        ON a.teacher_id = b.teacher_id
      WHERE b.subject_id IN (${placeholders})
      group by a.teacher_id,a.teacher_name 
      ORDER BY a.teacher_id`;
    const result = await pool.query(query, subjectIds);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};



const generateFinalOutputFromPython = async (req, res) => {
  try {
    
    const path = require("path");
    const { spawn } = require("child_process");
    const fs = require("fs");

    const pythonPath = "C:\\Users\\supri\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";

    //  STATIC input file
    console.log("file path is "+__dirname)
    //const inputFilePath = path.join(__dirname, "input_file.json");
    // Only finalJson
    const inputFilePath = path.join(__dirname, "input_file.json"); // <-- define it

    if (fs.existsSync(inputFilePath)) {
     fs.unlinkSync(inputFilePath);
     console.log("file deleted sucessfully")
    }

    fs.writeFileSync(inputFilePath, JSON.stringify(req.body, null, 2)); // only finalJson
    console.log("File Written Successfully");

    const scriptPath = path.join(__dirname, "tt.py");


    const pythonProcess = spawn(
    pythonPath,
    ["-u", scriptPath, inputFilePath],
    { cwd: __dirname }
    );

    console.log("Python PID:", pythonProcess.pid);
    console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::0")
    pythonProcess.stdout.on("data", (data) => {
      console.log("Python output:", data.toString());
    });
     
    console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::1")
    pythonProcess.stderr.on("data", (data) => {
        console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::2")
        
      console.log("Python error:", data.toString());
    });


    // ✅ ADD HERE
    pythonProcess.on("exit", (code) => {
    console.log("Python exited with code:", code);
    }); 
     
    console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::3")

    pythonProcess.on("close", (code) => {
        if(code === 0){
            const reportPath = path.join(__dirname,"report.txt");
            if(fs.existsSync(reportPath)){
                const reportContent = fs.readFileSync(reportPath,"utf8");
                fs.unlinkSync(reportPath);
                console.log("output file deleted sucessfully");
                res.json({type: "report",data: reportContent});
            }else {
                res.status(404).json({ error: "Report file not found" });
            }
        }else if (code === 1 ) {
            const outputPath = path.join(__dirname, "output.json");
            if (fs.existsSync(outputPath)) {
                const jsonData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
                    fs.unlinkSync(outputPath);
                    console.log("output file deleted sucessfully")
                res.json({type: "timetable",data: jsonData});
            }else {
                res.status(404).json({ error: "Output file not found" });
            }
        }    
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};



// Controller to save draft file and insert record
const saveConfigurationDraftFile = async (req, res) => {
  try {
    console.log("Saving draft...");
    const { userName, fileContent } = req.body;

    if (!userName || !fileContent) {
      return res.status(400).json({ message: "User name and file content are required" });
    }
console.log("111111");
    // Step 1: Fixed local server path
    const draftsDir = "C:\\Drafts"; // <-- folder on your local server
    console.log("Checking folder:", draftsDir);
console.log("Folder exists?", fs.existsSync(draftsDir));


    if (!fs.existsSync(draftsDir)) {
        console.log(">>>>>>>>>>>>>>>>>inside the folder")
      fs.mkdirSync(draftsDir, { recursive: true });
      console.log("Drafts folder created at:", draftsDir);
    }

    const fileName = `${userName}_configurationDraftFile.json`;
    const filePath = path.join(draftsDir, fileName);

    // Step 2: Save file
    fs.writeFile(filePath, fileContent, async (err) => {
      if (err) {
        console.error("Error saving file:", err);
        return res.status(500).json({ message: "Error saving file" });
      }

      console.log("Draft file saved:", filePath);

      // Step 3: Insert record in DB after file is saved
      const query = `
        INSERT INTO pp.config_file (config_file_name)
        VALUES ($1)
        RETURNING *;
      `;
      const values = [fileName];

      try {
        const result = await pool.query(query, values);
        return res.status(200).json({
          message: "Draft saved successfully!",
          data: result.rows[0],
        });
      } catch (dbErr) {
        console.error("Error inserting in DB:", dbErr);
        return res.status(500).json({ message: "Error saving to database" });
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getAllConfigurationDraftFileDtls = async (req, res) => {
  try {
    const query = `
      SELECT config_id,config_file_name,created_at,updated_at
        FROM pp.config_file
      ORDER BY updated_at DESC`;
    const result = await db.query(query); 
    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching configuration draft file details:", error);
    res.status(500).json({
      message: "Failed to fetch configuration draft files"
    });
  }
};



// ======================================================
//  EXPORTS
// ======================================================
module.exports = {
    getActiveCohorts, 
    getTimeTableByBatch,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,

    getSubjects,
    getSubjectsForTimeTable,
    getTeachersForTimeTable,
    getTeachers,
    getPlatforms,

    getBatchesByCohort,

    addSubject,
    addPlatform,
    deleteSubject,
    deletePlatform,
    getBatchesByGrades,
    getCanTeachByTeacherIds,
    generateFinalOutputFromPython,
    getSubjectsByteacher,
    getTeachersBySubjects,
    getBatchesByGradeMediumAndSubjectIds,
    saveConfigurationDraftFile,
    getAllConfigurationDraftFileDtls
};




