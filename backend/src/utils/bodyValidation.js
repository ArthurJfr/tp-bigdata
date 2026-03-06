/**
 * Utilitaires de validation des body pour éviter les injections (NoSQL, type confusion, etc.)
 * Tous les champs utilisés dans des requêtes MongoDB ou des opérations sensibles doivent passer ici.
 */

const ALLOWED_LABELS = [
  'Humains',
  'Personnages fictifs',
  'Plantes',
  'Vehicules',
  'Animaux',
];

const ALLOWED_MODELS = ['tensorflow', 'local-ml'];

/**
 * Vérifie qu'une valeur est une chaîne non vide (évite les objets NoSQL injection)
 */
const isSafeString = (v) => typeof v === 'string' && v.length > 0 && v.length < 500;

/**
 * Vérifie qu'une valeur est un nombre dans une plage donnée
 */
const safeNumber = (v, { min, max, default: def } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
};

/**
 * Valide et extrait un label pour clearLocalSamples / trainLocalModel
 * Retourne null si invalide (label optionnel pour clear = supprimer tout)
 */
const validateLabel = (label) => {
  if (label == null || label === '') return null;
  if (!isSafeString(label)) return null;
  return ALLOWED_LABELS.includes(label) ? label : null;
};

/**
 * Valide le label pour clearLocalSamples.
 * Si fourni, doit être dans ALLOWED_LABELS. Sinon on supprime tout.
 * Rejette les objets (NoSQL injection).
 */
const validateClearSamplesBody = (body) => {
  if (!body || typeof body !== 'object') return { label: null };
  const { label } = body;
  if (label == null || label === '') return { label: null };
  const validated = validateLabel(label);
  if (validated === null && label != null && label !== '') {
    return { error: 'Label invalide' };
  }
  return { label: validated };
};

/**
 * Valide le body pour trainLocalMl
 */
const validateTrainLocalMlBody = (body) => {
  if (!body || typeof body !== 'object') {
    return { epochs: 25, batchSize: 16, validationSplit: 0.2, minSamplesPerClass: 2 };
  }
  const epochs = safeNumber(body.epochs, { min: 1, max: 500, default: 25 });
  const batchSize = safeNumber(body.batchSize, { min: 1, max: 256, default: 16 });
  const validationSplit = safeNumber(body.validationSplit, { min: 0, max: 1, default: 0.2 });
  const minSamplesPerClass = safeNumber(body.minSamplesPerClass, { min: 1, max: 100, default: 2 });
  return { epochs, batchSize, validationSplit, minSamplesPerClass };
};

/**
 * Valide le body pour evaluateLocalMl
 */
const validateEvaluateLocalMlBody = (body) => {
  if (!body || typeof body !== 'object') return { limit: 1000 };
  const limit = safeNumber(body.limit, { min: 1, max: 5000, default: 1000 });
  return { limit };
};

/**
 * Valide le body pour bootstrap
 */
const validateBootstrapBody = (body) => {
  if (!body || typeof body !== 'object') return { perLabel: 5 };
  const perLabel = safeNumber(body.perLabel, { min: 1, max: 20, default: 5 });
  return { perLabel };
};

/**
 * Valide le paramètre model pour /analyze (form-data)
 * Doit être une chaîne 'tensorflow' ou 'local-ml'
 */
const validateAnalyzeModel = (model) => {
  if (model == null) return 'tensorflow';
  const s = typeof model === 'string' ? model.trim() : String(model);
  return ALLOWED_MODELS.includes(s) ? s : null;
};

/**
 * Sanitize un nombre : retourne une valeur sûre dans [min, max]
 * @param {*} value - Valeur brute
 * @param {number} defaultVal - Valeur par défaut si invalide
 * @param {number} min - Borne min
 * @param {number} max - Borne max
 */
const sanitizeNumber = (value, defaultVal, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return defaultVal;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
};

/**
 * Sanitize le body pour trainLocalMl. Retourne toujours des données valides (bornées).
 */
const sanitizeTrainLocalMlBody = (body) => {
  const data = validateTrainLocalMlBody(body);
  return { data };
};

module.exports = {
  ALLOWED_LABELS,
  ALLOWED_MODELS,
  isSafeString,
  safeNumber,
  sanitizeNumber,
  sanitizeTrainLocalMlBody,
  validateLabel,
  validateClearSamplesBody,
  validateTrainLocalMlBody,
  validateEvaluateLocalMlBody,
  validateBootstrapBody,
  validateAnalyzeModel,
};
