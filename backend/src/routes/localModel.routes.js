const express = require('express');
const multer = require('multer');
const {
  trainLocalModel,
  listLocalSamples,
  getLocalStats,
  clearLocalSamples,
  trainLocalMl,
  getLocalMlStatus,
  evaluateLocalMl,
} = require('../controllers/localModel.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    if (file.mimetype === 'application/octet-stream') {
      const ext = (file.originalname || '').toLowerCase();
      if (ext.endsWith('.heic') || ext.endsWith('.heif')) return cb(null, true);
    }
    return cb(new Error('Seuls les fichiers image sont acceptes (JPG, PNG, GIF, HEIC)'), false);
  },
});

router.post('/local/train', upload.single('image'), trainLocalModel);
router.get('/local/samples', listLocalSamples);
router.get('/local/stats', getLocalStats);
router.delete('/local/samples', clearLocalSamples);

router.post('/local/model/train', express.json(), trainLocalMl);
router.get('/local/model/status', getLocalMlStatus);
router.post('/local/model/evaluate', express.json(), evaluateLocalMl);

module.exports = router;

