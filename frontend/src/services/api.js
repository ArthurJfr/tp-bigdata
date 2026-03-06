import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const ALLOWED_MODELS = ['tensorflow', 'local-ml']

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default {
  analyzeImage(imageFile, model = 'tensorflow') {
    const safeModel = ALLOWED_MODELS.includes(model) ? model : 'tensorflow'
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('model', safeModel)

    return apiClient.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  getImages(params = {}) {
    return apiClient.get('/images', { params })
  },

  deleteImage(id) {
    const safeId = typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id) ? id : null
    if (!safeId) return Promise.reject(new Error('ID image invalide'))
    return apiClient.delete(`/images/${safeId}`)
  },

  getStats() {
    return apiClient.get('/stats')
  },

  trainLocal(imageFile, label) {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('label', label)

    return apiClient.post('/local/train', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  bootstrapLocal(perLabel = 5) {
    return apiClient.post('/local/bootstrap', { perLabel })
  },

  getLocalStats() {
    return apiClient.get('/local/stats')
  },

  getLocalSamples(params = {}) {
    return apiClient.get('/local/samples', { params })
  },

  clearLocalSamples(label) {
    return apiClient.delete('/local/samples', {
      data: label ? { label } : {},
    })
  },

  trainLocalMl(params = {}) {
    return apiClient.post('/local/model/train', params)
  },

  getLocalMlStatus() {
    return apiClient.get('/local/model/status')
  },

  evaluateLocalMl(params = {}) {
    return apiClient.post('/local/model/evaluate', params)
  },

  getUnsplashLog() {
    return apiClient.get('/unsplash/log')
  },

  clearUnsplashLog() {
    return apiClient.delete('/unsplash/log')
  },
}
