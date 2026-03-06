<template>
  <div class="gamification-section">
    <div class="section-header">
      <i class="fa-solid fa-trophy section-icon"></i>
      <span class="section-title">Ta performance</span>
    </div>

    <div class="gamification-content">
      <!-- Score visuel -->
      <div class="score-block">
        <div class="score-ring" :class="scoreClass">
          <span class="score-value">{{ scorePercent }}%</span>
        </div>
        <p class="score-label">{{ scoreMessage }}</p>
      </div>

      <!-- Barre de confiance -->
      <div class="confidence-bar-wrap">
        <div class="confidence-bar" :style="{ width: scorePercent + '%' }"></div>
      </div>

      <!-- Détails gamification -->
      <div class="gamification-details">
        <div class="detail-item" v-if="mainCategory">
          <i :class="['detail-icon', categoryIcon(mainCategory)]"></i>
          <span>Catégorie : <strong>{{ mainCategory }}</strong></span>
        </div>
        <div class="detail-item" v-if="stats">
          <i class="fa-solid fa-chart-line detail-icon"></i>
          <span>Précision globale : <strong>{{ globalPrecision }}%</strong></span>
        </div>
        <div class="detail-item" v-if="stats?.bestStreak > 0">
          <i class="fa-solid fa-fire detail-icon fire-icon"></i>
          <span>Meilleure série : <strong>{{ stats.bestStreak }}</strong> analyses à haute confiance</span>
        </div>
      </div>

      <!-- Message d'encouragement -->
      <p class="encouragement">{{ encouragementMessage }}</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

const CATEGORY_ICONS = {
  Humains: 'fa-solid fa-person',
  'Personnages fictifs': 'fa-solid fa-masks-theater',
  Plantes: 'fa-solid fa-seedling',
  Vehicules: 'fa-solid fa-car',
  Animaux: 'fa-solid fa-paw',
}

export default {
  name: 'AnalysisGamification',
  props: {
    analysis: {
      type: Object,
      required: true,
    },
    stats: {
      type: Object,
      default: null,
    },
  },
  setup(props) {

    const confidence = computed(() => props.analysis?.analysis?.confidence ?? 0)
    const scorePercent = computed(() => Math.round(confidence.value * 100))

    const mainCategory = computed(() => {
      const types = props.analysis?.analysis?.detectedTypes
      return types?.[0] || 'Non identifié'
    })

    const scoreClass = computed(() => {
      const v = confidence.value
      if (v >= 0.8) return 'score-excellent'
      if (v >= 0.6) return 'score-good'
      if (v >= 0.4) return 'score-ok'
      return 'score-low'
    })

    const scoreMessage = computed(() => {
      const v = confidence.value
      if (v >= 0.9) return 'Excellente détection !'
      if (v >= 0.8) return 'Très bonne analyse'
      if (v >= 0.6) return 'Bonne détection'
      if (v >= 0.4) return 'Détection correcte'
      return 'Continue à t\'entraîner'
    })

    const encouragementMessage = computed(() => {
      const v = confidence.value
      if (v >= 0.8) return 'Continue comme ça, tu maîtrises !'
      if (v >= 0.5) return 'Ajoute des exemples dans l\'entraînement pour améliorer la précision.'
      return 'Essaie des images plus nettes ou des catégories bien représentées.'
    })

    const globalPrecision = computed(() => {
      const v = props.stats?.averageConfidence
      return v != null ? Math.round(v * 100) : '—'
    })

    const categoryIcon = (cat) => CATEGORY_ICONS[cat] ?? 'fa-solid fa-tag'

    return {
      scorePercent,
      mainCategory,
      scoreClass,
      scoreMessage,
      encouragementMessage,
      globalPrecision,
      categoryIcon,
    }
  },
}
</script>

<style scoped>
.gamification-section {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-icon {
  color: var(--accent);
  font-size: 0.9rem;
}

.gamification-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.score-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid;
  background: rgba(0, 0, 0, 0.2);
}

.score-excellent {
  border-color: #22c55e;
  color: #86efac;
}

.score-good {
  border-color: #4ade80;
  color: #bbf7d0;
}

.score-ok {
  border-color: #facc15;
  color: #fde68a;
}

.score-low {
  border-color: #f97316;
  color: #fdba74;
}

.score-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.score-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.confidence-bar-wrap {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.confidence-bar {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.5s ease;
}

.gamification-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.detail-icon {
  color: var(--accent);
  font-size: 0.8rem;
  min-width: 16px;
  text-align: center;
}

.fire-icon {
  color: #f97316;
}

.encouragement {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
}
</style>
