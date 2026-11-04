# TRACEOPS — protocole de tests d’utilisabilité

Protocole proposé, non exécuté. Les tests automatisés existants valident du logiciel ; ils ne mesurent pas la compréhension d’une personne. Aucun score de satisfaction ou taux de réussite n’est annoncé à ce stade.

## Participants et matériel

Recruter si possible au moins une personne par rôle opérationnel : responsable client, prestataire, agent, contrôleur. Le propriétaire teste l’administration. Un participant qui cumule des rôles fait des sessions séparées. Ce petit échantillon identifie des obstacles ; il ne permet pas de conclusions statistiques sur toute la population.

Utiliser les wireframes [M01–M09](02_MAQUETTES.md), puis un prototype cliquable avec données synthétiques. Tester un ordinateur pour gestion/contrôle et un téléphone pour l’agent. Prévoir français et anglais avec les personnes concernées ; ne pas supposer une équivalence entre traduction et compréhension.

Introduction : « Nous testons la conception, pas vos compétences. Dites ce que vous cherchez et ce que vous pensez qu’il va se passer. » Recueillir l’accord avant tout enregistrement ; les notes anonymisées suffisent. Ne pas utiliser de vrais dossiers hospitaliers ou photos de patients.

## Scénarios sans indication de bouton

| ID | Rôle et consigne donnée au participant | Réussite observable |
| --- | --- | --- |
| U01 | Client : faire nettoyer la salle 101 demain de 09:00 à 10:00 par le prestataire rattaché | Le participant localise la salle exacte, décrit les tâches, distingue brouillon et transmission |
| U02 | Prestataire : confier ce travail à deux agents dont l’un est déjà occupé sur ce créneau | Il repère le conflit, choisit une équipe disponible et un responsable |
| U03 | Agent : trouver son prochain travail et comprendre ce qui est attendu | Il indique lieu, horaire, tâches, responsable et action de démarrage sans assistance |
| U04 | Agent : renseigner une tâche et ses preuves ; une connexion échoue | Il distingue enregistré et non envoyé, conserve sa saisie, trouve la reprise d’envoi |
| U05 | Contributeur : son travail est terminé, mais il n’est pas responsable de mission | Il comprend que ses contributions sont conservées et qui doit soumettre |
| U06 | Contrôleur : accepter le sol mais demander une correction sur les surfaces | Il sélectionne seulement la tâche concernée et fournit un motif ; ne valide pas accidentellement |
| U07 | Agent responsable : corriger puis renvoyer le compte rendu | Il retrouve la demande, conserve le travail antérieur et soumet la nouvelle version |
| U08 | Client : le prestataire propose un report avant démarrage | Il comprend le créneau actuel, le proposé et l’effet de sa décision |
| U09 | Client : une anomalie demeure après une intervention acceptée avec réserve | Il retrouve l’anomalie encore ouverte et distingue validation et clôture |
| U10 | Administrateur : aider une organisation sans agir comme un agent | Il choisit le bon contexte, saisit un motif et identifie la trace d’audit |
| U11 | Utilisateur multi-organisations : changer d’espace alors qu’un formulaire est rempli | Il identifie le nouveau contexte et comprend le choix de sauvegarde ou d’abandon |
| U12 | Nouveau responsable : préparer le premier site | Il comprend les prérequis, crée un lieu simple et trouve rattachement et habilitation |

Les conditions U04 et les conflits de version doivent être simulées de façon explicite dans le prototype ; elles ne prouvent pas une implémentation réseau ou transactionnelle.

## Mesures

Pour chaque tâche noter : réussite autonome / avec aide / échec ; première action ; durée descriptive ; erreurs récupérables ; erreurs critiques ; hésitations ; nombre d’interventions du facilitateur ; facilité perçue de 1 à 7 ; une citation courte autorisée. Ne pas imposer un objectif de temps sans référence terrain.

Est critique : agir sur la mauvaise organisation/salle, valider involontairement, croire une preuve enregistrée alors qu’elle ne l’est pas, attribuer une mauvaise équipe sans le percevoir, ou perdre un compte rendu. Un obstacle esthétique devient prioritaire lorsqu’il nuit à la lecture, à la hiérarchie ou à la confiance ; la préférence de couleur est notée séparément.

Objectif de la première itération : aucun incident critique non résolu ; les tâches principales réalisables sans guidage par les participants concernés. Cet objectif ne doit pas être présenté comme une mesure obtenue. Avec une seule personne par rôle, tester à nouveau les corrections avant de généraliser.

## Vérifications complémentaires

- Clavier seul, ordre du focus, noms accessibles, zoom 200 %, contraste et lecture des erreurs.
- Mobile 360 et 390 px : pas de défilement horizontal indispensable, boutons accessibles avec clavier ouvert.
- Noms longs de sites, agent à plusieurs missions, liste vide, recherche sans résultat, droits retirés, session expirée.
- Changement de langue pendant une saisie ; accents et dates ; fuseau explicite.
- Validation concurrente, double clic de soumission, retour navigateur : aucune duplication ou décision silencieuse.

## Journal d’observation

| Session anonyme | Scénario | Attendu | Observé | Aide donnée | Gravité | Hypothèse de cause | Correction proposée | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| À compléter | | | | | | | | |

Classer les problèmes par impact et fréquence observée. Garder les observations brutes distinctes de l’interprétation. Réviser d’abord les parcours et le vocabulaire, puis la présentation. Une maquette agréable ne justifie pas d’écarter un échec de tâche.

## Passage au développement

Avant d’implémenter : résoudre les questions métier bloquantes du [dossier produit](01_CONCEPTION_PRODUIT.md), relier chaque écran à une action/permission et définir ses états d’erreur. Le prototype doit distinguer ce qui est simulé. La recette fonctionnelle suivante vérifiera le cycle complet sur PostgreSQL et les droits réels ; elle ne remplacera pas cette validation UX.
