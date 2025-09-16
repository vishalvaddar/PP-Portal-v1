const InterviewModel = require("../models/interviewModel");

const InterviewController = {
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
      const results = await InterviewModel.assignStudents(applicantIds, interviewerId, nmmsYear);
      res.status(200).json({
        message: `Assignment process completed.`,
        results: results
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
      const results = await InterviewModel.reassignStudents(applicantIds, newInterviewerId, nmmsYear);
      res.status(200).json({
        message: `Reassignment process completed.`,
        results: results
      });
    } catch (error) {
      console.error('Controller Error - reassignStudents:', error);
      res.status(500).json({ message: 'Internal server error while reassigning students.' });
    }
  },

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
    const { applicantId } = interviewData;

    if (!applicantId || !interviewData) {
      return res.status(400).json({ message: 'Missing applicantId or interview data in body.' });
    }

    try {
      const updatedInterview = await InterviewModel.submitInterviewDetails(applicantId, interviewData);
      res.status(200).json({ message: 'Interview details submitted successfully.', data: updatedInterview });
    } catch (error) {
      console.error('Controller Error - submitInterviewDetails:', error);
      res.status(500).json({ message: error.message || 'Internal server error while submitting interview details.' });
    }
  }
};

module.exports = InterviewController;
