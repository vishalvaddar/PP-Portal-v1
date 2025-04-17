// bulkUploadController.js
const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const xlsx = require("xlsx");
const pool = require("../config/db");
const moment = require("moment");

// Enhanced validation rules
const validateField = (field, value, rowIndex) => {
  const errors = [];

  // Required fields
  const requiredFields = [
    'nmms_year', 'nmms_reg_number', 'student_name',
    'father_name', 'gender'
  ];

  if (requiredFields.includes(field) && (!value || value.toString().trim() === '')) {
    errors.push(`${field} is required`);
  }

  // Specific validations
  switch (field) {
    case 'nmms_year':
      if (value && isNaN(value)) errors.push('must be a number');
      else if (value && (value < 2020 || value > new Date().getFullYear())) {
        errors.push(`must be between 2020 and ${new Date().getFullYear()}`);
      }
      break;

    case 'nmms_reg_number':
      if (value && value.length < 5) errors.push('must be at least 5 characters');
      break;

    case 'gmat_score':
    case 'sat_score':
      if (value && isNaN(value)) errors.push('must be a number');
      else if (value && (value < 0 || value > 100)) {
        errors.push('must be between 0 and 100');
      }
      break;

    case 'contact_no1':
    case 'contact_no2':
      if (value && !/^\d{10}$/.test(value)) errors.push('must be 10 digits');
      break;

    case 'gender':
      if (value && !['M', 'F', 'O'].includes(value)) {
        errors.push('must be Male as M, Female as F, or Other as O');
      }
      break;

    case 'DOB':
      if (value) {
        const dob = moment(value, ["DD-MM-YYYY", "YYYY-MM-DD"], true);
        if (!dob.isValid()) errors.push('invalid date format (use DD-MM-YYYY or YYYY-MM-DD)');
        else if (dob.isAfter(moment().subtract(5, 'years'))) {
          errors.push('student must be at least 5 years old');
        }
      }
      break;

    case 'aadhaar':
      if (value && !/^\d{12}$/.test(value)) errors.push('must be 12 digits');
      break;
  }

  return errors.length > 0 ? {
    row: rowIndex + 1,
    field,
    value,
    message: errors.join(', ')
  } : null;
};

const sanitizeValue = (value, type = "text") => {
  if (value === undefined || value === null || value === "") {
    return type === "numeric" ? null : null;
  }
  return type === "numeric" ? Number(value) : value.toString().trim();
};

const sanitizeDate = (dateStr) => {
  if (!dateStr) return null;
  return moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"], true).isValid()
    ? moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")
    : null;
};

const validateAndSanitizeRow = (row, index) => {
  const errors = [];
  const sanitizedRow = {};

  for (const [field, value] of Object.entries(row)) {
    const error = validateField(field, value, index);
    if (error) errors.push(error);

    // Sanitize values
    if (field === 'DOB') {
      sanitizedRow[field] = sanitizeDate(value);
    } else if (['nmms_year', 'gmat_score', 'sat_score', 'current_institute_dise_code', 'previous_institute_dise_code', 'family_income_total'].includes(field)) {
      sanitizedRow[field] = sanitizeValue(value, 'numeric');
    } else {
      sanitizedRow[field] = sanitizeValue(value);
    }
  }

  return { row: sanitizedRow, errors };
};

const generateLogFile = (logData) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `upload_log_${timestamp}.txt`;
  const logFilePath = path.join(__dirname, '../logs', logFileName);

  // Ensure logs directory exists
  if (!fs.existsSync(path.join(__dirname, '../logs'))) {
    fs.mkdirSync(path.join(__dirname, '../logs'));
  }

  // Format the log data as text
  let logContent = `File Upload Log - ${new Date().toLocaleString()}\n`;
  logContent += '='.repeat(50) + '\n\n';

  logContent += `File Name: ${logData.fileName}\n`;
  logContent += `Upload Date: ${new Date(logData.uploadDate).toLocaleString()}\n`;
  logContent += `File Size: ${(logData.fileSize / 1024).toFixed(2)} KB\n`;
  logContent += `Status: ${logData.status.toUpperCase()}\n\n`;

  logContent += `Total Records: ${logData.totalRecords}\n`;
  logContent += `Valid Records: ${logData.validRecords}\n`;
  logContent += `Invalid Records: ${logData.invalidRecords}\n\n`;

  if (logData.insertedRecords.length > 0) {
    logContent += `Inserted Records (first 10): ${logData.insertedRecords.slice(0, 10).join(', ')}\n`;
    if (logData.insertedRecords.length > 10) {
      logContent += `(Total ${logData.insertedRecords.length} records inserted)\n`;
    }
    logContent += '\n';
  }

  if (logData.validationErrors.length > 0) {
    logContent += 'VALIDATION ERRORS:\n';
    logContent += '-'.repeat(50) + '\n';

    // Group errors by row for better readability
    const errorsByRow = {};
    logData.validationErrors.forEach(error => {
      if (!errorsByRow[error.row]) {
        errorsByRow[error.row] = [];
      }
      errorsByRow[error.row].push(error);
    });

    for (const [row, errors] of Object.entries(errorsByRow)) {
      logContent += `Row ${row}:\n`;
      errors.forEach(error => {
        logContent += `  - Field: ${error.field} (Value: ${error.value || 'empty'})\n`;
        logContent += `    Error: ${error.message}\n`;
      });
    }
    logContent += '\n';
  }

  if (logData.databaseErrors.length > 0) {
    logContent += 'DATABASE ERRORS:\n';
    logContent += '-'.repeat(50) + '\n';
    logData.databaseErrors.forEach(error => {
      logContent += `- ${error.message}\n`;
    });
    logContent += '\n';
  }

  logContent += `Processing Time: ${logData.processingTime}\n`;

  fs.writeFileSync(logFilePath, logContent);
  return logFileName;
};

const insertApplicants = async (validData, duplicateErrors) => {
  const query = `
    INSERT INTO pp.applicant_primary_info (
      nmms_year, nmms_reg_number, app_state, district, nmms_block,
      student_name, father_name, gmat_score, sat_score, contact_no1,
      contact_no2, current_institute_dise_code, previous_institute_dise_code, medium,
      home_address, family_income_total, mother_name, gender, aadhaar, DOB
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    ) RETURNING nmms_reg_number`;

  const insertedRecords = [];

  try {
    for (let row of validData) {
      const values = [
        row.nmms_year,
        row.nmms_reg_number,
        row.app_state,
        row.district,
        row.nmms_block,
        row.student_name,
        row.father_name,
        row.gmat_score,
        row.sat_score,
        row.contact_no1,
        row.contact_no2,
        row.current_institute_dise_code,
        row.previous_institute_dise_code,
        row.medium,
        row.home_address,
        row.family_income_total,
        row.mother_name,
        row.gender,
        row.aadhaar,
        row.DOB
      ];
      const result = await pool.query(query, values);
      insertedRecords.push(result.rows[0].nmms_reg_number);
    }
    return insertedRecords;
  } catch (error) {
    if (error.code === '23505') { // Unique violation error
      duplicateErrors.push(error.detail);
      return [];
    }
    throw new Error("Database insertion failed: " + error.message);
  }
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(
        Papa.parse(Papa.NODE_STREAM_INPUT, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => value.trim(),
        })
      )
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let parsedData = [];

  // Prepare log data structure
  const logData = {
    uploadDate: new Date().toISOString(),
    fileName: req.file.originalname,
    fileSize: req.file.size,
    status: 'processing',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    insertedRecords: [],
    validationErrors: [],
    databaseErrors: [],
    processingTime: null,
    startTime: new Date()
  };

  try {
    // Parse the file
    if (fileExt === ".csv") {
      parsedData = await parseCSV(filePath);
    } else if (fileExt === ".xlsx" || fileExt === ".xls") {
      parsedData = parseExcel(filePath);
    } else {
      logData.status = 'failed';
      logData.error = 'Unsupported file format';
      const logFileName = generateLogFile(logData);
      return res.status(400).json({
        message: "Unsupported file format",
        logFile: logFileName
      });
    }

    logData.totalRecords = parsedData.length;

    // Validate and sanitize all rows
    const validationResults = parsedData.map((row, index) =>
      validateAndSanitizeRow(row, index)
    );

    // Separate valid and invalid rows
    const validRows = [];
    const allErrors = [];

    validationResults.forEach((result) => {
      if (result.errors.length > 0) {
        allErrors.push(...result.errors);
      } else {
        validRows.push(result.row);
      }
    });

    logData.validRecords = validRows.length;
    logData.invalidRecords = allErrors.length;
    logData.validationErrors = allErrors;

    // Insert only valid rows
    if (validRows.length > 0) {
      try {
        const duplicateErrors = [];
        const insertedRecords = await insertApplicants(validRows, duplicateErrors);
        logData.insertedRecords = insertedRecords;
        logData.status = allErrors.length > 0 ? 'partial_success' : 'success';

        if (duplicateErrors.length > 0) {
          logData.databaseErrors.push(...duplicateErrors.map(error => ({ message: error })));
        }
      } catch (dbError) {
        logData.status = 'failed';
        logData.databaseErrors.push({
          message: dbError.message,
          stack: dbError.stack
        });
        throw dbError;
      }
    } else if (allErrors.length > 0) {
      logData.status = 'failed';
    }

    // Prepare response
    const response = {
      totalRecords: parsedData.length,
      validRecords: validRows.length,
      invalidRecords: parsedData.length - validRows.length,
      message: validRows.length === parsedData.length
        ? "All records processed successfully!"
        : `Processed with ${allErrors.length} validation errors.`,
    };

    if (allErrors.length > 0) {
      response.validationErrors = allErrors;
    }

    // Generate log file
    logData.processingTime = `${(new Date() - logData.startTime)}ms`;
    const logFileName = generateLogFile(logData);
    response.logFile = logFileName;

    res.status(allErrors.length > 0 ? 207 : 200).json(response);
  } catch (error) {
    logData.status = 'failed';
    logData.error = error.message;
    logData.processingTime = `${(new Date() - logData.startTime)}ms`;
    const logFileName = generateLogFile(logData);

    res.status(500).json({
      message: "Error processing file: " + error.message,
      logFile: logFileName
    });
  } finally {
    if (fs.existsSync(req.file?.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};

const downloadLogFile = (req, res) => {
  const logFileName = req.params.logFileName;
  const logFilePath = path.join(__dirname, '../logs', logFileName);

  if (!fs.existsSync(logFilePath)) {
    return res.status(404).json({ message: "Log file not found" });
  }

  res.setHeader('Content-Disposition', `attachment; filename=${logFileName}`);
  res.setHeader('Content-Type', 'application/octet-stream');

  fs.createReadStream(logFilePath).pipe(res);
};

module.exports = { uploadFile, downloadLogFile };