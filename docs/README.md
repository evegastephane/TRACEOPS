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


## Consolidation des réponses du pilote
Voir [Décisions pilote](DECISIONS_PILOTE.md) : secteurs configurables et salles détaillées ; volumes initiaux de 10 clients, 10 prestataires, 10 sites et 10 agents ; nettoyage et maintenance ; missions à un ou plusieurs agents ; chevauchements interdits ; photos avant/après ; QR dès le lancement ; contrôleurs par site ; reprises ciblées ; notifications dans l’application ; PDF ; français/anglais ; durée de conservation annoncée de 9 mois ; porteur seul administrateur et support.

Les décisions explicites PIL-01 à PIL-25 remplacent les propositions antérieures incompatibles. Le hors ligne, les modalités de connexion, la récurrence, la responsabilité de soumission collective et les détails de conservation restent à clarifier. Les propositions d’annexes antérieures sur un agent unique, le QR différé ou le simple avertissement de conflit horaire sont obsolètes.

## Clarifications finales — PIL-26 à PIL-35
- **PIL-26 :** pilote au Cameroun ; fuseau du site proposé Africa/Douala, instants stockés en UTC.
- **PIL-27 :** React/TypeScript, NestJS et PostgreSQL confirmés ; aucun S3. Proposition technique : photos binaires dans PostgreSQL, téléchargement protégé par l’API.
- **PIL-28 :** fonctionnement en ligne ; hors ligne non indispensable au lancement.
- **PIL-29 :** invitations pour clients et prestataires ; agents ajoutés directement par leur responsable ; connexion par mot de passe. Identifiant agent sans courriel obligatoire et changement du secret initial proposés.
- **PIL-30 :** appartenance possible à plusieurs organisations, avec contexte et droits séparés.
- **PIL-31 :** le porteur développe et maintient ; compétences précises non détaillées, aucun calendrier déduit.
- **PIL-32 :** récurrence dès le lancement.
- **PIL-33 :** clôture d’anomalie confirmée par le client.
- **PIL-34 :** un agent responsable soumet le compte rendu collectif, avec contributions et auteurs conservés.
- **PIL-35 :** lecture des seules interventions du prestataire pendant 9 mois après contrat. Conservation annoncée des données également de 9 mois ; point de départ et articulation des deux durées à définir avant purge.
Ces décisions remplacent les propositions incompatibles. Les détails techniques figurent dans [ADR-006](ADR-006_SOCLE_PILOTE.md). Aucun stockage S3 ni fournisseur d’identité externe n’est requis.
