<template>
  <div class="history-container">
    <div class="history-header">
      <h2 class="section-title">
        <i class="fa-solid fa-clock-rotate-left title-icon"></i>
        <span>Historique des analyses</span>
      </h2>
      <button @click="$emit('refresh')" class="btn-refresh" title="Rafraîchir">
        <i class="fa-solid fa-rotate-right"></i>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="images.length === 0" class="empty-state">
      <div class="empty-icon-wrapper">
        <i class="fa-regular fa-folder-open fa-3x"></i>
      </div>
      <p class="empty-text">Aucune analyse dans l'historique</p>
      <span class="empty-hint">Uploade une image pour commencer</span>
    </div>

    <!-- Table -->
    <div v-else class="table-wrapper">
      <div class="table-header">
        <div class="th th-date">Date</div>
        <div class="th th-file">Fichier</div>
        <div class="th th-size">Taille</div>
        <div class="th th-types">Types</div>
        <div class="th th-confidence">Confiance</div>
        <div class="th th-action"></div>
      </div>
      
      <div class="table-body">
        <div 
          v-for="(image, index) in images" 
          :key="image._id"
          class="table-row"
          :class="`row-${getTypeClass(image.analysis.detectedTypes[0])}`"
          @click="selectImage(image)"
        >
          <div class="td td-date">
            <span class="date-value">{{ formatDate(image.date) }}</span>
          </div>
          <div class="td td-file">
            <i class="fa-regular fa-file-lines file-icon"></i>
            <span class="file-name" :title="image.imageName">
              {{ truncateName(image.imageName) }}
            </span>
          </div>
          <div class="td td-size">{{ formatSize(image.imageSize) }}</div>
          <div class="td td-types">
            <div class="type-chips">
              <div 
                v-for="type in image.analysis.detectedTypes.slice(0, 2)" 
                :key="type"
                class="type-chip-mini"
                :class="`chip-${getTypeClass(type)}`"
              >
                <span>{{ type }}</span>
              </div>
              <div v-if="image.analysis.detectedTypes.length > 2" class="chip-more">
                +{{ image.analysis.detectedTypes.length - 2 }}
              </div>
            </div>
          </div>
          <div class="td td-confidence">
            <div class="confidence-mini">
              <div 
                class="mini-bar"
                :class="`bar-${getConfidenceClass(image.analysis.confidence)}`"
              >
                <div 
                  class="mini-fill"
                  :style="{ width: `${image.analysis.confidence * 100}%` }"
                ></div>
              </div>
              <span 
                class="mini-value"
                :class="`text-${getConfidenceClass(image.analysis.confidence)}`"
              >
                {{ (image.analysis.confidence * 100).toFixed(0) }}%
              </span>
            </div>
          </div>
          <div class="td td-action">
            <button 
              @click.stop="confirmDelete(image._id)" 
              class="btn-delete"
              title="Supprimer"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer stats -->
    <div v-if="images.length > 0" class="history-footer">
      <div class="footer-stat">
        <i class="fa-solid fa-chart-simple"></i>
        <span class="stat-number">{{ images.length }}</span>
        <span class="stat-label">analyse{{ images.length > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistoryList',
  props: {
    images: {
      type: Array,
      required: true,
    },
  },
  emits: ['delete-image', 'refresh', 'select-image'],
  setup(props, { emit }) {
    const TYPE_ICONS = {
      'Humains': 'human',
      'Personnages fictifs': 'character',
      'Plantes': 'plant',
      'Véhicules': 'vehicle',
      'Animaux': 'animal',
      'Non identifie': 'unknown',
    }

    const TYPE_COLORS = {
      'Humains': 'cyan',
      'Personnages fictifs': 'purple',
      'Plantes': 'green',
      'Véhicules': 'orange',
      'Animaux': 'pink',
      'Non identifie': 'muted',
    }

    const getCategoryIcon = (type) => TYPE_ICONS[type] || 'unknown'
    const getTypeClass = (type) => TYPE_COLORS[type] || 'muted'

    const getConfidenceClass = (confidence) => {
      if (confidence >= 0.8) return 'high'
      if (confidence >= 0.5) return 'medium'
      return 'low'
    }

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

    const truncateName = (name) => {
      if (name.length <= 20) return name
      return name.substring(0, 17) + '...'
    }

    const confirmDelete = (id) => {
      if (confirm('Supprimer cette analyse ?')) {
        emit('delete-image', id)
      }
    }

    const selectImage = (image) => {
      emit('select-image', image)
    }

    return {
      getCategoryIcon,
      getTypeClass,
      getConfidenceClass,
      formatDate,
      formatSize,
      truncateName,
      confirmDelete,
      selectImage,
    }
  },
}
</script>

<style scoped>
.history-container {
  width: 100%;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
}

.title-icon {
  color: var(--text-secondary);
}

.btn-refresh {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  border-color: rgba(34, 197, 94, 0.5);
  color: var(--accent);
  background: var(--accent-soft);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.empty-icon-wrapper {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Table */
.table-wrapper {
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 80px 140px 100px 50px;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid var(--border-color);
}

.th {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 80px 140px 100px 50px;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.td {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Cells */
.td-date .date-value {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.td-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.file-name {
  color: var(--text-primary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-size {
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Type Chips */
.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.type-chip-mini {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.chip-cyan,
.chip-purple,
.chip-green,
.chip-orange,
.chip-pink,
.chip-muted {
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.chip-more {
  padding: 0.25rem 0.5rem;
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Confidence */
.confidence-mini {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.mini-bar {
  width: 60px;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.bar-high .mini-fill,
.bar-medium .mini-fill,
.bar-low .mini-fill {
  background: var(--text-secondary);
}

.mini-value {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
}

.text-high,
.text-medium,
.text-low {
  color: var(--text-secondary);
}

/* Delete Button */
.td-action {
  display: flex;
  justify-content: center;
}

.btn-delete {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--border-color);
  color: var(--text-primary);
}

/* Footer */
.history-footer {
  margin-top: 1rem;
  padding: 0.875rem;
  display: flex;
  justify-content: center;
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.stat-number {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-weight: 600;
}

.stat-label {
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 900px) {
  .table-header,
  .table-row {
    grid-template-columns: 80px 1fr 70px 100px 80px 40px;
    gap: 0.5rem;
  }
  
  .td-file .file-name {
    max-width: 120px;
  }
}

@media (max-width: 700px) {
  .table-header,
  .table-row {
    grid-template-columns: 70px 1fr 60px 80px;
  }
  
  .th-types,
  .td-types,
  .th-confidence,
  .td-confidence {
    display: none;
  }
}
</style>
