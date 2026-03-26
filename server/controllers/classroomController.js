const classroom = require("../models/classroomModel");

// GET /api/classrooms/teachers/:subjectId
exports.getTeachersBySubject = async (req, res) => {
    try {
        const teachers = await classroom.getTeachersBySubject(req.params.subjectId);
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/classrooms
exports.createClassroom = async (req, res) => {
    try {
        const result = await classroom.createClassroom(req.body);
        res.status(201).json({ message: "Classroom created successfully", ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/classrooms
exports.getClassrooms = async (req, res) => {
    try {
        const classrooms = await classroom.getClassrooms();
        res.status(200).json(classrooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/classrooms/subjects
exports.getSubjects = async (req, res) => {
    try {
        const subjects = await classroom.getSubjects();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/classrooms/platforms
exports.getTeachingPlatforms = async (req, res) => {
    try {
        const platforms = await classroom.getTeachingPlatforms();
        res.status(200).json(platforms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/classrooms/batches/:cohortNumber
exports.getBatchesByCohort = async (req, res) => {
    try {
        const batches = await classroom.getBatchesByCohort(req.params.cohortNumber);
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/classrooms/:id
exports.updateClassroom = async (req, res) => {
    try {
        const updated = await classroom.updateClassroom(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: "Classroom not found" });
        res.status(200).json({ message: "Classroom updated", ...updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/classrooms/:id
exports.deleteClassroom = async (req, res) => {
    try {
        const deleted = await classroom.deleteClassroom(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Classroom not found" });
        res.status(200).json({ message: "Classroom deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};