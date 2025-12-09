const model = require('../models/customListModel');

// 1. Get all lists
exports.getAllLists = async (req, res) => {
    try {
        const lists = await model.getAllLists();
        res.json(lists);
    } catch (err) {
        console.error("Error in getAllLists:", err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 2. Get students by cohort
exports.getStudentsByCohort = async (req, res) => {
    try {
        const { cohortId } = req.params;
        const students = await model.getStudentsByCohort(cohortId);
        res.json(students);
    } catch (err) {
        console.error("Error in getStudentsByCohort:", err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 3. Create List AND Add Students
exports.createListWithStudents = async (req, res) => {
    try {
        const { list_name, student_ids } = req.body;

        // Basic validation
        if (!list_name || !student_ids || !Array.isArray(student_ids)) {
            return res.status(400).json({ error: 'Missing list_name or student_ids array' });
        }

        const result = await model.createListWithStudents(list_name, student_ids);
        res.status(201).json(result);

    } catch (err) {
        console.error("Error in createListWithStudents:", err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 4. Update List Name
exports.updateListName = async (req, res) => {
    try {
        const { id } = req.params;
        const { list_name } = req.body;

        if (!list_name) {
            return res.status(400).json({ error: 'List name is required' });
        }

        const updatedList = await model.updateListName(id, list_name);
        res.json({ message: 'Updated successfully', list: updatedList });

    } catch (err) {
        console.error("Error in updateListName:", err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 5. Delete List
exports.deleteList = async (req, res) => {
    try {
        const { id } = req.params;
        await model.deleteList(id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error("Error in deleteList:", err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 6. View Students in a List
exports.getStudentsByListId = async (req, res) => {
    try {
        const { listId } = req.params;
        const students = await model.getStudentsByListId(listId);
        res.json(students);
    } catch (err) {
        console.error("Error in getStudentsByListId:", err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.addStudentsToList = async (req, res) => {
    try {
        const { list_id, student_ids } = req.body;
        if (!list_id || !student_ids || !Array.isArray(student_ids)) {
            return res.status(400).json({ error: 'Invalid data' });
        }
        await model.addStudentsToList(list_id, student_ids);
        res.json({ message: 'Students added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.removeStudentFromList = async (req, res) => {
    try {
        const { listId, studentId } = req.params;
        await model.removeStudentFromList(listId, studentId);
        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};