import { createRouter, createWebHistory } from 'vue-router'
import AnalyzeView from '../views/AnalyzeView.vue'
import HistoryView from '../views/HistoryView.vue'
import TrainView from '../views/TrainView.vue'
import LocalSamplesView from '../views/LocalSamplesView.vue'
import AboutView from '../views/AboutView.vue'

const routes = [
  {
    path: '/',
    name: 'analyze',
    component: AnalyzeView,
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView,
  },
  {
    path: '/train',
    name: 'train',
    component: TrainView,
  },
  {
    path: '/local-samples',
    name: 'local-samples',
    component: LocalSamplesView,
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

