const LocalSample = require('../models/LocalSample.model');
const { analyzeImageBuffer, extractEmbedding } = require('./tensorflow.service');
const modelStore = require('./localMlModelStore.service');
const { LABELS } = require('./localMlTraining.service');

/**
 * Ajoute un exemple d'entraînement dans le modèle local.
 * On utilise MobileNet pour extraire les tags, puis on stocke (tags, label).
 * @param {Buffer} imageBuffer
 * @param {string} label
 */
const addTrainingExample = async (imageBuffer, label) => {
  const [analysis, embedding] = await Promise.all([
    analyzeImageBuffer(imageBuffer),
    extractEmbedding(imageBuffer),
  ]);
  const { rawTags } = analysis;

  const sample = new LocalSample({
    label,
    tags: rawTags,
    embedding: embedding.vector,
    embeddingDim: embedding.dim,
    embeddingModel: embedding.modelId,
    source: 'manual',
  });

  await sample.save();

  console.log(
    `[LocalModel] Exemple ajouté pour "${label}" avec ${rawTags.length} tags (embeddingDim=${sample.embeddingDim}) (sampleId=${sample._id})`
  );

  return sample;
};

/**
 * Prédit une catégorie en utilisant le modèle local basé sur les exemples stockés.
 * Si aucun exemple n'existe, on retombe sur l'analyse TensorFlow classique.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{confidence: number, detectedTypes: string[], rawTags: Array}>}
 */
/**
 * Prédit une catégorie via le modèle ML local entraîné (tête dense sur embeddings).
 * @param {Buffer} imageBuffer
 * @returns {Promise<{confidence: number, detectedTypes: string[], rawTags: Array, topK?: Array}>}
 */
const predictWithLocalMlModel = async (imageBuffer) => {
  const { model, metadata } = await modelStore.loadModel();
  if (!model || !metadata) {
    const err = new Error('MODELE_LOCAL_ML_NON_ENTRAINE');
    err.code = 'MODEL_NOT_TRAINED';
    throw err;
  }

  const embedding = await extractEmbedding(imageBuffer);
  if (metadata.embeddingDim && embedding.dim !== metadata.embeddingDim) {
    const err = new Error('DIMENSION_EMBEDDING_INCOMPATIBLE');
    err.code = 'EMBEDDING_DIM_MISMATCH';
    throw err;
  }

  const x = require('@tensorflow/tfjs-node').tensor2d(
    [embedding.vector],
    [1, embedding.dim],
    'float32'
  );
  const probsTensor = model.predict(x);
  const probs = await probsTensor.array();
  x.dispose();
  probsTensor.dispose();

  const p = probs[0] || [];
  let bestIdx = 0;
  let best = p[0] ?? 0;
  for (let i = 1; i < p.length; i += 1) {
    if (p[i] > best) {
      best = p[i];
      bestIdx = i;
    }
  }

  // top-k pour debug/UI
  const topK = p
    .map((score, idx) => ({ label: (metadata.labels || LABELS)[idx], score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // on garde rawTags (utile pour afficher les tags, et cohérence UI)
  const tfAnalysis = await analyzeImageBuffer(imageBuffer);

  const labels = metadata.labels || LABELS;

  return {
    confidence: Number(best.toFixed(4)),
    detectedTypes: [labels[bestIdx] || 'Non identifie'],
    rawTags: tfAnalysis.rawTags,
    topK,
    engine: 'local-ml',
    steps: [
      { id: 1, label: 'Chargement du modèle local', detail: 'Tête Dense + Softmax sur embeddings' },
      { id: 2, label: 'Extraction embedding', detail: `MobileNet v2 → vecteur ${embedding.dim}D (L2 normalisé)` },
      { id: 3, label: 'Prédiction', detail: 'Forward pass sur le classifieur entraîné' },
      { id: 4, label: 'Top-K', detail: `Meilleure catégorie: ${labels[bestIdx]} (${(best * 100).toFixed(1)}%)` },
    ],
    technical: {
      model: 'Local ML (Dense + Softmax)',
      embeddingModel: embedding.modelId,
      embeddingDim: embedding.dim,
      numClasses: labels.length,
      labels,
      topK,
      trainedAt: metadata.trainedAt || null,
      sampleCount: metadata.sampleCount || null,
    },
  };
};

module.exports = {
  addTrainingExample,
  predictWithLocalMlModel,
};

