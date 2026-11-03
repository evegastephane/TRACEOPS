# TRACEOPS — Guide de lecture, décisions et traçabilité

> Version 0.1 — 3 novembre 2026 — Projet de travail, non approuvé.
> Source : « TRACEOPS — Présentation du projet et cadrage fonctionnel initial », v0.1, fichier fourni par le porteur du projet.
> Convention : **[S]** = explicitement décrit dans la source ; **[P]** = proposition à valider ; **[O]** = question ouverte. Une proposition ne constitue pas une décision approuvée.


## 1. Livrables
Lire dans cet ordre :
1. [BRS](BRS.md) : pourquoi le projet existe, acteurs, besoins et succès métier.
2. [PRD](PRD.md) : ce que le produit doit livrer et les parcours du MVP.
3. [SRS](SRS.md) : comportements précis, permissions, règles et critères de recette.
4. [Architecture logicielle](ARCHITECTURE.md) : structure technique proposée, compromis et exploitation.

La note source est un cadrage initial, pas un cahier des charges définitif. Les documents ci-dessus ne signifient pas que les fonctionnalités sont développées ou les choix validés. La maquette mentionnée n’a pas été fournie ni analysée.

## Complément du porteur — 3 novembre 2026
[S] Prévoir une vue prestataire et une vue administrateur global contrôlant toute la plateforme. Ce complément est intégré dans BR-11, US-09/EP-10, FR-18 et l’architecture d’autorisation globale.
[O] Les autres éléments de la réponse reprennent les thèmes de la question sans donner de valeurs : le pays, l’équipe, le délai, le budget, la stack imposée et le caractère indispensable du hors ligne ne sont donc pas considérés comme décidés.
[P] L’administrateur global possède les pouvoirs de gestion demandés, avec une identité propre et un audit ; « contrôler tout » n’est pas interprété comme l’autorisation de falsifier l’historique.

## 2. Questions à trancher
| ID | Question | Proposition de travail | Impact |
|---|---|---|---|
| Q-01 | Quel client pilote, secteur et pays ? | Un site, nettoyage et maintenance | Règles, hébergement, photos et obligations |
| Q-02 — création résolue | Qui crée les interventions ? | Client habilité — DEC-003 ; replanification selon DEC-005 ; autres modifications à préciser | Permissions et responsabilités |
| Q-03 — résolue | Qui contrôle et valide ? | Client habilité directement, sans prévalidation prestataire — DEC-002 | Circuit à un niveau confirmé |
| Q-04 | Le terrain exige-t-il le hors ligne ? | En ligne uniquement tant que non confirmé | Architecture et effort majeurs |
| Q-05 | Quelle équipe, quel budget, quel délai ? | Aucun engagement chiffré | Choix stack, lots et planning |
| Q-06 | Quels volumes et quelle conservation ? | Hypothèses de test seulement | Coût, performance et sauvegardes |
| Q-07 | Preuves obligatoires et locaux sensibles ? | Par tâche ; minimisation des images | UX, confidentialité et stockage |
| Q-08 | Récurrence et affectation à une équipe indispensables ? | Création manuelle et agent responsable unique | Périmètre MVP |
| Q-09 | Annulation, remplacement et réouverture ? | Transitions proposées dans SRS | Exceptions opérationnelles |
| Q-10 | Après fin du contrat, quels accès historiques ? | Refus au prestataire en attente de décision | Contrats et contrôle des accès |
| Q-12 | Qui détient et attribue le rôle administrateur global ? | Attribution sécurisée, MFA et actions tracées | Gouvernance des accès globaux |
| Q-11 | Qui fournit l’identité, invite et assiste ? | Identité gérée, invitations limitées au périmètre | Coût, récupération de compte et support |
[P] Q-01 à Q-07 doivent être résolues avant engagement sur une production utilisable. L’étude et les prototypes techniques peuvent avancer avec des hypothèses explicites.

## 3. Traçabilité
| Besoin BRS | Produit | Spécification | Architecture | Recette |
|---|---|---|---|---|
| BR-01 Périmètres | EP-01, US-01 | FR-01–05, RG-01–02/09 | ADR-002, modules accès et organisations | AT-04, AT-09 |
| BR-02 Prestations | EP-02, US-01 | FR-05–07, RG-01 | Catalogue, versions attendues | AT-06 |
| BR-03 Planning | EP-03, US-02 | FR-07–08, RG-03/08 | Operations | AT-01, AT-11 |
| BR-04 Terrain | EP-04, US-03–04 | FR-09–11, RG-04 | Operations, Evidence, ADR-003/005 | AT-01, AT-07–08, AT-12 |
| BR-05 Contrôle | EP-05, US-05–06 | FR-12–13, RG-05–06 | Quality, ADR-004, transactions | AT-02, AT-05 |
| BR-06 Anomalies | EP-05, US-07 | FR-10/14 | Quality | AT-03, AT-07 |
| BR-07 Pilotage | EP-06, US-08 | FR-15, RG-07/08 | Reporting | AT-11 |
| BR-08 Historique | Tous | FR-16–17, NFR-05/09 | Audit, sauvegarde et reprise | AT-01–02, AT-10 |
| BR-09 Configuration | EP-02 | FR-06, instantanés | Catalogue, ADR-004 | AT-06 |
| BR-11 Administration globale | EP-10, US-09 ; espace prestataire EP-03/05/06 | FR-18 et matrice des capacités | Autorisation globale explicite et audit | AT-13 |
| BR-10 QR optionnel | EP-08 hors MVP | Spécification différée | ADR future si retenu | Recette à définir après décision |
[P] Les identifiants restent stables lors des révisions ; toute nouvelle exigence reçoit un nouvel identifiant. Une exigence retirée est marquée retirée avec sa raison.

## 4. Revue documentaire effectuée
- Les fonctionnalités confirmées sont distinguées des choix proposés et des questions ouvertes.
- Le MVP respecte la distinction réalisé / validé.
- Les dimensions client, prestataire, site et affectation sont prises en compte.
- Reprises, blocages, annulations, anomalies et conflits sont documentés.
- Les objectifs de performance et de reprise sont identifiés comme hypothèses.
- Le QR et le hors ligne ne sont pas présentés comme des fonctions acquises.
- Aucun résultat de test logiciel ni conformité légale n’est revendiqué.
[P] Cette revue est documentaire. La validation terrain, le dimensionnement, la revue technique contradictoire et les tests d’implémentation restent à réaliser.

## 5. Source et méthode
Source principale : fichier utilisateur « TRACEOPS_Presentation_Projet_Cadrage_Fonctionnel (1).docx », note v0.1. Les références de section dans le BRS renvoient à ce document.
Repère demandé par le porteur : [roadmap.sh — Software Architect](https://roadmap.sh/software-architect), consulté le 3 novembre 2026. Les choix techniques décrits sont nos propositions contextualisées, pas des prescriptions attribuées à cette page.

## 6. Extension documentaire v0.2
Le [référentiel détaillé](REFERENTIEL_ARCHITECTURE.md) et sa [matrice de couverture](COUVERTURE_CONCEPTS.md) répondent à la demande d’expliciter les concepts d’architecture. Ils sont intégrés au document d’architecture ; aucun outil étudié n’est adopté implicitement.

| Besoin / objectif | Complément | Vérification |
|---|---|---|
| BR-12 Décisions traçables | ADR et dossier de preuve, référentiel 2 et 18 | Revue documentaire des décisions et exigences liées |
| BR-13 Continuité | NFR-11/12/14 ; référentiel 11 | AT-10, AT-17, AT-18 |
| BR-14 Gouvernance des informations | Référentiel 6, 8 et 15 | Politique de conservation, propriétaires et contrats d’intégration à compléter |
| BR-04/08 Confirmation fiable | US-10, FR-19 | AT-14 |
| BR-11 Administration globale | US-11, FR-20, NFR-13 | AT-15, AT-16 |
| BR-07 Pilotage | US-12, FR-21 | AT-11 |

La couverture des concepts est une revue de contenu, pas une recette logicielle. Les notions supplémentaires propres à TRACEOPS sont identifiées dans la matrice. Les questions structurantes de la section 2 restent ouvertes.


## Décisions confirmées par le porteur

**DEC-001 — Backend NestJS — accepté.** Le backend sera construit avec NestJS. Le choix ne confirme pas automatiquement les autres outils proposés, le fournisseur d’identité ou l’hébergement.

**DEC-002 — Validation directe par le client — accepté.** Dès la soumission de l’agent, l’intervention est disponible pour le contrôle d’un utilisateur client habilité. Celui-ci valide directement ou demande une reprise motivée. Aucune prévalidation ni approbation du responsable prestataire n’est requise. Le responsable prestataire consulte le résultat et organise les reprises. Après une nouvelle soumission, le client contrôle à nouveau.

Parcours : agent soumet → À contrôler par le client → Validée ou À reprendre → nouvelle soumission si nécessaire.

Cette décision clôt la question du contrôle intermédiaire prestataire. L’intervention exceptionnelle de l’administrateur global est confirmée par DEC-007, avec motif et historique ; elle ne crée pas une étape obligatoire dans le circuit.

**Recette :** une soumission devient immédiatement visible dans la file du client habilité ; la validation client réussit sans action préalable du prestataire ; un responsable prestataire ne peut pas valider via ses droits de prestataire. Une demande de reprise conserve les versions et exige une nouvelle décision client.


**DEC-003 — Création des interventions par le client — accepté.** Le client habilité crée les interventions dans son périmètre. Le responsable prestataire ne dispose pas du droit de création dans le circuit métier ; son rôle proposé est d’organiser et d’affecter les interventions reçues. L’agent réalise et soumet ; le client contrôle directement selon DEC-002. La gestion exceptionnelle par l’administrateur global est autorisée selon DEC-007 et ne constitue pas un droit de création prestataire.

**AT-19 — Recette de création :** création par client habilité sur son site autorisée ; création par prestataire ou agent refusée ; création sur un site d’un autre client refusée ; auteur réel et contexte conservés dans l’historique. La replanification suit DEC-005 ; les autres modifications après affectation restent à préciser.


## Approfondissement du modèle et des permissions

**DEC-004 — Circuit confirmé :** le client crée, le responsable prestataire affecte, l’agent réalise et soumet, le client valide directement ou demande une reprise.

- [Modèle de données détaillé](MODELE_DONNEES.md) : entités, contraintes, historique, transactions et recette.
- [Permissions et modifications](PERMISSIONS.md) : actions confirmées, périmètres et propositions pour les exceptions.

Les décisions DEC-005 à DEC-007 confirment les responsabilités de replanification, annulation et intervention exceptionnelle de l’administrateur. Les règles confirmées DEC-001 à DEC-007 priment sur les anciennes hypothèses.


## Décisions DEC-005 à DEC-007 — confirmées par le porteur
- **DEC-005 — Replanification :** le prestataire demande un changement de créneau ; le client confirme. La demande seule ne modifie pas le planning en vigueur.
- **DEC-006 — Annulation :** le client décide ; le prestataire peut demander l’annulation, sans l’exécuter lui-même.
- **DEC-007 — Administration exceptionnelle :** l’administrateur global peut intervenir exceptionnellement pour un client, notamment créer ou valider, avec motif obligatoire et historique de l’acteur réel. Les règles d’intégrité, de version et d’interdiction d’autovalidation continuent de s’appliquer.
Les états permettant ces actions, les délais de réponse et les modalités de notification restent des précisions à finaliser. Ces décisions ne permettent pas de réécrire un compte rendu soumis ou une décision historique.
