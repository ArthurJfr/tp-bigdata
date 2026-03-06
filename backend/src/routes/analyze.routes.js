const express = require('express');
const multer = require('multer');
const { analyzeImage } = require('../controllers/analyze.controller');
const { analyzeLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Stockage en memoire pour passer le buffer directement a Azure
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    if (file.mimetype === 'application/octet-stream') {
      const ext = (file.originalname || '').toLowerCase();
      if (ext.endsWith('.heic') || ext.endsWith('.heif')) return cb(null, true);
    }
    return cb(new Error('Seuls les fichiers image sont acceptes (JPG, PNG, GIF, HEIC)'), false);
  },
});

router.post('/analyze', analyzeLimiter, upload.single('image'), analyzeImage);

module.exports = router;
