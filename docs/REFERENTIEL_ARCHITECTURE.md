# TRACEOPS — Référentiel détaillé de conception et d’architecture
Version 0.2 — 3 novembre 2026 — document de travail.

## Portée et règles de lecture
Ce référentiel fait partie intégrante du [document d’architecture](ARCHITECTURE.md). Il approfondit les familles et les notions techniques de la [roadmap Software Architect](https://roadmap.sh/software-architect), vérifiées sur son [schéma PDF](https://roadmap.sh/pdfs/roadmaps/software-architect.pdf). Les explications et applications à TRACEOPS ci-dessous sont notre analyse, et non une transcription de la roadmap.

Les choix TRACEOPS sont **proposés**, sauf exigences déjà confirmées dans le BRS et demandes explicites du porteur. La mention d’un outil ne signifie ni achat, ni installation, ni sélection. Les noms historiques présents dans la roadmap sont étudiés comme exemples ; leur disponibilité et leur support devront être vérifiés avant toute adoption.

Chaque chapitre précise les notions, l’application, les compromis et la vérification attendue. Le détail est organisé par responsabilité documentaire : objectifs dans BRS, parcours dans PRD, règles vérifiables dans SRS, décisions techniques ici. Une exigence ne devient approuvée qu’après une décision identifiée. Les résultats de tests restent à produire.

## 1. Architecture, niveaux et responsabilités

### 1.1 Architecture logicielle
L’architecture définit les éléments structurants du système, leurs interactions et les contraintes qui guident les changements. Une liste de technologies ne décrit pas les flux, les responsabilités, la confiance ou la gestion des pannes.

**TRACEOPS :** distinguer interface, services métier, contrôle d’accès, persistance, stockage des preuves et exploitation. La validation d’une intervention est une opération métier avec conditions, effets et historique ; elle doit rester cohérente quelle que soit l’interface utilisée.

**Livrables :** contexte, modules, données, séquences, déploiement, décisions et risques. **Vérification :** un développeur doit pouvoir suivre une soumission depuis l’agent jusqu’à la base et expliquer ce qui se passe si chaque dépendance échoue.

### 1.2 Architecte logiciel
L’architecte relie besoin, coût, délai, qualité et faisabilité. Il prend ou prépare les décisions difficiles à inverser, explicite les alternatives et accompagne leur réalisation. Le rôle exige une compréhension du code et du fonctionnement réel du système.

**TRACEOPS :** le porteur produit tranche les règles métier ; l’architecte expose leur impact et propose une réalisation ; les développeurs participent à la faisabilité. Aucun rôle ne remplace à lui seul l’expertise des agents terrain.

### 1.3 Architecture d’application
Périmètre : structure interne d’un logiciel. Exemple TRACEOPS : modules Operations, Quality, Evidence ; dépendances autorisées ; règles de transaction. Preuve : diagramme de composants, interfaces internes et tests des invariants.

### 1.4 Architecture de solution
Périmètre : coopération entre plusieurs systèmes pour fournir un service. Exemple : TRACEOPS, identité, courriel, stockage, éventuel ERP du client. Il faut documenter contrats, délais, authentification, propriétaires et comportements dégradés. Preuve : diagramme de contexte et scénarios de panne des services externes.

### 1.5 Architecture d’entreprise
Périmètre : cohérence des capacités métier, processus, applications et données à l’échelle de l’organisation. Exemple : éviter que TRACEOPS et un ERP deviennent deux sources contradictoires pour un même prestataire. Le pilote n’exige pas un programme complet d’architecture d’entreprise ; une carte des systèmes et responsables suffit initialement.

### 1.6 Responsabilités opérationnelles de conception
| Responsabilité | Application TRACEOPS | Livrable / vérification |
|---|---|---|
| Recueil des exigences | Entretiens client, prestataire, agents et administrateur ; observation des interventions | Besoin, source, exemple et critère d’acceptation identifiés |
| Décisions techniques | Comparer les options avec les contraintes réelles | ADR avec alternatives, conséquences et réexamen |
| Décisions de conception | Délimiter responsabilités et invariants | Diagrammes et scénarios normaux/dégradés |
| Documentation | Relier décisions, exigences et recettes | Liens BRS→PRD→SRS→architecture→tests |
| Standards | Conventions API, sécurité, données et revue | Contrôles automatisables et exceptions justifiées |
| Collaboration | Arbitrages associant métier, développement et exploitation | Décision datée et responsable nommé |
| Conseil et coaching | Revue de cas concrets, transfert de connaissances | Un autre développeur sait modifier et exploiter le module |

### 1.7 Compétences humaines et arbitrage
**Décider :** préciser problème, options, critères, incertitudes et réversibilité. Une préférence personnelle n’est pas une preuve.
**Simplifier :** limiter les variantes et dépendances qui n’apportent pas de valeur au pilote, tout en préservant les règles essentielles.
**Savoir coder :** vérifier par un prototype qu’une proposition fonctionne, notamment RLS, upload privé et concurrence.
**Communiquer :** adapter le vocabulaire au destinataire ; démontrer le parcours avant les détails techniques.
**Estimer et évaluer :** décomposer le travail, inclure tests, migrations et exploitation ; fournir une fourchette et ses hypothèses.
**Équilibrer :** rendre explicite le compromis, par exemple simplicité de saisie contre quantité de preuves.
**Coacher :** expliquer la raison d’une règle et faire relire son implémentation.
**Marketing du projet :** présenter la valeur et les limites honnêtement ; distinguer démonstration et capacité opérationnelle.

**Exercice TRACEOPS :** présenter deux options de hors ligne, leurs bénéfices, risques sur appareils partagés, coût de synchronisation et effet sur le calendrier. Le choix doit être compris par le porteur avant validation technique.

## 2. Exigences et documentation

### 2.1 Élicitation et vocabulaire métier
Pour chaque processus : identifier déclencheur, acteur, préconditions, données, résultat, exceptions, fréquence et difficulté actuelle. Faire confirmer par un exemple réel.
Exemple : « contrôler » peut signifier contrôle qualité par le client, vérification interne du prestataire ou administration technique. Ces sens doivent être séparés.

**Questions de travail :** qui peut modifier une attente après planification ? Un agent remplacé peut-il encore lire son ancien rapport ? Qui arbitre une tâche impossible ? Que devient une mission après suspension du prestataire ? Chaque réponse doit produire une règle ou une question ouverte.

### 2.2 BRS, PRD, SRS et document d’architecture
- BRS : besoin et valeur métier, parties prenantes, contraintes, objectifs.
- PRD : utilisateurs, périmètre produit, parcours, priorités et critères d’acceptation.
- SRS : exigences numérotées, données, autorisations, transitions, erreurs et qualités mesurables.
- Architecture : solution proposée, frontières, contrats, alternatives et exploitation.

Un besoin tel que « suivre les réalisations » devient un parcours de soumission, puis des règles de version, puis une transaction atomique et des tests de concurrence. Une modification doit traverser cette chaîne.

### 2.3 Qualités et scénarios mesurables
Décrire chaque qualité avec source du stimulus, stimulus, environnement, ressource touchée, réponse et mesure.
**Exemple isolation :** un agent authentifié demande une pièce d’un concurrent ; environnement normal ; l’API et le stockage refusent ; aucun contenu ni métadonnée sensible n’est exposé.
**Exemple performance :** charge de référence du SRS, requête de liste autorisée ; p95 mesuré côté serveur, avec volume et index documentés.
**Exemple reprise :** perte de la base ; restaurer données et références des pièces ; mesurer RPO et RTO réellement atteints.

Les cibles proposées dans SRS ne deviennent pas des SLA signés. Une panne métier d’un seul client compte aussi comme incident, même si l’API globale répond.

### 2.4 ADR : décision d’architecture
Une ADR contient : identifiant, titre, statut, auteur/décideur, date, contexte, contraintes, options, décision, conséquences positives/négatives, preuves et condition de réexamen.
**Exemple :** base partagée avec isolation contextuelle contre base par client. Comparer maintenance, migration, restauration individuelle, coût, résidence et risque de fuite. Aucun score chiffré ne doit être inventé avant connaissance des critères et poids.

### 2.5 Schémas C4 et UML
Le modèle [C4](https://c4model.com/) permet de présenter contexte, conteneurs, composants et, lorsque nécessaire, code. Dans ce vocabulaire, un conteneur représente une unité d’exécution ou de stockage, pas forcément Docker.
**TRACEOPS :** contexte pour les acteurs et dépendances ; conteneurs pour web/API/base/objets ; composants pour Operations/Quality/Access ; séquences pour soumission et contrôle. Les schémas doivent nommer les liens, protocoles et limites de confiance.

UML apporte plusieurs notations : cas d’utilisation pour les interactions, classes pour les relations, états pour le cycle d’intervention, séquences pour l’ordre des messages, activités pour un processus, déploiement pour les nœuds d’exécution. Choisir la notation utile ; ne pas multiplier des diagrammes qui se contredisent. Le Mermaid existant représente des vues de conception, sans prétendre à une conformité complète à UML.

## 3. Programmation et choix de langages
Un langage doit être évalué avec compétences disponibles, bibliothèques, facilité de test, maintenance, déploiement et intégrations. Aucun langage ne garantit à lui seul sécurité, performance ou bonne architecture.

| Famille étudiée | Intérêt / caractéristiques | Compromis et application TRACEOPS |
|---|---|---|
| Java | Écosystème JVM, typage statique, nombreux outils backend | Candidat si équipe expérimentée ; évaluer exploitation et cadence de livraison |
| Kotlin | Langage JVM concis, interopérabilité Java | Pertinent dans une équipe JVM ; conventions de nullabilité et frontières Java à tester |
| Scala | Combinaison objet/fonctionnel et typage expressif | Exige une maîtrise commune ; complexité à justifier par un besoin |
| Python | Expressivité, outils web et traitement de données | Candidat avec Django ; surveiller validation runtime et tâches lourdes |
| Ruby | Langage dynamique, conventions de frameworks web | Candidat avec Rails si compétences disponibles ; disponibilité des intégrations à vérifier |
| Go | Compilation, concurrence intégrée et services compacts | Candidat backend ; mesurer coût de construction des fonctions métier et d’administration |
| JavaScript | Langage du navigateur, possible côté serveur | Validation des entrées et discipline de types nécessaires |
| TypeScript | Vérification statique au-dessus de JavaScript | Candidat commun web/API ; les types ne valident pas le JSON reçu à l’exécution |
| .NET / C# | Plateforme et langage typé pour services et applications | Candidat selon équipe et système client ; distinguer .NET moderne des contraintes d’un ancien .NET Framework |

**Procédure de choix proposée :** implémenter le même petit scénario d’authentification, autorisation, transaction et test avec les deux options réellement maîtrisées ; mesurer effort et exploitation. Ne pas construire neuf prototypes pour neuf langages.
**Critère de sortie :** équipe capable de maintenir le système, dépendances vérifiées, stratégie de mise à jour et environnement reproductible.

## 4. Principes et modèles de conception

### 4.1 Programmation orientée objet — OOP
Regrouper état et comportements autour de responsabilités cohérentes. Encapsulation : interdire le changement direct de statut en dehors des commandes métier. Composition : combiner politique d’accès et service métier plutôt qu’une hiérarchie de rôles rigide.
**TRACEOPS :** une Intervention expose des opérations valides comme soumettre ou demanderReprise. **Risque :** classes volumineuses ou objets sans invariants. **Vérifier :** une transition interdite échoue sans modifier les données.

### 4.2 SOLID
- Responsabilité unique : stockage des photos et décision de contrôle évoluent pour des raisons différentes.
- Ouvert/fermé : introduire un type de preuve via une politique explicite, sans modifier tous les parcours.
- Substitution de Liskov : un stockage alternatif respecte les garanties du contrat, notamment confidentialité et erreurs.
- Ségrégation des interfaces : un service de lecture n’exige pas les capacités de suppression.
- Inversion des dépendances : le métier dépend d’un contrat de dépôt, pas directement d’un SDK fournisseur.

**Compromis :** une interface pour chaque classe augmente le coût sans bénéfice automatique. Introduire une abstraction à une frontière réelle. **Vérification :** remplacer le fournisseur de stockage dans un test sans changer la règle de validation.

### 4.3 DDD — conception pilotée par le domaine
Employer un langage partagé et identifier les contextes métier. Entité : identité persistante ; objet-valeur : sens et égalité par valeur ; agrégat : frontière d’invariants ; service de domaine : règle ne relevant pas d’une seule entité.
**TRACEOPS :** Intervention et ReportRevision ont une identité ; créneau et périmètre sont des objets-valeurs possibles. Operations gère l’exécution ; Quality décide du contrôle ; IdentityAccess autorise. Ces contextes peuvent rester dans un monolithe.
**Risque :** confondre contexte métier et microservice obligatoire. **Vérifier :** les mots utilisés dans le BRS, les commandes et les tests ont le même sens.

### 4.4 TDD — développement piloté par les tests
Écrire un test exprimant une règle, constater son échec pertinent, implémenter le minimum puis améliorer la structure.
**TRACEOPS :** tester « une révision soumise ne peut plus être éditée », puis le cas de reprise et le contrôle concurrent. **Limite :** des tests qui recopient l’implémentation ne prouvent pas le besoin. Associer tests unitaires, intégration réelle en base et parcours utilisateur.

### 4.5 MVC, MVP et MVVM
MVC sépare modèle, vue et contrôleur. MVP sépare la vue et un présentateur qui orchestre son comportement ; ici MVP signifie Model–View–Presenter, distinct du produit minimum viable. MVVM utilise un modèle de présentation exposant état et commandes de la vue.
**TRACEOPS :** isoler affichage des missions, état du formulaire et appels API. Les règles d’autorisation restent serveur. **Vérifier :** changement d’interface sans réécriture des invariants et test des états chargement, erreur, vide, succès et conflit.

### 4.6 Programmation fonctionnelle
Privilégier fonctions pures, données immuables et composition pour les calculs.
**TRACEOPS :** calcul de retard, agrégation d’indicateurs et validation d’un compte rendu peuvent être des fonctions déterministes avec horloge passée explicitement.
**Risque :** cacher des effets de réseau dans des fonctions supposées pures. **Vérifier :** mêmes entrées et même instant de référence donnent le même résultat.

### 4.7 Programmation réactive
Représenter des flux d’événements et leurs transformations dans le temps ; contrôler annulation, erreurs et pression du flux.
**TRACEOPS :** recherche filtrée avec temporisation et annulation d’une requête obsolète ; progression des uploads.
**Risque :** ancienne réponse écrasant un filtre récent, abonnements non libérés. **Vérifier :** saisie rapide et changements de page ne montrent pas des données du mauvais contexte.

### 4.8 Modèle acteurs
Chaque acteur traite des messages et encapsule son état ; utile pour certains problèmes de concurrence et de coordination.
**TRACEOPS :** option future pour des équipements ou processus indépendants nombreux. Non retenu pour le workflow initial : verrouillage/version en base répond plus directement aux invariants.
**Risque :** croire que le modèle élimine doublons, pannes ou persistance. **Réexaminer :** charge et concurrence démontrant un besoin, avec tests de redémarrage et de livraison répétée.

### 4.9 CQRS
Séparer les commandes qui changent l’état et les requêtes de consultation. Cette séparation n’impose ni deux bases, ni event sourcing.
**TRACEOPS :** commandes soumettre/contrôler distinctes des listes et indicateurs. Une seule base initialement ; projection séparée uniquement si le coût des lectures le justifie.
**Risque :** afficher un état ancien après une commande. **Vérifier :** lecture immédiate correcte ou retard explicitement indiqué avec date de rafraîchissement.

### 4.10 ACID
Atomicité : toutes les écritures d’une opération réussissent ou aucune. Cohérence : les invariants sont préservés. Isolation : les transactions concurrentes respectent les garanties choisies. Durabilité : une validation confirmée survit aux pannes couvertes par la configuration.
**TRACEOPS :** soumission = révision figée + changement d’état + audit dans une transaction. Une contrainte unique protège la décision par révision. Le niveau d’isolation ne remplace pas ces contraintes.
**Vérifier :** panne entre écritures, deux contrôles simultanés et redémarrage après commit ; expliquer aussi les limites des sauvegardes et réplications.

### 4.11 CAP et cohérence éventuelle
Dans un système distribué soumis à une partition réseau, on ne peut garantir simultanément la cohérence linéarisable et la disponibilité de toutes les requêtes. CAP n’est pas une formule « choisir deux qualités » indépendante des conditions.
La cohérence éventuelle accepte un décalage temporaire entre copies lorsque les mises à jour peuvent être propagées.
**TRACEOPS :** privilégier une décision de contrôle autoritative sur la base principale ; ne pas accepter localement deux validations contradictoires. Une notification ou une projection statistique peut être retardée.
**Vérifier :** perte réseau ne transforme pas une action non confirmée en succès ; reconnexion ne duplique pas la soumission.

## 5. Styles d’architecture
| Style | Définition / intérêt | Position TRACEOPS, risques et preuve |
|---|---|---|
| Client–serveur | Client demande un service à un serveur autoritatif | Base proposée ; client non fiable ; tester accès direct à chaque endpoint |
| Architecture en couches | Séparation interface, application, domaine et infrastructure | Dépendances explicites ; éviter règles métier éparpillées dans contrôleurs et SQL |
| Monolithe modulaire | Un déploiement applicatif, frontières métier internes | Proposition initiale ; vérifier absence d’écritures transversales incontrôlées |
| Architecture orientée services — SOA | Services avec contrats représentant des capacités | Utile pour échanges avec SI client ; gouvernance des contrats et dépendances nécessaire |
| Systèmes distribués | Composants coopérant à travers un réseau avec pannes partielles | Déjà présent avec identité/objets ; délais, reprises et idempotence à tester |
| Microservices | Services déployables indépendamment, propriété claire des données | Différés ; justifier autonomie d’équipe ou charge avant coût de cohérence/exploitation |
| Serverless | Infrastructure d’exécution largement gérée, déclenchée à la demande selon service | Candidat pour traitement d’images ; tester limites de durée, démarrage, concurrence et coût |
| Architecture événementielle | Réaction à événements décrivant des faits | Outbox pour effets différés si nécessaires ; contrôler versions, répétitions et ordre |

**Règle de décision :** pour chaque séparation réseau, décrire ce qui se passe si la réponse est perdue après exécution. Un retry aveugle peut répéter un effet déjà produit. Les mécanismes de réconciliation font partie de la conception.

## 6. Données et analytique

### 6.1 Bases SQL
Modèle relationnel avec clés, contraintes, transactions et requêtes structurées.
**TRACEOPS :** adapté aux relations client–site–prestataire–intervention et aux décisions auditables. Définir contraintes d’unicité, clés étrangères composites lorsque nécessaires au périmètre, index et stratégie de migrations.
**Risques :** requêtes sans filtre, N+1, index insuffisants, transactions longues. **Vérifier :** plans d’exécution sur volumes représentatifs, concurrence et impossibilité d’insérer une zone étrangère au site.

### 6.2 Bases NoSQL
Famille regroupant documents, clés-valeurs, colonnes larges et graphes ; chaque produit a ses propres garanties.
**TRACEOPS :** stockage documentaire ou recherche spécialisée possibles si un besoin le justifie ; ne pas remplacer la base relationnelle sans examiner transactions et intégrité.
**Compromis :** flexibilité de forme contre duplication et gouvernance des schémas. **Vérifier :** évolution des documents, requêtes attendues et garanties effectives du produit choisi.

### 6.3 ETL et entrepôts de données
ETL extrait, transforme et charge des données vers un usage analytique. Un entrepôt sépare les calculs historiques de l’activité transactionnelle.
**TRACEOPS :** futur reporting multisite à partir de données minimisées ; dimensions site, prestation, prestataire et temps ; faits de soumission/contrôle avec granularité clairement définie.
**Risques :** compter plusieurs reprises comme plusieurs interventions, perdre le périmètre d’accès, écraser les dimensions historiques. **Vérifier :** réconciliation avec la source, reprise d’un lot sans doublon et contrôle des agrégats.

### 6.4 Hadoop, MapReduce et Apache Spark
Hadoop est un écosystème de stockage et traitement distribué ; MapReduce organise un calcul en phases de transformation puis regroupement ; Spark propose un moteur de traitements distribués avec plusieurs modes d’exécution.
**TRACEOPS :** ces notions servent à comprendre les options de traitement massif, pas à imposer une infrastructure au pilote. Les volumes actuellement inconnus ne justifient pas leur adoption.
**Coûts :** exploitation, partitionnement, données mélangées entre clients et débogage distribué. **Réexaminer :** données et temps de calcul mesurés dépassant les capacités d’une solution SQL raisonnablement optimisée.

### 6.5 Analytics
Définir question, population, période, numérateur, dénominateur, exclusions et fraîcheur.
**TRACEOPS :** taux de validation = interventions validées / population admissible définie ; distinguer interventions créées, prévues dans la période et soumises dans la période. Publier la définition choisie avec l’indicateur.
**Vérifier :** jeu de données avec annulation, reprise, retard, changement de fuseau et période sans activité. Une absence de données ne doit pas être affichée comme 0 % de qualité.

### 6.6 Cycle de vie des données
Classer données d’identité, référentiels, comptes rendus, photos, événements d’audit, logs techniques et sauvegardes. Pour chaque catégorie : finalité, propriétaire, accès, conservation, effacement et restauration.
**TRACEOPS :** aucune durée légale inventée ; décision selon pilote, contrats et pays. Un effacement doit prendre en compte copies et sauvegardes selon une politique documentée. Une restauration doit réappliquer les décisions d’effacement nécessaires.
**Preuve :** tableau des catégories rempli avant production et exercice de suppression contrôlé.

## 7. API et intégrations

### 7.1 REST
Exposer des ressources et utiliser les propriétés des méthodes HTTP de façon cohérente.
**TRACEOPS :** listes paginées, détail d’intervention et commandes métier explicites ; schéma de réponse stable, erreurs documentées, contrôle d’accès à chaque ressource.
**Contrat :** version, types, champs obligatoires, fuseaux, pagination, limites, idempotence et codes d’erreur. **Vérifier :** contrat OpenAPI, tests de compatibilité et réessai après réponse perdue.

### 7.2 GraphQL
Le client décrit les champs demandés dans un schéma typé.
**Bénéfice potentiel :** vues composites ; **risques :** profondeur/coût des requêtes, N+1, permissions oubliées sur un champ ou une relation.
**TRACEOPS :** différé tant que REST couvre les parcours. Si adopté, quotas de complexité et autorisation des résolveurs obligatoires ; tester qu’une traversée de relation ne révèle pas un concurrent.

### 7.3 gRPC
Appels de procédures avec contrats fortement structurés, souvent définis via Protocol Buffers.
**TRACEOPS :** option pour échanges internes futurs ; ne remplace pas automatiquement une API web publique.
**Risques :** couplage de versions, délais propagés et reprises non idempotentes. **Vérifier :** compatibilité des messages, cancellation et timeout de bout en bout.

### 7.4 SOAP et ESB
SOAP définit une enveloppe de messages et un écosystème de contrats ; un ESB assure médiation, transformation ou routage entre systèmes.
**TRACEOPS :** à envisager seulement si un SI client les impose. Isoler l’adaptateur du domaine pour éviter que le contrat du partenaire détermine toutes les entités internes.
**Vérifier :** mapping, authentification, erreurs fonctionnelles/techniques, délai et rapprochement des données. Le bus ne doit pas devenir une boîte noire propriétaire des règles.

### 7.5 BPM et BPEL
BPM décrit la gestion et l’amélioration des processus métier. BPEL est un langage d’orchestration de processus associé aux services web.
**TRACEOPS :** modéliser le processus de contrôle est utile ; un moteur généraliste n’est pas requis pour quelques transitions stables. Réexaminer si chaque client exige des circuits complexes versionnés.
**Risque :** une modification de processus brise les dossiers en cours. **Vérifier :** version de processus attachée à l’intervention et règles explicites de migration.

### 7.6 Files de messages
Découpler producteur et consommateur pour traiter des travaux différés.
**TRACEOPS :** notifications, traitement de photos ou exports volumineux. Un événement est créé via outbox dans la transaction métier ; consommateur idempotent, tentatives bornées et file d’échecs.
**Contrat proposé :** event_id, type, schema_version, occurred_at, client_id, correlation_id et référence de ressource ; limiter données personnelles.
**Vérifier :** doublon, désordre, interruption après traitement avant acquittement, message impossible à traiter et rejeu autorisé. Les droits sont revérifiés avant de produire une pièce ou un export.

## 8. Sécurité et autorisation

### 8.1 Authentification et autorisation
Authentifier prouve une identité ; autoriser décide ce qu’elle peut faire dans un contexte.
**TRACEOPS :** sessions sécurisées ou identité OIDC ; rôles et attributs client/prestataire/site/affectation ; refus par défaut. Les rôles du navigateur ne sont jamais une preuve.
**Sessions :** expiration, renouvellement, déconnexion, révocation et récupération de compte à spécifier ; limiter tentatives et protéger les opérations sensibles.
**Vérifier :** accès sans session, session expirée, utilisateur suspendu, rôle retiré et contexte changé pendant la saisie.

### 8.2 Administrateur global
Accès transversal demandé par le porteur : gestion des organisations, membres, droits et opérations.
**Conception proposée :** rôle plateforme distinct, MFA, endpoints dédiés, acteur réel conservé et motif pour les actions sensibles. L’autorisation globale élargit le périmètre mais ne supprime pas les invariants de soumission ou de contrôle.
**Risque :** compromission ayant un impact sur tous les clients. **Vérifier :** un membre ordinaire ne peut ni se promouvoir ni invoquer un endpoint global ; attribution et révocation sont auditées ; dernier compte perdu couvert par une procédure.

### 8.3 Hachage et chiffrement
Le hachage produit une empreinte non destinée à être inversée ; le chiffrement permet une restitution avec une clé. Une empreinte de fichier aide à détecter un changement mais ne prouve pas qui a réalisé le travail.
**TRACEOPS :** identité gérée préférée ; si mots de passe internes, utiliser une fonction dédiée aux mots de passe avec paramètres adaptés et sel, jamais un simple SHA rapide. Chiffrer les échanges et le stockage selon l’hébergement.
**Vérifier :** aucun secret dans dépôt/logs, rotation possible, restauration avec accès contrôlé aux clés.

### 8.4 PKI et certificats
Une infrastructure à clés publiques relie clés et identités via certificats et chaînes de confiance.
**TRACEOPS :** certificats TLS valides, renouvellement surveillé, vérification des certificats des services externes ; mTLS éventuel selon besoin interservice.
**Risque :** désactiver la vérification pour contourner un problème réseau. **Vérifier :** certificat expiré ou non reconnu refusé et alertes avant expiration.

### 8.5 OWASP et vérification de sécurité
L’[ASVS d’OWASP](https://asvs.owasp.org/) offre une base d’exigences de vérification. Fixer la version et le niveau retenus avant d’utiliser ses identifiants ; cette référence ne constitue pas une certification.
**TRACEOPS :** établir une matrice exigence→contrôle→test→preuve pour injections, XSS, sessions, accès objets, uploads, erreurs et secrets. Contrôler les entrées et encoder les sorties selon leur contexte.
**Vérifier :** tests négatifs d’accès, requêtes paramétrées, limitation des fichiers et absence d’informations sensibles dans les erreurs.

### 8.6 Défense en profondeur des données
Les [politiques RLS de PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) filtrent les lignes ; les rôles privilégiés et propriétaires ont des exceptions à maîtriser. Elles complètent l’autorisation applicative.
**TRACEOPS :** rôle applicatif non propriétaire, contexte transactionnel vérifié, tests avec connexions réutilisées et worker. Le parcours global utilise des politiques explicites ; aucun BYPASSRLS général pour le web.
**Vérifier :** après une requête du client A, la même connexion réutilisée pour B ne conserve aucun contexte A.

### 8.7 Modèle de menace
Actifs : identité, rapports, preuves, droits et historique. Acteurs de menace : compte compromis, membre curieux, administrateur abusif, dépendance vulnérable. Frontières : navigateur/API, API/base, API/stockage, services externes.
**TRACEOPS :** pour chaque frontière, décrire usurpation, modification, exposition, indisponibilité et élévation de privilèges, puis contrôle et preuve. Prioriser selon impact et vraisemblance documentés, sans scores arbitraires.

## 9. Web, mobile et expérience

### 9.1 React, Vue et Angular
Trois options d’organisation des interfaces avec leurs conventions et écosystèmes. Choisir selon compétences, accessibilité, formulaires, tests, taille livrée et maintenance.
**TRACEOPS :** comparer un formulaire de compte rendu, les erreurs et la gestion du contexte ; un framework ne sécurise pas les données par lui-même. Aucune nécessité de mélanger les trois.
**Vérifier :** usage sur téléphone réel, navigation clavier, changements de rôle et absence de données d’un contexte précédent.

### 9.2 SPA, SSR et SSG
SPA : interface interactive largement exécutée dans le navigateur. SSR : HTML rendu sur serveur. SSG : pages préconstruites.
**TRACEOPS :** interface authentifiée interactive possible en SPA ou rendu hybride ; documentation publique éventuelle en statique. Les décisions dépendent du chargement, du cache, de l’exploitation et de l’accessibilité.
**Risque :** mise en cache partagée d’une page privée rendue serveur. **Vérifier :** règles de cache par contexte et chargement sur réseau faible.

### 9.3 Microfrontends
Découper l’interface en applications ou modules livrés indépendamment.
**TRACEOPS :** différés tant qu’une seule équipe peut faire évoluer les espaces ensemble. Quatre rôles n’impliquent pas quatre applications autonomes.
**Coûts :** cohérence visuelle, duplication de dépendances, partage de session, observabilité et compatibilité. **Réexaminer :** équipes autonomes et cadence indépendante démontrées.

### 9.4 W3C, WHATWG et standards web
Organismes et communautés de standardisation des technologies web. Leur travail soutient interopérabilité et accessibilité.
**TRACEOPS :** HTML sémantique, libellés, focus, navigation clavier, annonces d’erreur et contenu responsive. La cible d’accessibilité du SRS doit être vérifiée sur les parcours réels.
**Vérifier :** clavier, lecteur d’écran et zoom ; ne pas limiter l’évaluation à un score automatique.

### 9.5 Mobilité et hors ligne
Responsive adapte l’affichage ; hors ligne exige stockage, synchronisation et résolution des conflits.
**TRACEOPS :** besoin hors ligne encore ouvert. Si retenu : classifier données locales, limiter durée de cache, définir commandes rejouables, identifier conflits, informer sur statut local/serveur et tester la révocation différée.
**Exemple de conflit :** agent saisit hors ligne pendant qu’un responsable réaffecte la mission. Le serveur doit rejeter ou router la soumission selon une règle approuvée, jamais fusionner silencieusement.
**Vérifier :** mode avion, fermeture de page, appareil partagé, photo partiellement envoyée et reconnexion tardive.

## 10. Réseaux
| Notion | Définition | Application et vérification TRACEOPS |
|---|---|---|
| OSI | Modèle de couches pour raisonner sur les communications | Localiser panne physique, réseau, transport ou application ; ne pas modifier le code métier pour une panne DNS |
| TCP/IP | Suite de protocoles de communication et modèle associé | Adressage, routage, connexions et résolution DNS ; tester délais et indisponibilités |
| HTTP | Sémantique requête/réponse, méthodes, codes, en-têtes et cache | Codes cohérents, corps bornés, cache privé et gestion du 429/503 |
| HTTPS | HTTP protégé par TLS | Vérifier certificats, redirection et absence de ressources sensibles en clair |
| Proxies | Intermédiaires de communication ; reverse proxy devant le service | Définir confiance dans les en-têtes transmis, limites upload et timeout |
| Firewalls | Filtrage des flux réseau | Base et stockage administratif non exposés publiquement ; règles minimales vérifiées |

**Politique de délai proposée :** chaque appel externe a un timeout explicite ; seules les opérations réessayables sont reprises avec attente progressive et variation aléatoire. Le budget total doit respecter le parcours utilisateur. Les valeurs exactes se mesurent lors du prototype.
**Point de vigilance :** NAT, TLS et pare-feu ne remplacent pas les autorisations de ressources métier.

## 11. Exploitation, cloud et livraison

### 11.1 Linux / Unix
Comprendre processus, signaux, permissions, système de fichiers, réseau et journaux permet de diagnostiquer l’application.
**TRACEOPS :** service exécuté avec privilèges minimaux, arrêt gracieux, limites de ressources, horloge synchronisée et rotation des logs.
**Vérifier :** arrêt pendant requête, saturation disque, permission refusée et redémarrage automatique ; aucun secret imprimé lors du diagnostic.

### 11.2 Conteneurs
Emballer application et dépendances dans une image reproductible ; l’image ne contient pas les données persistantes.
**TRACEOPS :** build immuable, utilisateur non privilégié, dépendances contrôlées, volumes et secrets séparés, sondes readiness/liveness distinctes.
**Risques :** image contenant secrets, tag mutable, stockage local perdu et redémarrages amplifiant une panne externe.
**Vérifier :** reconstruire une version, restaurer les données séparément et arrêter proprement un traitement.

### 11.3 Fournisseurs cloud
Choix selon région, identité, stockage, bases, disponibilité, coût total, support et possibilité de sortie.
**TRACEOPS :** comparer les services nécessaires une fois pays et volumes connus ; chiffrer trafic sortant, sauvegardes et logs, pas seulement serveur.
**Vérifier :** budget avec hypothèses, export exploitable des données et procédure de migration. Aucun fournisseur n’est sélectionné dans ce document.

### 11.4 Infrastructure as Code — IaC
Décrire l’infrastructure dans des fichiers versionnés pour rendre les changements traçables et reproductibles.
**TRACEOPS :** environnements isolés, réseaux, base, stockage privé et alertes ; secrets injectés via un mécanisme dédié.
**Risques :** état IaC contenant données sensibles, dérive manuelle et destruction accidentelle.
**Vérifier :** revue du plan, contrôle des ressources persistantes, reconstruction en recette et détection de dérive.

### 11.5 CI/CD
CI intègre fréquemment les changements avec vérifications. CD prépare ou automatise la livraison selon le niveau d’autorisation choisi.
**TRACEOPS :** lint/types, tests métier, base et isolation, tests de contrat, parcours essentiels, analyse des dépendances, build et déploiement en recette. Production selon processus approuvé.
**Vérifier :** une migration incompatible bloque ; un échec de sécurité critique ne disparaît pas sous une moyenne de tests réussis. Conserver version, commit, artefact et résultat de chaque étape.

### 11.6 Serverless en exploitation
Complément au style architectural : quotas, concurrence, coûts par invocation, durée maximum, stockage éphémère et observabilité doivent être connus.
**TRACEOPS :** traitement de photos candidat ; le délai peut dépasser celui de la requête utilisateur, donc état « traitement » explicite.
**Vérifier :** doublon d’événement, pic de charge, fonction interrompue et dépendance lente ; limiter concurrence pour protéger la base.

### 11.7 Service mesh
Couche de gestion de communications entre services : identité, politiques, routage et télémétrie selon le produit.
**TRACEOPS :** différé pour le monolithe initial. Son coût d’exploitation serait à justifier par un parc de services et des besoins mesurés.
**Risque :** complexifier diagnostic et chaîne de certificats. **Réexaminer :** exigences interservices non satisfaites par une approche plus simple.

### 11.8 Cloud design patterns
- **Retry borné :** reprendre seulement les opérations idempotentes ; éviter les tempêtes de requêtes.
- **Circuit breaker :** suspendre temporairement les appels à une dépendance défaillante ; rendre l’état dégradé visible.
- **Bulkhead :** isoler les ressources pour qu’un export volumineux ne bloque pas la soumission.
- **Cache-aside :** remplir un cache à la demande ; contexte client obligatoire dans la clé, invalidation des droits étudiée.
- **Outbox :** enregistrer un effet différé avec la transaction métier.
- **Saga :** coordonner une suite distribuée par actions et compensations ; différée tant qu’une transaction locale suffit.
- **Strangler :** remplacer progressivement un système en routant certains usages vers la nouvelle solution.

**TRACEOPS :** commencer par délais, idempotence et isolation des tâches ; sélectionner les autres seulement selon scénarios réels. **Vérifier :** simulation de panne et observation de l’effet attendu, pas uniquement présence d’une bibliothèque.

### 11.9 Supervision et objectifs de service
Logs : événements de diagnostic ; métriques : mesures agrégées ; traces : chemin d’une requête. Ajouter correlation_id sans contenu sensible.
**TRACEOPS :** erreurs, latence, soumissions échouées, échecs d’accès, pièces en attente, file de travaux et sauvegardes. Éviter client_id comme étiquette non bornée dans toutes les métriques si cela explose la cardinalité.
**SLO proposé :** cibles du SRS à confirmer ; budgets d’erreur et responsabilités à préciser. **Vérifier :** déclencher une panne de recette et constater l’alerte avec un runbook utilisable.

### 11.10 Sauvegarde, restauration et continuité
Une sauvegarde réussie n’est pas une restauration prouvée. Base et objets doivent être restaurables à un état compatible ; identifier les preuves manquantes et les objets orphelins.
**TRACEOPS :** procédure : isoler environnement → restaurer base → récupérer pièces → vérifier intégrité/périmètres → traiter opérations en attente → valider avec responsable → rouvrir.
**Mesures :** temps réel de reprise et dernière donnée récupérable. **Vérifier :** exercice périodique incluant sessions, permissions et réexécution des tâches différées.

## 12. Outils de collaboration
| Outil / notion | Rôle | Usage TRACEOPS et contrôle |
|---|---|---|
| Git | Historique de changements et branches | Commits explicites, revue, restauration d’une version ; aucun secret suivi |
| GitHub | Hébergement du dépôt, issues, revues et automatisation | Déjà utilisé pour les documents ; relier chaque issue à une exigence et une recette |
| Slack | Communication d’équipe | Option si retenue ; décisions durables consignées dans les documents, pas seulement en conversation |
| Trello | Tableau de suivi visuel | Alternative légère pour flux de travail ; ne pas doubler inutilement les mêmes tâches |
| Outils Atlassian | Suivi et documentation selon produits choisis | Option si déjà adoptés ; source de vérité et liens avec le dépôt à définir |

**Politique proposée :** un emplacement autoritatif pour les exigences et un pour le travail ; nommer le responsable des mises à jour. Un changement de règle accepté doit être visible avant que plusieurs développeurs implémentent des versions différentes.
**Preuve :** une issue de développement peut être suivie jusqu’au besoin, à sa décision, au code et au résultat de recette.

## 13. Cadres d’analyse, architecture et management
Ces cadres sont étudiés pour choisir des pratiques proportionnées. Leur présence ici n’impose ni certification ni processus complet.

### 13.1 BABOK
Corpus de pratiques d’analyse métier : comprendre les parties prenantes, découvrir les besoins, gérer les exigences et évaluer les solutions.
**TRACEOPS :** guide pour entretiens, vocabulaire, traçabilité et comparaison entre besoin exprimé et résultat observé. **Vérifier :** chaque exigence a une origine et une validation métier identifiable.

### 13.2 IAF
Integrated Architecture Framework : cadre pour structurer des vues d’architecture et articuler métier, information et technologie.
**TRACEOPS :** utile comme contrôle de couverture des préoccupations ; conserver seulement les vues utiles au pilote.
**Vérifier :** relier une capacité métier à ses informations, applications et moyens d’exécution ; clarifier le cadre précis si le client emploie un autre sens de l’acronyme.

### 13.3 TOGAF
Cadre d’architecture d’entreprise organisant l’évolution entre situation actuelle et cible.
**TRACEOPS :** pertinent pour insertion dans un SI client étendu ; cadrer dépendances, responsables et étapes de transition.
**Compromis :** gouvernance plus coûteuse qu’un petit pilote ne le nécessite. **Vérifier :** carte actuelle/cible et décisions d’intégration approuvées par le client concerné.

### 13.4 PMI
Organisation et ensemble de références de gestion de projet ; ce nom n’est pas à lui seul une méthode d’implémentation.
**TRACEOPS :** structurer périmètre, parties prenantes, risques, ressources et suivi des engagements.
**Vérifier :** plan réaliste, responsable par livrable et gestion documentée des changements.

### 13.5 PRINCE2
Méthode de gestion de projet avec responsabilités, justification et conduite par étapes.
**TRACEOPS :** retenir l’idée de points de décision entre cadrage, prototype, pilote et généralisation.
**Compromis :** éviter une charge administrative disproportionnée. **Vérifier :** chaque étape a résultat attendu, critères de sortie et décideur.

### 13.6 ITIL
Cadre de gestion des services informatiques, incluant pratiques de support et d’amélioration.
**TRACEOPS :** définir incident, demande d’accès, changement, problème récurrent et responsable du service.
**Vérifier :** une panne ou fuite signalée reçoit une prise en charge, une communication appropriée et une résolution documentée.

### 13.7 RUP
Processus itératif structurant la compréhension, la maîtrise des risques, la construction et la transition.
**TRACEOPS :** étudier tôt les risques d’isolation, contrôle et réseau avant d’élargir les écrans.
**Vérifier :** chaque itération réduit une incertitude identifiée et produit un résultat observable.

### 13.8 Certifications
Elles peuvent attester un apprentissage, mais ne remplacent pas la démonstration des compétences ni les résultats du système.
**TRACEOPS :** aucune certification imposée à ce stade. Définir les compétences nécessaires pour architecture, sécurité, données et exploitation ; demander des preuves de réalisation adaptées.

## 14. Méthodes agiles

### 14.1 Approche agile
Travailler par incréments, recueillir les retours et ajuster selon les observations. Les exigences et documents évoluent avec une traçabilité.
**TRACEOPS :** tranche verticale avec vrais rôles avant accumulation de modules incomplets ; revue terrain après démonstration du parcours.
**Vérifier :** chaque incrément permet de tester une hypothèse et les documents restent cohérents avec le comportement.

### 14.2 Scrum
Cadre organisé autour d’objectifs et d’itérations, avec responsabilités et événements définis.
**TRACEOPS :** option si une équipe stable peut s’engager sur un objectif de sprint. Le backlog découle des exigences retenues.
**Risque :** compter les tâches sans livrer un parcours utilisable. **Vérifier :** revue d’un incrément conforme aux critères de finition.

### 14.3 Kanban
Visualiser le travail, limiter l’encours et améliorer le flux.
**TRACEOPS :** option simple pour une petite équipe ou du travail arrivant continuellement ; colonnes analyse, prêt, réalisation, revue, recette, terminé.
**Vérifier :** blocages visibles, temps de cycle mesuré et limite d’encours respectée ; aucun délai promis à partir d’une vitesse non mesurée.

### 14.4 XP — Extreme Programming
Pratiques techniques favorisant retour rapide : tests, intégration fréquente, refactoring et collaboration étroite.
**TRACEOPS :** appliquer surtout aux règles critiques, avec revue des accès et tests de concurrence.
**Vérifier :** modifications fréquentes gardant le système testable ; dette explicitée au lieu d’être masquée.

### 14.5 LeSS et SAFe
Approches de coordination agile à plusieurs équipes, avec structures différentes.
**TRACEOPS :** étudiées mais différées faute de plusieurs équipes identifiées. La coordination, les dépendances et la gouvernance doivent justifier leur adoption.
**Vérifier avant choix :** nombre d’équipes, frontières de responsabilité, cadence de livraison et coût des interactions ; une seule équipe n’a pas besoin d’un cadre de passage à l’échelle.

## 15. Logiciels d’entreprise et intégrations futures
| Exemple de la roadmap | Notion | Application, limites et vérification TRACEOPS |
|---|---|---|
| Microsoft Dynamics | Famille de solutions de gestion d’entreprise et de relation client | Synchronisation éventuelle de clients/prestataires ; source de vérité, droits et mapping à définir |
| SAP ERP | Gestion intégrée de processus d’entreprise | Échange de référentiels ou ordres de travail si demandé ; pas de facturation ajoutée implicitement au MVP |
| SAP HANA | Plateforme de données | Évaluer seulement dans le SI d’un client équipé ; modèle, autorisations et coût à vérifier |
| SAP BusinessObjects | Outils de reporting décisionnel | Export analytique éventuel ; filtrage client et réconciliation obligatoires |
| EMC DMS | Référence à des solutions de gestion documentaire | Intégration éventuelle pour archivage ; produit/version exacts à identifier, droits et conservation à aligner |
| IBM BPM | Référence à des solutions de gestion de processus | Orchestration éventuelle côté client ; version du processus et reprise d’erreur à contractualiser |
| Salesforce | Plateforme de relation client et applications | Synchronisation éventuelle de comptes ; minimisation et contrôle des accès |

**Pour toute intégration :** nommer le système propriétaire de chaque champ, sens des échanges, identifiant externe, fréquence, authentification, quotas, mapping, suppression, erreur et réconciliation. Conserver un journal sans dupliquer les données sensibles.
**Scénario de recette :** un partenaire renvoie deux fois le même événement, puis modifie un identifiant ; le système prévient doublons et rattachements au mauvais client.
Les noms de la roadmap ne suffisent pas à identifier éditions, licences et API actuelles ; aucune compatibilité commerciale n’est affirmée.

## 16. Études complémentaires indiquées par la roadmap
Backend : approfondir contrats, persistance et traitements serveur. Full Stack : comprendre la chaîne interface/API/base. System Design : dimensionnement et compromis sous charge. Software Design & Architecture : principes, structures et évolution. DevOps : livraison et exploitation. Microservices : autonomie et cohérence distribuée si cette architecture devient justifiée.
**TRACEOPS :** consulter ces domaines en fonction des risques identifiés ; ils ne constituent pas un backlog d’outils à installer.

## 17. Scénarios d’application transversale

### 17.1 Soumission avec réponse réseau perdue
1. L’agent transmet la révision, la version attendue et une clé d’idempotence.
2. Le serveur vérifie session, affectation, état, champs et pièces disponibles.
3. Une transaction fige la révision, passe à A_CONTROLER et écrit l’audit.
4. La réponse n’arrive pas au téléphone ; l’interface affiche une absence de confirmation.
5. L’agent réessaie avec la même clé et le même contenu ; le serveur retourne le résultat déjà enregistré.
6. Une clé réutilisée avec un autre contenu est refusée.
**Concepts :** client–serveur, ACID, idempotence, réseau, UX et tests.
**Preuve :** une seule révision soumise et un historique cohérent après retry.

### 17.2 Deux contrôleurs décident en même temps
1. Les deux lisent la même révision et la même version d’intervention.
2. Le premier enregistre une décision sous condition de version.
3. Le second constate le conflit ; aucune deuxième décision n’est écrite.
4. L’interface propose de recharger la décision existante.
**Concepts :** agrégats, concurrence, isolation, contraintes et contrat API.
**Preuve :** transaction perdante sans effet métier et réponse documentée.

### 17.3 Suspension d’un prestataire
1. L’administrateur global choisit le prestataire, voit les missions impactées et motive l’action.
2. L’organisation passe en suspension ; nouvelles affectations et accès concernés sont refusés.
3. Les données historiques subsistent ; les missions en cours nécessitent une décision métier explicite.
4. Les liens temporaires déjà émis expirent selon leur durée ; si révocation immédiate exigée, utiliser téléchargement authentifié.
**Concepts :** administration globale, modèle de menace, cohérence des permissions et cycle des données.
**Point ouvert :** annulation ou réaffectation automatique ne doit pas être inventée ; la règle du pilote doit être approuvée.

### 17.4 Tableau de bord après validation
La décision autoritative est immédiate. Si les indicateurs utilisent ultérieurement une projection, l’interface indique son dernier rafraîchissement et ne s’en sert pas pour autoriser une nouvelle transition.
**Concepts :** CQRS, cohérence éventuelle et analytique.
**Preuve :** compteur temporairement en retard sans incohérence dans les décisions métier.

## 18. Dossier de preuve et critères de maturité documentaire
Pour chaque décision structurante, conserver :
1. Besoin et exigence liés.
2. Options et critères de comparaison.
3. Décision, statut et responsable.
4. Diagramme ou contrat décrivant le comportement.
5. Cas normal, erreur, panne, concurrence et accès interdit.
6. Méthode de vérification et résultat lorsqu’il existe.
7. Conséquences de maintenance, coût et sortie.
8. Questions non résolues et déclencheur de réexamen.

**Avant réalisation :** valider permissions, workflow, connectivité, limites du MVP et identité des décideurs.
**Avant pilote :** démontrer scénarios fonctionnels, isolation et restauration ; compléter les runbooks.
**Avant généralisation :** mesurer charge, coûts, adoption et qualité du service ; réévaluer l’architecture à partir de ces mesures.

Ce référentiel explicite les concepts et leur usage proposé. Il ne remplace pas les décisions encore inconnues du client pilote, ni des résultats d’essais qui n’existent pas encore.
