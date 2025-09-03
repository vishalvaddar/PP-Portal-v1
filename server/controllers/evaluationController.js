const {ApiError} = require('../utils/ApiError')
const {ApiResponse} = require('../utils/ApiResponse')
const {asyncHandler} =require('../utils/asyncHandler')
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');

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

         const examNameRow = worksheet.addRow([`Exam Name: ${exam_name}`]);
        examNameRow.font = {
            name: 'Calibri',
            family: 2,
            size: 12,
            bold: true,
            color: { argb: 'FF000000' } // Black text
        };
        examNameRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // Yellow background
        };
        examNameRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Add headers with all columns
        worksheet.columns = [
             { header: 'Applicant ID', key: 'applicant_id', width: 15 },
            { header: 'Student Name', key: 'student_name', width: 30 },
            { header: 'Exam Score', key: 'pp_exam_score', width: 18 },
            { header: 'Attendance', key: 'pp_exam_appeared_yn', width: 30 },
            { header: 'Village', key: 'village', width: 20 },
            { header: 'Father Occupation', key: 'father_occupation', width: 25 },
            { header: 'Mother Occupation', key: 'mother_occupation', width: 25 },
            { header: 'Father Education', key: 'father_education', width: 25 },
            { header: 'Mother Education', key: 'mother_education', width: 25 },
            { header: 'Household Size', key: 'household_size', width: 15 },
            { header: 'Own House', key: 'own_house', width: 10 },
            { header: 'Smart Phone at Home', key: 'smart_phone_home', width: 15 },
            { header: 'Internet Facility at Home', key: 'internet_facility_home', width: 20 },
            { header: 'Career Goals', key: 'career_goals', width: 30 },
            { header: 'Subjects of Interest', key: 'subjects_of_interest', width: 30 },
            { header: 'Transportation Mode', key: 'transportation_mode', width: 20 },
            { header: 'Distance to School', key: 'distance_to_school', width: 15 },
            { header: 'Number of Two Wheelers', key: 'num_two_wheelers', width: 20 },
            { header: 'Number of Four Wheelers', key: 'num_four_wheelers', width: 20 },
            { header: 'Irrigation Land', key: 'irrigation_land', width: 15 },
            { header: 'Neighbor Name', key: 'neighbor_name', width: 20 },
            { header: 'Neighbor Phone', key: 'neighbor_phone', width: 15 },
            { header: 'Favorite Teacher Name', key: 'favorite_teacher_name', width: 25 },
            { header: 'Favorite Teacher Phone', key: 'favorite_teacher_phone', width: 15 }
        ];
        
        // Add data
        students.forEach(student => {
            worksheet.addRow({
                applicant_id:student.applicant_id,
                student_name: student.student_name,
                pp_exam_score: student.pp_exam_score,
                pp_exam_appeared_yn:student.pp_exam_appeared_yn,
                village: student.village,
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
                favorite_teacher_phone: student.favorite_teacher_phone
            });
        });
        
        // Auto-fit columns (optional)
        worksheet.columns.forEach(column => {
            if (column.values && column.values.length > 1) {
                const lengths = column.values.map(v => v ? v.toString().length : 0);
                column.width = Math.max(...lengths.filter(len => typeof len === 'number')) + 2;
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
 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploadsinfo/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });



const uploadBulkData = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    const secondaryInfoData = [];
    const examResultsData = [];
    const examAttendance = [];
    const errors = [];

    // Updated column mapping with 1-based indexing
    const COLUMNS = {
      APPLICANT_ID: 1,    // A
      STUDENT_NAME: 2,     // B
      EXAM_SCORE: 3,       // C
      ATTENDANCE: 4,       // D
      VILLAGE: 5,          // E
      FATHER_OCCUPATION: 6, // F
      MOTHER_OCCUPATION: 7, // G
      FATHER_EDUCATION: 8,  // H
      MOTHER_EDUCATION: 9,  // I
      HOUSEHOLD_SIZE: 10,   // J
      OWN_HOUSE: 11,        // K
      SMART_PHONE_HOME: 12, // L
      INTERNET_FACILITY_HOME: 13, // M
      CAREER_GOALS: 14,     // N
      SUBJECTS_OF_INTEREST: 15, // O
      TRANSPORTATION_MODE: 16, // P
      DISTANCE_TO_SCHOOL: 17, // Q
      NUM_TWO_WHEELERS: 18,  // R
      NUM_FOUR_WHEELERS: 19, // S
      IRRIGATION_LAND: 20,   // T
      NEIGHBOR_NAME: 21,     // U
      NEIGHBOR_PHONE: 22,    // V
      FAV_TEACHER_NAME: 23,  // W
      FAV_TEACHER_PHONE: 24  // X
    };

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        try {
          // Validate required fields
          const applicantId = parseInt(row.getCell(COLUMNS.APPLICANT_ID).value);
          if (isNaN(applicantId)) {
            throw new Error(`Invalid Applicant ID at row ${rowNumber}`);
          }

          const studentName = row.getCell(COLUMNS.STUDENT_NAME).value?.toString();
          if (!studentName) {
            throw new Error(`Missing Student Name at row ${rowNumber}`);
          }

          // Prepare secondary info data with proper null handling
          const secondaryInfo = {
            applicant_id: applicantId,
            village: safeString(row, COLUMNS.VILLAGE),
            father_occupation: safeString(row, COLUMNS.FATHER_OCCUPATION),
            mother_occupation: safeString(row, COLUMNS.MOTHER_OCCUPATION),
            father_education: safeString(row, COLUMNS.FATHER_EDUCATION),
            mother_education: safeString(row, COLUMNS.MOTHER_EDUCATION),
            household_size: safeInt(row, COLUMNS.HOUSEHOLD_SIZE),
            own_house: safeYN(row, COLUMNS.OWN_HOUSE),
            smart_phone_home: safeYN(row, COLUMNS.SMART_PHONE_HOME),
            internet_facility_home: safeYN(row, COLUMNS.INTERNET_FACILITY_HOME),
            career_goals: safeString(row, COLUMNS.CAREER_GOALS),
            subjects_of_interest: safeString(row, COLUMNS.SUBJECTS_OF_INTEREST),
            transportation_mode: safeString(row, COLUMNS.TRANSPORTATION_MODE),
            distance_to_school: safeFloat(row, COLUMNS.DISTANCE_TO_SCHOOL),
            num_two_wheelers: safeInt(row, COLUMNS.NUM_TWO_WHEELERS, 0),
            num_four_wheelers: safeInt(row, COLUMNS.NUM_FOUR_WHEELERS, 0),
            irrigation_land: safeFloat(row, COLUMNS.IRRIGATION_LAND, 0),
            neighbor_name: safeString(row, COLUMNS.NEIGHBOR_NAME),
            neighbor_phone: safeString(row, COLUMNS.NEIGHBOR_PHONE),
            favorite_teacher_name: safeString(row, COLUMNS.FAV_TEACHER_NAME),
            favorite_teacher_phone: safeString(row, COLUMNS.FAV_TEACHER_PHONE)
          };

          secondaryInfoData.push(secondaryInfo);

          // Prepare exam results data
          examResultsData.push({
            applicant_id: applicantId,
            pp_exam_score: safeFloat(row, COLUMNS.EXAM_SCORE, 0)
          });

          // Prepare exam attendance data
          examAttendance.push({
            applicant_id: applicantId,
            pp_exam_appeared_yn: safeYN(row, COLUMNS.ATTENDANCE)
          });

        } catch (error) {
          errors.push({
            row: rowNumber,
            error: error.message,
            applicantId: row.getCell(COLUMNS.APPLICANT_ID).value,
            studentName: row.getCell(COLUMNS.STUDENT_NAME).value
          });
        }
      }
    });

    if (errors.length > 0) {
      console.error('Validation errors:', errors);
      
      // Generate error file content
      const errorContent = generateErrorFileContent(errors);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="upload_errors.txt"');
      res.setHeader('Content-Length', errorContent.length);
      
      // Send the error file
      res.status(400).send(errorContent);
      return;
    }

    // Insert data into database
    await insertBulkData(secondaryInfoData, examResultsData, examAttendance);

    res.status(200).json(new ApiResponse(200, {
      totalRecords: secondaryInfoData.length,
      failedRecords: errors.length,
      successRecords: secondaryInfoData.length - errors.length
    }, 'Data uploaded successfully'));

  } catch (error) {
    console.error('Bulk upload error:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle database errors and generate error file
    const errorContent = `Database Error: ${error.message}\n\nStack Trace:\n${error.stack}`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="database_error.txt"');
    res.setHeader('Content-Length', errorContent.length);
    
    res.status(500).send(errorContent);
  }
});

// Helper function to generate error file content
function generateErrorFileContent(errors) {
  let content = 'BULK UPLOAD ERROR REPORT\n';
  content += '========================\n\n';
  content += `Total Errors: ${errors.length}\n\n`;
  content += 'ERROR DETAILS:\n';
  content += '==============\n\n';

  errors.forEach((error, index) => {
    content += `Error ${index + 1}:\n`;
    content += `- Row Number: ${error.row}\n`;
    content += `- Applicant ID: ${error.applicantId || 'N/A'}\n`;
    content += `- Student Name: ${error.studentName || 'N/A'}\n`;
    content += `- Error Message: ${error.error}\n`;
    content += '----------------------------------------\n\n';
  });

  content += 'SUGGESTIONS:\n';
  content += '============\n';
  content += '1. Check that Applicant ID is a valid number\n';
  content += '2. Ensure Student Name is not empty\n';
  content += '3. Verify numeric fields contain only numbers\n';
  content += '4. Check that Y/N fields contain only "Y" or "N"\n';
  content += '5. Review all required fields are filled\n\n';
  content += 'Please correct these errors and try uploading again.';

  return content;
}

// Helper functions for safe data extraction
function safeString(row, colIndex) {
  const cell = row.getCell(colIndex);
  return cell.value ? cell.value.toString().trim() : null;
}

function safeInt(row, colIndex, defaultValue = null) {
  const cell = row.getCell(colIndex);
  if (cell.value === null || cell.value === undefined) return defaultValue;
  const num = parseInt(cell.value);
  return isNaN(num) ? defaultValue : num;
}

function safeFloat(row, colIndex, defaultValue = null) {
  const cell = row.getCell(colIndex);
  if (cell.value === null || cell.value === undefined) return defaultValue;
  const num = parseFloat(cell.value);
  return isNaN(num) ? defaultValue : num;
}

function safeYN(row, colIndex) {
  const val = safeString(row, colIndex);
  return val && val.toUpperCase() === 'Y' ? 'Y' : 'N';
}



module.exports ={
    fetchExamNames,
    fetchStudents,
    downloadStudentExcel,
    uploadBulkData,
     upload
}

const handleBulkUpload = async (selectedFile) => {
  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await axios.post('/evaluation/upload-bulk', formData, {
      responseType: 'blob' // Important for file downloads
    });

    // Success case
    console.log('Upload successful:', response.data);

  } catch (error) {
    if (error.response && error.response.data instanceof Blob) {
      // Handle error file download
      const blob = new Blob([error.response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'upload_errors.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Upload failed. Please check the error file for details.');
    } else {
      alert('Upload failed: ' + error.message);
    }
  }
};