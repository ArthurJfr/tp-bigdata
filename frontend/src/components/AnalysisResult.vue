<template>
  <div class="result-container">
    <h2 class="section-title">
      <i class="fa-solid fa-brain title-icon"></i>
      <span>{{ sectionTitle }}</span>
    </h2>

    <div class="result-card">
      <!-- Moteur utilisé -->
      <div v-if="engineLabel" class="engine-badge">
        <i class="fa-solid fa-microchip engine-icon"></i>
        <span>{{ engineLabel }}</span>
      </div>

      <!-- Header with file info -->
      <div class="result-header">
        <div class="file-info">
          <i class="fa-regular fa-file-lines file-icon"></i>
          <div class="file-details">
            <h3 class="file-name">{{ analysis.imageName }}</h3>
            <span class="file-meta">
              {{ formatDate(analysis.date) }} • {{ formatSize(analysis.imageSize) }}
            </span>
          </div>
        </div>
        <div class="category-badge">
          <span class="badge-label">{{ mainCategory }}</span>
        </div>
      </div>

      <!-- Confidence + types -->
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">Confiance globale</span>
          <span class="summary-value">
            {{ (analysis.analysis.confidence * 100).toFixed(0) }} %
          </span>
        </div>
        <div class="summary-item" v-if="analysis.analysis.detectedTypes.length">
          <span class="summary-label">Types détectés</span>
          <span class="summary-tags">
            <span
              v-for="type in analysis.analysis.detectedTypes"
              :key="type"
              class="type-pill"
            >
              {{ type }}
            </span>
          </span>
        </div>
      </div>

      <!-- Étapes de l'analyse -->
      <div v-if="analysis.analysis.steps?.length" class="steps-section">
        <div class="section-label">
          <i class="fa-solid fa-list-ol"></i>
          <span>Étapes de l'analyse</span>
        </div>
        <div class="steps-list">
          <div
            v-for="step in analysis.analysis.steps"
            :key="step.id"
            class="step-item"
          >
            <span class="step-id">{{ step.id }}</span>
            <div class="step-content">
              <span class="step-label">{{ step.label }}</span>
              <span class="step-detail">{{ step.detail }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Détails techniques -->
      <div v-if="technicalEntries.length" class="technical-section">
        <div class="section-label">
          <i class="fa-solid fa-microchip"></i>
          <span>Détails techniques</span>
        </div>
        <div class="technical-grid">
          <div
            v-for="entry in technicalEntries"
            :key="entry.key"
            class="technical-item"
          >
            <span class="technical-key">{{ entry.label }}</span>
            <span class="technical-value">{{ entry.value }}</span>
          </div>
        </div>
      </div>

      <!-- Top-K (local-ml) -->
      <div v-if="topKList.length" class="topk-section">
        <div class="section-label">
          <i class="fa-solid fa-ranking-star"></i>
          <span>Top-3 des catégories (modèle local)</span>
        </div>
        <div class="topk-list">
          <div
            v-for="(item, idx) in topKList"
            :key="idx"
            class="topk-item"
          >
            <span class="topk-rank">{{ idx + 1 }}</span>
            <span class="topk-label">{{ item.label }}</span>
            <span class="topk-score">{{ (item.score * 100).toFixed(1) }} %</span>
          </div>
        </div>
      </div>

      <!-- Tags MobileNet -->
      <div class="predictions-section">
        <div class="section-label">
          <i class="fa-solid fa-layer-group"></i>
          <span>Tags bruts (MobileNet / ImageNet)</span>
        </div>

        <div class="predictions-list">
          <div
            v-for="(tag, index) in sortedTags"
            :key="tag.name"
            class="prediction-item"
          >
            <span class="prediction-rank">{{ index + 1 }}</span>
            <span class="prediction-name">{{ tag.name }}</span>
            <span class="prediction-score">
              {{ (tag.confidence * 100).toFixed(1) }} %
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AnalysisResult',
  props: {
    analysis: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const mainCategory = computed(() => {
      return props.analysis.analysis.detectedTypes[0] || 'Non identifie'
    })

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const formatSize = (bytes) => {
      if (bytes < 1024) return `${bytes} o`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
      return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
    }

    const sortedTags = computed(() => {
      const tags = props.analysis.analysis.rawTags || []
      return [...tags].sort((a, b) => b.confidence - a.confidence).slice(0, 5)
    })

    const engine = computed(() => props.analysis.analysis.engine || 'tensorflow')
    const sectionTitle = computed(() =>
      engine.value === 'local-ml' ? 'Analyse modèle ML local' : 'Analyse TensorFlow.js'
    )
    const engineLabel = computed(() =>
      engine.value === 'local-ml' ? 'Modèle ML local (Dense + Softmax)' : 'TensorFlow.js / MobileNet v2'
    )

    const technicalEntries = computed(() => {
      const t = props.analysis.analysis.technical
      if (!t || typeof t !== 'object') return []
      const labels = {
        model: 'Modèle',
        modelVersion: 'Version',
        alpha: 'Alpha',
        inputSize: 'Taille entrée',
        rawPredictionsCount: 'Nb prédictions brutes',
        categoryMapping: 'Mapping catégories',
        embeddingModel: 'Modèle d\'embedding',
        embeddingDim: 'Dimension embedding',
        numClasses: 'Nb classes',
        labels: 'Labels',
        trainedAt: 'Entraîné le',
        sampleCount: 'Nb exemples',
      }
      const skip = ['topK', 'labels']
      const formatVal = (k, v) => {
        if (k === 'trainedAt' && v) {
          try {
            return new Date(v).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          } catch {
            return String(v)
          }
        }
        if (Array.isArray(v)) return v.join(', ')
        return String(v)
      }
      return Object.entries(t)
        .filter(([k]) => !skip.includes(k) && t[k] != null)
        .map(([k, v]) => ({
          key: k,
          label: labels[k] || k,
          value: formatVal(k, v),
        }))
    })

    const topKList = computed(() => {
      const t = props.analysis.analysis.technical
      if (t?.topK && Array.isArray(t.topK)) return t.topK
      return props.analysis.analysis.topK || []
    })

    return {
      mainCategory,
      formatDate,
      formatSize,
      sortedTags,
      sectionTitle,
      engineLabel,
      technicalEntries,
      topKList,
    }
  },
}
</script>

<style scoped>
.result-container {
  width: 100%;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.title-icon {
  color: var(--text-secondary);
}

.result-card {
  background: var(--bg-elevated);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.engine-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 10px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.engine-icon {
  color: var(--text-muted);
}

/* Étapes */
.steps-section {
  margin: 1.25rem 0;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
}

.step-id {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.step-label {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.step-detail {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Détails techniques */
.technical-section {
  margin: 1.25rem 0;
}

.technical-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.technical-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
}

.technical-key {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.technical-value {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Top-K */
.topk-section {
  margin: 1.25rem 0;
}

.topk-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.topk-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
}

.topk-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
}

.topk-label {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.topk-score {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Header */
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-icon {
  color: var(--text-muted);
}

.file-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.category-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 20px;
  font-weight: 400;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.badge-label {
  white-space: nowrap;
}

.summary-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  margin: 1rem 0;
}

.summary-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.summary-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-value {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--text-primary);
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.type-pill {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Predictions Section */
.predictions-section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.75rem;
}

.section-label i {
  font-size: 0.75rem;
}

.predictions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.prediction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.prediction-rank {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-display);
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.prediction-name {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: lowercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.prediction-score {
  position: relative;
  display: flex;
  align-items: center;
}

.score-value {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
