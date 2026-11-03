# API des sites et des salles

API reliée à la rubrique bilingue Sites et salles pour la création et la consultation des sites et lieux.

## Routes
Toutes les routes utilisent la session authentifiée et le contexte X-Organization-Id. Les POST exigent également X-Traceops: request et l’origine autorisée.

- GET /api/v1/sites : sites visibles dans le contexte actif.
- POST /api/v1/sites : client responsable, champs name, sector, timezone facultatif (Africa/Douala par défaut).
- GET /api/v1/sites/:id/zones : lieux du site autorisé.
- POST /api/v1/sites/:id/zones : client responsable, champs code, name, kind, parentId facultatif.
- POST /api/v1/sites/:id/providers : rattachement d’un prestataire actif, champ providerId.
- POST /api/v1/sites/:id/controllers : habilitation d’un contrôleur du client, champ membershipId. La liste GET /api/v1/organization/members fournit cet identifiant dans membership_id ; id reste l’identifiant utilisateur.

Types de lieux : BUILDING, FLOOR, AREA, ROOM, EQUIPMENT. Les niveaux intermédiaires peuvent être omis ; un parent doit se situer plus haut dans la hiérarchie. Les codes sont uniques au sein du site. Un parent provenant d’un autre site est rejeté.

## Permissions
Le responsable client gère les sites de son organisation. Le contrôleur client lit uniquement ses sites habilités. Le responsable prestataire lit uniquement les sites auxquels un accord actif le rattache. L’agent ne bénéficie d’aucun accès général aux sites : son futur accès passera par ses missions.
L’administrateur peut intervenir globalement, avec motif obligatoire pour chaque écriture. L’audit conserve ce motif, le contexte et l’acteur réel.

## Limites
La suppression, l’archivage, le déplacement des lieux et la révocation des habilitations ne sont pas exposés dans ce lot. Les rattachements prestataires et habilitations des contrôleurs restent disponibles uniquement par API. Le schéma des interventions et leurs écrans constituent la prochaine tranche métier.

## Interface Sites et salles
Le responsable client peut créer un site (entreprise, hôpital, hôtel, immeuble ou activité personnalisée), puis ses lieux. Le fuseau horaire proposé est Africa/Douala. Les catégories enregistrées par l’interface sont `company`, `hospital`, `hotel`, `property` ; une activité personnalisée est conservée telle que saisie. Les valeurs antérieures de sector restent affichées telles quelles.

Les lieux s’affichent avec leur chemin de rattachement, leur type et leur code. La recherche porte sur le nom, le code et les ancêtres. Le sélecteur de parent ne propose que les types supérieurs et se réinitialise lors du changement de type. Le serveur reste l’autorité pour toutes les validations.

Le changement d’organisation réinitialise les détails du site. Une mutation en cours bloque ce changement et la navigation entre rubriques. Les erreurs de chargement proposent une relance sans afficher un faux état vide ; une erreur de création conserve la saisie. Les contrôleurs et responsables prestataires consultent seulement leurs sites autorisés, sans boutons de création. L’administrateur doit saisir un motif pour chaque création.
