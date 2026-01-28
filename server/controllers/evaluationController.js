const {ApiError} = require('../utils/ApiError')
const {ApiResponse} = require('../utils/ApiResponse')
const {asyncHandler} =require('../utils/asyncHandler')
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const fs = require('fs');

// insertBulkData
const {getExamNames,getStudents,insertBulkData} = require('../models/evaluationModels');


const fetchExamNames = asyncHandler( async (req,res) =>{

    try {
        const ExamNames = await getExamNames();
        res.status(200).json(new ApiResponse(200,"ok",ExamNames));
    } catch (error) {
       throw new ApiError(500, "Something went wrong while fetching exam names")
    }
})

const fetchStudents =asyncHandler(async (req,res) =>{
     const {exam_name} = req.query; 
    try {
        const StudentNames = await getStudents(exam_name);
        res.status(200).json(new ApiResponse(200,"ok",StudentNames))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching student names as per exam name")
    }
})

const downloadStudentExcel = asyncHandler(async (req, res) => {
    const { exam_name } = req.body;
    try {
        const students = await getStudents(exam_name);
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        
        // Define columns with custom color groups
        const columns = [
            // Group 1: Personal Info - Red (#FF0000)
            { header: 'Applicant ID', key: 'applicant_id', width: 15, color: 'FFFFCC' },
            { header: 'Student Name', key: 'student_name', width: 30, color: 'FFFFCC' },
            { header: 'Father Name', key: 'father_name', width: 30, color: 'FFFFCC' },
            { header: 'Mother Name', key: 'mother_name', width: 30, color: 'FFFFCC' },
            { header: 'Village', key: 'village', width: 20, color: 'FFFFCC' },
            { header: 'Gender(M,F)', key: 'gender', width: 15, color: 'FFFFCC' },
            { header: 'Aadhaar', key: 'aadhaar', width: 20, color: 'FFFFCC' },
            { header: 'Date of Birth', key: 'dob', width: 15, color: 'FFFFCC' },
            { header: 'Medium', key: 'medium', width: 15, color: 'FFFFCC' },
            { header: 'Home Address', key: 'home_address', width: 40, color: 'FFFFCC' },
            { header: 'Family Income', key: 'family_income_total', width: 20, color: 'FFFFCC' },
            
            // Group 2: Secondary Info - Green (#CCFFCC)
            { header: 'Father Occupation', key: 'father_occupation', width: 25, color: 'CCFFCC' },
            { header: 'Mother Occupation', key: 'mother_occupation', width: 25, color: 'CCFFCC' },
            { header: 'Father Education', key: 'father_education', width: 25, color: 'CCFFCC' },
            { header: 'Mother Education', key: 'mother_education', width: 25, color: 'CCFFCC' },
            { header: 'Household Size', key: 'household_size', width: 15, color: 'CCFFCC' },
            { header: 'Own House(Y,N)', key: 'own_house', width: 15, color: 'CCFFCC' },
            { header: 'Smart Phone at Home(Y,N)', key: 'smart_phone_home', width: 15, color: 'CCFFCC' },
            { header: 'Internet Facility at Home(Y,N)', key: 'internet_facility_home', width: 20, color: 'CCFFCC' },
            { header: 'Career Goals', key: 'career_goals', width: 30, color: 'CCFFCC' },
            { header: 'Subjects of Interest', key: 'subjects_of_interest', width: 30, color: 'CCFFCC' },
            { header: 'Transportation Mode', key: 'transportation_mode', width: 20, color: 'CCFFCC' },
            { header: 'Distance to School', key: 'distance_to_school', width: 15, color: 'CCFFCC' },
            { header: 'Number of Two Wheelers', key: 'num_two_wheelers', width: 20, color: 'CCFFCC' },
            { header: 'Number of Four Wheelers', key: 'num_four_wheelers', width: 20, color: 'CCFFCC' },
            { header: 'Irrigation Land', key: 'irrigation_land', width: 15, color: 'CCFFCC' },
            { header: 'Neighbor Name', key: 'neighbor_name', width: 20, color: 'CCFFCC' },
            { header: 'Neighbor Phone', key: 'neighbor_phone', width: 15, color: 'CCFFCC' },
            { header: 'Favorite Teacher Name', key: 'favorite_teacher_name', width: 25, color: 'CCFFCC' },
            { header: 'Favorite Teacher Phone', key: 'favorite_teacher_phone', width: 15, color: 'CCFFCC' },
            
            // Group 3: Exam Attendance - red (#FFFFCC)
            { header: 'Exam Appeared Y/N', key: 'pp_exam_appeared_yn', width: 20, color: 'FFCCCC' },
            
            // Group 4: Exam Results - Blue (#0000FF)
            { header: 'Exam Score', key: 'pp_exam_score', width: 18, color: 'CCFFFF' },
            { header: 'Exam cleared Y/N', key: 'pp_exam_cleared', width: 15, color: 'CCFFFF' },
            { header: 'Interview Required', key: 'interview_required_yn', width: 15, color: 'CCFFFF' }
        ];
        
        // Set worksheet columns
        worksheet.columns = columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width
        }));
        
        // Add header row with colors
        const headerRow = worksheet.getRow(1);
        columns.forEach((col, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.value = col.header;
            cell.font = {
                name: 'Calibri',
                family: 2,
                size: 11,
                bold: true,
                color: { argb: 'FF000000' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: col.color }
            };
            cell.alignment = { 
                vertical: 'middle', 
                horizontal: 'center',
                wrapText: true 
            };
        });
        
        // Add data rows
        students.forEach((student, rowIndex) => {
            const row = worksheet.addRow({
                applicant_id: student.applicant_id,
                student_name: student.student_name,
                father_name: student.father_name,
                mother_name: student.mother_name,
                village: student.village,
                gender: student.gender,
                aadhaar: student.aadhaar,
                dob: student.dob ? formatDateForExcel(student.dob) : null,
                medium: student.medium,
                home_address: student.home_address,
                family_income_total: student.family_income_total,
                father_occupation: student.father_occupation,
                mother_occupation: student.mother_occupation,
                father_education: student.father_education,
                mother_education: student.mother_education,
                household_size: student.household_size,
                own_house: student.own_house,
                smart_phone_home: student.smart_phone_home,
                internet_facility_home: student.internet_facility_home,
                career_goals: student.career_goals,
                subjects_of_interest: student.subjects_of_interest,
                transportation_mode: student.transportation_mode,
                distance_to_school: student.distance_to_school,
                num_two_wheelers: student.num_two_wheelers,
                num_four_wheelers: student.num_four_wheelers,
                irrigation_land: student.irrigation_land,
                neighbor_name: student.neighbor_name,
                neighbor_phone: student.neighbor_phone,
                favorite_teacher_name: student.favorite_teacher_name,
                favorite_teacher_phone: student.favorite_teacher_phone,
                pp_exam_appeared_yn: student.pp_exam_appeared_yn,
                pp_exam_score: student.pp_exam_score,
                pp_exam_cleared: student.pp_exam_cleared,
                interview_required_yn: student.interview_required_yn
            });
            
            // Apply specific formatting to each cell
            row.eachCell((cell, colNumber) => {
                // Basic formatting for all cells
                cell.font = {
                    name: 'Calibri',
                    size: 10
                };
                cell.alignment = {
                    vertical: 'middle',
                    wrapText: true
                };
                
                // Apply date formatting to DOB column (column 8)
                if (colNumber === 8 && cell.value) {
                    cell.numFmt = 'dd-mm-yyyy'; // Date format for Excel
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center'
                    };
                }
                
                // Format Family Income as currency (column 11)
                if (colNumber === 11 && cell.value !== null && cell.value !== undefined) {
                    cell.numFmt = '₹#,##0.00';
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'right'
                    };
                }
                
                // Format numeric columns (Exam Score, Distance, etc.)
                const numericColumns = [32, 23, 24, 25, 26]; // Exam Score, Distance, Num Two Wheelers, etc.
                if (numericColumns.includes(colNumber) && cell.value !== null && cell.value !== undefined) {
                    cell.numFmt = '0.00';
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'right'
                    };
                }
                
                // Format Y/N columns to be centered
                const ynColumns = [6, 17, 18, 19, 31, 33, 34]; // Gender, Own House, Smart Phone, etc.
                if (ynColumns.includes(colNumber) && cell.value !== null && cell.value !== undefined) {
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center'
                    };
                }
            });
        });
        
        // Add data validation for specific columns
        // Add dropdown for Gender column
        worksheet.getColumn(6).eachCell((cell, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['"M,F"']
                };
            }
        });
        
        // Add dropdown for Y/N columns
        const ynColumns = [17, 18, 19, 31, 33, 34]; // Own House, Smart Phone, Internet, Exam Appeared, Exam Cleared, Interview Required
        ynColumns.forEach(colNumber => {
            worksheet.getColumn(colNumber).eachCell((cell, rowNumber) => {
                if (rowNumber > 1) {
                    cell.dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: ['"Y,N"']
                    };
                }
            });
        });
        
        // Add calendar date picker hint for DOB column
        worksheet.getColumn(8).eachCell((cell, rowNumber) => {
            if (rowNumber > 1) {
                // Add a comment/hint about date format
                if (!cell.comment) {
                    cell.note = 'Double click for calendar or enter date as DD-MM-YYYY';
                }
            }
        });
        
        // Auto-fit columns
        worksheet.columns.forEach(column => {
            if (column.values && column.values.length > 1) {
                const lengths = column.values.map(v => v ? v.toString().length : 0);
                column.width = Math.min(Math.max(...lengths.filter(len => typeof len === 'number')) + 2, 50);
            }
        });
        
        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=students_${exam_name.replace(/[^a-z0-9]/gi, '_')}.xlsx`
        );
        
        // Send the file
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Excel generation error:', error);
        throw new ApiError(500, "Something went wrong while generating Excel file")
    }
});

// Helper function to format date for Excel
function formatDateForExcel(value) {
  if (!value) return null;

  try {
    // ✅ Excel serial number (most common issue)
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      return date.toISOString().split('T')[0];
    }

    // ✅ JS Date object
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    // ✅ String date
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed)) {
        return parsed.toISOString().split('T')[0];
      }
    }

    return null;
  } catch (err) {
    console.error('Invalid DOB:', value);
    return null;
  }
}


// You'll need to install moment.js for date parsing:
// npm install moment

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const BASE_PATH = process.env.FILE_STORAGE_PATH;

    if (!BASE_PATH) {
      return cb(new Error("FILE_STORAGE_PATH not set"), null);
    }

    const uploadDir = path.join(
      BASE_PATH,
      "Admission",
      "Evaluation"
    );

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});


const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB (optional)
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"), false);
    }
  }
});
    

const uploadBulkData = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet('Students');

    const secondaryInfoData = [];
    const examResultsData = [];
    const examAttendanceData = [];
    const eligibleStudents = [];
    const primaryInfoUpdates = [];
    const errors = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      try {
        const applicantId = parseInt(row.getCell(1).value);
        if (!Number.isFinite(applicantId)) {
          throw new Error('Invalid Applicant ID');
        }

        const studentName = safeString(row, 2);
        if (!studentName) {
          throw new Error('Student Name missing');
        }

        // ---- Primary Info ----
        primaryInfoUpdates.push({
          applicant_id: applicantId,
          father_name: safeString(row, 3),
          mother_name: safeString(row, 4),
          gender: safeString(row, 6),
          medium: safeString(row, 9),
          aadhaar: safeString(row, 7),
          dob: safeDate(row, 8),
          home_address: safeString(row, 10),
          family_income_total: safeFloat(row, 11) ?? 0
        });

        // ---- Numeric Safety ----
        const twoWheelers = Number(safeInt(row, 24));
        const fourWheelers = Number(safeInt(row, 25));
        const irrigation = Number(safeFloat(row, 26));
        const household = Number(safeInt(row, 16));

        // ---- Secondary Info ----
        secondaryInfoData.push({
          applicant_id: applicantId,
          village: safeString(row, 5),
          father_occupation: safeString(row, 12),
          mother_occupation: safeString(row, 13),
          father_education: safeString(row, 14),
          mother_education: safeString(row, 15),
          household_size: Number.isFinite(household) ? household : 0,
          own_house: safeYN(row, 17),
          smart_phone_home: safeYN(row, 18),
          internet_facility_home: safeYN(row, 19),
          career_goals: safeString(row, 20),
          subjects_of_interest: safeString(row, 21),
          transportation_mode: safeString(row, 22),
          distance_to_school: safeFloat(row, 23) ?? 0,
          num_two_wheelers: Number.isFinite(twoWheelers) ? twoWheelers : 0,
          num_four_wheelers: Number.isFinite(fourWheelers) ? fourWheelers : 0,
          irrigation_land: Number.isFinite(irrigation) ? irrigation : 0,
          neighbor_name: safeString(row, 27),
          neighbor_phone: safeString(row, 28),
          favorite_teacher_name: safeString(row, 29),
          favorite_teacher_phone: safeString(row, 30)
        });

        // ---- Exam ----
        const ppExamCleared = safeYN(row, 33);
        const interviewRequired = safeYN(row, 34);

        examResultsData.push({
          applicant_id: applicantId,
          pp_exam_score: safeFloat(row, 32) ?? 0,
          pp_exam_cleared: ppExamCleared,
          interview_required_yn: interviewRequired
        });

        examAttendanceData.push({
          applicant_id: applicantId,
          pp_exam_appeared_yn: safeYN(row, 31)
        });

        if (ppExamCleared === 'Y' && interviewRequired === 'N') {
          eligibleStudents.push({
            applicant_id: applicantId,
            student_name: studentName,
            father_name: safeString(row, 3),
            mother_name: safeString(row, 4),
            gender: safeString(row, 6),
            home_address: safeString(row, 10),
            father_occupation: safeString(row, 12),
            mother_occupation: safeString(row, 13),
            teacher_name: safeString(row, 29),
            teacher_mobile_number: safeString(row, 30)
          });
        }

      } catch (err) {
        errors.push({
          row: rowNumber,
          error: err.message
        });
      }
    });

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const result = await insertBulkData(
      primaryInfoUpdates,
      secondaryInfoData,
      examResultsData,
      examAttendanceData,
      eligibleStudents
    );

    res.status(200).json({
      message: 'Bulk upload successful',
      result
    });

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// Helper function to safely parse date
function safeDate(row, index) {
  const value = row.getCell(index).value;

  if (!value) return null;

  // Excel native date
  if (value instanceof Date) {
    return value;
  }

  // String date → convert safely
  if (typeof value === 'string') {
    const parts = value.split(/[-/]/);
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return new Date(`${yyyy}-${mm}-${dd}`);
    }
  }

  return null;
}



// Enhanced helper functions
function safeString(row, columnIndex, defaultValue = null) {
  try {
    const cell = row.getCell(columnIndex);
    if (!cell || cell.value === null || cell.value === undefined) {
      return defaultValue;
    }
    const value = cell.value.toString().trim();
    return value === '' ? defaultValue : value;
  } catch (error) {
    return defaultValue;
  }
}

function safeInt(row, columnIndex, defaultValue = 0) {
  try {
    const cell = row.getCell(columnIndex);
    if (!cell || cell.value === null || cell.value === undefined) {
      return defaultValue;
    }
    const value = parseInt(cell.value);
    return isNaN(value) ? defaultValue : value;
  } catch (error) {
    return defaultValue;
  }
}

function safeFloat(row, columnIndex, defaultValue = 0) {
  try {
    const cell = row.getCell(columnIndex);
    if (!cell || cell.value === null || cell.value === undefined) {
      return defaultValue;
    }
    const value = parseFloat(cell.value);
    return isNaN(value) ? defaultValue : value;
  } catch (error) {
    return defaultValue;
  }
}

function safeYN(row, columnIndex, defaultValue = 'N') {
  try {
    const cell = row.getCell(columnIndex);
    if (!cell || cell.value === null || cell.value === undefined) {
      return defaultValue;
    }
    const value = cell.value.toString().trim().toUpperCase();
    return (value === 'Y' || value === 'N') ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

module.exports ={
    fetchExamNames,
    fetchStudents,
    downloadStudentExcel,
    uploadBulkData,
     upload
}

