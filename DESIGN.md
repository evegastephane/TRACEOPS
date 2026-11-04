---
name: TRACEOPS
description: Console de gestion des accès où chaque organisation porte son propre tissu, en français et en anglais.
colors:
  indigo-950: "#141a42"
  indigo-900: "#1d2457"
  indigo-800: "#283071"
  indigo-700: "#3a4390"
  indigo-active: "#2c357f"
  rail-text: "#eef0fb"
  rail-muted: "#b3b9df"
  ground: "#f2f3f8"
  surface: "#ffffff"
  surface-2: "#f7f8fc"
  hover: "#eef0f8"
  ink: "#161a33"
  ink-2: "#4d5373"
  line: "#dde0ec"
  line-strong: "#8a90b0"
  control-line: "#c5c9dc"
  saffron: "#f2b134"
  saffron-hover: "#e5a11c"
  saffron-tint: "#fff6e2"
  saffron-line: "#edc976"
  vermilion: "#c3361c"
  vermilion-ink: "#8f2410"
  vermilion-tint: "#fde8e3"
  vermilion-line: "#f1b6a7"
  emerald: "#13774b"
  emerald-ink: "#0f5f3c"
  emerald-tint: "#e1f2e9"
  focus: "#2f4fc4"
  org-ink: "#5d6496"
  org-tint: "#e6e8f3"
  wax-roi-ink: "#2f4fc4"
  wax-roi-tint: "#dfe6fb"
  wax-safran-ink: "#c27a06"
  wax-safran-tint: "#fcefd2"
  wax-vermillon-ink: "#d2452a"
  wax-vermillon-tint: "#fbe1da"
  wax-emeraude-ink: "#12805a"
  wax-emeraude-tint: "#d7f0e4"
  wax-fuchsia-ink: "#b8306f"
  wax-fuchsia-tint: "#f8dcea"
  wax-turquoise-ink: "#0e7c8a"
  wax-turquoise-tint: "#d5eef1"
  wax-aubergine-ink: "#6b3fa0"
  wax-aubergine-tint: "#e8ddf5"
typography:
  display:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.015em"
    fontVariation: "'wdth' 85"
  headline:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.012em"
    fontVariation: "'wdth' 88"
  headline-auth:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.01em"
    fontVariation: "'wdth' 90"
  title:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.5
    fontVariation: "'wdth' 92"
  title-panel:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.5
    fontVariation: "'wdth' 92"
  org-name:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.2
    fontVariation: "'wdth' 88"
  body:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-dense:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: ".9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: ".875rem"
    fontWeight: 600
    lineHeight: 1.5
  caption:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: ".8125rem"
    fontWeight: 600
    lineHeight: 1.5
  kind-chip:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: ".75rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: ".05em"
  mono:
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace"
    fontSize: ".9375rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: "6px"
  lg: "8px"
  full: "999px"
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
  space-36: "36px"
  space-44: "44px"
  space-72: "72px"
components:
  button-primary:
    backgroundColor: "{colors.saffron}"
    textColor: "{colors.indigo-900}"
    typography: "{typography.body-dense}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "{colors.saffron-hover}"
    textColor: "{colors.indigo-900}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-dense}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.hover}"
  button-link:
    textColor: "{colors.indigo-900}"
    padding: "0"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  org-plate:
    backgroundColor: "{colors.org-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.org-name}"
    rounded: "{rounded.lg}"
    padding: "10px 12px 12px"
  nav-item:
    textColor: "{colors.rail-muted}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.indigo-active}"
    textColor: "{colors.surface}"
  kind-chip:
    backgroundColor: "{colors.org-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.kind-chip}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
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
  count:
    backgroundColor: "{colors.org-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "1px 9px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px 28px 28px"
  result-panel:
    backgroundColor: "{colors.saffron-tint}"
    rounded: "{rounded.lg}"
    padding: "24px 28px 28px"
  error:
    backgroundColor: "{colors.vermilion-tint}"
    textColor: "{colors.vermilion-ink}"
    typography: "{typography.body-dense}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  save-notice:
    backgroundColor: "{colors.emerald-tint}"
    textColor: "{colors.emerald-ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  table-header:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.caption}"
    padding: "11px 16px"
---

# Design System: TRACEOPS

## Overview

**Creative North Star: "Le pagne d'entreprise"**

On agit toujours au nom d'une organisation précise, et l'interface le montre comme une entreprise montre ses couleurs : par un tissu imprimé à son motif. Chaque organisation reçoit, à partir de son identifiant, une couleur de wax et un motif géométrique ; ce tissu borde l'espace de travail (le liseré), habille la plaque d'organisation du rail et teinte discrètement la page (puce de type, avatars, états vides). Changer d'organisation ré-imprime visiblement le liseré.

Autour du tissu, la console reste calme et dense : un rail indigo profond porte l'identité, le contexte et les rubriques ; le contenu est posé sur un fond clair teinté d'indigo, en surfaces blanches à filets fins, sans aucune ombre. Une seule action safran est visible à la fois. Le vermillon et l'émeraude ne parlent que d'état. Archivo variable donne aux noms d'organisation et aux titres une coupe semi-condensée grasse ; le texte courant reste en largeur normale.

Le système refuse la console SaaS grise où le contexte actif n'est qu'une petite liste déroulante : le contexte est ici la pièce la plus visible de l'écran.

**Key Characteristics:**

- Rail indigo de 264px, liseré de 12px au motif de l'organisation active, en haut du contenu et le long du rail.
- Plaque d'organisation : coupon de tissu de 32px, nom en semi-condensé gras, qui est la face visible du sélecteur natif.
- Une seule action principale safran par écran, texte indigo.
- Vermillon pour suspendu et erreurs, émeraude pour actif et succès ; couleurs de wax réservées à l'identité.
- Surfaces plates, filets de 1px, coins de 6 à 8px, statuts et compteurs en capsule.

## Colors

Un indigo profond et un fond clair qui en est teinté, un safran unique pour agir, deux couleurs d'état, et sept couleurs de wax qui n'appartiennent qu'aux organisations.

### Primary
- **Indigo de nuit** (`indigo-900`) : rail, écran de connexion et de chargement, texte des boutons safran, liens soulignés, `theme-color` du navigateur. C'est la couleur de la maison ; l'organisation, elle, apporte la sienne. `indigo-800` porte le survol du rail et les listes natives sur indigo, `indigo-700` les filets et bordures sur indigo, `indigo-active` la rubrique courante.
- **Texte du rail** (`rail-text`) et **texte atténué du rail** (`rail-muted`) : texte principal et secondaire sur indigo.

### Secondary
- **Safran** (`saffron`) : l'action principale, le point du logo, l'icône de la rubrique active, le soulignement de l'onglet actif sur téléphone, le focus sur indigo. Fonce au survol (`saffron-hover`). Sa teinte pâle (`saffron-tint`, bordure `saffron-line`) porte le panneau de secret à usage unique.

### Tertiary (états)
- **Vermillon** (`vermilion`) : accès suspendu et erreurs. Les blocs d'erreur utilisent `vermilion-tint`, `vermilion-line` et le texte plus sombre `vermilion-ink`.
- **Émeraude** (`emerald`) : accès actif et confirmation d'enregistrement (`emerald-tint`, `emerald-ink`).
- **Bleu roi de focus** (`focus`) : anneau de focus clavier sur fond clair, et rien d'autre dans l'interface.

### Couleurs d'organisation (wax)
Sept paires encre/teinte : roi, safran, vermillon, émeraude, fuchsia, turquoise, aubergine (`wax-*-ink`, `wax-*-tint`). Le hachage FNV-1a de l'identifiant choisit la paire ; elle est injectée sur la coquille en variables `org-ink` et `org-tint`. Les valeurs `org-ink` / `org-tint` du frontmatter sont le neutre indigo utilisé quand aucune organisation n'est active.

### Neutral
- **Fond** (`ground`) : fond de l'espace de travail, teinté d'indigo.
- **Surface** (`surface`) : tableaux, panneaux, carte de connexion, champs ; `surface-2` pour l'en-tête de tableau et le survol des listes ; `hover` pour le survol des boutons secondaires et les étiquettes de type de lieu.
- **Encre** (`ink`) : texte principal ; `ink-2` : texte secondaire, légendes, icônes au repos.
- **Filets** (`line`) : séparations de tableaux, listes, panneaux ; `line-strong` : contour des champs et des codes ; `control-line` : contour des boutons secondaires.

### Named Rules
**The One Saffron Rule.** Une seule action safran est visible à la fois. Dès qu'un formulaire ou un secret est ouvert, les actions de l'en-tête repassent en secondaire ; la seule action safran est alors celle du panneau.

**The Cloth Is Identity Rule.** Les couleurs de wax désignent une organisation, jamais un état ni une action. Un statut se lit en vermillon ou en émeraude, quelle que soit la couleur de l'organisation.

**The Royal Blue Is Focus Rule.** Dans l'interface, le bleu roi ne sert qu'à l'anneau de focus. Il reste une couleur de tissu légitime (wax « roi ») sur le liseré et la plaque, qui ne reçoivent jamais le focus eux-mêmes.

## Typography

**Display Font:** Archivo Variable, auto-hébergée (axes graisse 100 à 900, largeur 62 à 125 %), puis ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif.
**Body Font:** Archivo Variable, largeur normale.
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Consolas ; uniquement pour les identifiants et liens d'invitation dans le panneau de secret.

**Character:** Une seule famille, deux allures : la coupe semi-condensée grasse (largeur 85 à 92 %) pour tout ce qui nomme (organisations, titres, revendication de connexion), la largeur normale pour tout ce qui se lit.

### Hierarchy
- **Display** (700, 2.25rem, 1.1, largeur 85 %) : revendication de l'écran de connexion, sur indigo ; 1.5rem sur téléphone.
- **Headline** (700, 2.125rem, 1.1, largeur 88 %) : nom de l'organisation en tête de page, 1.625rem sur téléphone. Titre de la carte de connexion en 1.75rem, largeur 90 %.
- **Title** (700, 1.375rem, largeur 92 %) : titres de section (Équipe, Sites) avec leur compteur ; 1.25rem pour les titres de panneaux et de résultats.
- **Org name** (700, 1.0625rem, 1.2, largeur 88 %) : nom sur la plaque d'organisation.
- **Body** (400, 1rem, 1.5) : texte courant, champs ; paragraphes limités à 68ch. Le tableau, les boutons et les messages utilisent 0.9375rem.
- **Label** (600, 0.875rem) : libellés de champs, toujours visibles au-dessus du champ.
- **Caption** (600, 0.8125rem) : en-têtes de tableau, statuts, compteurs, rôle de l'utilisateur.
- **Kind chip** (700, 0.75rem, 0.05em, capitales) : le type d'organisation (Client, Prestataire), sous le nom.

### Named Rules
**The Names Are Condensed Rule.** Les noms et titres se composent en semi-condensé gras ; le texte de lecture, les libellés et les tableaux restent en largeur normale.

**The Mono Means Secret Rule.** La chasse fixe est réservée aux identifiants et liens à copier ; elle n'est jamais décorative.

Les compteurs, identifiants et codes utilisent des chiffres tabulaires.

## Layout

**Ordinateur.** Grille de deux colonnes : rail de 264px, contenu flexible. Le rail est collant sur la hauteur de la fenêtre (marges 26px 30px 20px 18px, écart de 28px entre blocs) : logo, plaque d'organisation et création d'organisation, rubriques, puis compte et langue poussés en bas derrière un filet. Le contenu commence par le liseré de 12px, puis une colonne plafonnée à 1240px avec 36px 44px 72px de marge. L'en-tête de page aligne le titre à gauche et les actions à droite, sur leur ligne de base, au-dessus d'un filet. Les panneaux de formulaire et de résultat font au plus 640px et restent dans le flux.

**Connexion.** Plein écran indigo : bandeau logo et langue, corps centré en deux colonnes (revendication, sous-titre et échantillonnage des motifs / carte blanche de 440px au plus), écart de 72px, pied discret.

**À 1100px et moins.** Marges du contenu réduites à 30px ; titre et actions de l'en-tête s'empilent ; écart de connexion à 48px.

**À 760px et moins.** Le rail devient un bandeau indigo : logo et compte (langue, déconnexion en icône) sur la première ligne, plaque d'organisation pleine largeur, puis onglets de rubriques à parts égales soulignés en safran. Le liseré vertical disparaît ; le liseré horizontal reste sous le bandeau. Le tableau d'équipe devient une pile de cartes (nom et accès en haut, identifiant et rôle en dessous, alignés sur le nom). La connexion passe en une colonne, la carte d'abord. Les actions occupent toute la largeur disponible ; marges du contenu à 16px.

Le rythme d'espacement suit les pas 4, 8, 10, 12, 16, 18, 20, 24, 28, 36, 44, 72px ; les formulaires utilisent 18px entre champs.

## Elevation & Depth

Aucune ombre. La profondeur vient du contraste entre le rail indigo et le fond clair, entre le fond teinté et les surfaces blanches, et des filets de 1px. Les formulaires, résultats et erreurs sont des panneaux du flux, jamais des fenêtres flottantes. Le seul `box-shadow` du code est un trait intérieur de 3px safran qui souligne l'onglet actif sur téléphone : c'est un soulignement, pas une élévation.

### Named Rules
**The Flat Cloth Rule.** Rien ne flotte. Une surface se distingue par sa teinte ou son filet, jamais par une ombre.

## Shapes

Coins doucement arrondis : 6px pour les boutons, champs, puces de type, codes et messages ; 8px pour les conteneurs (tableaux, listes, panneaux, plaque d'organisation, carte de connexion, cartes de membres). Les statuts et compteurs sont des capsules entièrement arrondies ; avatars et point du logo sont des cercles. Bordures continues de 1px ; l'état vide seul utilise un filet en pointillés teinté de la couleur de l'organisation. Icônes au trait sur grille de 24, trait 1.75, extrémités arrondies, affichées à 18px.

### Le système de motifs
Une tuile SVG de 16 unités, encre de l'organisation sur sa teinte. Clients : points, anneau à point central, anneau et point. Prestataires : losange évidé, chevrons, petits losanges. La tuile est posée en arrière-plan avec `background-repeat: round`, si bien que le navigateur ajuste un nombre entier de tuiles et qu'aucun motif n'est coupé au bord. Tailles de tuile : 12px pour le liseré (une seule rangée), 16px pour le coupon de la plaque, 20px pour l'échantillonnage de la connexion. Le tissu est décoratif (`aria-hidden`) : le nom de l'organisation est toujours écrit à côté.

## Components

### Buttons
Directs et compacts.
- **Shape :** coins de 6px.
- **Primary :** fond safran, texte indigo de nuit, graisse 600, 9px 16px ; pleine largeur avec 12px vertical sur la connexion. Fonce au survol.
- **Secondary (bouton par défaut) :** fond blanc, contour `control-line`, texte encre ; fond `hover` au survol.
- **Lien :** texte indigo souligné (1px, décalé de 3px), soulignement épaissi à 2px au survol ; sert au retour et aux actions textuelles.
- **Sur indigo :** boutons transparents à contour `indigo-700`, icône safran ; survol `indigo-800`.
- **Focus :** anneau de 2px bleu roi décalé de 2px sur fond clair, safran sur indigo. Transitions de couleur de 150ms. Désactivé : opacité 0.55, curseur d'attente.

### Chips
- **Puce de type :** teinte de l'organisation, filet à 40 % de son encre, capitales espacées ; toujours sous le nom de l'organisation, jamais au-dessus.
- **Statut :** capsule avec pastille de 7px ; émeraude pour Actif, vermillon pour Suspendu.
- **Compteur :** capsule neutre indigo pâle à chiffres tabulaires, à droite du titre de section.
- **Lieux :** type de salle en étiquette `hover` ; code en étiquette blanche à filet `line-strong`, graisse 700.

### Cards / Containers
- **Corner Style :** 8px.
- **Background :** surface blanche ; résultat de secret sur `saffron-tint` ; état vide sur un mélange de la teinte de l'organisation et du blanc.
- **Shadow Strategy :** aucune (voir Elevation & Depth).
- **Border :** filet `line` de 1px ; pointillés pour l'état vide.
- **Internal Padding :** 24px 28px 28px pour les panneaux (20px 18px 22px sur téléphone), 36px pour la carte de connexion.

### Inputs / Fields
- **Style :** fond blanc, contour `line-strong` de 1px, coins de 6px, 10px 12px ; libellé visible au-dessus à 6px. Listes natives avec chevron dessiné ; sur indigo, fond `indigo-800` et contour `indigo-700`.
- **Focus :** anneau bleu roi de 2px décalé de 1px et contour bleu roi ; safran sur indigo.
- **Error / Disabled :** les erreurs applicatives apparaissent dans un bloc vermillon `role="alert"` au-dessus du contenu ; aucune bordure d'erreur par champ n'est définie.

### Navigation
- **Rail (ordinateur) :** rubriques en boutons pleine largeur, texte `rail-muted` ; survol `indigo-800` et texte blanc ; rubrique courante sur `indigo-active`, texte blanc, icône safran (`aria-current="page"`).
- **Téléphone :** onglets à parts égales sous la plaque, séparés du haut par un filet `indigo-700` ; l'onglet courant est souligné de 3px safran.
- **Langue et déconnexion :** en bas du rail ; sur téléphone, en haut à droite du bandeau, la déconnexion réduite à son icône avec libellé accessible.

### Plaque d'organisation (signature)
Un coupon de tissu de 32px de haut, puis la légende « Organisation active », le nom en semi-condensé gras et un chevron, sur la teinte de l'organisation, coins de 8px. Un sélecteur natif transparent couvre toute la plaque : la plaque est la face visible du sélecteur. Focus : anneau safran de 2px décalé de 3px. Sans organisation, la plaque devient un cadre en pointillés `indigo-700` sur le rail.

### Liseré (signature)
Bande de 12px du tissu de l'organisation active en haut du contenu, et bande verticale de 12px sur le bord intérieur du rail (ordinateur seulement). Liseré et coupon de la plaque sont recréés à chaque changement d'organisation et se déroulent en 240ms (`clip-path` de gauche à droite, de haut en bas pour la bande verticale, courbe `cubic-bezier(.16, 1, .3, 1)`). Avec `prefers-reduced-motion: reduce`, déroulé, scintillement de chargement et transitions sont supprimés.

### Équipe
Tableau à vrais en-têtes sur fond `surface-2`, lignes séparées par des filets, avatar circulaire de 34px à initiales sur la teinte de l'organisation. Sur téléphone, chaque membre devient une carte de 8px. Chargement en lignes squelettes de 54px ; erreur avec relance.

### Panneau de secret à usage unique
Panneau safran pâle annoncé poliment : titre, explication, identifiant en code, zone de texte en lecture seule ajustée au contenu, puis Copier (secondaire) et Terminé (safran). Fermer le panneau efface le secret de l'interface.

## Do's and Don'ts

### Do:
- **Do** conserver des libellés visibles et les traductions françaises et anglaises.
- **Do** garder les messages de chargement, d'erreur et de résultat dans le flux de la page.
- **Do** dériver couleur et motif de l'identifiant de l'organisation (FNV-1a sur sept paires de wax) et poser le tissu avec `background-repeat: round` et des tailles de tuile entières (12, 16 ou 20px).
- **Do** écrire le nom de l'organisation à côté de tout tissu ; le motif reste décoratif.
- **Do** ré-imprimer le liseré et le coupon de la plaque à chaque changement d'organisation (240ms), et les laisser fixes en mouvement réduit.
- **Do** placer la puce de type sous le nom de l'organisation.
- **Do** utiliser l'anneau bleu roi (`focus`) sur fond clair et l'anneau safran sur indigo.
- **Do** passer le rail en bandeau à onglets et le tableau d'équipe en cartes à 760px.

### Don't:
- **Don't** présenter des opérations futures comme disponibles.
- **Don't** remplacer les données absentes par des indicateurs fictifs.
- **Don't** conserver à l'écran les secrets après fermeture de leur panneau.
- **Don't** afficher plus d'une action safran à la fois.
- **Don't** utiliser une couleur de wax pour un état, une action ou un lien.
- **Don't** utiliser le bleu roi dans l'interface ailleurs que pour le focus.
- **Don't** ajouter d'ombre portée ni de surface flottante.
- **Don't** couper un motif au bord ni réduire le liseré sous 12px.
- **Don't** employer la chasse fixe ailleurs que pour les identifiants et liens à copier.
