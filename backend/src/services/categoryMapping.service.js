const CATEGORY_KEYWORDS = {
  Humains: [
    'person', 'man', 'woman', 'child', 'face', 'people', 'human', 'boy', 'girl',
    'adult', 'baby', 'crowd',
  ],
  'Personnages fictifs': [
    'cartoon', 'anime', 'fictional', 'character', 'superhero', 'comic',
    'illustration', 'drawing', 'animated', 'mascot', 'toy',
  ],
  Plantes: [
    'plant', 'tree', 'flower', 'grass', 'vegetation', 'nature', 'leaf',
    'garden', 'forest', 'bush', 'herb', 'succulent',
  ],
  Vehicules: [
    'car', 'truck', 'vehicle', 'bus', 'motorcycle', 'bicycle', 'bike',
    'boat', 'ship', 'airplane', 'plane', 'train', 'scooter', 'van',
    'helicopter', 'taxi',
  ],
  Animaux: [
    'animal', 'dog', 'puppy', 'cat', 'kitten', 'bird', 'wildlife', 'pet',
    'horse', 'fish', 'lion', 'tiger', 'bear', 'rabbit', 'snake', 'insect',
    'elephant',
  ],
};

/**
 * Calcule un score agrégé par catégorie à partir des tags bruts.
 * @param {Array<{name: string, confidence: number}>} tags
 * @returns {Record<string, number>}
 */
const scoreCategories = (tags) => {
  const scores = {
    Humains: 0,
    'Personnages fictifs': 0,
    Plantes: 0,
    Vehicules: 0,
    Animaux: 0,
  };

  if (!Array.isArray(tags)) {
    return scores;
  }

  // On ignore les tags très faibles pour limiter le bruit
  const MIN_TAG_CONFIDENCE = 0.15;

  tags.forEach(({ name, confidence }) => {
    if (!name || typeof confidence !== 'number') return;
    if (confidence < MIN_TAG_CONFIDENCE) return;

    const lower = name.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        scores[category] += confidence;
      }
    }
  });

  return scores;
};

/**
 * Mappe les tags vers les catégories du TP avec un score global de confiance.
 * @param {Array<{name: string, confidence: number}>} tags
 * @returns {{ detectedTypes: string[], confidence: number }}
 */
const mapTagsToCategories = (tags) => {
  const scores = scoreCategories(tags);

  const entries = Object.entries(scores);
  const maxScore = Math.max(...entries.map(([, score]) => score), 0);

  // Seuil minimum pour considérer qu'une catégorie est réellement présente
  const MIN_CATEGORY_SCORE = 0.3;

  const detectedTypes = entries
    .filter(([, score]) => score >= MIN_CATEGORY_SCORE)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  if (detectedTypes.length === 0 || maxScore === 0) {
    return {
      detectedTypes: ['Non identifie'],
      confidence: 0,
    };
  }

  // Confiance globale = meilleur score, bornée à [0,1]
  const confidence = Math.min(maxScore, 1);

  return {
    detectedTypes,
    confidence,
  };
};

module.exports = {
  mapTagsToCategories,
  scoreCategories,
};
