
const {getStates,getDistrictsByState,getBlocksByDistrict} = require('../models/resultandrankingModel')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

module.exports ={
    fetchBlocksByDistrict,
    fetchDistrictsByState,
    fetchStates
}