/**
 * Smoke test du pipeline ML local (entraînement + évaluation) sans serveur HTTP.
 *
 * Prérequis:
 * - MONGO_URI défini
 * - des LocalSample avec embeddings en base (au moins 2 par classe)
 *
 * Usage:
 *   node scripts/smokeLocalMl.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { trainLocalMlModel } = require('../services/localMlTraining.service');
const { evaluateLocalMlModel } = require('../services/localMlEvaluate.service');
const LocalSample = require('../models/LocalSample.model');

const main = async () => {
  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('MONGO_URI manquant (variables env)');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const withEmb = await LocalSample.countDocuments({ embedding: { $ne: null } });
  // eslint-disable-next-line no-console
  console.log('[SmokeLocalMl] samples with embedding:', withEmb);

  const train = await trainLocalMlModel({
    epochs: 5,
    batchSize: 16,
    validationSplit: 0.2,
    minSamplesPerClass: 2,
  });

  if (!train.ok) {
    // eslint-disable-next-line no-console
    console.error('[SmokeLocalMl] train failed:', train.error);
    process.exitCode = 2;
  } else {
    // eslint-disable-next-line no-console
    console.log('[SmokeLocalMl] trained:', train.metadata.metrics);
  }

  const evalRes = await evaluateLocalMlModel({ limit: 1000 });
  // eslint-disable-next-line no-console
  console.log('[SmokeLocalMl] eval accuracy:', evalRes.accuracy);
  // eslint-disable-next-line no-console
  console.log('[SmokeLocalMl] perLabel:', evalRes.perLabelAccuracy);

  await mongoose.disconnect();
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[SmokeLocalMl] erreur:', err);
  process.exit(1);
});

