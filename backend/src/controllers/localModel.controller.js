const LocalSample = require('../models/LocalSample.model');
const { addTrainingExample } = require('../services/localModel.service');
const { trainLocalMlModel } = require('../services/localMlTraining.service');
const modelStore = require('../services/localMlModelStore.service');
const { evaluateLocalMlModel } = require('../services/localMlEvaluate.service');
const { ensureImageBuffer } = require('../utils/heicConverter');
const {
  validateLabel,
  sanitizeNumber,
  sanitizeTrainLocalMlBody,
} = require('../utils/bodyValidation');

const trainLocalModel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier image fourni' });
    }

    const { buffer, mimetype, originalname } = req.file;
    const imageBuffer = await ensureImageBuffer(buffer, mimetype, originalname);
    const { label } = req.body;

    // Protection injection : label doit être une chaîne dans la whitelist
    const validatedLabel = validateLabel(label);
    if (!validatedLabel) {
      return res.status(400).json({ error: 'Label de catégorie invalide' });
    }

    const sample = await addTrainingExample(imageBuffer, validatedLabel);

    return res.status(201).json({
      message: 'Exemple ajouté au modèle local',
      sampleId: sample._id,
      label: sample.label,
      tagsCount: sample.tags.length,
    });
  } catch (error) {
    console.error('Erreur entraînement modèle local:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const ALLOWED_LABELS = [
  'Humains',
  'Personnages fictifs',
  'Plantes',
  'Vehicules',
  'Animaux',
];

const ALLOWED_SOURCES = ['manual', 'unsplash', 'feedback', 'unknown'];

const listLocalSamples = async (req, res) => {
  try {
    let { page = 1, limit = 50, label, source, hasEmbedding } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const filter = {};

    if (label && ALLOWED_LABELS.includes(label)) {
      filter.label = label;
    }

    if (source && ALLOWED_SOURCES.includes(source)) {
      filter.source = source;
    }

    if (hasEmbedding === 'true') {
      filter.embedding = { $ne: null };
    } else if (hasEmbedding === 'false') {
      filter.$or = [{ embedding: null }, { embedding: { $exists: false } }];
    }

    const [items, total] = await Promise.all([
      LocalSample.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LocalSample.countDocuments(filter),
    ]);

    const itemsWithMeta = items.map((doc) => ({
      _id: doc._id,
      createdAt: doc.createdAt,
      label: doc.label,
      source: doc.source,
      tags: doc.tags || [],
      embeddingPresent: Boolean(doc.embedding && doc.embedding.length > 0),
      embeddingDim: doc.embeddingDim ?? null,
      embeddingModel: doc.embeddingModel ?? null,
    }));

    return res.status(200).json({
      items: itemsWithMeta,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error('Erreur listLocalSamples:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const getLocalStats = async (_req, res) => {
  try {
    const totalSamples = await LocalSample.countDocuments({});

    const pipeline = [
      {
        $group: {
          _id: '$label',
          count: { $sum: 1 },
        },
      },
    ];

    const byLabelAgg = await LocalSample.aggregate(pipeline);
    const byLabel = byLabelAgg.reduce(
      (acc, item) => ({ ...acc, [item._id]: item.count }),
      {}
    );

    return res.status(200).json({
      totalSamples,
      byLabel,
    });
  } catch (error) {
    console.error('Erreur stats modèle local:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const clearLocalSamples = async (req, res) => {
  try {

    // Protection NoSQL injection : label doit être une chaîne dans la whitelist
    const { validateClearSamplesBody } = require('../utils/bodyValidation');
    const validated = validateClearSamplesBody(req.body);
    if (validated.error) {
      return res.status(400).json({ error: validated.error });
    }
    const filter = validated.label ? { label: validated.label } : {};

    const toDelete = await LocalSample.countDocuments(filter);
    await LocalSample.deleteMany(filter);

    return res.status(200).json({
      message: label
        ? `Exemples du label "${label}" supprimés`
        : 'Tous les exemples du modèle local ont été supprimés',
      deleted: toDelete,
      label: label || null,
    });
  } catch (error) {
    console.error('Erreur suppression exemples modèle local:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const {
  sanitizeNumber,
  sanitizeTrainLocalMlBody,
  validateLabel,
} = require('../utils/bodyValidation');

const trainLocalMl = async (req, res) => {
  try {
    const sanitized = sanitizeTrainLocalMlBody(req.body);
    if (sanitized.error) {
      return res.status(400).json({ error: sanitized.error });
    }
    const result = await trainLocalMlModel(sanitized.data);

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({
      message: 'Modèle ML local entraîné et sauvegardé',
      metadata: result.metadata,
      history: result.history,
    });
  } catch (error) {
    console.error('Erreur entraînement modèle ML local:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const getLocalMlStatus = async (_req, res) => {
  try {
    const meta = modelStore.loadMetadata(modelStore.DEFAULT_DIR);
    const samplesCount = await LocalSample.countDocuments({ embedding: { $ne: null } });
    return res.status(200).json({
      trained: Boolean(meta),
      metadata: meta,
      samplesCount,
    });
  } catch (error) {
    console.error('Erreur status modèle ML local:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const evaluateLocalMl = async (req, res) => {
  try {
    const limit = sanitizeNumber(req.body?.limit, 1000, 1, 5000);
    const result = await evaluateLocalMlModel({ limit });
    return res.status(200).json(result);
  } catch (error) {
    if (error?.code === 'MODEL_NOT_TRAINED') {
      return res.status(409).json({
        error: "Le modèle ML local n'est pas encore entraîné.",
        code: 'MODEL_NOT_TRAINED',
      });
    }
    console.error('Erreur evaluation modèle ML local:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

module.exports = {
  trainLocalModel,
  listLocalSamples,
  getLocalStats,
  clearLocalSamples,
  trainLocalMl,
  getLocalMlStatus,
  evaluateLocalMl,
};

