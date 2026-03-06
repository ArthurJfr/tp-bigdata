const mongoose = require('mongoose');

const rawTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  { id: Number, label: String, detail: String },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    confidence: { type: Number, required: true },
    detectedTypes: { type: [String], default: [] },
    rawTags: { type: [rawTagSchema], default: [] },
    engine: { type: String },
    steps: { type: [stepSchema], default: [] },
    technical: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  imageName: { type: String, required: true },
  imageSize: { type: Number, required: true },
  analysis: { type: analysisSchema, required: true },
});

module.exports = mongoose.model('Image', imageSchema);
