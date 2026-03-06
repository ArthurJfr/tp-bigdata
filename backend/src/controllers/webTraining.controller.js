const { bootstrapLocalTrainingFromWeb } = require('../services/webTraining.service');
const { sanitizeNumber } = require('../utils/bodyValidation');

const bootstrapFromWeb = async (req, res) => {
  try {
    const { perLabel } = req.body || {};
    const totalPerLabel = sanitizeNumber(perLabel, 5, 1, 20);

    const summary = await bootstrapLocalTrainingFromWeb(totalPerLabel);

    return res.status(200).json({
      message: 'Entraînement local automatique depuis le web terminé',
      summary,
    });
  } catch (error) {
    console.error('Erreur bootstrap web training:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

module.exports = { bootstrapFromWeb };

