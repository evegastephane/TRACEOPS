# TRACEOPS — Couverture des concepts d’architecture

Version 0.2 — 3 novembre 2026 — revue documentaire.

Les familles et notions de la roadmap consultée sont repérées ci-dessous dans le [référentiel détaillé](REFERENTIEL_ARCHITECTURE.md). Des compléments propres au projet (BRS, PRD, SRS, C4, ADR, RLS, administration et hors ligne) sont ajoutés pour rendre la démarche applicable. Les entrées répétées du schéma sont regroupées. « Couvert » signifie expliqué et relié à TRACEOPS, pas implémenté ou validé.

| Chapitre | Famille | Concepts traités |
|---|---|---|
| 1 | Fondamentaux et responsabilités | Architecture logicielle · Architecte logiciel · Architecture d’application · Architecture de solution · Architecture d’entreprise · Décisions techniques · Décisions de conception · Recueil des exigences · Documentation · Standards · Collaboration · Conseil et coaching · Prise de décision · Simplification · Savoir coder · Communication · Estimation et évaluation · Arbitrage · Marketing |
| 2 | Documentation et modèles | BRS · PRD · SRS · ADR · C4 · UML |
| 3 | Langages | Java · Kotlin · Scala · Python · Ruby · Go · JavaScript · TypeScript · .NET |
| 4 | Conception | OOP · SOLID · DDD · TDD · MVC · MVP · MVVM · Programmation fonctionnelle · Programmation réactive · Acteurs · CQRS · ACID · CAP · Cohérence éventuelle |
| 5 | Styles | Client–serveur · Couches · Monolithe modulaire · SOA · Systèmes distribués · Microservices · Serverless · Architecture événementielle |
| 6 | Données | SQL · NoSQL · ETL · Entrepôts de données · Hadoop · MapReduce · Apache Spark · Analytics |
| 7 | Intégrations | REST · GraphQL · gRPC · SOAP · ESB · BPM · BPEL · Files de messages |
| 8 | Sécurité | Authentification et autorisation · Administrateur global · Hachage · Chiffrement · PKI · OWASP · RLS · Modèle de menace |
| 9 | Web et mobile | React · Vue · Angular · SPA · SSR · SSG · Microfrontends · W3C · WHATWG · Mobilité et hors ligne |
| 10 | Réseaux | OSI · TCP/IP · HTTP · HTTPS · Proxies · Firewalls |
| 11 | Exploitation | Linux / Unix · Conteneurs · Fournisseurs cloud · Infrastructure as Code · CI/CD · Serverless en exploitation · Service mesh · Cloud design patterns · Supervision · Sauvegarde et restauration |
| 12 | Outils | Git · GitHub · Slack · Trello · Outils Atlassian |
| 13 | Cadres | BABOK · IAF · TOGAF · PMI · PRINCE2 · ITIL · RUP · Certifications |
| 14 | Agilité | Agile · Scrum · Kanban · XP · LeSS · SAFe |
| 15 | Logiciels d’entreprise | Microsoft Dynamics · SAP ERP · SAP HANA · SAP BusinessObjects · EMC DMS · IBM BPM · Salesforce |
| 16 | Approfondissements | Backend · Full Stack · System Design · Software Design & Architecture · DevOps |

## Contrôle de couverture

Les chapitres 17 et 18 ajoutent des scénarios transversaux et le dossier de preuve attendu. Chaque famille décrit utilité, limites, position proposée et vérification. Les outils non retenus restent explicitement étudiés ; la matrice ne transforme pas leurs descriptions en décisions d’achat.

## Responsabilité des documents

| Préoccupation | Document principal | Complément |
|---|---|---|
| Valeur, parties prenantes, contraintes et gouvernance | BRS.md | Référentiel 1–2, 13–14 |
| Espaces, parcours et priorités | PRD.md | Référentiel 9, 17 |
| Invariants, autorisations, contrats et recette | SRS.md | Référentiel 4, 6–10, 17 |
| Structure, choix, alternatives et exploitation | ARCHITECTURE.md | Référentiel complet |
| Questions et traçabilité des exigences | CADRAGE.md | Dossier de preuve, chapitre 18 |

Source de couverture : [roadmap Software Architect, schéma consulté le 3 novembre 2026](https://roadmap.sh/pdfs/roadmaps/software-architect.pdf). Les explications et applications sont rédigées pour TRACEOPS.
