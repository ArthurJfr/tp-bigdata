const express = require('express');
const { bootstrapFromWeb } = require('../controllers/webTraining.controller');

const router = express.Router();

router.post('/local/bootstrap', bootstrapFromWeb);

module.exports = router;

