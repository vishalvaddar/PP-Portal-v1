// server/controllers/coordinator/classroomController.js

const {
  getClassroomsByBatch,
  getAllClassrooms: getAllClassroomsModel,
  createClassroom: createClassroomModel,
  getTeachers,
  getPlatforms,
  getCohorts,
  getBatches,
} = require("../../models/coordinator/classroomModel");

// ---------------------------------------------
// Get Classrooms by Batch ID
// ---------------------------------------------
const getClassroomsByBatchId = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ error: "batchId is required" });
    }

    const classrooms = await getClassroomsByBatch(batchId);
    res.json(classrooms);
  } catch (err) {
    console.error("Error fetching classrooms by batch:", err);
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
};

// ---------------------------------------------
// Get ALL Classrooms
// ---------------------------------------------
const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await getAllClassroomsModel(); // ✅ FIXED
    res.json(classrooms);
  } catch (err) {
    console.error("Error fetching all classrooms:", err);
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
};

// ---------------------------------------------
// Create a Classroom
// ---------------------------------------------
const createClassroom = async (req, res) => {
  try {
    const classroomData = req.body;

    const newClassroom = await createClassroomModel(classroomData);

    res.status(201).json(newClassroom);
  } catch (err) {
    console.error("Error creating classroom:", err);
    res.status(500).json({ error: "Failed to create classroom" });
  }
};

const fetchTeachers = async (req, res) => {
  try {
    const teachers = await getTeachers();
    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
};


const fetchPlatforms = async (req, res) => {
  try {
    const platforms = await getPlatforms();
    res.json(platforms);
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({ error: "Failed to fetch platforms" });
  }
};

const fetchClassrooms = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ error: "Batch ID is required" });
    }

    const classrooms = await getClassroomsByBatch(batchId);

    res.json(classrooms);
  } catch (err) {
    console.error("Error fetching classrooms:", err);
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
};

const fetchCohorts = async (req, res) => {
  try {
    const cohorts = await getCohorts();
    res.json(cohorts);
  } catch (err) {
    console.error("Error fetching cohorts:", err);
    res.status(500).json({ error: "Failed to fetch cohorts" });
  }
};

const fetchBatches = async (req, res) => {
  try {
    const { cohortId } = req.params;

    if (!cohortId) {
      return res.status(400).json({ error: "Cohort ID is required" });
    }

    const batches = await getBatches(cohortId);
    res.json(batches);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: "Failed to fetch batches" });
  }
};


module.exports = { getClassroomsByBatchId, getAllClassrooms, createClassroom, fetchTeachers, fetchPlatforms, fetchClassrooms, fetchCohorts, fetchBatches };