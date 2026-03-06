/**
 * Backfill / audit des embeddings pour les exemples du modèle local.
 *
 * IMPORTANT: Les anciens LocalSample (créés avant l'ajout des embeddings) ne
 * contiennent pas l'image source, donc on ne peut pas recalculer un embedding
 * fiable après coup. Ce script sert à:
 * - auditer combien d'exemples ont/ n'ont pas d'embedding
 * - optionnellement supprimer ceux qui n'en ont pas (--prune)
 *
 * Usage:
 *   node scripts/localSamplesEmbeddingsBackfill.js
 *   node scripts/localSamplesEmbeddingsBackfill.js --prune
 */
require('dotenv').config();
const mongoose = require('mongoose');
const LocalSample = require('../src/models/LocalSample.model');

const main = async () => {
  const prune = process.argv.includes('--prune');

  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('MONGO_URI manquant (variables env)');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const total = await LocalSample.countDocuments({});
  const withEmbedding = await LocalSample.countDocuments({ embedding: { $ne: null } });
  const withoutEmbedding = await LocalSample.countDocuments({
    $or: [{ embedding: null }, { embedding: { $exists: false } }],
  });

  // eslint-disable-next-line no-console
  console.log('[BackfillEmbeddings] total=', total);
  // eslint-disable-next-line no-console
  console.log('[BackfillEmbeddings] withEmbedding=', withEmbedding);
  // eslint-disable-next-line no-console
  console.log('[BackfillEmbeddings] withoutEmbedding=', withoutEmbedding);

  if (withoutEmbedding > 0) {
    // eslint-disable-next-line no-console
    console.log(
      '[BackfillEmbeddings] NOTE: impossibe de recalculer des embeddings sans images sources. Ajoute de nouveaux exemples ou prune les anciens.'
    );
  }

  if (prune && withoutEmbedding > 0) {
    const res = await LocalSample.deleteMany({
      $or: [{ embedding: null }, { embedding: { $exists: false } }],
    });
    // eslint-disable-next-line no-console
    console.log('[BackfillEmbeddings] supprimés=', res.deletedCount);
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[BackfillEmbeddings] erreur:', err);
  process.exit(1);
});

