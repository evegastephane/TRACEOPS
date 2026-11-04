---
name: TRACEOPS — prototype Operate
description: Proposition visuelle limitée au prototype interactif des interventions.
colors:
  primary: "#2259d5"
  primary-hover: "#1948b1"
  navigation: "#152d44"
  workspace: "#f3f5f8"
  surface: "#ffffff"
  ink: "#172634"
  muted: "#526478"
  line: "#dbe2ea"
  field-border: "#91a2b5"
  secondary-hover: "#edf2fa"
  support: "#eaf0f8"
  nav-text: "#c8d8e6"
  nav-hover: "#284359"
  nav-current: "#e8f0ff"
  nav-current-text: "#183b81"
  status: "#e8effb"
  status-text: "#244989"
  review: "#fff0cc"
  review-text: "#775000"
  validated: "#dff2e7"
  validated-text: "#21613b"
  rework: "#ffebe3"
  rework-text: "#9a3a17"
  error: "#ffebe8"
  error-text: "#8b2a21"
  success: "#e1f2e8"
  success-text: "#245438"
  focus: "#d98920"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.7rem, 3vw, 2.3rem)"
    lineHeight: 1.2
    letterSpacing: "-.03em"
  title:
    fontSize: "1.15rem"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    lineHeight: 1.5
  label:
    fontSize: ".9rem"
    fontWeight: 650
  badge:
    fontSize: ".78rem"
    fontWeight: 650
rounded:
  badge: "5px"
  field: "7px"
  control: "8px"
  panel: "12px"
spacing:
  compact: "8px"
  control-gap: "12px"
  mobile-gutter: "16px"
  form-gap: "20px"
  panel-gap: "22px"
  panel-padding: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px"
  navigation-current:
    backgroundColor: "{colors.nav-current}"
    textColor: "{colors.nav-current-text}"
    padding: "12px 16px"
  badge:
    backgroundColor: "{colors.status}"
    textColor: "{colors.status-text}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
---

# Design System: TRACEOPS — prototype Operate

## Overview

**Creative North Star: "Operate"**

Proposition expérimentale extraite de `../prototype.html`. Ce document s’applique uniquement au prototype synthétique des interventions. Il ne remplace ni le DESIGN.md racine ni la direction de l’application livrée.

Une navigation stable encadre une liste de travail lisible. Le titre, l’état et la prochaine action passent avant les informations d’organisation ; les responsabilités client, prestataire, agent et contrôleur restent explicites.

**Key Characteristics:**

- Navigation bleu nuit et action principale cobalt.
- Surfaces claires, panneaux plats, hiérarchie par espacement.
- Statuts écrits et passages de responsabilité visibles.

Source : prototype HTML/CSS/JS ; contexte : PRODUCT.md et documents UX 01, 02 et 04. Captures inspectées : `.impeccable/review/prototype-desktop.png`, `prototype-mobile.png`, `prototype-review.png` à la racine du dépôt. Disposition de revue transmise : ship pour ce prototype. Aucun comp, quality card ou launcher disponible ; aucune comparaison avec ces artefacts n’est revendiquée. Les captures ne constituent pas des tests utilisateurs ni une certification d’accessibilité.

## Colors

Le cobalt signale l’action principale. Le bleu nuit stabilise la navigation ; le fond clair, les panneaux blancs et les bordures discrètes structurent l’espace de travail. La surface bleutée secondaire porte les responsabilités et l’historique.

Les statuts ordinaires sont bleus, le contrôle ambre, la validation verte et la reprise orangée. Les messages d’erreur et de réussite possèdent leurs propres couples fond/texte.

**The Written Status Rule.** Chaque statut reste nommé en toutes lettres ; la couleur accompagne le sens.

## Typography

La pile système privilégie Inter lorsqu’elle est disponible ; aucun fichier de police n’est chargé. Les titres principaux utilisent une taille fluide, les titres de section une taille fixe, les libellés un poids renforcé. Les paragraphes sont limités à 68ch. La taille du corps est héritée du navigateur, sans valeur explicite dans la source.

## Layout

Sur grand écran, la navigation occupe 220px. Le contenu a une largeur maximale de 1400px et des marges internes de 36px 40px. La colonne de travail est flexible ; le panneau complémentaire occupe 290px, avec un intervalle de 24px. Les formulaires sont limités à 740px et utilisent deux colonnes.

À 1050px et moins, la navigation passe à 190px, les colonnes de contenu se superposent et les marges internes deviennent 28px 24px. À 700px et moins, la navigation devient horizontale et défilable, le contenu forme une seule colonne, les marges deviennent 26px 16px, les panneaux ont 20px de marge interne et les actions de fin de formulaire partagent la largeur disponible. Aucun bouton d’action fixe ne recouvre les champs.

## Elevation & Depth

Aucune ombre. La profondeur repose sur le contraste des surfaces, les bordures fines et l’espacement. Une entrée verticale de 4px sur 160ms, en ease-out, s’applique au contenu seulement si la réduction des animations n’est pas demandée.

## Shapes

Les panneaux ont des coins plus amples que les contrôles. Les champs sont légèrement arrondis ; les badges restent compacts. Les preuves simulées en lecture utilisent une bordure discontinue. Les valeurs normatives figurent dans le frontmatter.

## Components

- **Boutons :** primaire cobalt, secondaire blanc bordé ; survol distinct et hauteur minimale de 44px. Le bouton de réinitialisation du bandeau de test est une exception à 36px. L’état désactivé utilise une opacité de 0,55 et un curseur d’interdiction ; aucun style actif spécifique n’est défini.
- **Champs :** libellé persistant, bordure explicite, saisie sur fond blanc. Les zones de texte mesurent au moins 95px et se redimensionnent verticalement. Le focus clavier des contrôles et liens utilise un contour ambre de 3px décalé de 3px.
- **Navigation :** boutons propres au rôle, sélection via aria-current, survol bleuté ; sur téléphone, le contexte d’organisation et le pied de navigation sont masqués.
- **Liste de travail :** titre, chemin du lieu, créneau, référence, statut et action adaptée au rôle. Les lignes sont séparées par une bordure ; elles s’empilent sur téléphone. L’état vide explique l’absence de travail et permet d’ouvrir les interventions.
- **Progression :** trois étapes de création ; étape courante identifiée par texte, couleur, graisse et aria-current.
- **Tâches et preuves :** cases à cocher et indicateurs avant/après explicitement simulés. La reprise ne réouvre que les tâches concernées et conserve les versions précédentes.
- **Décisions et retours :** confirmation intégrée avant soumission ou validation ; erreurs annoncées via role=alert et réussites via role=status. Une anomalie ouverte reste distincte de la validation du compte rendu. Le sélecteur de rôle sert à l’essai et ne prouve aucun droit serveur.

## Do's and Don'ts

- Do conserver le titre métier, le statut écrit et la prochaine responsabilité visibles.
- Do conserver les libellés de simulation et la portée temporaire des données.
- Do adapter les listes et formulaires à une seule colonne sur téléphone.
- Don't promouvoir cette proposition en système de l’application sans décision explicite.
- Don't présenter les preuves fictives ou les changements de rôle comme des fonctions de production.
