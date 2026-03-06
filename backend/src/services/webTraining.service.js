const axios = require('axios');
const LocalSample = require('../models/LocalSample.model');
const { addTrainingExample } = require('./localModel.service');
const unsplashLog = require('./unsplashLog.service');

const LABEL_QUERIES = {
  Humains: [
    'portrait person',
    'man portrait',
    'woman portrait',
    'group of people',
    'people in city',
    'people indoor',
  ],
  'Personnages fictifs': [
    'cartoon character',
    'anime character',
    'comic book character',
    '3d character',
    'superhero illustration',
  ],
  Plantes: [
    'tree forest',
    'garden plants',
    'flower macro',
    'leaf closeup',
    'indoor plant',
    'nature vegetation',
  ],
  Vehicules: [
    'car closeup',
    'car front view',
    'car interior',
    'sports car',
    'truck closeup',
    'motorcycle rider',
    'bicycle on street',
  ],
  Animaux: [
    'dog portrait',
    'cat indoor',
    'wild animal',
    'bird flying',
    'zoo animal',
    'horse running',
  ],
};

const fetchImageBuffersForLabel = async (label, limitPerLabel = 10) => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error(
      'UNSPLASH_ACCESS_KEY manquant dans les variables denvironnement'
    );
  }

  const queries = LABEL_QUERIES[label] || [];
  const buffers = [];

  console.log(
    `[WebTraining] Recherche d'images Unsplash pour "${label}" avec requêtes: ${queries.join(
      ', '
    )}`
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const query of queries) {
    if (buffers.length >= limitPerLabel) break;

    const page = Math.floor(Math.random() * 3) + 1; // pages 1 à 3
    const orderBy = Math.random() > 0.5 ? 'relevant' : 'latest';

    const searchResp = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query,
        per_page: Math.min(limitPerLabel, 10),
        page,
        order_by: orderBy,
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    const results = searchResp.data?.results || [];
    console.log(
      `[WebTraining] Requête "${query}" -> ${results.length} résultats`
    );
    unsplashLog.addEntry({
      label,
      query,
      page,
      orderBy,
      results: results.length,
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const photo of results) {
      if (buffers.length >= limitPerLabel) break;
      const url = photo.urls?.small || photo.urls?.regular;
      if (!url) continue;

      const imgResp = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      buffers.push(Buffer.from(imgResp.data));
    }
  }

  console.log(
    `[WebTraining] Téléchargé ${buffers.length} images pour le label "${label}"`
  );

  return buffers;
};

const bootstrapLocalTrainingFromWeb = async (totalPerLabel = 10) => {
  const labels = Object.keys(LABEL_QUERIES);
  const summary = [];

  console.log(
    `[WebTraining] Démarrage du bootstrap automatique (≈${totalPerLabel} images par label)`
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const label of labels) {
    const buffers = await fetchImageBuffersForLabel(label, totalPerLabel);
    let count = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const buffer of buffers) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await addTrainingExample(buffer, label);
        count += 1;
      } catch (err) {
        console.error(
          `[WebTraining] Erreur lors de l'ajout d'un exemple pour "${label}":`,
          err.message
        );
      }
    }

    console.log(
      `[WebTraining] Label "${label}" -> ${count} exemples ajoutés au modèle local`
    );

    summary.push({ label, added: count });
  }

  console.log('[WebTraining] Bootstrap automatique terminé:', summary);

  return summary;
};

/**
 * Lance un entraînement automatique périodique depuis le web.
 * L'objectif est de compléter progressivement le modèle local
 * sans dépasser un nombre d'exemples raisonnable par catégorie.
 */
const startAutoWebTraining = (options = {}) => {
  const {
    // Environ 1 tick par minute pour rester proche de la limite gratuite Unsplash
    intervalMs = 60 * 1000,
    maxSamplesPerLabel = 50, // plafond par label
    // On limite à 1 image par tick pour limiter la pression sur l'API
    batchPerTickPerLabel = 1,
  } = options;

  console.log(
    `[WebTraining] Auto-bootstrap activé (interval=${intervalMs}ms, maxSamplesPerLabel=${maxSamplesPerLabel})`
  );

  const tick = async () => {
    try {
      console.log('[WebTraining] Tick auto-bootstrap');

      const labels = Object.keys(LABEL_QUERIES);
      const label = labels[Math.floor(Math.random() * labels.length)];

      const currentCount = await LocalSample.countDocuments({ label });

      if (currentCount >= maxSamplesPerLabel) {
        console.log(
          `[WebTraining] Label "${label}" déjà à ${currentCount} exemples (>= ${maxSamplesPerLabel}), on saute ce tick`
        );
        return;
      }

      const remaining = maxSamplesPerLabel - currentCount;
      const toAdd = Math.min(batchPerTickPerLabel, remaining);

      console.log(
        `[WebTraining] Label "${label}" : ${currentCount} exemples, on tente d'en ajouter ${toAdd}`
      );

      const buffers = await fetchImageBuffersForLabel(label, toAdd);

      let added = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const buffer of buffers) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await addTrainingExample(buffer, label);
          added += 1;
        } catch (err) {
          console.error(
            `[WebTraining] Erreur lors de l'ajout auto pour "${label}":`,
            err.message
          );
        }
      }

      console.log(
        `[WebTraining] Label "${label}" -> ${added} exemples auto ajoutés lors de ce tick`
      );
    } catch (error) {
      console.error(
        '[WebTraining] Erreur pendant le tick auto-bootstrap:',
        error.message
      );
    }
  };

  // Premier tick différé pour laisser le temps à la connexion DB
  setTimeout(tick, 10 * 1000);
  setInterval(tick, intervalMs);
};

module.exports = {
  bootstrapLocalTrainingFromWeb,
  startAutoWebTraining,
};

