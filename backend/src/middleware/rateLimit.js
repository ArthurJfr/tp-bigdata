const rateLimit = require('express-rate-limit');

// Limiteur générique pour toute l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requêtes / IP / fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes depuis cette adresse IP, réessayez plus tard.',
  },
});

// Limiteur plus strict pour l’analyse d’images
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 analyses / IP / minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop d'analyses successives, merci de ralentir un peu.",
  },
});

module.exports = {
  apiLimiter,
  analyzeLimiter,
};

