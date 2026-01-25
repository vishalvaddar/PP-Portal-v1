const jurisdictionModel = require("../models/jurisdictionModel");
const pool = require("../config/db");

// Controller: Fetch all States
exports.getStates = async (req, res) => {
  try {
    const states = await jurisdictionModel.getStates();
    res.status(200).json({
      success: true,
      message: "States fetched successfully",
      data: states,
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch states",
      error: error.message,
    });
  }
};

// Controller: Fetch Divisions by State
exports.getDivisionsByState = async (req, res) => {
  try {
    const { stateId } = req.params;
    if (!stateId)
      return res.status(400).json({ success: false, message: "stateId is required" });

    const divisions = await jurisdictionModel.getDivisionsByState(stateId);
    res.status(200).json({
      success: true,
      message: "Divisions fetched successfully",
      data: divisions,
    });
  } catch (error) {
    console.error("Error fetching divisions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch divisions",
      error: error.message,
    });
  }
};

// Controller: Fetch Districts by Division
exports.getDistrictsByDivision = async (req, res) => {
  try {
    const { divisionId } = req.params;
    if (!divisionId)
      return res.status(400).json({ success: false, message: "divisionId is required" });

    const districts = await jurisdictionModel.getDistrictsByDivision(divisionId);
    res.status(200).json({
      success: true,
      message: "Districts fetched successfully",
      data: districts,
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch districts",
      error: error.message,
    });
  }
};

// Controller: Fetch Blocks by District
exports.getBlocksByDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;
    if (!districtId)
      return res.status(400).json({ success: false, message: "districtId is required" });

    const blocks = await jurisdictionModel.getBlocksByDistrict(districtId);
    res.status(200).json({
      success: true,
      message: "Blocks fetched successfully",
      data: blocks,
    });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blocks",
      error: error.message,
    });
  }
};

// Controller: Fetch Clusters by Block
exports.getClustersByBlock = async (req, res) => {
  try {
    const { blockId } = req.params;
    if (!blockId)
      return res.status(400).json({ success: false, message: "blockId is required" });

    const clusters = await jurisdictionModel.getClustersByBlock(blockId);
    res.status(200).json({
      success: true,
      message: "Clusters fetched successfully",
      data: clusters,
    });
  } catch (error) {
    console.error("Error fetching clusters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clusters",
      error: error.message,
    });
  }
};

// Controller: Fetch Institutes by Cluster
exports.getInstitutesByCluster = async (req, res) => {
  try {
    const { clusterId } = req.params;
    if (!clusterId)
      return res.status(400).json({ success: false, message: "clusterId is required" });

    const institutes = await jurisdictionModel.getInstitutesByCluster(clusterId);
    res.status(200).json({
      success: true,
      message: "Institutes fetched successfully",
      data: institutes,
    });
  } catch (error) {
    console.error("Error fetching institutes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch institutes",
      error: error.message,
    });
  }
};

exports.getJurisName = async (req, res) => {
  try {
    const { juris_code } = req.params;
    if (!juris_code) {
      return res.status(400).json({ success: false, message: "juris_code is required" });
    }
    const jurisName = await jurisdictionModel.getJurisName(juris_code);
    res.status(200).json({
      success: true,
      message: "Jurisdiction name fetched successfully",
      data: jurisName,
    });
  } catch (error) {
    console.error("Error fetching jurisdiction name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jurisdiction name",
      error: error.message,
    });
  }
};