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
| Q-02 | Qui crée les interventions et les attendus ? | Client définit attendus ; prestataire planifie | Permissions et responsabilités |
| Q-03 | Qui contrôle et valide ? Combien de niveaux ? | Un contrôleur client, distinct du déclarant | Workflow, délais et modèle |
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
