/**
 * Convertit un buffer HEIC/HEIF en JPEG pour l'analyse TensorFlow.js.
 * TensorFlow.js ne supporte pas nativement le format HEIC.
 */
const convert = require('heic-convert');

const HEIC_MIMETYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
const HEIC_EXTENSIONS = ['.heic', '.heif'];

const isHeicFile = (mimetype, originalname) => {
  if (mimetype && HEIC_MIMETYPES.includes(mimetype.toLowerCase())) return true;
  const ext = (originalname || '').toLowerCase();
  return HEIC_EXTENSIONS.some((e) => ext.endsWith(e));
};

/**
 * Convertit un buffer HEIC en JPEG si nécessaire.
 * @param {Buffer} buffer - Buffer du fichier image
 * @param {string} mimetype - MIME type du fichier
 * @param {string} originalname - Nom original du fichier
 * @returns {Promise<Buffer>} - Buffer JPEG (ou buffer original si pas HEIC)
 */
const ensureJpegBuffer = async (buffer, mimetype, originalname) => {
  if (!isHeicFile(mimetype, originalname)) {
    return buffer;
  }

  const outputBuffer = await convert({
    buffer,
    format: 'JPEG',
    quality: 0.9,
  });

  return Buffer.isBuffer(outputBuffer) ? outputBuffer : Buffer.from(outputBuffer);
};

module.exports = { isHeicFile, ensureJpegBuffer, ensureImageBuffer: ensureJpegBuffer };
