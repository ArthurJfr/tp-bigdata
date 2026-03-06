<template>
  <svg 
    :viewBox="viewBox" 
    :width="size" 
    :height="size" 
    fill="none" 
    stroke="currentColor" 
    :stroke-width="strokeWidth"
    stroke-linecap="round" 
    stroke-linejoin="round"
    class="icon"
    :class="`icon-${name}`"
  >
    <component :is="iconComponent" />
  </svg>
</template>

<script>
import { computed } from 'vue'

const icons = {
  // Logo & App
  target: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
      'M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z',
      'M12 10a2 2 0 1 0 2 2 2 2 0 0 0-2-2z'
    ]
  },
  
  // Upload
  upload: {
    viewBox: '0 0 24 24',
    paths: [
      'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
      'M17 8l-5-5-5 5',
      'M12 3v12'
    ]
  },
  
  // Categories
  human: {
    viewBox: '0 0 24 24',
    paths: [
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
    ]
  },
  character: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
    ]
  },
  plant: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2a5 5 0 0 1 5 5c0 2.5-2 4-5 6-3-2-5-3.5-5-6a5 5 0 0 1 5-5z',
      'M12 7v15',
      'M8 15c-3 0-6 2-6 6h6v-6z',
      'M16 15c3 0 6 2 6 6h-6v-6z'
    ]
  },
  vehicle: {
    viewBox: '0 0 24 24',
    paths: [
      'M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.92V16h2',
      'M6.5 16a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
      'M17.5 16a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z'
    ]
  },
  animal: {
    viewBox: '0 0 24 24',
    paths: [
      'M4.5 12.5a3.5 3.5 0 1 1 3.5-3.5',
      'M14.5 12.5a3.5 3.5 0 1 1 3.5-3.5',
      'M2 16s1.5-3 5-3 5 3 5 3v5H2v-5z',
      'M12 16s1.5-3 5-3 5 3 5 3v5H12v-5z'
    ]
  },
  unknown: {
    viewBox: '0 0 24 24',
    paths: [
      'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3',
      'M12 17h.01',
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'
    ]
  },
  
  // Actions
  trash: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 6h18',
      'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
      'M10 11v6',
      'M14 11v6'
    ]
  },
  refresh: {
    viewBox: '0 0 24 24',
    paths: [
      'M23 4v6h-6',
      'M20.49 15a9 9 0 1 1-2.12-9.36L23 10'
    ]
  },
  close: {
    viewBox: '0 0 24 24',
    paths: [
      'M18 6L6 18',
      'M6 6l12 12'
    ]
  },
  check: {
    viewBox: '0 0 24 24',
    paths: ['M20 6L9 17l-5-5']
  },
  
  // File & Analysis
  file: {
    viewBox: '0 0 24 24',
    paths: [
      'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z',
      'M14 2v6h6',
      'M16 13H8',
      'M16 17H8',
      'M10 9H8'
    ]
  },
  image: {
    viewBox: '0 0 24 24',
    paths: [
      'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z',
      'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'M21 15l-5-5-5 5-3-3-4 4'
    ]
  },
  scan: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 7V5a2 2 0 0 1 2-2h2',
      'M17 3h2a2 2 0 0 1 2 2v2',
      'M21 17v2a2 2 0 0 1-2 2h-2',
      'M7 21H5a2 2 0 0 1-2-2v-2',
      'M3 12h18'
    ]
  },
  brain: {
    viewBox: '0 0 24 24',
    paths: [
      'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z',
      'M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z'
    ]
  },
  tag: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z',
      'M7 7h.01'
    ]
  },
  
  // Stats & Gamification
  chart: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 3v18h18',
      'M18 17V9',
      'M13 17V5',
      'M8 17v-3'
    ]
  },
  award: {
    viewBox: '0 0 24 24',
    paths: [
      'M6 9H4.5a2.5 2.5 0 0 1 0-5H6',
      'M18 9h1.5a2.5 2.5 0 0 0 0-5H18',
      'M4 22h16',
      'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
      'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
      'M18 2H6v7a6 6 0 0 0 12 0V2z'
    ]
  },
  trophy: {
    viewBox: '0 0 24 24',
    paths: [
      'M6 9H4.5a2.5 2.5 0 0 1 0-5H6',
      'M18 9h1.5a2.5 2.5 0 0 0 0-5H18',
      'M4 22h16',
      'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
      'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
      'M18 2H6v7a6 6 0 0 0 12 0V2z'
    ]
  },
  camera: {
    viewBox: '0 0 24 24',
    paths: [
      'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
      'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
    ]
  },
  history: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 3v5h5',
      'M3.05 13A9 9 0 1 0 6 5.3L3 8',
      'M12 7v5l4 2'
    ]
  },
  activity: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 12h-4l-3 9L9 3l-3 9H2'
    ]
  },
  percentage: {
    viewBox: '0 0 24 24',
    paths: [
      'M19 5L5 19',
      'M6.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
      'M17.5 15a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'
    ]
  },
  
  // Navigation
  arrowRight: {
    viewBox: '0 0 24 24',
    paths: [
      'M5 12h14',
      'M12 5l7 7-7 7'
    ]
  },
  chevronDown: {
    viewBox: '0 0 24 24',
    paths: ['M6 9l6 6 6-6']
  },
  
  // TensorFlow specific
  layers: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2L2 7l10 5 10-5-10-5z',
      'M2 17l10 5 10-5',
      'M2 12l10 5 10-5'
    ]
  },
  cpu: {
    viewBox: '0 0 24 24',
    paths: [
      'M4 4h16v16H4z',
      'M9 9h6v6H9z',
      'M9 1v3',
      'M15 1v3',
      'M9 20v3',
      'M15 20v3',
      'M20 9h3',
      'M20 14h3',
      'M1 9h3',
      'M1 14h3'
    ]
  }
}

export default {
  name: 'Icon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    strokeWidth: {
      type: [Number, String],
      default: 2
    }
  },
  setup(props) {
    const viewBox = computed(() => icons[props.name]?.viewBox || '0 0 24 24')
    
    const iconComponent = computed(() => ({
      render: () => {
        const icon = icons[props.name]
        if (!icon) return null
        
        return icon.paths.map(path => 
          h('path', { d: path })
        )
      }
    }))
    
    return { viewBox, iconComponent }
  }
}

import { h } from 'vue'
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
