# VanApp — Journal des fonctionnalités

> Fichier de référence pour la rédaction du rapport TFE.  
> Mis à jour au fil du développement.

---

## 🏗️ Architecture générale

| Composant | Technologie | Déploiement |
|---|---|---|
| Backend API | Laravel 12 (PHP) | Railway |
| Frontend Web | Next.js 14 (TypeScript) | Vercel |
| Application Mobile | Expo / React Native (TypeScript) | APK via EAS Build |
| Base de données | MySQL (PlanetScale / Railway) | Railway |

---

## ✅ Fonctionnalités implémentées

### 1. Authentification
- Inscription / Connexion (JWT via Laravel Sanctum)
- Stockage sécurisé du token sur mobile (`expo-secure-store`)
- Redirection automatique si non connecté (web et mobile)

---

### 2. Gestion des voyages

#### Création
- Démarrage d'un voyage depuis l'écran carte (mobile)
- Titre généré automatiquement avec la date (`Voyage du JJ/MM/AAAA`)

#### Liste des voyages
- Affichage de tous les voyages (mobile et web)
- Statut visuel : 🟢 En cours / ✅ Terminé
- Date de début et date de fin

#### Détail d'un voyage
- Vue complète avec carte interactive, statistiques et médias
- Renommage du titre (bouton ✏️, modal)
- Terminer un voyage (bouton 🏁, met à jour le statut en `completed`)
- Suppression d'un voyage (avec confirmation)

---

### 3. Tracking GPS

#### Précision
- Utilisation de `Location.Accuracy.BestForNavigation` (précision maximale)
- Intervalle de mise à jour : toutes les 2 mètres / 1 seconde

#### Enregistrement en avant-plan
- Tracé GPS affiché en temps réel sur la carte (mobile)
- Points envoyés en batch au serveur toutes les 10 secondes

#### Enregistrement en arrière-plan *(nécessite APK natif)*
- Tâche `expo-task-manager` enregistrée au démarrage du module
- `Location.startLocationUpdatesAsync` → continue à enregistrer même écran éteint
- Notification persistante Android : *"🚐 VanApp — Voyage en cours"*
- Points GPS envoyés en batch toutes les 15 secondes depuis la tâche de fond

---

### 4. Statistiques de voyage

Calculées côté client (mobile et web) via la **formule de Haversine** :

| Métrique | Calcul |
|---|---|
| Distance totale (km) | Somme des distances Haversine entre chaque paire de points consécutifs |
| Durée | Différence entre horodatage du 1er et du dernier point GPS |
| Vitesse moyenne (km/h) | Distance ÷ Durée |
| Nombre de photos | Comptage des médias avec `image_path` |
| Nombre de notes | Comptage des médias sans `image_path` mais avec `description` |

> La formule de Haversine tient compte de la courbure de la Terre pour donner une distance précise sur la sphère terrestre.

---

### 5. Photos géolocalisées

- Prise de photo depuis la carte mobile (bouton 📸)
- Upload vers le serveur (stockage Laravel + lien symbolique Railway)
- Affichage sur la carte mobile comme marqueur vert 📸
- Affichage dans la galerie web (sidebar onglet "Médias")
- Affichage sur la carte Leaflet web (popup avec image)

---

### 6. Notes textuelles géolocalisées

- Ajout d'une note depuis la carte mobile (bouton 📝)
- Modal avec champ de texte multilignes
- Sauvegardée avec les coordonnées GPS actuelles
- Affichée sur la carte mobile comme marqueur violet
- Affichée dans la sidebar web (carte violette avec icône 📝)
- Affichée sur la carte Leaflet web (popup avec texte)

---

### 7. Visualisation de voyage (replay)

- Ecran de détail (`TripDetailScreen`) accessible en cliquant sur un voyage
- Carte Google Maps avec tracé (polyline rouge)
- Marqueur de départ 🚀 et d'arrivée 🏁
- Marqueurs pour chaque photo/note prise pendant le voyage
- Zoom automatique pour englober l'intégralité du tracé

---

### 8. Export GPX

- **Mobile** : bouton 📤 dans l'en-tête → dialogue de partage Android (Drive, email, WhatsApp…)
- **Web** : bouton "📤 Export GPX" → téléchargement direct du fichier `.gpx`
- Format GPX 1.1 standard (compatible Google Maps, Komoot, AllTrails, Garmin Connect)
- Chaque point contient : latitude, longitude, horodatage, vitesse

---

### 9. Interface Web (Next.js / Vercel)

#### Tableau de bord global (`/trips`)
- Total voyages, voyages actifs, voyages terminés
- Date du premier voyage
- Indicateur "en cours" animé si voyages actifs
- **Filtres** par statut : 🗂️ Tous / 🟢 En cours / ✅ Terminés (avec compteurs)

#### Détail d'un voyage (`/trips/:id`)
- Carte Leaflet interactive (OpenStreetMap, gratuit, sans clé API)
- Tracé GPS en rouge, marqueur bleu (départ), marqueur rouge (arrivée)
- Marqueurs verts pour les photos/notes (popup avec aperçu)
- Sidebar avec :
  - Bandeau distance totale (Haversine)
  - Durée, vitesse moyenne, nb photos, nb notes
  - Onglet "Tracé GPS" : 10 derniers points enregistrés
  - Onglet "Médias" : galerie photos + cartes notes
- Bouton "📤 Export GPX" dans l'en-tête

#### Page Profil (`/profile`)
- **Onglet Informations** : nom, email, ID, compteur de voyages
- **Onglet Paramètres** : langue & région, format de distance (km/miles), toggles notifications, infos GPS mobile
- **Onglet Sécurité** : statut du compte (Sanctum JWT, expo-secure-store), déconnexion de tous les appareils

---

### 10. Filtres sur la liste de voyages

- **Mobile** (`TripsScreen`) : 3 chips « Tous (N) / 🟢 En cours (N) / ✅ Terminés (N) »
  - Chip actif mis en surbrillance bleu
  - Message d'état vide adapté selon le filtre
- **Web** (`/trips`) : même filtrage avec boutons pills arrondis

---

### 11. Carte mondiale de tous les voyages

- Composant `AllTripsMap.tsx` (Leaflet, import dynamique)
- Accessible depuis le tableau de bord `/trips`
- Affiche **tous les tracés** de tous les voyages simultanément sur une seule carte
- Chaque voyage a une **couleur distincte** (palette de 8 couleurs cycliques)
- Survol d'un tracé → tooltip avec le nom du voyage et le nombre de points GPS
- Zoom automatique pour englober tous les tracés
- Bouton « Réduire / Afficher » pour masquer/afficher la carte
- N'apparaît que si au moins un voyage contient des points GPS

---

### 12. Graphique de vitesse

- Composant `SpeedChart.tsx` (Chart.js `react-chartjs-2`, import dynamique)
- Affiché dans l'onglet "Tracé GPS" de la sidebar de détail d'un voyage
- Graphique `Line` en zone remplie (area chart) — style sombre (fond transparent, ligne indigo)
- **Axe X** : heure de chaque point GPS (format HH:MM)
- **Axe Y** : vitesse en km/h (conversion m/s → km/h)
- Tooltip interactif au survol (vitesse exacte)
- Vitesse maximale affichée en haut à droite du graphique
- Message d'absence si pas assez de données de vitesse

---

## 🔧 Détails techniques notables

### Backend (Laravel)
- API REST protégée par Sanctum (tokens)
- Upload de fichiers → stockage local + lien symbolique `/storage`
- Route `/storage-link` pour réactiver le lien symbolique sur Railway
- Modèles : `User`, `Trip`, `LocationPoint`, `Media`

### Mobile (Expo)
- Navigation : `@react-navigation/native-stack`
- Cartes : `react-native-maps` (Google Maps SDK)
- Localisation : `expo-location` (foreground + background)
- Tâches de fond : `expo-task-manager`
- Fichiers & partage : `expo-file-system` + `expo-sharing`
- Stockage token : `expo-secure-store`

### Web (Next.js)
- Cartes : `react-leaflet` + `leaflet` (OpenStreetMap)
- Import dynamique (`next/dynamic`, `ssr: false`) pour Leaflet
- Tailwind CSS pour le style

---

## 📱 Déploiement mobile

- Build de production : `npx eas-cli build -p android --profile preview`
- Mises à jour OTA (JS uniquement) : `eas update`
- Les modules natifs (GPS arrière-plan, Google Maps) nécessitent un full rebuild

---

*Dernière mise à jour : 25 mars 2026 (session 3)*
