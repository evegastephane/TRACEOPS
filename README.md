# TRACEOPS

Application web de suivi d’interventions. Les parcours disponibles couvrent la gestion des accès et des sites, avec interface React en français et anglais et backend NestJS/PostgreSQL.

## Tester sur votre ordinateur

Le [guide de démarrage avec Docker](docs/TESTER_EN_LOCAL.md) permet de lancer toute l’application et cinq comptes de démonstration. Aucun Node.js ni PostgreSQL à installer séparément.

```sh
docker compose build
docker compose run --rm setup
docker compose up -d --wait web
```

Conserver les mots de passe affichés par `setup`, puis ouvrir **http://localhost:3000**. Les données restent dans un volume local. Cette initialisation refuse une base déjà remplie.

## Disponible
- Connexion par mot de passe, session en cookie HttpOnly, déconnexion et changement de mot de passe.
- Compte administrateur créé une seule fois par commande locale sécurisée.
- Création des organisations clientes/prestataires par l’administrateur.
- Invitations à usage unique, valables 48 heures, via lien à transmettre manuellement. Aucun courriel n’est envoyé automatiquement.
- Acceptation d’une invitation par un nouveau compte ou un compte existant ; plusieurs organisations par personne.
- Ajout direct d’agents par le responsable prestataire, mot de passe temporaire affiché une seule fois et changement obligatoire.
- Consultation des membres dans le périmètre autorisé et historique des actions d’accès.
- Rubrique Sites et salles : création des sites et lieux, rattachement hiérarchique, recherche et consultation selon les habilitations.
- Motif obligatoire et audité pour les écritures administratives sur les sites et lieux.
- Appels d’offres : formulaires propres à chaque type de prestation (bibliothèque de 8 modèles — nettoyage, maintenance, froid, gardiennage, 3D, espaces verts, déchets, modèle général), modèles du client, extraction des rubriques d’un ancien dossier collé en texte ; rédaction du cahier des charges, du bordereau de réponse, des critères d’attribution pondérés et des critères qualité ; consultation des prestataires, offres scellées jusqu’à la clôture, saisie d’une offre reçue sur papier, additifs motivés, édition du dossier en PDF.
- Comparaison des offres : montant, délai, contenu, points forts et réponses au bordereau côte à côte ; note pondérée sur 10 (prix et délai calculés, autres critères notés par la commission avec justification), moins-disant et mieux-disant, présélection, écartement motivé, attribution à un ou plusieurs prestataires.
- Contrats : suivi du coût, du délai et de la qualité ; échéancier de prestations acceptées ou rejetées (avec motif) ; évaluations qualité de 1 à 10 par critère, justifiées, par le technicien interne ; bilan des engagements initiaux face aux résultats, figé à la clôture.
- Règlements : une prestation acceptée devient payable après le délai de règlement (30 jours par défaut, aussi pour les maintenances sur devis accepté) ; statut de la prestation (acceptée, rejetée) distinct de celui du paiement (en attente, réglé) ; alertes d’échéance à 7 jours et de retard, dans le menu et sur la page.
- Un prestataire n’intervient chez un client qu’après un appel d’offres : chaque invité indique s’il participe ou décline (avec motif, visible du client) ; le contrat attribué reste « à accepter » tant que le prestataire ne l’a pas accepté, et seul cet accord le rattache au site. S’il refuse, l’appel d’offres revient en analyse pour retenir une autre offre. Pour un prestataire sans compte (offre reçue sur papier), le responsable client enregistre sa réponse écrite avec sa référence. L’administrateur garde une exception motivée et auditée.
- Planning en trois vues : semaine, Gantt (appels d’offres, contrats et prestations prévues, programmes, maintenances, zoom semaines / mois / trimestre, vue tableau) et disponibilités. Import des anciens plannings Gantt : MS Project enregistré en XML, GanttProject (.gan), CSV exporté d’Excel ou de MS Project, ou lignes collées depuis un tableur ; le fichier est lu dans le navigateur, avec aperçu avant import, et peut être rattaché à un contrat pour être vu des deux parties.
- Disponibilités d’un prestataire heure par heure (6 h – 22 h) : agents libres, en partie occupés ou complets, calculés sur ses missions chez tous ses clients et sur les absences déclarées ; le client voit des nombres, jamais les autres clients. Accessible depuis le planning et depuis la fiche du prestataire.
- Présences par QR code : le client crée un point de pointage par site ou par lieu et imprime l’affiche (PDF) ; l’agent scanne avec l’appareil photo de son téléphone, se connecte, puis touche « J’arrive », « Je pars » ou « Je suis absent » (motif obligatoire). Le pointage est daté par le serveur, rattaché à la mission du jour et visible aussitôt du client et du responsable prestataire (registre avec retards, absences, heures pointées) ; l’agent retrouve tout ce qu’il a envoyé dans « Pointage ». Les liens des QR codes utilisent `PUBLIC_URL` (sinon `APP_ORIGIN`) : pour les téléphones, cette adresse doit être joignable depuis le réseau des agents, pas `localhost`.

Notifications opérationnelles (courriel, SMS) et lecture des fichiers .mpp binaires de MS Project (à enregistrer en XML) restent à développer.

## Démarrer en local
Prérequis : Node.js 24, npm et PostgreSQL 17 accessible.

```sh
npm ci
cp .env.example .env
# Modifier DATABASE_URL avec les paramètres de votre base dédiée.
npm run build
npm run db:migrate
```

Pour créer votre administrateur, définir ADMIN_LOGIN, ADMIN_NAME et ADMIN_PASSWORD dans votre environnement ou temporairement dans le fichier .env ignoré par Git. Le mot de passe doit compter au moins 8 caractères. Puis :

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

Les 19 tests ont passé avec PostgreSQL 17, dont la préparation des comptes de démonstration et le refus d’initialisation sur une base existante. Le scénario navigateur scripts/ui-smoke.mjs a également passé : administrateur, organisations, invitation, responsable, agent, changement de mot de passe, FR/EN et vérification du débordement mobile. Il exige un serveur local déjà lancé et UI_SMOKE_CREDENTIALS désignant un fichier JSON privé contenant login/password d’un administrateur de test. Utiliser une base jetable : le scénario crée des données de test. CHROMIUM_PATH permet de choisir un Chromium installé.

## Sécurité et limites de ce lot
Les requêtes de mutation nécessitent X-Traceops: request et l’origine autorisée. Les permissions sont vérifiées côté serveur ; le contexte d’organisation fourni par le navigateur n’est pas une autorisation. Les invitations, jetons de session et mots de passe sont conservés sous forme d’empreintes/hachages. Les accès sensibles sont limités en fréquence et audités.

Avant production : HTTPS et NODE_ENV=production, APP_ORIGIN exact, TLS PostgreSQL selon hébergement, sauvegardes/restauration, récupération de compte et MFA administrateur. Le proxy de production et les limites d’accès doivent être configurés sans faire confiance arbitrairement aux en-têtes client. Les tables de limites et sessions nécessitent un nettoyage d’exploitation. Les endpoints de suspension, réinitialisation et révocation d’invitation ne sont pas encore exposés.

Aucun compte ni mot de passe de production n’est fourni. Aucun déploiement de production n’est effectué. Les photos seront conservées dans PostgreSQL selon le cadrage sans S3 ; ce stockage n’est pas encore implémenté.

Voir les [documents du projet](docs/README.md) et le [rapport de validation](docs/VALIDATION_ACCES.md).

## API des sites et salles
La création et la lecture des sites, lieux hiérarchiques, rattachements prestataires et habilitations des contrôleurs sont désormais développées côté API. Voir docs/API_SITES.md. Les écrans de création et consultation des sites et lieux sont disponibles. Les rattachements prestataires et habilitations des contrôleurs restent accessibles uniquement par API. Le contrôle des permissions et le motif des interventions administratives sont testés sur PostgreSQL.

### Vérification navigateur des sites
Sur une base de test et avec un serveur lancé :

```sh
UI_BASE_URL=http://127.0.0.1:3001 UI_SMOKE_CREDENTIALS=/chemin/prive/comptes-test.json node scripts/sites-smoke.mjs
```

Le scénario crée ses organisations de test, vérifie les profils administrateur, responsable client, prestataire et contrôleur, la hiérarchie des lieux, les codes en doublon, la recherche, la reprise après erreur, les langues et les largeurs mobiles. Le fichier privé contient uniquement les clés `login` et `password` de l’administrateur de test ; ne pas le versionner. Les captures emploient uniquement les données synthétiques du scénario.
