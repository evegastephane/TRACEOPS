# TRACEOPS — Business Requirements Specification

> Version 0.2 — 3 novembre 2026 — Projet de travail, non approuvé.
> Source : « TRACEOPS — Présentation du projet et cadrage fonctionnel initial », v0.1, fichier fourni par le porteur du projet.
> Convention : **[S]** = explicitement décrit dans la source ; **[P]** = proposition à valider ; **[O]** = question ouverte. Une proposition ne constitue pas une décision approuvée.


## 1. Besoin métier et vision
[S] Permettre à une organisation cliente et à ses prestataires de planifier, suivre et contrôler les interventions sur leurs sites. Répondre à : quoi, où, quand, par qui, avec quel résultat et quel contrôle ?
[S] Le service convenu constitue une **prestation** ; chaque réalisation datée constitue une **intervention**. Une prestation produit plusieurs interventions.
[P] Hypothèse de problème : les échanges et comptes rendus dispersés rendent difficile la comparaison entre travail attendu, travail déclaré et résultat accepté. La fréquence et le coût de ce problème doivent être mesurés auprès du pilote.

## 2. Parties prenantes
| Acteur | Intérêt | Responsabilité proposée |
|---|---|---|
| Client / donneur d’ordre [S] | Visibilité sur ses sites et prestations | Définir les attentes et désigner les contrôleurs [P] |
| Responsable prestataire [S] | Organiser les équipes et traiter les reprises | Organiser les équipes et affecter les interventions créées par le client [P pour l’affectation] |
| Agent terrain [S] | Savoir quoi faire et rendre compte sur téléphone | Exécuter, déclarer les difficultés et soumettre le compte rendu |
| Contrôleur [S, utilisateur habilité] | Accepter ou demander une reprise | Capacité attribuée à un utilisateur client pour le pilote [P] |
| Administrateur global [S, ajout du porteur le 03/11/2026] | Superviser toutes les organisations et opérations | Gérer les comptes, accès, référentiels et interventions de toute la plateforme ; actions tracées [P] |
| Porteur produit [P] | Arbitrer le périmètre | Approuver les règles et priorités |
| Exploitant technique [P] | Assurer la continuité du service | Exploitation, sauvegardes et assistance tracée |
[O] Identifier les personnes responsables, le financeur, le décideur produit et le propriétaire des données.

## 3. Objectifs et indicateurs proposés
Aucune valeur ci-dessous n’est une promesse contractuelle ni une donnée déjà mesurée.
| ID | Résultat métier | Indicateur proposé | Mesure / cible initiale à discuter |
|---|---|---|---|
| OBJ-01 | Rendre le travail attendu visible | Interventions du pilote enregistrées / interventions attendues | Référentiel terrain indépendant ; cible ≥ 95 % [P] |
| OBJ-02 | Documenter les réalisations | Comptes rendus complets / comptes rendus soumis | Contrôle des champs requis ; cible 100 % [P] |
| OBJ-03 | Distinguer déclaration et acceptation | Soumissions avec décision de contrôle dans le délai convenu / soumissions échues | Délai et cible à définir [O] |
| OBJ-04 | Réduire les problèmes sans suivi | Anomalies ouvertes avec responsable / anomalies ouvertes | Cible ≥ 95 % [P] |
| OBJ-05 | Garantir la confidentialité | Accès inter-périmètres indus constatés | Aucun accès indu accepté ; tests obligatoires [P] |
[P] Instrumenter les indicateurs dès le pilote. Mesurer une situation de départ avant de promettre un gain de temps ou une réduction des retards.

## 4. Exigences métier
| ID | Exigence | Origine | Priorité proposée |
|---|---|---|---|
| BR-01 | Relier clients, prestataires, sites et équipes sans mélange des périmètres | [S] §§1,4,5 | Indispensable |
| BR-02 | Définir prestations, tâches, consignes et lieux | [S] §§2,3,5 | Indispensable |
| BR-03 | Créer, dater et affecter les interventions | [S] §§3,5 | Indispensable |
| BR-04 | Permettre à l’agent de consulter et renseigner ses missions sur téléphone | [S] §§3,5 | Indispensable |
| BR-05 | Séparer réalisation déclarée, contrôle et validation ou reprise | [S] §§3,7 | Indispensable |
| BR-06 | Signaler les blocages et suivre les anomalies jusqu’à résolution | [S] §§3,5 | Indispensable |
| BR-07 | Afficher avancement, retards, validations et anomalies avec filtres | [S] §5 | Indispensable |
| BR-08 | Sauvegarder les données et conserver l’auteur, l’heure et l’historique des actions importantes | [S] §§5,7 | Indispensable |
| BR-09 | Garder un socle configurable, d’abord testé sur nettoyage et maintenance | [S] §2 | Indispensable |
| BR-10 | Faciliter éventuellement l’identification d’une zone par QR | [S] §5, à étudier | Option ultérieure |

**BR-11 [S, demande complémentaire]** Fournir un espace prestataire et un espace administrateur global capable de superviser l’ensemble de la plateforme. [P] Le contrôle global inclut la gestion des organisations, utilisateurs, habilitations et opérations. Il ne permet pas de falsifier un compte rendu soumis ou l’historique ; une correction doit rester explicite et traçable.

## 5. Périmètre et limites
[S] Inclus au cadrage : organisations, utilisateurs et droits, sites et zones, prestations et listes de tâches, interventions et affectations, comptes rendus et justificatifs, contrôles, reprises, anomalies, tableaux de bord et historique.
[P] Pilote : application web responsive, saisie en ligne, affectation à un agent responsable, contrôle unique par un utilisateur client habilité. Une équipe pourra être référencée, mais la responsabilité de soumission reste individuelle.
[S] Hors priorité initiale : marketplace, facturation complète, applications natives. [P] Hors MVP : paie, optimisation automatique des tournées, stocks, intégration ERP, géolocalisation et signature à valeur probante.
[O] Synchronisation hors ligne, QR et fréquence des interventions : à arbitrer explicitement. Le document source ne les garantit pas.

## 6. Processus cible proposé
1. Le client habilite un prestataire pour un site et convient des prestations.
2. Le client définit les attentes et crée les interventions ; le responsable prestataire prépare leur exécution.
3. Le responsable affecte un agent dans la relation client–prestataire autorisée.
4. L’agent exécute et documente ; un blocage est signalé avec motif.
5. L’agent soumet un compte rendu versionné ; les données soumises deviennent non modifiables.
6. Le contrôleur client valide ou motive une demande de reprise.
7. En reprise, l’agent complète une nouvelle version puis soumet à nouveau ; les versions précédentes restent consultables.
8. Les tableaux de bord reflètent l’état et les anomalies ; la validation ne ferme pas automatiquement toute anomalie.
[P] Détails opérationnels et exceptions dans SRS.md. [O] Le pilote doit confirmer l’étape 2. [S] L’étape 6 est confirmée : le client valide directement.

## 7. Contraintes, hypothèses et risques
| Sujet | Statut / impact | Réponse proposée |
|---|---|---|
| Client pilote, pays, secteur | [O] Non connus ; Douala et l’hôpital sont des exemples | Choisir le pilote avant d’établir obligations et hébergement |
| Équipe, budget et calendrier | [O] Non fournis | Estimation après validation des parcours et capacité réelle |
| Réseau terrain | [O] Qualité inconnue | Tester sur site ; revoir le MVP si hors ligne indispensable |
| Photos et personnes identifiables | [P] Risque de collecte excessive | Consignes de prise de vue, minimisation, droits restreints et conservation définie |
| Autocontrôle | [O] Règles non définies | Contrôleur distinct du déclarant dans la proposition pilote |
| Adoption terrain | [P] Trop de saisie peut empêcher l’usage | Tester les tâches fréquentes avec les agents |
| Multi-organisation | [S] Risque majeur de fuite | Isolation serveur et recette négative à chaque étape |

## 8. Recette métier et gouvernance
[S] Le parcours de référence doit fonctionner de bout en bout avec des utilisateurs distincts et des données persistées.
[P] Recette : un client, un prestataire, un site, deux agents et un contrôleur ; un cas validé, un cas repris, un blocage résolu et un refus d’accès inter-client. Vérifier l’historique après reconnexion.
[P] Accord métier requis sur périmètre, permissions, validation, conservation et connectivité. Le porteur produit valide le BRS ; le responsable technique vérifie la faisabilité ; les utilisateurs pilotes valident les parcours.
[P] Tout changement accepté met à jour les exigences concernées, leurs tests et la décision associée. Les questions ouvertes sont consignées dans CADRAGE.md.

## 9. Approfondissement de la démarche métier — v0.2
Le [référentiel détaillé](REFERENTIEL_ARCHITECTURE.md), chapitres 1–2 et 13–14, complète ce BRS avec responsabilités, recueil du besoin, arbitrages et cadres de gouvernance. La [matrice de couverture](COUVERTURE_CONCEPTS.md) indique où chaque notion est traitée.

[P] **BR-12 — Traçabilité des décisions :** toute règle métier retenue doit préciser sa source, son décideur, ses critères de succès et les exigences affectées. Une demande de changement comprend bénéfice, utilisateurs concernés, effet sur données historiques et impact estimé.
[P] **BR-13 — Continuité de service :** définir les conséquences métier d’une indisponibilité ou d’une perte de données avant de valider RPO, RTO et disponibilité. Le responsable du pilote identifie les opérations qui peuvent attendre et celles nécessitant une procédure manuelle.
[P] **BR-14 — Gouvernance des informations :** identifier le propriétaire des référentiels et comptes rendus, les règles de consultation après fin de contrat, les durées de conservation et les systèmes externes autoritatifs.

### Atelier métier proposé
Pour chaque acteur, examiner une journée normale et une situation dégradée. Conserver un exemple concret de création, affectation, blocage, reprise, validation, suspension et consultation historique. Faire apparaître désaccords et exceptions dans CADRAGE. Le résultat attendu est un ensemble de règles compréhensibles et vérifiables, pas une sélection prématurée de technologies.


## Décisions confirmées par le porteur

**DEC-001 — Backend NestJS — accepté.** Le backend sera construit avec NestJS. Le choix ne confirme pas automatiquement les autres outils proposés, le fournisseur d’identité ou l’hébergement.

**DEC-002 — Validation directe par le client — accepté.** Dès la soumission de l’agent, l’intervention est disponible pour le contrôle d’un utilisateur client habilité. Celui-ci valide directement ou demande une reprise motivée. Aucune prévalidation ni approbation du responsable prestataire n’est requise. Le responsable prestataire consulte le résultat et organise les reprises. Après une nouvelle soumission, le client contrôle à nouveau.

Parcours : agent soumet → À contrôler par le client → Validée ou À reprendre → nouvelle soumission si nécessaire.

Cette décision clôt la question du contrôle intermédiaire prestataire. Les modalités d’une intervention exceptionnelle de l’administrateur global restent à préciser ; son pouvoir de supervision ne crée pas une étape obligatoire dans le circuit.

**Recette :** une soumission devient immédiatement visible dans la file du client habilité ; la validation client réussit sans action préalable du prestataire ; un responsable prestataire ne peut pas valider via ses droits de prestataire. Une demande de reprise conserve les versions et exige une nouvelle décision client.


**DEC-003 — Création des interventions par le client — accepté.** Le client habilité crée les interventions dans son périmètre. Le responsable prestataire ne dispose pas du droit de création dans le circuit métier ; son rôle proposé est d’organiser et d’affecter les interventions reçues. L’agent réalise et soumet ; le client contrôle directement selon DEC-002. La gestion exceptionnelle par l’administrateur global reste à préciser et ne doit pas être assimilée à un droit de création prestataire.

**AT-19 — Recette de création :** création par client habilité sur son site autorisée ; création par prestataire ou agent refusée ; création sur un site d’un autre client refusée ; auteur réel et contexte conservés dans l’historique. La replanification et les modifications après affectation restent à arbitrer.
