// routes/shortlistRoutes.js
const express = require('express');
const router = express.Router();
const shortlistInfoController = require('../controllers/shortlistInfoController');

router.get('/names', shortlistInfoController.getShortlistNames);
router.get('/non-frozen-names', shortlistInfoController.getNonFrozenShortlistNames);
router.get('/info/:shortlistName', shortlistInfoController.getShortlistDetails);
router.get('/counts', shortlistInfoController.getCounts);
router.post('/freeze', shortlistInfoController.freezeShortlist);
router.delete('/delete', shortlistInfoController.deleteShortlist);
router.get('/show-data/:shortlistName', shortlistInfoController.getShortlistedApplicantsForShow);
router.get('/download-data/:shortlistName', shortlistInfoController.getShortlistedApplicantsForDownload);

module.exports = router;