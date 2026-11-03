# TRACEOPS — Product Requirements Document

> Version 0.2 — 3 novembre 2026 — Projet de travail, non approuvé.
> Source : « TRACEOPS — Présentation du projet et cadrage fonctionnel initial », v0.1, fichier fourni par le porteur du projet.
> Convention : **[S]** = explicitement décrit dans la source ; **[P]** = proposition à valider ; **[O]** = question ouverte. Une proposition ne constitue pas une décision approuvée.


## 1. Positionnement et résultat attendu
[S] Une plateforme de suivi et de contrôle d’interventions pour des clients travaillant déjà avec leurs prestataires.
[P] Le MVP doit permettre à une petite cohorte pilote d’utiliser réellement le parcours planifier → affecter → réaliser → soumettre → contrôler → valider ou reprendre, sur ordinateur et téléphone.
[P] Le succès produit se mesure par les objectifs OBJ-01 à OBJ-05 du BRS, puis par la capacité des agents à terminer les parcours sans assistance. Aucun trafic ni revenu cible n’est connu.

## 2. Utilisateurs et besoins
| Profil | Besoin principal | Écran d’entrée proposé |
|---|---|---|
| Client | Voir ce qui est attendu, accepté et problématique | Vue de ses sites et interventions |
| Responsable prestataire | Affecter et traiter retards/reprises | Planning et file d’exceptions |
| Agent | Trouver sa mission et rendre compte rapidement | Mes missions du jour |
| Administrateur global [S, demande complémentaire] | Contrôler toutes les organisations, les accès et les opérations | Console globale avec contexte explicite |
| Contrôleur client [P] | Décider avec un compte rendu complet | File des interventions à contrôler |
[P] Un utilisateur ayant plusieurs appartenances choisit son contexte de travail. Le contexte est toujours affiché et ne remplace jamais les contrôles serveur.

## 3. Périmètre MVP proposé
| Epic | Livrable utilisable | Priorité |
|---|---|---|
| EP-01 Accès et périmètres | Invitations, connexion, rôles, relations client–prestataire et accès par site | Must |
| EP-02 Référentiels | Organisations, sites, zones, prestations, modèles de tâches | Must |
| EP-03 Planification | Création manuelle datée, affectation à un agent, replanification tracée | Must |
| EP-04 Terrain | Missions, tâches, observations, photos si exigées, blocage et soumission | Must |
| EP-05 Qualité | Contrôle, validation, reprise, anomalies et résolution | Must |
| EP-06 Pilotage | Listes filtrées, indicateurs calculés et historique | Must |
| EP-07 Récurrence | Génération d’interventions récurrentes avec exceptions | Should, hors MVP proposé |
| EP-08 QR | Ouverture d’une zone puis des missions autorisées | Could, après pilote |
| EP-09 Hors ligne | Stockage local et synchronisation gérant les conflits | À décider avant engagement |
[P] Un calendrier graphique avancé, les exports et les notifications push sont différés. Le MVP utilise des listes et des alertes dans l’application ; un canal d’invitation sécurisé reste nécessaire.

## 4. Parcours et critères d’acceptation
### US-01 — Préparer un site (EP-01, EP-02)
En tant que client habilité, je crée un site et ses zones, puis j’y autorise un prestataire.
- Étant connecté au client A, quand j’ajoute un site, alors il appartient à A.
- L’ajout d’un prestataire concurrent ou d’une relation non autorisée est refusé.
- Un prestataire ne voit que les informations des sites nécessaires à ses prestations.
### US-02 — Planifier et affecter (EP-03)
[S, DEC-003] En tant que client habilité, je crée une intervention dans mon périmètre. [P] Le responsable prestataire affecte ensuite l’intervention à un agent de son entreprise.
- La mission précise site, zone, prestation, début, fin, consignes et tâches.
- Un agent d’une autre entreprise ne peut pas être affecté.
- Une affectation ou replanification produit un événement d’historique.
### US-03 — Réaliser sur téléphone (EP-04)
En tant qu’agent affecté, je consulte ma mission, renseigne les tâches et ajoute mes observations.
- Je ne vois pas les missions d’un autre agent sans habilitation explicite.
- Une tâche impossible doit avoir un motif ; elle ne peut pas être présentée comme effectuée.
- Une interruption réseau affiche l’échec ou l’état non enregistré ; aucune réussite fictive.
### US-04 — Soumettre (EP-04)
En tant qu’agent, je déclare une réalisation documentée.
- Les champs requis et les justificatifs configurés sont contrôlés.
- Après confirmation serveur, le statut devient « À contrôler » et la version soumise est figée.
- Un second envoi de la même soumission ne crée pas de doublon.
### US-05 — Contrôler (EP-05)
En tant que contrôleur habilité, je valide ou demande une reprise.
- La décision porte sur la dernière version soumise.
- Une reprise exige un motif et conserve les pièces et réponses initiales.
- Un agent ne peut pas valider son propre compte rendu.
### US-06 — Reprendre (EP-05)
En tant qu’agent responsable, je traite la demande de reprise et soumets à nouveau.
- Le motif de reprise est visible ; la nouvelle version est liée à la précédente.
- La validation nécessite une nouvelle décision ; elle ne découle pas de la seule reprise.
### US-07 — Signaler et résoudre un problème (EP-05)
En tant qu’acteur autorisé, je crée une anomalie avec description et responsable de traitement.
- Le problème reste visible tant qu’il n’est pas résolu et clôturé selon les droits.
- Une validation d’intervention ne ferme pas implicitement le problème.
### US-08 — Suivre les opérations (EP-06)
En tant que client ou responsable, je filtre les interventions et anomalies dans mon périmètre.
- Les compteurs et la liste détaillée utilisent les mêmes filtres et règles de calcul.
- Une intervention en retard reste distincte de son statut métier.
- Les autres clients et prestataires restent invisibles, même par URL directe.

### US-09 — Administrer la plateforme (EP-10)
[S, demande complémentaire] En tant qu’administrateur global, je dispose d’une vue de toutes les organisations et peux gérer les accès et les opérations.
[P] Critères d’acceptation :
- Je recherche un client, un prestataire, un site, un utilisateur ou une intervention, puis ouvre le contexte concerné.
- Je crée, suspends ou réactive des organisations et des membres, gère les relations et attribue les rôles autorisés.
- Je peux planifier, affecter, consulter et contrôler dans tout périmètre ; les mêmes règles de complétude, de version et d’interdiction d’autovalidation s’appliquent.
- Toute action de gestion ou décision globale conserve l’administrateur réel, la cible, la date et le motif pour les actions sensibles.
- Je ne peux pas modifier silencieusement un compte rendu soumis, supprimer une décision ni réécrire l’historique.
- Une suspension bloque les nouveaux accès et affiche ses effets sur les missions en cours.
[P] **EP-10 Console administrateur — Must** : vue globale, gestion des organisations et des accès, recherche opérationnelle, supervision des anomalies, consultation de l’audit et actions contrôlées. L’espace prestataire EP-03/05/06 reste distinct et limité à son entreprise et à ses relations autorisées.

## 5. Expérience et contenu proposés
- Navigation terrain : Missions → détail → compte rendu → confirmation serveur.
- Détail : lieu, horaire local avec fuseau, consignes, tâches, pièces, statut et historique utile.
- Tâches en langage clair : « À faire », « Effectuée », « Impossible », avec motif.
- Contrôle : synthèse du compte rendu, photos accessibles, motif et deux décisions explicites.
- Sauvegarde : indicateurs « Enregistrement… », « Enregistré », « Échec — réessayer ». Aucun mode hors ligne promis.
- États à prévoir : aucune mission, aucun résultat après filtre, compte sans périmètre, invitation expirée, accès retiré, pièce rejetée, conflit de modification et session expirée.
- Téléphone : formulaires courts, boutons tactiles, libellés visibles, photos compressées, reprise de saisie tant que la page reste ouverte.
[P] Des brouillons exclusivement en mémoire peuvent être perdus si la page se ferme ; le MVP doit l’indiquer avant de quitter une saisie non sauvegardée. La persistance locale exige une décision spécifique sur appareils partagés et données sensibles.

## 6. Mesure produit
[P] Événements : intervention_created, assignment_changed, report_submitted, review_decided, anomaly_resolved. L’analytique ne copie ni texte libre ni photographie.
[P] Mesurer : taux de parcours terminés sans aide, délai médian et p95 soumission→décision, taux de reprises, couverture des comptes rendus.
[P] Distinguer annulations, périodes incomplètes et absence de données des résultats nuls. Comparer aux pratiques du pilote, pas à des objectifs inventés.

## 7. Ordre de livraison proposé
1. Cadrage approuvé : permissions, validation, réseau, volumes, conservation et responsabilités.
2. Tranche verticale : un site, une mission affectée, un compte rendu, un contrôle et un historique sécurisé.
3. Exceptions : blocages, reprises, anomalies, conflits et pièces.
4. Pilotage : filtres, indicateurs et gestion quotidienne des référentiels.
5. Pilote : formation, données réelles minimisées, assistance et revue d’usage.
[P] Pas de date d’engagement avant connaissance de l’équipe et estimation des lots.

## 8. Conditions de lancement
[P] Parcours de référence et exceptions testés ; aucun défaut critique d’isolation ; restauration d’une sauvegarde démontrée ; supervision et procédure de support disponibles ; responsables métier formés.
[O] Le pilote, l’hébergement et la politique de conservation sont à confirmer. Hors ligne indispensable ou contrôle à plusieurs niveaux entraîneraient une révision du MVP et de son estimation.

## 9. Approfondissement produit — v0.2
Le [référentiel détaillé](REFERENTIEL_ARCHITECTURE.md), chapitres 9 et 17, complète les parcours et la gestion des situations dégradées. La [couverture des concepts](COUVERTURE_CONCEPTS.md) relie ces choix à l’ensemble du dossier.

[P] **US-10 — Comprendre l’état d’une action :** après une sauvegarde ou soumission, l’utilisateur distingue enregistrement confirmé, résultat inconnu et échec. Une réponse perdue n’entraîne pas un second compte rendu ; le réessai réutilise l’opération initiale. Critère : couper le réseau après commit puis réessayer produit un seul effet.
[P] **US-11 — Administrer avec visibilité des conséquences :** avant suspension d’une organisation, l’administrateur voit les missions actives concernées et saisit un motif. La politique de traitement de ces missions reste une décision métier ; aucune annulation automatique implicite.
[P] **US-12 — Consulter un indicateur compréhensible :** afficher population, période et fraîcheur ; distinguer absence de données et zéro. Une éventuelle projection différée ne doit pas servir à autoriser les transitions métier.

### Critères de revue des quatre espaces
Client : visibilité et décision de contrôle. Prestataire : organisation des équipes et traitement des exceptions. Agent : clarté des tâches et confirmation de sauvegarde sur téléphone. Administrateur : périmètre global, pouvoirs explicites et audit. La même règle métier s’applique à toutes les interfaces qui peuvent l’invoquer.


## Décisions confirmées par le porteur

**DEC-001 — Backend NestJS — accepté.** Le backend sera construit avec NestJS. Le choix ne confirme pas automatiquement les autres outils proposés, le fournisseur d’identité ou l’hébergement.

**DEC-002 — Validation directe par le client — accepté.** Dès la soumission de l’agent, l’intervention est disponible pour le contrôle d’un utilisateur client habilité. Celui-ci valide directement ou demande une reprise motivée. Aucune prévalidation ni approbation du responsable prestataire n’est requise. Le responsable prestataire consulte le résultat et organise les reprises. Après une nouvelle soumission, le client contrôle à nouveau.

Parcours : agent soumet → À contrôler par le client → Validée ou À reprendre → nouvelle soumission si nécessaire.

Cette décision clôt la question du contrôle intermédiaire prestataire. L’intervention exceptionnelle de l’administrateur global est confirmée par DEC-007, avec motif et historique ; elle ne crée pas une étape obligatoire dans le circuit.

**Recette :** une soumission devient immédiatement visible dans la file du client habilité ; la validation client réussit sans action préalable du prestataire ; un responsable prestataire ne peut pas valider via ses droits de prestataire. Une demande de reprise conserve les versions et exige une nouvelle décision client.


**DEC-003 — Création des interventions par le client — accepté.** Le client habilité crée les interventions dans son périmètre. Le responsable prestataire ne dispose pas du droit de création dans le circuit métier ; son rôle proposé est d’organiser et d’affecter les interventions reçues. L’agent réalise et soumet ; le client contrôle directement selon DEC-002. La gestion exceptionnelle par l’administrateur global est autorisée selon DEC-007 et ne constitue pas un droit de création prestataire.

**AT-19 — Recette de création :** création par client habilité sur son site autorisée ; création par prestataire ou agent refusée ; création sur un site d’un autre client refusée ; auteur réel et contexte conservés dans l’historique. La replanification suit DEC-005 ; les autres modifications après affectation restent à préciser.


## Décisions DEC-005 à DEC-007 — confirmées par le porteur
- **DEC-005 — Replanification :** le prestataire demande un changement de créneau ; le client confirme. La demande seule ne modifie pas le planning en vigueur.
- **DEC-006 — Annulation :** le client décide ; le prestataire peut demander l’annulation, sans l’exécuter lui-même.
- **DEC-007 — Administration exceptionnelle :** l’administrateur global peut intervenir exceptionnellement pour un client, notamment créer ou valider, avec motif obligatoire et historique de l’acteur réel. Les règles d’intégrité, de version et d’interdiction d’autovalidation continuent de s’appliquer.
Les états permettant ces actions, les délais de réponse et les modalités de notification restent des précisions à finaliser. Ces décisions ne permettent pas de réécrire un compte rendu soumis ou une décision historique.
