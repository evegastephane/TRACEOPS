# TRACEOPS

Application web de suivi d’interventions. Ce premier parcours implémente la gestion des accès, avec interface React en français et anglais et backend NestJS/PostgreSQL.

## Disponible
- Connexion par mot de passe, session en cookie HttpOnly, déconnexion et changement de mot de passe.
- Compte administrateur créé une seule fois par commande locale sécurisée.
- Création des organisations clientes/prestataires par l’administrateur.
- Invitations à usage unique, valables 48 heures, via lien à transmettre manuellement. Aucun courriel n’est envoyé automatiquement.
- Acceptation d’une invitation par un nouveau compte ou un compte existant ; plusieurs organisations par personne.
- Ajout direct d’agents par le responsable prestataire, mot de passe temporaire affiché une seule fois et changement obligatoire.
- Consultation des membres dans le périmètre autorisé et historique des actions d’accès.

Les sites/salles possèdent leur schéma de base, mais pas encore leurs écrans. Interventions persistantes, photos, QR, récurrence, PDF, notifications opérationnelles et traitement des anomalies restent à développer. La politique des interventions est testée mais n’est pas encore exposée par API.

## Démarrer en local
Prérequis : Node.js 24, npm et PostgreSQL 17 accessible.

```sh
npm ci
cp .env.example .env
# Modifier DATABASE_URL avec les paramètres de votre base dédiée.
npm run build
npm run db:migrate
```

Pour créer votre administrateur, définir ADMIN_LOGIN, ADMIN_NAME et ADMIN_PASSWORD dans votre environnement ou temporairement dans le fichier .env ignoré par Git. Le mot de passe doit compter au moins 12 caractères. Puis :

```sh
npm run admin:bootstrap
```

Retirer ensuite ADMIN_PASSWORD du fichier .env. La commande refuse de créer un deuxième administrateur ; elle n’affiche pas les identifiants.

Pour utiliser la version construite :

```sh
npm run build:web
npm start
```

Ouvrir http://localhost:3000 ; APP_ORIGIN doit correspondre exactement à l’origine utilisée. Pour le développement avec Vite, lancer npm run dev:web et définir APP_ORIGIN=http://localhost:5173 avant de démarrer le backend. Vite transmet /api au backend.

## Vérifications
- npm test : compilation, tests de règles, mots de passe, configuration, SQL embarqué et HTTP.
- TEST_DATABASE_URL=… npm test : ajoute le parcours complet sur un vrai PostgreSQL ; crée puis supprime un schéma de test isolé.
- npm run build:web : vérification TypeScript et build React.
- npm run db:migrate : migrations transactionnelles, verrouillées et vérifiées par empreinte ; un second passage n’applique pas deux fois les migrations.

Les 16 tests ont passé avec PostgreSQL 17. Le scénario navigateur scripts/ui-smoke.mjs a également passé : administrateur, organisations, invitation, responsable, agent, changement de mot de passe, FR/EN et vérification du débordement mobile. Il exige un serveur local déjà lancé et UI_SMOKE_CREDENTIALS désignant un fichier JSON privé contenant login/password d’un administrateur de test. Utiliser une base jetable : le scénario crée des données de test. CHROMIUM_PATH permet de choisir un Chromium installé.

## Sécurité et limites de ce lot
Les requêtes de mutation nécessitent X-Traceops: request et l’origine autorisée. Les permissions sont vérifiées côté serveur ; le contexte d’organisation fourni par le navigateur n’est pas une autorisation. Les invitations, jetons de session et mots de passe sont conservés sous forme d’empreintes/hachages. Les accès sensibles sont limités en fréquence et audités.

Avant production : HTTPS et NODE_ENV=production, APP_ORIGIN exact, TLS PostgreSQL selon hébergement, sauvegardes/restauration, récupération de compte et MFA administrateur. Le proxy de production et les limites d’accès doivent être configurés sans faire confiance arbitrairement aux en-têtes client. Les tables de limites et sessions nécessitent un nettoyage d’exploitation. Les endpoints de suspension, réinitialisation et révocation d’invitation ne sont pas encore exposés.

Aucun compte ni mot de passe de production n’est fourni. Aucun déploiement de production n’est effectué. Les photos seront conservées dans PostgreSQL selon le cadrage sans S3 ; ce stockage n’est pas encore implémenté.

Voir les [documents du projet](docs/README.md) et le [rapport de validation](docs/VALIDATION_ACCES.md).

## API des sites et salles
La création et la lecture des sites, lieux hiérarchiques, rattachements prestataires et habilitations des contrôleurs sont désormais développées côté API. Voir docs/API_SITES.md. Les écrans correspondants ne sont pas encore implémentés. Le contrôle des permissions et le motif des interventions administratives sont testés sur PostgreSQL.
