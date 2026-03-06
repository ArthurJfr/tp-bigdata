require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimit');

const connectDB = require('./config/db');
const analyzeRoutes = require('./routes/analyze.routes');
const imagesRoutes = require('./routes/images.routes');
const healthRoutes = require('./routes/health.routes');
const localModelRoutes = require('./routes/localModel.routes');
const webTrainingRoutes = require('./routes/webTraining.routes');
const unsplashLogRoutes = require('./routes/unsplashLog.routes');
const { startAutoWebTraining } = require('./services/webTraining.service');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Derrière un reverse proxy (nginx, etc.) : nécessaire pour rate-limit et IP réelle
if (isProd) {
  app.set('trust proxy', 1);
}

// En-têtes de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS : en prod, n'accepter que l'origine du frontend
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
const corsOptions = isProd && corsOrigin
  ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }
  : {};
app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

// Rate limiting global sur toutes les routes /api
app.use('/api', apiLimiter);

connectDB();

app.use('/api', analyzeRoutes);
app.use('/api', imagesRoutes);
app.use('/api', healthRoutes);
app.use('/api', localModelRoutes);
app.use('/api', webTrainingRoutes);
app.use('/api', unsplashLogRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

// Entraînement automatique périodique depuis le web (optionnel)
if (process.env.ENABLE_WEB_TRAINING === 'true') {
  startAutoWebTraining();
}
