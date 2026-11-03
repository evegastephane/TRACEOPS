# TRACEOPS

Plateforme de suivi des interventions. Voir le [dossier de conception](docs/README.md).

## Premier lot : backend NestJS

Prérequis : Node.js 24, npm et PostgreSQL pour la sonde readiness.

```sh
npm ci
cp .env.example .env
# Configurer DATABASE_URL dans .env.
npm test
npm run build
npm start
```

- GET /api/v1/health/live : processus actif.
- GET /api/v1/health/ready : PostgreSQL joignable, sinon 503.

La politique métier couvre les rôles, transitions et chevauchements. Elle reçoit un contexte qui devra provenir de l'authentification serveur, jamais du corps d'une requête. Aucun endpoint métier n'est encore exposé.

## Validation

11 tests : configuration, politique métier et test HTTP de dégradation sans PostgreSQL. Une instance réelle est encore nécessaire pour tester la readiness positive et les futures transactions. Le schéma métier, l'authentification, les photos, la récurrence, le QR, les PDF et le frontend restent à développer.

Ne pas versionner .env. Aucun compte par défaut ou secret de production n'est fourni. Le stockage des photos dans PostgreSQL est décrit dans ADR-006 ; il n'est pas implémenté dans ce lot.
