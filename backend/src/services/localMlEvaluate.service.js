const tf = require('@tensorflow/tfjs-node');
const LocalSample = require('../models/LocalSample.model');
const modelStore = require('./localMlModelStore.service');
const { LABELS } = require('./localMlTraining.service');

const initMatrix = (n) =>
  Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

const evaluateLocalMlModel = async (options = {}) => {
  const { limit = 1000 } = options;

  const { model, metadata } = await modelStore.loadModel();
  if (!model || !metadata) {
    const err = new Error('MODELE_LOCAL_ML_NON_ENTRAINE');
    err.code = 'MODEL_NOT_TRAINED';
    throw err;
  }

  const labels = metadata.labels || LABELS;
  const numClasses = labels.length;

  const samples = await LocalSample.find(
    { embedding: { $ne: null } },
    { label: 1, embedding: 1, embeddingDim: 1 }
  )
    .limit(Math.max(1, Math.min(limit, 5000)));

  if (!samples.length) {
    return {
      samplesCount: 0,
      labels,
      accuracy: 0,
      confusionMatrix: initMatrix(numClasses),
      perLabelAccuracy: {},
    };
  }

  const dim = metadata.embeddingDim || samples[0].embeddingDim || samples[0].embedding.length;

  const X = samples.map((s) => s.embedding);
  const yTrue = samples.map((s) => labels.indexOf(s.label));

  const xTensor = tf.tensor2d(X, [X.length, dim], 'float32');
  const probsTensor = model.predict(xTensor);
  const probs = await probsTensor.array();
  xTensor.dispose();
  probsTensor.dispose();

  const confusion = initMatrix(numClasses);
  let correct = 0;
  const perLabel = {};

  for (let i = 0; i < probs.length; i += 1) {
    const p = probs[i] || [];
    let bestIdx = 0;
    let best = p[0] ?? 0;
    for (let j = 1; j < p.length; j += 1) {
      if (p[j] > best) {
        best = p[j];
        bestIdx = j;
      }
    }
    const t = yTrue[i];
    if (t >= 0) {
      confusion[t][bestIdx] += 1;
      perLabel[labels[t]] = perLabel[labels[t]] || { correct: 0, total: 0 };
      perLabel[labels[t]].total += 1;
      if (bestIdx === t) {
        correct += 1;
        perLabel[labels[t]].correct += 1;
      }
    }
  }

  const perLabelAccuracy = Object.fromEntries(
    Object.entries(perLabel).map(([label, { correct: c, total }]) => [
      label,
      total ? Number((c / total).toFixed(4)) : 0,
    ])
  );

  return {
    samplesCount: samples.length,
    labels,
    accuracy: Number((correct / samples.length).toFixed(4)),
    confusionMatrix: confusion,
    perLabelAccuracy,
  };
};

module.exports = { evaluateLocalMlModel };

