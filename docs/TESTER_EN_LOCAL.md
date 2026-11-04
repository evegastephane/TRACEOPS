# Tester TRACEOPS sur votre ordinateur

Ce lancement installe la version de développement React + NestJS + PostgreSQL. Les données sont conservées sur votre ordinateur. Docker suffit : inutile d’installer Node.js ou PostgreSQL séparément.

## 1. Prérequis

Installer et démarrer **Docker Desktop** sur Windows/macOS, ou Docker Engine avec Compose v2 sur Linux. Sur Windows, ouvrir PowerShell ; sur macOS/Linux, ouvrir un terminal.

Récupérer la branche de développement :

```sh
git clone --branch feat/backend-foundation https://github.com/evegastephane/TRACEOPS.git
cd TRACEOPS
```

Sans Git, télécharger le ZIP de la branche depuis GitHub, l’extraire, puis ouvrir un terminal dans le dossier contenant `compose.yaml`.

## 2. Construire et préparer la démonstration

```sh
docker compose build
docker compose run --rm setup
```

La première commande télécharge les dépendances ; sa durée dépend de votre connexion. La seconde démarre PostgreSQL, applique les migrations et crée cinq comptes avec des mots de passe aléatoires. **Conservez les identifiants affichés dans votre terminal** : ils ne sont pas réaffichés lors des prochains lancements.

| Identifiant | Vue à tester |
| --- | --- |
| `demo.admin` | Organisations, invitations, sites et lieux avec motif administratif |
| `demo.client` | Équipe cliente, création des sites et lieux |
| `demo.controleur` | Consultation du site habilité |
| `demo.prestataire` | Équipe prestataire, ajout d’agents, consultation du site rattaché |
| `demo.agent` | Changement obligatoire du mot de passe, puis espace agent |

Les mots de passe sont différents pour chaque installation. Aucun compte de production n’est créé. L’initialisation refuse une base contenant déjà des utilisateurs ou organisations : elle ne remplace pas vos données et ne réinitialise aucun mot de passe.

## 3. Ouvrir l’interface

```sh
docker compose up -d --wait web
```

Ouvrir **http://localhost:3000**. Utiliser exactement cette adresse, car le contrôle d’origine vérifie aussi le nom d’hôte. Se connecter avec l’un des comptes ci-dessus et son mot de passe affiché à l’étape 2.

Le serveur écoute uniquement sur votre ordinateur. Il ne fournit pas de lien public et ne sera pas accessible depuis votre téléphone par le réseau local. Le mode responsive peut être testé en rétrécissant la fenêtre ou avec les outils du navigateur.

## 4. Parcours conseillé

1. **Client** : ouvrir Sites et salles, puis Hôpital de démonstration. Le bâtiment, l’étage et la salle 101 existent déjà. Ajouter une salle sous le premier étage, avec un code unique ; rechercher ce code. Tenter de réutiliser ce code pour vérifier le message d’erreur.
2. **Contrôleur** : se déconnecter puis se connecter avec `demo.controleur`. Le site est consultable, sans bouton de création.
3. **Prestataire** : consulter le site rattaché, puis ouvrir Équipe et ajouter un agent. Conserver son mot de passe temporaire avant de fermer le résultat.
4. **Agent** : se connecter avec `demo.agent` ou le nouvel agent. Remplacer le mot de passe temporaire. Les missions ne sont pas encore disponibles.
5. **Administrateur** : choisir l’organisation cliente et créer un site. Le motif administratif est obligatoire. Créer également une organisation ou une invitation pour explorer la gestion des accès.
6. Passer de Français à English et vérifier l’affichage sur une fenêtre étroite.

Pour comparer plusieurs rôles simultanément, employer des profils de navigateur séparés. Les onglets d’un même profil partagent la même session.

## 5. Arrêter, reprendre et mettre à jour

Arrêter sans effacer les données :

```sh
docker compose down
```

Reprendre :

```sh
docker compose up -d --wait web
```

Récupérer le nouveau code puis reconstruire (si vous avez utilisé Git et n’avez pas de modifications locales) :

```sh
git pull --ff-only
docker compose up -d --build --wait web
```

Ne pas relancer `setup` après chaque mise à jour. Les migrations nécessaires s’appliquent au démarrage ; le volume PostgreSQL conserve vos essais.

## Dépannage

- **Docker inaccessible** : démarrer Docker Desktop et attendre qu’il soit prêt, puis relancer la commande.
- **Port 3000 déjà utilisé** : créer un fichier `.env` à côté de `compose.yaml` avec `TRACEOPS_PORT=3005`, puis relancer `docker compose up -d --wait web` et ouvrir http://localhost:3005. Les autres paramètres de la composition restent inchangés.
- **DEMO_REQUIRES_EMPTY_DATABASE** : la démonstration est déjà initialisée, ou la base contient des données. Utiliser vos comptes existants.
- **Mauvaise origine** : ouvrir `localhost` avec le port configuré, sans remplacer par `127.0.0.1`.
- **Le serveur ne démarre pas** : consulter `docker compose ps` puis `docker compose logs --tail=80 web db`. Éviter de partager des mots de passe ou des liens d’invitation dans les diagnostics.

### Repartir de zéro, uniquement si vous voulez effacer tous vos essais

Les commandes suivantes suppriment **toute la base de démonstration locale**, y compris les comptes, sites et salles ajoutés. Elles servent notamment si vous avez perdu tous les mots de passe. Ne pas les utiliser pour une simple mise à jour.

```sh
docker compose down --volumes
docker compose run --rm setup
docker compose up -d --wait web
```

## Périmètre de cette version

Disponible : comptes, organisations, invitations, agents, création/consultation des sites et lieux, recherche, français/anglais et droits par organisation/site.

À venir : parcours persistants des interventions, affectation opérationnelle, comptes rendus, validation client, récurrence, photos, QR, PDF et notifications. Le rattachement des prestataires et l’habilitation des contrôleurs sont préconfigurés dans cette démonstration et restent gérés par API. Modification/archivage des lieux et récupération de mot de passe ne sont pas encore disponibles.

Cette composition est destinée aux essais locaux, avec des identifiants PostgreSQL locaux et HTTP. Elle ne constitue pas une configuration de production.
