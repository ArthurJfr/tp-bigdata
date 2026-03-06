const { getAzureClient } = require('../config/azure');
const { mapTagsToCategories } = require('./categoryMapping.service');

/**
 * Analyse un buffer d'image via Azure Computer Vision.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{confidence: number, detectedTypes: string[], rawTags: Array}>}
 */
const analyzeImageBuffer = async (imageBuffer) => {
  const client = getAzureClient();

  const result = await client.analyzeImageInStream(
    () => imageBuffer,
    { visualFeatures: ['Tags', 'Categories', 'Objects'] }
  );

  const rawTags = (result.tags || []).map((tag) => ({
    name: tag.name,
    confidence: parseFloat(tag.confidence.toFixed(4)),
  }));

  const detectedTypes = mapTagsToCategories(rawTags);

  // La confiance principale est celle du tag avec le score le plus eleve
  const confidence = rawTags.length > 0 ? rawTags[0].confidence : 0;

  return { confidence, detectedTypes, rawTags };
};

module.exports = { analyzeImageBuffer };
