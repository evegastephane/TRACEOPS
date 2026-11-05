---
name: TRACEOPS
description: Console opérationnelle bleu nuit, blanche et cobalt, adaptée aux accès de chaque compte.
colors:
  indigo-900: "#152d44"
  indigo-800: "#213f5b"
  indigo-700: "#52708b"
  rail-text: "#f5f8ff"
  rail-muted: "#bdcfdf"
  ground: "#f3f5f8"
  surface: "#ffffff"
  surface-2: "#f7f9fc"
  hover: "#e8efff"
  ink: "#172634"
  ink-2: "#526781"
  line: "#d6e0ef"
  line-strong: "#829aba"
  saffron: "#2259d5"
  saffron-hover: "#1747af"
  saffron-tint: "#eef4ff"
  saffron-line: "#b6c9ee"
  vermilion: "#c3361c"
  vermilion-ink: "#8f2410"
  vermilion-tint: "#fde8e3"
  vermilion-line: "#f1b6a7"
  emerald: "#13774b"
  emerald-ink: "#0f5f3c"
  emerald-tint: "#e1f2e9"
  focus: "#2f4fc4"
  focus-on-dark: "#d98920"
  org-ink: "#526781"
  org-tint: "#e8efff"
  control-line: "#c5c9dc"
  navigation-active-ink: "#173e92"
  action-panel: "#eaf0f8"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
  title-panel:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: ".9375rem"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: ".875rem"
    fontWeight: 600
    lineHeight: 1.5
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: ".8125rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  control: "6px"
  navigation: "8px"
  panel: "12px"
  full: "999px"
spacing:
  space-6: "6px"
  space-8: "8px"
  space-10: "10px"
  space-12: "12px"
  space-16: "16px"
  space-18: "18px"
  space-20: "20px"
  space-24: "24px"
  space-28: "28px"
  space-32: "32px"
  space-40: "40px"
components:
  button-primary:
    backgroundColor: "{colors.saffron}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "{colors.saffron-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation-active:
    backgroundColor: "{colors.org-tint}"
    textColor: "{colors.navigation-active-ink}"
    rounded: "{rounded.navigation}"
    padding: "14px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "22px 24px 24px"
  action-panel:
    backgroundColor: "{colors.action-panel}"
    rounded: "{rounded.panel}"
  status-active:
    backgroundColor: "{colors.emerald-tint}"
    textColor: "{colors.emerald}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "3px 10px 3px 8px"
  status-suspended:
    backgroundColor: "{colors.vermilion-tint}"
    textColor: "{colors.vermilion}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "3px 10px 3px 8px"
---
# Design System: TRACEOPS

## Overview

**Creative North Star: "La console bleu nuit et cobalt"**

La direction adoptée de `docs/ux/prototype.html` s’applique à l’application React servie à `/` : en-tête blanc, navigation bleu nuit, contenu clair et actions cobalt. La présentation reste sobre, lisible et structurée par l’organisation sélectionnée. Cette version remplace l’ancienne direction à motifs textiles ; les fichiers de motifs encore présents ne définissent plus le système.

**Key Characteristics:**

- En-tête blanc et navigation bleu nuit ; organisation active clairement nommée.
- Surfaces blanches, filets fins et boutons cobalt ; aucun motif textile.
- Tableau de bord initial commun aux profils, avec contenu et actions selon leurs droits.
- Sur téléphone, navigation compacte et vues de liste/détail successives.

## Colors

Les couleurs du frontmatter suivent les valeurs effectives de `apps/web/src/style.css`, y compris ses règles finales de remplacement.

- **Primary — Cobalt :** action principale, survol plus sombre et teinte pâle des résultats à copier. Les noms CSS historiques `saffron`, `saffron-hover`, `saffron-tint` et `saffron-line` désignent maintenant ce bleu ; ils ne prescrivent aucune couleur safran.
- **Neutral — Bleu nuit :** `indigo-900` porte le rail et le panneau d’introduction de connexion ; `indigo-800` sert au survol sur fond sombre. `rail-text` et `rail-muted` assurent les deux niveaux de lecture.
- **Neutral — Blanc et gris bleuté :** `ground` porte le contenu, `surface` les cartes et champs, `surface-2` les en-têtes de tableau. `ink` et `ink-2` hiérarchisent les textes ; `line` délimite les surfaces et `line-strong` les champs. `action-panel` distingue les actions et repères.
- **États :** émeraude pour actif/succès ; vermillon pour suspendu/erreur. Le texte et le point de statut rendent l’information explicite.
- **Navigation et focus :** bleu pâle pour l’organisation et la rubrique actives ; encre bleue pour la rubrique active. Le focus est bleu sur fond clair et orange (`focus-on-dark`) sur les boutons du rail.

Les variables `org-ink` et `org-tint` sont désormais communes aux organisations ; elles ne désignent plus des identités textiles individuelles.

## Typography

Une police système sans empattement compose l’interface. Aucun chargement d’Archivo n’est requis par le système adopté. Les déclarations héritées de `font-stretch` ne constituent pas une promesse de police variable ou condensée.

La revendication de connexion utilise le rôle display ; le titre de page utilise headline. Les titres de panneaux sont plus compacts. Les boutons et tableaux utilisent une taille dense, les libellés restent visibles au-dessus des champs et les métadonnées sont plus discrètes. Les paragraphes sont limités à 68ch. La marque distingue TRACE en graisse 800 et OPS en graisse 400.

Les identifiants et secrets à copier utilisent `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. Les compteurs et identifiants utilisent des chiffres tabulaires lorsqu’ils sont définis dans les composants.

## Layout

L’en-tête blanc couvre toute la largeur (hauteur minimale 78px). Le rail bleu nuit occupe 220px ; le contenu flexible est plafonné à 1500px, avec 40px de marge interne. Le rail contient le choix d’organisation, les rubriques et un repère de contexte. Le compte, la langue et la déconnexion sont dans l’en-tête.

Le tableau de bord est la rubrique initiale pour tous les profils, à la connexion et au changement d’organisation ; il reste visible sans organisation accessible. Sa grille associe les panneaux de périmètre, sites et disponibilité des interventions à un panneau d’actions de 300px, avec un écart de 24px. À 1050px et moins, les actions passent avant les autres panneaux et la grille devient une colonne ; les marges du contenu passent à 28px et le nom du compte disparaît de l’en-tête.

L’équipe et les sites conservent une composition liste/détail. À partir de 1240px, le volet équipe mesure 300–360px (280–320px jusqu’à 1439px) et peut rester collant à 24px du haut ; les sites ont une liste de 260–340px. En dessous de 1240px, liste, détail et formulaire alternent. Un formulaire de lieu remplace le volet du site et masque sa liste.

À 760px et moins, le rail devient une navigation horizontale qui peut revenir à la ligne. Avec plusieurs organisations, la sélection des organisations reste une vue distincte accessible par le retour « Organisations ». Les marges du contenu deviennent 28px 16px ; le titre de page passe à 1.75rem. Le tableau d’équipe devient des cartes empilant nom, identifiant, rôle et accès. Les sites du tableau de bord restent une liste de noms ; l’action d’ouverture du module est dans les actions rapides.

La connexion présente un panneau bleu nuit et une carte blanche de 440px maximum dans un ensemble de 1120px maximum. Sur téléphone, la carte précède l’introduction ; la revendication passe à 1.5rem.

## Elevation & Depth

Les cartes sont plates : les fonds, bordures fines et espaces établissent la hiérarchie, sans ombre portée. Les surfaces de formulaire restent intégrées au flux ou au volet de détail. La rubrique active utilise un fond pâle, sans ancien soulignement par ombre intérieure.

## Shapes

Les contrôles ont des coins de 6px, la navigation de 8px et les panneaux de 12px. Les statuts et compteurs sont des capsules ; les avatars sont circulaires. Les panneaux et tableaux sont bordés d’un filet de 1px. Aucun liseré imprimé, pastille textile ou bande de motif n’est rendu par l’application principale.

## Components

- **Boutons :** primaire cobalt à texte blanc ; secondaire blanc avec contour discret. Le survol modifie la couleur en 150ms. Un bouton désactivé a une opacité de 0.55. Les liens de retour sont soulignés.
- **Champs :** fond blanc, contour lisible, libellé au-dessus, espacement de 18px entre champs. Le focus utilise un contour de 2px. Les champs de secret sont en chasse fixe et accompagnés d’une action de copie.
- **Navigation :** organisation active et rubrique active sur bleu pâle ; organisation, type et rôle se lisent dans le rail. Le tableau de bord est toujours proposé ; les autres rubriques suivent les conditions d’accès de l’application.
- **Panneaux :** blancs avec contour, titres courts et marges internes définies par `panel`. Le résultat d’invitation utilise la teinte cobalt pâle. Les actions rapides et le panneau d’ajout au repos utilisent le gris bleuté `action-panel`.
- **Équipe :** tableau sur ordinateur, avatars à initiales, statuts texte + point, cartes sur téléphone. Erreur, liste vide et chargement restent distincts.
- **Sites et salles :** lignes sélectionnables, sélection bleu pâle, recherche de lieux et étiquettes de type/code. Les créations restent soumises aux droits existants.
- **Tableau de bord :** nombre d’organisations fourni par le contexte réel, liste et nombre de sites issus de l’API lorsque le profil y a accès, profil actif et actions autorisées. Les missions, contrôles et anomalies sont explicitement indisponibles ; aucun indicateur opérationnel fictif n’est présenté. Un site en chargement affiche un texte d’attente ; une valeur indisponible affiche un tiret, jamais un zéro inventé.

Le chargement de l’équipe peut employer un squelette animé (1.4s). `prefers-reduced-motion: reduce` désactive animations et transitions. Les mécanismes de focus, de langue français/anglais et les états d’erreur font partie du comportement des composants.

## Do's and Don'ts

- Do conserver les libellés de champs visibles et un focus clavier perceptible.
- Do associer les couleurs d’état à un texte explicite.
- Do afficher chargement, erreur, absence de données et indisponibilité comme des états distincts.
- Do limiter les actions rapides aux fonctions autorisées pour le compte.
- Don’t réintroduire les motifs textiles, la police Archivo ou les actions safran de l’ancienne direction.
- Don’t présenter les indicateurs simulés du prototype comme des données connectées.
- Don’t convertir une donnée indisponible ou en erreur en un zéro.
- Don’t ajouter des ombres aux panneaux courants.
