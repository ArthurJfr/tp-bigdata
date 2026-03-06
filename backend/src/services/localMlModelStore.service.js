const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs-node');

const DEFAULT_DIR = path.join(__dirname, '..', '..', '.ml', 'local-classifier');
const MODEL_URL = (dir) => `file://${path.join(dir, 'model.json')}`;
const META_PATH = (dir) => path.join(dir, 'metadata.json');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const saveMetadata = (dir, metadata) => {
  ensureDir(dir);
  fs.writeFileSync(META_PATH(dir), JSON.stringify(metadata, null, 2), 'utf-8');
};

const loadMetadata = (dir) => {
  const p = META_PATH(dir);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
};

const saveModel = async (model, metadata, dir = DEFAULT_DIR) => {
  ensureDir(dir);
  await model.save(`file://${dir}`);
  saveMetadata(dir, metadata);
};

const loadModel = async (dir = DEFAULT_DIR) => {
  const url = MODEL_URL(dir);
  const modelJson = path.join(dir, 'model.json');
  if (!fs.existsSync(modelJson)) {
    return { model: null, metadata: null };
  }
  const model = await tf.loadLayersModel(url);
  const metadata = loadMetadata(dir);
  return { model, metadata };
};

module.exports = {
  DEFAULT_DIR,
  saveModel,
  loadModel,
  loadMetadata,
  saveMetadata,
};

