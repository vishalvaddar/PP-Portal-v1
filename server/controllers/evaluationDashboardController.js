const DashboardModel = require('../models/evaluationDashboardModel');

const DashboardController = {
  /**
   * Helper to get the year from query or default to current year.
   * This keeps the year logic consistent across all methods.
   */
  getYear(req) {
    return req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
  },

  async getOverallCounts(req, res) {
    const nmmsYear = DashboardController.getYear(req);
    try {
      const data = await DashboardModel.getOverallCounts(nmmsYear);
      res.json(data);
    } catch (err) {
      console.error('Controller Error (getOverallCounts):', err);
      res.status(500).json({ error: 'Failed to fetch overall counts.' });
    }
  },

  async getJurisdictionalProgress(req, res) {
    const nmmsYear = DashboardController.getYear(req);
    try {
      const jurisdictions = await DashboardModel.getJurisdictions(nmmsYear);
      
      const fullData = await Promise.all(
        jurisdictions.map(async (juris) => {
          const counts = await DashboardModel.getJurisdictionCounts(juris.juris_code, nmmsYear);
          
          // --- PROGRESS CALCULATION LOGIC ---
          // Evaluation: Shortlisted vs Pending
          const evaluationProgress = counts.totalShortlisted > 0
            ? ((counts.totalShortlisted - counts.pendingEvaluation) / counts.totalShortlisted) * 100
            : 100;

          // Interview: Required vs Completed
          const interviewProgress = counts.totalInterviewRequired > 0
            ? (counts.completedInterview / counts.totalInterviewRequired) * 100
            : 100;

          // Home Verification: Required vs Completed
          const homeVerificationProgress = counts.totalHomeVerificationRequired > 0
            ? (counts.completedHomeVerification / counts.totalHomeVerificationRequired) * 100
            : 100;

          // Overall weighted average for this block
          const progressSteps = [evaluationProgress, interviewProgress, homeVerificationProgress];
          const overallProgress = progressSteps.reduce((sum, val) => sum + val, 0) / progressSteps.length;

          return {
            ...juris,
            counts,
            progress: Math.floor(overallProgress),
            isComplete: Math.floor(overallProgress) === 100
          };
        })
      );
      
      res.json(fullData);
    } catch (err) {
      console.error('Controller Error (getJurisdictionalProgress):', err);
      res.status(500).json({ error: 'Failed to fetch jurisdiction dashboard data.' });
    }
  },

  async getOverallProgress(req, res) {
    const nmmsYear = DashboardController.getYear(req);
    try {
      const data = await DashboardModel.getOverallProgress(nmmsYear);
      res.json(data);
    } catch (err) {
      console.error('Controller Error (getOverallProgress):', err);
      res.status(500).json({ error: 'Failed to fetch overall progress.' });
    }
  }
};

module.exports = DashboardController;