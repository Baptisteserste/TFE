# VanApp

> Application de suivi de voyages en van — Travail de Fin d'Etudes (TFE)

VanApp est une plateforme fullstack permettant d'enregistrer, visualiser et analyser des voyages en van en temps réel. L'application couvre trois fronts : une API REST Laravel en backend, une application mobile Expo/React Native et une interface web Next.js.

---

## Architecture

| Composant       | Technologie                     | Déploiement          |
|-----------------|---------------------------------|----------------------|
| Backend API     | Laravel 12 (PHP)                | Railway              |
| Frontend Web    | Next.js 14 (TypeScript)         | Vercel               |
| App Mobile      | Expo / React Native (TypeScript)| APK via EAS Build    |
| Base de données | MySQL                           | Railway / PlanetScale|

```
TFE/
├── van-app-backend/   # API Laravel
├── van-app-mobile/    # App Expo / React Native
└── van-app-web/       # Interface Next.js
```

---

## Fonctionnalites

### Authentification
- Inscription et connexion via JWT (Laravel Sanctum)
- Stockage securise du token sur mobile (`expo-secure-store`)
- Redirection automatique si non connecte (web et mobile)

### Gestion des voyages
- Demarrage d'un voyage depuis la carte mobile
- Titre genere automatiquement avec la date
- Liste des voyages avec statut visuel (en cours / termine)
- Renommage, cloture et suppression d'un voyage

### Tracking GPS
- Precision maximale (`Location.Accuracy.BestForNavigation`)
- Mise a jour toutes les 2 metres / 1 seconde
- Enregistrement en avant-plan : tracé en temps réel sur la carte
- Enregistrement en arriere-plan (APK natif) : tache `expo-task-manager`, notification persistante Android, envoi en batch toutes les 15 secondes

### Statistiques de voyage
Calculees cote client via la formule de Haversine :

| Metrique           | Calcul                                                   |
|--------------------|----------------------------------------------------------|
| Distance totale    | Somme des distances Haversine entre points consecutifs   |
| Duree              | Ecart entre le 1er et le dernier horodatage GPS          |
| Vitesse moyenne    | Distance / Duree                                         |
| Nombre de photos   | Comptage des medias avec `image_path`                    |
| Nombre de notes    | Comptage des medias sans image mais avec `description`   |

### Photos et notes geocodees
- Prise de photo depuis la carte mobile et upload vers le serveur
- Ajout de notes textuelles multi-lignes avec coordonnees GPS
- Affichage sur la carte (marqueurs colores) et dans la sidebar web

### Visualisation du voyage (replay)
- Carte Google Maps avec trace (polyline rouge)
- Marqueur de depart et d'arrivee
- Zoom automatique sur l'integralite du trace

### Export GPX
- Format GPX 1.1 standard (compatible Google Maps, Komoot, AllTrails, Garmin Connect)
- Mobile : partage via le dialogue natif Android (Drive, email, WhatsApp...)
- Web : telechargement direct du fichier `.gpx`
- Chaque point contient : latitude, longitude, horodatage, vitesse

### Interface web (Next.js)
- Tableau de bord avec statistiques globales et filtres par statut
- Carte mondiale de tous les voyages (`AllTripsMap.tsx`) avec couleurs distinctes par voyage
- Detail d'un voyage : carte Leaflet interactive, sidebar avec stats, galerie medias
- Graphique de vitesse en temps (Chart.js, area chart sombre)
- Barre de recherche en temps reel cumulable avec les filtres de statut
- Page profil : informations, parametres (format distance, langue) et securite

### Meteo au depart
- Service `weatherService.ts` via l'API **Open-Meteo** (gratuite, sans cle API)
- Temperature, condition et vent a l'heure exacte du premier point GPS
- Carte gradient affichee en silence dans la sidebar de detail

---

## Stack technique

### Backend — `van-app-backend/`
- **Framework** : Laravel 12
- **Auth** : Laravel Sanctum (tokens API)
- **Modeles** : `User`, `Trip`, `LocationPoint`, `Media`
- **Stockage fichiers** : stockage local + lien symbolique `/storage` (Railway)
- **Tests** : PHPUnit (Feature tests)

### Mobile — `van-app-mobile/`
- **Framework** : Expo SDK 54 / React Native 0.81
- **Navigation** : `@react-navigation/native-stack` + `bottom-tabs`
- **Cartes** : `react-native-maps` (Google Maps SDK)
- **Localisation** : `expo-location` (foreground + background)
- **Taches de fond** : `expo-task-manager`
- **Fichiers & partage** : `expo-file-system` + `expo-sharing`
- **Token** : `expo-secure-store`

### Web — `van-app-web/`
- **Framework** : Next.js 14 (App Router, TypeScript)
- **Cartes** : `react-leaflet` + `leaflet` (OpenStreetMap, sans cle API)
- **Graphiques** : `Chart.js` via `react-chartjs-2` (import dynamique)
- **Style** : Tailwind CSS
- **Import dynamique** : `next/dynamic` avec `ssr: false` pour Leaflet

---

## Installation locale

### Prerequis
- PHP >= 8.2, Composer
- Node.js >= 20, npm
- Expo CLI (`npm install -g expo-cli`)

### Backend

```bash
cd van-app-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

### Web

```bash
cd van-app-web
npm install
cp .env.example .env.local   # Ajouter NEXT_PUBLIC_API_URL
npm run dev
```

### Mobile

```bash
cd van-app-mobile
npm install
# Renseigner l'URL de l'API dans .env
npx expo start --android
```

---

## Lancement rapide avec Docker

La commande suivante démarre automatiquement MySQL, le backend Laravel et l'interface web Next.js :

```bash
docker compose up --build
```

| Service  | URL                       |
|----------|---------------------------|
| Backend  | http://localhost:8000/api |
| Web      | http://localhost:3000     |
| MySQL    | localhost:3306            |

> Aucune installation préalable de PHP ou MySQL requise — tout est conteneurisé.

## Deploiement

| Composant | Service  | Commande                                          |
|-----------|----------|---------------------------------------------------|
| Backend   | Railway  | Push Git (auto-deploy)                            |
| Web       | Vercel   | Push Git (auto-deploy)                            |
| Mobile    | EAS Build| `npx eas-cli build -p android --profile preview`  |

Les mises a jour JavaScript uniquement (sans modules natifs) peuvent etre publiees via :

```bash
eas update
```

> Les modules natifs (GPS arriere-plan, Google Maps) necessitent un rebuild complet de l'APK.

---

## Variables d'environnement

### Backend (`.env`)

| Variable       | Description                        |
|----------------|------------------------------------|
| `DB_*`         | Connexion MySQL                    |
| `APP_KEY`      | Cle d'application Laravel          |
| `APP_URL`      | URL publique de l'API              |

### Web (`.env.local`)

| Variable              | Description              |
|-----------------------|--------------------------|
| `NEXT_PUBLIC_API_URL` | URL de l'API Laravel     |

### Mobile (`.env`)

| Variable   | Description          |
|------------|----------------------|
| `API_URL`  | URL de l'API Laravel |

---

## Tests

```bash
cd van-app-backend
php artisan test
```

Les tests couvrent les routes de gestion des voyages (`TripTest.php`).

---

## Auteur

Baptiste Serste — TFE 2025-2026
