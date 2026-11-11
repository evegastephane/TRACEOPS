---
name: TRACEOPS
description: Suivi et contrôle d'interventions de nettoyage et de maintenance, lu comme un rapport d'audit signé.
colors:
  shell: "#0e4a5c"
  shell-hover: "#135a6e"
  shell-active: "#1c687d"
  shell-ink: "#ffffff"
  shell-ink-2: "#cfe0e5"
  shell-ink-3: "#a9c6cd"
  page: "#f1f4f5"
  sheet: "#ffffff"
  sheet-2: "#f6f8f9"
  sheet-3: "#eaf0f2"
  rule: "#c9d5d9"
  rule-2: "#e0e7e9"
  rule-3: "#a7b9bf"
  ink: "#17262c"
  ink-2: "#3f5058"
  ink-3: "#55656c"
  petrol: "#0e4a5c"
  petrol-hover: "#0a3a49"
  petrol-tint: "#e4eef1"
  petrol-tint-2: "#cfe1e7"
  focus: "#155f75"
  ok: "#226b43"
  ok-mark: "#2e8b57"
  ok-tint: "#eaf5ee"
  ok-rule: "#9dccb0"
  warn: "#8a5d0c"
  warn-mark: "#d99a1e"
  warn-tint: "#fdf5e4"
  warn-rule: "#e6c88a"
  bad: "#b3261e"
  bad-mark: "#c8372d"
  bad-tint: "#fbecea"
  bad-rule: "#eaa8a2"
  info: "#1f5566"
  info-tint: "#e7f0f3"
  info-rule: "#a9c6cd"
  series-accepted: "#2e8b57"
  series-review: "#d99a1e"
  series-alert: "#c8372d"
  series-planned: "#336f85"
  series-assign: "#6aa1b4"
  ordinal-1: "#93bccb"
  ordinal-2: "#6aa1b4"
  ordinal-3: "#4b879c"
  ordinal-4: "#336f85"
  ordinal-5: "#1e5b70"
  ordinal-6: "#0e4a5c"
typography:
  display:
    fontFamily: "Source Sans 3 Variable, Source Sans 3, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "52px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Source Sans 3 Variable, Source Sans 3, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.012em"
  kpi:
    fontFamily: "Source Sans 3 Variable, Source Sans 3, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title:
    fontFamily: "Source Sans 3 Variable, Source Sans 3, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Source Sans 3 Variable, Source Sans 3, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "lnum"
  label:
    fontFamily: "Source Sans 3 Variable, Source Sans 3, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.07em"
  meta:
    fontFamily: "Source Sans 3 Variable, Source Sans 3, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.35
  mono:
    fontFamily: "Source Code Pro Variable, Source Code Pro, ui-monospace, Consolas, Cascadia Mono, monospace"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.3
    fontFeature: "tnum"
rounded:
  r-1: "2px"
  r-2: "3px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "16px"
  xl: "18px"
  page-x: "32px"
components:
  button-primary:
    backgroundColor: "{colors.petrol}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.r-2}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.petrol-hover}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-2}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.sheet-2}"
  button-danger:
    backgroundColor: "{colors.bad}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.r-2}"
    padding: "0 14px"
    height: "36px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-2}"
    padding: "7px 10px"
    height: "38px"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-1}"
    padding: "12px 18px 16px"
  cartouche-label:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  state-chip-green:
    backgroundColor: "{colors.ok-tint}"
    textColor: "{colors.ok}"
    rounded: "{rounded.r-1}"
    padding: "2px 7px"
  state-chip-amber:
    backgroundColor: "{colors.warn-tint}"
    textColor: "{colors.warn}"
    rounded: "{rounded.r-1}"
    padding: "2px 7px"
  state-chip-red:
    backgroundColor: "{colors.bad-tint}"
    textColor: "{colors.bad}"
    rounded: "{rounded.r-1}"
    padding: "2px 7px"
  state-chip-info:
    backgroundColor: "{colors.info-tint}"
    textColor: "{colors.info}"
    rounded: "{rounded.r-1}"
    padding: "2px 7px"
  nav-item:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink-2}"
    rounded: "{rounded.r-2}"
    padding: "0 10px"
    height: "38px"
  nav-item-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.petrol}"
  visa-cell:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    padding: "10px 14px 12px"
    height: "92px"
  visa-cell-mine:
    backgroundColor: "{colors.warn-tint}"
    textColor: "{colors.warn}"
  segmented-active:
    backgroundColor: "{colors.petrol}"
    textColor: "{colors.shell-ink}"
    height: "30px"
---

# Design System: TRACEOPS

## Overview

**Creative North Star: "Le rapport d'audit"**

Chaque intervention se lit comme un rapport qualité signé. Une coque pétrole pleine hauteur porte le mot-symbole, l'organisation et les rubriques à plat ; le contenu est posé sur un fond gris document, en feuilles blanches à filets fins et coins presque droits. En tête de chaque écran, un cartouche à cellules filetées donne les faits (organisation, site, période, édité le … par …) comme l'en-tête d'un rapport. Le geste signature est la bande de visa (demandé, devis, affecté, réalisé, contrôlé) : chaque case signée porte un nom et une date, la case vide dit qui doit agir.

La densité est celle d'un registre : lignes de tableau serrées, chiffres tabulaires, libellés de champ en petites majuscules espacées, hiérarchie portée par la graisse et la taille plutôt que par la couleur. Le pétrole est la seule couleur d'identité ; vert, ambre et rouge n'apparaissent que pour dire un état, toujours accompagnés d'un mot. Les graphiques sont sobres : grilles en filet, étiquettes de valeur au-dessus des colonnes, données consultables en tableau.

Le système refuse deux pentes : la console grise à un seul bleu de la catégorie (le monde précédent, retiré), et le document costumé (texture papier, tampons, sceaux, faux manuscrit). Le rapport est évoqué par la structure (cartouche, cellules, visas), jamais par un décor. Thème clair uniquement : bureaux et sites en plein jour.

**Key Characteristics:**
- Coque pétrole pleine hauteur (240 px, repliable à 68 px), feuilles blanches à filets sur gris document.
- Cartouche en tête d'écran : titre 28 px, cellules à libellé en petites majuscules.
- Bande de visa en grand sur le dossier, compacte dans les listes, en mini-bande de cinq carrés ailleurs.
- Couleurs de conformité réservées aux états, toujours doublées d'un mot.
- Une famille, Source Sans 3 ; Source Code Pro seulement pour références, codes, identifiants et secrets.
- Un seul mouvement signé : le coup de tampon de la case de visa ; plus le glissement du panneau latéral.

## Colors

Un pétrole profond unique sur des gris bleutés de document, plus trois couleurs de conformité tenues en réserve.

### Primary
- **Pétrole de coque** (shell / petrol): fond de la barre latérale et de la colonne d'accueil de connexion, bouton principal, segment actif, jour courant du planning, cases signées de la bande de visa, titres de feuille, courbe du taux, valeur héroïque des indicateurs. Survol des boutons en **pétrole nuit** (petrol-hover).
- **Pétrole survol / actif de coque** (shell-hover, shell-active): survol des rubriques et organisation sélectionnée dans la coque.
- **Teintes pétrole** (petrol-tint, petrol-tint-2): ligne ou site sélectionné, case cochée, fond de jauge, sélection de texte.
- **Pétrole de focus** (focus): anneau de focus de 2 px décalé de 2 px partout ; blanc dans la coque.

### Secondary (conformité, réservée aux états)
- **Vert conforme** (ok-mark pour les marques, ok pour le texte, ok-tint et ok-rule pour les fonds et filets): accepté, effectué, actif, jauge de conformité.
- **Ambre observation** (warn-mark, warn, warn-tint, warn-rule): à contrôler, en attente de votre visa, « à vous de viser ».
- **Rouge non-conformité** (bad-mark, bad, bad-tint, bad-rule): reprise, retard, refus, tâche impossible, erreur, action destructrice.
- **Bleu information** (info, info-tint, info-rule): état neutre-actif (planifiée) sur les puces et les passages du planning ; c'est un pétrole désaturé, pas un second accent.

### Tertiary (graphiques)
- **Séries de résultats** (series-accepted, series-review, series-alert): les résultats prennent les teintes de conformité.
- **Séries en attente** (series-planned, series-assign): les étapes en attente (planifiées, à affecter ou à chiffrer) prennent la rampe ordinale pétrole.
- **Rampe ordinale pétrole** (ordinal-1 à ordinal-6): étapes successives de la chaîne dans le registre des étapes, du plus clair (demande) au pétrole de coque (acceptées).

### Neutral
- **Gris document** (page): fond de page sous les feuilles.
- **Feuille** (sheet, sheet-2, sheet-3): feuille blanche ; en-têtes de tableau, pieds de panneau et survols ; fonds de squelette et de photo.
- **Filets** (rule, rule-2, rule-3): filet de feuille et de cellule ; séparateur interne de ligne ; bord de champ et de bouton secondaire.
- **Encres** (ink, ink-2, ink-3): texte principal ; texte secondaire et libellés de formulaire ; méta, libellés de cellule, axes.
- **Encres de coque** (shell-ink, shell-ink-2, shell-ink-3): texte blanc, rubriques au repos, méta dans la coque.

### Named Rules
**La règle des états réservés.** Vert, ambre et rouge ne servent qu'à dire un état (conforme, observation ou attente, non-conformité, retard, erreur) et sont toujours accompagnés d'un mot. Aucun avatar, aucune décoration, aucun graphique d'étape en attente ne les emprunte.

**La règle d'une seule voix.** Le pétrole est la seule couleur d'identité. Pas de second accent : le bleu information reste un pétrole désaturé.

**La règle de la rampe ordinale.** Ce qui est une étape de la chaîne prend la rampe pétrole ordonnée ; ce qui est un résultat prend la teinte de conformité.

## Typography

**Display Font:** Source Sans 3 Variable (avec ui-sans-serif, system-ui, Segoe UI)
**Body Font:** Source Sans 3 Variable
**Label/Mono Font:** Source Code Pro Variable (avec ui-monospace, Consolas, Cascadia Mono)

**Character:** une humaniste de rapport technique, nette en petite taille et en chiffres tabulaires ; la monospace marque ce qu'on recopie (numéro d'intervention, code de lieu, identifiant, mot de passe temporaire).

### Hierarchy
- **Display** (700, 52 px, 1.05, -0.02em, chiffres tabulaires): la seule valeur héroïque d'un tableau de bord (conformité au premier contrôle), en pétrole ; 44 px sur téléphone.
- **Headline** (700, 28 px, 1.15, -0.012em): titre du cartouche, un par écran ; 22 px sur téléphone. Le titre de connexion est à 24 px, l'accroche de la colonne pétrole à 30 px.
- **KPI** (700, 30 px, 1.05): valeurs de la bande d'indicateurs, rouge seulement pour « en retard » ; 26 px sur téléphone.
- **Title** (700, 15.5 px, 1.3): titres de feuille en pétrole ; titres de panneau 16 px en encre ; nom de visa 15 px.
- **Body** (400, 14 px, 1.5): texte courant ; 15 px sur téléphone, champs à 16 px pour éviter le zoom. Introductions limitées à 72ch.
- **Meta** (600 ou 400, 12.5 à 13.5 px): méta de feuille, en-têtes de tableau, puces d'état, légendes.
- **Label** (700, 11 px, 0.07em, majuscules): libellés de cellule du cartouche, étapes de visa, faits du dossier, libellés de carte mobile ; 10 px dans la bande compacte.
- **Mono** (600, 12.5 px): références INT-…, codes de lieu, identifiants, secrets.

### Named Rules
**La règle de la monospace réservée.** Source Code Pro ne sert qu'aux références, codes, identifiants et secrets. Jamais aux titres, aux chiffres d'indicateurs ni aux libellés.

**La règle du libellé de champ.** Les petites majuscules espacées étiquettent un champ ou une cellule (Site, Période, Demandé par). Elles ne surmontent jamais un titre comme surtitre.

**La règle des chiffres tabulaires.** Tout chiffre qui se compare (indicateurs, compteurs, heures, dates de visa, colonnes de tableau) est en chiffres tabulaires.

## Layout

Grille d'application à deux colonnes : coque de 240 px (68 px repliée, 216 px sous 1024 px) et contenu centré limité à 1440 px, marges de 22 × 32 px (18 × 22 px sous 1024 px, 14 × 16 px au téléphone). Les blocs d'un tableau de bord s'empilent avec un pas de 16 px : cartouche, bande d'indicateurs (héros 1,55 fraction puis quatre colonnes égales), paires de feuilles (1,25 / 1 ou 1,6 / 1), tableaux pleine largeur.

Dossier : colonne principale et colonne latérale de 360 px (320 px sous 1280 px, empilées sous 1024 px). Panneau latéral d'édition de 420 px, collant, à côté de la liste ; sous 1280 px il remplace la liste. Planning : grille horaire 56 px + sept jours, 56 px par heure ; au téléphone, liste par jour.

Rythme interne : cellules et feuilles à 18 px de marge latérale, 10 à 14 px verticale ; lignes de tableau à 10 × 12 px (en-tête 9 px) ; écarts de 6, 8, 10, 12, 14, 16 px.

Points de rupture : 1279 px (panneau à la place de la liste, indicateurs sur trois colonnes), 1023 px (grilles de feuilles en une colonne, bande de visa en tuiles, indicateurs sur deux colonnes), 767 px (coque en barre supérieure avec rubriques défilantes, tableaux en cartes à libellés, cibles de 44 px, bande de visa en une colonne et compacte en deux). Les tableaux s'adaptent aussi par requêtes de conteneur (colonnes secondaires masquées sous 900 et 760 px).

**La règle de la navigation à plat.** Chaque rubrique est un onglet de la coque ; aucun groupe repliable, aucun sous-menu, y compris la liste des organisations.

## Elevation & Depth

Système plat à filets. La profondeur vient du contraste gris document / feuille blanche et des filets ; l'ombre est un souffle presque invisible sur les feuilles et ne devient réelle que pour ce qui flotte.

### Shadow Vocabulary
- **Feuille** (`box-shadow: 0 1px 2px rgb(14 74 92 / .05)`): feuilles, cartouche, bande d'indicateurs, tableaux, bande de visa pleine.
- **Panneau** (`box-shadow: 0 14px 30px -12px rgb(14 74 92 / .24), 0 2px 6px rgb(14 74 92 / .06)`): panneau latéral et infobulle de graphique uniquement.

### Named Rules
**La règle du filet d'abord.** Une séparation se fait par un filet de 1 px (rule entre feuilles et cellules, rule-2 entre lignes), jamais par une ombre ni par un fond coloré.

## Shapes

Coins presque droits : 2 px (r-1) pour les feuilles, cartouches, tableaux, puces d'état et numéros d'étape ; 3 px (r-2) pour les contrôles (boutons, champs, segments, rubriques, cases, photos). Les seules formes rondes sont les avatars ronds, la pastille d'agent (999 px), les points de chronologie et de statut, et le point du mot-symbole. Filets pleins de 1 px partout ; le pointillé est réservé à ce qui manque encore : case de visa en attente (trait pointillé en pied de case), mini-visa en attente, « sans photo », ajout d'organisation, zone d'indication vide.

## Components

### Buttons
Fermes et sobres, une seule action principale par étape.
- **Shape:** coins de 3 px, hauteur 36 px (32 px petit, 42 px large, 44 px au téléphone), graisse 600, icône de 16 px et écart de 7 px.
- **Primary:** fond pétrole, texte blanc ; survol pétrole nuit.
- **Secondary:** fond feuille, filet rule-3, encre ; survol feuille-2 et filet ink-3.
- **Danger:** fond rouge plein pour la confirmation destructrice ; variante contour rouge et lien rouge souligné pour l'amorce.
- **Link button:** pétrole souligné à 35 % d'opacité, plein au survol.
- **Focus:** anneau pétrole de 2 px décalé de 2 px ; transitions de couleur de 150 ms.

### Chips
- **État:** puce à coins de 2 px, 12,5 px graisse 600, fond teinte + filet + texte foncé de la même famille (vert, ambre, rouge, information, neutre). Toujours un mot ; icône de 13 px facultative.
- **Statut d'accès:** même puce précédée d'un point plein (actif) ou d'un anneau (suspendu).
- **Code de lieu:** monospace 12 px dans un cadre filet sur feuille-2.
- **Compteur de rubrique:** pastille translucide dans la coque, pétrole sur teinte quand la rubrique est active.

### Cards / Containers
- **Corner Style:** 2 px.
- **Background:** feuille blanche sur gris document.
- **Shadow Strategy:** ombre « Feuille » (voir Elevation & Depth).
- **Border:** filet rule ; filet rouge et titre rouge pour une feuille d'alerte (à reprendre, en retard) ; filet ambre et bandeau ambre pâle de 3 px en tête pour la feuille « Prochaine étape » quand une action vous attend.
- **Internal Padding:** en-tête 13 × 18 px, corps 12 × 18 × 16 px ; sous-section séparée par un filet rule-2.

### Inputs / Fields
- **Style:** filet rule-3, fond feuille, coins de 3 px, 38 px de haut, libellé persistant au-dessus (13 px, 600, ink-2) et aide en 12,5 px.
- **Focus:** filet pétrole et halo de 3 px à 16 % de pétrole.
- **Error / Disabled:** lecture seule sur feuille-2 ; désactivé à 50 % d'opacité ; erreurs dans une alerte rouge à icône. Secrets en monospace sur feuille-2.

### Navigation
- **Coque:** fond pétrole, mot-symbole blanc, carte d'organisation filetée, rubriques de 38 px à 14,5 px graisse 500 en shell-ink-2 avec icône de 17 px ; survol shell-hover ; rubrique active en feuille blanche, texte et icône pétrole, graisse 700. Entre le mot-symbole et le pied, organisation, rubriques et liste des organisations défilent en une seule colonne (fondu de 20 px en bas) : rien ne s'écrase sur un écran bas. Le libellé « Plateforme » n'existe que pour l'administrateur. En pied, le bloc du compte est l'onglet « Mon profil » (avatar, nom, « Mon profil »), actif en feuille blanche comme une rubrique ; langue et déconnexion dessous. Sur téléphone, « Mon profil » rejoint la bande d'onglets.
- **Téléphone:** barre pétrole de 56 px, rubriques défilant horizontalement, langue et déconnexion en haut à droite.

### Cartouche (signature)
En-tête de chaque écran : feuille pleine largeur, titre 28 px et sous-titre, actions à droite ; dessous, une rangée de cellules filetées (minimum 180 px) à libellé en petites majuscules et valeur 14 px graisse 600. Ne contient que des faits ; le sélecteur de période 7 / 30 / 90 j est un contrôle segmenté dans la cellule Période.

### Bande de visa (signature)
Cinq cases filetées dans une feuille à filet rule-3. Chaque case : étape en petites majuscules avec numéro carré, nom 15 px graisse 700, date en chiffres tabulaires, note. **Signée** : numéro plein pétrole et coche pétrole en haut à droite. **En attente** : nom en ink-2 et trait pointillé en pied. **À vous** : fond ambre pâle, nom ambre. **Reprise / refus** : fond rouge pâle, nom et note rouges. **À venir** : nom en ink-3. Variante **compacte** dans les tableaux (cases 5 × 9 px, nom 13 px, étape 10 px, coche 14 px, sans numéro) et **mini-bande** de cinq carrés de 11 px dans les listes.
- **Motion:** une case qui vient d'être signée reçoit le coup de tampon : la coche entre en 180 ms (échelle 1,35 et rotation -8° vers repos), puis son trait se dessine en 320 ms après 120 ms.

### Registre et tableaux
En-tête sur feuille-2 à 12,5 px graisse 600, lignes séparées par rule-2, survol presque blanc, ligne sélectionnée en teinte pétrole ; références en monospace dans la première colonne. Le tableau de conformité du dossier numérote chaque tâche dans un carré (vert effectué, rouge impossible), avec résultat, auteur et date, photos avant / après de 88 × 66 px ou « sans photo » pointillé. Au téléphone, chaque ligne devient une carte à libellés en petites majuscules.

### Indicateurs et graphiques
Bande d'indicateurs en une feuille découpée par filets ; jauge de 6 px verte sur teinte pétrole. Colonnes empilées, courbe de taux pétrole de 2 px à points cerclés, registre des étapes en barres horizontales de 14 px sur la rampe ordinale avec numéro d'étape, barres classées segmentées de 8 px. Grilles en rule-2, axes en rule-3, étiquettes 11 px tabulaires ; la période à venir est grisée et nommée. Infobulle en feuille avec ombre « Panneau » ; légende à carrés de 10 px avec effectifs ; chaque graphique a sa table de données.

### Panneau latéral
Feuille de 420 px à ombre « Panneau », en-tête de 56 px, pied sur feuille-2 avec actions à droite (empilées pleine largeur au téléphone). Entre en glissant de 8 px avec fondu en 220 ms.

### Mes missions (agent)
Lignes de mission larges : heure en 20 px pétrole graisse 700, titre 15 px, lieu, progression des tâches en jauge ; feuilles d'alerte rouges en tête pour les reprises et les retards.

## Do's and Don'ts

### Do:
- **Do** ouvrir chaque écran par le cartouche, avec des faits seulement (organisation, site, période, édité le … par …).
- **Do** montrer la bande de visa partout où une intervention apparaît : pleine sur le dossier, compacte dans les tableaux, mini-bande dans les listes ; la case vide nomme qui doit agir.
- **Do** doubler chaque couleur d'état d'un mot (« À contrôler », « En retard », « sans photo »).
- **Do** donner aux étapes en attente la rampe ordinale pétrole et réserver vert, ambre, rouge aux résultats dans les graphiques.
- **Do** séparer par des filets de 1 px et garder les coins à 2 px (feuilles) et 3 px (contrôles).
- **Do** mettre en chiffres tabulaires tout chiffre comparable, et en monospace les seules références, codes, identifiants et secrets.
- **Do** viser des cibles de 44 px au téléphone et un anneau de focus pétrole de 2 px partout.
- **Do** supprimer toute animation et transition sous prefers-reduced-motion.

### Don't:
- **Don't** revenir à la console grise à un seul bleu de la catégorie, ni à Inter.
- **Don't** costumer le rapport : pas de texture papier, de tampon encré, de sceau ni de faux manuscrit ; le « coup de tampon » reste une coche pétrole.
- **Don't** poser un surtitre en petites majuscules au-dessus d'un titre, ni une bande colorée latérale sur une feuille ou une ligne, ni une numérotation décorative (les numéros d'étape et de tâche sont des données).
- **Don't** utiliser vert, ambre ou rouge pour décorer, distinguer des personnes ou colorer un avatar.
- **Don't** afficher un objectif, une référence de document ou un chiffre que le produit ne calcule pas réellement.
- **Don't** ajouter un mouvement signé autre que le coup de tampon de visa et le glissement du panneau.
- **Don't** introduire un thème sombre : le système est clair uniquement.
- **Don't** regrouper des rubriques dans un menu repliable ou un sous-menu.
