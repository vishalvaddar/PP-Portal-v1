const DashboardModel = require('../models/evaluationDashboardModel');

const DashboardController = {
  async getOverallCounts(req, res) {
    const nmmsYear = 2025; // Hardcoded as per the user's queries
    try {
      const data = await DashboardModel.getOverallCounts(nmmsYear);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch overall counts.' });
    }
  },

  async getJurisdictionalProgress(req, res) {
    const nmmsYear = 2025; // Hardcoded as per the user's queries
    try {
      const jurisdictions = await DashboardModel.getJurisdictions(nmmsYear);
      const fullData = await Promise.all(
        jurisdictions.map(async (juris) => {
          const counts = await DashboardModel.getJurisdictionCounts(juris.juris_code, nmmsYear);
          
          // Calculate progress percentages
          const evaluationProgress = counts.totalShortlisted > 0
            ? ((counts.totalShortlisted - counts.pendingEvaluation) / counts.totalShortlisted) * 100
            : 100;

          const interviewProgress = counts.totalInterviewRequired > 0
            ? (counts.completedInterview / counts.totalInterviewRequired) * 100
            : 100;

          const homeVerificationProgress = counts.totalHomeVerificationRequired > 0
            ? (counts.completedHomeVerification / counts.totalHomeVerificationRequired) * 100
            : 100;

          // Calculate overall progress and completion status
          const progressSteps = [];
          if (evaluationProgress > 0 && evaluationProgress <= 100) progressSteps.push(evaluationProgress);
          if (interviewProgress > 0 && interviewProgress <= 100) progressSteps.push(interviewProgress);
          if (homeVerificationProgress > 0 && homeVerificationProgress <= 100) progressSteps.push(homeVerificationProgress);

          const overallProgress = progressSteps.length > 0
            ? progressSteps.reduce((sum, val) => sum + val, 0) / progressSteps.length
            : 100;

          const isComplete = Math.floor(overallProgress) === 100;
          
          return {
            ...juris,
            counts,
            progress: Math.floor(overallProgress),
            isComplete
          };
        })
      );
      res.json(fullData);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch jurisdiction dashboard data.' });
    }
  },

  async getOverallProgress(req, res) {
    const nmmsYear = 2025;
    try {
      const data = await DashboardModel.getOverallProgress(nmmsYear);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch overall progress.' });
    }
  }
};

module.exports = DashboardController;
