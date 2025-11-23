
const {getDivisionsByState,getEducationDistrictsByDivision,getBlocksByDistrict} = require('../models/resultandrankingModel')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pool = require("../config/db");
const ExcelJS = require("exceljs");


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

const searchResults = async (req, res) => {
  try {
    const { division, education_district, blocks } = req.body;

    if (!division || !education_district || !blocks || blocks.length === 0) {
      return res.status(400).json({ message: "Missing filters" });
    }

    const query = `
      SELECT 
          i.nmms_reg_number AS "NMMS Number",
          i.student_name AS "Student Name",
          i.father_name AS "Father Name",
          i.gmat_score AS "GMAT Score",
          i.sat_score AS "SAT Score",
          i.contact_no1 AS "Contact Number",
          i.current_institute_dise_code AS "School DISE Code",
          s.institute_name AS "School Name",
          i.medium AS "Medium",
          er.pp_exam_score AS "Marks",
          sc.criteria AS "Shortlist Criteria"
      FROM 
          pp.applicant_primary_info i
      JOIN 
          pp.exam_results er ON i.applicant_id = er.applicant_id
      JOIN 
          pp.jurisdiction dis ON dis.juris_code = i.district
      JOIN 
          pp.jurisdiction blk ON blk.juris_code = i.nmms_block
      JOIN 
          pp.jurisdiction div ON div.juris_code = dis.parent_juris
      JOIN 
          pp.applicant_shortlist_info asi ON asi.applicant_id = i.applicant_id
      JOIN 
          pp.shortlist_batch sb ON sb.shortlist_batch_id = asi.shortlist_batch_id
      JOIN 
          pp.shortlist_criteria sc ON sc.criteria_id = sb.criteria_id
      JOIN 
          pp.institute s ON s.dise_code = i.current_institute_dise_code
      WHERE 
          div.juris_code = $1
          AND i.district = $2
          AND i.nmms_block = ANY($3::numeric[]);
    `;

    const values = [division, education_district, blocks];
    const { rows } = await pool.query(query, values);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ message: "Server error" });
  }
};


function calcPercentRank(list, value) {
  const arr = [...list].sort((a, b) => a - b);
  const n = arr.length;

  if (value <= arr[0]) return 0;
  if (value >= arr[n - 1]) return 100;

  let index = arr.findIndex(v => v >= value);

  const lowerValue = arr[index - 1];
  const upperValue = arr[index];

  const fraction = (value - lowerValue) / (upperValue - lowerValue);

  return ((index - 1 + fraction) / (n - 1)) * 100;
}

const downloadtheresult = async (req, res) => {
  try {
    const { division, district, blocks } = req.body;

    const query = `
      SELECT
        blk.juris_name AS block_name,
        i.nmms_reg_number,
        i.student_name,
        i.father_name,
        i.gmat_score,
        i.sat_score,
        (i.gmat_score + i.sat_score) AS total_score,
        (i.gmat_score * 0.7 + i.sat_score * 0.3) AS wc_score,
        er.pp_exam_score AS marks,
        i.contact_no1 AS contact_number,
        i.current_institute_dise_code AS school_dise_code,
        i.medium,
        s.institute_name AS school_name
      FROM pp.applicant_primary_info i
      JOIN pp.exam_results er ON er.applicant_id = i.applicant_id
      JOIN pp.jurisdiction blk ON blk.juris_code = i.nmms_block
      JOIN pp.institute s ON s.dise_code = i.current_institute_dise_code
      WHERE i.nmms_block = ANY($1::numeric[])
      ORDER BY blk.juris_name, i.student_name
    `;

    const { rows } = await pool.query(query, [blocks]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Extract marks for percentile calculation
    const marksList = rows.map(r => Number(r.marks));

    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Results");

    const headers = [
      "Block Name",
      "NMMS Number",
      "Student Name",
      "Father Name",
      "GMAT",
      "SAT",
      "Total",
      "WC Score",
      "Percentile Rank",
      "Marks",
      "Contact Number",
      "School DISE Code",
      "Medium",
      "School Name"
    ];

    sheet.addRow(headers);
    sheet.getRow(1).eachCell(c => (c.font = { bold: true }));

    rows.forEach(r => {
      const pr = calcPercentRank(marksList, Number(r.marks));

      sheet.addRow([
        r.block_name,
        r.nmms_reg_number,
        r.student_name,
        r.father_name,
        r.gmat_score,
        r.sat_score,
        r.total_score,
        r.wc_score,
        Number(pr.toFixed(2)),   // percentile rank
        r.marks,
        r.contact_number,
        r.school_dise_code,
        r.medium,
        r.school_name
      ]);
    });

    // Auto column width
    sheet.columns.forEach(col => {
      let max = 15;
      col.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > max) max = length;
      });
      col.width = max + 2;
    });

    // Friendly file name using block names
    const blockNames = [...new Set(rows.map(x => x.block_name))];
    const cleanName = blockNames.join("_").replace(/[\s/]/g, "_");
    const fileName = `${cleanName}.xlsx`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Excel error:", error);
    return res.status(500).json({ message: "Failed to generate excel" });
  }
};







module.exports ={
    fetchDivisionsByState,
    fetchEducationDistrictsByDivision,
    fetchBlocksByDistrict,
    searchResults,
    downloadtheresult
}