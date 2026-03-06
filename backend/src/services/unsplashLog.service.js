/**
 * Store en mémoire des dernières requêtes envoyées à Unsplash.
 * Réinitialisé à chaque redémarrage du serveur.
 */
const MAX_LOG_ENTRIES = 200;

const log = [];

const addEntry = (entry) => {
  log.unshift({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  if (log.length > MAX_LOG_ENTRIES) {
    log.length = MAX_LOG_ENTRIES;
  }
};

const getLog = () => [...log];

const clearLog = () => {
  log.length = 0;
};

module.exports = { addEntry, getLog, clearLog };
