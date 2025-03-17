const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const xlsx = require("xlsx");
const pool = require("../config/db");

// Database insertion function
const insertApplicants = async (data) => {
  const query = `
    INSERT INTO pp.applicant (
      nmms_year, nmms_reg_number, app_state, nmms_district, nmms_block, 
      student_name, father_name, gmat_score, sat_score, contact_no1, 
      contact_no2, current_institute, previous_institute, medium, 
      home_address, family_income, mother_name, gender, aadhaar, DOB
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    )
  `;

  try {
    for (let row of data) {
      const values = [
        row.nmms_year, row.nmms_reg_number, row.app_state, row.nmms_district, row.nmms_block,
        row.student_name, row.father_name, row.gmat_score, row.sat_score, row.contact_no1,
        row.contact_no2, row.current_institute, row.previous_institute, row.medium,
        row.home_address, row.family_income, row.mother_name, row.gender, row.aadhaar, row.DOB
      ];
      await pool.query(query, values);
    }
  } catch (error) {
    throw new Error("Database insertion failed: " + error.message);
  }
};

// Function to parse CSV
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }))
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

// Function to parse Excel
const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return data;
};

// Main file upload function
const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let parsedData = [];

  try {
    if (fileExt === ".csv") {
      parsedData = await parseCSV(filePath);
    } else if (fileExt === ".xlsx" || fileExt === ".xls") {
      parsedData = parseExcel(filePath);
    } else {
      return res.status(400).json({ message: "Unsupported file format" });
    }

    await insertApplicants(parsedData);
    res.json({ message: "File uploaded and data inserted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error processing file: " + error.message });
  } finally {
    fs.unlinkSync(filePath); // Delete the file after processing
  }
};

module.exports = { uploadFile };
