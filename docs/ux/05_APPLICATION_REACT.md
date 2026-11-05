# Tableau de bord de l’application React

Le tableau de bord étend le design courant de main (Inter, navigation claire, actions bleues) sans remplacer les écrans de connexion, équipes, sites et salles. Les appels API et droits existants sont conservés.

## Ouvrir la nouvelle version

Avant fusion, récupérer la branche de développement :

```cmd
git fetch origin
git switch feat/backend-foundation
git pull --ff-only
docker compose up -d --build --wait web
```

Après fusion, utiliser `git switch main`, puis `git pull --ff-only` et la même commande Docker. Ouvrir **http://localhost:3000**. Après connexion, l’onglet Tableau de bord est sélectionné. Équipe et Sites et salles restent accessibles selon les droits du compte.

Les interventions, affectations, preuves et validations de `prototype.html` restent des simulations : ce lot applique la présentation aux fonctions déjà disponibles. Leurs opérations persistantes restent à développer.

## Validation

`npm run build:web` compile l’application. `node scripts/connected-ui-smoke.mjs` teste le bundle à la racine avec un serveur de réponses API synthétiques et les en-têtes Helmet : connexion, lecture des membres, invitation, sites et salles, français/anglais, déconnexion, absence de débordement à 390 et 360 pixels. Chromium est attendu à `/usr/bin/chromium`, configurable avec `CHROMIUM_PATH`.

Ce test vérifie le frontend et ses requêtes ; il ne constitue pas un test d’intégration PostgreSQL. Les captures et les données synthétiques ne sont pas livrées dans l’application.

## Tableau de bord par profil

La connexion et le changement d’organisation ouvrent le tableau de bord. Administrateur, client, prestataire, contrôleur et agent y retrouvent leur périmètre et des raccourcis selon leurs droits. Les sites sont chargés via l’API ; les états de chargement, erreur, absence de sites et accès limité sont distingués. Aucun chiffre fictif d’intervention n’est affiché. Le scénario automatisé vérifie les cinq profils avec des réponses API synthétiques.
