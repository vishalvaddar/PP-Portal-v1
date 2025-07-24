const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const xlsx = require("xlsx");
const pool = require("../config/db"); // Assuming your DB config is in ../config/db.js
const moment = require("moment");

// --- DATA VALIDATION & SANITIZATION ---

const validateField = (field, value, rowIndex) => {
    const errors = [];
    const requiredFields = [
        'nmms_year', 'nmms_reg_number', 'student_name', 'father_name', 'gender',
        'gmat_score', 'sat_score', 'app_state', 'district', 'nmms_block'
    ];

    if (requiredFields.includes(field) && (!value || value.toString().trim() === '')) {
        errors.push(`${field} is required`);
    }

    // Specific field validations
    switch (field) {
        case 'nmms_year':
            if (value && isNaN(value)) errors.push('must be a number');
            else if (value && (value < 2022 || value > new Date().getFullYear())) {
                errors.push(`must be between 2022 and ${new Date().getFullYear()}`);
            }
            break;
        case 'nmms_reg_number':
            if (value && value.toString().length !== 11) errors.push('must be exactly 11 characters');
            break;
        case 'gmat_score':
        case 'sat_score':
            if (value && isNaN(value)) errors.push('must be a number');
            else if (value && (value < 0 || value > 90)) {
                errors.push('must be between 0 and 90');
            }
            break;
        case 'contact_no1':
        case 'contact_no2':
            if (value && !/^\d{10}$/.test(value)) errors.push('must be 10 digits');
            break;
        case 'gender':
            if (value && !['M', 'F', 'O'].includes(value.toUpperCase())) {
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
        return null;
    }
    if (type === "numeric") return Number(value);
    // For gender, ensure it's standardized to uppercase
    if (typeof value === 'string' && ['M', 'F', 'O'].includes(value.toUpperCase())) {
        return value.toUpperCase();
    }
    return value.toString().trim();
};

const sanitizeDate = (dateStr) => {
    if (!dateStr) return null;
    return moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"], true).isValid() ?
        moment(dateStr, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD") :
        null;
};

const validateAndSanitizeRow = (row, index) => {
    const errors = [];
    const sanitizedRow = {};

    for (const [field, value] of Object.entries(row)) {
        const error = validateField(field, value, index);
        if (error) errors.push(error);

        if (field === 'DOB') {
            sanitizedRow[field] = sanitizeDate(value);
        } else if (['nmms_year', 'gmat_score', 'sat_score', 'current_institute_dise_code', 'previous_institute_dise_code', 'family_income_total'].includes(field)) {
            sanitizedRow[field] = sanitizeValue(value, 'numeric');
        } else {
            sanitizedRow[field] = sanitizeValue(value);
        }
    }
    // Store original row index to map errors back correctly
    sanitizedRow.originalRowIndex = index;
    return {
        row: sanitizedRow,
        errors
    };
};


// --- FILE PARSING HELPERS ---

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transform: (value) => value.trim(),
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

const parseExcel = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: ""
    });
};

const normalizeKeys = (obj) => {
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key.toLowerCase().trim().replace(/ /g, '_')] = obj[key];
        }
    }
    return newObj;
};

// --- LOGGING & USER-FRIENDLY MESSAGES ---

const getUserFriendlyFieldName = (fieldName) => {
    const map = {
        'nmms_year': 'NMMS Year',
        'nmms_reg_number': 'Registration Number',
        'app_state': 'State',
        'district': 'District',
        'nmms_block': 'Block',
        // Add other fields as needed
    };
    return map[fieldName] || fieldName;
};

const generateLogFile = (logData) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `upload_log_${timestamp}.txt`;
    const logFilePath = path.join(__dirname, '../logs', logFileName);

    if (!fs.existsSync(path.join(__dirname, '../logs'))) {
        fs.mkdirSync(path.join(__dirname, '../logs'));
    }

    let logContent = `File Upload Summary\n`;
    logContent += `==================================================\n`;
    logContent += `File: ${logData.fileName}\n`;
    logContent += `Date: ${new Date(logData.uploadDate).toLocaleString()}\n`;
    logContent += `Status: ${logData.status.toUpperCase()}\n\n`;

    logContent += `Total Records: ${logData.totalRecords}\n`;
    logContent += `Successfully Added: ${logData.insertedRecords.length}\n`;
    logContent += `Records with Errors: ${logData.invalidRecords}\n`;
    logContent += `Duplicate Records (Skipped): ${logData.databaseErrors.length}\n\n`;

    if (logData.validationErrors.length > 0) {
        logContent += `DETAILS OF RECORDS WITH ERRORS\n`;
        logContent += `--------------------------------------------------\n`;
        const errorsByRow = {};
        logData.validationErrors.forEach(e => {
            if (!errorsByRow[e.row]) errorsByRow[e.row] = [];
            errorsByRow[e.row].push(e);
        });

        for (const [rowNum, errors] of Object.entries(errorsByRow)) {
            logContent += `Row ${rowNum} in your file had the following issues:\n`;
            errors.forEach(error => {
                logContent += `  • Field "${getUserFriendlyFieldName(error.field)}": ${error.message}\n`;
                logContent += `    (You entered: "${error.value || '(empty)'}")\n`;
            });
            logContent += `\n`;
        }
    }

    if (logData.databaseErrors.length > 0) {
        logContent += `DETAILS OF DUPLICATE RECORDS (SKIPPED)\n`;
        logContent += `--------------------------------------------------\n`;
        logData.databaseErrors.forEach(error => {
            logContent += `• ${error.message}\n`;
        });
    }

    fs.writeFileSync(logFilePath, logContent);
    return logFileName;
};


// --- DATABASE INTERACTION ---

const validateAndFetchJurisdictionCodes = async (rows) => {
    const transformedRows = [];
    const jurisdictionErrors = [];
    if (rows.length === 0) return { transformedRows, jurisdictionErrors };

    const client = await pool.connect();
    try {
        const query = `
            SELECT
                state.juris_code AS state_code,
                district.juris_code AS district_code,
                block.juris_code AS block_code
            FROM
                pp.jurisdiction AS state
            LEFT JOIN
                pp.jurisdiction AS district ON district.parent_juris = state.juris_code AND district.juris_name ILIKE $2
            LEFT JOIN
                pp.jurisdiction AS block ON block.parent_juris = district.juris_code AND block.juris_name ILIKE $3
            WHERE
                state.juris_name ILIKE $1 AND state.juris_type = 'STATE'`;

        for (const row of rows) {
            const { app_state, district, nmms_block } = row;
            const res = await client.query(query, [app_state, district, nmms_block]);

            if (res.rows.length === 0 || !res.rows[0].state_code) {
                jurisdictionErrors.push({
                    row: row.originalRowIndex + 1,
                    field: 'app_state',
                    value: app_state,
                    message: `State '${app_state}' not found.`,
                });
            } else if (!res.rows[0].district_code) {
                jurisdictionErrors.push({
                    row: row.originalRowIndex + 1,
                    field: 'district',
                    value: district,
                    message: `District '${district}' not found within State '${app_state}'.`,
                });
            } else if (!res.rows[0].block_code) {
                jurisdictionErrors.push({
                    row: row.originalRowIndex + 1,
                    field: 'nmms_block',
                    value: nmms_block,
                    message: `Block '${nmms_block}' not found within District '${district}'.`,
                });
            } else {
                transformedRows.push({
                    ...row,
                    app_state: res.rows[0].state_code,
                    district: res.rows[0].district_code,
                    nmms_block: res.rows[0].block_code,
                });
            }
        }
    } catch (dbError) {
        console.error("Database error during jurisdiction validation:", dbError);
        jurisdictionErrors.push({ row: 'N/A', field: 'Database', message: 'A critical error occurred while verifying locations.' });
    } finally {
        client.release();
    }
    return { transformedRows, jurisdictionErrors };
};

const insertApplicants = async (validData) => {
    if (validData.length === 0) return { insertedRecords: [], databaseErrors: [] };

    const client = await pool.connect();
    const insertedRecords = [];
    const databaseErrors = [];

    const primaryQuery = `
      INSERT INTO pp.applicant_primary_info (
        nmms_year, nmms_reg_number, app_state, district, nmms_block, student_name, father_name,
        mother_name, gmat_score, sat_score, gender, medium, aadhaar, DOB, home_address,
        family_income_total, contact_no1, contact_no2, current_institute_dise_code, previous_institute_dise_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING applicant_id, nmms_reg_number`;

    try {
        await client.query('BEGIN');
        for (const row of validData) {
            try {
                const values = [
                    row.nmms_year, row.nmms_reg_number, row.app_state, row.district, row.nmms_block, row.student_name,
                    row.father_name, row.mother_name, row.gmat_score, row.sat_score, row.gender, row.medium, row.aadhaar,
                    row.DOB, row.home_address, row.family_income_total, row.contact_no1, row.contact_no2,
                    row.current_institute_dise_code, row.previous_institute_dise_code
                ];
                const result = await client.query(primaryQuery, values);
                const { applicant_id, nmms_reg_number } = result.rows[0];
                await client.query(`INSERT INTO pp.applicant_secondary_info (applicant_id) VALUES ($1)`, [applicant_id]);
                insertedRecords.push(nmms_reg_number);
            } catch (err) {
                if (err.code === '23505') { // Unique key violation
                    databaseErrors.push({ message: `Registration Number ${row.nmms_reg_number} already exists.` });
                } else {
                    throw err; // Re-throw other errors to be caught by the outer catch
                }
            }
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Database transaction failed:", error);
        databaseErrors.push({ message: "A critical database error occurred, and the entire batch was rolled back." });
    } finally {
        client.release();
    }
    return { insertedRecords, databaseErrors };
};

// --- MAIN CONTROLLER FUNCTIONS ---

const uploadFile = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const logData = {
        uploadDate: new Date().toISOString(),
        fileName: req.file.originalname,
        status: 'processing',
        totalRecords: 0,
        insertedRecords: [],
        validationErrors: [],
        databaseErrors: [],
    };

    try {
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let rawParsedData;
        if (fileExt === ".csv") rawParsedData = await parseCSV(req.file.path);
        else if (['.xlsx', '.xls'].includes(fileExt)) rawParsedData = parseExcel(req.file.path);
        else return res.status(400).json({ message: "Unsupported file format. Please use CSV or XLSX." });

        const parsedData = rawParsedData.map(normalizeKeys);
        logData.totalRecords = parsedData.length;
        if (parsedData.length === 0) return res.status(400).json({ message: "The uploaded file is empty." });

        // Step 1: Initial Validation
        const validationResults = parsedData.map(validateAndSanitizeRow);
        let allErrors = [];
        let rowsForJurisdictionCheck = [];
        validationResults.forEach(r => {
            if (r.errors.length > 0) allErrors.push(...r.errors);
            else rowsForJurisdictionCheck.push(r.row);
        });

        // Step 2: Jurisdiction Validation
        const { transformedRows, jurisdictionErrors } = await validateAndFetchJurisdictionCodes(rowsForJurisdictionCheck);
        if (jurisdictionErrors.length > 0) allErrors.push(...jurisdictionErrors);
        
        logData.validationErrors = allErrors;
        const invalidRowNumbers = new Set(allErrors.map(e => e.row));
        logData.invalidRecords = invalidRowNumbers.size;

        // Step 3: Database Insertion
        const { insertedRecords, databaseErrors } = await insertApplicants(transformedRows);
        logData.insertedRecords = insertedRecords;
        logData.databaseErrors = databaseErrors;
        
        // Finalize log status
        if (logData.totalRecords > 0 && insertedRecords.length === logData.totalRecords) {
            logData.status = 'success';
        } else if (insertedRecords.length > 0) {
            logData.status = 'partial_success';
        } else {
            logData.status = 'failed';
        }

        const logFileName = generateLogFile(logData);
        
        return res.status(200).json({
            message: "File processing complete.",
            totalRecords: logData.totalRecords,
            successfulInserts: insertedRecords.length,
            validationErrors: logData.invalidRecords,
            duplicateRecords: databaseErrors.length,
            logFile: logFileName,
        });

    } catch (error) {
        console.error("Unhandled error during file upload:", error);
        return res.status(500).json({ message: "An unexpected server error occurred." });
    } finally {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
    }
};

const downloadLogFile = (req, res) => {
    const { logFileName } = req.params;
    const logFilePath = path.join(__dirname, '../logs', logFileName);

    if (!fs.existsSync(logFilePath)) {
        return res.status(404).json({ message: "Log file not found." });
    }
    res.download(logFilePath);
};

module.exports = {
    uploadFile,
    downloadLogFile
};