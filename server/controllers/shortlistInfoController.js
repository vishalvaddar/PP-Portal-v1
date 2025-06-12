// controllers/shortlistInfoController.js
const ShortlistInfoModel = require("../models/shortlistInfoModel");
const xlsx = require('xlsx');

const shortlistInfoController = {
  getShortlistNames: async (req, res) => {
    try {
      const names = await ShortlistInfoModel.getAllShortlistNames();
      res.json(names);
    } catch (error) {
      console.error("Error in getShortlistNames controller:", error);
      res.status(500).json({ message: "Error fetching shortlist names", error: error.message });
    }
  },

  getNonFrozenShortlistNames: async (req, res) => {
    try {
      const nonFrozenNames = await ShortlistInfoModel.getNonFrozenShortlistNames();
      res.json(nonFrozenNames);
    } catch (error) {
      console.error("Error in getNonFrozenShortlistNames controller:", error);
      res.status(500).json({ message: "Error fetching non-frozen shortlist names", error: error.message });
    }
  },

  getShortlistDetails: async (req, res) => {
    const { shortlistName } = req.params;
    try {
      const info = await ShortlistInfoModel.getShortlistInfo(shortlistName);
      if (!info) {
        return res.status(404).json({ message: "Shortlist not found" });
      }
      res.json(info);
    } catch (error) {
      console.error(`Error in getShortlistDetails controller for ${shortlistName}:`, error);
      res.status(500).json({ message: "Error fetching shortlist information", error: error.message });
    }
  },

  getCounts: async (req, res) => {
    try {
      const totalApplicants = await ShortlistInfoModel.getTotalApplicantCount();
      const totalShortlisted = await ShortlistInfoModel.getTotalShortlistedCount();
      res.json({ totalApplicants, totalShortlisted });
    } catch (error) {
      console.error("Error fetching counts:", error);
      res.status(500).json({ message: "Error fetching applicant counts", error: error.message });
    }
  },

  freezeShortlist: async (req, res) => {
    const { shortlistBatchId } = req.body; // Expecting the ID in the request body
    if (!shortlistBatchId) {
      return res.status(400).json({ message: "Shortlist ID is required" });
    }
    try {
      const isFrozen = await ShortlistInfoModel.freezeShortlist(shortlistBatchId);
      if (isFrozen) {
        res.json({ message: "Shortlist frozen successfully" });
      } else {
        res.status(404).json({ message: "Shortlist not found or could not be frozen" });
      }
    } catch (error) {
      console.error(`Error freezing shortlist with ID ${shortlistBatchId}:`, error);
      res.status(500).json({ message: "Error freezing shortlist", error: error.message });
    }
  },

  deleteShortlist: async (req, res) => {
    const { shortlistBatchId } = req.body; // Expecting the ID in the request body
    if (!shortlistBatchId) {
      return res.status(400).json({ message: "Shortlist ID is required for deletion" });
    }
    try {
      const isDeleted = await ShortlistInfoModel.deleteShortlist(shortlistBatchId);
      if (isDeleted) {
        res.json({ message: "Shortlist deleted successfully" });
      } else {
        res.status(404).json({ message: "Shortlist not found or could not be deleted" });
      }
    } catch (error) {
      console.error(`Error deleting shortlist with ID ${shortlistBatchId}:`, error);
      res.status(500).json({ message: "Error deleting shortlist", error: error.message });
    }
  },

  getShortlistedApplicantsForShow: async (req, res) => {
    const { shortlistName } = req.params;
    try {
      const shortlistInfo = await ShortlistInfoModel.getShortlistInfo(shortlistName);
      if (!shortlistInfo) {
        return res.status(404).json({ message: "Shortlist not found" });
      }
      const applicants = await ShortlistInfoModel.getShortlistedApplicantsForShow(shortlistInfo.id);
      res.json({ name: shortlistInfo.name, data: applicants });
    } catch (error) {
      console.error(`Error fetching shortlisted applicants for show for ${shortlistName}:`, error);
      res.status(500).json({ message: "Error fetching shortlisted applicants for show", error: error.message });
    }
  },

  getShortlistedApplicantsForDownload: async (req, res) => {
    const { shortlistName } = req.params;
    try {
      const shortlistInfo = await ShortlistInfoModel.getShortlistInfo(shortlistName);
      if (!shortlistInfo) {
        return res.status(404).json({ message: "Shortlist not found" });
      }
      const applicants = await ShortlistInfoModel.getShortlistedApplicantsForDownload(shortlistInfo.id);
      console.log("Data from model (for download):", applicants); // Added console log here
      res.json({ name: shortlistInfo.name, data: applicants });
    } catch (error) {
      console.error(`Error fetching all applicant data for download for ${shortlistName}:`, error);
      res.status(500).json({ message: "Error fetching all applicant data for download", error: error.message });
    }
  },
};

module.exports = shortlistInfoController;