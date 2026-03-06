const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const { mapTagsToCategories } = require('./categoryMapping.service');

let modelPromise;

const EMBEDDING_MODEL_ID = 'mobilenet_v2_alpha1';

const getModel = async () => {
  if (!modelPromise) {
    modelPromise = mobilenet.load({ version: 2, alpha: 1.0 });
  }
  return modelPromise;
};

const preprocessImageToBatchedTensor = (imageBuffer) => {
  const decoded = tf.node.decodeImage(imageBuffer, 3);
  const resized = tf.image.resizeBilinear(decoded, [224, 224]);
  const batched = resized.expandDims(0);
  decoded.dispose();
  resized.dispose();
  return batched;
};

const l2Normalize1d = (arr) => {
  let sumSq = 0;
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i];
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return arr.map((v) => v / norm);
};

/**
 * Analyse un buffer d'image via MobileNet (TensorFlow.js).
 * @param {Buffer} imageBuffer
 * @returns {Promise<{confidence: number, detectedTypes: string[], rawTags: Array, engine: string, steps: Array, technical: Object}>}
 */
const analyzeImageBuffer = async (imageBuffer) => {
  const model = await getModel();

  const batched = preprocessImageToBatchedTensor(imageBuffer);

  const predictions = await model.classify(batched);

  batched.dispose();

  const rawTags = (predictions || []).map((p) => ({
    name: p.className,
    confidence: parseFloat(p.probability.toFixed(4)),
  }));

  const { detectedTypes, confidence } = mapTagsToCategories(rawTags);

  return {
    confidence,
    detectedTypes,
    rawTags,
    engine: 'tensorflow',
    steps: [
      { id: 1, label: 'Chargement du modèle', detail: 'MobileNet v2 (alpha 1.0)' },
      { id: 2, label: 'Prétraitement', detail: 'Décodage → redimensionnement 224×224 → batch' },
      { id: 3, label: 'Classification', detail: 'Prédiction des 1000 classes ImageNet' },
      { id: 4, label: 'Mapping catégories', detail: 'Correspondance mots-clés → 5 catégories du TP' },
    ],
    technical: {
      model: 'MobileNet v2',
      modelVersion: '2',
      alpha: 1.0,
      inputSize: [224, 224],
      rawPredictionsCount: rawTags.length,
      categoryMapping: 'keywords (Humains, Personnages fictifs, Plantes, Véhicules, Animaux)',
    },
  };
};

/**
 * Extrait un embedding (features) depuis MobileNet.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{vector: number[], dim: number, modelId: string}>}
 */
const extractEmbedding = async (imageBuffer) => {
  const model = await getModel();
  const batched = preprocessImageToBatchedTensor(imageBuffer);

  // mobilenet.infer retourne un Tensor; on prend l'activation interne (embedding)
  const embeddingTensor = model.infer(batched, true);
  const flat = await embeddingTensor.flatten().array();

  batched.dispose();
  embeddingTensor.dispose();

  const vector = l2Normalize1d(flat.map((v) => Number(v)));
  return { vector, dim: vector.length, modelId: EMBEDDING_MODEL_ID };
};

module.exports = { analyzeImageBuffer, extractEmbedding, EMBEDDING_MODEL_ID };

