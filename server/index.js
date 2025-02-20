require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 5000;

// ✅ PostgreSQL Connection Setup
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "dummydb",
  password: process.env.DB_PASSWORD || "123",
  port: process.env.DB_PORT || 5432,
});

// ✅ Middleware
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], credentials: true }));
app.use(express.json());

// ✅ Ensure Database Connection
pool.connect()
  .then(() => {
    console.log("✅ Connected to PostgreSQL successfully!");
    createTable();
    app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

// ✅ Ensure Table Exists
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS student (
      id SERIAL PRIMARY KEY,
      nmms_reg_number VARCHAR(50) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      medium VARCHAR(10) NOT NULL,
      parent_no VARCHAR(15),
      school_hm_no VARCHAR(15),
      school_name VARCHAR(100),
      school_type VARCHAR(50),
      district_name VARCHAR(50),
      block_name VARCHAR(50),
      gmat_score INT CHECK (gmat_score >= 0) NOT NULL,
      sat_score INT CHECK (sat_score >= 0) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Table checked/created successfully.");
  } catch (error) {
    console.error("❌ Error creating table:", error);
  }
};

// 🔹 Fetch all students
app.get("/student", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM student ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "❌ Server error", error: err });
  }
});

// 🔹 Add a New Student
app.post("/student", async (req, res) => {
  const {
    nmms_reg_number,
    student_name,
    medium,
    parent_no,
    school_hm_no,
    school_name,
    school_type,
    district_name,
    block_name,
    gmat_score,
    sat_score,
  } = req.body;

  const query = `
    INSERT INTO student 
    (nmms_reg_number, student_name, medium, parent_no, school_hm_no, school_name, school_type, district_name, block_name, gmat_score, sat_score) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      nmms_reg_number,
      student_name,
      medium,
      parent_no,
      school_hm_no,
      school_name,
      school_type,
      district_name,
      block_name,
      gmat_score,
      sat_score,
    ]);

    res.status(201).json({
      message: "✅ Student added successfully!",
      student: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error adding student:", error);
    res.status(500).json({ message: "❌ Error adding student" });
  }
});

// 🔹 Delete Student
app.delete("/student/:id", async (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM student WHERE id = $1 RETURNING *;`;

  try {
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "❌ Student not found" });
    }

    res.status(200).json({
      message: "✅ Student deleted successfully!",
      deletedStudent: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error deleting student:", error);
    res.status(500).json({ message: "❌ Error deleting student" });
  }
});

// 🔹 Update Student Details
// 🔹 Update Student Details
app.put("/student/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Validate that at least one field is provided
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "❌ No fields provided for update" });
  }

  const fields = Object.keys(updates);
  const values = Object.values(updates);

  try {
    // Build dynamic SQL query
    const setClause = fields.map((field, index) => `"${field}" = $${index + 1}`).join(", ");
    const query = `UPDATE student SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *;`;

    // Execute query with provided values
    const result = await pool.query(query, [...values, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "❌ Student not found" });
    }

    res.status(200).json({
      message: "✅ Student updated successfully!",
      updatedStudent: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating student:", error);
    res.status(500).json({ message: "❌ Error updating student", error });
  }
});


// ✅ GET a single student by ID
app.get("/student/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM student WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "❌ Student not found" });
    }
    res.json(result.rows[0]); // Return single student
  } catch (err) {
    console.error("❌ Error fetching student:", err);
    res.status(500).json({ message: "❌ Server error", error: err });
  }
});

// 🔹 Upload CSV and Fetch All Students
const upload = multer({ dest: "uploads/" }); // Multer configuration

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "❌ No file uploaded" });
  }

  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      results.push(row);
    })
    .on("end", async () => {
      try {
        for (const row of results) {
          await pool.query(
            `INSERT INTO student 
            (nmms_reg_number, student_name, medium, parent_no, school_hm_no, school_name, school_type, district_name, block_name, gmat_score, sat_score) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
            [
              row.nmms_reg_number,
              row.student_name,
              row.medium,
              row.parent_no,
              row.school_hm_no,
              row.school_name,
              row.school_type,
              row.district_name,
              row.block_name,
              parseInt(row.gmat_score),
              parseInt(row.sat_score),
            ]
          );
        }
        fs.unlinkSync(filePath); // Delete file after processing

        // Fetch all students after successful upload
        const studentsResult = await pool.query("SELECT * FROM student ORDER BY id ASC");
        res.status(200).json({ 
          message: "✅ File uploaded and data inserted successfully!", 
          students: studentsResult.rows 
        });
      } catch (error) {
        console.error("❌ Error inserting data:", error);
        res.status(500).json({ message: "❌ Error inserting data into database" });
      }
    });
});
