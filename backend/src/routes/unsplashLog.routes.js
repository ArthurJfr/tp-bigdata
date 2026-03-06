const express = require('express');
const { getUnsplashLog, clearUnsplashLog } = require('../controllers/unsplashLog.controller');

const router = express.Router();

router.get('/unsplash/log', getUnsplashLog);
router.delete('/unsplash/log', clearUnsplashLog);

module.exports = router;
