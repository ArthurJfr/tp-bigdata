<template>
  <div class="history-wrapper">
    <section class="card history-card">
      <HistoryList
        :images="images"
        @delete-image="onDeleteImage"
        @refresh="loadImages"
        @select-image="onSelectImage"
      />
    </section>

    <div v-if="selectedAnalysis" class="modal-backdrop" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <AnalysisResult :analysis="selectedAnalysis" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, inject } from 'vue'
import HistoryList from '../components/HistoryList.vue'
import AnalysisResult from '../components/AnalysisResult.vue'
import api from '../services/api.js'

export default {
  name: 'HistoryView',
  components: {
    HistoryList,
    AnalysisResult,
  },
  setup() {
    const images = ref([])
    const selectedAnalysis = ref(null)
    const refreshGlobalStats = inject('refreshGlobalStats', null)

    const loadImages = async () => {
      try {
        const response = await api.getImages({ sort: 'desc' })
        images.value = response.data.images
      } catch (error) {
        console.error('Erreur chargement images:', error)
      }
    }

    const onDeleteImage = async (id) => {
      try {
        await api.deleteImage(id)
        loadImages()
        if (typeof refreshGlobalStats === 'function') {
          refreshGlobalStats()
        }
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }

    const onSelectImage = (image) => {
      selectedAnalysis.value = image
    }

    const closeModal = () => {
      selectedAnalysis.value = null
    }

    onMounted(() => {
      loadImages()
    })

    return {
      images,
      loadImages,
      onDeleteImage,
      selectedAnalysis,
      onSelectImage,
      closeModal,
    }
  },
}
</script>

<style scoped>
.history-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 1.5rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  border-color: rgba(34, 197, 94, 0.25);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.1);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  padding: 1.75rem;
  background: #0b0b0b;
  border-radius: 24px;
  border: 1px solid var(--border-color);
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

@media (max-width: 1024px) {
  .history-wrapper {
    padding: 1.5rem 1rem;
  }

  .history-grid {
    grid-template-columns: 1fr;
  }
}
</style>

