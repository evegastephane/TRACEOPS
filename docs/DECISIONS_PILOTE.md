# TRACEOPS — Consolidation des réponses du pilote
Version 0.1 — Réponses du porteur ; points ambigus explicitement conservés ouverts.

## 1. Décisions explicites
| ID | Sujet | Décision |
|---|---|---|
| PIL-01 | Secteurs | Entreprises, hôpitaux, hôtels, immeubles et autres ; type configurable |
| PIL-02 | Localisation | Définition précise des salles au sein des sites |
| PIL-03 | Taille initiale | 10 clients, 10 prestataires, 10 sites et 10 agents annoncés ; répartition à préciser |
| PIL-04 | Services | Nettoyage et maintenance |
| PIL-05 | Affectations | Un agent ou plusieurs agents par intervention |
| PIL-06 | Acceptation prestataire | Affectation directe ; possibilité de signaler une impossibilité |
| PIL-07 | Chevauchements | Deux missions simultanées pour un même agent interdites |
| PIL-08 | Replanification | Avant démarrage ; demande prestataire puis confirmation client |
| PIL-09 | Annulation | Avant soumission ; décision client, demande possible du prestataire |
| PIL-10 | Remplacement | Autorisé après démarrage, avec motif, transmission du brouillon et conservation des auteurs |
| PIL-11 | Horaires réels | Actions Démarrer puis Soumettre |
| PIL-12 | Justificatifs | Photos avant et après |
| PIL-13 | QR code | Inclus dès le lancement |
| PIL-14 | Contrôle | Contrôleurs client habilités par site |
| PIL-15 | Tâche impossible | Acceptation possible par le client avec motif et anomalie conservée |
| PIL-16 | Reprise | Seulement les tâches concernées ; versions précédentes conservées |
| PIL-17 | Délais de contrôle/reprise | Pas de délais imposés demandés pour le lancement |
| PIL-18 | Notifications | Dans l’application |
| PIL-19 | Exports | PDF |
| PIL-20 | Langues | Français et anglais |
| PIL-21 | Contenu sensible prévu | Le porteur n’en prévoit pas ; le contexte hospitalier exige néanmoins des consignes photo explicites |
| PIL-22 | Conservation | 9 mois annoncés ; catégories, point de départ et sauvegardes à préciser |
| PIL-23 | Fin de contrat | Lecture des seules interventions du prestataire pendant une durée convenue |
| PIL-24 | Hébergement existant | Aucun indiqué ; solution à proposer |
| PIL-25 | Administration et support | Le porteur seul est administrateur global et assure le support |

Les réponses « oui » semblent confirmer les modèles de tâches définis par le client et le choix d’un prestataire autorisé par site. Ces points restent des propositions cohérentes avec le circuit déjà retenu, à confirmer si nécessaire. La suite initiale de oui/non ne permet pas d’attribuer sans ambiguïté toutes les réponses techniques et d’accès.

## 2. Réponses encore nécessaires
Pays du pilote ; équipe de développement et maintenance ; confirmation frontend/base/stockage ; hors ligne indispensable ou non ; invitation et moyen de connexion ; courriel disponible pour les agents ; appartenance multiple ; récurrence ; acteur clôturant les anomalies ; responsable de soumission lorsqu’il y a plusieurs agents.
Budget et délai ne sont pas encore fixés. L’administrateur/support ne doit pas être assimilé automatiquement à l’équipe de développement.

## 3. Traduction fonctionnelle proposée
### Sites et salles
Hiérarchie proposée : site → bâtiment → étage → zone → salle. Les niveaux intermédiaires sont facultatifs ; chaque nœud possède type, nom et code local unique dans le site. Une salle reste identifiable sans imposer la structure d’un hôpital à tous les clients. L’équipement de maintenance peut être rattaché à une salle.
Recette : créer deux salles portant le même nom à des étages différents, distinguer leurs codes, les retrouver dans une intervention et empêcher tout rattachement à un autre site.

### Travail en groupe
Plusieurs affectations actives sont permises, avec unicité agent/intervention. Proposition à confirmer : un responsable soumet le compte rendu commun ; chaque réponse et photo conserve son auteur.
La règle de conflit horaire s’applique à chacun des agents. Le remplacement clôture seulement l’affectation concernée et n’attribue pas les contributions antérieures au remplaçant.
Recette : affecter deux agents, remplacer l’un, conserver les auteurs, empêcher un doublon et refuser l’affectation d’un agent déjà occupé.

### Conflits horaires
Proposition technique : intervalles [début, fin[, permettant deux créneaux adjacents. Comparer les affectations actives des missions non annulées ; les changements de créneau vérifient tous les agents affectés dans une transaction protégeant aussi des demandes concurrentes.
La politique en cas de dépassement réel de durée reste à préciser : ne pas modifier automatiquement l’intervention suivante.
Recette : deux responsables tentent simultanément d’affecter le même agent sur deux créneaux qui se chevauchent ; au plus une opération réussit.

### QR
Le QR identifie une zone ou une salle et ouvre les interventions accessibles après authentification. Il ne contient pas de données personnelles et ne constitue pas une preuve d’exécution ni de présence.
Prévoir génération, téléchargement pour impression, révocation/régénération et message pour code invalide. Le format exact est un choix technique à documenter.
Recette : scanner un QR d’un autre client ne révèle ni missions ni pièces.

### Photos avant/après
Métadonnée proposée : phase BEFORE ou AFTER, zone/tâche liée, auteur, instant de réception serveur. Une heure de capture fournie par le téléphone ne constitue pas une preuve incontestable.
La granularité et le minimum de photos doivent être définis : par intervention, salle ou tâche. Une impossibilité doit pouvoir être expliquée sans inventer une photo de travail accompli.
Recette : affichage des deux phases, auteur conservé, pièces privées, refus d’une photo provenant d’une autre intervention.

### Français et anglais
Traduire navigation, statuts, formulaires, erreurs, notifications et modèles PDF. Stocker les états métier avec des codes stables, indépendants de la langue.
Les commentaires libres et noms saisis ne sont pas traduits automatiquement. La préférence utilisateur pilote l’interface ; la langue du rapport est choisie explicitement.
Recette : parcours complet dans les deux langues, dates selon fuseau du site et absence de clé de traduction visible.

### PDF
Rapport proposé : client, prestataire, site et salle, intervention, horaires prévus/réels, agents, tâches, photos, anomalies, décisions et date de génération.
Préciser les révisions incluses et distinguer rapport soumis, repris et validé. Le PDF reflète un instantané ; il n’est ni modifiable depuis TRACEOPS ni assimilé à une signature certifiée.
Autoriser génération et téléchargement selon le périmètre ; conserver le fichier privé et limiter sa durée de disponibilité.
Recette : un utilisateur d’un autre client ne peut télécharger le rapport, même avec son identifiant.

### Conservation et fin de contrat
La durée de 9 mois est une décision métier, pas une affirmation de conformité réglementaire. Avant toute purge automatique, fixer point de départ, catégories, exceptions, pièces, exports, audit et sauvegardes.
Proposition à examiner : rétention liée à la clôture de l’intervention ; aucune purge d’une mission ou anomalie active sans décision explicite. L’accès après contrat reste borné par la durée convenue et par la conservation effective.
Ne pas supposer que les 9 mois désignent aussi la durée d’accès après contrat.

## 4. Effets sur les documents antérieurs
Cette consolidation remplace les hypothèses de report du QR, d’agent unique et de simple avertissement de chevauchement. Elle complète le PRD avec notifications internes, PDF et deux langues. Les principes du monolithe modulaire et de validation directe restent applicables.
La saisie exclusivement en ligne reste une proposition tant que le porteur n’a pas clarifié la réponse sur le hors ligne.

## 5. Ordre de développement proposé après clarification
1. Socle NestJS, identité, organisations et permissions.
2. Sites, salles et relations avec les prestataires.
3. Création client, affectations multiples et contrôle des conflits.
4. Exécution terrain, photos avant/après, QR et contributions.
5. Contrôle client, reprises, anomalies et demandes de changement.
6. Notifications, rapports PDF, finitions bilingues et recette.
Le hors ligne et la récurrence peuvent modifier cet ordre et la charge : les décider avant engagement sur un calendrier. Aucun délai estimé sans connaissance de l’équipe.
