# 🏙️ Plateforme de Gestion du Trafic Urbain

> **Mini Projet – Web Services & GraphQL | ING4**
> Plateforme intelligente de supervision des véhicules, détection des incidents et analyse de la circulation urbaine.

[![CI/CD](https://github.com/Syrine0806/WebServiceProject/actions/workflows/ci.yml/badge.svg)](https://github.com/Syrine0806/WebServiceProject/actions)

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Services](#services)
4. [Technologies](#technologies)
5. [Fonctionnalités](#fonctionnalités)
6. [Dashboard Frontend](#dashboard-frontend)
7. [WebSocket Temps Réel](#websocket-temps-réel)
8. [Tests Unitaires](#tests-unitaires)
9. [CI/CD](#cicd)
10. [Démarrage](#démarrage)
11. [Variables d'environnement](#variables-denvironnement)
12. [Requêtes GraphQL](#exemples-de-requêtes-graphql)
13. [Collection Postman](#collection-postman)
14. [Structure du projet](#structure-du-projet)
15. [Équipe](#équipe)

---

## Vue d'ensemble

Application distribuée basée sur une architecture **microservices** avec une **API Gateway GraphQL**. Chaque service est indépendant, possède sa propre base de données PostgreSQL et communique via GraphQL.

**Bonus implémentés :**
- ✅ Docker Compose
- ✅ WebSocket temps réel (GraphQL Subscriptions)
- ✅ Dashboard Frontend React / Next.js
- ✅ Carte Interactive (Leaflet + OpenStreetMap)
- ✅ Tests unitaires (Jest + ts-jest)
- ✅ CI/CD (GitHub Actions)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DASHBOARD  Next.js  :3010                          │
│          (Login · Carte · Véhicules · Trafic · Incidents · Notifs)   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  HTTP / WebSocket
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY  :3000                               │
│           GraphQL Schema Stitching (@graphql-tools/stitch)            │
│                    JWT Verification Middleware                         │
└───┬──────────┬──────────┬──────────┬──────────┬─────────────────────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
  :3001      :3002      :3003      :3004      :3005
  AUTH     VEHICLE    TRAFFIC   INCIDENT  NOTIFICATION
 SERVICE   SERVICE    SERVICE   SERVICE    SERVICE
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
 auth_db  vehicle_db traffic_db incident_db notif_db
 (PG 15)   (PG 15)    (PG 15)    (PG 15)    (PG 15)
```

---

## Services

| Service              | Port | Base de données | Description                                      |
|----------------------|------|-----------------|--------------------------------------------------|
| **Dashboard**        | 3010 | —               | Frontend Next.js — carte, véhicules, incidents   |
| **API Gateway**      | 3000 | —               | Point d'entrée unique, schema stitching GraphQL  |
| **Auth Service**     | 3001 | auth_db         | Inscription, connexion JWT, rôles ADMIN/OPERATOR |
| **Vehicle Service**  | 3002 | vehicle_db      | Gestion des véhicules et positions GPS           |
| **Traffic Service**  | 3003 | traffic_db      | Zones de circulation, densité, congestion        |
| **Incident Service** | 3004 | incident_db     | Déclaration et suivi des incidents (WebSocket)   |
| **Notification Svc** | 3005 | notification_db | Notifications en temps réel (WebSocket)          |

---

## Technologies

| Catégorie         | Technologie                              |
|-------------------|------------------------------------------|
| Backend           | NestJS 10 + TypeScript                   |
| API               | GraphQL (code-first, Apollo Server)      |
| Base de données   | PostgreSQL 15 + TypeORM                  |
| Authentification  | JWT (bcrypt, Passport, @nestjs/jwt)      |
| Temps réel        | GraphQL Subscriptions (`graphql-ws`)     |
| Frontend          | Next.js 14 (App Router) + Tailwind CSS   |
| Carte             | Leaflet.js + React-Leaflet (OpenStreetMap)|
| GraphQL Client    | Apollo Client 3                          |
| Tests             | Jest + ts-jest + @nestjs/testing         |
| Conteneurisation  | Docker + Docker Compose                  |
| CI/CD             | GitHub Actions                           |
| Validation        | class-validator + class-transformer      |

---

## Fonctionnalités

### 1. Service Authentification
- Inscription des utilisateurs (rôle `OPERATOR` par défaut)
- Connexion sécurisée avec JWT (24h d'expiration)
- Génération de token JWT signé
- Gestion des rôles : **ADMIN** (accès complet) / **OPERATOR**
- Mot de passe haché avec bcrypt (10 rounds)

### 2. Service Gestion des Véhicules
- Ajouter un véhicule (plaque, modèle, marque, type)
- Consulter la liste complète des véhicules
- Consulter le détail d'un véhicule par ID
- Enregistrer des positions GPS (latitude, longitude, vitesse)
- Consulter l'historique complet des déplacements

**Types supportés :** `CAR`, `TRUCK`, `MOTORCYCLE`, `BUS`, `EMERGENCY`

### 3. Service Gestion du Trafic
- Créer des zones de circulation géolocalisées (centre + rayon)
- Mesurer la densité : `vehicleCount / (π × radius²)`
- Détecter automatiquement les zones congestionnées
- Classification automatique : **LOW** / **MEDIUM** / **HIGH**

### 4. Service Gestion des Incidents
- Déclarer un incident avec géolocalisation
- Consulter tous les incidents (filtrable par statut)
- Modifier le statut d'un incident
- **WebSocket** : diffusion en temps réel (`incidentDeclared`, `incidentStatusChanged`)

**Types :** `ACCIDENT`, `CONSTRUCTION`, `ROAD_CLOSED`, `TRAFFIC_JAM`
**Statuts :** `REPORTED` → `IN_PROGRESS` → `RESOLVED`

### 5. Service Notifications
- Envoyer une notification à un utilisateur
- Consulter ses propres notifications
- Marquer une ou toutes les notifications comme lues
- **WebSocket** : réception en temps réel (`notificationAdded`)

**Types :** `INCIDENT`, `TRAFFIC`, `SYSTEM`, `ALERT`

---

## Dashboard Frontend

Application Next.js disponible sur **http://localhost:3010**

### Pages disponibles

| Page | URL | Fonctionnalités |
|------|-----|-----------------|
| Login | `/login` | Connexion + Inscription |
| Vue d'ensemble | `/dashboard` | Stats globales en temps réel |
| **Carte Interactive** | `/dashboard/map` | Carte Leaflet avec véhicules, zones, incidents |
| Véhicules | `/dashboard/vehicles` | Liste, ajout, GPS, historique |
| Trafic | `/dashboard/traffic` | Zones, densité, congestion |
| Incidents | `/dashboard/incidents` | Déclaration, suivi, résolution |
| Notifications | `/dashboard/notifications` | Consultation, marquer lue |

### Carte Interactive
- **OpenStreetMap** (gratuit, sans clé API)
- **Véhicules** : marqueurs violets avec type (🚗🚛🚌🏍🚑)
- **Zones de trafic** : cercles colorés (🟢 LOW · 🟡 MEDIUM · 🔴 HIGH)
- **Incidents actifs** : marqueurs avec emoji selon le type
- **Spread automatique** des marqueurs qui se chevauchent
- **Auto-fit** des bounds au chargement initial
- **Actualisation automatique** toutes les 5 secondes
- **Filtres** : afficher/masquer chaque couche indépendamment
- Presets GPS : Av. Bourguiba, La Marsa, Ariana, Ben Arous, Carthage, El Menzah, Bardo, Manouba, Lac Tunis, Ennasr

---

## WebSocket Temps Réel

Les services Incident et Notification supportent les **GraphQL Subscriptions** via `graphql-ws`.

### Souscrire aux nouveaux incidents
```graphql
subscription {
  incidentDeclared {
    id
    type
    status
    description
    latitude
    longitude
  }
}
```

### Souscrire aux changements de statut
```graphql
subscription {
  incidentStatusChanged {
    id
    status
    resolvedAt
  }
}
```

### Souscrire aux nouvelles notifications
```graphql
subscription {
  notificationAdded {
    id
    userId
    message
    type
    isRead
  }
}
```

> Pour tester les subscriptions, ouvrir **deux onglets** dans le playground :
> - Onglet 1 : coller la subscription et cliquer ▶
> - Onglet 2 : déclencher une mutation `declareIncident` ou `sendNotification`
> - L'onglet 1 reçoit l'événement **instantanément**

---

## Tests Unitaires

Tests implémentés avec **Jest + ts-jest + @nestjs/testing** pour 3 services.

```bash
# Auth Service (9 tests)
cd auth-service && npm test

# Vehicle Service (7 tests)
cd vehicle-service && npm test

# Incident Service (6 tests)
cd incident-service && npm test
```

### Couverture des tests

| Service | Tests | Scénarios couverts |
|---------|-------|--------------------|
| Auth | 9 | register (succès + email dupliqué), login (succès + mauvais mot de passe + user introuvable), findById, findAll |
| Vehicle | 7 | create (succès + plaque dupliquée), findOne (succès + not found), recordPosition, getHistory |
| Incident | 6 | declare, findAll (avec/sans filtre), updateStatus (IN_PROGRESS + RESOLVED + not found) |

---

## CI/CD

Pipeline **GitHub Actions** déclenché à chaque push sur `main` ou `develop`.

### Étapes

```
Push → Test Auth ─┐
      Test Vehicle ├──→ Build Docker Images ✓
      Test Incident┘
```

### Fichier : `.github/workflows/ci.yml`

- **Test Auth Service** : install → build → jest
- **Test Vehicle Service** : install → build → jest
- **Test Incident Service** : install → build → jest
- **Build Docker Images** : `docker compose build --parallel` (après que tous les tests passent)

---

## Démarrage

### Avec Docker (Recommandé)

```bash
# Cloner le projet
git clone https://github.com/Syrine0806/WebServiceProject.git
cd WebServiceProject

# Démarrer Colima (Mac uniquement)
colima start --cpu 4 --memory 8

# Construire et démarrer tous les services
docker-compose up --build -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

**URLs disponibles après démarrage :**

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3010 |
| API Gateway (GraphQL) | http://localhost:3000/graphql |
| Auth Service | http://localhost:3001/graphql |
| Vehicle Service | http://localhost:3002/graphql |
| Traffic Service | http://localhost:3003/graphql |
| Incident Service | http://localhost:3004/graphql |
| Notification Service | http://localhost:3005/graphql |

### Sans Docker (Développement local)

**1. Créer les bases de données PostgreSQL :**
```sql
CREATE DATABASE auth_db;
CREATE DATABASE vehicle_db;
CREATE DATABASE traffic_db;
CREATE DATABASE incident_db;
CREATE DATABASE notification_db;
```

**2. Configurer les variables d'environnement :**
```bash
cp auth-service/.env.example auth-service/.env
# Répéter pour chaque service et éditer les valeurs
```

**3. Installer toutes les dépendances :**
```bash
npm run install:all
```

**4. Démarrer les services (terminaux séparés — gateway EN DERNIER) :**
```bash
npm run start:auth        # Terminal 1
npm run start:vehicle     # Terminal 2
npm run start:traffic     # Terminal 3
npm run start:incident    # Terminal 4
npm run start:notification # Terminal 5
npm run start:gateway     # Terminal 6 (après que les autres soient prêts)
```

**5. Démarrer le dashboard :**
```bash
cd dashboard && npm install && npm run dev
```

---

## Variables d'environnement

| Variable          | Description                  | Valeur par défaut         |
|-------------------|------------------------------|---------------------------|
| `PORT`            | Port du service              | Selon le service          |
| `NODE_ENV`        | Environnement                | `development`             |
| `DB_HOST`         | Hôte PostgreSQL              | `localhost`               |
| `DB_PORT`         | Port PostgreSQL              | `5432`                    |
| `DB_USERNAME`     | Utilisateur PostgreSQL       | `postgres`                |
| `DB_PASSWORD`     | Mot de passe PostgreSQL      | `postgres`                |
| `DB_NAME`         | Nom de la base de données    | Selon le service          |
| `JWT_SECRET`      | Clé secrète JWT              | **Obligatoire en prod**   |
| `JWT_EXPIRES_IN`  | Durée de validité du token   | `24h`                     |
| `ALLOWED_ORIGINS` | Origines CORS autorisées     | (désactivé en prod)       |

> ⚠️ En production, `JWT_SECRET` est **obligatoire** — le service refusera de démarrer sans lui.
> `synchronize` TypeORM et `playground` GraphQL sont désactivés automatiquement en production.

---

## Exemples de Requêtes GraphQL

> Toutes les requêtes (sauf `register` et `login`) nécessitent :
> ```json
> { "Authorization": "Bearer <token>" }
> ```

### Service Authentification (`:3001`)

#### S'inscrire
```graphql
mutation {
  register(input: {
    email: "operateur@traffic.com"
    password: "Password1"
    firstName: "Operateur"
    lastName: "Tunis"
  }) {
    accessToken
    user { id email role }
  }
}
```
> Le mot de passe doit contenir au minimum 8 caractères, une majuscule et un chiffre.
> Le rôle est toujours `OPERATOR` à l'inscription — seul un admin peut élever les droits.

#### Se connecter
```graphql
mutation {
  login(input: {
    email: "operateur@traffic.com"
    password: "Password1"
  }) {
    accessToken
    user { id email role firstName }
  }
}
```

#### Profil utilisateur
```graphql
query {
  me { id email role firstName lastName createdAt }
}
```

---

### Service Véhicules (`:3002`)

#### Ajouter un véhicule
```graphql
mutation {
  addVehicle(input: {
    licensePlate: "TN-123-456"
    model: "Corolla"
    brand: "Toyota"
    type: CAR
  }) {
    id licensePlate model status createdAt
  }
}
```

#### Liste des véhicules
```graphql
query {
  vehicles { id licensePlate model brand type status }
}
```

#### Détail d'un véhicule
```graphql
query {
  vehicle(id: "<vehicle-id>") {
    id licensePlate model brand type status createdAt
  }
}
```

#### Enregistrer une position GPS
```graphql
mutation {
  recordGpsPosition(input: {
    vehicleId: "<vehicle-id>"
    latitude: 36.7988
    longitude: 10.1806
    speed: 60
  }) {
    id vehicleId latitude longitude speed timestamp
  }
}
```

#### Historique des déplacements
```graphql
query {
  vehicleHistory(vehicleId: "<vehicle-id>") {
    id latitude longitude speed timestamp
  }
}
```

---

### Service Trafic (`:3003`)

#### Créer une zone de circulation
```graphql
mutation {
  createTrafficZone(input: {
    name: "Avenue Bourguiba"
    description: "Zone haute densité centre-ville"
    latitude: 36.7988
    longitude: 10.1806
    radius: 500
  }) {
    id name congestionLevel density vehicleCount
  }
}
```

#### Mettre à jour la densité
```graphql
mutation {
  updateTrafficDensity(input: {
    zoneId: "<zone-id>"
    vehicleCount: 150
  }) {
    id name vehicleCount density congestionLevel
  }
}
```

#### Toutes les zones
```graphql
query {
  trafficZones {
    id name latitude longitude radius vehicleCount density congestionLevel
  }
}
```

#### Zones congestionnées (HIGH)
```graphql
query {
  congestedZones { id name vehicleCount density congestionLevel }
}
```

---

### Service Incidents (`:3004`)

#### Déclarer un incident
```graphql
mutation {
  declareIncident(input: {
    type: ACCIDENT
    description: "Collision avenue Bourguiba"
    latitude: 36.7988
    longitude: 10.1806
  }) {
    id type status description createdAt
  }
}
```

#### Consulter tous les incidents
```graphql
query {
  incidents { id type status description latitude longitude createdAt }
}
```

#### Filtrer par statut
```graphql
query {
  incidents(status: REPORTED) { id type description status }
}
```

#### Modifier le statut
```graphql
mutation {
  updateIncidentStatus(input: {
    incidentId: "<incident-id>"
    status: RESOLVED
  }) {
    id status resolvedAt updatedAt
  }
}
```

#### S'abonner aux incidents en temps réel
```graphql
subscription {
  incidentDeclared { id type status description latitude longitude }
}
```

---

### Service Notifications (`:3005`)

#### Envoyer une notification
```graphql
mutation {
  sendNotification(input: {
    userId: "<user-id>"
    message: "Accident signalé avenue Bourguiba"
    type: INCIDENT
    referenceId: "<incident-id>"
  }) {
    id userId message type isRead createdAt
  }
}
```

#### Mes notifications
```graphql
query {
  myNotifications(userId: "<user-id>") {
    id message type isRead createdAt
  }
}
```

#### Marquer comme lue
```graphql
mutation {
  markNotificationAsRead(id: "<notif-id>") { id isRead }
}
```

#### Marquer toutes comme lues
```graphql
mutation {
  markAllNotificationsAsRead(userId: "<user-id>")
}
```

#### S'abonner aux notifications en temps réel
```graphql
subscription {
  notificationAdded { id userId message type isRead createdAt }
}
```

---

## Collection Postman

Le fichier `postman_collection.json` est inclus à la racine du projet.

**Import :** Postman → Import → sélectionner `postman_collection.json`

**24 requêtes pré-configurées** dans 5 dossiers :
- Auth (4) : Register, Login, Me, Users
- Vehicles (5) : Add, List, Get, Record GPS, History
- Traffic (5) : Create Zone, List, Get, Update Density, Congested Zones
- Incidents (5) : Declare, All, By Status, Get, Update Status
- Notifications (5) : Send, All, My Notifications, Mark Read, Mark All Read

> ⚡ La requête **Login** sauvegarde automatiquement le token dans `{{token}}` — toutes les autres requêtes l'utilisent automatiquement.

---

## Structure du Projet

```
WebServiceProject/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD GitHub Actions
├── api-gateway/                # Gateway GraphQL (schema stitching)
│   ├── src/
│   │   ├── gateway/
│   │   │   ├── gateway.service.ts  # Stitch 5 subgraphs
│   │   │   └── gateway.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── auth-service/               # Service Authentification
│   ├── src/
│   │   ├── auth/
│   │   │   ├── dto/            # RegisterInput, LoginInput, AuthResponse
│   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   ├── strategies/     # JwtStrategy (Passport)
│   │   │   ├── decorators/     # @CurrentUser
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.resolver.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.service.spec.ts  # 9 tests
│   │   └── users/
│   │       └── user.entity.ts
│   ├── Dockerfile
│   └── package.json
├── vehicle-service/            # Service Véhicules
│   ├── src/
│   │   ├── vehicles/
│   │   │   ├── dto/
│   │   │   ├── vehicle.entity.ts
│   │   │   ├── gps-position.entity.ts
│   │   │   ├── vehicles.resolver.ts
│   │   │   ├── vehicles.service.ts
│   │   │   └── vehicles.service.spec.ts  # 7 tests
│   │   └── auth/
│   │       └── jwt-auth.guard.ts
│   └── ...
├── traffic-service/            # Service Trafic
│   ├── src/
│   │   └── traffic/
│   │       ├── traffic-zone.entity.ts
│   │       ├── traffic.resolver.ts
│   │       └── traffic.service.ts
│   └── ...
├── incident-service/           # Service Incidents + WebSocket
│   ├── src/
│   │   └── incidents/
│   │       ├── incident.entity.ts
│   │       ├── incidents.resolver.ts  # Subscriptions
│   │       ├── incidents.service.ts
│   │       ├── incidents.service.spec.ts  # 6 tests
│   │       └── pub-sub.provider.ts
│   └── ...
├── notification-service/       # Service Notifications + WebSocket
│   ├── src/
│   │   └── notifications/
│   │       ├── notification.entity.ts
│   │       ├── notifications.resolver.ts  # Subscriptions
│   │       ├── notifications.service.ts
│   │       └── pub-sub.provider.ts
│   └── ...
├── dashboard/                  # Frontend Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/          # Page connexion/inscription
│   │   │   └── dashboard/
│   │   │       ├── page.tsx         # Vue d'ensemble (stats)
│   │   │       ├── map/             # Carte Interactive Leaflet
│   │   │       ├── vehicles/        # Gestion véhicules + GPS
│   │   │       ├── traffic/         # Zones de trafic
│   │   │       ├── incidents/       # Incidents
│   │   │       └── notifications/   # Notifications
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx
│   │   │   └── map/MapComponent.tsx  # Leaflet (SSR disabled)
│   │   └── lib/
│   │       └── apollo-client.ts     # 5 Apollo clients
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # 7 services + 5 PostgreSQL
├── package.json                # Scripts racine
├── postman_collection.json     # 24 requêtes pré-configurées
└── README.md
```

---

## Énumérations

| Enum | Valeurs |
|------|---------|
| **Role** | `ADMIN`, `OPERATOR` |
| **VehicleType** | `CAR`, `TRUCK`, `MOTORCYCLE`, `BUS`, `EMERGENCY` |
| **VehicleStatus** | `ACTIVE`, `INACTIVE`, `MAINTENANCE` |
| **CongestionLevel** | `LOW`, `MEDIUM`, `HIGH` |
| **IncidentType** | `ACCIDENT`, `CONSTRUCTION`, `ROAD_CLOSED`, `TRAFFIC_JAM` |
| **IncidentStatus** | `REPORTED`, `IN_PROGRESS`, `RESOLVED` |
| **NotificationType** | `INCIDENT`, `TRAFFIC`, `SYSTEM`, `ALERT` |

---

## Sécurité

- **JWT obligatoire** sur toutes les routes (sauf `register` et `login`)
- **Rôle fixé à OPERATOR** à l'inscription — impossible de s'auto-attribuer ADMIN
- **JWT_SECRET** : erreur de démarrage si absent en production (`getOrThrow`)
- **Bcrypt** (10 rounds) pour le hachage des mots de passe
- **Playground/Introspection** désactivés automatiquement en `NODE_ENV=production`
- **synchronize: false** en production (migrations TypeORM requises)
- **CORS** restreint via variable `ALLOWED_ORIGINS`
- **Validation** : `@IsUUID`, `@Min/@Max` sur lat/lng, `@Matches` complexité mot de passe

---

