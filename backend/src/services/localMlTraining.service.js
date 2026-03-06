const tf = require('@tensorflow/tfjs-node');
const LocalSample = require('../models/LocalSample.model');
const { EMBEDDING_MODEL_ID } = require('./tensorflow.service');
const modelStore = require('./localMlModelStore.service');

const LABELS = [
  'Humains',
  'Personnages fictifs',
  'Plantes',
  'Vehicules',
  'Animaux',
];

const seededShuffle = (arr, seed = 1337) => {
  // Fisher–Yates avec PRNG déterministe
  let s = seed;
  const rand = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    // >>> 0 force uint32
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const toOneHot = (labelIdx, numClasses) => {
  const arr = new Array(numClasses).fill(0);
  arr[labelIdx] = 1;
  return arr;
};

const computeClassWeights = (yIdxs, numClasses) => {
  const counts = new Array(numClasses).fill(0);
  yIdxs.forEach((i) => {
    counts[i] += 1;
  });
  const total = yIdxs.length || 1;
  const weights = {};
  for (let i = 0; i < numClasses; i += 1) {
    // weight inversely proportional to frequency
    const c = counts[i] || 1;
    weights[i] = total / (numClasses * c);
  }
  return { weights, counts };
};

const buildClassifier = (embeddingDim, numClasses) => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [embeddingDim],
      units: 128,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
    })
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  model.compile({
    optimizer: tf.train.adam(1e-3),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
};

const getEmbeddingsDataset = async () => {
  const samples = await LocalSample.find(
    { embedding: { $ne: null } },
    { label: 1, embedding: 1, embeddingDim: 1, embeddingModel: 1 }
  );
  return samples;
};

const validateSamples = (samples) => {
  if (!samples || samples.length === 0) {
    return { ok: false, reason: 'Aucun exemple avec embedding en base' };
  }

  const dim = samples[0].embeddingDim || (samples[0].embedding || []).length;
  if (!dim) {
    return { ok: false, reason: 'Embedding dimension introuvable' };
  }

  for (const s of samples) {
    if (!Array.isArray(s.embedding) || s.embedding.length !== dim) {
      return { ok: false, reason: 'Dimensions embeddings incohérentes' };
    }
    if (!LABELS.includes(s.label)) {
      return { ok: false, reason: `Label invalide: ${s.label}` };
    }
  }

  const byLabel = samples.reduce((acc, s) => {
    acc[s.label] = (acc[s.label] || 0) + 1;
    return acc;
  }, {});

  return { ok: true, dim, byLabel };
};

const trainLocalMlModel = async (options = {}) => {
  const {
    epochs = 25,
    batchSize = 16,
    validationSplit = 0.2,
    seed = 1337,
    minSamplesPerClass = 2,
  } = options;

  const samples = await getEmbeddingsDataset();
  const validation = validateSamples(samples);
  if (!validation.ok) {
    return { ok: false, error: validation.reason };
  }

  const { dim, byLabel } = validation;
  const numClasses = LABELS.length;

  for (const lbl of LABELS) {
    const c = byLabel[lbl] || 0;
    if (c < minSamplesPerClass) {
      return {
        ok: false,
        error: `Pas assez d'exemples pour "${lbl}" (${c}/${minSamplesPerClass})`,
      };
    }
  }

  const shuffled = seededShuffle(samples, seed);
  const X = shuffled.map((s) => s.embedding);
  const yIdxs = shuffled.map((s) => LABELS.indexOf(s.label));
  const y = yIdxs.map((idx) => toOneHot(idx, numClasses));

  const xTensor = tf.tensor2d(X, [X.length, dim], 'float32');
  const yTensor = tf.tensor2d(y, [y.length, numClasses], 'float32');

  const { weights: classWeight, counts } = computeClassWeights(yIdxs, numClasses);

  const model = buildClassifier(dim, numClasses);
  const history = { loss: [], accuracy: [], val_loss: [], val_accuracy: [] };

  const h = await model.fit(xTensor, yTensor, {
    epochs,
    batchSize,
    validationSplit,
    shuffle: true,
    classWeight,
    callbacks: {
      onEpochEnd: async (_epoch, logs) => {
        history.loss.push(logs.loss);
        history.accuracy.push(logs.acc ?? logs.accuracy);
        history.val_loss.push(logs.val_loss);
        history.val_accuracy.push(logs.val_acc ?? logs.val_accuracy);
      },
    },
  });

  xTensor.dispose();
  yTensor.dispose();

  const last = (arr) => (Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null);
  const metadata = {
    trainedAt: new Date().toISOString(),
    labels: LABELS,
    embeddingDim: dim,
    embeddingModel: samples[0].embeddingModel || EMBEDDING_MODEL_ID,
    samplesCount: samples.length,
    perLabelCounts: byLabel,
    classCounts: counts,
    params: { epochs, batchSize, validationSplit, seed, minSamplesPerClass },
    metrics: {
      loss: last(history.loss),
      accuracy: last(history.accuracy),
      val_loss: last(history.val_loss),
      val_accuracy: last(history.val_accuracy),
    },
  };

  await modelStore.saveModel(model, metadata);
  model.dispose();

  return {
    ok: true,
    metadata,
    history,
    fit: {
      params: h.params,
      epoch: h.epoch,
    },
  };
};

module.exports = {
  LABELS,
  trainLocalMlModel,
};

