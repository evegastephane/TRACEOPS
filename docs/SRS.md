# TRACEOPS — Software Requirements Specification

> Version 0.2 — 3 novembre 2026 — Projet de travail, non approuvé.
> Source : « TRACEOPS — Présentation du projet et cadrage fonctionnel initial », v0.1, fichier fourni par le porteur du projet.
> Convention : **[S]** = explicitement décrit dans la source ; **[P]** = proposition à valider ; **[O]** = question ouverte. Une proposition ne constitue pas une décision approuvée.


## 1. Portée et conventions
Cette spécification traduit les besoins du BRS et les parcours du PRD en exigences vérifiables. Toutes les précisions absentes de la note source sont des propositions [P].
**FR** : exigence fonctionnelle ; **RG** : règle métier ; **NFR** : qualité ou exploitation.
[P] L’autorisation porte sur l’utilisateur, son appartenance active, l’organisation cliente, le prestataire, le site, le rôle et, pour un agent, l’affectation. Un identifiant difficile à deviner ne constitue pas une autorisation.

## 2. Exigences fonctionnelles
| ID | Comportement exigé proposé | Vérification |
|---|---|---|
| FR-01 | Inviter un utilisateur dans une organisation avec rôle et périmètre ; jeton à usage unique expirant | Acceptation unique, expiration et retrait testés |
| FR-02 | Authentifier et invalider les sessions lors d’un retrait d’accès | Ancienne session refusée après révocation |
| FR-03 | Restreindre chaque lecture et écriture au périmètre courant autorisé | Tests inter-client, inter-prestataire, inter-site et inter-agent |
| FR-04 | Gérer organisations, appartenances et relations client–prestataire actives | Impossible d’affecter hors relation autorisée |
| FR-05 | Gérer sites, fuseau IANA et zones hiérarchiques sans cycle | Cycle rejeté ; zone d’un autre site rejetée |
| FR-06 | Définir prestations, consignes et tâches versionnées, avec justificatifs configurables | Modifier un modèle ne modifie pas l’attendu historique |
| FR-07 | Créer une intervention datée avec instantané de la définition attendue | Début ≥ fin rejeté ; historique inchangé après édition du modèle |
| FR-08 | Affecter un agent actif du prestataire et tracer toute réaffectation | Agent externe refusé ; conflit horaire signalé |
| FR-09 | Lister les missions de l’agent et enregistrer réponses, observations et pièces | Seules les missions autorisées sont accessibles |
| FR-10 | Signaler un blocage motivé puis une levée motivée | Statut précédent restauré et événements conservés |
| FR-11 | Soumettre une version complète et la figer atomiquement | Double clic sans doublon ; soumission incomplète refusée |
| FR-12 | Valider ou demander une reprise avec contrôle de version | Contrôle concurrent ou périmé refusé ; reprise motivée |
| FR-13 | Ouvrir une nouvelle version pour la reprise et conserver les précédentes | Les deux versions et leurs décisions sont consultables |
| FR-14 | Gérer anomalies, responsable, résolution motivée et clôture | Historique complet ; clôture interdite au rôle non autorisé |
| FR-15 | Fournir listes filtrées et indicateurs cohérents dans le périmètre autorisé | Compteurs réconciliés avec les listes |
| FR-16 | Journaliser acteurs, événements, dates, anciennes/nouvelles valeurs pertinentes | Mutation métier et événement validés dans la même transaction |
| FR-17 | Archiver les référentiels utilisés plutôt que supprimer leur historique | Référentiel archivé absent des nouvelles sélections mais conservé dans les interventions |

**FR-18 [S, demande complémentaire ; précisions P] — Administration globale.** Fournir un espace réservé aux administrateurs de plateforme permettant de lire tous les périmètres et gérer organisations, relations, utilisateurs, rôles, sites et opérations. Les décisions métier globales restent soumises aux invariants FR-11/12/16. Recette : compte administrateur MFA, recherche multi-client, suspension d’un compte, décision motivée et audit ; tous ces endpoints refusés aux autres rôles.

## 3. Matrice des capacités proposée
C = créer, L = lire, M = modifier, D = décider ; « périmètre » reste obligatoire pour chaque case.
| Ressource / action | Client gestionnaire | Contrôleur client | Responsable prestataire | Agent |
|---|---|---|---|---|
| Sites / zones | C,L,M | L | L nécessaires | L nécessaires à sa mission |
| Relation client–prestataire | C,L,M | L | L propre relation | — |
| Membres de son organisation | C,L,M | — | C,L,M propres membres | Profil propre, champs limités |
| Prestations et attendus | C,L,M | L | L ; proposition de changement ultérieure | L liés aux missions |
| Interventions | L ; annulation autorisée | L à contrôler | C,L,M avant démarrage | L affectées |
| Affectations | L | L | C,L,M | L propre affectation |
| Compte rendu | L | L | L | C,M brouillon propre ; soumettre |
| Contrôle | L | D | L | L décision liée à sa mission |
| Anomalies | C,L,M,clôturer | C,L,clôturer | C,L,M,résoudre | C,L liées à ses missions |
| Historique | L périmètre | L périmètre de contrôle | L périmètre | L utile aux missions |
[P] Le rôle contrôleur est une capacité cumulable avec gestionnaire client.
[S, demande complémentaire] **Administrateur global de plateforme** : rôle supplémentaire transversal. Il dispose de C/L/M sur les référentiels et les accès de tous les clients et prestataires, de la gestion des affectations et anomalies et de la capacité de contrôle D. [P] Il peut consulter tous les comptes rendus, mais ne remplace pas leur auteur pour éditer les versions soumises. Les invariants de séparation déclarant/contrôleur s’appliquent aussi à lui. MFA et journalisation obligatoires ; motif requis pour suspension, changement de rôle et décision de contrôle.
[P] Ce rôle applicatif est distinct du compte technique de déploiement ou de base de données : aucune attribution implicite du rôle global aux exploitants.
[O] Création d’interventions par le client et approbation des changements d’attendus restent à arbitrer. Le contrôle direct par le client est confirmé par DEC-002 ; la délégation au prestataire n’est pas retenue dans ce circuit.

## 4. Cycle de vie proposé
| État source | Commande | État cible | Autorisé / conditions |
|---|---|---|---|
| BROUILLON | Planifier | PLANIFIEE | Responsable ; lieu, tâches et créneau valides |
| PLANIFIEE | Affecter | AFFECTEE | Responsable ; agent actif et autorisé |
| AFFECTEE | Démarrer | EN_COURS | Agent affecté |
| AFFECTEE / EN_COURS / A_REPRENDRE | Bloquer | BLOQUEE | Agent affecté ; motif ; état de retour conservé |
| BLOQUEE | Lever le blocage | État de retour | Agent ou responsable ; motif, affectation encore valide |
| EN_COURS / A_REPRENDRE | Soumettre | A_CONTROLER | Agent ; FR-11 ; version du compte rendu valide |
| A_CONTROLER | Valider | VALIDEE | Contrôleur habilité distinct du soumetteur |
| A_CONTROLER | Demander reprise | A_REPRENDRE | Contrôleur ; motif requis |
| BROUILLON / PLANIFIEE / AFFECTEE / BLOQUEE / A_REPRENDRE | Annuler | ANNULEE | Client gestionnaire ou responsable ; motif |
[P] EN_COURS ne s’annule qu’après blocage motivé ; A_CONTROLER ne s’annule pas dans le MVP. VALIDEE et ANNULEE sont terminales ; une correction exceptionnelle crée un événement correctif autorisé, sans réécrire le passé.
[P] Réaffectation en AFFECTEE ou BLOQUEE seulement ; toute autre situation exige d’abord un blocage. Une reprise réutilise l’intervention et crée une version de compte rendu.
[O] Ces choix doivent être éprouvés avec le pilote, notamment annulation pendant contrôle, réouverture et remplacement d’un agent absent.
[P] Anomalie : OUVERTE → EN_TRAITEMENT → RESOLUE → CLOTUREE ; réouverture de RESOLUE/CLOTUREE vers EN_TRAITEMENT avec motif par client habilité. Responsable prestataire résout ; client ou contrôleur clôture.

## 5. Règles de gestion
- **RG-01** Une intervention appartient à un client, un site, un prestataire autorisé et une prestation. La zone appartient au même site.
- **RG-02** Les membres du prestataire ne voient aucune intervention d’un concurrent. L’agent ne lit que les missions affectées et les éléments nécessaires.
- **RG-03** L’intervenant attendu est un agent responsable unique dans le MVP. Un conflit horaire affiche un avertissement ; il ne bloque pas tant que la règle n’est pas confirmée.
- **RG-04** À la soumission, chaque tâche est EFFECTUEE ou IMPOSSIBLE. IMPOSSIBLE exige un motif, ouvre une anomalie liée et laisse la décision finale au contrôleur. Les preuves requises ne sont exigées que pour les tâches effectuées ; une impossibilité n’est jamais un achèvement.
- **RG-05** Le compte rendu soumis est immuable. Une reprise produit une nouvelle révision ; le contrôle référence exactement la révision soumise.
- **RG-06** La validation nécessite une décision explicite et n’est jamais déduite d’une photo, d’un QR, d’un horaire ou d’une checklist.
- **RG-07** Retard = fin prévue dépassée et état parmi PLANIFIEE, AFFECTEE, EN_COURS, BLOQUEE, A_REPRENDRE. A_CONTROLER est suivi séparément par délai de contrôle. Une soumission tardive reste mesurable par sa date même après validation.
- **RG-08** Les instants sont stockés en UTC ; le fuseau IANA du site règle la saisie et l’affichage. Début et fin sont des instants ; les heures locales ambiguës doivent être résolues explicitement.
- **RG-09** Fin de relation client–prestataire : bloquer nouvelles affectations, révoquer l’accès opérationnel et conserver l’historique côté client. Accès historique du prestataire après fin de contrat : ouvert, refus par défaut en attendant arbitrage.
- **RG-10** Archivage interdit les nouvelles utilisations. Suppression physique des preuves, comptes et événements suit une politique de conservation à définir ; l’immuabilité applicative ne signifie pas conservation infinie.

## 6. Données et contraintes
| Entité | Champs structurants / invariants proposés |
|---|---|
| Organization | id, type CLIENT ou PRESTATAIRE, nom, état |
| User / Membership | identité externe ; organisation, rôle, état ; unicité utilisateur–organisation |
| Site / Zone | client_id, nom, fuseau ; zone.site_id, parent de même site et sans cycle |
| ServiceAgreement | client_id, provider_id, site_id, prestation, période, état |
| TaskTemplateVersion | prestation, version, tâches, consignes, exigences de preuve |
| Intervention | contexte client/site/prestataire/accord, instantané attendu, début/fin, état, version de concurrence |
| Assignment | intervention, agent, début/fin de validité, auteur ; un responsable courant |
| ReportRevision / TaskResponse | intervention, numéro, auteur, état brouillon/soumis, réponses, dates |
| Evidence | contexte, révision, clé objet privée, type, taille, empreinte, état de sécurité |
| Review | révision soumise, contrôleur, décision, motif, date ; une décision finale par révision |
| Anomaly | contexte, intervention, tâche éventuelle, description, responsable, état, résolution |
| AuditEvent | contexte, acteur, action, ressource, date serveur, identifiant de corrélation |
[P] Champs obligatoires, index et contraintes de cohérence appliqués aussi en base ; pas seulement dans les formulaires.
[O] Conservation par catégorie, anonymisation, information des personnes et région d’hébergement exigent une décision fondée sur le pilote et le cadre applicable.

## 7. Contrats d’interface proposés
API HTTP JSON sous /api/v1 ; authentification par session sécurisée ; pagination bornée.
- GET /interventions?site_id=&status=&from=&to=&cursor= : liste autorisée, taille maximale 100.
- POST /interventions : crée dans un accord autorisé ; 201 et identifiant.
- POST /interventions/{id}/assignments : affectation contrôlée.
- PATCH /interventions/{id}/report-draft : sauvegarde serveur avec version attendue.
- POST /interventions/{id}/submissions : version attendue + clé d’idempotence.
- POST /interventions/{id}/reviews : révision ciblée, décision et motif.
- POST /interventions/{id}/blocks ; POST /interventions/{id}/unblocks.
- POST /anomalies ; POST /anomalies/{id}/resolutions ; POST /anomalies/{id}/closures.
- POST /evidence/uploads : autorise un dépôt borné ; confirmation et vérification avant rattachement.
[P] Une clé d’idempotence est liée à acteur, contexte, commande et empreinte du corps. Même requête : même résultat ; même clé et corps différent : 409. Mise à jour obsolète : 409 ; corps invalide : 422 ; absence de session : 401 ; ressource hors périmètre : 404 uniforme ; action interdite sur ressource visible : 403.
[P] Un contrat OpenAPI sera produit à l’implémentation ; ceci est une spécification d’interface, pas un contrat généré déjà disponible.

[P] Console globale : endpoints /api/v1/admin dédiés, vérification serveur du rôle global à chaque requête ; GET /admin/organizations, GET /admin/interventions, POST /admin/organizations/{id}/suspensions et gestion des appartenances. Les commandes métier réutilisent les mêmes services et invariants, avec un contexte cible vérifié et l’acteur réel ; aucun indicateur envoyé par le navigateur ne suffit à activer le mode global.

## 8. Exigences non fonctionnelles proposées, à dimensionner
| ID | Cible initiale [P] | Vérification |
|---|---|---|
| NFR-01 Isolation | 0 fuite acceptée entre clients, prestataires et agents | Matrice de tests API, objets et téléchargements |
| NFR-02 Performance | p95 API lecture/écriture hors transfert ≤ 800 ms à 50 utilisateurs actifs concurrents | Test sur 100 000 interventions et filtres usuels ; charge représentative |
| NFR-03 Mobile | Parcours essentiels utilisables à 360 px ; réponse visible aux actions | Recette téléphone et réseau terrain ; objectif chargement principal ≤ 3 s sur profil réseau défini avec le pilote |
| NFR-04 Disponibilité | Cible 99,5 % mensuelle en production, maintenance incluse ; non SLA signé | Sondes externes et budget d’indisponibilité suivi |
| NFR-05 Reprise | RPO ≤ 24 h, RTO ≤ 8 h | Restauration chronométrée avant pilote puis trimestrielle ; durcir selon criticité |
| NFR-06 Pièces | JPEG/PNG/WebP, ≤ 10 Mo par photo et ≤ 10 par révision | Type réel, taille et droits contrôlés ; dépassement refusé |
| NFR-07 Accessibilité | Cible WCAG 2.2 AA pour parcours essentiels | Contrôles automatisés + clavier, focus, lecteurs d’écran |
| NFR-08 Sécurité | TLS, cookies Secure/HttpOnly/SameSite, protections CSRF et limitation de débit | Tests session, injection, uploads et dépendances ; MFA pour rôles privilégiés |
| NFR-09 Traçabilité | Transition métier et audit atomiques ; aucun secret ni photo dans les logs | Tests transactionnels et revue des journaux |
| NFR-10 Cohérence | Transition à effet unique malgré double clic ou concurrence | Tests de concurrence et idempotence |
[P] Les volumes sont des hypothèses de test, pas des besoins établis. Le pilote devra préciser nombre de sites, agents, interventions/jour et taille des justificatifs.

## 9. Plan de recette
| Test | Scénario / résultat attendu |
|---|---|
| AT-01 | Créer→affecter→démarrer→soumettre→valider ; données présentes après reconnexion |
| AT-02 | Soumettre→reprise→nouvelle révision→validation ; ancien compte rendu inchangé |
| AT-03 | Bloquer→lever→soumettre ; motifs et dates conservés |
| AT-04 | Essayer lecture, écriture et téléchargement d’un autre client, concurrent ou agent ; refus systématique |
| AT-05 | Soumettre simultanément deux fois ; un seul effet. Contrôler avec version périmée ; 409 |
| AT-06 | Changer le modèle après planification ; attendu de la mission inchangé |
| AT-07 | Déclarer tâche impossible ; motif/anomalie requis ; aucune validation automatique |
| AT-08 | Couper le réseau pendant sauvegarde ; pas de faux succès ; réessai sans doublon |
| AT-09 | Révoquer un membre ; plus d’accès API ni nouveaux liens de pièce ; lien déjà émis expire rapidement |
| AT-10 | Restaurer base et pièces ; vérifier comptes rendus, décisions et historique cohérents |
| AT-11 | Comparer compteurs et listes par site, prestataire, période et fuseau |
| AT-13 | Administrateur global : accès multi-client autorisé, gestion et décision tracées ; utilisateur normal refusé sur tous les endpoints admin ; compte rendu soumis toujours immuable |
| AT-12 | Charger une pièce interdite ou récupérer une URL objet sans droit ; refus |
[P] Chaque exigence FR possède sa vérification dans le tableau ; la traçabilité consolidée figure dans CADRAGE.md.

## 10. Complément de spécification — v0.2
Le [référentiel détaillé](REFERENTIEL_ARCHITECTURE.md) précise les concepts soutenant ces exigences. Les nouveaux éléments ci-dessous restent proposés [P].

| ID | Exigence complémentaire | Recette attendue |
|---|---|---|
| FR-19 | Conserver le résultat d’une commande idempotente et refuser la même clé avec un autre corps | Réponse perdue après commit puis réessai : un seul effet ; corps différent : 409 |
| FR-20 | Afficher les opérations actives concernées lors d’une suspension globale | Administrateur informé ; accès retirés et historique conservé ; aucun traitement implicite des missions |
| FR-21 | Associer chaque indicateur à population, période, fuseau et date de rafraîchissement | Cas nul, vide, tardif, annulé et repris correctement distingués |
| NFR-11 | Borner délais et répétitions des appels externes | Dépendance indisponible : réponse maîtrisée, pas de boucle infinie ni duplication |
| NFR-12 | Maintenir la cohérence des migrations et déploiements | Ancienne/nouvelle version compatibles pendant transition ou interruption explicitement planifiée |
| NFR-13 | Revérifier le contexte sur les tâches différées et les connexions réutilisées | Travail rejoué après révocation et connexion A→B sans fuite |
| NFR-14 | Mettre en place une preuve de restauration incluant base, pièces, droits et travaux différés | Exercice chronométré, objets manquants détectés et aucune duplication d’effet |

### Scénarios complémentaires
AT-14 : réponse perdue, même clé, puis corps différent — FR-19. AT-15 : suspension d’un prestataire avec missions actives — FR-20. AT-16 : réutilisation de connexion et rejeu de tâche après retrait d’accès — NFR-13. AT-17 : dépendance lente et essais bornés — NFR-11. AT-18 : migration compatible et retour applicatif — NFR-12. AT-11 couvre FR-21 et AT-10 est étendu par NFR-14.

### Dossier de preuve
Chaque recette identifie préconditions, données, étapes, résultat attendu, résultat observé et anomalies. Les méthodes sont définies ici ; aucun résultat d’exécution n’est encore revendiqué.


## Décisions confirmées par le porteur

**DEC-001 — Backend NestJS — accepté.** Le backend sera construit avec NestJS. Le choix ne confirme pas automatiquement les autres outils proposés, le fournisseur d’identité ou l’hébergement.

**DEC-002 — Validation directe par le client — accepté.** Dès la soumission de l’agent, l’intervention est disponible pour le contrôle d’un utilisateur client habilité. Celui-ci valide directement ou demande une reprise motivée. Aucune prévalidation ni approbation du responsable prestataire n’est requise. Le responsable prestataire consulte le résultat et organise les reprises. Après une nouvelle soumission, le client contrôle à nouveau.

Parcours : agent soumet → À contrôler par le client → Validée ou À reprendre → nouvelle soumission si nécessaire.

Cette décision clôt la question du contrôle intermédiaire prestataire. Les modalités d’une intervention exceptionnelle de l’administrateur global restent à préciser ; son pouvoir de supervision ne crée pas une étape obligatoire dans le circuit.

**Recette :** une soumission devient immédiatement visible dans la file du client habilité ; la validation client réussit sans action préalable du prestataire ; un responsable prestataire ne peut pas valider via ses droits de prestataire. Une demande de reprise conserve les versions et exige une nouvelle décision client.
