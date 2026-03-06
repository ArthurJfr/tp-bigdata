const Image = require('../models/Image.model');

const getImages = async (req, res) => {
  try {
    const { limit: rawLimit = 50, type, sort = 'desc' } = req.query;

    // Validation basique des paramètres
    const allowedTypes = [
      'Humains',
      'Personnages fictifs',
      'Plantes',
      'Vehicules',
      'Animaux',
    ];

    let limit = parseInt(rawLimit, 10);
    if (Number.isNaN(limit) || limit <= 0) {
      limit = 50;
    }
    // Clamp pour éviter les listes énormes
    limit = Math.min(limit, 100);

    if (sort !== 'asc' && sort !== 'desc') {
      return res.status(400).json({ error: "Paramètre 'sort' invalide" });
    }

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Paramètre 'type' invalide" });
    }

    const query = type ? { 'analysis.detectedTypes': type } : {};
    const sortOrder = sort === 'asc' ? 1 : -1;

    const images = await Image.find(query)
      .sort({ date: sortOrder })
      .limit(limit);

    return res.status(200).json({ images, count: images.length });
  } catch (error) {
    console.error('Erreur getImages:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation basique de l'identifiant MongoDB
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    const image = await Image.findByIdAndDelete(id);

    if (!image) {
      return res.status(404).json({ error: 'Image non trouvee' });
    }

    return res.status(200).json({
      message: 'Image supprimee avec succes',
      id,
    });
  } catch (error) {
    console.error('Erreur deleteImage:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

const getStats = async (req, res) => {
  try {
    const totalImages = await Image.countDocuments();
    const allImages = await Image.find(
      {},
      { 'analysis.detectedTypes': 1, 'analysis.confidence': 1, date: 1 }
    ).sort({ date: 1 });

    const byType = {
      Humains: 0,
      'Personnages fictifs': 0,
      Plantes: 0,
      Vehicules: 0,
      Animaux: 0,
    };

    let totalConfidence = 0;
    let nonIdentified = 0;

    // Calcul de la meilleure série consécutive (confiance >= 0.8)
    const HIGH_CONFIDENCE = 0.8;
    let currentStreak = 0;
    let bestStreak = 0;

    allImages.forEach((img) => {
      img.analysis.detectedTypes.forEach((type) => {
        if (byType[type] !== undefined) byType[type]++;
      });
      totalConfidence += img.analysis.confidence;

      if (
        img.analysis.detectedTypes.length === 1 &&
        img.analysis.detectedTypes[0] === 'Non identifie'
      ) {
        nonIdentified += 1;
      }

      if (img.analysis.confidence >= HIGH_CONFIDENCE) {
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    const averageConfidence =
      totalImages > 0
        ? parseFloat((totalConfidence / totalImages).toFixed(4))
        : 0;

    // Catégorie la plus détectée
    const topCategory =
      Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return res.status(200).json({
      totalImages,
      byType,
      averageConfidence,
      topCategory,
      bestStreak,
      nonIdentified,
    });
  } catch (error) {
    console.error('Erreur getStats:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

module.exports = { getImages, deleteImage, getStats };
