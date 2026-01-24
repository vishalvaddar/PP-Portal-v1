const path = require('path'); 
const fs = require('fs'); 
const PDFDocument = require('pdfkit'); 
const InterviewModel = require("../models/interviewModel"); 

const NO_INTERVIEWER_ID = 'NO_ONE'; 
 
const cleanText = (text) => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g, '').trim();
};

const formatDateForPdf = (dateString) => {
    let output = { date: 'N/A', datetime: 'N/A' };
    if (dateString) {
        try {
            const date = new Date(dateString);
            output.date = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
            output.datetime = output.date;
        } catch (e) {
            output.date = cleanText(dateString); 
            output.datetime = output.date;
        }
    } 
    return output;
};



// Project root assumed relative to this file's location.
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PATH_TO_RCF_LOGO = path.join(PROJECT_ROOT, 'server', 'public', 'assets', 'rcf_logo-removebg-preview.png');
const PATH_TO_PP_LOGO = path.join(PROJECT_ROOT, 'server', 'public', 'assets', 'logo.png');

const GENERATED_FILES_ROOT = path.join(process.env.FILE_STORAGE_PATH, 'generated-eval-data');
    

// --- PDF HEADER UTILITY FUNCTION ---
const drawReportHeader = (doc, isFirstPage, nmmsYear) => {
    // Save current state (fonts, colors, positions)
    doc.save(); 

    const MARGIN_LEFT = 30;
    const PAGE_WIDTH = doc.page.width;
    const RIGHT_EDGE = PAGE_WIDTH - MARGIN_LEFT;
    const START_Y = MARGIN_LEFT;
    const LOGO_SIZE = 50;
    
    // Determine the main title font size based on the page
    const MAIN_TITLE_FONT_SIZE = isFirstPage ? 18 : 12;

    // --- 1. Draw Logos ---
    // Left Logo: RCF
    if (fs.existsSync(PATH_TO_RCF_LOGO)) {
         doc.image(PATH_TO_RCF_LOGO, MARGIN_LEFT, START_Y, {
             fit: [LOGO_SIZE, LOGO_SIZE],
         });
    }

    // Right Logo: Pratibha Poshak
    if (fs.existsSync(PATH_TO_PP_LOGO)) {
         doc.image(PATH_TO_PP_LOGO, RIGHT_EDGE - LOGO_SIZE, START_Y, {
             fit: [LOGO_SIZE, LOGO_SIZE],
         });
    }
    
    // --- 2. Title and Details (Centered) ---
    const currentY = START_Y;

    // RAJALAKSHMI CHILDREN FOUNDATION (Largest on page 1)
    doc.fillColor('#000000')
        .font('Times-Bold')
        .fontSize(MAIN_TITLE_FONT_SIZE)
        .text('RAJALAKSHMI CHILDREN FOUNDATION', MARGIN_LEFT, currentY + 10, {
            align: 'center',
            width: PAGE_WIDTH - 2 * MARGIN_LEFT,
            lineBreak: false
        });

    // PRATIBHA POSHAK EXAMINATION - YEAR
    doc.moveDown(0.3)
        .fontSize(isFirstPage ? 16 : 10)
        .text(`PRATIBHA POSHAK EXAMINATION - ${nmmsYear}`, MARGIN_LEFT, doc.y, {
            align: 'center',
            width: PAGE_WIDTH - 2 * MARGIN_LEFT
        });
        
    // Address (Smaller Font)
    doc.moveDown(0.3)
        .font('Times-Roman')
        .fontSize(isFirstPage ? 8 : 7)
        .text('Kayaka Kranti Towers, CTS No. 4824C/23+24, Ayodhya Nagar, Near Kolhapur Circle, Belagavi 590016', {
            align: 'center',
            width: PAGE_WIDTH - 2 * MARGIN_LEFT
        });

    // Contact (Smallest Font)
    doc.moveDown(0.1)
        .text('Contact No. +91 9444900755, +91 9606930208', {
            align: 'center',
            width: PAGE_WIDTH - 2 * MARGIN_LEFT
        });
    
    // --- 3. Separator Line ---
    doc.moveDown(0.5);
    const lineY = doc.y;
    doc.moveTo(MARGIN_LEFT, lineY)
       .lineTo(RIGHT_EDGE, lineY)
       .stroke();

    // Restore state and set cursor Y position below the header
    doc.restore();
    doc.y = lineY + 15; 
};


const InterviewController = {
    
async downloadAssignmentReport(req, res) {
    console.log('--- HIT: Download Assignment Report Route REACHED ---');
    
    const { 
        interviewerId, 
        nmmsYear, 
        applicantIds
    } = req.body; 

    const applicantIdsArray = applicantIds || [];
    
    if (!interviewerId || !nmmsYear || applicantIdsArray.length === 0) {
        return res.status(400).json({ error: 'Missing required parameters: interviewerId, nmmsYear, or applicantIds list is empty/invalid.' });
    }

    const cleanInterviewerId = interviewerId.toString().replace(/[^a-zA-Z0-9-]/g, '');
    const filename = `Interview-Assignment${cleanInterviewerId}_${Date.now()}.pdf`;

    // 🔥 MODIFIED: Store directly in generated-eval-data without the cohort sub-folder
    const GENERATED_FILES_ROOT = "C:\\Users\\priya\\Downloads\\dump\\generated-eval-data";
    const localFilePath = path.join(GENERATED_FILES_ROOT, filename);

    try {
        // Ensure the root directory exists
        if (!fs.existsSync(GENERATED_FILES_ROOT)) {
            fs.mkdirSync(GENERATED_FILES_ROOT, { recursive: true });
        }

        const students = await InterviewModel.getAssignmentReportData(
            interviewerId, 
            nmmsYear, 
            applicantIdsArray
        );

        if (students.length === 0) {
            return res.status(404).json({ error: 'No student data found for the selected criteria.' });
        }

        // --- PDF Generation Setup ---
        const TOP_MARGIN_FOR_HEADER = 100;
        const doc = new PDFDocument({ 
            margins: { top: TOP_MARGIN_FOR_HEADER, bottom: 30, left: 30, right: 30 },
            size: 'A4'
        });
        
        doc.on('error', (err) => {
            console.error('!!! PDF STREAM CRASHED (STREAM ERROR) !!! Detailed Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'PDF generation stream failed.' });
            } else {
                res.end();
            }
        });

        // 🔥 PIPE TO LOCAL PC FOLDER
        const writeStream = fs.createWriteStream(localFilePath);
        doc.pipe(writeStream);

        // 🔥 PIPE TO BROWSER RESPONSE (User download)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);
        
        // Draw header on the first page
        drawReportHeader(doc, true, nmmsYear);
        
        // Draw header on every subsequent page
        doc.on('pageAdded', () => {
            drawReportHeader(doc, false, nmmsYear);
        });
        
        // --- Report Titles ---
        doc.font('Times-Roman').fontSize(14).text(`Interview Assignment`, 30, doc.y);
        doc.moveDown(0.5);
        doc.font('Times-Bold').fontSize(12).text(`Assigned Student Details:`, 30, doc.y);
        doc.moveDown(1.5);

        // --- Content Generation ---
        students.forEach((student, index) => {
            doc.save(); 
            try { 
                if (index > 0) {
                    doc.addPage();
                }

                const safeGet = (field) => cleanText(student[field] ?? 'N/A');
                const FONT_SIZE_TITLE = 16;
                const FONT_SIZE_HEADER = 12;
                const FONT_SIZE_NORMAL = 10;
                
                doc.font('Times-Bold').fontSize(FONT_SIZE_TITLE)
                    .text(`Student Interview Report: ${safeGet("Student Name")}`, 30, doc.y);
                doc.moveDown(0.5);
                doc.moveTo(30, doc.y).lineTo(560, doc.y).stroke();
                doc.moveDown(0.5);

                doc.fontSize(FONT_SIZE_HEADER).text('Primary Applicant & Profile Details');
                doc.moveDown(0.5);

                const infoFields = [
                    ["Current School:", safeGet("Current School Name")],
                    ["Previous School:", safeGet("Previous School Name")],
                    ["State:", safeGet("State Name")],
                    ["District:", safeGet("District Name")],
                    ["Block:", safeGet("Block Name")],
                    ["Village:", safeGet("village")],
                    ["PP Exam Score:", safeGet("pp_exam_score")],
                    ["GMAT Score:", safeGet("gmat_score")],
                    ["SAT Score:", safeGet("sat_score")],
                    ["Contact No 1:", safeGet("Contact No 1")],
                    ["Contact No 2:", safeGet("Contact No 2")],
                    ["Father's Occupation:", safeGet("father_occupation")],
                    ["Mother's Occupation:", safeGet("mother_occupation")],
                    ["Father's Education:", safeGet("father_education")],
                    ["Mother's Education:", safeGet("mother_education")],
                    ["Household Size:", safeGet("household_size")],
                    ["Own House:", safeGet("own_house")],
                    ["Smart Phone Home:", safeGet("smart_phone_home")],
                    ["Internet Facility:", safeGet("internet_facility_home")],
                    ["Career Goals:", safeGet("career_goals")],
                    ["Subjects of Interest:", safeGet("subjects_of_interest")],
                    ["Transportation Mode:", safeGet("transportation_mode")],
                    ["Distance to School:", safeGet("distance_to_school")],
                    ["Two Wheelers:", safeGet("num_two_wheelers")],
                    ["Four Wheelers:", safeGet("num_four_wheelers")],
                    ["Irrigation Land:", safeGet("irrigation_land")],
                    ["Neighbor Name:", safeGet("neighbor_name")],
                    ["Favorite Teacher:", safeGet("favorite_teacher_name")],
                    ["Assigned Interviewer:", safeGet("Assigned Interviewer Name")],
                ];

                doc.fontSize(FONT_SIZE_NORMAL).font('Times-Roman'); 
                infoFields.forEach((field) => {
                    doc.text(`${String(field[0])} `, 30, doc.y + 5, { continued: true })
                        .font('Times-Bold').text(`${String(field[1])}`, { continued: false })
                        .font('Times-Roman');
                });

                doc.moveDown(1.5); 

                const pendingAssignment = student["Pending Assignment"];
                const completedRounds = student["Completed Rounds"] || [];
                const isFinalResultAvailable = completedRounds.length > 0;

                if (pendingAssignment) {
                    doc.fontSize(FONT_SIZE_HEADER).font('Times-Bold').text('Current Assignment Details');
                    doc.moveDown(0.5);
                    const safeGetPending = (field) => cleanText(pendingAssignment[field] ?? 'N/A');
                    const currentAssignmentFields = [
                        ["Round:", safeGetPending("Interview Round") || 'N/A'],
                        ["Status:", safeGetPending("Assignment Status")],
                        ["Interviewer:", safeGetPending("Assigned Interviewer Name")],
                    ];
                    doc.fontSize(FONT_SIZE_NORMAL).font('Times-Roman');
                    currentAssignmentFields.forEach((field) => {
                        doc.text(`${String(field[0])} `, 30, doc.y + 5, { continued: true })
                           .font('Times-Bold').text(`${String(field[1])}`, { continued: false })
                           .font('Times-Roman');
                    });
                    doc.moveDown(1.5);
                }
                
                if (isFinalResultAvailable) {
                    doc.fontSize(FONT_SIZE_HEADER).font('Times-Bold').text(`Completed Interview Results (${completedRounds.length} Round${completedRounds.length > 1 ? 's' : ''})`, 30, doc.y);
                    doc.moveDown(0.5);
                    completedRounds.forEach((completedRecord, i) => {
                        const safeGetCompleted = (field) => cleanText(completedRecord[field] ?? 'N/A');
                        const { date } = formatDateForPdf(completedRecord["Interview Date"]);
                        doc.fontSize(FONT_SIZE_NORMAL + 1).font('Times-Bold').text(`Result - ${safeGetCompleted("Interview Result")}`, 30, doc.y);
                        doc.moveDown(0.2);
                        const roundFields = [
                            ["Interviewer:", safeGetCompleted("Assigned Interviewer Name")], 
                            ["Date:", date],
                            ["Mode:", safeGetCompleted("Interview Mode")],
                            ["Assignment Status:", safeGetCompleted("Assignment Status")],
                        ];
                        doc.fontSize(FONT_SIZE_NORMAL).font('Times-Roman');
                        roundFields.forEach(field => {
                            doc.text(`${String(field[0])} `, 30, doc.y + 3, { continued: true })
                                .font('Times-Bold').text(`${String(field[1])}`, { continued: false })
                                .font('Times-Roman'); 
                        });
                        doc.moveDown(0.5);
                        doc.fontSize(FONT_SIZE_HEADER - 2).font('Times-Bold').text('--- Scores ---');
                        doc.moveDown(0.2);
                        const scoreFields = [
                            ["Life Goals & Zeal:", safeGetCompleted("Life Goals and Zeal")],
                            ["Commitment to Learning:", safeGetCompleted("Commitment to Learning")],
                            ["Integrity:", safeGetCompleted("Integrity")],
                            ["Communication Skills:", safeGetCompleted("Communication Skills")],
                        ];
                        doc.fontSize(FONT_SIZE_NORMAL).font('Times-Roman');
                        scoreFields.forEach(field => {
                            doc.text(`${String(field[0])} `, 30, doc.y + 3, { continued: true })
                                .font('Times-Bold').text(`${String(field[1])}`, { continued: false })
                                .font('Times-Roman'); 
                        });
                        doc.moveDown(1.0);
                    });
                }
                
                if (!pendingAssignment && !isFinalResultAvailable) {
                    doc.fontSize(FONT_SIZE_NORMAL).font('Times-Bold').fillColor('gray')
                    .text('No current assignment or completed interview records found.', 30, doc.y);
                    doc.fillColor('black'); 
                }
            } catch (contentError) {
                console.error(`Skipping content for student ${student.applicant_id}:`, contentError);
            } finally {
                doc.restore(); 
            }
        });

        doc.end();

        writeStream.on('finish', () => {
            console.log(`✅ Copy saved locally to: ${localFilePath}`);
        });

    } catch (error) {
        console.error('Error in PDF generation:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF report.' });
        } else {
            doc.end(); 
        }
    }
},


  async getExamCenters(req, res) {
    try {
      const examCenters = await InterviewModel.getExamCenters();
      res.status(200).json(examCenters);
    } catch (error) {
      console.error('Controller Error - getExamCenters:', error);
      res.status(500).json({ message: 'Internal server error while fetching exam centers.' });
    }
  },

  async getAllStates(req, res) {
        try {
            const states = await InterviewModel.getAllStates();
            res.status(200).json(states);
        } catch (error) {
            console.error('Controller Error - getAllStates:', error);
            res.status(500).json({ message: 'Internal server error while fetching states.' });
        }
    },



async getDivisionsByState(req, res) {
    const { stateName } = req.query; 
    
    if (!stateName) {
        return res.status(400).json({ message: 'Missing stateName query parameter.' });
    }
    
    try {
        const divisions = await InterviewModel.getDivisionsByState(stateName);
        res.status(200).json(divisions);
    } catch (error) {
        console.error('Controller Error - getDivisionsByState:', error); 
        res.status(500).json({ message: 'Internal server error while fetching divisions.' });
    }
}, 

  
    async getDistrictsByDivision(req, res) {
        // Assume the route parameter is 'divisionName' now, not 'stateName'
        const { divisionName } = req.query; // FIX: Should use req.query as per front-end/router
        if (!divisionName) {
            return res.status(400).json({ message: 'Missing divisionName parameter.' });
        }
        try {
            // Note: The model function is called getDistrictsByDivision(divisionName)
            const districts = await InterviewModel.getDistrictsByDivision(divisionName);
            res.status(200).json(districts);
        } catch (error) {
            console.error('Controller Error - getDistrictsByDivision:', error);
            res.status(500).json({ message: 'Internal server error while fetching districts.' });
        }
    }, 

  
    async getBlocksByDistrict(req, res) {
        // FIX: Should use req.query as per front-end/router
        const { stateName, divisionName, districtName } = req.query; 
        
        if (!stateName || !divisionName || !districtName) {
            return res.status(400).json({ message: 'Missing one or more required parameters: stateName, divisionName, or districtName.' });
        }
        try {
            const blocks = await InterviewModel.getBlocksByDistrict(stateName, divisionName, districtName);
            res.status(200).json(blocks);
        } catch (error) {
            console.error('Controller Error - getBlocksByDistrict:', error);
            res.status(500).json({ message: 'Internal server error while fetching blocks.' });
        }
    }, 

  async getUnassignedStudents(req, res) {
    const { centerName, nmmsYear } = req.query;
    if (!centerName || !nmmsYear) {
      return res.status(400).json({ message: 'Missing centerName or nmmsYear query parameter.' });
    }
    try {
      const students = await InterviewModel.getUnassignedStudents(centerName, nmmsYear);
      res.status(200).json(students);
    } catch (error) {
      console.error('Controller Error - getUnassignedStudents:', error);
      res.status(500).json({ message: 'Internal server error while fetching unassigned students.' });
    }
  },

  async getUnassignedStudentsByBlock(req, res) {
    const { stateName, districtName, blockName, nmmsYear } = req.query;
    if (!stateName || !districtName || !blockName || !nmmsYear) {
      return res.status(400).json({ message: 'Missing required query parameters.' });
    }
    try {
      const students = await InterviewModel.getUnassignedStudentsByBlock(stateName, districtName, blockName, nmmsYear);
      res.status(200).json(students);
    } catch (error) {
      console.error('Controller Error - getUnassignedStudentsByBlock:', error);
      res.status(500).json({ message: 'Internal server error while fetching unassigned students by block.' });
    }
  },

async getReassignableStudentsByBlock(req, res) {
    const { stateName, districtName, blockName, nmmsYear } = req.query;
    try {
        // Must pass all 4 variables
        const students = await InterviewModel.getReassignableStudentsByBlock(
            stateName, 
            districtName, 
            blockName, 
            nmmsYear
        );
        res.status(200).json(students);
    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
},

  async getInterviewers(req, res) {
    try {
      const interviewers = await InterviewModel.getInterviewers();
      res.status(200).json(interviewers);
    } catch (error) {
      console.error('Controller Error - getInterviewers:', error);
      res.status(500).json({ message: 'Internal server error while fetching interviewers.' });
    }
  },

async assignStudents(req, res) {
    const { applicantIds, interviewerId, nmmsYear } = req.body;
    if (!applicantIds || !interviewerId || !nmmsYear) {
      return res.status(400).json({ message: 'Missing applicantIds, interviewerId, or nmmsYear in request body.' });
    }
    try {
      const modelResponse = await InterviewModel.assignStudents(applicantIds, interviewerId, nmmsYear);
      
      // This structure is correct for the frontend fix:
      res.status(200).json({
        message: `Assignment process completed.`,
        results: modelResponse.results 
      });
      
    } catch (error) {
      console.error('Controller Error - assignStudents:', error);
      res.status(500).json({ message: 'Internal server error while assigning students.' });
    }
}, 

  async getReassignableStudents(req, res) {
    const { centerName, nmmsYear } = req.query;
    if (!centerName || !nmmsYear) {
      return res.status(400).json({ message: 'Missing centerName or nmmsYear query parameter.' });
    }
    try {
      const students = await InterviewModel.getReassignableStudents(centerName, nmmsYear);
      res.status(200).json(students);
    } catch (error) {
      console.error('Controller Error - getReassignableStudents:', error);
      res.status(500).json({ message: 'Internal server error while fetching reassignable students.' });
    }
  },

  async reassignStudents(req, res) {
    const { applicantIds, newInterviewerId, nmmsYear } = req.body;
    if (!applicantIds || !newInterviewerId || !nmmsYear) {
      return res.status(400).json({ message: 'Missing applicantIds, newInterviewerId, or nmmsYear in request body.' });
    }
    try {
      // InterviewModel.reassignStudents returns { results: [...] }
      const modelResponse = await InterviewModel.reassignStudents(applicantIds, newInterviewerId, nmmsYear);
      
      // FIX: Extract the inner array (modelResponse.results) and send it as the value 
      // of the 'results' key in the final JSON response.
      res.status(200).json({
        message: `Reassignment process completed.`,
        results: modelResponse.results 
      });
      
    } catch (error) {
      console.error('Controller Error - reassignStudents:', error);
      // Ensure the error message is passed to the frontend
      res.status(500).json({ message: 'Internal server error while reassigning students.' });
    }
}
,

  async getStudentsByInterviewer(req, res) {
    const { interviewerName } = req.params;
    const { nmmsYear } = req.query;
    if (!interviewerName || !nmmsYear) {
      return res.status(400).json({ message: 'Missing interviewerName in parameters or nmmsYear in query.' });
    }
    try {
      const students = await InterviewModel.getStudentsByInterviewer(interviewerName, nmmsYear);
      res.status(200).json(students);
    } catch (error) {
      console.error('Controller Error - getStudentsByInterviewer:', error);
      res.status(500).json({ message: 'Internal server error while fetching students for interviewer.' });
    }
  },

async getStudentsForVerification(req, res) {
    // Look for nmmsYear in query params
    const { nmmsYear } = req.query;

    // 🔥 Fix: Improved validation
    if (!nmmsYear || nmmsYear === 'undefined' || nmmsYear === 'null') {
        return res.status(400).json({ 
            message: 'Missing or invalid nmmsYear. Received: ' + nmmsYear 
        });
    }

    try {
        const students = await InterviewModel.getStudentsForVerification(nmmsYear);
        res.status(200).json(students);
    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({ message: "Failed to fetch students for verification." });
    }
},

// Replace your current submitHomeVerification with this:
async submitHomeVerification(req, res) {
    const verificationData = req.body;
    const { 
        applicantId, 
        status, 
        verifiedBy, 
        verificationType, 
        dateOfVerification,
        nmmsYear // 🔥 Added this
    } = verificationData;

    const uploadedFile = req.file; 

    // Updated validation to include nmmsYear
    if (
        !applicantId || 
        !status || 
        !verifiedBy || 
        !verificationType ||
        !dateOfVerification ||
        !nmmsYear // 🔥 Added this
    ) {
        return res.status(400).json({ message: 'Missing applicantId, status, verifiedBy, verificationType, dateOfVerification, or nmmsYear.' });
    }

    try {
        const result = await InterviewModel.submitHomeVerification(verificationData, uploadedFile);
        res.status(200).json({ 
            message: "Home verification submitted successfully.", 
            data: result 
        });
    } catch (error) {
        console.error('Controller Error - submitHomeVerification:', error);
        res.status(500).json({ message: error.message || 'Internal server error during home verification submission.' });
    }
},
// Replace your current submitInterviewDetails with this:
async submitInterviewDetails(req, res) {
    const interviewData = req.body;
    const { applicantId, remarks, nmmsYear } = interviewData; // 🔥 Added nmmsYear

    const uploadedFile = req.file; 

    if (
        !applicantId || 
        !remarks || 
        remarks.trim() === '' ||
        !uploadedFile ||
        !nmmsYear // 🔥 Added validation
    ) {
        return res.status(400).json({ message: 'Missing applicantId, mandatory remarks, interview file, or nmmsYear.' });
    }

    try {
        const updatedInterview = await InterviewModel.submitInterviewDetails(applicantId, interviewData, uploadedFile);
        res.status(200).json({ message: 'Interview details and file submitted successfully.', data: updatedInterview });
    } catch (error) {
        console.error('Controller Error - submitInterviewDetails:', error);
        res.status(500).json({ error: true, message: error.message || 'Internal server error.' });
    }
},
};

module.exports = InterviewController;