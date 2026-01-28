// // // const fs = require("fs").promises;
// // // const fsSync = require("fs");
// // // const path = require("path");
// // // const {
// // //   parseCSV,
// // //   parseExcel,
// // //   validateAndSanitizeRow,
// // //   insertApplicants,
// // // } = require("../models/bulkuploadModel");

// // // // ============ LOG FILE GENERATOR ============
// // // const generateLogFile = async (logData) => {
// // //   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
// // //   const logFileName = `upload_log_${timestamp}.txt`;
// // //   const logDir = path.join(__dirname, "../logs");

// // //   await fs.mkdir(logDir, { recursive: true });
// // //   const logPath = path.join(logDir, logFileName);

// // //   let content = `File Upload Summary - ${new Date().toLocaleString()}\n==================================================\n`;
// // //   content += `File Name: ${logData.fileName}\nStatus: ${logData.status}\n\n`;

// // //   if (logData.validationErrors.length > 0) {
// // //     content += `Validation Errors:\n`;
// // //     logData.validationErrors.forEach((e) => {
// // //       content += `Row ${e.row}: ${e.field} → ${e.message}\n`;
// // //     });
// // //   }

// // //   if (logData.databaseErrors.length > 0) {
// // //     content += `\nDatabase/Critical Errors:\n`;
// // //     logData.databaseErrors.forEach((e) => {
// // //       content += `• ${e.message}\n`;
// // //     });
// // //   }

// // //   await fs.writeFile(logPath, content);
// // //   return logFileName;
// // // };

// // // // ============ CONTROLLER MAIN FUNCTION ============
// // // const uploadFile = async (req, res) => {
// // //   try {
// // //     if (!req.file) {
// // //       return res.status(400).json({
// // //         message:
// // //           'No file received. Ensure the request is multipart/form-data and the file field key is "file". Do NOT set Content-Type manually.',
// // //       });
// // //     }

// // //     const filePath = req.file.path;
// // //     const fileExt = path.extname(req.file.originalname).toLowerCase();

// // //     const logData = {
// // //       fileName: req.file.originalname,
// // //       validationErrors: [],
// // //       databaseErrors: [],
// // //       status: "processing",
// // //     };

// // //     const authUserId =
// // //       req.user?.user_id || req.user?.id || req.user?.userId || 1;

// // //     try {
// // //       const parsed =
// // //         fileExt === ".csv"
// // //           ? await parseCSV(filePath)
// // //           : await parseExcel(filePath);

// // //       const validationResults = parsed.data.map(validateAndSanitizeRow);

// // //       const validRows = [];
// // //       validationResults.forEach((r) => {
// // //         if (r.errors.length > 0) logData.validationErrors.push(...r.errors);
// // //         else validRows.push(r.row);
// // //       });

// // //       const inserted = await insertApplicants(
// // //         validRows,
// // //         logData.databaseErrors,
// // //         authUserId
// // //       );

// // //       logData.status =
// // //         inserted.length > 0
// // //           ? logData.validationErrors.length > 0 || logData.databaseErrors.length > 0
// // //             ? "partial_success"
// // //             : "success"
// // //           : logData.validationErrors.length > 0 ||
// // //             logData.databaseErrors.length > 0
// // //           ? "failed"
// // //           : "no_valid_data";

// // //       const logFile = await generateLogFile(logData);

// // //       res.status(200).json({
// // //         totalRecords: parsed.data.length,
// // //         insertedRecords: inserted.length,
// // //         validationErrors: logData.validationErrors.length,
// // //         dbErrors: logData.databaseErrors.length,
// // //         status: logData.status,
// // //         logFile,
// // //       });
// // //     } catch (error) {
// // //       console.error("Upload failed:", error);
// // //       logData.status = "failed";

// // //       logData.databaseErrors.push({
// // //         message: `CRITICAL ERROR: ${error.message}`,
// // //       });

// // //       const logFile = await generateLogFile(logData);

// // //       return res.status(500).json({
// // //         message: error.message,
// // //         logFile,
// // //       });
// // //     } finally {
// // //       try {
// // //         if (fsSync.existsSync(filePath)) {
// // //           await fs.unlink(filePath);
// // //         }
// // //       } catch (unlinkError) {
// // //         console.error("Failed to delete temporary file:", unlinkError.message);
// // //       }
// // //     }
// // //   } catch (outerError) {
// // //     console.error("Unexpected outer error in uploadFile:", outerError);
// // //     return res.status(500).json({
// // //       message: "Unexpected server error",
// // //     });
// // //   }
// // // };

// // // module.exports = { uploadFile };
// // const fs = require("fs").promises;
// // const fsSync = require("fs");
// // const path = require("path");
// // const Papa = require("papaparse");
// // const pool = require("../config/db");

// // const {
// //   validateAndSanitizeRow,
// //   insertBatchWithRollback,
// // } = require("../models/bulkuploadModel");

// // /* ============ LOG FILE GENERATOR ============ */
// // const generateLogFile = async (logData) => {
// //   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
// //   const logFileName = `upload_log_${timestamp}.txt`;
// //   const logDir = path.join(__dirname, "../logs");

// //   await fs.mkdir(logDir, { recursive: true });
// //   const logPath = path.join(logDir, logFileName);

// //   let content = `File Upload Summary - ${new Date().toLocaleString()}\n`;
// //   content += `==================================================\n`;
// //   content += `File Name: ${logData.fileName}\n`;
// //   content += `Status: ${logData.status}\n\n`;

// //   if (logData.validationErrors.length > 0) {
// //     content += `Validation Errors:\n`;
// //     logData.validationErrors.forEach((e) => {
// //       content += `Row ${e.row}: ${e.field} → ${e.message}\n`;
// //     });
// //   }

// //   if (logData.databaseErrors.length > 0) {
// //     content += `\nDatabase Errors:\n`;
// //     logData.databaseErrors.forEach((e) => {
// //       content += `• ${e.message}\n`;
// //     });
// //   }

// //   await fs.writeFile(logPath, content);
// //   return logFileName;
// // };

// // /* ============ MAIN CONTROLLER ============ */
// // const uploadFile = async (req, res) => {
// //   if (!req.file) {
// //     return res.status(400).json({
// //       message:
// //         'No file received. Ensure request is multipart/form-data and field name is "file".',
// //     });
// //   }

// //   const filePath = req.file.path;
// //   const client = await pool.connect();

// //   const logData = {
// //     fileName: req.file.originalname,
// //     validationErrors: [],
// //     databaseErrors: [],
// //     status: "processing",
// //   };

// //   let totalRecords = 0;
// //   let insertedRecords = 0;

// //   const BATCH_SIZE = 5000;
// //   let batch = [];
// //   let rowIndex = 0;

// //   try {
// //     await new Promise((resolve, reject) => {
// //       Papa.parse(fsSync.createReadStream(filePath), {
// //         header: true,
// //         skipEmptyLines: true,
// //         transformHeader: (h) =>
// //           h.toLowerCase().trim().replace(/ /g, "_"),

// //         step: async (result, parser) => {
// //           parser.pause();
// //           totalRecords++;

// //           const { row, errors } = validateAndSanitizeRow(
// //             result.data,
// //             rowIndex++
// //           );

// //           if (errors.length > 0) {
// //             logData.validationErrors.push(...errors);
// //           } else {
// //             batch.push({
// //               ...row,
// //               created_by: req.user?.user_id || 1,
// //               updated_by: req.user?.user_id || 1,
// //             });
// //           }

// //           if (batch.length === BATCH_SIZE) {
// //             insertedRecords += await insertBatchWithRollback(
// //               client,
// //               batch,
// //               logData.databaseErrors
// //             );
// //             batch = [];
// //           }

// //           parser.resume();
// //         },

// //         complete: async () => {
// //           if (batch.length > 0) {
// //             insertedRecords += await insertBatchWithRollback(
// //               client,
// //               batch,
// //               logData.databaseErrors
// //             );
// //           }
// //           resolve();
// //         },

// //         error: reject,
// //       });
// //     });

// //     logData.status =
// //       insertedRecords > 0
// //         ? logData.validationErrors.length || logData.databaseErrors.length
// //           ? "partial_success"
// //           : "success"
// //         : logData.validationErrors.length || logData.databaseErrors.length
// //         ? "failed"
// //         : "no_valid_data";

// //     const logFile = await generateLogFile(logData);

// //     return res.status(200).json({
// //       totalRecords,
// //       insertedRecords,
// //       validationErrors: logData.validationErrors.length,
// //       dbErrors: logData.databaseErrors.length,
// //       status: logData.status,
// //       logFile,
// //     });

// //   } catch (error) {
// //     console.error("Upload failed:", error);

// //     logData.status = "failed";
// //     logData.databaseErrors.push({
// //       message: `CRITICAL ERROR: ${error.message}`,
// //     });

// //     const logFile = await generateLogFile(logData);

// //     return res.status(500).json({
// //       message: error.message,
// //       logFile,
// //     });

// //   } finally {
// //     client.release();
// //     try {
// //       if (fsSync.existsSync(filePath)) {
// //         await fs.unlink(filePath);
// //       }
// //     } catch (err) {
// //       console.error("Failed to delete temp file:", err.message);
// //     }
// //   }
// // };

// // module.exports = { uploadFile };


// const fs = require("fs").promises;
// const fsSync = require("fs");
// const path = require("path");
// const {
//   parseCSV,
//   parseExcel,
//   validateAndSanitizeRow,
//   insertApplicants,
// } = require("../models/bulkuploadModel");

// /* =====================================================
//    LOG FILE GENERATOR (UNCHANGED)
// ===================================================== */
// const generateLogFile = async (logData) => {
//   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//   const logFileName = `upload_log_${timestamp}.txt`;
//   const logDir = path.join(__dirname, "../logs");

//   await fs.mkdir(logDir, { recursive: true });
//   const logPath = path.join(logDir, logFileName);

//   let content = `File Upload Summary - ${new Date().toLocaleString()}\n`;
//   content += `==================================================\n`;
//   content += `File Name: ${logData.fileName}\n`;
//   content += `Status: ${logData.status}\n\n`;

//   if (logData.validationErrors.length > 0) {
//     content += `Validation Errors:\n`;
//     logData.validationErrors.forEach((e) => {
//       content += `Row ${e.row}: ${e.field} → ${e.message}\n`;
//     });
//   }

//   if (logData.databaseErrors.length > 0) {
//     content += `\nDatabase Errors:\n`;
//     logData.databaseErrors.forEach((e) => {
//       content += `• ${e.message}\n`;
//     });
//   }

//   await fs.writeFile(logPath, content);
//   return logFileName;
// };

// /* =====================================================
//    MAIN CONTROLLER (MODIFIED INTERNALLY ONLY)
// ===================================================== */
// const uploadFile = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         message:
//           'No file received. Ensure the request is multipart/form-data and the file field key is "file".',
//       });
//     }

//     const filePath = req.file.path;
//     const fileExt = path.extname(req.file.originalname).toLowerCase();

//     const logData = {
//       fileName: req.file.originalname,
//       validationErrors: [],
//       databaseErrors: [],
//       status: "processing",
//     };

//     const authUserId =
//       req.user?.user_id || req.user?.id || req.user?.userId || 1;

//     try {
//       /* =========================
//          PARSE FILE (UNCHANGED)
//       ========================= */
//       const parsed =
//         fileExt === ".csv"
//           ? await parseCSV(filePath)
//           : await parseExcel(filePath);

//       /* =========================
//          VALIDATION (UNCHANGED)
//       ========================= */
//       const validationResults = parsed.data.map((row, index) =>
//         validateAndSanitizeRow(row, index)
//       );

//       const validRows = [];
//       validationResults.forEach((r) => {
//         if (r.errors.length > 0) {
//           logData.validationErrors.push(...r.errors);
//         } else {
//           validRows.push(r.row);
//         }
//       });

//       /* =========================
//          INSERT (UPDATED MODEL)
//       ========================= */
//       const inserted = await insertApplicants(
//         validRows,
//         logData.databaseErrors,
//         authUserId
//       );

//       /* =========================
//          STATUS LOGIC (UNCHANGED)
//       ========================= */
//       logData.status =
//         inserted.length > 0
//           ? logData.validationErrors.length > 0 ||
//             logData.databaseErrors.length > 0
//             ? "partial_success"
//             : "success"
//           : logData.validationErrors.length > 0 ||
//             logData.databaseErrors.length > 0
//           ? "failed"
//           : "no_valid_data";

//       const logFile = await generateLogFile(logData);

//       /* =========================
//          RESPONSE (UNCHANGED)
//       ========================= */
//       res.status(200).json({
//         totalRecords: parsed.data.length,
//         insertedRecords: inserted.length,
//         validationErrors: logData.validationErrors.length,
//         dbErrors: logData.databaseErrors.length,
//         status: logData.status,
//         logFile,
//       });
//     } catch (error) {
//       console.error("Upload failed:", error);

//       logData.status = "failed";
//       logData.databaseErrors.push({
//         message: `CRITICAL ERROR: ${error.message}`,
//       });

//       const logFile = await generateLogFile(logData);

//       return res.status(500).json({
//         message: error.message,
//         logFile,
//       });
//     } finally {
//       /* =========================
//          CLEANUP TEMP FILE
//       ========================= */
//       try {
//         if (fsSync.existsSync(filePath)) {
//           await fs.unlink(filePath);
//         }
//       } catch (unlinkError) {
//         console.error(
//           "Failed to delete temporary file:",
//           unlinkError.message
//         );
//       }
//     }
//   } catch (outerError) {
//     console.error("Unexpected outer error in uploadFile:", outerError);
//     return res.status(500).json({
//       message: "Unexpected server error",
//     });
//   }
// };

// module.exports = { uploadFile };

// const fs = require("fs").promises;
// const fsSync = require("fs");
// const path = require("path");
// const {
//   parseCSV,
//   parseExcel,
//   validateAndSanitizeRow,
//   insertApplicants,
// } = require("../models/bulkuploadModel");

// const generateLogFile = async (logData) => {
//   const name = `upload_log_${Date.now()}.txt`;
//   const dir = path.join(__dirname, "../logs");
//   await fs.mkdir(dir, { recursive: true });

//   let content = `File Upload Summary\n============================\n`;
//   content += `File: ${logData.fileName}\nStatus: ${logData.status}\n\n`;

//   if (logData.validationErrors.length) {
//     content += `Validation Errors:\n`;
//     logData.validationErrors.forEach(
//       (e) => (content += `Row ${e.row}: ${e.message}\n`)
//     );
//   }

//   if (logData.databaseErrors.length) {
//     content += `\nDatabase Errors:\n`;
//     logData.databaseErrors.forEach(
//       (e) => (content += `• ${e.message}\n`)
//     );
//   }

//   await fs.writeFile(path.join(dir, name), content);
//   return name;
// };

// const uploadFile = async (req, res) => {
//   const filePath = req.file.path;
//   const ext = path.extname(req.file.originalname).toLowerCase();

//   const logData = {
//     fileName: req.file.originalname,
//     validationErrors: [],
//     databaseErrors: [],
//     status: "processing",
//   };

//   try {
//     const parsed =
//       ext === ".csv" ? await parseCSV(filePath) : await parseExcel(filePath);

//     const results = parsed.data.map(validateAndSanitizeRow);

//     const validRows = [];
//     results.forEach((r) => {
//       if (r.errors.length) logData.validationErrors.push(...r.errors);
//       else validRows.push(r.row);
//     });

//     const inserted = await insertApplicants(validRows, logData.databaseErrors);

//     logData.status =
//       inserted.length > 0
//         ? logData.validationErrors.length || logData.databaseErrors.length
//           ? "partial_success"
//           : "success"
//         : "failed";

//     const logFile = await generateLogFile(logData);

//     res.json({
//       totalRecords: parsed.data.length,
//       insertedRecords: inserted.length,
//       validationErrors: logData.validationErrors.length,
//       dbErrors: logData.databaseErrors.length,
//       status: logData.status,
//       logFile,
//     });
//   } finally {
//     if (fsSync.existsSync(filePath)) await fs.unlink(filePath);
//   }
// };

// module.exports = { uploadFile };



const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const {
  parseCSV,
  parseExcel,
  validateAndSanitizeRow,
  insertApplicants,
} = require("../models/bulkuploadModel");

/* =====================================================
   LOG FILE GENERATOR
===================================================== */
const generateLogFile = async (logData) => {
  const name = `upload_log_${Date.now()}.txt`;
  const dir = path.join(__dirname, "../logs");
  await fs.mkdir(dir, { recursive: true });

  let content = `File Upload Summary\n`;
  content += `============================\n`;
  content += `File: ${logData.fileName}\n`;
  content += `Status: ${logData.status}\n\n`;

  if (logData.validationErrors.length) {
    content += `Validation Errors:\n`;
    logData.validationErrors.forEach((e) => {
      content += `Row ${e.row}: ${e.message}\n`;
    });
  }

  if (logData.databaseErrors.length) {
    content += `\nDatabase Errors:\n`;
    logData.databaseErrors.forEach((e) => {
      content += `• ${e.message}\n`;
    });
  }

  await fs.writeFile(path.join(dir, name), content);
  return name;
};

/* =====================================================
   MAIN CONTROLLER (ATOMIC UPLOAD)
===================================================== */
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message:
        'No file received. Ensure multipart/form-data and field name is "file".',
    });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  const logData = {
    fileName: req.file.originalname,
    validationErrors: [],
    databaseErrors: [],
    status: "processing",
  };

  try {
    /* =========================
       PARSE FILE
    ========================= */
    const parsed =
      ext === ".csv"
        ? await parseCSV(filePath)
        : await parseExcel(filePath);

    /* =========================
       VALIDATE & SANITIZE
    ========================= */
    const results = parsed.data.map((row, index) =>
      validateAndSanitizeRow(row, index)
    );

    const validRows = [];
    results.forEach((r) => {
      if (r.errors.length) logData.validationErrors.push(...r.errors);
      else validRows.push(r.row);
    });

    /* =========================
       IF VALIDATION FAILS → STOP
    ========================= */
    if (logData.validationErrors.length > 0) {
      logData.status = "failed";
      const logFile = await generateLogFile(logData);

      return res.status(400).json({
        totalRecords: parsed.data.length,
        insertedRecords: 0,
        validationErrors: logData.validationErrors.length,
        dbErrors: 0,
        status: logData.status,
        logFile,
      });
    }

    /* =========================
       INSERT (ATOMIC – COPY)
    ========================= */
    const inserted = await insertApplicants(
      validRows,
      logData.databaseErrors
    );

    /* =========================
       STATUS (ALL OR NOTHING)
    ========================= */
    if (logData.databaseErrors.length > 0 || inserted.length === 0) {
      logData.status = "failed";
    } else {
      logData.status = "success";
    }

    const logFile = await generateLogFile(logData);

    return res.status(logData.status === "success" ? 200 : 500).json({
      totalRecords: parsed.data.length,
      insertedRecords: inserted.length,
      validationErrors: logData.validationErrors.length,
      dbErrors: logData.databaseErrors.length,
      status: logData.status,
      logFile,
    });
  } catch (err) {
    logData.status = "failed";
    logData.databaseErrors.push({
      message: `CRITICAL ERROR: ${err.message}`,
    });

    const logFile = await generateLogFile(logData);

    return res.status(500).json({
      message: "Bulk upload failed",
      status: "failed",
      logFile,
    });
  } finally {
    /* =========================
       CLEANUP TEMP FILE
    ========================= */
    try {
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (e) {
      console.error("Temp file cleanup failed:", e.message);
    }
  }
};

module.exports = { uploadFile };


