const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const {
  parseCSV,
  parseExcel,
  validateAndSanitizeRow,
  insertApplicants,
} = require("../models/bulkuploadModel");

// ============ LOG FILE GENERATOR ============
const generateLogFile = async (logData) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFileName = `upload_log_${timestamp}.txt`;
  const logDir = path.join(__dirname, "../logs");

  await fs.mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, logFileName);

  let content = `File Upload Summary - ${new Date().toLocaleString()}\n==================================================\n`;
  content += `File Name: ${logData.fileName}\nStatus: ${logData.status}\n\n`;

  if (logData.validationErrors.length > 0) {
    content += `Validation Errors:\n`;
    logData.validationErrors.forEach((e) => {
      content += `Row ${e.row}: ${e.field} → ${e.message}\n`;
    });
  }

  if (logData.databaseErrors.length > 0) {
    content += `\nDatabase/Critical Errors:\n`;
    logData.databaseErrors.forEach((e) => {
      content += `• ${e.message}\n`;
    });
  }

  await fs.writeFile(logPath, content);
  return logFileName;
};

// ============ CONTROLLER MAIN FUNCTION ============
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          'No file received. Ensure the request is multipart/form-data and the file field key is "file". Do NOT set Content-Type manually.',
      });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    const logData = {
      fileName: req.file.originalname,
      validationErrors: [],
      databaseErrors: [],
      status: "processing",
    };

    const authUserId =
      req.user?.user_id || req.user?.id || req.user?.userId || 1;

    try {
      const parsed =
        fileExt === ".csv"
          ? await parseCSV(filePath)
          : await parseExcel(filePath);

      const validationResults = parsed.data.map(validateAndSanitizeRow);

      const validRows = [];
      validationResults.forEach((r) => {
        if (r.errors.length > 0) logData.validationErrors.push(...r.errors);
        else validRows.push(r.row);
      });

      const inserted = await insertApplicants(
        validRows,
        logData.databaseErrors,
        authUserId
      );

      logData.status =
        inserted.length > 0
          ? logData.validationErrors.length > 0 || logData.databaseErrors.length > 0
            ? "partial_success"
            : "success"
          : logData.validationErrors.length > 0 ||
            logData.databaseErrors.length > 0
          ? "failed"
          : "no_valid_data";

      const logFile = await generateLogFile(logData);

      res.status(200).json({
        totalRecords: parsed.data.length,
        insertedRecords: inserted.length,
        validationErrors: logData.validationErrors.length,
        dbErrors: logData.databaseErrors.length,
        status: logData.status,
        logFile,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      logData.status = "failed";

      logData.databaseErrors.push({
        message: `CRITICAL ERROR: ${error.message}`,
      });

      const logFile = await generateLogFile(logData);

      return res.status(500).json({
        message: error.message,
        logFile,
      });
    } finally {
      try {
        if (fsSync.existsSync(filePath)) {
          await fs.unlink(filePath);
        }
      } catch (unlinkError) {
        console.error("Failed to delete temporary file:", unlinkError.message);
      }
    }
  } catch (outerError) {
    console.error("Unexpected outer error in uploadFile:", outerError);
    return res.status(500).json({
      message: "Unexpected server error",
    });
  }
};

module.exports = { uploadFile };
