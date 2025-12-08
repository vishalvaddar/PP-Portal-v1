const {
  getDivisionsByState,
  getEducationDistrictsByDivision,
  getBlocksByDistrict,
  getAllExams,
  searchStudentsByBlocks,
  searchStudentsByExam
} = require('../models/resultandrankingModel');
const ExcelJS = require("exceljs");
const pool = require("../config/db");

// Fetch Divisions by State
const fetchDivisionsByState = async (req, res) => {
  try {
    const { stateId } = req.params;
    const divisions = await getDivisionsByState(stateId);
    res.json(divisions);
  } catch (error) {
    console.error("Error fetching divisions:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Education Districts by Division
const fetchEducationDistrictsByDivision = async (req, res) => {
  try {
    const { divisionId } = req.params;
    const eduDistricts = await getEducationDistrictsByDivision(divisionId);
    res.json(eduDistricts);
  } catch (error) {
    console.error("Error fetching education districts:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Blocks by Education District
const fetchBlocksByDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;
    const blocks = await getBlocksByDistrict(districtId);
    res.json(blocks);
  } catch (error) {
    console.error("Error fetching blocks:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch All Exams
const fetchAllExams = async (req, res) => {
  try {
    const exams = await getAllExams();
    res.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Search by Blocks
const searchByBlocks = async (req, res) => {
  try {
    const { division, education_district, blocks, app_state = 1 } = req.body;
    
    const results = await searchStudentsByBlocks(division, education_district, blocks, app_state);
    res.json(results);
  } catch (error) {
    console.error("Error in searchByBlocks:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Search by Exam
const searchByExam = async (req, res) => {
  try {
    const { exam_id } = req.body;
    
    if (!exam_id) {
      return res.status(400).json({ message: "Exam ID is required" });
    }
    
    const results = await searchStudentsByExam(exam_id);
    res.json(results);
  } catch (error) {
    console.error("Error in searchByExam:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const { field } = req.params;
    
    let query = '';
    switch(field) {
      case 'interview_status':
        query = `SELECT DISTINCT status as value FROM pp.student_interview WHERE status IS NOT NULL`;
        break;
      case 'interview_result':
        query = `SELECT DISTINCT interview_result as value FROM pp.student_interview WHERE interview_result IS NOT NULL`;
        break;
      case 'verification_status':
        query = `SELECT DISTINCT status as value FROM pp.home_verification WHERE status IS NOT NULL`;
        break;
      case 'pp_exam_cleared':
        query = `SELECT DISTINCT pp_exam_cleared as value FROM pp.exam_results WHERE pp_exam_cleared IS NOT NULL`;
        break;
      default:
        return res.json([]);
    }
    
    const result = await pool.query(query);
    const values = result.rows.map(row => row.value);
    res.json(values);
  } catch (error) {
    console.error("Error fetching filter options:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// PercentRank.INC implementation
function calcPercentRank(list, value) {
  if (!list || list.length === 0) return 0;
  
  const arr = [...list].sort((a, b) => a - b);
  const n = arr.length;

  if (value <= arr[0]) return 0;
  if (value >= arr[n - 1]) return 100;

  let index = arr.findIndex(v => v >= value);
  
  // Handle edge case where value is smaller than all elements
  if (index === -1) return 0;
  // Handle edge case where value is the first element
  if (index === 0) return 0;

  const lowerValue = arr[index - 1];
  const upperValue = arr[index];
  const fraction = (value - lowerValue) / (upperValue - lowerValue);

  return ((index - 1 + fraction) / (n - 1)) * 100;
}

// Download by Blocks
const downloadByBlocks = async (req, res) => {
  try {
    const { division, district, blocks, app_state = 1 } = req.body;

    const results = await searchStudentsByBlocks(division, district, blocks, app_state);

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Results");

    // Define headers
    const headers = [
      "Applicant ID",
      "NMMS Number",
      "Student Name",
      "Father Name",
      "GMAT Score",
      "SAT Score",
      "PP Exam Score",
      "PP Exam Cleared",
      "Interview Status",
      "Interview Result",
      "Interview Remarks",
      "Verification Status",
      "Verification Remarks",
      "Rejection Reasons",
      "Contact Number",
      "School DISE Code",
      "Medium",
      "School Name",
      "Division",
      "District",
      "Block"
    ];

    sheet.addRow(headers);
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
    });

    // Add data rows
    results.forEach(result => {
      const gmat = Number(result.gmat_score || 0);
      const sat = Number(result.sat_score || 0);
      const marks = Number(result.pp_exam_score || 0);

      sheet.addRow([
        result.applicant_id,
        result.nmms_reg_number,
        result.student_name,
        result.father_name,
        gmat,
        sat,
        marks,
        result.pp_exam_cleared || 'N/A',
        result.interview_status || 'N/A',
        result.interview_result || 'N/A',
        result.interview_remarks || 'N/A',
        result.verification_status || 'N/A',
        result.verification_remarks || 'N/A',
        result.rejection_reasons || 'N/A',
        result.contact_no1,
        result.current_institute_dise_code,
        result.medium,
        result.school_name,
        result.division_name || 'N/A',
        result.district_name || 'N/A',
        result.block_name || 'N/A'
      ]);
    });

    // Auto column width
    sheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 15), 50);
    });

    // Generate filename based on search criteria
    let fileName = "results";
    
    // Get unique division, district, and block names from results
    const uniqueDivisions = [...new Set(results.map(r => r.division_name).filter(Boolean))];
    const uniqueDistricts = [...new Set(results.map(r => r.district_name).filter(Boolean))];
    const uniqueBlocks = [...new Set(results.map(r => r.block_name).filter(Boolean))];
    
    if (division) {
      const divisionName = uniqueDivisions.length > 0 ? 
        uniqueDivisions[0].replace(/[^\w\s]/gi, '').replace(/\s+/g, '_') : 
        'Division_' + division;
      fileName += `_${divisionName}`;
    } else {
      fileName += '_All_Divisions';
    }
    
    if (district) {
      const districtName = uniqueDistricts.length > 0 ? 
        uniqueDistricts[0].replace(/[^\w\s]/gi, '').replace(/\s+/g, '_') : 
        'District_' + district;
      fileName += `_${districtName}`;
    } else {
      fileName += '_All_Districts';
    }
    
    if (blocks && blocks.length > 0) {
      if (uniqueBlocks.length === 1) {
        fileName += `_${uniqueBlocks[0].replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}`;
      } else if (uniqueBlocks.length > 1) {
        fileName += `_${uniqueBlocks.length}_Blocks`;
      } else {
        fileName += '_Selected_Blocks';
      }
    } else {
      fileName += '_All_Blocks';
    }
    
    fileName += '.xlsx';
    
    // Clean filename
    fileName = fileName.replace(/_+/g, '_');

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Excel generation error:", error);
    return res.status(500).json({ message: "Failed to generate excel file" });
  }
};

// Download by Exam
const downloadByExam = async (req, res) => {
  try {
    const { exam_id } = req.body;

    if (!exam_id) {
      return res.status(400).json({ message: "Exam ID is required" });
    }

    const results = await searchStudentsByExam(exam_id);

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found for this exam" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Exam Results");

    // Define headers
    const headers = [
      "Applicant ID",
      "NMMS Number",
      "Student Name",
      "Father Name",
      "GMAT Score",
      "SAT Score",
      "PP Exam Score",
      "PP Exam Cleared",
      "Interview Status",
      "Interview Result",
      "Interview Remarks",
      "Verification Status",
      "Verification Remarks",
      "Rejection Reasons",
      "Contact Number",
      "School DISE Code",
      "Medium",
      "School Name",
      "Division",
      "District",
      "Block",
      "Exam Name",
      "Exam Date"
    ];

    sheet.addRow(headers);
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F5E6' }
      };
    });

    // Add data rows
    results.forEach(result => {
      const gmat = Number(result.gmat_score || 0);
      const sat = Number(result.sat_score || 0);
      const marks = Number(result.pp_exam_score || 0);

      sheet.addRow([
        result.applicant_id,
        result.nmms_reg_number,
        result.student_name,
        result.father_name,
        gmat,
        sat,
        marks,
        result.pp_exam_cleared || 'N/A',
        result.interview_status || 'N/A',
        result.interview_result || 'N/A',
        result.interview_remarks || 'N/A',
        result.verification_status || 'N/A',
        result.verification_remarks || 'N/A',
        result.rejection_reasons || 'N/A',
        result.contact_no1,
        result.current_institute_dise_code,
        result.medium,
        result.school_name,
        result.division_name || 'N/A',
        result.district_name || 'N/A',
        result.block_name || 'N/A',
        result.exam_name || 'N/A',
        result.exam_date ? new Date(result.exam_date).toLocaleDateString() : 'N/A'
      ]);
    });

    // Auto column width
    sheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 15), 50);
    });

    // Generate filename based on exam
    let fileName = "results";
    
    if (results.length > 0 && results[0].exam_name) {
      const examName = results[0].exam_name
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_')
        .slice(0, 50); // Limit length
      fileName += `_${examName}`;
    } else {
      fileName += '_Exam';
    }
    
    // Add exam date if available
    if (results.length > 0 && results[0].exam_date) {
      const examDate = new Date(results[0].exam_date);
      const dateStr = examDate.toISOString().split('T')[0].replace(/-/g, '_');
      fileName += `_${dateStr}`;
    }
    
    fileName += '.xlsx';
    
    // Clean filename
    fileName = fileName.replace(/_+/g, '_');

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Excel generation error:", error);
    return res.status(500).json({ message: "Failed to generate excel file" });
  }
};

module.exports = {
  fetchDivisionsByState,
  fetchEducationDistrictsByDivision,
  fetchBlocksByDistrict,
  fetchAllExams,
  searchByBlocks,
  searchByExam,
  downloadByBlocks,
  downloadByExam,
  getFilterOptions,
};