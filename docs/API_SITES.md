# API des sites et des salles

Lot développé localement. Les écrans de gestion des lieux restent à relier à cette API.

## Routes
Toutes les routes utilisent la session authentifiée et le contexte X-Organization-Id. Les POST exigent également X-Traceops: request et l’origine autorisée.

- GET /api/v1/sites : sites visibles dans le contexte actif.
- POST /api/v1/sites : client responsable, champs name, sector, timezone facultatif (Africa/Douala par défaut).
- GET /api/v1/sites/:id/zones : lieux du site autorisé.
- POST /api/v1/sites/:id/zones : client responsable, champs code, name, kind, parentId facultatif.
- POST /api/v1/sites/:id/providers : rattachement d’un prestataire actif, champ providerId.
- POST /api/v1/sites/:id/controllers : habilitation d’un contrôleur du client, champ membershipId.

Types de lieux : BUILDING, FLOOR, AREA, ROOM, EQUIPMENT. Les niveaux intermédiaires peuvent être omis ; un parent doit se situer plus haut dans la hiérarchie. Les codes sont uniques au sein du site. Un parent provenant d’un autre site est rejeté.

## Permissions
Le responsable client gère les sites de son organisation. Le contrôleur client lit uniquement ses sites habilités. Le responsable prestataire lit uniquement les sites auxquels un accord actif le rattache. L’agent ne bénéficie d’aucun accès général aux sites : son futur accès passera par ses missions.
L’administrateur peut intervenir globalement, avec motif obligatoire pour chaque écriture. L’audit conserve ce motif, le contexte et l’acteur réel.

## Limites
La suppression, l’archivage, le déplacement des lieux et la révocation des habilitations ne sont pas exposés dans ce lot. Il n’existe pas encore d’interface de gestion des lieux. Le schéma des interventions et leurs écrans constituent la prochaine tranche métier.
