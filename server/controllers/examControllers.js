
const {
    getExamCentres,
    addExamCentre,
    deleteExamCentre,
    getStates,
    getDistrictsByState,
    getBlocksByDistrict,
    getUsedBlocks,
    getAllExams,
    deleteExamById
} = require('../models/examModels');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const pool = require("../config/db");

// Helper function to generate hall ticket number
function generateHallTicket(applicantId) {
    return `25${applicantId}`;
}

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
    const { pp_exam_centre_name } = req.body;
    try {
        const result = await addExamCentre(pp_exam_centre_name);
        res.status(201).json(result);
    } catch (error) {
        console.error("Insert error:", error);
        res.status(500).json({ message: "Failed to create centre" });
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

// Location Controllers
const fetchStates = async (req, res) => {
    try {
        const states = await getStates();
        res.json(states);
    } catch (error) {
        console.error("Error fetching states:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const fetchDistrictsByState = async (req, res) => {
    try {
        const { stateId } = req.params;
        const districts = await getDistrictsByState(stateId);
        res.json(districts);
    } catch (error) {
        console.error("Error fetching districts:", error.stack);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

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
function generateHallTicket(applicantId, examId) {
  return `25${applicantId}`; // Example: HT5-1023
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

async function generateStudentList(req, res) {
  try {
    const examId = req.params.examId;
    const logoPath = path.join(__dirname, '../../client/src/assets/logo.png');

    const result = await pool.query(`
      SELECT ae.pp_hall_ticket_no, api.student_name, api.current_institute_dise_code, 
             api.contact_no1, api.contact_no2,ee.exam_name
             from pp.examination ee join 
       pp.applicant_exam ae on ee.exam_id = ae.exam_id
      JOIN pp.applicant_primary_info api ON ae.applicant_id = api.applicant_id
      WHERE ae.exam_id = $1
    `, [examId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No students found for this exam." });
    }

    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `../public/halltickets/Exam_callingList_${examId}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add logo
    doc.image(logoPath, 50, 45, { width: 80 });
    
    // Add title
    doc.fontSize(20)
       .text("Student List", 150, 60, { align: 'center' });
    doc.moveDown(2);

    // Define table layout with adjusted dimensions
    const tableTop = 150;
    const rowHeight = 40; // Increased height for wrapped text
    const colWidths = [100, 130, 120, 80, 80]; // Adjusted column widths
    
    // Draw table headers
    doc.fontSize(10); // Slightly smaller font for better fit
    let currentX = 50;
    
    ['Hall Ticket No', 'Student Name', 'School Code', 'Contact NO.1', 'Contact NO.2'].forEach((header, i) => {
      doc.rect(currentX, tableTop, colWidths[i], rowHeight).stroke();
      doc.text(header, currentX + 5, tableTop + 10, {
        width: colWidths[i] - 10,
        align: 'left'
      });
      currentX += colWidths[i];
    });

    // Draw table rows with text wrapping
    let currentY = tableTop + rowHeight;
    
    result.rows.forEach((row) => {
      const rowData = [
        row.pp_hall_ticket_no || '',
        row.student_name || '',
        row.current_institute_dise_code || '',
        row.contact_no1 || '',
        row.contact_no2 || ''
      ];
      
      // Calculate required height for this row based on wrapped text
      const textHeight = Math.max(
        ...rowData.map(text => {
          const wrapped = doc.heightOfString(String(text), {
            width: colWidths[0] - 10
          });
          return wrapped;
        })
      );
      
      const actualRowHeight = Math.max(rowHeight, textHeight + 20);
      
      // Draw row cells with dynamic height
      currentX = 50;
      rowData.forEach((text, i) => {
        doc.rect(currentX, currentY, colWidths[i], actualRowHeight).stroke();
        doc.text(
          String(text),
          currentX + 5,
          currentY + 5,
          {
            width: colWidths[i] - 10,
            align: 'left'
          }
        );
        currentX += colWidths[i];
      });
      
      currentY += actualRowHeight;
      
      // Add new page if needed
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.end();

    const examName = result.rows[0].exam_name.replace(/\s+/g, '_'); // or use slugify for cleaner names

stream.on('finish', () => {
  return res.download(filePath, `${examName}.pdf`);
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate PDF", error: err.message });
  }
}


async function downloadAllHallTickets(req, res) {
  const examId = req.params.examId;
  const dirPath = path.join(__dirname, `../public/halltickets`);
  
  // File paths
  const logoLeftPath = path.join(__dirname, "../public/assets/rcf_logo-removebg-preview.png");
  const logoRightPath = path.join(__dirname, "../public/assets/logo.png");
  const kannadaFontPath = path.join(__dirname, "../public/fonts/NotoSansKannada-Regular.ttf");
  const authoritySignaturePath = path.join(__dirname, "../public/assets/ravi_sir_sign-removebg-preview.png");

  try {
    // Create a zip stream
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=_Hall_Tickets_${examId}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    // Pipe archive to the response
    archive.pipe(res);

    function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

    // Get all applicants for this exam
    const result = await pool.query(`
      SELECT 
        ae.pp_hall_ticket_no,
        api.student_name,
        ec.pp_exam_centre_name,
        e.exam_date,
        e.exam_name
      FROM pp.applicant_exam ae
      JOIN pp.applicant_primary_info api ON ae.applicant_id = api.applicant_id
      JOIN pp.examination e ON ae.exam_id = e.exam_id
      JOIN pp.pp_exam_centre ec ON e.pp_exam_centre_id = ec.pp_exam_centre_id
      WHERE ae.exam_id = $1
    `, [examId]);

    if (result.rows.length === 0) {
      throw new Error('No hall tickets found for this exam.');
    }

    // Generate individual hall tickets
    for (const student of result.rows) {
      const doc = new PDFDocument({ 
        size: "A4", 
        margin: 50,
        lang: 'kn'
      });

      const ticketPath = path.join(dirPath, `${student.exam_name}_${student.pp_hall_ticket_no}.pdf`);
      const stream = fs.createWriteStream(ticketPath);
      doc.pipe(stream);

      // B&W Color Scheme
      const primaryColor = '#000000'; // Black for all text and borders
      const secondaryColor = '#333333'; // Dark gray for accents
      const lightGray = '#f0f0f0'; // Light gray for backgrounds

      // Add border (thin black border)
      doc.rect(30, 30, 540, 760).stroke(primaryColor).lineWidth(0.5);

      // Header with white background
      doc.rect(50, 50, 500, 80)
         .fill('white')
         .stroke(primaryColor).lineWidth(0.5);
      
      const headerY = 60;
      const logoWidth = 60;
      
      // Left logo (black and white version)
      doc.image(logoLeftPath, 60, headerY - 5, { 
        width: logoWidth,
        // Convert to grayscale for B&W printing
        colorspace: 'gray'
      });

      // Right logo (black and white version)
      doc.image(logoRightPath, 500 - logoWidth + 40, headerY - 5, { 
        width: logoWidth,
        colorspace: 'gray'
      });

      // Header text (black on white)
      doc.fontSize(18)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text("RAJALAKSHMI CHILDREN FOUNDATION", 50, headerY, { 
           width: 500,
           align: 'center'
         });

      doc.fontSize(16)
         .text("PRATIBHA POSHAK EXAMINATION - 2025", 50, headerY + 30, {
           width: 500,
           align: 'center'
         });

         // Address and contact information (added below examination title)
doc.fontSize(8)  // Smaller font size
   .fillColor(primaryColor)
   .font('Helvetica')
   .text("Kayaka Kranti Towers, CTS No. 4824C/23+24, Ayodhya Nagar, Near Kolhapur Circle, Belagavi 590016", 
         50, headerY + 50, {
           width: 500,
           align: 'center',
           lineGap: 2
         })
   .text("Contact No. +91 9444900755, +91 9606930208", 
         50, headerY + 65, {
           width: 500,
           align: 'center'
         });

      // Hall Ticket title (black text on light gray background)
      doc.rect(150, 150, 300, 40)
         .fill(lightGray)
         .stroke(primaryColor).lineWidth(0.5);
      doc.fontSize(24)
         .fillColor(primaryColor)
         .text("HALL TICKET", 140, 160, {
           width: 300,
           align: 'center'
         });

      // Student details section
      const studentDetailsY = 210;
      
      // Main rectangle for student details (light gray background)
      doc.rect(50, studentDetailsY, 360, 120)
         .fill(lightGray)
         .stroke(primaryColor).lineWidth(0.5);

      
const photoWidth = 3.5 * 28.35;  // 99.225 points
const photoHeight = 4.5 * 28.35; // 127.575 points
const photoX = 50 + 510 - photoWidth - 20;  //x axis
const photoY = studentDetailsY + 1;  //yaxis

// Highlighted gray background for photo area
doc.rect(photoX - 5, photoY - 5, photoWidth + 10, photoHeight + 10) // Using your lightGray color
   .stroke(primaryColor)
   .lineWidth(0.5);

// Photo placeholder with red border
doc.rect(photoX, photoY, photoWidth, photoHeight)
   .fill('white')
   .stroke('#e74c3c') // Red border
   .lineWidth(2); // Thicker border

// Photo label text
doc.fontSize(8)
   .fillColor('#333')
   .text("Passport Photo\n3.5cm × 4.5cm", photoX, photoY + photoHeight/2 - 10, {
     width: photoWidth,
     align: 'center',
     lineGap: 3
   });

      // Student details text
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text("STUDENT DETAILS", 60, studentDetailsY + 10);

      doc.fontSize(12)
         
         .font('Helvetica')
         .text("Name:", 60, studentDetailsY + 40)
         .font('Helvetica-Bold')
         .text(student.student_name, 120, studentDetailsY + 40);

      doc.font('Helvetica')
         .text("Hall Ticket No:", 60, studentDetailsY + 65)
         .font('Helvetica-Bold')
         .text(student.pp_hall_ticket_no, 160, studentDetailsY + 65);

   const maxTextWidth = 390 - 150 - 10; // Box width - label position - right margin

// Exam Center field with text wrapping
doc.font('Helvetica')
   .fontSize(10)
   .text("Exam Center:", 60, studentDetailsY + 90)
   .font('Helvetica-Bold')
   .text(student.pp_exam_centre_name, 150, studentDetailsY + 90, {
     width: maxTextWidth, // Constrain text to available space
     ellipsis: true // Add ellipsis if text is too long
   });

      // Exam info section
      const examInfoY = studentDetailsY + 140;
      
      // Exam Date box (light gray background)
     // Format the date to dd-mm-yyyy
const formattedExamDate = formatDate(student.exam_date); // You'll need to implement formatDate()

doc.rect(50, examInfoY, 240, 60)
   .fill(lightGray)
   .stroke(primaryColor).lineWidth(0.5);
doc.fontSize(14)
   .fillColor(primaryColor)
   .text("Exam Date", 60, examInfoY + 10);
doc.fontSize(12)
   .text(formattedExamDate, 60, examInfoY + 35);

      // Exam Time box (light gray background)
      doc.rect(310, examInfoY, 240, 60)
         .fill(lightGray)
         .stroke(primaryColor).lineWidth(0.5);
      doc.fontSize(14)
         .fillColor(primaryColor)
         .text("Reporting Time", 320, examInfoY + 10);
      doc.fontSize(12)
         .text("10:00 AM - 01:00 PM", 320, examInfoY + 35);


        // First, make sure you've registered the Kannada font properly
doc.registerFont('Kannada', kannadaFontPath);

// Instructions section
const instructionsY = examInfoY + 80;

// Print "ಸೂಚನೆಗಳು" in Kannada using the registered font
doc.font('Kannada')  // Switch to Kannada font
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
  "೨) ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ಯಾಮೆಟ್ರಿ ಬಾಕ್ಸ್, ಪೆನ್ ಮತ್ತು ಪರೀಕ್ಷಾ ಪ್ಯಾಡ್ ತರಬೇಕು.",
  "೩) ವಿದ್ಯಾರ್ಥಿಗಳು ಪರೀಕ್ಷಾ ಕೇಂದ್ರಕ್ಕೆ ನಿಗದಿತ ಸಮಯಕ್ಕಿಂತ ಕನಿಷ್ಠ ೩೦ ನಿಮಿಷಗಳ ಮುಂಚಿತವಾಗಿ ಆಗಮಿಸಬೇಕು.",
  "೪) ಮೊಬೈಲ್ ಫೋನ್, ಟ್ಯಾಬ್ಲೆಟ್ಗಳು, ಸ್ಮಾರ್ಟ್ ವಾಚ್ಗಳು ಇತ್ಯಾದಿ ವಿದ್ಯುನ್ಮಾನ ಸಾಧನಗಳನ್ನು ಕಡ್ಡಾಯವಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ.",
  "೫) ವಿದ್ಯಾರ್ಥಿಗಳು ಪರೀಕ್ಷೆಯ ವೇಳೆ ಮೇಲ್ವಿಚಾರಕರ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಬೇಕು.",
  "೬) ಇತರರಿಗೆ ಅಡ್ಡಿಪಡಿಸದಂತೆ ಪರೀಕ್ಷೆಯ ಅವಧಿಯಲ್ಲಿ ಮೌನವನ್ನು ಕಾಪಾಡಿ.",
  "೭) ಯಾವುದೇ ರೀತಿಯ ನಕಲು (ಚೀಟಿ) ಕಂಡುಬಂದಲ್ಲಿ, ವಿದ್ಯಾರ್ಥಿಯನ್ನು ತಕ್ಷಣವೇ ಆನರ್ಹಗೊಳಿಸಲಾಗುವುದು.",
  "೮) ಪರೀಕ್ಷೆಯ ಸಮಯದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳ ಮಧ್ಯೆ ಸಂಭಾಷಣೆ ನಿಷಿದ್ಧ.",
  "೯) ಸಹಾಯ ಬೇಕಾದರೆ ಅಥವಾ ಅನುಮಾನ ಇದ್ದರೆ, ಕೈ ಎತ್ತಿ ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯಕ್ಕಾಗಿ ಕಾಯಬೇಕು."
];

// Print Kannada instructions
doc.font('Kannada')  // Make sure to use Kannada font
   .fontSize(10)
   .fillColor(primaryColor)
   .text(kannadaInstructions.join('\n'), 60, instructionsY + 30, {
     width: 480,
     paragraphGap: 5
   });

      // Signature boxes section
      const signatureY = instructionsY + 200;
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
         .text("Authorized", 50, signatureY + boxPadding, {
           width: boxWidth,
           align: 'center'
         });
      // Add signature image (grayscale)
      doc.image(authoritySignaturePath, 60, signatureY + 25, { 
        width: 80, 
        height: 30,
        align: 'center',
        colorspace: 'gray'
      });

 // Box 2: Invigilator Signature
doc.rect(50 + boxWidth + gap, signatureY, boxWidth, boxHeight)
   .fill('white')
   .stroke(primaryColor).lineWidth(0.5);
doc.fontSize(10)
   .fillColor(primaryColor)
   .text("Invigilator", 50 + boxWidth + gap, signatureY + boxPadding, {
     width: boxWidth,
     align: 'center'
   });
doc.text("Signature", 50 + boxWidth + gap, signatureY + boxPadding + 15, {
  width: boxWidth,
  align: 'center'
});

// Box 3: Student Signature
doc.rect(50 + (boxWidth + gap) * 2, signatureY, boxWidth, boxHeight)
   .fill('white')
   .stroke(primaryColor).lineWidth(0.5);
doc.fontSize(10)
   .fillColor(primaryColor)
   .text("Student", 50 + (boxWidth + gap) * 2, signatureY + boxPadding, {
     width: boxWidth,
     align: 'center'
   });
doc.text("Signature", 50 + (boxWidth + gap) * 2, signatureY + boxPadding + 15, {
  width: boxWidth,
  align: 'center'
});

// Box 4: Official Seal
doc.rect(50 + (boxWidth + gap) * 3, signatureY, boxWidth, boxHeight)
   .fill('white')
   .stroke(primaryColor).lineWidth(0.5);
doc.fontSize(10)
   .fillColor(primaryColor)
   .text("Official", 50 + (boxWidth + gap) * 3, signatureY + boxPadding, {
     width: boxWidth,
     align: 'center'
   });
doc.text("Seal", 50 + (boxWidth + gap) * 3, signatureY + boxPadding + 15, {
  width: boxWidth,
  align: 'center'
});

      // Footer section
      const footerY = signatureY + boxHeight + 40;
      
      // Footer line
      doc.moveTo(50, footerY)
         .lineTo(550, footerY)
         .stroke(primaryColor).lineWidth(0.5);

      // "ALL THE BEST!" text
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text("ALL THE BEST", 50, footerY + 10, {
           width: 500,
           align: 'center'
         });

      doc.end();

      // Add to archive
      await new Promise(resolve => stream.on('finish', resolve));
      archive.file(ticketPath, { name: `${student.exam_name}_${student.pp_hall_ticket_no}.pdf` });
    }

    // Finalize archive
    archive.finalize();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate hall tickets", error: error.message });
  }
}


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



module.exports = {
  // Exam Centre exports
    fetchExamCentres,
    createExamCentre,
    removeExamCentre,
    
    // Location exports
    fetchStates,
    fetchDistrictsByState,
    fetchBlocksByDistrict,
    fetchUsedBlocks,
    
    // Exam exports
    fetchAllExams,
    deleteExam,
    
    // Existing exports
    createExamAndAssignApplicants,
    generateStudentList,
    downloadAllHallTickets,
    freezeExam 
};

