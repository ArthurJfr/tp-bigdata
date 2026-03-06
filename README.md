# TP Big Data — Reconnaissance d'images

Application de reconnaissance d'images par catégorie, utilisant TensorFlow.js (MobileNet) comme moteur principal et un modèle local entraînable en bonus. Stack complète conteneurisée avec Docker.

---

## 1. Objectif du TP

Réaliser une application qui :

- reçoit une image depuis une interface web,
- la reconnaît parmi 5 catégories : **Humains**, **Personnages fictifs**, **Plantes**, **Véhicules**, **Animaux**,
- enregistre les analyses dans MongoDB,
- affiche l'historique des analyses avec possibilité de suppression,
- intègre un panneau de statistiques (gamification légère).

---

## 2. Stack technique retenue

| Couche | Technologie |
|---|---|
| Frontend | Vue 3 (Vite), Vue Router 4 |
| Backend | Node.js + Express |
| IA principale | TensorFlow.js — MobileNet v2 (pré-entraîné ImageNet) |
| IA locale (bonus) | Modèle local basé sur les exemples `LocalSample` (MongoDB) |
| Base de données | MongoDB (Mongoose) |
| Orchestration | Docker + Docker Compose |
| Sécurité | `express-rate-limit` (rate limiting par route) |
| Images web | Unsplash API (clé personnelle, 50 req/h) |

---

## 3. Architecture et flux principal

```
Utilisateur
    │
    ▼
[Frontend Vue 3] ─ POST /api/analyze (multipart/form-data + model) ──▶ [Backend Express]
                                                                              │
                                                        ┌─────────────────────┤
                                                        │                     │
                                               model=tensorflow       model=local
                                                        │                     │
                                               MobileNet (tfjs)    LocalSample (MongoDB)
                                                        │              similarité de tags
                                                        └──────────────────────┘
                                                                      │
                                                          categoryMapping.service.js
                                                                      │
                                                              Sauvegarde MongoDB
                                                                      │
                                               ◀──────────────── Réponse JSON (analysis)
    │
    ▼
[Zone résultat + Historique + Stats]
```

---

## 4. Arborescence des fichiers

```text
tp-bigdata/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                         # Bootstrap express + auto-training
│       ├── config/db.js
│       ├── middleware/rateLimit.js
│       ├── models/
│       │   ├── Image.model.js               # Analyses sauvegardées
│       │   └── LocalSample.model.js         # Exemples du modèle local
│       ├── services/
│       │   ├── tensorflow.service.js        # Analyse via MobileNet
│       │   ├── categoryMapping.service.js   # Mapping labels → catégories TP
│       │   ├── localModel.service.js        # Entraînement + prédiction locale
│       │   └── webTraining.service.js       # Bootstrap Unsplash automatique
│       ├── controllers/
│       │   ├── analyze.controller.js
│       │   ├── images.controller.js
│       │   ├── localModel.controller.js
│       │   └── webTraining.controller.js
│       └── routes/
│           ├── analyze.routes.js
│           ├── images.routes.js
│           ├── health.routes.js
│           ├── localModel.routes.js
│           └── webTraining.routes.js
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── main.js
│       ├── App.vue                          # Layout global + navigation
│       ├── router/index.js
│       ├── services/api.js
│       ├── views/
│       │   ├── AnalyzeView.vue              # Page analyse (upload + résultat)
│       │   ├── HistoryView.vue              # Page historique + modal détail
│       │   ├── TrainView.vue                # Page entraînement modèle local
│       │   └── AboutView.vue                # Page À propos (description du service)
│       └── components/
│           ├── ImageUpload.vue
│           ├── AnalysisResult.vue
│           ├── HistoryList.vue
│           └── GamificationPanel.vue
└── infra/
    └── env/
        ├── backend.env
        └── frontend.env
```

---

## 5. Démarrage rapide

```bash
# 1. Configurer les variables d'environnement
# (voir section 6)

# 2. Lancer le stack
docker-compose up --build

# Frontend : http://localhost:5173
# Backend  : http://localhost:3000
```

---

## 6. Variables d'environnement

`infra/env/backend.env` :

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/tp_bigdata
UNSPLASH_ACCESS_KEY=ta_cle_unsplash_ici
ENABLE_WEB_TRAINING=true
```

> `ENABLE_WEB_TRAINING=true` active l'entraînement automatique périodique depuis Unsplash (1 image par minute max, respecte la limite de 50 req/h).

`infra/env/frontend.env` :

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 7. Collections MongoDB

### `images` — Analyses réalisées

```json
{
  "date": "2026-03-05T18:23:45.000Z",
  "imageName": "chat.png",
  "imageSize": 254123,
  "analysis": {
    "confidence": 0.72,
    "detectedTypes": ["Animaux"],
    "rawTags": [
      { "name": "tabby cat", "confidence": 0.82 },
      { "name": "tiger cat", "confidence": 0.11 }
    ]
  }
}
```

### `localsamples` — Exemples d'entraînement du modèle local

```json
{
  "createdAt": "2026-03-05T18:30:00.000Z",
  "label": "Animaux",
  "tags": [
    { "name": "dog", "confidence": 0.93 },
    { "name": "golden retriever", "confidence": 0.88 }
  ]
}
```

---

## 8. Endpoints API

### Analyse d'images

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload + analyse + sauvegarde |
| `GET` | `/api/images` | Historique des analyses |
| `DELETE` | `/api/images/:id` | Supprimer une analyse |
| `GET` | `/api/stats` | Statistiques globales |
| `GET` | `/api/health` | Santé du serveur |

**`POST /api/analyze`** — `multipart/form-data` :
- `image` (fichier image, max 10 Mo)
- `model` : `"tensorflow"` (défaut) ou `"local-ml"` (classifieur ML entraîné sur embeddings)

```json
// Réponse 201
{
  "message": "Image analysee avec succes",
  "image": { "...": "..." }
}
```

**`GET /api/images`** — Paramètres optionnels :
- `limit` (défaut 50, max 100)
- `sort` : `"asc"` ou `"desc"` (défaut)
- `type` : filtre par catégorie détectée

### Modèle local

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/local/train` | Ajouter un exemple d'entraînement manuel |
| `GET` | `/api/local/samples` | Liste paginée des LocalSample (filtres : page, limit, label, source, hasEmbedding) |
| `GET` | `/api/local/stats` | Nombre d'exemples par label |
| `DELETE` | `/api/local/samples` | Supprimer tout ou un label |
| `POST` | `/api/local/bootstrap` | Déclencher un bootstrap Unsplash |
| `POST` | `/api/local/model/train` | Entraîner le classifieur ML local (embeddings → softmax) |
| `GET` | `/api/local/model/status` | Statut + métadonnées du modèle ML local |
| `POST` | `/api/local/model/evaluate` | Évaluer le modèle ML local (accuracy + matrice de confusion) |

**`POST /api/local/train`** — `multipart/form-data` :
- `image` (fichier image)
- `label` : une des 5 catégories

**`DELETE /api/local/samples`** — body JSON optionnel :
- `{ "label": "Animaux" }` → supprime uniquement ce label
- body vide → supprime tous les exemples

---

## 9. Moteur d'analyse et modèle local

### TensorFlow.js (MobileNet)

MobileNet est un réseau de neurones convolutif (CNN) pré-entraîné sur ImageNet (1 000 classes).  
Pour chaque image, il renvoie une liste de labels avec leur probabilité (`rawTags`).  
Ces labels sont ensuite mappés vers les 5 catégories du TP via `categoryMapping.service.js` :

- Les scores par catégorie sont agrégés (somme des confidences des tags matchants).
- Les tags de confiance < 0.15 sont ignorés (réduction du bruit).
- Seules les catégories avec un score ≥ 0.3 sont retenues dans `detectedTypes`.
- La confiance retournée est le meilleur score de catégorie normalisé entre 0 et 1.

### Modèle local

Le modèle local est un **classifieur par similarité de tags** construit à partir d'exemples stockés dans MongoDB (`LocalSample`).

**Entraînement :**
1. On passe une image dans MobileNet pour extraire ses `rawTags`.
2. On stocke les tags avec le label attendu comme `LocalSample`.
3. Deux sources : exemples manuels (formulaire UI) et images Unsplash (bootstrap automatique).

**Prédiction :**
1. On extrait les `rawTags` de l'image à prédire.
2. Pour chaque label, on additionne la confiance des tags de l'image qui correspondent aux tags des `LocalSample` de ce label (pondération par confiance).
3. On normalise le score par le nombre d'exemples par label (évite les biais de sur-représentation).
4. On retourne le label avec le meilleur score normalisé et une confiance proportionnelle.

**Bootstrap Unsplash automatique :**
- Se déclenche 1 fois par minute si `ENABLE_WEB_TRAINING=true`.
- Choisit un label au hasard, vérifie qu'il n'a pas dépassé 50 exemples.
- Télécharge 1 image via l'API Unsplash (requêtes diversifiées, pages aléatoires).
- Respecte la limite gratuite de 50 req/h.

### Modèle ML local (vrai apprentissage supervisé)

En complément du modèle local heuristique, l'application propose un **vrai modèle ML** entraînable :

- **Features** : on extrait un **embedding MobileNet** (vecteur) pour chaque exemple et on le stocke dans `LocalSample`.
- **Apprentissage** : on entraîne une tête **Dense + Softmax** sur ces embeddings (5 classes).
- **Inférence** : avec `model=local-ml`, on calcule l'embedding de l'image puis on applique le classifieur entraîné.

**Important (migration)** : les anciens `LocalSample` créés avant l'ajout des embeddings ne contiennent pas l'image source, donc **on ne peut pas recalculer d'embeddings après coup**.

Scripts utiles (backend) :
- `npm run local:embeddings:audit`
- `npm run local:embeddings:prune`
- `npm run smoke:local-ml` (entraînement + évaluation rapide, sans serveur HTTP)

---

## 10. Pages frontend

| Route | Page | Description |
|---|---|---|
| `/` | Analyse | Upload d'image, choix du moteur, résultat en temps réel |
| `/history` | Historique | Liste des analyses, modal de détail au clic |
| `/train` | Entraînement | Ajout manuel, bootstrap web, stats et reset du modèle local |
| `/about` | À propos | Présentation du TP et du service (objectif, flux, moteurs, MongoDB) |

---

## 11. Sécurité

- **Rate limiting global** : 100 requêtes / IP / 15 minutes sur toutes les routes `/api`.
- **Rate limiting analyse** : 10 analyses / IP / minute sur `POST /api/analyze`.
- **Validation des entrées** : paramètres `limit`, `sort`, `type` validés côté contrôleur ; `id` MongoDB vérifié par regex avant `findByIdAndDelete`.
- **Taille max image** : 10 Mo (multer).
- **Types de fichiers** : `image/*` (JPG, PNG, GIF, HEIC, etc.). Les fichiers HEIC sont convertis en JPEG côté backend avant analyse (TensorFlow.js ne supporte pas nativement le HEIC).
- **Helmet** : en-têtes HTTP de sécurité (X-Content-Type-Options, etc.).
- **CORS** : en production (`NODE_ENV=production`), définir `CORS_ORIGIN` (ou `FRONTEND_URL`) avec l’URL du frontend pour n’accepter que cette origine.
- **Trust proxy** : activé en prod pour un reverse proxy (nginx) afin que le rate limiting utilise la vraie IP client.

---

## 11.1 Déploiement sur un VPS

Pour exposer l’app sur ton propre serveur :

1. **Variables d’environnement**  
   Utiliser `infra/env/backend.env.example` comme modèle. En prod, définir au minimum :
   - `NODE_ENV=production`
   - `MONGO_URI` (MongoDB local ou Atlas)
   - `CORS_ORIGIN` = URL du frontend (ex. `https://ton-domaine.fr`)

2. **Reverse proxy (recommandé)**  
   Placer nginx (ou Caddy) devant le backend : HTTPS, couper les requêtes trop longues, éventuellement limiter la taille du body. Le backend doit tourner en `trust proxy` (déjà le cas si `NODE_ENV=production`).

3. **Secrets**  
   Ne jamais committer de fichier contenant des clés (`.env`, `backend.env`). Utiliser les variables d’env du système ou du conteneur.

4. **Frontend**  
   Builder avec `VITE_API_URL` pointant vers l’URL publique du backend (ex. `https://api.ton-domaine.fr/api`).

---

## 12. Slides de présentation (sujet TP)

- Répartition du travail et organisation
- Type d'apprentissage et algorithmes utilisés par TensorFlow / MobileNet
- Comment une machine reconnaît une image (CNN, ImageNet, features)
- Présentation de la solution (architecture, modèle local, bootstrap Unsplash)
- Contraintes / réussites
- Questions / réponses

**Sources :** [tensorflow.org/learn](https://www.tensorflow.org/learn?hl=fr) — [azure.microsoft.com Vision](https://azure.microsoft.com/fr-fr/products/ai-services/ai-vision/) — support de cours.

---

## 13. Definition of Done

- Upload d'image fonctionnel (TensorFlow et modèle local).
- Résultat affiché (type détecté + confiance + top prédictions MobileNet).
- Sauvegarde MongoDB effective pour chaque analyse.
- Historique visible avec modal de détail et suppression.
- Modèle local alimenté par Unsplash et visible dans la page Entraînement.
- Panneau de statistiques (total images, précision moyenne, top catégorie, streak...).
- Modèle ML local entraînable (train/status/evaluate) et utilisable via `model=local-ml`.
