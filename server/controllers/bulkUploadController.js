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

  const requiredFields = [
    'nmms_year', 'nmms_reg_number', 'student_name', 'father_name', 'gender', 'gmat_score', 'sat_score',
  ];

  if (requiredFields.includes(field) && (!value || value.toString().trim() === '')) {
    errors.push(`${field} is required`);
  }

  // Specific validations
  switch (field) {
    case 'nmms_year':
      if (value && isNaN(value)) errors.push('must be a number');
      else if (value && (value < 2022|| value > new Date().getFullYear())) { // You updated the range here
        errors.push(`must be between 2022 and ${new Date().getFullYear()}`); // Checks the year range
      }
      break;

    case 'nmms_reg_number':
      if (value && value.length < 5) errors.push('must be at least 5 characters');
      break;

    case 'gmat_score':
    case 'sat_score':
      if (value && isNaN(value)) errors.push('must be a number');
      else if (value && (value < 0 || value > 91)) {
        errors.push('must be between 0 and 90');
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

  // Format the log data as text with user-friendly messages
  let logContent = `File Upload Summary - ${new Date().toLocaleString()}\n`;
  logContent += '='.repeat(50) + '\n\n';

  logContent += `File Name: ${logData.fileName}\n`;
  logContent += `Upload Date: ${new Date(logData.uploadDate).toLocaleString()}\n`;
  logContent += `File Size: ${(logData.fileSize / 1024).toFixed(2)} KB\n`;
  logContent += `Status: ${logData.status === 'success' ? 'SUCCESSFUL' : 'UNSUCCESSFUL'}\n\n`;

  logContent += `Total Records in File: ${logData.totalRecords}\n`;
  logContent += `Successfully Processed Records: ${logData.validRecords}\n`;
  logContent += `Records with Errors: ${logData.invalidRecords}\n`;
  logContent += `Records Not Added (Already Exist): ${logData.databaseErrors.length}\n\n`;

  if (logData.insertedRecords.length > 0) {
    logContent += `Successfully Added Registration Numbers (first 10): ${logData.insertedRecords.slice(0, 10).join(', ')}\n`;
    if (logData.insertedRecords.length > 10) {
      logContent += `(Total ${logData.insertedRecords.length} records successfully added)\n`;
    }
    logContent += '\n';
  }

  // User-friendly validation errors
  if (logData.validationErrors.length > 0) {
    logContent += 'RECORDS WITH DATA ISSUES:\n';
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
      logContent += `Row ${row} in your file has the following issues:\n`;
      errors.forEach(error => {
        // Get user-friendly field name
        const fieldName = getUserFriendlyFieldName(error.field);
        
        // Get user-friendly error message
        const errorMessage = getUserFriendlyErrorMessage(error.field, error.message);
        
        logContent += `  • ${fieldName}: ${errorMessage}\n`;
        logContent += `    You entered: ${error.value || '(empty)'}\n`;
      });
      logContent += '\n';
    }
  }

  // User-friendly database errors
  if (logData.databaseErrors.length > 0) {
    logContent += 'RECORDS THAT ALREADY EXIST:\n';
    logContent += '-'.repeat(50) + '\n';
    
    logData.databaseErrors.forEach(error => {
      const friendlyMessage = getUserFriendlyDatabaseError(error.message);
      logContent += `• ${friendlyMessage}\n`;
    });
    logContent += '\n';
  }

  // Add summary of rejected applications with user-friendly explanations
  const totalRejected = logData.invalidRecords + logData.databaseErrors.length;
  if (totalRejected > 0) {
    logContent += `SUMMARY: ${totalRejected} records could not be added\n`;
    logContent += '-'.repeat(50) + '\n';
    
    if (logData.validationErrors.length > 0) {
      logContent += `• ${logData.validationErrors.length} records have data issues that need to be fixed\n`;
    }
    
    if (logData.databaseErrors.length > 0) {
      logContent += `• ${logData.databaseErrors.length} records already exist in the system\n`;
    }
    
    // Add helpful tips
    logContent += '\nSUGGESTIONS TO FIX ISSUES:\n';
    if (logData.validationErrors.length > 0) {
      logContent += '1. Open your file and correct the issues mentioned above\n';
      logContent += '2. Make sure all required fields are filled in\n';
      logContent += '3. Check that dates, numbers and other values are in the correct format\n';
    }
    if (logData.databaseErrors.length > 0) {
      logContent += '4. For records that already exist, either remove them from your file\n';
      logContent += '   or use the "Update Existing Records" option if you want to update them\n';
    }
    logContent += '\n';
  }

  logContent += `Processing Time: ${logData.processingTime}\n`;

  fs.writeFileSync(logFilePath, logContent);
  return logFileName;
};

// Helper function to convert technical field names to user-friendly names
const getUserFriendlyFieldName = (fieldName) => {
  const fieldNameMap = {
    'nmms_year': 'NMMS Year',
    'nmms_reg_number': 'Registration Number',
    'student_name': 'Student Name',
    'father_name': 'Father\'s Name',
    'mother_name': 'Mother\'s Name',
    'gender': 'Gender',
    'DOB': 'Date of Birth',
    'aadhaar': 'Aadhaar Number',
    'gmat_score': 'GMAT Score',
    'sat_score': 'SAT Score',
    'contact_no1': 'Primary Contact Number',
    'contact_no2': 'Secondary Contact Number',
    'current_institute_dise_code': 'Current School Code',
    'previous_institute_dise_code': 'Previous School Code',
    'family_income_total': 'Family Income',
    'home_address': 'Home Address',
    'app_state': 'State',
    'district': 'District',
    'nmms_block': 'NMMS Block',
    'medium': 'Medium of Instruction'
  };
  
  return fieldNameMap[fieldName] || fieldName;
};

// Helper function to convert technical error messages to user-friendly ones
const getUserFriendlyErrorMessage = (field, errorMessage) => {
  // Handle required field errors
  if (errorMessage.includes('is required')) {
    return 'This information is required and cannot be left blank';
  }
  
  // Handle specific field errors with user-friendly messages
  switch (field) {
    case 'nmms_year':
      if (errorMessage.includes('must be a number')) {
        return 'Please enter a valid year (numbers only)';
      } else if (errorMessage.includes('must be between')) {
        return `Please enter a year between 2020 and ${new Date().getFullYear()}`;
      }
      break;
      
    case 'nmms_reg_number':
      if (errorMessage.includes('must be at least 5 characters')) {
        return 'Registration number must be at least 5 characters long';
      }
      break;
      
    case 'gmat_score':
    case 'sat_score':
      if (errorMessage.includes('must be a number')) {
        return 'Please enter a valid score (numbers only)';
      } else if (errorMessage.includes('must be between')) {
        return 'Score must be between 0 and 90';
      }
      break;
      
    case 'contact_no1':
    case 'contact_no2':
      if (errorMessage.includes('must be 10 digits')) {
        return 'Please enter a valid 10-digit phone number';
      }
      break;
      
    case 'gender':
      if (errorMessage.includes('must be Male as M')) {
        return 'Please enter M for Male, F for Female, or O for Other';
      }
      break;
      
    case 'DOB':
      if (errorMessage.includes('invalid date format')) {
        return 'Please enter date in DD-MM-YYYY format (e.g., 15-06-2010)';
      } else if (errorMessage.includes('must be at least 5 years old')) {
        return 'Student must be at least 5 years old';
      }
      break;
      
    case 'aadhaar':
      if (errorMessage.includes('must be 12 digits')) {
        return 'Please enter a valid 12-digit Aadhaar number';
      }
      break;
  }
  
  // Return the original message if no specific user-friendly message is defined
  return errorMessage;
};

// Helper function to convert database error messages to user-friendly ones
const getUserFriendlyDatabaseError = (errorMessage) => {
  if (errorMessage.includes('already exists')) {
    // Extract the registration number from the error message
    const regNumberMatch = errorMessage.match(/nmms_reg_number\s+([^\s]+)\s+already exists/);
    if (regNumberMatch && regNumberMatch[1]) {
      return `Registration Number ${regNumberMatch[1]} already exists in the system`;
    }
    
    // Try another pattern if the first one doesn't match
    const keyMatch = errorMessage.match(/Key\s+\(([^)]+)\)=\(([^)]+)\)/);
    if (keyMatch && keyMatch[2]) {
      return `Registration Number ${keyMatch[2]} already exists in the system`;
    }
    
    return 'This registration number already exists in the system';
  }
  
  if (errorMessage.includes('null value in column "nmms_reg_number"')) {
    return 'Registration Number is missing. This is a required field.';
  }
  
  // Default user-friendly message for other database errors
  return 'This record could not be added because it conflicts with existing data';
};

const insertApplicants = async (validData, duplicateErrors) => {
  const client = await pool.connect();
  const insertedRecords = [];

  try {
    await client.query('BEGIN');

    const primaryQuery = `
      INSERT INTO pp.applicant_primary_info (
        nmms_year, nmms_reg_number, app_state, district, nmms_block,
        student_name, father_name, gmat_score, sat_score, contact_no1,
        contact_no2, current_institute_dise_code, previous_institute_dise_code, medium,
        home_address, family_income_total, mother_name, gender, aadhaar, DOB
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING applicant_id, nmms_reg_number`;

    for (let row of validData) {
      // Check if nmms_reg_number already exists
      const checkQuery = `
        SELECT nmms_reg_number FROM pp.applicant_primary_info
        WHERE nmms_reg_number = $1
      `;
      const checkResult = await client.query(checkQuery, [row.nmms_reg_number]);

      if (checkResult.rows.length > 0) {
        // Log the duplicate entry
        duplicateErrors.push(`nmms_reg_number ${row.nmms_reg_number} already exists.`);
        continue; // Skip insertion for this row
      }

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
      const result = await client.query(primaryQuery, values);
      const { applicant_id, nmms_reg_number } = result.rows[0];

      // Insert into secondary_info
      await client.query(
        `INSERT INTO pp.applicant_secondary_info (applicant_id) VALUES ($1)`,
        [applicant_id]
      );

      insertedRecords.push(nmms_reg_number);
    }

    await client.query('COMMIT');
    return insertedRecords;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') { // Unique violation error
      duplicateErrors.push(error.detail);
      return [];
    }
    throw new Error("Database insertion failed: " + error.message);
  } finally {
    client.release();
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
  // Ensure headers are treated as strings if needed, though sheet_to_json usually handles this.
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }); // Use defval to handle empty cells
};

// Helper function to normalize object keys to lowercase
const normalizeKeys = (obj) => {
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key.toLowerCase().trim()] = obj[key]; // Convert key to lowercase and trim whitespace
    }
  }
  return newObj;
};


const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let rawParsedData = []; // Rename to indicate it's pre-normalization

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
      rawParsedData = await parseCSV(filePath);
    } else if (fileExt === ".xlsx" || fileExt === ".xls") {
      rawParsedData = parseExcel(filePath);
    } else {
      logData.status = 'failed';
      logData.error = 'Unsupported file format';
      const logFileName = generateLogFile(logData);
      return res.status(400).json({
        message: "Unsupported file format",
        logFile: logFileName
      });
    }

    // ---> Normalize keys after parsing <---
    const parsedData = rawParsedData.map(normalizeKeys);

    logData.totalRecords = parsedData.length;
    if (parsedData.length === 0) {
        // Handle empty file case
        logData.status = 'failed';
        logData.error = 'The uploaded file is empty or contains no data rows.';
        const logFileName = generateLogFile(logData);
        return res.status(400).json({ message: logData.error, logFile: logFileName });
    }


    // Validate and sanitize all rows using the normalized data
    const validationResults = parsedData.map((row, index) =>
      validateAndSanitizeRow(row, index) // This function now receives rows with lowercase keys
    );

    // Separate valid and invalid rows
    const validRows = [];
    const allErrors = [];

    validationResults.forEach((result) => {
      if (result.errors.length > 0) {
        // Add the original row data (with original headers) to the error for context if needed
        // result.errors.forEach(e => e.originalRowData = rawParsedData[e.row - 1]); // Optional: for logging
        allErrors.push(...result.errors);
      } else {
        validRows.push(result.row); // result.row already has sanitized values with lowercase keys
      }
    });

    logData.validRecords = validRows.length;
    // Correct calculation for invalid records based on unique rows with errors
    const invalidRecordRows = new Set(allErrors.map(e => e.row));
    logData.invalidRecords = invalidRecordRows.size;
    logData.validationErrors = allErrors;


    // Insert only valid rows
    let insertedRecordsCount = 0;
    const duplicateErrors = []; // Define duplicateErrors here

    if (validRows.length > 0) {
      try {
        // Pass duplicateErrors array to insertApplicants
        const insertedRegNumbers = await insertApplicants(validRows, duplicateErrors);
        logData.insertedRecords = insertedRegNumbers;
        insertedRecordsCount = insertedRegNumbers.length;
        // Update status based on errors and insertions
        if (allErrors.length === 0 && duplicateErrors.length === 0) {
            logData.status = 'success';
        } else {
            logData.status = 'partial_success';
        }

        // Add duplicate errors found during insertion to logData.databaseErrors
        if (duplicateErrors.length > 0) {
          logData.databaseErrors.push(...duplicateErrors.map(errorMsg => ({ message: errorMsg })));
        }

      } catch (dbError) {
        console.error("Database insertion error:", dbError); // Log the actual error
        logData.status = 'failed';
        // Ensure dbError.message is captured, provide a fallback
        const errorMessage = dbError.message || "An unknown database error occurred during insertion.";
        logData.databaseErrors.push({
          message: errorMessage,
          // stack: dbError.stack // Optionally include stack trace for detailed debugging
        });
         // Don't re-throw here, let the finally block handle logging and response
      }
    } else if (allErrors.length > 0) {
       logData.status = 'failed'; // Failed if no valid rows and there were errors
    } else {
       logData.status = 'success'; // Success if no valid rows and no errors (e.g., empty file handled earlier)
    }

    // Prepare response
    const totalRejected = logData.invalidRecords + logData.databaseErrors.length;
    const response = {
      totalRecords: logData.totalRecords,
      validRecords: logData.validRecords, // Rows that passed initial validation
      invalidRecords: logData.invalidRecords, // Rows that failed initial validation
      duplicateRecords: logData.databaseErrors.filter(e => e.message.includes('already exists')).length, // Count specific duplicate errors
      submittedApplications: insertedRecordsCount, // Actual count of inserted records
      rejectedApplications: totalRejected, // Sum of validation failures and DB rejections
      message: "", // We'll set this based on the outcome
    };

     // Determine the final message
    if (logData.status === 'success') {
        response.message = `✅ ${insertedRecordsCount} records processed and added successfully!`;
    } else if (logData.status === 'partial_success') {
        response.message = `⚠ Processed ${logData.totalRecords} records. ${insertedRecordsCount} added, ${logData.invalidRecords} had validation errors, ${response.duplicateRecords} were duplicates. Check log file for details.`;
    } else { // status === 'failed'
        if (logData.totalRecords === 0) {
             response.message = `❌ Upload failed. The file appears to be empty.`;
        } else if (logData.validRecords === 0 && logData.invalidRecords > 0) {
             response.message = `❌ Upload failed. All ${logData.totalRecords} records had validation errors. Check log file.`;
        } else {
             response.message = `❌ Upload failed due to errors. ${insertedRecordsCount} records added before failure. Check log file for details.`;
        }
    }


    if (logData.validationErrors.length > 0) {
      response.validationErrors = logData.validationErrors;
    }

    // Generate log file
    logData.processingTime = `${(new Date() - logData.startTime)}ms`;
    const logFileName = generateLogFile(logData);
    response.logFile = logFileName;

    // Determine status code: 200 for full success, 207 for partial, 400/500 for failures
    let statusCode = 500; // Default to server error
    if (logData.status === 'success') {
        statusCode = 200;
    } else if (logData.status === 'partial_success') {
        statusCode = 207; // Multi-Status
    } else { // failed
        // Use 400 for client-side errors (validation, empty file), 500 for server-side (DB errors)
        statusCode = (logData.databaseErrors.length > 0 && !logData.databaseErrors.some(e => e.message.includes('already exists'))) ? 500 : 400;
    }


    res.status(statusCode).json(response);

  } catch (error) {
    console.error("Unhandled error during file upload:", error); // Log unexpected errors
    logData.status = 'failed';
    logData.error = error.message || "An unexpected server error occurred.";
    logData.processingTime = `${(new Date() - logData.startTime)}ms`;
    // Attempt to generate log even on unexpected error
    let logFileName = null;
    try {
        logFileName = generateLogFile(logData);
    } catch (logError) {
        console.error("Failed to generate log file after error:", logError);
    }


    res.status(500).json({
      message: "Error processing file: " + (error.message || "Unexpected server error"),
      logFile: logFileName
    });
  } finally {
    // Ensure file is deleted even if errors occur
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp upload file:", err);
      });
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