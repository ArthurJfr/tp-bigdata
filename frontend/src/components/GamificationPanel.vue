<template>
  <div class="gamification-panel" v-if="stats">
    <div class="stats-row">
      <!-- Images analysées -->
      <div class="stat">
        <i class="fa-solid fa-camera stat-icon"></i>
        <div class="stat-text">
          <span class="stat-label">Analysées</span>
          <span class="stat-value">{{ stats.totalImages }}</span>
        </div>
      </div>

      <!-- Précision moyenne -->
      <div class="stat" :class="confidenceClass">
        <i class="fa-solid fa-bullseye stat-icon"></i>
        <div class="stat-text">
          <span class="stat-label">Précision moy.</span>
          <span class="stat-value">
            {{ stats.averageConfidence ? (stats.averageConfidence * 100).toFixed(0) : 0 }}%
          </span>
        </div>
      </div>

      <!-- Top catégorie -->
      <div class="stat stat-highlight" v-if="stats.topCategory">
        <i :class="['stat-icon', categoryIcon(stats.topCategory)]"></i>
        <div class="stat-text">
          <span class="stat-label">Top catégorie</span>
          <span class="stat-value stat-value-sm">{{ stats.topCategory }}</span>
        </div>
      </div>

      <!-- Meilleure série -->
      <div class="stat" v-if="stats.bestStreak > 0">
        <i class="fa-solid fa-fire stat-icon stat-icon-streak"></i>
        <div class="stat-text">
          <span class="stat-label">Best streak</span>
          <span class="stat-value">{{ stats.bestStreak }}</span>
        </div>
      </div>

      <!-- Non identifiés -->
      <div class="stat stat-warn" v-if="stats.totalImages > 0">
        <i class="fa-solid fa-circle-question stat-icon"></i>
        <div class="stat-text">
          <span class="stat-label">Non identifiés</span>
          <span class="stat-value">{{ stats.nonIdentified ?? 0 }}</span>
        </div>
      </div>
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
  name: 'GamificationPanel',
  props: {
    stats: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const confidenceClass = computed(() => {
      const v = props.stats?.averageConfidence ?? 0
      if (v >= 0.8) return 'stat-good'
      if (v >= 0.5) return 'stat-ok'
      return 'stat-low'
    })

    const categoryIcon = (cat) => CATEGORY_ICONS[cat] ?? 'fa-solid fa-tag'

    return { confidenceClass, categoryIcon }
  },
}
</script>

<style scoped>
.gamification-panel {
  margin-top: 0.5rem;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: var(--bg-elevated-soft, #111318);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: border-color 0.2s;
}

.stat-highlight {
  border-color: rgba(34, 197, 94, 0.25);
  background: rgba(34, 197, 94, 0.06);
}

.stat-good { border-color: rgba(34, 197, 94, 0.2); }
.stat-ok  { border-color: rgba(234, 179, 8, 0.2); }
.stat-low { border-color: rgba(239, 68, 68, 0.2); }
.stat-warn { border-color: rgba(251, 146, 60, 0.18); }

.stat-icon {
  color: var(--accent, #22c55e);
  font-size: 0.9rem;
  min-width: 14px;
  text-align: center;
}

.stat-icon-streak {
  color: #f97316;
}

.stat-warn .stat-icon {
  color: #fb923c;
}

.stat-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.1;
  color: var(--text-primary);
}

.stat-value-sm {
  font-size: 0.85rem;
  font-weight: 500;
}

.stat-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .gamification-panel {
    margin-top: 1rem;
  }
  .stats-row {
    justify-content: flex-start;
  }
  /* masquer les stats secondaires sur mobile */
  .stat-highlight,
  .stat-warn {
    display: none;
  }
}
</style>
