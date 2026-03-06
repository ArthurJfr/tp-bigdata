const unsplashLog = require('../services/unsplashLog.service');

const getUnsplashLog = (_req, res) => {
  return res.status(200).json({ entries: unsplashLog.getLog() });
};

const clearUnsplashLog = (_req, res) => {
  unsplashLog.clearLog();
  return res.status(200).json({ message: 'Log Unsplash effacé' });
};

module.exports = { getUnsplashLog, clearUnsplashLog };
