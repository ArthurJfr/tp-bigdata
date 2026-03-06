const express = require('express');
const { getImages, deleteImage, getStats } = require('../controllers/images.controller');

const router = express.Router();

router.get('/images', getImages);
router.delete('/images/:id', deleteImage);
router.get('/stats', getStats);

module.exports = router;
