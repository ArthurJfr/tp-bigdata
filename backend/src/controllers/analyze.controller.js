const { analyzeImageBuffer } = require('../services/tensorflow.service');
const { predictWithLocalMlModel } = require('../services/localModel.service');
const Image = require('../models/Image.model');
const { ensureImageBuffer } = require('../utils/heicConverter');
const { validateAnalyzeModel } = require('../utils/bodyValidation');

const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier image fourni' });
    }

    const { originalname, size, buffer } = req.file;
    const model = validateAnalyzeModel(req.body?.model) ?? 'tensorflow';

    console.log(
      `[Analyze] Nouvelle requête /api/analyze, modèle demandé="${model}", fichier="${originalname}" (${size} o)`
    );

    const imageBuffer = await ensureImageBuffer(buffer, req.file.mimetype, originalname);

    let analysis;
    try {
      if (model === 'tensorflow') {
        console.log('[Analyze] Utilisation de TensorFlow.js / MobileNet');
        analysis = await analyzeImageBuffer(imageBuffer);
      } else if (model === 'local-ml') {
        console.log('[Analyze] Utilisation du modèle ML local entraîné');
        analysis = await predictWithLocalMlModel(imageBuffer);
      } else {
        console.warn('[Analyze] Modèle inconnu demandé :', model);
        return res.status(400).json({ error: 'Moteur de modèle inconnu' });
      }
    } catch (tfError) {
      if (tfError?.code === 'MODEL_NOT_TRAINED') {
        return res.status(409).json({
          error:
            "Le modèle ML local n'est pas encore entraîné. Va dans la page Entraînement et lance l'entraînement.",
          code: 'MODEL_NOT_TRAINED',
        });
      }
      if (tfError?.code === 'EMBEDDING_DIM_MISMATCH') {
        return res.status(422).json({
          error:
            "Le modèle ML local n'est plus compatible avec les embeddings actuels. Réentraîne le modèle ML sur les nouvelles données.",
          code: 'EMBEDDING_DIM_MISMATCH',
        });
      }
      if (tfError?.code === 'NO_EMBEDDINGS') {
        return res.status(400).json({
          error:
            "Aucun exemple avec embedding n'est disponible pour entraîner/prédire avec le modèle ML local. Ajoute des exemples via la page Entraînement.",
          code: 'NO_EMBEDDINGS',
        });
      }
      console.error('TensorFlow.js error:', tfError.message);
      return res.status(502).json({
        error:
          "Erreur lors de l'analyse de l'image par le moteur TensorFlow.js (voir logs backend pour le détail).",
      });
    }

    const image = new Image({
      imageName: originalname,
      imageSize: size,
      analysis,
    });

    await image.save();

    console.log(
      `[Analyze] Analyse enregistrée en base (id=${image._id}) avec types=${image.analysis.detectedTypes} confiance≈${(
        image.analysis.confidence * 100
      ).toFixed(1)}%`
    );

    return res.status(201).json({
      message: 'Image analysee avec succes',
      image,
    });
  } catch (error) {
    console.error('Erreur interne analyze:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

module.exports = { analyzeImage };
