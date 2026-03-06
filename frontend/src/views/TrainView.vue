<template>
  <div class="train-wrapper">
    <section class="card">
      <h2 class="section-title">
        <i class="fa-solid fa-sliders-h title-icon"></i>
        <span>Entraîner le modèle local</span>
      </h2>

      <p class="helper-text">
        Deux possibilités :
        <br />
        • ajouter manuellement des exemples par catégorie,
        <br />
        • ou lancer un bootstrap automatique depuis des images web.
      </p>

      <form @submit.prevent="onTrain" class="train-form">
        <label class="field-label">
          <span>Catégorie</span>
          <select v-model="label" class="field-select">
            <option disabled value="">Choisir une catégorie…</option>
            <option value="Humains">Humains</option>
            <option value="Personnages fictifs">Personnages fictifs</option>
            <option value="Plantes">Plantes</option>
            <option value="Vehicules">Véhicules</option>
            <option value="Animaux">Animaux</option>
          </select>
        </label>

        <label class="field-label file-label">
          <span>Image d'entraînement</span>
          <input type="file" accept="image/*,.heic,.heif" @change="onFileSelect" />
        </label>

        <button
          type="submit"
          class="btn-train"
          :disabled="!label || !file || isSubmitting"
        >
          <i class="fa-solid fa-flask btn-icon"></i>
          <span>
            {{ isSubmitting ? 'Envoi en cours…' : 'Ajouter un exemple' }}
          </span>
        </button>
      </form>

      <div class="stats-section" v-if="localStats">
        <h3 class="auto-title">État du modèle local</h3>
        <p class="auto-text">
          Total d'exemples : <strong>{{ localStats.totalSamples }}</strong>
        </p>
        <div class="stats-grid">
          <div class="stat-item" v-for="labelKey in labelKeys" :key="labelKey">
            <span class="stat-label">{{ labelKey }}</span>
            <span class="stat-value">
              {{ localStats.byLabel[labelKey] || 0 }}
            </span>
          </div>
        </div>
        <div class="auto-actions">
          <button
            class="btn-secondary"
            type="button"
            :disabled="isLoadingStats"
            @click="loadLocalStats"
          >
            <i class="fa-solid fa-rotate btn-icon"></i>
            <span>Rafraîchir les stats</span>
          </button>
          <button
            class="btn-secondary"
            type="button"
            :disabled="isClearing"
            @click="clearAllSamples"
          >
            <i class="fa-solid fa-trash btn-icon"></i>
            <span>Réinitialiser tout le modèle local</span>
          </button>
        </div>
      </div>

      <div class="ml-section">
        <h3 class="auto-title">Modèle ML local (embeddings + classifieur)</h3>
        <p class="auto-text">
          Entraîne un vrai classifieur (softmax) sur les embeddings MobileNet stockés en base.
        </p>

        <div class="ml-status" v-if="mlStatus">
          <div class="ml-pill" :class="mlStatus.trained ? 'ml-pill-ok' : 'ml-pill-warn'">
            <i class="fa-solid fa-circle-check" v-if="mlStatus.trained"></i>
            <i class="fa-solid fa-triangle-exclamation" v-else></i>
            <span>
              {{ mlStatus.trained ? 'Entraîné' : 'Non entraîné' }}
            </span>
          </div>
          <span class="ml-meta">
            Exemples avec embedding: <strong>{{ mlStatus.samplesCount }}</strong>
          </span>
          <span class="ml-meta" v-if="mlStatus.metadata?.trainedAt">
            Dernier entraînement: <strong>{{ formatDateTime(mlStatus.metadata.trainedAt) }}</strong>
          </span>
          <span class="ml-meta" v-if="mlStatus.metadata?.metrics?.val_accuracy != null">
            Val acc: <strong>{{ (mlStatus.metadata.metrics.val_accuracy * 100).toFixed(0) }}%</strong>
          </span>
        </div>

        <div class="auto-actions">
          <button
            class="btn-secondary"
            type="button"
            :disabled="isLoadingMlStatus"
            @click="loadLocalMlStatus"
          >
            <i class="fa-solid fa-rotate btn-icon"></i>
            <span>Rafraîchir statut</span>
          </button>

          <button
            class="btn-train"
            type="button"
            :disabled="isTrainingMl"
            @click="trainMl"
          >
            <i class="fa-solid fa-dumbbell btn-icon"></i>
            <span>{{ isTrainingMl ? 'Entraînement ML…' : 'Entraîner le modèle ML' }}</span>
          </button>

          <button
            class="btn-secondary"
            type="button"
            :disabled="isEvaluatingMl"
            @click="evaluateMl"
          >
            <i class="fa-solid fa-chart-column btn-icon"></i>
            <span>{{ isEvaluatingMl ? 'Évaluation…' : 'Évaluer' }}</span>
          </button>
        </div>

        <div class="ml-metrics" v-if="mlStatus?.metadata?.metrics">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Loss</span>
              <span class="stat-value">{{ formatNumber(mlStatus.metadata.metrics.loss) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Acc</span>
              <span class="stat-value">{{ formatPercent(mlStatus.metadata.metrics.accuracy) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Val loss</span>
              <span class="stat-value">{{ formatNumber(mlStatus.metadata.metrics.val_loss) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Val acc</span>
              <span class="stat-value">{{ formatPercent(mlStatus.metadata.metrics.val_accuracy) }}</span>
            </div>
          </div>
        </div>

        <div class="ml-eval" v-if="mlEval">
          <p class="auto-text">
            Accuracy globale: <strong>{{ formatPercent(mlEval.accuracy) }}</strong>
          </p>
        </div>
      </div>

      <div class="auto-section">
        <h3 class="auto-title">Entraînement automatique depuis le web</h3>
        <p class="auto-text">
          Utilise ton accès Unsplash pour récupérer quelques images par
          catégorie et alimenter automatiquement le modèle local.
        </p>
        <div class="auto-actions">
          <button
            class="btn-train"
            type="button"
            :disabled="isBootstrapRunning"
            @click="startBootstrap"
          >
            <i class="fa-solid fa-play btn-icon"></i>
            <span>
              {{ isBootstrapRunning ? 'Bootstrap en cours…' : 'Démarrer le bootstrap web' }}
            </span>
          </button>
          <button
            class="btn-secondary"
            type="button"
            :disabled="!isBootstrapRunning"
            @click="stopBootstrap"
          >
            <i class="fa-solid fa-stop btn-icon"></i>
            <span>Arrêter (côté interface)</span>
          </button>
        </div>
      </div>

      <!-- Log des requêtes Unsplash -->
      <div class="unsplash-log-section">
        <div class="log-header">
          <h3 class="auto-title">
            <i class="fa-solid fa-terminal log-title-icon"></i>
            Requêtes Unsplash
            <span class="log-count" v-if="unsplashLog.length">({{ unsplashLog.length }})</span>
          </h3>
          <div class="log-actions">
            <button class="btn-icon-only" @click="loadUnsplashLog" title="Rafraîchir">
              <i class="fa-solid fa-rotate" :class="{ spinning: isLoadingLog }"></i>
            </button>
            <button class="btn-icon-only btn-icon-danger" @click="clearUnsplashLog" title="Effacer le log" :disabled="!unsplashLog.length">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>

        <div class="log-body" v-if="unsplashLog.length">
          <div
            v-for="(entry, i) in unsplashLog"
            :key="i"
            class="log-entry"
          >
            <span class="log-time">{{ formatTime(entry.timestamp) }}</span>
            <span class="log-label-badge" :class="'label-' + labelClass(entry.label)">
              {{ entry.label }}
            </span>
            <span class="log-query">"{{ entry.query }}"</span>
            <span class="log-meta">p.{{ entry.page }} · {{ entry.orderBy }}</span>
            <span class="log-results" :class="entry.results > 0 ? 'log-ok' : 'log-empty'">
              {{ entry.results }} résultat{{ entry.results > 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <p class="log-empty-text" v-else>
          Aucune requête Unsplash enregistrée. Lance un bootstrap pour voir les logs ici.
        </p>
      </div>

      <p v-if="message" class="message" :class="{ 'is-error': isError }">
        {{ message }}
      </p>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import api from '../services/api.js'

export default {
  name: 'TrainView',
  setup() {
    const label = ref('')
    const file = ref(null)
    const isSubmitting = ref(false)
    const message = ref('')
    const isError = ref(false)
    const isBootstrapRunning = ref(false)
    const localStats = ref(null)
    const isLoadingStats = ref(false)
    const isClearing = ref(false)

    // --- Modèle ML local ---
    const mlStatus = ref(null)
    const isLoadingMlStatus = ref(false)
    const isTrainingMl = ref(false)
    const isEvaluatingMl = ref(false)
    const mlEval = ref(null)

    const loadLocalMlStatus = async () => {
      isLoadingMlStatus.value = true
      try {
        const resp = await api.getLocalMlStatus()
        mlStatus.value = resp.data
      } catch (err) {
        console.error('Erreur chargement statut modèle ML:', err)
      } finally {
        isLoadingMlStatus.value = false
      }
    }

    const trainMl = async () => {
      isTrainingMl.value = true
      message.value = ''
      isError.value = false
      try {
        await api.trainLocalMl({ epochs: 25, batchSize: 16, validationSplit: 0.2, minSamplesPerClass: 2 })
        message.value = 'Modèle ML entraîné avec succès.'
        await loadLocalMlStatus()
      } catch (err) {
        console.error('Erreur entraînement ML:', err)
        message.value = err.response?.data?.error || 'Erreur lors de l’entraînement ML.'
        isError.value = true
      } finally {
        isTrainingMl.value = false
      }
    }

    const evaluateMl = async () => {
      isEvaluatingMl.value = true
      try {
        const resp = await api.evaluateLocalMl({ limit: 1000 })
        mlEval.value = resp.data
      } catch (err) {
        console.error('Erreur évaluation ML:', err)
        message.value = err.response?.data?.error || 'Erreur lors de l’évaluation ML.'
        isError.value = true
      } finally {
        isEvaluatingMl.value = false
      }
    }

    const formatNumber = (n) => {
      if (n == null || Number.isNaN(Number(n))) return '—'
      return Number(n).toFixed(3)
    }
    const formatPercent = (p) => {
      if (p == null || Number.isNaN(Number(p))) return '—'
      return `${(Number(p) * 100).toFixed(0)}%`
    }
    const formatDateTime = (iso) => {
      if (!iso) return ''
      const d = new Date(iso)
      return d.toLocaleString('fr-FR')
    }

    // --- Log Unsplash ---
    const unsplashLog = ref([])
    const isLoadingLog = ref(false)
    let pollTimer = null

    const loadUnsplashLog = async () => {
      isLoadingLog.value = true
      try {
        const resp = await api.getUnsplashLog()
        unsplashLog.value = resp.data?.entries || []
      } catch (err) {
        console.error('Erreur chargement log Unsplash:', err)
      } finally {
        isLoadingLog.value = false
      }
    }

    const clearUnsplashLog = async () => {
      try {
        await api.clearUnsplashLog()
        unsplashLog.value = []
      } catch (err) {
        console.error('Erreur effacement log Unsplash:', err)
      }
    }

    const startLogPolling = () => {
      stopLogPolling()
      pollTimer = setInterval(loadUnsplashLog, 2000)
    }

    const stopLogPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    const formatTime = (iso) => {
      if (!iso) return ''
      const d = new Date(iso)
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    const LABEL_CLASSES = {
      Humains: 'humains',
      'Personnages fictifs': 'fictifs',
      Plantes: 'plantes',
      Vehicules: 'vehicules',
      Animaux: 'animaux',
    }
    const labelClass = (l) => LABEL_CLASSES[l] ?? 'other'

    onBeforeUnmount(() => stopLogPolling())

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo
    const isAllowedImageFile = (f) => {
      if (!f) return false
      if (f.size > MAX_FILE_SIZE) return false
      if (f.type?.startsWith('image/')) return true
      if (f.type === 'application/octet-stream') {
        const name = (f.name || '').toLowerCase()
        return name.endsWith('.heic') || name.endsWith('.heif')
      }
      return false
    }

    const onFileSelect = (event) => {
      const f = event.target.files[0]
      if (!f) {
        file.value = null
        return
      }
      if (!isAllowedImageFile(f)) {
        if (f.size > MAX_FILE_SIZE) {
          message.value = 'Fichier trop volumineux (max 10 Mo).'
        } else {
          message.value = 'Veuillez sélectionner une image (JPG, PNG, GIF, HEIC).'
        }
        isError.value = true
        file.value = null
        event.target.value = ''
        return
      }
      message.value = ''
      isError.value = false
      file.value = f
    }

    const onTrain = async () => {
      if (!label.value || !file.value) return
      isSubmitting.value = true
      message.value = ''
      isError.value = false

      try {
        const response = await api.trainLocal(file.value, label.value)
        message.value = response.data?.message || 'Exemple ajouté.'
      } catch (error) {
        console.error('Erreur entraînement local:', error)
        message.value =
          error.response?.data?.error ||
          "Erreur lors de l'ajout de l'exemple."
        isError.value = true
      } finally {
        isSubmitting.value = false
      }
    }

    const startBootstrap = async () => {
      isBootstrapRunning.value = true
      message.value = ''
      isError.value = false
      startLogPolling()

      try {
        const response = await api.bootstrapLocal(5)
        const summary = response.data?.summary || []
        const parts = summary.map(
          (s) => `${s.label}: ${s.added} images`
        )
        message.value =
          response.data?.message ||
          `Bootstrap terminé (${parts.join(', ')})`
      } catch (error) {
        console.error('Erreur bootstrap web:', error)
        message.value =
          error.response?.data?.error ||
          'Erreur lors du bootstrap automatique.'
        isError.value = true
      } finally {
        isBootstrapRunning.value = false
        stopLogPolling()
        await loadUnsplashLog()
      }
    }

    const stopBootstrap = () => {
      isBootstrapRunning.value = false
      stopLogPolling()
    }

    const loadLocalStats = async () => {
      try {
        isLoadingStats.value = true
        const response = await api.getLocalStats()
        localStats.value = response.data
      } catch (error) {
        console.error('Erreur chargement stats modèle local:', error)
      } finally {
        isLoadingStats.value = false
      }
    }

    const clearAllSamples = async () => {
      if (!window.confirm('Supprimer tous les exemples du modèle local ?')) {
        return
      }
      isClearing.value = true
      message.value = ''
      isError.value = false
      try {
        const response = await api.clearLocalSamples()
        message.value = response.data?.message || 'Modèle local réinitialisé.'
        await loadLocalStats()
      } catch (error) {
        console.error('Erreur reset modèle local:', error)
        message.value =
          error.response?.data?.error ||
          'Erreur lors de la réinitialisation du modèle local.'
        isError.value = true
      } finally {
        isClearing.value = false
      }
    }

    const labelKeys = computed(() => [
      'Humains',
      'Personnages fictifs',
      'Plantes',
      'Vehicules',
      'Animaux',
    ])

    onMounted(() => {
      loadLocalStats()
      loadUnsplashLog()
      loadLocalMlStatus()
    })

    return {
      label,
      file,
      isSubmitting,
      message,
      isError,
      isBootstrapRunning,
      localStats,
      isLoadingStats,
      isClearing,
      onFileSelect,
      onTrain,
      startBootstrap,
      stopBootstrap,
      loadLocalStats,
      clearAllSamples,
      labelKeys,
      // ML local
      mlStatus,
      mlEval,
      isLoadingMlStatus,
      isTrainingMl,
      isEvaluatingMl,
      loadLocalMlStatus,
      trainMl,
      evaluateMl,
      formatNumber,
      formatPercent,
      formatDateTime,
      // Log Unsplash
      unsplashLog,
      isLoadingLog,
      loadUnsplashLog,
      clearUnsplashLog,
      formatTime,
      labelClass,
    }
  },
}
</script>

<style scoped>
.train-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  background: var(--bg-card);
  border-radius: 24px;
  border: 1px solid var(--border-color);
  padding: 1.75rem;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(34, 197, 94, 0.25);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.1);
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

.train-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.file-label input[type='file'] {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-train {
  margin-top: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.4);
  background: var(--accent-gradient);
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
}

.btn-train:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-elevated);
  border-color: var(--border-color);
  color: var(--text-muted);
  box-shadow: none;
}

.btn-train:not(:disabled):hover {
  background: linear-gradient(135deg, #2dd96b 0%, #22c55e 50%, #16a34a 100%);
  border-color: rgba(34, 197, 94, 0.6);
  box-shadow: 0 6px 24px rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 0.9rem;
}

.message {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--accent);
}

.message.is-error {
  color: #f97373;
}

.auto-section {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.auto-title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.auto-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.auto-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.stats-section {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.ml-section {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.ml-status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin: 0.6rem 0 0.9rem;
}

.ml-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.ml-pill-ok { border-color: rgba(34, 197, 94, 0.25); color: #86efac; }
.ml-pill-warn { border-color: rgba(251, 146, 60, 0.25); color: #fdba74; }

.ml-meta {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.ml-eval {
  margin-top: 0.75rem;
 }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.stat-item {
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text-primary);
}

.btn-secondary {
  margin-top: 0.5rem;
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

@media (max-width: 1024px) {
  .train-wrapper {
    padding: 1.5rem 1rem;
  }
}

/* ---- Log Unsplash ---- */
.unsplash-log-section {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.log-title-icon {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-right: 0.4rem;
}

.log-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: 0.4rem;
}

.log-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-icon-only {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  transition: color 0.15s, border-color 0.15s;
}
.btn-icon-only:hover:not(:disabled) { color: var(--text-primary); border-color: var(--border-hover); }
.btn-icon-only:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-icon-danger:hover:not(:disabled) { color: #f97373; border-color: rgba(239, 68, 68, 0.35); }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.7s linear infinite; }

.log-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 320px;
  overflow-y: auto;
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 0.78rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  padding: 0.22rem 0.1rem;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.log-entry:last-child { border-bottom: none; }

.log-time {
  color: var(--text-muted);
  min-width: 68px;
  flex-shrink: 0;
}

.log-label-badge {
  padding: 0.08rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  flex-shrink: 0;
}
.label-humains      { background: rgba(59,130,246,.15); color: #93c5fd; }
.label-fictifs      { background: rgba(168,85,247,.15); color: #d8b4fe; }
.label-plantes      { background: rgba(34,197,94,.15);  color: #86efac; }
.label-vehicules    { background: rgba(234,179,8,.15);  color: #fde68a; }
.label-animaux      { background: rgba(251,146,60,.15); color: #fdba74; }
.label-other        { background: rgba(148,163,184,.1); color: #94a3b8; }

.log-query {
  color: var(--text-secondary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-meta {
  color: var(--text-muted);
  flex-shrink: 0;
  font-size: 0.72rem;
}

.log-results { font-weight: 600; flex-shrink: 0; }
.log-ok      { color: #4ade80; }
.log-empty   { color: #f97316; }

.log-empty-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>

