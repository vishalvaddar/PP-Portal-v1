// controllers/shortlistInfoController.js
const ShortlistInfoModel = require("../models/shortlistInfoModel");
const xlsx = require("xlsx");
const pool = require("../config/db");
const path = require('path'); 
const fs = require('fs');    
const GENERATED_FILES_ROOT = path.join(process.env.FILE_STORAGE_PATH, 'generated-shortlist-data');

const shortlistInfoController = {
  // Fetch all shortlist batch names
  getShortlistNames: async (req, res) => {
    const { year } = req.query; // Extract year from query params
    try {
      const names = await ShortlistInfoModel.getAllShortlistNames(year);
      res.json(names);
    } catch (error) {
      console.error("getShortlistNames Error in controller:", error);
      res.status(500).json({ message: "Error fetching shortlist names", error: error.message });
    }
  },

  // Fetch only non-frozen shortlist batch names
  getNonFrozenShortlistNames: async (req, res) => {
    const { year } = req.query; // Extract year from query params
    try {
      const nonFrozenNames = await ShortlistInfoModel.getNonFrozenShortlistNames(year);
      res.json(nonFrozenNames);
    } catch (error) {
      console.error("getNonFrozenShortlistNames Error in controller:", error);
      res.status(500).json({ message: "Error fetching non-frozen shortlist names", error: error.message });
    }
  },

  // Fetch shortlist batch details by name
  getShortlistDetails: async (req, res) => {
    const { shortlistName } = req.params;
    const { year } = req.query; // Extract year from query params
    try {
      const info = await ShortlistInfoModel.getShortlistInfo(shortlistName, year);
      if (!info) return res.status(404).json({ message: "Shortlist not found" });
      res.json(info);
    } catch (error) {
      console.error(`getShortlistDetails Error [${shortlistName}] in controller:`, error);
      res.status(500).json({ message: "Error fetching shortlist information", error: error.message });
    }
  },

  // Fetch total applicants and shortlisted counts
  getCounts: async (req, res) => {
    const { year } = req.query; // Extract year from query params
    try {
      const totalApplicants = await ShortlistInfoModel.getTotalApplicantCount(year);
      const totalShortlisted = await ShortlistInfoModel.getTotalShortlistedCount(year);
      res.json({ totalApplicants, totalShortlisted });
    } catch (error) {
      console.error("getCounts Error in controller:", error);
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
      console.error(`freezeShortlist Error [ID: ${shortlistBatchId}] in controller:`, error);
      res.status(500).json({ message: "Error freezing shortlist", error: error.message });
    }
  },

  // Delete a shortlist batch by ID
  deleteShortlist: async (req, res) => {
    const { shortlistBatchId } = req.body;
    const { year } = req.query; // Extract year from query params
    if (!shortlistBatchId) {
      return res.status(400).json({ message: "Shortlist batch ID is required for deletion" });
    }
    try {
      const success = await ShortlistInfoModel.deleteShortlist(shortlistBatchId, year);
      if (success) {
        res.json({ message: "Shortlist deleted successfully" });
      } else {
        res.status(404).json({ message: "Shortlist not found or could not be deleted" });
      }
    } catch (error) {
      console.error(`deleteShortlist Error [ID: ${shortlistBatchId}] in controller:`, error);
      res.status(500).json({ message: "Error deleting shortlist", error: error.message });
    }
  },

  // Get shortlisted applicants (view only)
  getShortlistedApplicantsForShow: async (req, res) => {
    const { shortlistName } = req.params;
    const { year } = req.query; // Extract year from query params
    try {
      const shortlistInfo = await ShortlistInfoModel.getShortlistInfo(shortlistName, year);
      if (!shortlistInfo) {
        return res.status(404).json({ message: "Shortlist not found" });
      }
      const applicants = await ShortlistInfoModel.getShortlistedApplicantsForShow(shortlistInfo.id, year);
      res.json({ name: shortlistInfo.name, data: applicants });
    } catch (error) {
      console.error(`getShortlistedApplicantsForShow Error [${shortlistName}] in controller:`, error);
      res.status(500).json({ message: "Error fetching shortlisted applicants", error: error.message });
    }
  },

  // Get shortlisted applicants (for Excel download)
  // Get shortlisted applicants (for Excel download and Local Production Save)
getShortlistedApplicantsForDownload: async (req, res) => {
    const { shortlistName } = req.params;
    const { year: queryYear } = req.query; // Extract year from query params

    try {
        // Use the year from query. 
        const year = queryYear;

        const shortlistInfo = await ShortlistInfoModel.getShortlistInfo(shortlistName, year);
        if (!shortlistInfo) {
            return res.status(404).json({ message: "Shortlist not found" });
        }

        const totalStudentsInBatchRes = await pool.query(
            `SELECT COUNT(*) AS total_students
             FROM pp.applicant_primary_info api
             JOIN pp.shortlist_batch_jurisdiction sbj ON api.nmms_block = sbj.juris_code
             WHERE api.nmms_year = $1
               AND sbj.shortlist_batch_id = $2
               AND api.applicant_id IN (
                 SELECT applicant_id FROM pp.applicant_shortlist_info
               );`,
            [year, shortlistInfo.id]
        );
        const totalStudentsInBatch = parseInt(totalStudentsInBatchRes.rows[0]?.total_students || "0", 10);

        if (totalStudentsInBatch === 0) {
            console.log(`Controller: No students found for download in shortlist "${shortlistName}" for year ${year}. Sending 'no_data' status.`);
            return res.status(200).json({ status: "no_data", message: "Cannot download: No students exist for this shortlist." });
        }

        let applicants = await ShortlistInfoModel.getShortlistedApplicantsForDownload(shortlistInfo.id, year);

        // Add S. No. as the first column
        applicants = applicants.map((applicant, index) => {
            const newApplicant = { "S. No.": index + 1 };
            for (const key in applicant) {
                newApplicant[key] = applicant[key];
            }
            return newApplicant;
        });

        // --- EXCEL GENERATION ---
        const fileName = `${shortlistName}_Applicants.xlsx`;
        const worksheet = xlsx.utils.json_to_sheet(applicants);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Applicants");

        // --- STEP A: SAVE LOCALLY ON PRODUCTION SERVER DISK ---
        // Using strictly: path.join(process.env.FILE_STORAGE_PATH, 'generated-shortlist-data')
        const GENERATED_FILES_ROOT = path.join(process.env.FILE_STORAGE_PATH, 'generated-shortlist-data');
        
        if (!fs.existsSync(GENERATED_FILES_ROOT)) {
            fs.mkdirSync(GENERATED_FILES_ROOT, { recursive: true });
        }

        const localSavePath = path.join(GENERATED_FILES_ROOT, fileName);
        xlsx.writeFile(workbook, localSavePath);
       // console.log(`✅ Production copy saved locally: ${localSavePath}`);

        // --- STEP B: SEND TO USER FOR DOWNLOAD (BINARY BUFFER) ---
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers to trigger browser download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
     //   console.log(`Controller: Binary data sent for download of "${shortlistName}" (Year: ${year})`);
        return res.status(200).send(buffer);

    } catch (error) {
        console.error(`getShortlistedApplicantsForDownload Error [${shortlistName}] in controller:`, error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Error fetching applicants for download", error: error.message });
        }
    }
}
};

module.exports = shortlistInfoController;