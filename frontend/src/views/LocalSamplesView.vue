<template>
  <div class="samples-wrapper">
    <section class="card">
      <h2 class="section-title">
        <i class="fa-solid fa-database title-icon"></i>
        <span>Exemples LocalSample</span>
      </h2>

      <p class="helper-text">
        Visualise les données d'entraînement du modèle local : label, source, tags et statut d'embedding.
      </p>

      <div class="filters-bar">
        <label class="field-label">
          <span>Catégorie</span>
          <select v-model="labelFilter" class="field-select" @change="onFiltersChange">
            <option value="">Toutes</option>
            <option value="Humains">Humains</option>
            <option value="Personnages fictifs">Personnages fictifs</option>
            <option value="Plantes">Plantes</option>
            <option value="Vehicules">Véhicules</option>
            <option value="Animaux">Animaux</option>
          </select>
        </label>

        <label class="field-label">
          <span>Source</span>
          <select v-model="sourceFilter" class="field-select" @change="onFiltersChange">
            <option value="">Toutes</option>
            <option value="manual">Manuel</option>
            <option value="unsplash">Unsplash</option>
            <option value="feedback">Feedback</option>
            <option value="unknown">Inconnue</option>
          </select>
        </label>

        <label class="field-label checkbox-label">
          <input
            type="checkbox"
            v-model="hasEmbeddingOnly"
            @change="onFiltersChange"
          />
          <span>Uniquement avec embedding</span>
        </label>

        <button
          class="btn-secondary"
          type="button"
          :disabled="isLoading"
          @click="loadSamples"
        >
          <i class="fa-solid fa-rotate btn-icon" :class="{ spinning: isLoading }"></i>
          <span>Rafraîchir</span>
        </button>
      </div>

      <p v-if="errorMessage" class="message is-error">
        {{ errorMessage }}
      </p>

      <div v-if="isLoading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Chargement des exemples…</span>
      </div>

      <div v-else-if="samples.length === 0" class="empty-state">
        <i class="fa-solid fa-inbox empty-icon"></i>
        <p>Aucun LocalSample trouvé pour ces filtres.</p>
      </div>

      <div v-else class="samples-list">
        <div
          v-for="sample in samples"
          :key="sample._id"
          class="sample-card"
        >
          <div class="sample-header">
            <span class="sample-date">{{ formatDateTime(sample.createdAt) }}</span>
            <span
              class="label-badge"
              :class="'label-' + labelClass(sample.label)"
            >
              {{ sample.label }}
            </span>
          </div>
          <div class="sample-meta">
            <span class="meta-item">
              <i class="fa-solid fa-tag"></i>
              {{ sourceLabel(sample.source) }}
            </span>
            <span class="meta-item" v-if="sample.embeddingPresent">
              <i class="fa-solid fa-microchip"></i>
              Embedding présent
              <template v-if="sample.embeddingDim">
                (dim {{ sample.embeddingDim }}{{ sample.embeddingModel ? ', ' + sample.embeddingModel : '' }})
              </template>
            </span>
            <span class="meta-item meta-warn" v-else>
              <i class="fa-solid fa-circle-minus"></i>
              Pas d'embedding
            </span>
          </div>
          <div class="sample-tags" v-if="sample.tags && sample.tags.length">
            <span
              v-for="(tag, idx) in displayedTags(sample.tags)"
              :key="idx"
              class="tag-pill"
            >
              {{ tag.name }} ({{ formatPercent(tag.confidence) }})
            </span>
            <span v-if="sample.tags.length > 5" class="tag-more">
              +{{ sample.tags.length - 5 }} autres
            </span>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="total > 0">
        <span class="pagination-info">
          Page {{ page }} / {{ totalPages }} ({{ total }} échantillon{{ total > 1 ? 's' : '' }})
        </span>
        <div class="pagination-controls">
          <button
            class="btn-secondary btn-pagination"
            :disabled="page <= 1 || isLoading"
            @click="goToPage(page - 1)"
          >
            <i class="fa-solid fa-chevron-left"></i>
            Précédent
          </button>
          <button
            class="btn-secondary btn-pagination"
            :disabled="page >= totalPages || isLoading"
            @click="goToPage(page + 1)"
          >
            Suivant
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        <label class="field-label limit-select">
          <span>Par page</span>
          <select v-model="limit" class="field-select" @change="onLimitChange">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api.js'

export default {
  name: 'LocalSamplesView',
  setup() {
    const samples = ref([])
    const page = ref(1)
    const limit = ref(50)
    const total = ref(0)
    const labelFilter = ref('')
    const sourceFilter = ref('')
    const hasEmbeddingOnly = ref(false)
    const isLoading = ref(false)
    const errorMessage = ref('')

    const totalPages = computed(() =>
      limit.value > 0 ? Math.ceil(total.value / limit.value) || 1 : 1
    )

    const loadSamples = async () => {
      isLoading.value = true
      errorMessage.value = ''
      try {
        const params = {
          page: page.value,
          limit: limit.value,
        }
        if (labelFilter.value) params.label = labelFilter.value
        if (sourceFilter.value) params.source = sourceFilter.value
        if (hasEmbeddingOnly.value) params.hasEmbedding = 'true'

        const resp = await api.getLocalSamples(params)
        samples.value = resp.data.items || []
        total.value = resp.data.total ?? 0
        page.value = resp.data.page ?? 1
      } catch (err) {
        console.error('Erreur chargement LocalSamples:', err)
        errorMessage.value =
          err.response?.data?.error || 'Erreur lors du chargement des exemples.'
        samples.value = []
      } finally {
        isLoading.value = false
      }
    }

    const onFiltersChange = () => {
      page.value = 1
      loadSamples()
    }

    const onLimitChange = () => {
      page.value = 1
      loadSamples()
    }

    const goToPage = (p) => {
      if (p >= 1 && p <= totalPages.value) {
        page.value = p
        loadSamples()
      }
    }

    const formatDateTime = (iso) => {
      if (!iso) return '—'
      return new Date(iso).toLocaleString('fr-FR')
    }

    const formatPercent = (p) => {
      if (p == null || Number.isNaN(Number(p))) return '—'
      return `${(Number(p) * 100).toFixed(0)}%`
    }

    const displayedTags = (tags) => {
      if (!tags || !tags.length) return []
      return tags.slice(0, 5)
    }

    const LABEL_CLASSES = {
      Humains: 'humains',
      'Personnages fictifs': 'fictifs',
      Plantes: 'plantes',
      Vehicules: 'vehicules',
      Animaux: 'animaux',
    }
    const labelClass = (l) => LABEL_CLASSES[l] ?? 'other'

    const SOURCE_LABELS = {
      manual: 'Manuel',
      unsplash: 'Unsplash',
      feedback: 'Feedback',
      unknown: 'Inconnue',
    }
    const sourceLabel = (s) => SOURCE_LABELS[s] ?? s ?? 'Inconnue'

    onMounted(() => {
      loadSamples()
    })

    return {
      samples,
      page,
      limit,
      total,
      totalPages,
      labelFilter,
      sourceFilter,
      hasEmbeddingOnly,
      isLoading,
      errorMessage,
      loadSamples,
      onFiltersChange,
      onLimitChange,
      goToPage,
      formatDateTime,
      formatPercent,
      displayedTags,
      labelClass,
      sourceLabel,
    }
  },
}
</script>

<style scoped>
.samples-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  background: var(--bg-card);
  border-radius: 24px;
  border: 1px solid var(--border-color);
  padding: 1.75rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.title-icon {
  color: var(--text-secondary);
}

.helper-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.field-select {
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 0.4rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
}

.checkbox-label {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label input[type='checkbox'] {
  accent-color: var(--accent);
}

.btn-secondary {
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-secondary:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.03);
}

.btn-icon {
  font-size: 0.9rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spinning {
  animation: spin 0.7s linear infinite;
}

.message.is-error {
  color: #f97373;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.samples-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 520px;
  overflow-y: auto;
}

.sample-card {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
}

.sample-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.sample-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.label-badge {
  padding: 0.08rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}
.label-humains {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}
.label-fictifs {
  background: rgba(168, 85, 247, 0.15);
  color: #d8b4fe;
}
.label-plantes {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
}
.label-vehicules {
  background: rgba(234, 179, 8, 0.15);
  color: #fde68a;
}
.label-animaux {
  background: rgba(251, 146, 60, 0.15);
  color: #fdba74;
}
.label-other {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.sample-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-warn {
  color: #fdba74;
}

.sample-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.78rem;
}

.tag-pill {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.tag-more {
  color: var(--text-muted);
  font-style: italic;
}

.pagination {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.pagination-info {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  gap: 0.5rem;
}

.btn-pagination {
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
}

.limit-select {
  margin-left: auto;
}

.limit-select .field-select {
  min-width: 70px;
}

@media (max-width: 1024px) {
  .samples-wrapper {
    padding: 1.5rem 1rem;
  }
}
</style>
