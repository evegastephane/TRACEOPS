# Documentation TRACEOPS

Dossier de conception — versions de travail. Le cadrage précède le développement ; les propositions restent à valider.

## Ordre de lecture
1. [Plan de conception](PLAN.md)
2. [BRS — besoins métier](BRS.md)
3. [PRD — produit et parcours](PRD.md)
4. [SRS — exigences et recette](SRS.md)
5. [Architecture logicielle](ARCHITECTURE.md)
6. [Référentiel détaillé — 18 chapitres](REFERENTIEL_ARCHITECTURE.md)
7. [Matrice de couverture des concepts](COUVERTURE_CONCEPTS.md)
8. [Questions, décisions et traçabilité](CADRAGE.md)

Le référentiel traite les concepts de la roadmap Software Architect et leur application à TRACEOPS : définitions, exemples, compromis, alternatives et vérifications. Les outils étudiés ne sont pas tous retenus pour le produit. Les quatre espaces sont client, prestataire, agent et administrateur global.

## Conventions
[S] besoin issu du cadrage ou d’une demande explicite ; [P] proposition ; [O] question ouverte. Les résultats de tests ne sont pas encore disponibles. Les choix de stack, volumes, budget, calendrier, conservation et hors ligne restent à confirmer.


## Approfondissement du modèle et des permissions

**DEC-004 — Circuit confirmé :** le client crée, le responsable prestataire affecte, l’agent réalise et soumet, le client valide directement ou demande une reprise.

- [Modèle de données détaillé](MODELE_DONNEES.md) : entités, contraintes, historique, transactions et recette.
- [Permissions et modifications](PERMISSIONS.md) : actions confirmées, périmètres et propositions pour les exceptions.

Les permissions initialement proposées de l’administrateur ne constituent pas une décision finale sur la création ou validation pour un client. L’annulation et la replanification restent à arbitrer ; PERMISSIONS.md expose les options en attente. Les règles confirmées DEC-001 à DEC-004 priment sur les anciennes hypothèses.
