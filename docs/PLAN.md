# TRACEOPS — Plan de conception documentaire

Version 0.1 — 3 novembre 2026 — proposition à discuter.

## Objectif de cette phase
Établir et revoir les documents avant de développer l’application. Les documents v0.1 constituent des ébauches ; leurs choix proposés ne sont pas des décisions approuvées.

## Étape 1 — Comprendre et cadrer le besoin
Entrées : note de présentation fournie et compléments du porteur.
Travail : identifier problèmes, objectifs, parties prenantes, périmètre, vocabulaire et contraintes.
Livrable : BRS.md.
Critère de sortie : accord sur le problème à résoudre, les acteurs et les exclusions.

## Étape 2 — Définir le produit
Travail : décrire les espaces client, prestataire, agent et administrateur global ; choisir les parcours prioritaires ; distinguer MVP et évolutions.
Livrable : PRD.md.
Critère de sortie : accord sur les fonctionnalités du premier pilote et leurs critères d’acceptation.

## Étape 3 — Spécifier les règles
Travail : préciser qui crée, affecte, soumet, contrôle et valide ; décrire états, exceptions, champs, permissions, preuves et exigences de qualité.
Livrable : SRS.md.
Critère de sortie : règles testables et circuit de validation approuvé, notamment pouvoirs de l’administrateur global et interdiction de modifier silencieusement l’historique.

## Étape 4 — Concevoir l’architecture
Travail : relier les exigences aux modules, données, interfaces, limites de confiance, choix techniques et procédures d’exploitation. Comparer les alternatives et documenter les compromis.
Livrable : ARCHITECTURE.md avec schémas et propositions de décisions d’architecture.
Critère de sortie : choix justifiés par les besoins et compatibles avec les moyens réels.

## Étape 5 — Revue transversale
Travail : vérifier cohérence BRS → PRD → SRS → architecture → recette, résoudre les questions structurantes et enregistrer les décisions.
Livrable : CADRAGE.md et versions révisées des quatre documents.
Critère de sortie : questions bloquantes tranchées, hypothèses restantes identifiées avec responsable.

## Étape suivante, après revue documentaire
Transformer seulement les exigences retenues en lots et issues de développement estimables ; définir le calendrier à partir de la capacité de l’équipe. La création des présentes ébauches ne déclenche pas le développement.

## Questions à traiter pendant la revue
1. Client pilote, pays et secteur.
2. Pouvoirs exacts du client, du prestataire et de l’administrateur global.
3. Circuit de contrôle et traitement des reprises/blocages.
4. Besoin indispensable ou non du hors ligne.
5. Taille et compétences de l’équipe, budget et délai.
6. Volumes, justificatifs, conservation et hébergement.

## État au 3 novembre 2026
La note source a été analysée et les premières versions des documents sont rédigées. Les espaces prestataire et administrateur global demandés ont été intégrés. Aucune application n’est implémentée et aucune architecture n’est approuvée.
