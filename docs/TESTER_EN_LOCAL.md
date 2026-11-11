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

La première commande télécharge les dépendances ; sa durée dépend de votre connexion. La seconde démarre PostgreSQL, applique les migrations et crée le jeu de démonstration fictif **AFISA Food Industry** (usine de Bonabéri) et huit comptes avec des mots de passe aléatoires de 8 caractères (lettres et chiffres faciles à recopier). **Conservez les identifiants affichés dans votre terminal** : ils ne sont pas réaffichés lors des prochains lancements.

| Identifiant | Vue à tester |
| --- | --- |
| `demo.admin` | Toute la plateforme : vue d’ensemble, journal d’activité, organisations (lecture des interventions) |
| `demo.client` | Responsable services généraux AFISA : programmes de nettoyage, demandes de maintenance, décision sur devis, contrôle |
| `demo.controleur` | Contrôleuse qualité AFISA : contrôle des comptes rendus, reprise ou acceptation, anomalies |
| `demo.prestataire` | Responsable Hygiène Plus Services (nettoyage sous contrat) : affectation des équipes |
| `demo.agent`, `demo.agent2` | Agents de nettoyage : réalisation des passages, tâches, photos, compte rendu |
| `demo.maintenance` | Responsable MécaTech Industrie (maintenance) : devis, affectation |
| `demo.technicien` | Technicien de maintenance : réalisation, photos, anomalies |

Toutes les données sont fictives. Les comptes agents doivent changer leur mot de passe à la première connexion.

Les mots de passe sont différents pour chaque installation. Aucun compte de production n’est créé. L’initialisation refuse une base contenant déjà des utilisateurs ou organisations : elle ne remplace pas vos données et ne réinitialise aucun mot de passe.

### Installation existante : ajouter AFISA sans rien effacer

Si votre base contient déjà des données (par exemple l’ancienne démonstration « hôpital »), ajoutez le jeu de présentation sans la vider :

```sh
docker compose build
docker compose run --rm setup node dist/src/demo-enrich.js
```

Le script ajoute **AFISA Food Industry** (usine de Bonabéri, ses lieux et équipements) avec **Hygiène Plus Services** (nettoyage sous contrat) et **MécaTech Industrie** (maintenance), les deux parcours à chaque étape, ainsi que d’autres clients et prestataires fictifs de différents secteurs. Il renomme les anciens libellés « démonstration », ne supprime aucune de vos données et ignore ce qui existe déjà : on peut le relancer. Il affiche **une seule fois**, au format JSON, les identifiants et mots de passe des comptes qu’il crée : conservez-les. Comptes AFISA : `c.ebode` (responsable services généraux), `l.tchamba` (contrôleuse qualité), `m.ekollo` et `g.talla` (responsables Hygiène Plus et MécaTech), `j.bilong`, `a.ndoumbe` et `y.nganou` (agents et technicien, mot de passe à changer à la première connexion).

## 3. Ouvrir l’interface

```sh
docker compose up -d --wait web
```

Ouvrir **http://localhost:3000**. Utiliser exactement cette adresse, car le contrôle d’origine vérifie aussi le nom d’hôte. Se connecter avec l’un des comptes ci-dessus et son mot de passe affiché à l’étape 2.

Le serveur écoute uniquement sur votre ordinateur. Il ne fournit pas de lien public et ne sera pas accessible depuis votre téléphone par le réseau local. Le mode responsive peut être testé en rétrécissant la fenêtre ou avec les outils du navigateur.

## 4. Parcours conseillé

Le menu est à plat, sans sous-menu : **Vue d’ensemble**, **Planning**, **Interventions**, **Sites et salles**, **Équipe**, **Prestataires** et **Société** sont chacun un onglet, selon les droits du compte.

**Nettoyage régulier sous contrat**

1. **Client** (`demo.client`) : Vue d’ensemble, puis Planning. Le programme « Nettoyage quotidien » produit un passage par jour (lundi–samedi, 05:30–07:00), chacun suivi séparément : passés acceptés, une reprise demandée, un passage à contrôler, celui du jour en cours, les suivants planifiés. Le programme hebdomadaire des chambres froides attend encore son équipe.
2. **Prestataire** (`demo.prestataire`) : Interventions › Programmes, puis « Affecter l’équipe à tous les passages à venir » sur le programme des chambres froides.
3. **Agent** (`demo.agent`) : ouvrir le passage du jour, cocher les tâches restantes, ajouter une photo avant/après, soumettre le compte rendu.
4. **Contrôleur** (`demo.controleur`) : ouvrir le passage « À contrôler », demander une reprise sur une tâche précise avec un motif, ou accepter la prestation.

**Maintenance ponctuelle avec devis**

1. **Client** : Interventions › Nouvelle demande de maintenance. Choisir le prestataire destinataire, les lieux et équipements, une date de début et une date de fin indépendantes, cocher « Devis préalable requis ».
2. **Maintenance** (`demo.maintenance`) : transmettre le devis (montant FCFA, délai, contenu). Rien n’est planifié avant l’accord du client.
3. **Client** : accepter le devis, ou le refuser avec un motif.
4. **Maintenance** : affecter le technicien et le responsable de mission. **Technicien** (`demo.technicien`) : démarrer, renseigner les tâches, signaler une anomalie, soumettre.
5. **Contrôleur** : accepter la prestation. L’anomalie reste ouverte : elle se clôture séparément (proposition de résolution, puis clôture avec constat).
6. Sur la fiche, « Télécharger le compte rendu (PDF) » produit le compte rendu avec tâches, devis, anomalies, historique et photos.

Passer de Français à English et vérifier l’affichage sur une fenêtre étroite.

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

## Mots de passe de 8 caractères

Les nouveaux comptes de démonstration et les nouveaux agents reçoivent un mot de passe aléatoire de 8 caractères. Vous pouvez choisir un mot de passe d’au moins 8 caractères lors de l’acceptation d’une invitation ou du changement obligatoire. Les anciens mots de passe restent valides après mise à jour.

Pour remplacer le mot de passe d’un compte de démonstration déjà créé, après avoir mis à jour et reconstruit l’image :

```sh
docker compose run --rm setup node dist/src/reset-demo-password.js demo.admin
```

La commande affiche le nouveau mot de passe de 8 caractères, invalide les sessions de ce compte et conserve les données. Remplacer `demo.admin` par un autre identifiant de démonstration (`demo.client`, `demo.controleur`, `demo.prestataire`, `demo.maintenance`, `demo.agent`, `demo.agent2`, `demo.technicien`). Elle refuse les comptes hors démonstration et le mode production. L’agent doit toujours changer son mot de passe à la prochaine connexion.

## Dépannage

- **Docker inaccessible** : démarrer Docker Desktop et attendre qu’il soit prêt, puis relancer la commande.
- **Port 3000 déjà utilisé** : créer un fichier `.env` à côté de `compose.yaml` avec `TRACEOPS_PORT=3005`, puis relancer `docker compose up -d --wait web` et ouvrir http://localhost:3005. Les autres paramètres de la composition restent inchangés.
- **DEMO_REQUIRES_EMPTY_DATABASE** : la démonstration est déjà initialisée, ou la base contient des données. Utiliser vos comptes existants.
- **Mauvaise origine** : ouvrir `localhost` avec le port configuré, sans remplacer par `127.0.0.1`.
- **Le serveur ne démarre pas** : consulter `docker compose ps` puis `docker compose logs --tail=80 web db`. Éviter de partager des mots de passe ou des liens d’invitation dans les diagnostics.

### Repartir de zéro, uniquement si vous voulez effacer tous vos essais

Une installation existante garde l’ancienne démonstration (hôpital) : pour obtenir le jeu AFISA sans rien perdre, utilisez plutôt `demo-enrich.js` (voir « Installation existante » plus haut). Repartir de zéro reste possible avec les commandes ci-dessous.

Les commandes suivantes suppriment **toute la base de démonstration locale**, y compris les comptes, sites et salles ajoutés. Elles servent notamment si vous avez perdu tous les mots de passe. Ne pas les utiliser pour une simple mise à jour.

```sh
docker compose down --volumes
docker compose run --rm setup
docker compose up -d --wait web
```

## Périmètre de cette version

Disponible : comptes, organisations, invitations, agents, sites et lieux, programmes de nettoyage récurrents (un passage suivi par date), demandes de maintenance avec devis préalable, affectation avec responsable de mission et contrôle de disponibilité, réalisation par tâches, photos avant/après (JPEG/PNG), compte rendu, contrôle avec reprise ciblée, acceptation, anomalies clôturées séparément, compte rendu PDF, journal d’activité, français/anglais.

À venir : QR, notifications, modification d’un programme après création, récupération de mot de passe.

Cette composition est destinée aux essais locaux, avec des identifiants PostgreSQL locaux et HTTP. Elle ne constitue pas une configuration de production.
