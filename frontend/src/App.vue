<template>
  <div id="app" class="dark-theme">
    <!-- Background animated mesh -->
    <div class="bg-mesh">
      <div class="mesh-gradient mesh-1"></div>
      <div class="mesh-gradient mesh-2"></div>
      <div class="mesh-gradient mesh-3"></div>
    </div>
    
    <!-- Animated grid overlay -->
    <div class="grid-overlay"></div>
    
    <header class="app-header">
      <div class="header-main">
        <div class="logo-container">
          <div class="logo-icon-wrapper">
            <i class="fa-solid fa-brain logo-icon"></i>
          </div>
          <div class="logo-text-block">
            <h1 class="logo-text">TP Big Data</h1>
            <p class="tagline">Reconnaissance d'images par TensorFlow.js</p>
          </div>
        </div>
        <nav class="main-nav">
          <RouterLink
            to="/"
            class="nav-link"
            active-class="nav-link-active"
            exact
          >
            Analyse
          </RouterLink>
          <RouterLink
            to="/history"
            class="nav-link"
            active-class="nav-link-active"
          >
            Historique
          </RouterLink>
          <RouterLink
            to="/train"
            class="nav-link"
            active-class="nav-link-active"
          >
            Entraînement local
          </RouterLink>
          <RouterLink
            to="/local-samples"
            class="nav-link"
            active-class="nav-link-active"
          >
            Échantillons locaux
          </RouterLink>
          <RouterLink
            to="/about"
            class="nav-link"
            active-class="nav-link-active"
          >
            À propos
          </RouterLink>
        </nav>
      </div>
      <GamificationPanel v-if="stats" :stats="stats" />
    </header>

    <main class="main-shell">
      <RouterView />
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        <a href="https://github.com/ArthurJfr" target="_blank">
        <i class="fa-brands fa-github"></i>
        </a>
        <a href="https://www.linkedin.com/in/arthur-jaffro-66995a257/" target="_blank">
          <i class="fa-brands fa-linkedin"></i>
        </a>
       <!-- <i class="fa-solid fa-brain"></i> -->
        <span>School TP Big Data — TensorFlow.js &amp; ArthurJfr</span>
        
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, provide } from 'vue'
import api from './services/api.js'
import GamificationPanel from './components/GamificationPanel.vue'

export default {
  name: 'App',
  components: {
    GamificationPanel,
  },
  setup() {
    const stats = ref(null)

    const loadStats = async () => {
      try {
        const response = await api.getStats()
        stats.value = response.data
      } catch (error) {
        console.error('Erreur chargement stats:', error)
      }
    }

    provide('refreshGlobalStats', loadStats)
    provide('stats', stats)

    onMounted(() => {
      loadStats()
    })

    return {
      stats,
      loadStats,
    }
  },
}
</script>

<style>
/* CSS Variables - Clean & Minimal */
:root {
  --bg-primary: #050505;
  --bg-secondary: #0a0a0a;
  --bg-card: #0d0d0d;
  --bg-elevated: #111111;
  --bg-elevated-soft: #111318;
  
  --accent: #22c55e;
  --accent-hover: #16a34a;
  --accent-soft: rgba(34, 197, 94, 0.14);
  --accent-gradient: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%);
  
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #606060;
  
  --border-color: #1a1a1a;
  --border-hover: #2a2a2a;
  
  --font-primary: 'Inter', sans-serif;
  --font-display: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  font-family: var(--font-primary);
  background: 
    radial-gradient(ellipse 100% 60% at 70% 100%, rgba(34, 197, 94, 0.06), transparent 55%),
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 197, 94, 0.1), transparent 50%),
    var(--bg-primary);
  color: var(--text-primary);
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
}

/* Animated Mesh Background */
.bg-mesh {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.mesh-gradient {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.22;
  animation: meshFloat 20s ease-in-out infinite;
}

.mesh-1 {
  width: 600px;
  height: 600px;
  background: var(--accent);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.mesh-2 {
  width: 500px;
  height: 500px;
  background: var(--accent);
  bottom: -150px;
  right: -100px;
  animation-delay: -7s;
}

.mesh-3 {
  width: 400px;
  height: 400px;
  background: var(--accent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes meshFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(50px, -30px) scale(1.1);
  }
  50% {
    transform: translate(-30px, 50px) scale(0.95);
  }
  75% {
    transform: translate(-50px, -20px) scale(1.05);
  }
}

/* Grid Overlay */
.grid-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

/* Header */
.app-header {
  position: relative;
  z-index: 1;
  padding: 2.5rem 2rem 2rem;
  border-bottom: 1px solid var(--border-color);
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  align-items: center;
  gap: 1.75rem;
  backdrop-filter: blur(18px);
  background: radial-gradient(ellipse 120% 80% at top left, rgba(34, 197, 94, 0.12), transparent 50%),
    radial-gradient(ellipse 80% 60% at bottom right, rgba(34, 197, 94, 0.06), transparent 45%);
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-container::after {
  content: '';
  flex: 1;
  height: 1px;
  margin-left: 1.5rem;
  max-width: 260px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
  opacity: 0.45;
}

.main-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
  padding: 0.2rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.nav-link {
  position: relative;
  font-size: 0.9rem;
  text-transform: none;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  text-decoration: none;
  transition: color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.nav-link-active {
  color: var(--text-primary);
  background: var(--accent-soft);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.55);
}

.logo-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.5);
}

.logo-icon {
  color: var(--accent);
  font-size: 1.2rem;
}

.logo-text-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 550;
  letter-spacing: -0.03em;
  margin: 0;
  color: var(--text-primary);
}

.tagline {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: none;
}

.header-accent {
  width: 80px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), transparent);
  opacity: 0.9;
}

.main-shell {
  position: relative;
  z-index: 1;
}

/* Footer */
.app-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(to top, rgba(34, 197, 94, 0.03), transparent);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.app-footer i {
  color: var(--accent);
  opacity: 0.8;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.footer-content i {
  color: var(--accent);
  opacity: 0.8;
}

.footer-content i {
  color: var(--accent);
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 1024px) {
  .logo-text {
    font-size: 2rem;
  }
  
  .app-header {
    padding: 1.5rem 1rem;
  }
}
</style>
