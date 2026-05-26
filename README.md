# Plateforme de Gestion du Trafic Urbain

> Mini Projet – Web Services & GraphQL | ING4

Plateforme intelligente de supervision des véhicules, détection des incidents et analyse de la circulation urbaine, basée sur une architecture microservices avec API Gateway GraphQL.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT / FRONTEND                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │  GraphQL
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API GATEWAY  :3000                             │
│              (Schema Stitching GraphQL)                          │
│                JWT Verification Middleware                        │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
:3001      :3002      :3003      :3004      :3005
AUTH      VEHICLE   TRAFFIC   INCIDENT  NOTIFICATION
SERVICE   SERVICE   SERVICE   SERVICE    SERVICE
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
auth_db  vehicle_db traffic_db incident_db notif_db
(PG)      (PG)       (PG)       (PG)        (PG)
```

---

## Services

| Service              | Port | Description                                      |
|----------------------|------|--------------------------------------------------|
| API Gateway          | 3000 | Point d'entrée unique – schema stitching GraphQL |
| Auth Service         | 3001 | Authentification JWT, gestion des rôles          |
| Vehicle Service      | 3002 | Gestion des véhicules et positions GPS           |
| Traffic Service      | 3003 | Zones de circulation, densité, congestion        |
| Incident Service     | 3004 | Déclaration et suivi des incidents               |
| Notification Service | 3005 | Envoi et consultation des notifications          |

---

## Technologies

- **Backend** : NestJS (TypeScript)
- **API** : GraphQL (code-first avec Apollo)
- **Base de données** : PostgreSQL + TypeORM
- **Authentification** : JWT (JSON Web Token)
- **Conteneurisation** : Docker + Docker Compose
- **Validation** : class-validator / class-transformer

---

## Prérequis

- Node.js 20+
- npm 9+
- Docker & Docker Compose (pour le démarrage conteneurisé)
- PostgreSQL 15 (pour le démarrage local)

---

## Démarrage

### Avec Docker (Recommandé)

```bash
# Cloner le projet
git clone <url-du-repo>
cd WebServiceProject

# Construire et démarrer tous les services
docker-compose up --build -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

Les playgrounds GraphQL seront disponibles à :
- **Gateway** : http://localhost:3000/graphql
- **Auth** : http://localhost:3001/graphql
- **Vehicle** : http://localhost:3002/graphql
- **Traffic** : http://localhost:3003/graphql
- **Incident** : http://localhost:3004/graphql
- **Notification** : http://localhost:3005/graphql

### Sans Docker (Développement local)

1. **Créer les bases de données PostgreSQL** :
```sql
CREATE DATABASE auth_db;
CREATE DATABASE vehicle_db;
CREATE DATABASE traffic_db;
CREATE DATABASE incident_db;
CREATE DATABASE notification_db;
```

2. **Configurer les variables d'environnement** dans chaque `.env` :
```bash
cp auth-service/.env.example auth-service/.env
# Répéter pour chaque service
```

3. **Installer les dépendances** :
```bash
npm run install:all
```

4. **Démarrer chaque service** (dans des terminaux séparés) :
```bash
npm run start:auth
npm run start:vehicle
npm run start:traffic
npm run start:incident
npm run start:notification
npm run start:gateway
```

---

## Variables d'environnement

| Variable         | Description                | Défaut                |
|-----------------|----------------------------|-----------------------|
| `PORT`          | Port du service            | Selon le service      |
| `DB_HOST`       | Hôte PostgreSQL            | `localhost`           |
| `DB_PORT`       | Port PostgreSQL            | `5432`                |
| `DB_USERNAME`   | Utilisateur PostgreSQL     | `postgres`            |
| `DB_PASSWORD`   | Mot de passe PostgreSQL    | `postgres`            |
| `DB_NAME`       | Nom de la base             | Selon le service      |
| `JWT_SECRET`    | Clé secrète JWT            | `traffic_jwt_secret_2024` |
| `JWT_EXPIRES_IN`| Durée de validité du token | `24h`                 |

---

## Exemples de Requêtes GraphQL

> Toutes les requêtes (sauf register/login) nécessitent le header :
> `Authorization: Bearer <token>`

### Service Authentification

#### Inscription
```graphql
mutation {
  register(input: {
    email: "admin@traffic.com"
    password: "password123"
    firstName: "Admin"
    lastName: "User"
    role: ADMIN
  }) {
    accessToken
    user {
      id
      email
      role
    }
  }
}
```

#### Connexion
```graphql
mutation {
  login(input: {
    email: "admin@traffic.com"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
      role
    }
  }
}
```

#### Profil utilisateur connecté
```graphql
query {
  me {
    id
    email
    role
    firstName
    lastName
    createdAt
  }
}
```

---

### Service Véhicules

#### Ajouter un véhicule
```graphql
mutation {
  addVehicle(input: {
    licensePlate: "TN-123-456"
    model: "Corolla"
    brand: "Toyota"
    type: CAR
  }) {
    id
    licensePlate
    model
    status
    createdAt
  }
}
```

#### Liste des véhicules
```graphql
query {
  vehicles {
    id
    licensePlate
    model
    brand
    type
    status
  }
}
```

#### Enregistrer une position GPS
```graphql
mutation {
  recordGpsPosition(input: {
    vehicleId: "<vehicle-id>"
    latitude: 36.8065
    longitude: 10.1815
    speed: 60
  }) {
    id
    vehicleId
    latitude
    longitude
    speed
    timestamp
  }
}
```

#### Historique des déplacements
```graphql
query {
  vehicleHistory(vehicleId: "<vehicle-id>") {
    id
    latitude
    longitude
    speed
    timestamp
  }
}
```

---

### Service Trafic

#### Créer une zone de circulation
```graphql
mutation {
  createTrafficZone(input: {
    name: "Centre-Ville Tunis"
    description: "Zone haute densité"
    latitude: 36.8065
    longitude: 10.1815
    radius: 500
  }) {
    id
    name
    congestionLevel
    density
    vehicleCount
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
    id
    name
    vehicleCount
    density
    congestionLevel
  }
}
```

#### Zones congestionnées
```graphql
query {
  congestedZones {
    id
    name
    congestionLevel
    vehicleCount
    density
  }
}
```

---

### Service Incidents

#### Déclarer un incident
```graphql
mutation {
  declareIncident(input: {
    type: ACCIDENT
    description: "Collision entre deux véhicules à l'intersection"
    latitude: 36.8065
    longitude: 10.1815
    reportedBy: "<user-id>"
  }) {
    id
    type
    status
    description
    createdAt
  }
}
```

#### Consulter les incidents
```graphql
query {
  incidents {
    id
    type
    status
    description
    latitude
    longitude
    createdAt
  }
}
```

#### Filtrer par statut
```graphql
query {
  incidents(status: REPORTED) {
    id
    type
    description
    status
  }
}
```

#### Modifier le statut
```graphql
mutation {
  updateIncidentStatus(input: {
    incidentId: "<incident-id>"
    status: IN_PROGRESS
  }) {
    id
    status
    updatedAt
  }
}
```

---

### Service Notifications

#### Envoyer une notification
```graphql
mutation {
  sendNotification(input: {
    userId: "<user-id>"
    message: "Accident signalé sur la route principale"
    type: INCIDENT
    referenceId: "<incident-id>"
  }) {
    id
    userId
    message
    type
    isRead
    createdAt
  }
}
```

#### Mes notifications
```graphql
query {
  myNotifications(userId: "<user-id>") {
    id
    message
    type
    isRead
    createdAt
  }
}
```

#### Marquer comme lue
```graphql
mutation {
  markNotificationAsRead(id: "<notification-id>") {
    id
    isRead
  }
}
```

---

## Structure du Projet

```
WebServiceProject/
├── api-gateway/                # Gateway GraphQL (schema stitching)
│   ├── src/
│   │   ├── gateway/
│   │   │   ├── gateway.service.ts
│   │   │   └── gateway.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── auth-service/               # Service Authentification
│   ├── src/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── decorators/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.resolver.ts
│   │   │   └── auth.service.ts
│   │   └── users/
│   │       └── user.entity.ts
│   ├── Dockerfile
│   └── package.json
├── vehicle-service/            # Service Véhicules
├── traffic-service/            # Service Trafic
├── incident-service/           # Service Incidents
├── notification-service/       # Service Notifications
├── docker-compose.yml          # Orchestration Docker
└── README.md
```

---

## Énumérations

### Rôles utilisateurs
- `ADMIN` — Accès complet
- `OPERATOR` — Accès opérateur

### Types de véhicules
- `CAR`, `TRUCK`, `MOTORCYCLE`, `BUS`, `EMERGENCY`

### Niveaux de congestion
- `LOW` — Faible
- `MEDIUM` — Moyen
- `HIGH` — Élevé

### Types d'incidents
- `ACCIDENT` — Accident
- `CONSTRUCTION` — Travaux
- `ROAD_CLOSED` — Route fermée
- `TRAFFIC_JAM` — Embouteillage

### Statuts d'incidents
- `REPORTED` — Signalé
- `IN_PROGRESS` — En cours
- `RESOLVED` — Résolu

### Types de notifications
- `INCIDENT`, `TRAFFIC`, `SYSTEM`, `ALERT`
