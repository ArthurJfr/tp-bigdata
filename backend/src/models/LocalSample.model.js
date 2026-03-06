const mongoose = require('mongoose');

const rawTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false }
);

const localSampleSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  label: {
    type: String,
    required: true,
    enum: ['Humains', 'Personnages fictifs', 'Plantes', 'Vehicules', 'Animaux'],
  },
  // Embedding MobileNet normalisé (vecteur float)
  embedding: { type: [Number], default: null },
  embeddingDim: { type: Number, default: null },
  embeddingModel: { type: String, default: null },
  // Origine de l'exemple (UI, bootstrap web, feedback après analyse, etc.)
  source: {
    type: String,
    enum: ['manual', 'unsplash', 'feedback', 'unknown'],
    default: 'unknown',
  },
  tags: { type: [rawTagSchema], default: [] },
});

localSampleSchema.index({ label: 1, createdAt: -1 });
localSampleSchema.index({ embeddingModel: 1 });

module.exports = mongoose.model('LocalSample', localSampleSchema);

