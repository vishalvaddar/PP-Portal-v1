const DashboardModel = require('../models/evaluationDashboardModel');

const DashboardController = {
  // Helper to get the year from URL params
  getYear(req) {
    return req.params.year ? parseInt(req.params.year, 10) : new Date().getFullYear();
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
      // 1. Fetch only jurisdictions that have shortlisted students (filtered in Model)
      const jurisdictions = await DashboardModel.getJurisdictions(nmmsYear);
      
      const fullData = await Promise.all(
        jurisdictions.map(async (juris) => {
          const counts = await DashboardModel.getJurisdictionCounts(juris.juris_code, nmmsYear);
          
          // 2. Calculate Evaluation Progress
          // If totalShortlisted is 0, progress is 0 (prevents false 100% completions)
          const evaluationProgress = counts.totalShortlisted > 0
            ? ((counts.totalShortlisted - counts.pendingEvaluation) / counts.totalShortlisted) * 100
            : 0;

          // 3. Calculate Interview/HV Progress (if your dashboard shows these)
          const interviewProgress = counts.totalInterviewRequired > 0
            ? (counts.completedInterview / counts.totalInterviewRequired) * 100
            : 100;

          const hvProgress = counts.totalHomeVerificationRequired > 0
            ? (counts.completedHomeVerification / counts.totalHomeVerificationRequired) * 100
            : 100;

          // 4. Calculate weighted average
          const avgProgress = (evaluationProgress + interviewProgress + hvProgress) / 3;

          return {
            ...juris,
            counts,
            progress: Math.floor(avgProgress),
            isComplete: Math.floor(avgProgress) === 100
          };
        })
      );

      res.json(fullData);
    } catch (err) {
      console.error('Controller Error (getJurisdictionalProgress):', err);
      res.status(500).json({ error: 'Failed to fetch jurisdictional progress.' });
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