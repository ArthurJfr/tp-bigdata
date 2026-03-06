<template>
  <div class="analyze-wrapper">
    <div class="analyze-grid">
      <section class="card">
        <ImageUpload @image-analyzed="onImageAnalyzed" />
      </section>

      <section class="card" v-if="currentAnalysis">
        <AnalysisResult :analysis="currentAnalysis" />
        <AnalysisGamification
          :analysis="currentAnalysis"
          :stats="stats"
        />
      </section>
      <section class="card empty-card" v-else>
        <div class="empty-content">
          <div class="empty-icon-wrapper">
            <i class="fa-regular fa-image fa-3x"></i>
          </div>
          <p class="empty-text">
            Uploade une image pour commencer l'analyse
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, inject } from 'vue'
import ImageUpload from '../components/ImageUpload.vue'
import AnalysisResult from '../components/AnalysisResult.vue'
import AnalysisGamification from '../components/AnalysisGamification.vue'

export default {
  name: 'AnalyzeView',
  components: {
    ImageUpload,
    AnalysisResult,
    AnalysisGamification,
  },
  setup() {
    const currentAnalysis = ref(null)
    const refreshGlobalStats = inject('refreshGlobalStats', null)
    const stats = inject('stats', ref(null))

    const onImageAnalyzed = (analysis) => {
      currentAnalysis.value = analysis
      if (typeof refreshGlobalStats === 'function') {
        refreshGlobalStats()
      }
    }

    return {
      currentAnalysis,
      stats,
      onImageAnalyzed,
    }
  },
}
</script>

<style scoped>
.analyze-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.analyze-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1.5rem;
}

.card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(34, 197, 94, 0.25);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.1);
  transform: translateY(-2px);
}

.empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  opacity: 0.7;
}

.empty-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  max-width: 220px;
}

@media (max-width: 1024px) {
  .analyze-wrapper {
    padding: 1.5rem 1rem;
  }

  .analyze-grid {
    grid-template-columns: 1fr;
  }
}
</style>

