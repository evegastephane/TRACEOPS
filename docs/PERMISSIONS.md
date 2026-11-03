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
| Créer intervention | C, dans son périmètre | — | — | Intervention exceptionnelle à préciser |
| Définir créneau et attendus | P | Lecture ; demande de changement P | Lecture utile | Pouvoir exceptionnel à préciser |
| Affecter / réaffecter | Lecture P | C pour affecter ; réaffectation P | Lecture propre | Pouvoir exceptionnel à préciser |
| Démarrer | Lecture | Lecture | C | Supervision |
| Renseigner compte rendu | Lecture | Lecture | C, propre brouillon | Lecture globale ; pas de falsification |
| Soumettre | — | — | C | Pas de soumission sous identité d’un agent |
| Valider / demander reprise | C, habilitation de contrôle | — | — | Intervention exceptionnelle à préciser |
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

## 5. Annulation et empêchement — propositions
Le client décide de l’annulation avec motif. Le prestataire peut signaler son impossibilité d’exécuter et demander une annulation ou un changement ; cette demande ne vaut pas annulation.
Cette proposition restreint la règle initiale du SRS autorisant l’annulation au prestataire : le point doit être arbitré avant codage.
Les données déjà produites restent conservées. Une annulation n’est ni une validation ni une résolution d’anomalie. Une mission en contrôle ne disparaît pas de la file sans événement explicite.

## 6. Reprises
Le client saisit un motif compréhensible. Le responsable prestataire organise la reprise et, si la règle le permet, réaffecte. L’agent ouvre une nouvelle révision et soumet ; le client décide à nouveau.
Proposition : délai de reprise, nouvelle échéance et éventuel coût restent des champs ou règles à cadrer ; aucune facturation implicite.

## 7. Administrateur global
Le porteur a demandé le contrôle global de la plateforme. Les capacités de supervision et de gestion des accès sont explicites. Il reste à décider s’il peut créer ou valider exceptionnellement pour le compte d’un client.
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
- Qui peut replanifier et jusqu’à quel état ?
- Le prestataire demande-t-il l’annulation au client, ou peut-il annuler dans certains cas ?
- L’administrateur global peut-il créer/valider exceptionnellement pour un client ?
- Le fonctionnement sans connexion est-il indispensable au pilote ?
