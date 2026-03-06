<template>
  <div class="upload-container">
    <h2 class="section-title">
      <i class="fa-solid fa-upload title-icon"></i>
      <span>Uploader une image</span>
    </h2>

    <div class="model-selector">
      <label class="model-label">
        <span>Moteur d'analyse</span>
        <select v-model="selectedModel" class="model-select">
          <option value="tensorflow">TensorFlow.js (MobileNet)</option>
          <option value="local-ml">Modèle ML local (à entraîner)</option>
        </select>
      </label>
    </div>

    <div
      class="drop-zone"
      :class="{
        'is-dragging': isDragging,
        'has-file': previewUrl,
        'is-analyzing': isAnalyzing
      }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*,.heic,.heif"
        @change="onFileSelect"
        hidden
      />

      <!-- Empty State -->
      <div v-if="!previewUrl && !isAnalyzing" class="drop-content">
        <div class="upload-icon-wrapper">
          <i class="fa-solid fa-image upload-icon"></i>
        </div>
        <p class="drop-text">
          Glisse une image ici ou <span class="highlight">clique</span> pour choisir
        </p>
        <p class="drop-subtext">JPG, PNG, GIF, HEIC • Max 10MB</p>
      </div>

      <!-- Preview State -->
      <div v-else-if="previewUrl && !isAnalyzing" class="preview-container">
        <div class="image-preview-wrapper">
          <img
            v-if="!previewError"
            :src="previewUrl"
            alt="Preview"
            class="image-preview"
            @error="previewError = true"
          />
          <div v-else class="preview-placeholder">
            <i class="fa-solid fa-image"></i>
            <span>{{ isHeicFile ? 'HEIC (aperçu non disponible)' : 'Image' }}</span>
          </div>
          <button @click.stop="clearImage" class="btn-remove" title="Effacer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="file-info">
          <i class="fa-regular fa-file-lines file-icon"></i>
          <span class="file-name">{{ selectedFile?.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile?.size) }}</span>
        </div>
      </div>

      <!-- Analyzing Overlay -->
      <div v-else class="analyzing-overlay">
        <div class="analyzing-box">
          <i class="fa-solid fa-microchip analyzing-icon"></i>
          <div class="analyzing-text">
            <span class="label">Analyse en cours</span>
            <span class="sub">
              {{
                selectedModel === 'tensorflow'
                  ? 'TensorFlow.js / MobileNet'
                  : 'Modèle ML local'
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <button
      @click="analyzeImage"
      :disabled="!selectedFile || isAnalyzing"
      class="btn-analyze"
      :class="{ 'btn-disabled': !selectedFile || isAnalyzing }"
    >
      <i class="fa-solid fa-play btn-icon"></i>
      <span>{{ isAnalyzing ? 'Analyse en cours...' : 'Lancer l\'analyse' }}</span>
    </button>

    <div v-if="error" class="error-message">
      <i class="fa-solid fa-circle-exclamation error-icon"></i>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import api from '../services/api.js'

export default {
  name: 'ImageUpload',
  emits: ['image-analyzed'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const previewUrl = ref(null)
    const previewError = ref(false)
    const isDragging = ref(false)
    const isAnalyzing = ref(false)
    const error = ref(null)
    const selectedModel = ref('tensorflow')

    const isHeicFile = computed(() => /\.(heic|heif)$/i.test(selectedFile.value?.name || ''))

    const triggerFileInput = () => {
      if (!previewUrl.value) {
        fileInput.value?.click()
      }
    }

    const isAllowedImageType = (file) => {
      if (!file) return false
      if (file.type?.startsWith('image/')) return true
      if (file.type === 'application/octet-stream') {
        const name = (file.name || '').toLowerCase()
        return name.endsWith('.heic') || name.endsWith('.heif')
      }
      return false
    }

    const onFileSelect = (event) => {
      const file = event.target.files[0]
      if (!file) return
      if (!isAllowedImageType(file)) {
        error.value = 'Veuillez sélectionner un fichier image valide (JPG, PNG, GIF, HEIC)'
        return
      }
      handleFile(file)
    }

    const onDrop = (event) => {
      isDragging.value = false
      const file = event.dataTransfer.files[0]
      const isImage = file && (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name || ''))
      if (isImage) {
        handleFile(file)
      } else {
        error.value = 'Veuillez déposer un fichier image valide'
      }
    }

    const handleFile = (file) => {
      if (file.size > 10 * 1024 * 1024) {
        error.value = 'Fichier trop volumineux (max 10MB)'
        return
      }
      selectedFile.value = file
      previewUrl.value = URL.createObjectURL(file)
      previewError.value = false
      error.value = null
    }

    const clearImage = () => {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
      }
      selectedFile.value = null
      previewUrl.value = null
      previewError.value = false
      error.value = null
      if (fileInput.value) fileInput.value.value = ''
    }

    const formatFileSize = (bytes) => {
      if (!bytes) return ''
      if (bytes < 1024) return `${bytes} o`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
      return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
    }

    const analyzeImage = async () => {
      if (!selectedFile.value) return

      isAnalyzing.value = true
      error.value = null

      try {
        const response = await api.analyzeImage(selectedFile.value, selectedModel.value)
        emit('image-analyzed', response.data.image)
        clearImage()
      } catch (err) {
        const backendError = err.response?.data
        // Affiche le message backend si présent
        if (backendError?.error) {
          error.value = backendError.error
        } else {
          error.value = 'Erreur lors de l\'analyse'
        }

        // Log enrichi selon le modèle sélectionné
        console.error(
          `[ImageUpload] Erreur analyse (model=${selectedModel.value}):`,
          backendError || err
        )
      } finally {
        isAnalyzing.value = false
      }
    }

    return {
      fileInput,
      selectedFile,
      previewUrl,
      previewError,
      isHeicFile,
      isDragging,
      isAnalyzing,
      error,
      selectedModel,
      triggerFileInput,
      onFileSelect,
      onDrop,
      clearImage,
      formatFileSize,
      analyzeImage,
    }
  },
}
</script>

<style scoped>
.upload-container {
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

.model-selector {
  margin-bottom: 1rem;
}

.model-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.model-select {
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 0.35rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
}

/* Drop Zone */
.drop-zone {
  position: relative;
  border: 1px dashed var(--border-color);
  border-radius: 20px;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-elevated);
  overflow: hidden;
}

.drop-zone:hover,
.drop-zone.is-dragging {
  border-color: var(--text-secondary);
  background: var(--bg-elevated-2, #151515);
}

.drop-zone.is-analyzing {
  pointer-events: none;
}

/* Drop Content */
.drop-content {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
}

.upload-icon {
  color: var(--text-secondary);
  position: relative;
  z-index: 1;
}

.drop-text {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.highlight {
  color: var(--text-primary);
  font-weight: 500;
}

.drop-subtext {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Preview */
.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.image-preview-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.image-preview {
  max-width: 100%;
  max-height: 180px;
  display: block;
}

.preview-placeholder {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.preview-placeholder i {
  font-size: 2rem;
  opacity: 0.6;
}

.btn-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.6);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.file-icon {
  color: var(--text-muted);
}

.file-name {
  color: var(--text-primary);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Analyzing Overlay */
.analyzing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5, 5, 5, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.analyzing-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid var(--border-color);
}

.analyzing-icon {
  color: var(--text-secondary);
  font-size: 1.5rem;
}

.analyzing-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.analyzing-text .label {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 1px;
}

.analyzing-text .sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Analyze Button */
.btn-analyze {
  position: relative;
  width: 100%;
  margin-top: 1.25rem;
  padding: 1rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  font-family: var(--font-display);
  letter-spacing: 0.5px;
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  transition: all 0.3s ease;
  background: var(--accent-gradient);
  color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.25);
}

.btn-analyze:hover:not(.btn-disabled) {
  background: linear-gradient(135deg, #2dd96b 0%, #22c55e 50%, #16a34a 100%);
  border-color: rgba(34, 197, 94, 0.6);
  box-shadow: 0 6px 28px rgba(34, 197, 94, 0.35);
  transform: translateY(-2px);
}

.btn-analyze:active:not(.btn-disabled) {
  transform: translateY(0);
}

.btn-disabled {
  border-color: var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-muted);
  cursor: not-allowed;
}

.btn-icon {
  transition: transform 0.3s ease;
}

.btn-analyze:hover:not(.btn-disabled) .btn-icon {
  transform: rotate(15deg);
}

/* Error Message */
.error-message {
  margin-top: 1rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
}
</style>
