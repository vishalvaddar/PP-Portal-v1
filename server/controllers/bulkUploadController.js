// bulkUploadController.js
const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const xlsx = require("xlsx");
const pool = require("../config/db");
const moment = require("moment");

// Enhanced validation rules
const validateField = (field, value, rowIndex) => {
  const currentYear = new Date().getFullYear();
  const errors = [];

  const requiredFields = [
    'nmms_year', 'nmms_reg_number', 'student_name', 'father_name', 'gender', 'gmat_score', 'sat_score',
  ];

  if (requiredFields.includes(field) && (value === null || value === undefined || value.toString().trim() === '')) {
    errors.push(`This field is required.`);
  }

  // Specific validations
  switch (field) {
    case 'nmms_year':
      if (value && isNaN(value)) {
          errors.push('Must be a number.');
      } else if (value && (parseInt(value, 10) !== currentYear)) {
        errors.push(`Year must be the current year: ${currentYear}.`);
      }
      break;

    case 'nmms_reg_number':
      if (value && !/^\d{11}$/.test(value)) errors.push('Must be exactly 11 digits.');
      break;

    case 'gmat_score':
    case 'sat_score':
      if (value && isNaN(value)) errors.push('Must be a number.');
      else if (value && (value <= 0 || value >= 90)) {
        errors.push('Score must be between 0 and 90.');
      }
      break;

    case 'contact_no1':
    case 'contact_no2':
      if (value && !/^\d{10}$/.test(value)) errors.push('Must be a 10-digit phone number.');
      break;

    // case 'current_institute_dise_code':
    // case 'previous_institute_dise_code':
    //   if (value && !/^\d{11}$/.test(value)) errors.push('Must be an 11-digit DISE code.');
    //   break;

    case 'gender':
      if (value && !['M', 'F', 'O'].includes(value.toUpperCase())) {
        errors.push('Must be M for Male, F for Female, or O for Other.');
      }
      break;

    case 'DOB':
      if (value) {
        const dob = moment(value, ["DD-MM-YYYY", "YYYY-MM-DD"], true);
        if (!dob.isValid()) errors.push('Invalid date format. Please use DD-MM-YYYY or YYYY-MM-DD.');
        else if (dob.isAfter(moment().subtract(5, 'years'))) {
          errors.push('Student must be at least 5 years old.');
        }
      }
      break;

    case 'aadhaar':
      if (value && !/^\d{12}$/.test(value)) errors.push('Must be a 12-digit Aadhaar number.');
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
    return null;
  }
  if (type === 'gender') {
      return value.toString().trim().toUpperCase();
  }
  return type === "numeric" ? Number(value) : value.toString().trim();
};

const sanitizeDate = (dateStr) => {
  if (!dateStr) return null;
  const validFormats = ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"];
  const momentDate = moment(dateStr, validFormats, true);
  return momentDate.isValid() ? momentDate.format("YYYY-MM-DD") : null;
};

const validateAndSanitizeRow = (row, index) => {
  const errors = [];
  const sanitizedRow = {};

  const numericFields = ['nmms_year', 'gmat_score', 'sat_score', 'family_income_total'];

  // Add original row index for better error reporting
  sanitizedRow.originalRowIndex = index;

  for (const [field, value] of Object.entries(row)) {
    const error = validateField(field, value, index);
    if (error) errors.push(error);

    if (field.toLowerCase() === 'dob') {
        sanitizedRow[field] = sanitizeDate(value);
    } else if (numericFields.includes(field)) {
        sanitizedRow[field] = sanitizeValue(value, 'numeric');
    } else if (field.toLowerCase() === 'gender') {
        sanitizedRow[field] = sanitizeValue(value, 'gender');
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

  if (!fs.existsSync(path.join(__dirname, '../logs'))) {
    fs.mkdirSync(path.join(__dirname, '../logs'));
  }

  let logContent = `File Upload Summary - ${new Date().toLocaleString()}\n`;
  logContent += '==================================================\n\n';

  logContent += `File Name: ${logData.fileName}\n`;
  logContent += `Upload Date: ${new Date(logData.uploadDate).toLocaleString()}\n`;
  logContent += `File Size: ${(logData.fileSize / 1024).toFixed(2)} KB\n`;
  logContent += `Status: ${logData.status.toUpperCase()}\n\n`;

  logContent += `Total Records in File: ${logData.totalRecords}\n`;
  logContent += `Successfully Processed Records: ${logData.insertedRecords.length}\n`;
  logContent += `Records with Validation Errors: ${logData.invalidRecords}\n`;
  logContent += `Records Not Added (DB Errors): ${logData.databaseErrors.length}\n\n`;

  // *** NEW: Section for successfully processed records ***
  if (logData.successfulRows && logData.successfulRows.length > 0) {
    logContent += 'SUCCESSFULLY PROCESSED RECORDS:\n';
    logContent += '--------------------------------------------------\n';
    logData.successfulRows.forEach(record => {
        logContent += `• Row ${record.originalRowIndex + 1}: Successfully added ${record.student_name} (Reg #: ${record.nmms_reg_number})\n`;
    });
    logContent += '\n';
  }

  if (logData.validationErrors.length > 0) {
    logContent += 'RECORDS WITH DATA ISSUES:\n';
    logContent += '--------------------------------------------------\n';
    const errorsByRow = {};
    logData.validationErrors.forEach(error => {
      if (!errorsByRow[error.row]) errorsByRow[error.row] = [];
      errorsByRow[error.row].push(error);
    });
    for (const [row, errors] of Object.entries(errorsByRow)) {
      logContent += `Row ${row} in your file has the following issues:\n`;
      errors.forEach(error => {
        const fieldName = getUserFriendlyFieldName(error.field);
        logContent += `  • ${fieldName}: ${error.message}\n`;
        logContent += `    You entered: '${error.value || '(empty)'}'\n`;
      });
      logContent += '\n';
    }
  }

  if (logData.databaseErrors.length > 0) {
    logContent += 'RECORDS THAT FAILED TO SAVE TO DATABASE:\n';
    logContent += '--------------------------------------------------\n';
    logData.databaseErrors.forEach(error => {
      logContent += `• ${error.message}\n`;
    });
    logContent += '\n';
  }

  const totalRejected = logData.invalidRecords + logData.databaseErrors.length;
  if (totalRejected > 0) {
      logContent += 'SUGGESTIONS TO FIX ISSUES:\n';
      logContent += '--------------------------------------------------\n';
      if (logData.invalidRecords > 0) {
          logContent += '1. For "Records with Data Issues", please open your file and correct the specific rows and fields mentioned above.\n';
      }
      if (logData.databaseErrors.length > 0) {
          logContent += '2. For records that failed to save, check the error details. If a record "already exists," you must either remove it from your file or update it manually in the system. If a location was "not found", check for spelling errors.\n';
      }
      logContent += '\n';
  }

  logContent += `Processing Time: ${logData.processingTime}\n`;

  if (logData.criticalError) {
      logContent += '\nCRITICAL SERVER ERROR:\n';
      logContent += '==================================================\n';
      logContent += logData.criticalError.message || 'An unknown error occurred.';
      if (logData.criticalError.stack) {
          logContent += `\nStack Trace: ${logData.criticalError.stack}`;
      }
  }

  fs.writeFileSync(logFilePath, logContent);
  return logFileName;
};

const getUserFriendlyFieldName = (fieldName) => {
    const fieldNameMap = { 'nmms_year': 'NMMS Year', 'nmms_reg_number': 'Registration Number', 'student_name': 'Student Name', 'father_name': 'Father\'s Name', 'mother_name': 'Mother\'s Name', 'gender': 'Gender', 'DOB': 'Date of Birth', 'aadhaar': 'Aadhaar Number', 'gmat_score': 'GMAT Score', 'sat_score': 'SAT Score', 'contact_no1': 'Primary Contact Number', 'contact_no2': 'Secondary Contact Number', 'current_institute_dise_code': 'Current School Code', 'previous_institute_dise_code': 'Previous School Code', 'family_income_total': 'Family Income', 'home_address': 'Home Address', 'app_state': 'State', 'district': 'District', 'nmms_block': 'NMMS Block', 'medium': 'Medium of Instruction' };
    return fieldNameMap[fieldName] || fieldName;
};

const insertApplicants = async (validData, databaseErrors) => {
  const client = await pool.connect();
  const insertedRecords = [];

  const getJurisdictionIdByName = async (jurisName, jurisType, parentId = null) => {
    if (!jurisName) {
        throw new Error(`Jurisdiction name for type '${jurisType}' is missing.`);
    }
    const cleanName = jurisName.trim().replace(/[.,]+$/, '').toUpperCase();
    let queryText = `SELECT juris_code FROM pp.jurisdiction WHERE juris_name ILIKE $1 AND juris_type = $2`;
    const values = [cleanName, jurisType];

    if (parentId) {
      queryText += ` AND parent_juris = $3`;
      values.push(parentId);
    }

    const result = await client.query(queryText, values);
    if (result.rows.length === 0) {
      let errorMsg = `Location Not Found: Could not find a ${jurisType} named '${jurisName}'. Please check for spelling errors.`;
      if (parentId) {
          errorMsg += ` within the specified parent region.`;
      }
      throw new Error(errorMsg);
    }
    return result.rows[0].juris_code;
  };

  try {
    for (const row of validData) {
      try {
        await client.query("BEGIN");

        const checkResult = await client.query(
          `SELECT 1 FROM pp.applicant_primary_info WHERE nmms_reg_number = $1`,
          [row.nmms_reg_number]
        );

        if (checkResult.rows.length > 0) {
          throw new Error(`Duplicate Record: Registration Number ${row.nmms_reg_number} already exists.`);
        }

        const appStateId = await getJurisdictionIdByName(row.app_state, "STATE");
        const districtId = await getJurisdictionIdByName(row.district, "EDUCATION DISTRICT", appStateId);
        const blockId = await getJurisdictionIdByName(row.nmms_block, "BLOCK", districtId);

        const primaryQuery = `
          INSERT INTO pp.applicant_primary_info (
            nmms_year, nmms_reg_number, app_state, district, nmms_block,
            student_name, father_name, gmat_score, sat_score, contact_no1,
            contact_no2, current_institute_dise_code, previous_institute_dise_code, medium,
            home_address, family_income_total, mother_name, gender, aadhaar, DOB
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          ) RETURNING applicant_id, nmms_reg_number
        `;
        
        const values = [
          row.nmms_year, row.nmms_reg_number, appStateId, districtId, blockId,
          row.student_name, row.father_name, row.gmat_score, row.sat_score,
          row.contact_no1, row.contact_no2, row.current_institute_dise_code,
          row.previous_institute_dise_code, row.medium, row.home_address,
          row.family_income_total, row.mother_name, row.gender, row.aadhaar, row.DOB,
        ];

        const result = await client.query(primaryQuery, values);
        const { applicant_id, nmms_reg_number } = result.rows[0];

        await client.query(
          `INSERT INTO pp.applicant_secondary_info (applicant_id) VALUES ($1)`,
          [applicant_id]
        );

        await client.query("COMMIT");
        insertedRecords.push(nmms_reg_number);

      } catch (rowError) {
        await client.query("ROLLBACK");
        databaseErrors.push({
            message: `Row ${row.originalRowIndex + 1} (Reg #: ${row.nmms_reg_number || 'N/A'}) failed. Reason: ${rowError.message}`
        });
      }
    }
    return insertedRecords;
  } catch (error) {
    console.error("Catastrophic database error in insertApplicants:", error);
    throw error;
  } finally {
    client.release();
  }
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.toLowerCase().trim().replace(/ /g, '_'),
        transform: (value) => value.trim(),
        complete: (results) => {
            resolve({ headers: results.meta.fields, data: results.data });
        },
        error: (error) => reject(error),
    });
  });
};

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const headerData = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: "" });
  if (headerData.length === 0) {
      return { headers: [], data: [] };
  }
  const headers = headerData[0].map(h => String(h).toLowerCase().trim().replace(/ /g, '_'));

  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  const normalizedData = data.map(row => {
      const newObj = {};
      for (const key in row) {
          if (Object.prototype.hasOwnProperty.call(row, key)) {
              newObj[key.toLowerCase().trim().replace(/ /g, '_')] = row[key];
          }
      }
      return newObj;
  });

  return { headers, data: normalizedData };
};

const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();

  const logData = {
    uploadDate: new Date().toISOString(),
    fileName: req.file.originalname,
    fileSize: req.file.size,
    status: 'processing',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    insertedRecords: [],
    successfulRows: [], // Added to store full data of successful records
    validationErrors: [],
    databaseErrors: [],
    processingTime: null,
    startTime: new Date(),
    criticalError: null,
  };

  try {
    let parsedResult;
    if (fileExt === ".csv") {
      parsedResult = await parseCSV(filePath);
    } else if (fileExt === ".xlsx" || fileExt === ".xls") {
      parsedResult = parseExcel(filePath);
    } else {
      throw new Error("Unsupported file format. Please upload a CSV or XLSX file.");
    }

    const { headers, data: parsedData } = parsedResult;
    const headerSet = new Set(headers);
    if (headerSet.size < headers.length) {
        const seen = new Set();
        const duplicates = headers.filter(item => seen.size === seen.add(item).size);
        const uniqueDuplicates = [...new Set(duplicates)];
        throw new Error(`Duplicate headers found in your file: [${uniqueDuplicates.join(', ')}]. Please ensure all column headers are unique.`);
    }

    logData.totalRecords = parsedData.length;
    if (parsedData.length === 0) {
        throw new Error("The uploaded file is empty or contains no data rows.");
    }

    const validationResults = parsedData.map(validateAndSanitizeRow);

    const validRows = [];
    validationResults.forEach((result) => {
      if (result.errors.length > 0) {
        logData.validationErrors.push(...result.errors);
      } else {
        validRows.push(result.row);
      }
    });

    logData.validRecords = validRows.length;
    const invalidRecordRows = new Set(logData.validationErrors.map(e => e.row));
    logData.invalidRecords = invalidRecordRows.size;

    if (validRows.length > 0) {
      const insertedRegNumbers = await insertApplicants(validRows, logData.databaseErrors);
      logData.insertedRecords = insertedRegNumbers;
      // *** NEW: Filter the valid rows to get full data for successful ones ***
      logData.successfulRows = validRows.filter(row => 
        insertedRegNumbers.includes(row.nmms_reg_number)
      );
    }

    if (logData.invalidRecords === 0 && logData.databaseErrors.length === 0) {
        logData.status = 'success';
    } else if (logData.insertedRecords.length > 0) {
        logData.status = 'partial_success';
    } else {
        logData.status = 'failed';
    }

    const response = {
      totalRecords: logData.totalRecords,
      submittedApplications: logData.insertedRecords.length,
      rejectedApplications: logData.invalidRecords + logData.databaseErrors.length,
      validationErrors: logData.validationErrors,
      databaseErrorsCount: logData.databaseErrors.length,
      message: "",
    };

    if (logData.status === 'success') {
      response.message = `✅ Success! All ${response.submittedApplications} records were added.`;
      res.status(200);
    } else if (logData.status === 'partial_success') {
      response.message = `⚠ Partial success. ${response.submittedApplications} added, ${response.rejectedApplications} failed. Check log file for details.`;
      res.status(207);
    } else {
      response.message = `❌ Upload failed. No records were added. Check log file for details.`;
      res.status(400);
    }
    
    logData.processingTime = `${(new Date() - logData.startTime)}ms`;
    const logFileName = generateLogFile(logData);
    response.logFile = logFileName;

    res.json(response);

  } catch (error) {
    console.error("Unhandled error during file upload:", error);
    logData.status = 'failed';
    logData.criticalError = { message: error.message, stack: error.stack };
    logData.processingTime = `${(new Date() - logData.startTime)}ms`;
    
    let logFileName = null;
    try {
        logFileName = generateLogFile(logData);
    } catch (logError) {
        console.error("Failed to generate log file after error:", logError);
    }

    res.status(500).json({
      message: "Error processing file: " + (error.message || "Unexpected server error"),
      logFile: logFileName,
    });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
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

  res.download(logFilePath, logFileName, (err) => {
      if (err) {
          console.error("Error sending log file:", err);
          res.status(500).send("Could not download the file.");
      }
  });
};

module.exports = { uploadFile, downloadLogFile };
