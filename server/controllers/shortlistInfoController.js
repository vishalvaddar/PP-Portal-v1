const ShortlistInfoModel = require("../models/shortlistInfoModel");
const xlsx = require("xlsx");

const shortlistInfoController = {
  // Fetch all shortlist batch names
  getShortlistNames: async (req, res) => {
    try {
      const names = await ShortlistInfoModel.getAllShortlistNames();
      res.json(names);
    } catch (error) {
      console.error("getShortlistNames Error:", error);
      res.status(500).json({ message: "Error fetching shortlist names", error: error.message });
    }
  },

  // Fetch only non-frozen shortlist batch names
  getNonFrozenShortlistNames: async (req, res) => {
    try {
      const nonFrozenNames = await ShortlistInfoModel.getNonFrozenShortlistNames();
      res.json(nonFrozenNames);
    } catch (error) {
      console.error("getNonFrozenShortlistNames Error:", error);
      res.status(500).json({ message: "Error fetching non-frozen shortlist names", error: error.message });
    }
  },

  // Fetch shortlist batch details by name
  getShortlistDetails: async (req, res) => {
    const { shortlistName } = req.params;
    try {
      const info = await ShortlistInfoModel.getShortlistInfo(shortlistName);
      if (!info) return res.status(404).json({ message: "Shortlist not found" });
      res.json(info);
    } catch (error) {
      console.error(`getShortlistDetails Error [${shortlistName}]:`, error);
      res.status(500).json({ message: "Error fetching shortlist information", error: error.message });
    }
  },

  // Fetch total applicants and shortlisted counts
  getCounts: async (req, res) => {
    try {
      const totalApplicants = await ShortlistInfoModel.getTotalApplicantCount();
      const totalShortlisted = await ShortlistInfoModel.getTotalShortlistedCount();
      res.json({ totalApplicants, totalShortlisted });
    } catch (error) {
      console.error("getCounts Error:", error);
      res.status(500).json({ message: "Error fetching applicant counts", error: error.message });
    }
  },

  // Freeze a shortlist batch by ID
  freezeShortlist: async (req, res) => {
    const { shortlistBatchId } = req.body;
    if (!shortlistBatchId) {
      return res.status(400).json({ message: "Shortlist batch ID is required" });
    }
    try {
      const success = await ShortlistInfoModel.freezeShortlist(shortlistBatchId);
      if (success) {
        res.json({ message: "Shortlist frozen successfully" });
      } else {
        res.status(404).json({ message: "Shortlist not found or already frozen" });
      }
    } catch (error) {
      console.error(`freezeShortlist Error [ID: ${shortlistBatchId}]:`, error);
      res.status(500).json({ message: "Error freezing shortlist", error: error.message });
    }
  },

  // Delete a shortlist batch by ID
  deleteShortlist: async (req, res) => {
    const { shortlistBatchId } = req.body;
    if (!shortlistBatchId) {
      return res.status(400).json({ message: "Shortlist batch ID is required for deletion" });
    }
    try {
      const success = await ShortlistInfoModel.deleteShortlist(shortlistBatchId);
      if (success) {
        res.json({ message: "Shortlist deleted successfully" });
      } else {
        res.status(404).json({ message: "Shortlist not found or could not be deleted" });
      }
    } catch (error) {
      console.error(`deleteShortlist Error [ID: ${shortlistBatchId}]:`, error);
      res.status(500).json({ message: "Error deleting shortlist", error: error.message });
    }
  },

  // Get shortlisted applicants (view only)
  getShortlistedApplicantsForShow: async (req, res) => {
    const { shortlistName } = req.params;
    try {
      const shortlistInfo = await ShortlistInfoModel.getShortlistInfo(shortlistName);
      if (!shortlistInfo) {
        return res.status(404).json({ message: "Shortlist not found" });
      }
      const applicants = await ShortlistInfoModel.getShortlistedApplicantsForShow(shortlistInfo.shortlist_batch_id);
      res.json({ name: shortlistInfo.shortlist_batch_name, data: applicants });
    } catch (error) {
      console.error(`getShortlistedApplicantsForShow Error [${shortlistName}]:`, error);
      res.status(500).json({ message: "Error fetching shortlisted applicants", error: error.message });
    }
  },

  // Get shortlisted applicants (for Excel download)
  getShortlistedApplicantsForDownload: async (req, res) => {
    const { shortlistName } = req.params;
    try {
      const shortlistInfo = await ShortlistInfoModel.getShortlistInfo(shortlistName);
      if (!shortlistInfo) {
        return res.status(404).json({ message: "Shortlist not found" });
      }
      const applicants = await ShortlistInfoModel.getShortlistedApplicantsForDownload(shortlistInfo.shortlist_batch_id);
      console.log("Download Data:", applicants.length);
      res.json({ name: shortlistInfo.shortlist_batch_name, data: applicants });
    } catch (error) {
      console.error(`getShortlistedApplicantsForDownload Error [${shortlistName}]:`, error);
      res.status(500).json({ message: "Error fetching applicants for download", error: error.message });
    }
  },
};

module.exports = shortlistInfoController;
