# TRACEOPS — Permissions et règles de modification
Version 0.1 — Règles confirmées et propositions à discuter.

## 1. Circuit confirmé
Client crée → responsable prestataire affecte → agent réalise et soumet → client valide ou demande une reprise.
Le contrôle ne comporte aucune approbation préalable du prestataire. Cette confirmation est enregistrée sous DEC-004 pour l’affectation et la réalisation.

## 2. Conditions communes
Une capacité ne suffit pas : vérifier session, appartenance active, organisation, relation de service, site, ressource, état et version.
Pour un agent, vérifier aussi affectation courante et auteur du brouillon. Un client ne peut pas agir sur un autre client ; un prestataire ne peut pas agir sur un concurrent.
Les droits sont évalués côté serveur à chaque requête. Les listes, compteurs, téléchargements et traitements différés suivent les mêmes frontières.

## 3. Matrice des actions métier
C = confirmé par le porteur ; P = proposition ; — = pas de droit au titre de ce rôle.
| Action | Client habilité | Responsable prestataire | Agent affecté | Administrateur global |
|---|---|---|---|---|
| Créer intervention | C, dans son périmètre | — | — | C, exceptionnellement avec motif et historique |
| Définir créneau et attendus | P | Lecture ; demande de changement P | Lecture utile | Pouvoir exceptionnel à préciser |
| Affecter / réaffecter | Lecture P | C pour affecter ; réaffectation P | Lecture propre | Pouvoir exceptionnel à préciser |
| Démarrer | Lecture | Lecture | C | Supervision |
| Renseigner compte rendu | Lecture | Lecture | C, propre brouillon | Lecture globale ; pas de falsification |
| Soumettre | — | — | C | Pas de soumission sous identité d’un agent |
| Valider / demander reprise | C, habilitation de contrôle | — | — | C, exceptionnellement avec motif et historique |
| Signaler blocage | Lecture | Lecture / traitement P | P | Supervision |
| Consulter historique | P, périmètre | P, périmètre | P, utile à sa mission | Vue globale confirmée ; modalités P |
| Gérer organisations et accès | P, organisation propre | P, équipe propre | Profil propre limité P | Vue et gestion globales confirmées ; modalités P |

Le client créateur peut aussi disposer de la capacité de contrôle. Le compte rendu reste celui de l’agent : les droits cumulés ne permettent pas d’autovalider une réalisation que l’utilisateur a lui-même soumise.

## 4. Politique de modification proposée
| Situation | Proposition | Motif / effet |
|---|---|---|
| Brouillon non publié | Client modifie librement les champs autorisés | Aucune exécution engagée ; validation à la publication |
| Mission publiée non commencée | Client modifie avec motif et incrément de version | Attendu actualisé explicitement ; notification ou signalement aux concernés |
| Mission déjà affectée | Tout changement de lieu, horaire ou tâches exige confirmation de prise en compte selon circuit à définir | Éviter que l’agent exécute une version obsolète |
| Mission en cours | Bloquer les changements silencieux d’attendu | Préférer une modification formalisée ou une nouvelle intervention liée |
| Compte rendu soumis | Aucune édition de cette révision | Correction par reprise et nouvelle version |
| Mission validée | Conserver décision et rapport | Correction exceptionnelle tracée, politique à définir |

Ces propositions ne sont pas des décisions acquises. En attendant arbitrage, l’implémentation ne doit pas autoriser une modification sensible après publication sans règle explicite.

## 5. Annulation et empêchement — responsabilité confirmée
Le client décide de l’annulation avec motif. Le prestataire peut signaler son impossibilité d’exécuter et demander une annulation ou un changement ; cette demande ne vaut pas annulation.
DEC-006 remplace la proposition initiale autorisant le prestataire à annuler : seul le client décide dans le circuit normal.
Les données déjà produites restent conservées. Une annulation n’est ni une validation ni une résolution d’anomalie. Une mission en contrôle ne disparaît pas de la file sans événement explicite.

## 6. Reprises
Le client saisit un motif compréhensible. Le responsable prestataire organise la reprise et, si la règle le permet, réaffecte. L’agent ouvre une nouvelle révision et soumet ; le client décide à nouveau.
Proposition : délai de reprise, nouvelle échéance et éventuel coût restent des champs ou règles à cadrer ; aucune facturation implicite.

## 7. Administrateur global
Le porteur a demandé le contrôle global de la plateforme. Les capacités de supervision et de gestion des accès sont explicites. DEC-007 confirme qu’il peut créer ou valider exceptionnellement pour le compte d’un client, avec motif obligatoire et historique.
Quelle que soit la décision : identité réelle, contexte cible et motif sont conservés. Une telle opération ne s’exécute jamais sous l’identité fictive d’un utilisateur client.
Cette distinction évite qu’un droit global encore proposé soit traité comme une règle approuvée dans les matrices initiales.

## 8. Vérification attendue
PERM-01 : prestataire et agent refusés à la création.
PERM-02 : client hors périmètre refusé même avec un identifiant valide.
PERM-03 : prestataire affecte uniquement ses membres actifs sur son accord.
PERM-04 : agent non affecté refusé à la soumission.
PERM-05 : client habilité valide sans action préalable prestataire.
PERM-06 : prestataire refusé au contrôle métier.
PERM-07 : utilisateur suspendu refusé, y compris sur téléchargement et traitement différé.
PERM-08 : compte rendu soumis protégé contre modification par tous les parcours.
PERM-09 : changement concurrent refusé sans écraser la version récente.
PERM-10 : administration globale refusée aux rôles métier ordinaires.
Tests à exécuter dans le futur backend NestJS ; les mêmes règles doivent couvrir toutes les interfaces.

## 9. Questions regroupées pour la prochaine revue
- Jusqu’à quel état la replanification confirmée par le client reste-t-elle possible ?
- Dans quels états l’annulation décidée par le client reste-t-elle possible ?
- Comment notifier au client une intervention exceptionnelle de l’administrateur autorisée par DEC-007 ?
- Le fonctionnement sans connexion est-il indispensable au pilote ?


## Décisions DEC-005 à DEC-007 — confirmées par le porteur
- **DEC-005 — Replanification :** le prestataire demande un changement de créneau ; le client confirme. La demande seule ne modifie pas le planning en vigueur.
- **DEC-006 — Annulation :** le client décide ; le prestataire peut demander l’annulation, sans l’exécuter lui-même.
- **DEC-007 — Administration exceptionnelle :** l’administrateur global peut intervenir exceptionnellement pour un client, notamment créer ou valider, avec motif obligatoire et historique de l’acteur réel. Les règles d’intégrité, de version et d’interdiction d’autovalidation continuent de s’appliquer.
Les états permettant ces actions, les délais de réponse et les modalités de notification restent des précisions à finaliser. Ces décisions ne permettent pas de réécrire un compte rendu soumis ou une décision historique.

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
