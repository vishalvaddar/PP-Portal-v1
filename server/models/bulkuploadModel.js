const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const xlsx = require("xlsx");
const moment = require("moment");
const pool = require("../config/db");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "temp");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedMimes = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const fileFilter = (req, file, cb) => {
  try {
    if (!file || !file.mimetype) return cb(new Error("Invalid file upload."), false);
    const mime = file.mimetype.toLowerCase();
    const ok = allowedMimes.some(m => mime === m || mime.includes(m.split('/')[1]));
    if (ok) return cb(null, true);
    cb(new Error("Invalid file type. Only CSV and Excel allowed."), false);
  } catch (err) {
    cb(err, false);
  }
};

const limits = {
  fileSize: 25 * 1024 * 1024, // 25 MB
  files: 1,
  fields: 50,
  fieldSize: 1 * 1024 * 1024,
};

const upload = multer({ storage, fileFilter, limits });
const multerSingle = upload.single("file"); // MUST match client FormData key

const handleUploadErrors = (err, req, res, next) => {
  if (!err) return next();
  console.error("Upload middleware error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(400).json({ success: false, message: err.message || "Invalid file upload." });
};

const validateField = (field, value, rowIndex) => {
  const currentYear = new Date().getFullYear();
  const errors = [];

  const requiredFields = ['nmms_year', 'nmms_reg_number', 'student_name', 'father_name', 'gmat_score', 'sat_score'];

  if (requiredFields.includes(field) && (value === null || value === undefined || value.toString().trim() === '')) {
    errors.push(`This field is required.`);
  }

  const strValue = (value || "").toString().trim();

  switch (field) {
    case 'nmms_year':
      if (strValue && isNaN(strValue)) errors.push('Must be a number.');
      else if (strValue && (parseInt(strValue, 10) !== currentYear))
        errors.push(`Year must be the current year: ${currentYear}.`);
      break;

    case 'nmms_reg_number':
      if (strValue && !/^\d{11}$/.test(strValue)) errors.push('Must be exactly 11 digits.');
      break;

    case 'gmat_score':
    case 'sat_score':
      if (strValue && isNaN(strValue)) errors.push('Must be a number.');
      else if (strValue && (Number(strValue) < 0 || Number(strValue) > 90))
        errors.push('Score must be between 0 and 90 (inclusive).');
      break;

    case 'contact_no1':
    case 'contact_no2':
      if (strValue && !/^\d{10}$/.test(strValue)) errors.push('Must be a 10-digit number.');
      break;

    case 'gender':
      if (strValue && !['M', 'F', 'O'].includes(strValue.toUpperCase()))
        errors.push('Must be M, F, or O.');
      break;

  }

  return errors.length > 0
    ? { row: rowIndex + 1, field, value, message: errors.join(', ') }
    : null;
};

const sanitizeValue = (value, type = "text") => {
  const strValue = (value || "").toString().trim();
  if (strValue === "") return null;

  if (type === 'gender') return strValue.toUpperCase();
  if (type === 'numeric') {
    const num = Number(strValue);
    return isNaN(num) ? null : num;
  }
  return strValue;
};

const sanitizeDate = (dateStr) => {
  const strValue = (dateStr || "").toString().trim();
  if (!strValue) return null;

  const validFormats = ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"];
  const momentDate = moment(strValue, validFormats, true);
  return momentDate.isValid() ? momentDate.format("YYYY-MM-DD") : null;
};

const validateAndSanitizeRow = (row, index) => {
  const errors = [];
  const sanitizedRow = {};

  const numericFields = ['nmms_year', 'gmat_score', 'sat_score', 'family_income_total'];
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

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.toLowerCase().trim().replace(/ /g, '_'),
      transform: (value) => value.trim(),
      complete: (results) => resolve({ headers: results.meta.fields, data: results.data }),
      error: (error) => reject(error),
    });
  });
};

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  const normalizedData = data.map(row => {
    const newObj = {};
    for (const key in row) {
      newObj[key.toLowerCase().trim().replace(/ /g, '_')] = row[key];
    }
    return newObj;
  });

  const headers = Object.keys(normalizedData[0] || {}).map(h => h.toLowerCase().trim().replace(/ /g, '_'));

  return { headers, data: normalizedData };
};

const getJurisdictionIdByName = async (client, jurisName, jurisType, parentId = null) => {
  if (!jurisName) return null;

  const cleanName = jurisName.trim().replace(/[.,]+$/, "").toUpperCase();

  let query = `
    SELECT juris_code 
    FROM pp.jurisdiction 
    WHERE juris_name ILIKE $1 
    AND juris_type = $2
  `;
  const values = [cleanName, jurisType];

  if (parentId) {
    query += ` AND parent_juris = $3`;
    values.push(parentId);
  }

  let result = await client.query(query, values);

  if (result.rows.length === 0) {
    const fallbackQuery = `
      SELECT juris_code 
      FROM pp.jurisdiction 
      WHERE juris_name ILIKE $1 
      AND juris_type = $2
    `;
    result = await client.query(fallbackQuery, [cleanName, jurisType]);
  }

  if (result.rows.length === 0) {
    const looseQuery = `
      SELECT juris_code 
      FROM pp.jurisdiction 
      WHERE UPPER(juris_name) = $1
    `;
    result = await client.query(looseQuery, [cleanName]);
  }

  if (result.rows.length === 0)
    throw new Error(`Location Not Found: ${jurisType} '${jurisName}'`);

  return result.rows[0].juris_code;
};

const insertApplicants = async (validData, databaseErrors, createdById = 1) => {
  const client = await pool.connect();
  const insertedRecords = [];

  try {
    for (const row of validData) {
      try {
        await client.query("BEGIN");

        const dup = await client.query(
          `SELECT 1 FROM pp.applicant_primary_info WHERE nmms_reg_number = $1`,
          [row.nmms_reg_number]
        );
        if (dup.rows.length > 0)
          throw new Error(`Duplicate Registration Number ${row.nmms_reg_number}`);

        const appStateId = await getJurisdictionIdByName(client, row.app_state, "STATE");
        const districtId = await getJurisdictionIdByName(client, row.district, "EDUCATION DISTRICT", appStateId);
        const blockId = await getJurisdictionIdByName(client, row.nmms_block, "BLOCK", districtId);

        const query = `
          INSERT INTO pp.applicant_primary_info (
            nmms_year, nmms_reg_number, app_state, district, nmms_block,
            student_name, father_name, mother_name, gender, dob, aadhaar,
            gmat_score, sat_score, medium, home_address, family_income_total,
            contact_no1, contact_no2, current_institute_dise_code, previous_institute_dise_code,
            created_by, updated_by
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
            $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
          ) RETURNING nmms_reg_number`;

        const values = [
          row.nmms_year,
          row.nmms_reg_number,
          appStateId,
          districtId,
          blockId,
          row.student_name,
          row.father_name,
          row.mother_name,
          row.gender,
          row.dob,
          row.aadhaar,
          row.gmat_score,
          row.sat_score,
          row.medium,
          row.home_address,
          row.family_income_total,
          row.contact_no1,
          row.contact_no2,
          row.current_institute_dise_code,
          row.previous_institute_dise_code,
          createdById,
          createdById,
        ];

        await client.query(query, values);
        await client.query("COMMIT");
        insertedRecords.push(row.nmms_reg_number);
      } catch (e) {
        await client.query("ROLLBACK");
        databaseErrors.push({
          message: `Row ${row.originalRowIndex + 1} (Reg No: ${row.nmms_reg_number || 'N/A'}) failed. ${e.message}`,
        });
      }
    }
  } catch (error) {
    console.error("Critical database error in insertApplicants:", error);
    throw error;
  } finally {
    client.release();
  }
  return insertedRecords;
};

module.exports = {
  parseCSV,
  parseExcel,
  validateAndSanitizeRow,
  insertApplicants,
  multerSingle,
  handleUploadErrors,
};