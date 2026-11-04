---
name: TRACEOPS
description: Console claire de gestion des accès, en français et en anglais.
colors:
  primary: "#176448"
  primary-hover: "#0d4f37"
  navigation: "#173b2e"
  background: "#f4f6f3"
  surface: "#ffffff"
  text: "#172d26"
  muted: "#53665d"
  border: "#d9e2da"
  field-border: "#a7b8ac"
  sidebar: "#eaf0e9"
  secondary-text: "#234f3b"
  secondary-hover: "#e9f0e9"
  field-focus: "#a6d1b8"
  focus: "#74b799"
  error-background: "#fff0ed"
  error-text: "#8b2020"
  result-background: "#edf6ee"
  result-border: "#b1ccb8"
  table-heading: "#eef2ed"
  table-divider: "#e5ebe4"
  status-text: "#175534"
  status-background: "#e5f1e7"
  count-background: "#e0e9e0"
  empty-background: "#f8faf7"
  empty-border: "#b2c3b5"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-.015em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: ".875rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  badge: "4px"
  field: "6px"
  button: "7px"
  table: "9px"
  panel: "10px"
spacing:
  space-4: "4px"
  space-8: "8px"
  space-10: "10px"
  space-12: "12px"
  space-16: "16px"
  space-18: "18px"
  space-20: "20px"
  space-24: "24px"
  space-28: "28px"
  space-32: "32px"
  space-44: "44px"
  space-48: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary-text}"
    rounded: "{rounded.button}"
    padding: "11px 18px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  status:
    backgroundColor: "{colors.status-background}"
    textColor: "{colors.status-text}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "28px"
---

# Design System: TRACEOPS

## Overview

Mode Operate. La console privilégie des surfaces claires, une navigation vert profond et des tableaux lisibles. La densité sert la gestion des accès ; les formulaires restent dans le flux de la page.

Cette documentation décrit le code actuel de connexion et de gestion des comptes, en français et en anglais. Elle actualise la direction existante sans ajouter de nouvelle métaphore de marque ni présumer une approbation créative.

**Key Characteristics:**

- Surfaces plates et contrastes de tons.
- Navigation et actions vertes, contenus sur blanc.
- Champs étiquetés et focus visibles.
- Tableau conservé sur mobile avec défilement horizontal.

## Colors

Le vert profond structure la navigation et les actions ; les verts très pâles séparent les surfaces. Les valeurs du frontmatter sont extraites de `apps/web/src/style.css`.

### Primary

Le vert d’action (`primary`) porte les boutons principaux et fonce au survol. Le vert de navigation (`navigation`) porte la barre supérieure et le panneau de présentation de la connexion. Les verts de focus rendent les contrôles repérables au clavier.

### Neutral

Le fond blanc cassé (`background`) encadre les surfaces blanches (`surface`). Le texte principal sombre et le texte secondaire désaturé définissent la hiérarchie ; les bordures fines séparent champs et tableaux.

Les résultats utilisent un fond vert pâle et une bordure dédiée. Les erreurs utilisent un fond rouge pâle et un texte rouge sombre. La valeur effective du texte d’erreur est celle du frontmatter ; elle remplace l’ancienne valeur indicative du document.

## Typography

**Display Font / Body Font:** Inter, puis ui-sans-serif, system-ui, -apple-system, sans-serif. Inter figure dans la pile CSS ; aucun chargement de police externe n’est défini dans cette feuille.

La hiérarchie est sobre : grand titre de présentation sur la connexion, titre de page, titres de section et libellés compacts. Le texte courant utilise une hauteur de ligne de 1,5 et les paragraphes une longueur maximale de 65ch. Les valeurs normatives de ces rôles sont dans le frontmatter. Le titre de connexion utilise 2rem avec une hauteur de ligne de 1,2 ; le titre de page passe à 1,7rem sur mobile. Le logo combine TRACE en graisse 800 et OPS en graisse 400 ; les compteurs utilisent des chiffres tabulaires.

## Layout

La connexion desktop utilise deux colonnes 42% / 58%, un panneau de présentation pleine hauteur et un formulaire limité à 390px. La console authentifiée possède une barre supérieure de 78px, une colonne latérale de 260px et un contenu flexible plafonné à 1450px avec 44px de marge intérieure. Les formulaires et résultats sont limités à 660px.

À 1050px et moins, les titres et actions s’empilent, l’identité dans la barre supérieure disparaît et le contenu passe à 30px de marge intérieure. À 700px et moins, la connexion devient une colonne, le texte de présentation disparaît, la navigation d’organisation passe au-dessus du contenu et les panneaux utilisent 20px de marge intérieure. Le contenu utilise 28px verticalement et 18px horizontalement ; les actions peuvent revenir à la ligne.

Sur mobile, le tableau conserve ses quatre colonnes avec une largeur minimale de 620px dans une région horizontalement défilable. Cette région porte un nom accessible, reçoit le focus clavier et affiche une consigne de défilement. Les rôles et statuts ne se coupent pas ; les noms et identifiants peuvent revenir à la ligne. La direction existante cible une largeur mobile de 360px ; cela n’est pas une largeur minimale CSS imposée au document.

## Elevation & Depth

Aucune ombre n’est définie. La profondeur repose sur les surfaces colorées, les contours fins et l’espacement. Les formulaires et résultats sont intégrés au flux ; ils ne sont pas des fenêtres modales.

## Shapes

Les coins sont légèrement arrondis, selon les rôles du frontmatter : badges, champs, boutons, tableau et panneaux. Les bordures ordinaires sont continues et fines (1px), tandis que l’état vide utilise une bordure en pointillés. Le point du logo est circulaire.

## Components

### Buttons

Les boutons principaux sont verts avec texte blanc et graisse 600. Le survol assombrit le fond, avec une transition de fond de 150ms. Les boutons secondaires sont blancs, bordés, et prennent un fond vert pâle au survol. Les boutons désactivés utilisent une opacité de 0,55 et un curseur d’attente. Le focus clavier des boutons et liens est un contour de 3px décalé de 3px. Le bouton textuel de déconnexion du changement de mot de passe se souligne au survol ; celui de la barre supérieure est transparent et bordé.

### Chips

Le compteur d’équipe est un petit rectangle vert grisé. Le statut est un badge vert pâle avec texte vert. Les textes Actif et Suspendu sont distincts, mais utilisent actuellement la même présentation chromatique ; aucune variante rouge de suspension n’est implémentée.

### Cards / Containers

Les panneaux de formulaire sont blancs ; les résultats emploient leur fond et bordure verts dédiés. Les états vides possèdent une bordure en pointillés et un fond presque blanc. Ils ne contiennent pas de métriques fictives.

### Inputs / Fields

Les champs, listes natives et zones de texte utilisent un fond blanc et un contour vert grisé. Les libellés restent visibles avec un espacement de 7px. Le focus des champs est un contour de 3px décalé de 2px. Les formulaires utilisent un espacement de 20px et les contraintes HTML natives. Les erreurs applicatives apparaissent dans un bloc `role="alert"` ; aucun style de bordure d’erreur par champ n’est défini.

### Navigation

La barre supérieure contient le logo, la langue, l’identité desktop et la déconnexion. La colonne latérale contient le sélecteur d’organisation et, pour l’administration, la création d’organisation. Il n’existe pas de menu de rubriques avec état actif. Le choix de langue est mémorisé localement et met à jour la langue du document.

### Team table and feedback

Le tableau utilise de vrais en-têtes, un fond d’en-tête teinté et des séparateurs de lignes. Les cellules ont une marge intérieure de 16px × 20px, réduite à 12px sur mobile. Les chargements portent `role="status"` et l’erreur de chargement de l’équipe propose une relance. Les résultats de création sont annoncés poliment, contiennent une zone de texte en lecture seule et une action Copier/Copié. La fermeture efface le secret de l’interface. Les invitations et mots de passe temporaires ne deviennent pas un historique visuel.

Les transitions sont supprimées quand `prefers-reduced-motion: reduce` est actif.

## Do's and Don'ts

### Do:

- Do conserver des libellés visibles et les traductions françaises et anglaises.
- Do garder les messages de chargement, erreurs et résultats dans le flux.
- Do conserver les en-têtes et le défilement clavier du tableau mobile.

### Don't:

- Don't présenter des opérations futures comme disponibles.
- Don't remplacer les données absentes par des indicateurs fictifs.
- Don't conserver à l’écran les secrets après fermeture de leur panneau.
