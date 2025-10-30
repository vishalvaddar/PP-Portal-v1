const jurisdictionModel = require("../models/jurisdictionModel");

exports.fetchStates = async (req, res) => {
    try {
        const states = await jurisdictionModel.getStates();
        res.json(states);
    } catch (error) {
        console.error("Error fetching states:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.fetchDivisionsByState = async (req, res) => {
    try {
        const { stateId } = req.params;
        const divisions = await jurisdictionModel.getDivisionsByState(stateId);
        res.json(divisions);
    } catch (error) {
        console.error("Error fetching divisions:", error);
        res.status(500).json({ error: "Internal Server Error" });

    }
};

exports.fetchDistrictsByDivision = async (req, res) => {
    try {
        const { divisionId } = req.params;
        const districts = await jurisdictionModel.getDistrictsByDivision(divisionId);
        res.json(districts);
    }
    catch (error) {
        console.error("Error fetching districts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.fetchBlocksByDistrict = async (req, res) => {
    try {
        const { districtId } = req.params;
        const blocks = await jurisdictionModel.getBlocksByDistrict(districtId);
        res.json(blocks);
    }
    catch (error) {
        console.error("Error fetching blocks:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.fetchInstitutesByBlock = async (req, res) => {
    try {
        const { blockId } = req.params;
        const institutes = await jurisdictionModel.getInstitutesByBlock(blockId);
        res.json(institutes);
    }
    catch (error) {
        console.error("Error fetching institutes:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

