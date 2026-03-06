<template>
  <div class="about-wrapper">
    <section class="card">
      <h2 class="section-title">
        <i class="fa-solid fa-circle-info title-icon"></i>
        <span>À propos</span>
      </h2>

      <p class="intro">
        Ce TP a pour objectif de vous faire manipuler un mini service web de reconnaissance d'images,
        construit avec Vue 3, Node.js, TensorFlow.js (MobileNet) et MongoDB.
      </p>

      <h3 class="subtitle">Ce que fait ce service</h3>
      <p class="text">
        Cette application web vous permet de téléverser une image et de la faire analyser par deux moteurs au choix :
      </p>
      <ul class="list">
        <li>
          <strong>TensorFlow.js (MobileNet)</strong> — Modèle pré-entraîné sur ImageNet qui renvoie des labels détaillés,
          mappés ensuite vers les 5 catégories du TP : Humains, Personnages fictifs, Plantes, Véhicules, Animaux.
        </li>
        <li>
          <strong>Modèle local</strong> — Un classifieur par similarité de tags, entraîné avec vos propres exemples
          (manuel ou via images Unsplash). Il s’améliore au fur et à mesure que vous ajoutez des données sur la page Entraînement.
        </li>
      </ul>

      <h3 class="subtitle">Flux utilisateur</h3>
      <p class="text">
        Sur la page <strong>Analyse</strong>, vous uploadez une image, choisissez le moteur (TensorFlow ou local), puis lancez l’analyse.
        Le résultat (catégorie(s) détectée(s) et taux de confiance) s’affiche immédiatement. Chaque analyse est enregistrée en base.
      </p>
      <p class="text">
        Les résultats sont stockés dans <strong>MongoDB</strong> et consultables dans l’onglet <strong>Historique</strong> :
        vous pouvez voir la liste des analyses, ouvrir le détail dans une modal et supprimer un enregistrement.
      </p>

      <h3 class="subtitle">Pages de l’application</h3>
      <ul class="list">
        <li><strong>Analyse</strong> — Upload d’image, choix du moteur, affichage du résultat.</li>
        <li><strong>Historique</strong> — Liste des analyses, détail en modal, suppression.</li>
        <li><strong>Entraînement local</strong> — Ajout d’exemples par catégorie, bootstrap web (Unsplash), statistiques et réinitialisation du modèle.</li>
      </ul>

      <p class="footer-text">
        Le panneau de statistiques dans l’en-tête (images analysées, précision moyenne) alimente une légère dimension de gamification du TP.
      </p>
    </section>
  </div>
</template>

<script>
export default {
  name: 'AboutView',
}
</script>

<style scoped>
.about-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  background: var(--bg-card);
  border-radius: 24px;
  border: 1px solid var(--border-color);
  padding: 1.75rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.title-icon {
  color: var(--accent);
}

.intro {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.subtitle {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.list {
  margin: 0.5rem 0 1rem 1.25rem;
  padding: 0;
  list-style: disc;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.list li {
  margin-bottom: 0.5rem;
}

.list strong {
  color: var(--text-primary);
}

.footer-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 1024px) {
  .about-wrapper {
    padding: 1.5rem 1rem;
  }
}
</style>
