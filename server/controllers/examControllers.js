

const {
    getExamCentres,
    addExamCentre,
    deleteExamCentre,
    getUsedBlocks,
    getAllExams,
    getAllExamsnotassigned,
    deleteExamById,

    //locatiions
    getDivisionsByState,
  getEducationDistrictsByDivision,
  getBlocksByDistrict,
  getClustersByBlock,
  getexamcentresview
} = require('../models/examModels');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const archiver = require('archiver');
const pool = require("../config/db");
const stream = require("stream");

// Helper function to generate hall ticket number
// function generateHallTicket(applicantId) {
//     return `25${applicantId}`;
// }

// Exam Centre Controllers
const fetchExamCentres = async (req, res) => {
    try {
        const centres = await getExamCentres();
        res.status(200).json(centres);
    } catch (error) {
        console.error("Error fetching exam centres:", error);
        res.status(500).json({ error: "Failed to fetch exam centres" });
    }
};

const createExamCentre = async (req, res) => {
  const {
    pp_exam_centre_code,
    pp_exam_centre_name,
    address,
    village,
    pincode,
    contact_person,
    contact_phone,
    contact_email,
    sitting_capacity,
    latitude,
    longitude,
    created_by,
  } = req.body;

  if (!pp_exam_centre_name?.trim()) {
    return res.status(400).json({ message: "Centre name is required." });
  }

  if (pp_exam_centre_name.length > 100) {
    return res.status(400).json({ message: "Centre name too long (max 100 characters)." });
  }

  if (pp_exam_centre_code && pp_exam_centre_code.length > 20) {
    return res.status(400).json({ message: "Centre code too long (max 20 characters)." });
  }

  if (pincode && !/^\d{5,12}$/.test(pincode)) {
    return res.status(400).json({ message: "Invalid pincode." });
  }

  if (contact_phone && !/^\d{7,12}$/.test(contact_phone)) {
    return res.status(400).json({ message: "Invalid contact phone number." });
  }

  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  try {
    const result = await addExamCentre({
      pp_exam_centre_code,
      pp_exam_centre_name,
      address,
      village,
      pincode,
      contact_person,
      contact_phone,
      contact_email,
      sitting_capacity,
      latitude,
      longitude,
      created_by,
    });
    return res.status(201).json(result);
  } catch (error) {
    console.error("Insert error:", error);
    if (error.code === '23505') {
      return res.status(409).json({ message: "Duplicate entry (email, phone, or code already exists)." });
    }
    return res.status(500).json({ message: "Failed to create centre" });
  }
};


const removeExamCentre = async (req, res) => {
    const id = req.params.id;
    try {
        await deleteExamCentre(id);
        res.status(204).send();
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Failed to delete centre" });
    }
};

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

// Fetch Clusters by Block
const fetchClustersByBlock = async (req, res) => {
  try {
    const { blockId } = req.params;
    const clusters = await getClustersByBlock(blockId);
    res.json(clusters);
  } catch (error) {
    console.error("Error fetching clusters:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchUsedBlocks = async (req, res) => {
    try {
        const { blockId } = req.query;
        const usedBlocks = await getUsedBlocks(blockId);
        res.json(usedBlocks);
    } catch (error) {
        console.error("Error fetching used blocks:", error);
        res.status(500).json({ error: "Failed to fetch used blocks" });
    }
};

// Exam Controllers
const fetchAllExamsnotassigned = async (req, res) => {
    try {
        const exams = await getAllExamsnotassigned();
        res.json(exams);
    } catch (error) {
        console.error("Error fetching exams:", error);
        res.status(500).json({ message: "Failed to fetch exams" });
    }
};
const fetchAllExams = async (req, res) => {
    try {
        const exams = await getAllExams();
        res.json(exams);
    } catch (error) {
        console.error("Error fetching exams:", error);
        res.status(500).json({ message: "Failed to fetch exams" });
    }
};

const deleteExam = async (req, res) => {
    const examId = req.params.examId;
    try {
        await deleteExamById(examId);
        res.status(200).json({ message: "Exam and related data deleted successfully" });
    } catch (error) {
        console.error("Error deleting exam:", error);
        res.status(500).json({ message: "Failed to delete exam" });
    }
};

// Generate a simple hall ticket number
function generateHallTicket(sequenceNumber, juris_code) {
  if (!juris_code || sequenceNumber === undefined) {
    console.error("Invalid data:", { sequenceNumber, juris_code });
    throw new Error("Missing required values for hall ticket generation");
  }

  // ✅ 1. Get CURRENT year dynamically
  const currentYear = new Date().getFullYear();   // e.g. 2026
  const yearSuffix = currentYear.toString().slice(-2); // → 26

  // ✅ 2. Block → last 2 digits (2901 → 01)
  const jurisLast2 = juris_code.toString().slice(-2).padStart(2, '0');

  // ✅ 3. Sequential number (0001, 0002...)
  const sequence = sequenceNumber.toString().padStart(4, '0');

  return `${yearSuffix}${jurisLast2}${sequence}`;
}

 async function createExamAndAssignApplicants(req, res) {
    const { centreId, Exam_name, date, district, blocks } = req.body;

    if (!centreId || !Exam_name || !date || !district || !blocks || blocks.length === 0) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // ✅ Only insert into examination table using the passed centreId
      const examInsertResult = await client.query(`
        INSERT INTO pp.examination (exam_name, exam_date, pp_exam_centre_id)
        VALUES ($1, $2, $3)
        RETURNING exam_id
      `, [Exam_name, date, centreId]);

      const examId = examInsertResult.rows[0].exam_id;

      // ✅ Fetch shortlisted applicants
      // Modify the query in createExamAndAssignApplicants
      const applicantsResult = await client.query(`
        SELECT DISTINCT api.applicant_id
          FROM pp.applicant_primary_info api
          JOIN pp.applicant_shortlist_info si
            ON api.applicant_id = si.applicant_id
          WHERE api.nmms_block = ANY($1)
            AND si.shortlisted_yn = 'Y'
      `, [blocks]);
      

      const applicants = applicantsResult.rows;

      if (applicants.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "No applicants found for the selected blocks." });
      }

      // ✅ Generate PDFs and prepare entries
      const applicantExams = [];

      for (const applicant of applicants) {
        const hallTicketNo = generateHallTicket(applicant.applicant_id, examId);

        const doc = new PDFDocument();
        const dirPath = path.join(__dirname, `../public/halltickets`);
        const pdfPath = path.join(dirPath, `hall_ticket_${applicant.applicant_id}_${applicant.blocks}.pdf`);
        // const pdfPath = path.join(dirPath, `hall_ticket_${applicant.applicant_id}_${applicant.blocks}.pdf`);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        doc.fontSize(20).text('Hall Ticket', { align: 'center' });
        doc.moveDown();
        doc.text(`hall ticket No.: ${hallTicketNo}`)
        doc.fontSize(12).text(`Name: ${applicant.student_name}`);
        doc.text(`Father Name: ${applicant.father_name}`);
        doc.text(`Mother Name: ${applicant.mother_name}`);
        doc.text(`DOB: ${new Date(applicant.dob).toLocaleDateString()}`);
        doc.text(`Aadhaar: ${applicant.aadhaar}`);
        doc.text(`School Dise Code: ${applicant.current_institute_dise_code}`);
        doc.text(`Phone No 1: ${applicant.contact_no1}`);
        doc.text(`Phone No 2: ${applicant.contact_no2}`);
      

        doc.end();

        applicantExams.push({
          applicant_id: applicant.applicant_id,
          exam_id: examId,
          hall_ticket_no: hallTicketNo,
        });
      }

      // ✅ Insert applicant exams into database
      for (const a of applicantExams) {
        await client.query(`
          INSERT INTO pp.applicant_exam (applicant_id, exam_id, pp_hall_ticket_no)
          VALUES ($1, $2, $3)
        `, [a.applicant_id, a.exam_id, a.hall_ticket_no]);
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Exam created and applicants assigned successfully ✅",
        examId: examId,//need to send the centre name and district name and block anme not its it 
        applicants: applicants.map(applicant => ({
          applicant_id: applicant.applicant_id,
          applicant_name: applicant.student_name, // 👈 Add this line
          hall_ticket_url: `/halltickets/hall_ticket_${applicant.applicant_id}.pdf`
        }))
      });
      

    } catch (error) {
      await client.query("ROLLBACK");
      console.error(error);
      res.status(500).json({ message: "Server error.", error: error.message });
    } finally {
      client.release();
    }
  }

  //done dusted

async function generateStudentList(req, res) {
  try {
    const examId = req.params.examId;
    
    // ✅ Fetch exam + student + institute data + block name
    const result = await pool.query(`
      SELECT 
        ae.pp_hall_ticket_no, 
        api.student_name,
        i.dise_code, 
        i.institute_name, 
        api.contact_no1, 
        api.contact_no2,
        ee.exam_name, 
        ee.exam_date,
        ee.exam_start_time,
        ee.exam_end_time,
        ec.pp_exam_centre_name,
        api.nmms_reg_number,
        j.juris_name as block_name,
        ROW_NUMBER() OVER (ORDER BY api.student_name) as sl_no
      FROM pp.examination ee
      JOIN pp.applicant_exam ae ON ee.exam_id = ae.exam_id
      JOIN pp.applicant_primary_info api ON ae.applicant_id = api.applicant_id
      JOIN pp.pp_exam_centre ec ON ee.pp_exam_centre_id = ec.pp_exam_centre_id
      LEFT JOIN pp.institute i ON api.current_institute_dise_code = i.dise_code
      LEFT JOIN pp.jurisdiction j ON api.nmms_block = j.juris_code
      WHERE ae.exam_id = $1
      ORDER BY api.student_name
    `, [examId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No students found for this exam." });
    }

    // ---------------- STORAGE PATH ----------------
    const BASE_PATH = process.env.FILE_STORAGE_PATH;
    if (!BASE_PATH) throw new Error("FILE_STORAGE_PATH not set");

    const excelDir = path.join(
      BASE_PATH,
      "Admission",
      "Exam",
      "callinglists"
    );

    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true });
    }

    // Format exam name for filename
    const examName = result.rows[0].exam_name.replace(/\s+/g, '_');
    const fileName = `${examName}_Calling_List.xlsx`;
    const filePath = path.join(excelDir, fileName);

    // ✅ Format date function
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    // ✅ Prepare data for Excel
    const examInfo = result.rows[0];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Create header rows for exam information
    const examInfoData = [
      ['STUDENT CALLING LIST'],
      [],
      ['Exam Name:', examInfo.exam_name],
      ['Exam Date:', formatDate(examInfo.exam_date)],
      ['Exam Time:', `${examInfo.exam_start_time} - ${examInfo.exam_end_time}`],
      ['Exam Centre:', examInfo.pp_exam_centre_name],
      ['Generated on:', new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      [],
      []
    ];
    
    // Prepare student data with columns:
    // 1. Serial Number
    // 2. NMMS Registration Number
    // 3. Hall Ticket Number
    // 4. Student Name
    // 5. School Name
    // 6. Block Name
    // 7. Contact No. 1
    // 8. Contact No. 2
    
    const studentData = result.rows.map((row, index) => [
      index + 1,                                    // Serial Number
      row.nmms_reg_number || '',                    // NMMS Registration Number
      row.pp_hall_ticket_no || '',                  // Hall Ticket Number
      row.student_name || '',                       // Student Name
      row.institute_name || '',                     // School Name
      row.block_name || '',                         // Block Name
      row.contact_no1 || '',                        // Contact No. 1
      row.contact_no2 || ''                         // Contact No. 2
    ]);
    
    // Add headers for student data
    const headers = [
      'Sl. No.',
      'NMMS Reg. No.',
      'Hall Ticket No.',
      'Student Name',
      'School Name',
      'Block Name',
      'Contact No. 1',
      'Contact No. 2'
    ];
    
    // Combine all data
    const worksheetData = [
      ...examInfoData,
      headers,
      ...studentData,
      [],
      [`Total Students: ${result.rows.length}`]
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const colWidths = [
      { wch: 8 },   // Sl. No.
      { wch: 15 },  // NMMS Reg. No.
      { wch: 15 },  // Hall Ticket No.
      { wch: 25 },  // Student Name
      { wch: 35 },  // School Name
      { wch: 20 },  // Block Name
      { wch: 15 },  // Contact No. 1
      { wch: 15 }   // Contact No. 2
    ];
    worksheet['!cols'] = colWidths;
    
    // Style the header row (optional)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: 9, c: C })]; // Row 10 is headers (0-indexed)
      if (headerCell) {
        headerCell.s = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "D4F1D4" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Calling List');
    
    // Write to file
    XLSX.writeFile(workbook, filePath);
    
    // Send file for download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        // Don't delete file if there's an error, just log it
      }
      // Optional: Delete file after download to clean up
      // fs.unlinkSync(filePath);
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate Excel file", error: err.message });
  }
}


// async function generateStudentList(req, res)
async function downloadAllHallTickets(req, res) {
  const { examId, exam_name } = req.params;

  try {
    // ---------------- ENV BASED STORAGE ----------------
    const BASE_PATH = process.env.FILE_STORAGE_PATH;
    if (!BASE_PATH) {
      throw new Error("FILE_STORAGE_PATH not set in environment");
    }

    const hallTicketDir = path.join(
      BASE_PATH,
      "Admission",
      "Exam",
      "halltickets"
    );

    if (!fs.existsSync(hallTicketDir)) {
      fs.mkdirSync(hallTicketDir, { recursive: true });
    }

    // ---------------- STATIC ASSETS ----------------
    // These should stay INSIDE your project
    const assetsBase = path.join(__dirname, "../public");

   const logoLeftPath = path.join(assetsBase, "assets/rcf_logo-removebg-preview.png");
const logoRightPath = path.join(assetsBase, "assets/logo.png");
const kannadaFontPath = path.join(assetsBase, "fonts/NotoSansKannada-Regular.ttf");
const authoritySignaturePath = path.join(assetsBase, "assets/ravi_sir_sign-removebg-preview.png");
const stamplogo = path.join(assetsBase, "assets/rcf_stamp-removebg-preview.png");


    const requiredFiles = [
      logoLeftPath,
      logoRightPath,
      kannadaFontPath,
      authoritySignaturePath,
      stamplogo
    ];

    for (const f of requiredFiles) {
      if (!fs.existsSync(f)) {
        throw new Error(`Missing required file: ${f}`);
      }
    }

    // ---------------- SANITIZE ----------------
    const sanitizeFilename = (name) =>
      name ? name.replace(/[<>:"/\\|?*]/g, "_").substring(0, 100) : "unknown";

    // ---------------- ZIP SETUP ----------------
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=All_Hall_Tickets_${examId}_${sanitizeFilename(exam_name)}.zip`
    );
    res.setHeader("Content-Type", "application/zip");

    archive.pipe(res);

    archive.on("error", (err) => {
      throw err;
    });

    // ---------------- FETCH STUDENTS ----------------
    const result = await pool.query(
      `
     SELECT 
    ae.pp_hall_ticket_no,
    api.student_name,
    api.district AS juris_code,   -- ✅ ADD THIS
    ec.pp_exam_centre_name,
    e.exam_date,
    e.exam_name,
    e.exam_start_time,
    e.exam_end_time,
    ec.latitude,
    ec.address,
    ec.village,
    ec.pincode,
    ec.longitude
      FROM pp.applicant_exam ae
      JOIN pp.applicant_primary_info api ON ae.applicant_id = api.applicant_id
      JOIN pp.examination e ON ae.exam_id = e.exam_id
      JOIN pp.pp_exam_centre ec ON e.pp_exam_centre_id = ec.pp_exam_centre_id
      WHERE ae.exam_id = $1
      `,
      [examId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No hall tickets found" });
    }

    const tempFiles = [];

    // ---------------- GENERATE PDFs ----------------
    for (const student of result.rows) {
      const safeStudentName = sanitizeFilename(student.student_name);
      const safeHallTicket = sanitizeFilename(student.pp_hall_ticket_no);

      const pdfPath = path.join(
        hallTicketDir,
        `${safeStudentName}_${safeHallTicket}.pdf`
      );

      tempFiles.push(pdfPath);

      await generateStudentPDF(student, pdfPath, {
        logoLeftPath,
        logoRightPath,
        kannadaFontPath,
        authoritySignaturePath,
        stamplogo
      });

      archive.file(pdfPath, {
        name: `${safeStudentName}_${safeHallTicket}.pdf`
      });
    }

    // ---------------- CLEANUP ----------------
    archive.on("end", () => {
      tempFiles.forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    });

    await archive.finalize();

  } catch (error) {
    console.error("Hall ticket ZIP error:", error);
    res.status(500).json({
      message: "Failed to download hall tickets",
      error: error.message
    });
  }
}

// Helper function to generate individual student PDF //CORE PDF ONLY
function generateStudentPDF(student, ticketPath, assets) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: "A4", 
        margin: 50,
        lang: 'kn'
      });

      const stream = fs.createWriteStream(ticketPath);
      doc.pipe(stream);

      // B&W Color Scheme
      const primaryColor = '#000000';
      const secondaryColor = '#333333';

      // Add outer border with uniform padding
      const outerPadding = 20; // Uniform padding for all sides
      doc.rect(outerPadding, outerPadding, 595.28 - (2 * outerPadding), 841.89 - (2 * outerPadding))
         .stroke(primaryColor)
         .lineWidth(1.5);

      // Header with white background
      doc.rect(50, 50, 500, 80)
         .fill('white')
         .stroke(primaryColor).lineWidth(0.5);
      
      const headerY = 60;
      const logoWidth = 80; // Increased from 60 to 70
      const logoHeight = 80; // Added height for better control
      
      // Left logo - increased size
      if (fs.existsSync(assets.logoLeftPath)) {
        doc.image(assets.logoLeftPath, 50, headerY - 10, { 
          width: logoWidth,
          height: logoHeight,
          fit: [logoWidth, logoHeight],
          colorspace: 'gray'
        });
      }

      // Right logo - increased size
      if (fs.existsSync(assets.logoRightPath)) {
        doc.image(assets.logoRightPath, 500 - logoWidth + 55, headerY - 10, { 
          width: logoWidth,
          height: logoHeight,
          fit: [logoWidth, logoHeight],
          colorspace: 'gray'
        });
      }

      // Header text - adjusted position due to larger logos
      doc.fontSize(18)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text("RAJALAKSHMI CHILDREN FOUNDATION", 50, headerY + 5, { 
           width: 500,
           align: 'center'
         });

      doc.fontSize(16)
         .text("PRATIBHA POSHAK EXAMINATION - 2025", 50, headerY + 35, {
           width: 500,
           align: 'center'
         });

      // Address and contact information
      doc.fontSize(8)
         .fillColor(primaryColor)
         .font('Helvetica')
         .text("Kayaka Kranti Towers, CTS No. 4824C/23+24, Ayodhya Nagar, Near Kolhapur Circle, Belagavi 590016", 
               50, headerY + 55, {
                 width: 500,
                 align: 'center',
                 lineGap: 2
               })
         .text("Contact No. +91 9444900755, +91 9606930208", 
               50, headerY + 70, {
                 width: 500,
                 align: 'center'
               });

      // Hall Ticket title box - with border only, no background
      doc.rect(150, 150, 300, 40)
         .stroke(primaryColor)
         .lineWidth(2);
      
      doc.fontSize(24)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text("HALL TICKET", 150, 160, {
           width: 300,
           align: 'center'
         });

      // Student details section
      const studentDetailsY = 210;
      
      // Main rectangle for student details - with border only
      doc.rect(50, studentDetailsY, 360, 90)
         .stroke(primaryColor)
         .lineWidth(2);

      // Add "STUDENT DETAILS" label inside the box
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text("STUDENT DETAILS", 60, studentDetailsY + 10);

      // Photo placeholder
      const photoWidth = 4.0 * 28.35;
      const photoHeight = 5.0 * 28.35;
      const photoX = 50 + 510 - photoWidth - 10;
      const photoY = studentDetailsY + 20;

      // Highlighted border for photo area
      doc.rect(photoX - 5, photoY - 5, photoWidth + 10, photoHeight + 10)
         .stroke(primaryColor)
         .lineWidth(2);

      // Photo placeholder with red border
      doc.rect(photoX, photoY, photoWidth, photoHeight)
         .fill('white')
         .stroke('#e74c3c')
         .lineWidth(2);

      // Photo label text
      doc.fontSize(8)
         .fillColor('#333')
         .text("Passport Photo\n3.5cm × 4.5cm", photoX, photoY + photoHeight/2 - 10, {
           width: photoWidth,
           align: 'center',
           lineGap: 3
         });

      // Student details text - Made labels bold
      doc.fontSize(12)
         .font('Helvetica-Bold') // Changed to Bold for labels
         .text("Name:", 60, studentDetailsY + 40)
         .text(student.student_name || 'N/A', 120, studentDetailsY + 40);

      doc.font('Helvetica-Bold') // Changed to Bold for labels
         .text("Hall Ticket No:", 60, studentDetailsY + 65)
         .text(student.pp_hall_ticket_no || 'N/A', 160, studentDetailsY + 65);


       
        // --------------------------------------------------------------------
        // Exam Center Box Container
const examCenterBoxX = 50;
const examCenterBoxY = studentDetailsY + 110;
const examCenterBoxWidth = 360;
const examCenterBoxHeight = 65;

// Draw the box
doc.rect(examCenterBoxX, examCenterBoxY, examCenterBoxWidth, examCenterBoxHeight)
   .strokeColor('#000000')
   .stroke();

// Add box title
doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor);
const examCenterTitle = 'Exam Center Details:';
const titleWidth = doc.widthOfString(examCenterTitle);
doc.text(examCenterTitle, examCenterBoxX + 10, examCenterBoxY -12);

// Add a small divider line under the title
// doc.moveTo(examCenterBoxX + 10, examCenterBoxY + 5)
//    .lineTo(examCenterBoxX + titleWidth + 10, examCenterBoxY + 5)
//    .strokeColor('#E0E0E0')
//    .stroke();

// Exam Center content position inside the box
const examCenterContentX = examCenterBoxX + 15;
const examCenterContentY = examCenterBoxY + 15;
const maxTextWidth = examCenterBoxWidth - 30;

// Create address string from components
const addressComponents = [];
// if (student.pp_exam_centre_name) addressComponents.push(student.pp_exam_centre_name);
if (student.address) addressComponents.push(student.address);
if (student.village) addressComponents.push(student.village);
if (student.pincode) addressComponents.push(`${student.pincode}`);

const fullAddress = addressComponents.length > 0 ? addressComponents.join(', ') : 'Address not available';

// Display full address with Google Maps link (if coordinates exist)
if (student.latitude && student.longitude) {
    const googleMapsUrl = `https://www.google.com/maps?q=${student.latitude},${student.longitude}`;
    
    // Center name in bold
    const centerName = student.pp_exam_centre_name || 'Exam Center';
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor)
       .text(centerName, examCenterContentX, examCenterContentY, {
           width: maxTextWidth
       });
    
    // Address with Google Maps link on next line
    const addressY = examCenterContentY + 25;
    doc.font('Helvetica').fontSize(9).fillColor('blue').text(fullAddress, examCenterContentX, addressY, {
        width: maxTextWidth,
        underline: true
    });

    const textWidth = doc.widthOfString(fullAddress);
    const textHeight = doc.currentLineHeight();
    doc.link(examCenterContentX, addressY, textWidth, textHeight, googleMapsUrl);
    
    // Google Maps icon/text
    // doc.font('Helvetica').fontSize(8).fillColor('#666666')
    //    .text('📍 Click address for directions', examCenterContentX, addressY + textHeight + 2);
} else {
    // Center name
    const centerName = student.pp_exam_centre_name || 'Exam Center';
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor)
       .text(centerName, examCenterContentX, examCenterContentY, {
           width: maxTextWidth
       });
    
    // Address without link
    const addressY = examCenterContentY + 30;
    doc.font('Helvetica').fontSize(9).fillColor(primaryColor)
       .text(fullAddress, examCenterContentX, addressY, {
           width: maxTextWidth
       });
}
// ------------------------------------------------------------------------
      // Exam info section
      const examInfoY = studentDetailsY + 190;
      
      // Format exam date and time
      const formattedExamDate = `${formatDate(student.exam_date)}, ${formatTimeManual(student.exam_start_time)} to ${formatTimeManual(student.exam_end_time)}`;

      // Exam Date box - with thicker border
      doc.rect(50, examInfoY, 240, 60)
         .stroke(primaryColor)
         .lineWidth(2); // Increased from 0.5 to 2
      
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold') // Added Bold
         .text("Exam Date & Time", 60, examInfoY + 10);
      
      doc.fontSize(12)
         .font('Helvetica') // Regular font for the date/time
         .text(formattedExamDate, 60, examInfoY + 35, {
           width: 220
         });

      // Reporting Time box - with thicker border
      doc.rect(310, examInfoY, 240, 60)
         .stroke(primaryColor)
         .lineWidth(2); // Increased from 0.5 to 2
      
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold') // Added Bold
         .text("Reporting Time", 320, examInfoY + 10);
      
      doc.fontSize(12)
         .font('Helvetica') // Regular font for the time
         .text(formatTimeManual(student.exam_start_time), 320, examInfoY + 35);

      // Register Kannada font
      doc.registerFont('Kannada', assets.kannadaFontPath);

      // Instructions section
      const instructionsY = examInfoY + 80;

      // Print "ಸೂಚನೆಗಳು" in Kannada
      doc.font('Kannada')
         .fontSize(16)
         .fillColor(primaryColor)
         .text("ಸೂಚನೆಗಳು", 50, instructionsY);

      // Horizontal line below instructions title
      doc.moveTo(50, instructionsY + 20)
         .lineTo(550, instructionsY + 20)
         .stroke(primaryColor)
         .lineWidth(0.5);

      // Kannada instructions list
      const kannadaInstructions = [
        "೧) ವಿದ್ಯಾರ್ಥಿಗಳು ತಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್ ಫೋಟೋಕಾಪಿ ಮತ್ತು ಇತ್ತೀಚಿನ ಪಾಸ್ಪೋರ್ಟ್ ಗಾತ್ರದ ಒಂದು ಫೋಟೋ ಕಡ್ಡಾಯವಾಗಿ ತರಬೇಕು.",
        "೨) ದಯವಿಟ್ಟು ನಿಮ್ಮ ಜ್ಯಾಮೆಟ್ರಿ ಬಾಕ್ಸ್, ಪೆನ್ ಮತ್ತು ಪರೀಕ್ಷಾ ಪ್ಯಾಡ್ ತರಬೇಕು.",
        "೩) ವಿದ್ಯಾರ್ಥಿಗಳು ಪರೀಕ್ಷಾ ಕೇಂದ್ರಕ್ಕೆ ನಿಗದಿತ ಸಮಯಕ್ಕಿಂತ ಕನಿಷ್ಠ ೩೦ ನಿಮಿಷಗಳ ಮುಂಚಿತವಾಗಿ ಆಗಮಿಸಬೇಕು.",
        "೪) ಮೊಬೈಲ್, ಟ್ಯಾಬ್, ಸ್ಮಾರ್ಟ್ ವಾಚ್ ಮತ್ತು ಇತರ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಾಧನಗಳು ನಿಷೇಧಿತ.",
        "೫) ವಿದ್ಯಾರ್ಥಿಗಳು ಪರೀಕ್ಷೆಯ ವೇಳೆ ಮೇಲ್ವಿಚಾರಕರ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಬೇಕು.",
        "೬) ಇತರರಿಗೆ ಅಡ್ಡಿಪಡಿಸದಂತೆ ಪರೀಕ್ಷೆಯ ಅವಧಿಯಲ್ಲಿ ಮೌನವನ್ನು ಕಾಪಾಡಿ.",
        "೭) ಯಾವುದೇ ರೀತಿಯ ನಕಲು (ಚೀಟಿ) ಕಂಡುಬಂದಲ್ಲಿ, ವಿದ್ಯಾರ್ಥಿಯನ್ನು ತಕ್ಷಣವೇ ಆನರ್ಹಗೊಳಿಸಲಾಗುವುದು.",
        "೮) ಪರೀಕ್ಷೆಯ ಸಮಯದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳ ಮಧ್ಯೆ ಸಂಭಾಷಣೆ ಅನುಮತಿ ಇಲ್ಲ.",
        "೯) ಸಹಾಯ ಬೇಕಾದರೆ ಅಥವಾ ಅನುಮಾನ ಇದ್ದರೆ, ಕೈ ಎತ್ತಿ ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯಕ್ಕಾಗಿ ಕೇಳಬೇಕು."
      ];

      // Print Kannada instructions
      doc.font('Kannada')
         .fontSize(10)
         .fillColor(primaryColor)
         .text(kannadaInstructions.join('\n'), 60, instructionsY + 30, {
           width: 480,
           paragraphGap: 5
         });

      // Signature boxes section
      const signatureY = instructionsY + 220;
      const boxWidth = 100;
      const boxHeight = 60;
      const gap = (500 - (boxWidth * 4)) / 3;
      const boxPadding = 10;

      // Box 1: Authority Signature with image
      doc.rect(50, signatureY, boxWidth, boxHeight)
         .fill('white')
         .stroke(primaryColor).lineWidth(0.5);
      doc.fontSize(10)
         .fillColor(primaryColor)
         .font('Helvetica-Bold') // Added Bold
         .text("Authority Signature", 50, signatureY + boxPadding, {
           width: boxWidth,
           align: 'center'
         });
      
      if (fs.existsSync(assets.authoritySignaturePath)) {
        doc.image(assets.authoritySignaturePath, 60, signatureY + 25, { 
          width: 80, 
          height: 30,
          colorspace: 'gray'
        });
      }

      // Box 2: Invigilator Signature
      doc.rect(50 + boxWidth + gap, signatureY, boxWidth, boxHeight)
         .fill('white')
         .stroke(primaryColor).lineWidth(0.5);
      doc.fontSize(10)
         .fillColor(primaryColor)
         .font('Helvetica-Bold') // Added Bold
         .text("Invigilator", 50 + boxWidth + gap, signatureY + boxPadding, {
           width: boxWidth,
           align: 'center'
         })
         .text("Signature", 50 + boxWidth + gap, signatureY + boxPadding + 15, {
           width: boxWidth,
           align: 'center'
         });

      // Box 3: Student Signature
      doc.rect(50 + (boxWidth + gap) * 2, signatureY, boxWidth, boxHeight)
         .fill('white')
         .stroke(primaryColor).lineWidth(0.5);
      doc.fontSize(10)
         .fillColor(primaryColor)
         .font('Helvetica-Bold') // Added Bold
         .text("Student", 50 + (boxWidth + gap) * 2, signatureY + boxPadding, {
           width: boxWidth,
           align: 'center'
         })
         .text("Signature", 50 + (boxWidth + gap) * 2, signatureY + boxPadding + 15, {
           width: boxWidth,
           align: 'center'
         });

      // Box 4: Official Seal
      doc.rect(50 + (boxWidth + gap) * 3, signatureY, boxWidth, boxHeight)
         .fill('white')
         .stroke(primaryColor).lineWidth(0.5);

      doc.fontSize(10)
         .fillColor(primaryColor)
         .font('Helvetica-Bold') // Added Bold
         .text("Official Seal", 50 + (boxWidth + gap) * 3, signatureY + boxPadding, {
           width: boxWidth,
           align: 'center'
         });

      // Add stamp image
      if (fs.existsSync(assets.stamplogo)) {
        doc.image(assets.stamplogo, 50 + (boxWidth + gap) * 3 + 10, signatureY + 25, {
          width: 80,
          height: 60,
          colorspace: 'gray'
        });
      }

      // Footer section
      const footerY = signatureY + boxHeight + 40;
      
      // Footer line
      doc.moveTo(50, footerY)
         .lineTo(550, footerY)
         .stroke(primaryColor).lineWidth(0.5);

      // "ALL THE BEST!" text
      // doc.fontSize(14)
      //    .fillColor(primaryColor)
      //    .font('Helvetica-Bold')
      //    .text("***** ALL THE BEST FOR YOUR EXAMINATION *****", 50, footerY + 10, {
      //      width: 500,
      //      align: 'center'
      //    });

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      stream.on('finish', resolve);
      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to clean up temporary files
function cleanupTempFiles(files) {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (err) {
        console.error(`Error deleting temp file ${file}:`, err);
      }
    }
  });
}




// Date formatting function (redefined for the inner function scope)
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return 'N/A';
  }
}

// Time formatting function (redefined for the inner function scope)
function formatTimeManual(timeStr) {
  if (!timeStr) return "N/A";
  try {
    const m = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/);
    if (!m) return timeStr;
    let hh = parseInt(m[1], 10);
    const mm = m[2];
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh.toString().padStart(2, "0")}:${mm} ${ampm}`;
  } catch (error) {
    return "N/A";
  }
}
// async function downloadAllHallTickets(req, res)

const freezeExam = async (req, res) => {
  const { examId } = req.params;

  try {
    // Update frozen_yn to 'Y'
    await pool.query(
      `UPDATE pp.examination SET frozen_yn = 'Y' WHERE exam_id = $1`,
      [examId]
    );
    res.status(200).json({ message: "✅ Exam frozen successfully" });
  } catch (error) {
    console.error("❌ Error freezing exam:", error);
    res.status(500).json({ message: "Failed to freeze exam" });
  }
};

// Create only the exam – does not assign applicants
async function createExamOnly(req, res) {
  const { centreId, examName, date, startTime, endTime } = req.body;

  if (!centreId || !examName || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ Check for existing exams at the same centre on the same date
    const existingExams = await client.query(
      `SELECT exam_id, exam_name, exam_start_time, exam_end_time 
       FROM pp.examination 
       WHERE pp_exam_centre_id = $1 
         AND exam_date = $2`,
      [centreId, date]
    );

    // ✅ Check for time conflicts
    if (existingExams.rows.length > 0) {
      for (const existingExam of existingExams.rows) {
        const existingStart = existingExam.exam_start_time;
        const existingEnd = existingExam.exam_end_time;
        
        // Check if time ranges overlap
        const isOverlapping = (
          (startTime >= existingStart && startTime < existingEnd) || // New exam starts within existing exam
          (endTime > existingStart && endTime <= existingEnd) ||     // New exam ends within existing exam
          (startTime <= existingStart && endTime >= existingEnd)      // New exam completely contains existing exam
        );
        
        if (isOverlapping) {
          await client.query("ROLLBACK");
          return res.status(409).json({ 
            error: "Time conflict", 
            message: `An exam already exists on this date from ${existingStart} to ${existingEnd}. Please choose a different time slot.`,
            conflictingExam: existingExam.exam_name
          });
        }
      }
    }

    // ✅ If no conflicts, insert the new exam
    const examInsertResult = await client.query(
      `INSERT INTO pp.examination (exam_name, exam_date, pp_exam_centre_id, exam_start_time, exam_end_time)
       VALUES ($1, $2, $3, $4, $5) RETURNING exam_id`,
      [examName, date, centreId, startTime, endTime]
    );
    const examId = examInsertResult.rows[0].exam_id;

    await client.query("COMMIT");

    res.status(201).json({ message: "Exam created successfully", examId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error.", error: error.message });
  } finally {
    client.release();
  }
}

// Assign applicants to an existing exam
async function assignApplicantsToExam(req, res) {
  const { examId } = req.params;
  const { division, educationDistrict, blocks } = req.body;

  if (!examId || !division || !educationDistrict || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ error: "Missing required fields: examId, division, educationDistrict, blocks[]" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ 1. Check if the exam exists
    const examExists = await client.query(
      `SELECT exam_id FROM pp.examination WHERE exam_id = $1`,
      [examId]
    );
    if (examExists.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Exam does not exist." });
    }

    
   // ✅ 2. Fetch shortlisted applicants based on jurisdiction hierarchy
const shortlistedApplicants = await client.query(
  `
  SELECT 
    api.applicant_id,
    api.student_name,
    api.father_name,
    api.mother_name,
    api.dob,
    api.aadhaar,
    api.current_institute_dise_code,
    api.contact_no1,
    api.contact_no2,
    api.nmms_year,
    api.nmms_block,
    edu_district_juris.juris_code
  FROM pp.applicant_primary_info api
  INNER JOIN pp.applicant_shortlist_info asi 
    ON api.applicant_id = asi.applicant_id
  INNER JOIN pp.jurisdiction block_juris
    ON api.nmms_block = block_juris.juris_code AND block_juris.juris_type = 'BLOCK'
  INNER JOIN pp.jurisdiction edu_district_juris
    ON block_juris.parent_juris = edu_district_juris.juris_code AND edu_district_juris.juris_type = 'EDUCATION DISTRICT'
  INNER JOIN pp.jurisdiction division_juris
    ON edu_district_juris.parent_juris = division_juris.juris_code AND division_juris.juris_type = 'DIVISION'
  WHERE division_juris.juris_code = $1
    AND edu_district_juris.juris_code = $2
    AND block_juris.juris_code = ANY($3)
    AND asi.shortlisted_yn = 'Y';
  `,
  [division, educationDistrict, blocks]
);


    const applicants = shortlistedApplicants.rows;

    if (applicants.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "No shortlisted applicants found for the selected region." });
    }

    // ✅ 3. Insert applicants into applicant_exam with hall ticket numbers
    let counter = 1;
    for (const applicant of applicants) {
     const hallTicketNo =generateHallTicket(counter, applicant.juris_code)
      await client.query(
        `INSERT INTO pp.applicant_exam (applicant_id, exam_id, pp_hall_ticket_no)
         VALUES ($1, $2, $3)
         ON CONFLICT (applicant_id, exam_id) DO NOTHING;`,
        [applicant.applicant_id, examId, hallTicketNo]
      );
      counter++;
    }

    await client.query("COMMIT");

    // ✅ 4. Send response
   let responseCounter = 1;

res.status(201).json({
  message: "Applicants assigned to exam successfully ✅",
  examId,
  totalAssigned: applicants.length,
  applicants: applicants.map(applicant => {
    const hallTicket = generateHallTicket(
      responseCounter++,
      applicant.nmms_year,
      applicant.juris_code
    );

    return {
      applicant_id: applicant.applicant_id,
      applicant_name: applicant.student_name,
      hall_ticket_no: hallTicket
    };
  })
});
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error assigning applicants:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  } finally {
    client.release();
  }
}

const fetchexamcentresview = async (req,res)=> {
  try {
    const examcentresviews = await getexamcentresview();
    res.json(examcentresviews);
  } catch (error) {
    console("failed to fetch the exam centres");
  }
}




module.exports = {
  // Exam Centre exports
    fetchExamCentres,
    createExamCentre,
    removeExamCentre,
    
    // Location exports
    fetchDivisionsByState,
  fetchEducationDistrictsByDivision,
  fetchBlocksByDistrict,
  fetchClustersByBlock,
    fetchUsedBlocks,
    
    // Exam exports
    fetchAllExams,
    fetchAllExamsnotassigned,
    deleteExam,
    
    
    // Existing exports
    createExamAndAssignApplicants,
    generateStudentList,
    downloadAllHallTickets,
    freezeExam,

    createExamOnly,
    assignApplicantsToExam,
    fetchexamcentresview
};

