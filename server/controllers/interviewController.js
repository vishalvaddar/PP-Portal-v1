const PDFDocument = require('pdfkit'); 
const InterviewModel = require("../models/interviewModel");

const NO_INTERVIEWER_ID = 'NO_ONE'; 

const cleanText = (text) => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g, '').trim();
};

// 🔥 CORRECTED UTILITY: Now returns only the clean date part.
const formatDateForPdf = (dateString) => {
    let output = { date: 'N/A', datetime: 'N/A' }; // Keeping datetime field name for structural consistency

    if (dateString) {
        try {
            const date = new Date(dateString);
            output.date = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
            output.datetime = output.date; // Use date for the combined field
        } catch (e) {
            output.date = cleanText(dateString); 
            output.datetime = output.date;
        }
    } 
    return output;
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
            console.log(`400 Error: Missing/Empty Data. IntervID: ${interviewerId}, Year: ${nmmsYear}, IDs Length: ${applicantIdsArray.length}`);
            return res.status(400).json({ error: 'Missing required parameters: interviewerId, nmmsYear, or applicantIds list is empty/invalid.' });
        }

        const cleanInterviewerId = interviewerId.toString().replace(/[^a-zA-Z0-9-]/g, '');
        const filename = `Assignment_Report_${cleanInterviewerId}_${Date.now()}.pdf`;

        try {
            const students = await InterviewModel.getAssignmentReportData(
                interviewerId, 
                nmmsYear, 
                applicantIdsArray
            );

            if (students.length === 0) {
                return res.status(404).json({ error: 'No student data found for the selected criteria.' });
            }

            // --- PDF Generation Setup ---
            const doc = new PDFDocument({ 
                margins: { top: 30, bottom: 30, left: 30, right: 30 },
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

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            doc.pipe(res);
            
            doc.font('Times-Roman').fontSize(18).text(`Assignment Report`, 30, 20);
            doc.moveTo(30, 45).lineTo(560, 45).stroke();
            doc.moveDown(2);


            // --- Content Generation ---
            students.forEach((student, index) => {
                
                doc.save(); 

                try { 
                    if (index > 0) {
                        doc.addPage();
                    }

                    // --- SAFE DATA ACCESS HELPER ---
                    const safeGet = (field) => cleanText(student[field] ?? 'N/A');
                    
                    const FONT_SIZE_TITLE = 16;
                    const FONT_SIZE_HEADER = 12;
                    const FONT_SIZE_NORMAL = 10;
                    
                    // --- Student Title ---
                    doc.font('Times-Bold'); 
                    doc.fontSize(FONT_SIZE_TITLE)
                        .text(`Student Interview Report: ${safeGet("Student Name")}`, 30, doc.y);
                    doc.moveDown(0.5);

                    doc.moveTo(30, doc.y).lineTo(560, doc.y).stroke();
                    doc.moveDown(0.5);

                    // --- 1. Primary Applicant Details ---
                    doc.fontSize(FONT_SIZE_HEADER).text('1. Primary Applicant & Profile Details');
                    doc.moveDown(0.5);

                    // 🔥 Comprehensive list of all profile fields
                    const infoFields = [
                        ["Applicant ID:", safeGet("applicant_id")],
                        ["NMMS Reg. No:", safeGet("nmms_reg_number")],
                        ["Current School:", safeGet("Current School Name")],
                        ["Previous School:", safeGet("Previous School Name")],
                        ["State:", safeGet("State Name")],
                        ["District:", safeGet("District Name")],
                        ["Block:", safeGet("Block Name")],
                        ["Village:", safeGet("village")],
                        ["PP Exam Score:", safeGet("pp_exam_score")],
                        ["GMAT/SAT Score:", `${safeGet("gmat_score")} / ${safeGet("sat_score")}`],
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
                        // Ensure space after colon
                        doc.text(`${String(field[0])} `, 30, doc.y + 5, { continued: true })
                            .font('Times-Bold').text(`${String(field[1])}`, { continued: false })
                            .font('Times-Roman');
                    });

                    doc.moveDown(1.5); 

                    // --- INTERVIEW DATA STRUCTURES ---
                    const pendingAssignment = student["Pending Assignment"];
                    const completedRounds = student["Completed Rounds"] || [];
                    
                    const isFinalResultAvailable = completedRounds.length > 0;

                    
                    // =================================================================================
                    // SECTION 2: CURRENT ASSIGNMENT (Pending)
                    // =================================================================================
                    if (pendingAssignment) {
                        
                        doc.fontSize(FONT_SIZE_HEADER).font('Times-Bold').text('2. Current Assignment Details');
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
                    
                    // =================================================================================
                    // SECTION 3: COMPLETED ROUNDS
                    // =================================================================================
                    
                    if (isFinalResultAvailable) {
                        doc.fontSize(FONT_SIZE_HEADER).font('Times-Bold').text(`3. Completed Interview Results (${completedRounds.length} Round${completedRounds.length > 1 ? 's' : ''})`, 30, doc.y);
                        doc.moveDown(0.5);
                        
                        completedRounds.forEach((completedRecord, i) => {
                            const safeGetCompleted = (field) => cleanText(completedRecord[field] ?? 'N/A');
                            // 🔥 Use ONLY the date field from the utility
                            const { date } = formatDateForPdf(completedRecord["Interview Date"], completedRecord["Interview Time"]);
                            
                            // Remove Round number from the result line
                            doc.fontSize(FONT_SIZE_NORMAL + 1).font('Times-Bold').text(`Result - ${safeGetCompleted("Interview Result")}`, 30, doc.y);
                            doc.moveDown(0.2);

                            // 🔥 FIXED: Use only DATE field
                            const roundFields = [
                                ["Interviewer:", safeGetCompleted("Assigned Interviewer Name")], 
                                ["Date:", date], // ONLY DATE
                                ["Mode:", safeGetCompleted("Interview Mode")],
                                ["Assignment Status:", safeGetCompleted("Assignment Status")],
                            ];
                            
                            doc.fontSize(FONT_SIZE_NORMAL).font('Times-Roman');
                            roundFields.forEach(field => {
                                doc.text(`${String(field[0])} `, 30, doc.y + 3, { continued: true })
                                   .font('Times-Bold').text(`${String(field[1])}`, { continued: false })
                                   .font('Times-Roman'); 
                            });
                            
                            doc.moveDown(0.5); // Separator before scores

                            // Scoring
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
                            doc.moveDown(1.0); // Space between rounds
                        });
                    }
                    
                    // Final Status Message
                    if (!pendingAssignment && !isFinalResultAvailable) {
                        doc.fontSize(FONT_SIZE_NORMAL).font('Times-Bold').fillColor('gray')
                        .text('No current assignment or completed interview records found.', 30, doc.y);
                        doc.fillColor('black'); 
                    }

                } catch (contentError) {
                    console.error(`Skipping PDF content for student ${cleanText(student.applicant_id || '')} due to content error:`, contentError);
                    doc.fillColor('red').text(`[ERROR: Could not generate data for this student: ${contentError.message}]`, 30, doc.y + 10).fillColor('black');
                } finally {
                    doc.restore(); 
                }
            });

            // Finalize the PDF and close the stream
            doc.end();

        } catch (error) {
            console.error('Error in PDF generation or data fetching:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to generate PDF report due to a server error.' });
            } else {
                doc.end(); 
            }
        }
    },



  // Controller to get all available exam centers
  async getExamCenters(req, res) {
    try {
      const examCenters = await InterviewModel.getExamCenters();
      res.status(200).json(examCenters);
    } catch (error) {
      console.error('Controller Error - getExamCenters:', error);
      res.status(500).json({ message: 'Internal server error while fetching exam centers.' });
    }
  },

  // Controller to get all states
  async getAllStates(req, res) {
    try {
      const states = await InterviewModel.getAllStates();
      res.status(200).json(states);
    } catch (error) {
      console.error('Controller Error - getAllStates:', error);
      res.status(500).json({ message: 'Internal server error while fetching states.' });
    }
  },

  // Controller to get districts by state name
  async getDistrictsByState(req, res) {
    const { stateName } = req.params;
    if (!stateName) {
      return res.status(400).json({ message: 'Missing stateName parameter.' });
    }
    try {
      const districts = await InterviewModel.getDistrictsByState(stateName);
      res.status(200).json(districts);
    } catch (error) {
      console.error('Controller Error - getDistrictsByState:', error);
      res.status(500).json({ message: 'Internal server error while fetching districts.' });
    }
  },

  // Controller to get blocks by district name
  async getBlocksByDistrict(req, res) {
    const { districtName } = req.params;
    if (!districtName) {
      return res.status(400).json({ message: 'Missing districtName parameter.' });
    }
    try {
      const blocks = await InterviewModel.getBlocksByDistrict(districtName);
      res.status(200).json(blocks);
    } catch (error) {
      console.error('Controller Error - getBlocksByDistrict:', error);
      res.status(500).json({ message: 'Internal server error while fetching blocks.' });
    }
  },

  // Controller to get students eligible for interview by exam center
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

  // Controller to get students eligible for interview by block
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

  // Controller to get students eligible for reassignment by block
  async getReassignableStudentsByBlock(req, res) {
    const { stateName, districtName, blockName, nmmsYear } = req.query;
    if (!stateName || !districtName || !blockName || !nmmsYear) {
      return res.status(400).json({ message: 'Missing required query parameters.' });
    }
    try {
      const students = await InterviewModel.getReassignableStudentsByBlock(stateName, districtName, blockName, nmmsYear);
      res.status(200).json(students);
    } catch (error) {
      console.error('Controller Error - getReassignableStudentsByBlock:', error);
      res.status(500).json({ message: 'Internal server error while fetching reassignable students by block.' });
    }
  },

  // Controller to get all available interviewers
  async getInterviewers(req, res) {
    try {
      const interviewers = await InterviewModel.getInterviewers();
      res.status(200).json(interviewers);
    } catch (error) {
      console.error('Controller Error - getInterviewers:', error);
      res.status(500).json({ message: 'Internal server error while fetching interviewers.' });
    }
  },

  // Controller to assign students to an interviewer
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

  // Controller to get students who can be reassigned
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

  // Controller to reassign students to a new interviewer
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

  // Controller to get a list of students assigned to a specific interviewer
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

  // Controller to submit the results of a student's interview
  async submitInterviewDetails(req, res) {
    const interviewData = req.body;
    const { applicantId, remarks } = interviewData;

    // Server-side check for mandatory fields: applicantId, file, and remarks
    if (
        !applicantId ||  
        !remarks || 
        remarks.trim() === '' ||
        !req.files || 
        Object.keys(req.files).length === 0
    ) {
      return res.status(400).json({ message: 'Missing applicantId, mandatory remarks, or file in the request.' });
    }

    const uploadedFile = req.files.file; // 'file' is the key used in frontend FormData

    try {
      // Pass all necessary data to the model
      const updatedInterview = await InterviewModel.submitInterviewDetails(applicantId, interviewData, uploadedFile);
      res.status(200).json({ message: 'Interview details and file submitted successfully.', data: updatedInterview });
    } catch (error) {
      console.error('Controller Error - submitInterviewDetails:', error);
      // Ensure the error message is passed to the frontend
      res.status(500).json({ message: error.message || 'Internal server error while submitting interview details.' });
    }
  },

  // --- NEW: Controller to get students for home verification dropdown ---
  async getStudentsForVerification(req, res) {
    try {
      const students = await InterviewModel.getStudentsForVerification();
      res.status(200).json(students);
    } catch (error) {
      console.error('Controller Error - getStudentsForVerification:', error);
      res.status(500).json({ message: "Failed to fetch students for verification." });
    }
  },

  // --- NEW: Controller to submit home verification data and file ---
  async submitHomeVerification(req, res) {
    const verificationData = req.body;
    const { applicantId, status, verifiedBy, verificationType, dateOfVerification } = verificationData;

    // The file upload field name from the frontend is 'verificationDocument'
    const uploadedFile = req.files ? req.files.verificationDocument : null; 

    // Server-side check for mandatory fields
    if (
        !applicantId || 
        !status || 
        !verifiedBy || 
        !verificationType ||
        !dateOfVerification
    ) {
      // Note: File is optional based on the prompt's implied logic
      return res.status(400).json({ message: 'Missing applicantId, status, verifiedBy, verificationType, or dateOfVerification.' });
    }

    try {
      // Pass the verification data and the uploaded file object to the model
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


  // --- NEW: Controller to get students for home verification dropdown ---
  async getStudentsForVerification(req, res) {
    try {
      // NOTE: If you receive a TypeError here, verify that 
      // InterviewModel.getStudentsForVerification is correctly included and exported in the Model file.
      const students = await InterviewModel.getStudentsForVerification();
      res.status(200).json(students);
    } catch (error) {
      console.error('Controller Error - getStudentsForVerification:', error);
      res.status(500).json({ message: "Failed to fetch students for verification." });
    }
  },

  // --- NEW: Controller to submit home verification data and file ---
  async submitHomeVerification(req, res) {
    const verificationData = req.body;
    const { applicantId, status, verifiedBy, verificationType, dateOfVerification } = verificationData;

    // Assumes file is available at req.files.verificationDocument via express-fileupload middleware
    const uploadedFile = req.files ? req.files.verificationDocument : null; 

    // Server-side check for mandatory fields
    if (
        !applicantId || 
        !status || 
        !verifiedBy || 
        !verificationType ||
        !dateOfVerification
    ) {
      return res.status(400).json({ message: 'Missing applicantId, status, verifiedBy, verificationType, or dateOfVerification.' });
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

  
};

module.exports = InterviewController;