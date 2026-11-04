# Prototype interactif TRACEOPS

Prototype de conception en français, séparé de l’application métier. Aucune connexion à PostgreSQL, aucun compte réel et aucune authentification : le sélecteur de rôle est un outil d’essai. Les états restent en mémoire de page et disparaissent à la fermeture ou au rechargement. Ne saisir que des données fictives.

## Ouvrir

Depuis le dossier TRACEOPS, sous Windows :

```cmd
git fetch origin
git switch feat/backend-foundation
git pull --ff-only
start docs\ux\prototype.html
```

Ou reconstruire l’application avec `docker compose up -d --build --wait web`, puis ouvrir **http://localhost:3000/prototype.html**. Le lancement direct ne demande ni Docker ni mot de passe. Si le navigateur d’entreprise interdit les fichiers locaux, utiliser la version servie par l’application.

## Essai conseillé

1. Client : créer une intervention, choisir sa salle et son créneau, définir les tâches, relire puis transmettre.
2. Prestataire : ouvrir l’intervention et affecter Agent A, éventuellement avec Agent C. Agent B a une indisponibilité simulée le 5 novembre 2026 de 09:30 à 10:30. Les conflits entre interventions de l’essai sont également contrôlés.
3. Agent responsable : ouvrir la mission, démarrer, cocher les tâches et ajouter les preuves simulées avant/après. Signaler une anomalie si souhaité. Vérifier puis soumettre.
4. Contrôleur : demander une reprise sur une tâche avec un motif. Revenir côté agent, corriger seulement cette tâche puis soumettre une deuxième version.
5. Contrôleur : valider le compte rendu. Si une anomalie est ouverte, une réserve est requise ; la clôture de l’anomalie reste une action distincte et motivée.
6. Administrateur : consulter le journal des actions simulées.

Le premier scénario préchargé concerne Salle 101, le 5 novembre 2026, de 09:00 à 10:00. Agent A est le responsable représenté par la vue agent ; Agent C est un contributeur simulé. Les versions précédentes sont consultables dans le détail après une demande de reprise.

## Ce qui peut être évalué

Navigation selon le rôle, lecture des responsabilités, création guidée en trois étapes, affectation, erreurs de conflit, vérification des éléments manquants, soumission, reprise ciblée, conservation des versions, validation avec réserve, clôture d’anomalie et audit. Présentation responsive pour ordinateur et téléphone.

Les preuves sont des indicateurs fictifs, pas des photographies. Aucun envoi réseau ni sauvegarde durable n’est simulé comme réel. Le prototype ne prouve pas les droits côté serveur.

## Limites explicites

Ce prototype n’implémente pas la récurrence, les reports, les annulations, les QR, les PDF, les notifications, la réaffectation ni le hors ligne. L’anglais et les tests utilisateurs humains restent à réaliser. La création de sites/organisations et la gestion d’équipe restent dans l’application existante ; le prototype expose uniquement leurs informations de contexte.

## Direction visuelle

Une navigation bleu nuit stable, une action principale cobalt, des surfaces claires et une liste de travail prioritaire remplacent la composition centrée sur les réglages. Les couleurs ne portent jamais seules le statut. Le changement de rôle rend visible le passage de responsabilité d’une même intervention.

## Vérification reproductible

Exécuter `npm run build:web`, puis `node scripts/prototype-smoke.mjs`. Le script démarre et ferme son propre serveur HTTP local avec les mêmes en-têtes Helmet que l’application ; `PROTOTYPE_URL` permet de tester une autre adresse. Il vérifie aussi l’absence de violation CSP. Le script utilise Chromium installé à /usr/bin/chromium dans l’environnement de développement. Les captures de test ne sont pas publiées.

La compilation extrait le JavaScript et les styles du fichier autonome vers `web-dist/prototype-assets/`. Le prototype servi fonctionne ainsi avec la politique de sécurité existante de l’application.

Vérification du 4 novembre 2026 : compilation web réussie ; scénario Chromium réussi (création, conflit d’affectation, exécution, reprise ciblée, deuxième soumission, validation avec réserve, clôture d’anomalie, audit), sans erreur JavaScript ni violation CSP. Absence de débordement horizontal contrôlée à 390 et 360 pixels. Revue visuelle indépendante Impeccable : `ship` sur les trois captures accueil ordinateur, exécution mobile et contrôle ordinateur. Cette revue couvre le prototype observé, sans certification d’accessibilité ni test utilisateur humain.
