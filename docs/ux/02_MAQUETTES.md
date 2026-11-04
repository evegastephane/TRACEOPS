# TRACEOPS — maquettes fonctionnelles annotées

Version de travail du 4 novembre 2026. Wireframes de structure, sans code interactif ni direction graphique définitive. Tous les noms, créneaux et éléments ci-dessous sont synthétiques. Les fonctions métier représentées restent à développer. Les nombres illustratifs ne sont pas des statistiques du pilote.

## M01 — Accueil responsable client, ordinateur

```text
TRACEOPS     Hôpital pilote [Changer]           Français   Mon compte
───────────────────────────────────────────────────────────────────
À traiter      À traiter aujourd’hui            [Créer une intervention]
Interventions  Les décisions qui attendent votre organisation
Sites
               DEMANDES À EXAMINER
Prestataires   Salle 101 · Nettoyage · Report proposé
Équipe         Créneau actuel : 09:00–10:00 → proposé : 11:00–12:00
Paramètres     Motif : accès à la salle indisponible         [Examiner]

               COMPTES RENDUS À CONTRÔLER
               Salle 204 · Maintenance · Soumis par Agent B
               Contrôleur : Mme C, habilitée                 [Consulter]

               INTERVENTIONS À VENIR
               Demain 08:00 · Salle 101 · À affecter         [Ouvrir]
```

Le responsable consulte ; l’action de validation n’apparaît que s’il possède l’habilitation correspondante. Une section sans élément affiche une phrase courte, sans alerte ni graphique vide. L’état vide initial propose la préparation du premier site et de son prestataire. Un lien ouvre une fiche précise, pas une liste générique où il faudrait recommencer la recherche.

## M02 — Création par le client

```text
Interventions / Nouvelle intervention

Nouvelle intervention
Lieu ── Travail attendu ── Organisation ── Vérification

1. Où faut-il intervenir ?
Site                 [Hôpital pilote              v]
Salle ou équipement  [Rechercher un nom ou code     ]
Lieu retenu          Bâtiment A / Étage 1 / Salle 101
                     [Modifier le lieu]

                                  [Enregistrer le brouillon] [Continuer]
```

Étape Travail attendu : titre, consignes, tâches et preuves attendues. Étape Organisation : prestataire déjà rattaché au site, créneau, responsable client ; récurrence seulement une fois ses règles définies. Étape Vérification : résumé éditable, destinataire et effet de la transmission clairement affichés. Action finale : « Transmettre au prestataire ». Un brouillon ne réserve pas implicitement des agents.

À chaque retour en arrière, conserver les champs. Si le site change, expliquer quels choix dépendants doivent être revérifiés. Si aucun prestataire n’est rattaché, proposer « Rattacher un prestataire » à un utilisateur habilité et revenir ensuite au brouillon. Ne pas demander un UUID à l’utilisateur.

## M03 — Affectation par le prestataire

```text
Interventions / INT-014

Nettoyage de la salle 101                           À affecter
Hôpital pilote · Bâtiment A / Étage 1 / Salle 101
Demain, 09:00–10:00 · Heure du Cameroun

Travail demandé                  Agents à affecter
• Sol et surfaces                [Rechercher un agent            ]
• Photos avant et après          [x] Agent A · disponible
                                 [ ] Agent B · occupé 09:30–10:30
                                 [x] Agent C · disponible

                                 Responsable de mission [Agent A v]
                                 Il soumettra le compte rendu commun.
                                 [Confirmer l’affectation]
```

Les disponibilités sont calculées, jamais déduites d’un simple statut « actif ». Le serveur revérifie les conflits à la confirmation. L’erreur nomme le créneau concerné dans le périmètre autorisé et conserve la sélection. Un changement ultérieur affiche les agents sortants/entrants, demande un motif et préserve les auteurs du brouillon.

## M04 — Agent, téléphone : aujourd’hui

```text
┌────────────────────────────────────┐
│ TRACEOPS           Mon compte      │
│ Aujourd’hui                        │
│ Prestataire de démonstration       │
│                                    │
│ PROCHAINE INTERVENTION              │
│ 09:00–10:00 · Planifiée             │
│ Nettoyage de la salle 101           │
│ Hôpital pilote                     │
│ Bâtiment A / Étage 1 / Salle 101    │
│ Responsable : vous                 │
│ [Voir les consignes]               │
│                                    │
│ À SUIVRE                           │
│ 14:00–15:00 · Salle 204             │
│ Maintenance · Responsable : Agent C│
│ [Ouvrir]                           │
│                                    │
│ Aujourd’hui | Mes interventions    │
└────────────────────────────────────┘
```

Les titres de regroupement servent la lecture et ne deviennent pas des étiquettes décoratives répétées dans la version graphique. Sur une journée sans mission, proposer les missions à venir ; ne pas inventer une recommandation de travail. Le créneau et le lieu passent avant le nom du client ou un compteur de performance.

## M05 — Agent : exécution et contribution

```text
┌────────────────────────────────────┐
│ ← Mes interventions                │
│ Salle 101 · Nettoyage               │
│ En cours · Démarrée à 09:03         │
│                                    │
│ Travail attendu                    │
│ [✓] Sol                            │
│ [ ] Surfaces                       │
│                                    │
│ Surfaces                           │
│ Consigne : nettoyer les surfaces…  │
│ Avant    [Ajouter une photo]        │
│ Après    [Ajouter une photo]        │
│ Observation [                    ] │
│ [Enregistrer cette tâche]          │
│                                    │
│ Dernier enregistrement : 09:18      │
│ [Signaler une impossibilité]       │
│                                    │
│ [Vérifier le compte rendu]          │
└────────────────────────────────────┘
```

Avant démarrage, la fiche affiche « Démarrer l’intervention » et les consignes. Après démarrage, les tâches remplacent cette action. Pour un contributeur non responsable, l’action finale est « Voir le compte rendu » ; le texte explique qui doit soumettre. Les preuves affichent leur auteur et leur état d’envoi. Échec réseau : garder la saisie en mémoire de page et proposer de réessayer ; pas de promesse de sauvegarde hors ligne.

Le récapitulatif avant soumission liste les tâches incomplètes, preuves attendues et anomalies. Il distingue « Enregistrer le brouillon » de « Soumettre au client ». Une fois soumis, le compte rendu est présenté comme une version consultable ; sa modification directe est interdite.

## M06 — Contrôle client, ordinateur

```text
À contrôler / INT-014
Nettoyage de la salle 101                      À contrôler
Version 1 · soumise à 10:12 par Agent A
Lieu : Hôpital pilote / Bâtiment A / Étage 1 / Salle 101

Travail attendu             Travail déclaré et preuves
Sol                         Terminé · Agent C · 09:26
                            [Photo avant] [Photo après]
Surfaces                    Terminé · Agent A · 10:04
                            [Photo avant] [Photo après]
                            Observation : trace persistante…

Anomalie ouverte : trace sur surface                         [Examiner]

[Demander une reprise]                         [Valider l’intervention]
```

Les photos sont consultables en grand et nommées de manière accessible. Une reprise ouvre la sélection des tâches et un motif obligatoire. La validation affiche un résumé et les éventuelles réserves ; les anomalies conservées ne disparaissent pas. Ne pas proposer une décision automatique sur la seule présence de photos.

Sur téléphone : tâche → preuves avant/après → observation → décision, en colonne. La zone d’action reste accessible sans recouvrir le contenu. Les droits sont revérifiés sur la version soumise ; un conflit affiche qui a pris quelle décision, lorsque cette information est autorisée.

## M07 — Reprise ciblée et historique

```text
INT-014 · Reprise demandée
Demandée par Contrôleur C · aujourd’hui 11:00

À reprendre
Surfaces — « Refaire le nettoyage de la zone signalée. »
[Ouvrir la tâche]

Travail conservé
Sol — contribution et preuves de la version 1

Historique
Version 1 · soumise à 10:12 · reprise demandée à 11:00
Version 2 · brouillon · contributions en cours
```

Le travail non concerné reste visible, sans obligation de le ressaisir. Une nouvelle soumission ne remplace pas la version précédente. Les événements affichent des dates absolues accessibles, même si une indication relative est présentée en complément.

## M08 — Site et préparation des accès

```text
Sites / Hôpital pilote
Hôpital pilote                          [Modifier le site — futur]
Lieux | Prestataires | Contrôleurs | Interventions

Lieux                         [Rechercher] [Ajouter un lieu]
Bâtiment A
  Étage 1
    Salle 101 · SAL-101        [Voir les interventions]
    Salle 102 · SAL-102        [Voir les interventions]

Prestataires : Services pilote          [Gérer le rattachement]
Contrôleurs : Contrôleur C              [Gérer les habilitations]
```

Dans le prototype, les onglets et actions proposés sont des concepts ; ils ne décrivent pas les boutons actuels. En réalisation, masquer une fonction indisponible plutôt que livrer un faux bouton. La recherche renvoie le chemin complet même si la branche est repliée. Une salle peut être directement rattachée au site. L’archivage doit vérifier les interventions associées avant d’être proposé.

## M09 — Administration

```text
Administration TRACEOPS
Organisations | Accès | Journal d’audit | Assistance

Organisations                         [Créer une organisation]
[Rechercher une organisation]         Type [Tous v]
Nom                 Type              État          Action
Hôpital pilote      Client            Actif         [Ouvrir]
Services pilote     Prestataire       Actif         [Ouvrir]

Organisation / Hôpital pilote
Accès · Sites · Rattachements · Historique
Action exceptionnelle : [choisir]
Motif obligatoire : [                                        ]
[Examiner les conséquences]
```

L’administrateur ne prend pas l’identité d’un agent. Un contexte d’assistance indique toujours l’organisation concernée. La dernière étape résume la modification et sa portée avant confirmation ; le motif et l’identité administrative apparaissent dans l’audit. Ne pas introduire de suspension ou suppression effective avant leurs règles et API.

## Parcours de simulation sur papier

M01 → M02 → M03 → M04 → M05 → M06 → M07 → M06. Le facilitateur montre l’écran correspondant à l’action choisie et fournit le résultat prévu. Ce document n’est pas un prototype cliquable : aucune action ne modifie une base. Pour un essai sans facilitateur, construire ensuite le prototype interactif et annoncer explicitement ses données simulées.
