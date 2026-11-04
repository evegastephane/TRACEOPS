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
  org-item:
    textColor: "{colors.rail-text}"
    typography: "{typography.org-name}"
    rounded: "{rounded.lg}"
    padding: "8px"
  org-item-hover:
    backgroundColor: "{colors.indigo-800}"
  org-item-active:
    backgroundColor: "{colors.org-tint}"
    textColor: "{colors.ink}"
  org-plate:
    backgroundColor: "{colors.org-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.org-name}"
    rounded: "{rounded.lg}"
    padding: "10px 12px 12px"
  rail-button:
    textColor: "{colors.rail-text}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
  section-tab:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-dense}"
    padding: "10px 2px 12px"
  section-tab-active:
    textColor: "{colors.ink}"
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
    padding: "22px 24px 24px"
  result-panel:
    backgroundColor: "{colors.saffron-tint}"
    rounded: "{rounded.lg}"
    padding: "22px 24px 24px"
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

On agit toujours au nom d'une organisation précise, et l'interface le montre comme une entreprise montre ses couleurs : par un tissu imprimé à son motif. Chaque organisation reçoit, à partir de son identifiant, une couleur de wax et un motif géométrique ; ce tissu borde l'espace de travail (le liseré), marque chaque organisation de la colonne par une pastille, borde les cartes de détail et teinte discrètement la page (puce de type, avatars, états vides). Changer d'organisation ré-imprime visiblement le liseré.

Autour du tissu, la console reste calme et dense, organisée en maître-détail : une colonne indigo profonde porte la marque, la liste des organisations et le compte ; le contenu, posé sur un fond clair teinté d'indigo, nomme l'organisation, ouvre ses rubriques en onglets, puis place la liste à gauche et le détail à droite, en surfaces blanches à filets fins, sans aucune ombre. Une seule action safran est visible à la fois. Le vermillon et l'émeraude ne parlent que d'état. Archivo variable donne aux noms d'organisation et aux titres une coupe semi-condensée grasse ; le texte courant reste en largeur normale.

Le système refuse la console SaaS grise où le contexte actif n'est qu'une petite liste déroulante : le contexte est ici la pièce la plus visible de l'écran.

**Key Characteristics:**

- Colonne indigo de 280px listant les organisations, chacune avec sa pastille de tissu de 32px ; l'organisation active posée sur sa propre teinte.
- Liseré de 12px au motif de l'organisation active, en haut du contenu et le long de la colonne ; la même bande de 12px borde les cartes de détail, les formulaires et la liste des lieux.
- Maître-détail : liste à gauche, détail collant à droite à partir de 1240px ; liste et détail alternent en dessous.
- Une seule action principale safran par écran, texte indigo.
- Vermillon pour suspendu et erreurs, émeraude pour actif et succès ; couleurs de wax réservées à l'identité.
- Surfaces plates, filets de 1px, coins de 6 à 8px, statuts et compteurs en capsule.

## Colors

Un indigo profond et un fond clair qui en est teinté, un safran unique pour agir, deux couleurs d'état, et sept couleurs de wax qui n'appartiennent qu'aux organisations.

### Primary
- **Indigo de nuit** (`indigo-900`) : colonne des organisations, bandeau du téléphone, écran de connexion et de chargement, texte des boutons safran, liens soulignés, soulignement et icône de l'onglet de rubrique actif, `theme-color` du navigateur. C'est la couleur de la maison ; l'organisation, elle, apporte la sienne. `indigo-800` porte le survol des organisations et des boutons sur indigo, et les listes natives sur indigo ; `indigo-700` les filets et bordures sur indigo. `indigo-active` n'a plus d'usage dans la version actuelle.
- **Texte du rail** (`rail-text`) et **texte atténué du rail** (`rail-muted`) : texte principal et secondaire sur indigo (noms d'organisation, type et rôle, légende « Organisations »).

### Secondary
- **Safran** (`saffron`) : l'action principale, le point du logo, l'icône du bouton « Créer une organisation », le focus sur indigo. Fonce au survol (`saffron-hover`). Sa teinte pâle (`saffron-tint`, bordure `saffron-line`) porte la carte de secret à usage unique.

### Tertiary (états)
- **Vermillon** (`vermilion`) : accès suspendu et erreurs. Les blocs d'erreur utilisent `vermilion-tint`, `vermilion-line` et le texte plus sombre `vermilion-ink`.
- **Émeraude** (`emerald`) : accès actif et confirmation d'enregistrement (`emerald-tint`, `emerald-ink`).
- **Bleu roi de focus** (`focus`) : anneau de focus clavier sur fond clair, et rien d'autre dans l'interface.

### Couleurs d'organisation (wax)
Sept paires encre/teinte : roi, safran, vermillon, émeraude, fuchsia, turquoise, aubergine (`wax-*-ink`, `wax-*-tint`). Le hachage FNV-1a de l'identifiant choisit la paire ; elle est injectée sur la coquille en variables `org-ink` et `org-tint`, avec la tuile seule en `--org-cloth` (URI de données) pour les bords de tissu dessinés en CSS. Les valeurs `org-ink` / `org-tint` du frontmatter sont le neutre indigo utilisé quand aucune organisation n'est active.

### Neutral
- **Fond** (`ground`) : fond de l'espace de travail, teinté d'indigo.
- **Surface** (`surface`) : tableaux, listes, cartes de détail, formulaires, carte de connexion, champs ; `surface-2` pour l'en-tête de tableau et le survol des listes ; `hover` pour le survol des boutons secondaires, le site choisi et les étiquettes de type de lieu.
- **Encre** (`ink`) : texte principal ; `ink-2` : texte secondaire, légendes, onglets et icônes au repos.
- **Filets** (`line`) : séparations de tableaux, listes, cartes, barre d'onglets ; `line-strong` : contour des champs et des codes ; `control-line` : contour des boutons secondaires.

### Named Rules
**The One Saffron Rule.** Une seule action safran est visible à la fois. Dès qu'un formulaire ou un secret est ouvert, les autres actions repassent en secondaire ou s'effacent ; la seule action safran est alors celle du panneau.

**The Cloth Is Identity Rule.** Les couleurs de wax désignent une organisation, jamais un état ni une action. Un statut se lit en vermillon ou en émeraude, quelle que soit la couleur de l'organisation.

**The Royal Blue Is Focus Rule.** Dans l'interface, le bleu roi ne sert qu'à l'anneau de focus. Il reste une couleur de tissu légitime (wax « roi ») sur le liseré, les pastilles et les bords de cartes, qui ne reçoivent jamais le focus eux-mêmes.

## Typography

**Display Font:** Archivo Variable, auto-hébergée (axes graisse 100 à 900, largeur 62 à 125 %), puis ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif.
**Body Font:** Archivo Variable, largeur normale.
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Consolas ; uniquement pour les identifiants et liens d'invitation dans la carte de secret.

**Character:** Une seule famille, deux allures : la coupe semi-condensée grasse (largeur 85 à 92 %) pour tout ce qui nomme (organisations, titres, revendication de connexion), la largeur normale pour tout ce qui se lit.

### Hierarchy
- **Display** (700, 2.25rem, 1.1, largeur 85 %) : revendication de l'écran de connexion, sur indigo ; 1.375rem sur téléphone.
- **Headline** (700, 2.125rem, 1.1, largeur 88 %) : nom de l'organisation en tête du contenu, puce de type dessous ; 1.75rem sur téléphone. Titre de la carte de connexion en 1.75rem, largeur 90 % (1.375rem sur téléphone).
- **Title** (700, 1.375rem, largeur 92 %) : nom du site choisi dans le détail ; 1.25rem pour les titres des cartes de détail et des formulaires.
- **Org name** (700, 1.0625rem, 1.2, largeur 88 %) : nom de chaque organisation dans la colonne et sur la plaque.
- **Body** (400, 1rem, 1.5) : texte courant, champs ; paragraphes limités à 68ch. Le tableau, les boutons, les onglets et les messages utilisent 0.9375rem.
- **Label** (600, 0.875rem) : libellés de champs, toujours visibles au-dessus du champ ; boutons sur indigo.
- **Caption** (600, 0.8125rem) : en-têtes de tableau, statuts, compteurs, légende « Organisations », type et rôle sous chaque organisation (400).
- **Kind chip** (700, 0.75rem, 0.05em, capitales) : le type d'organisation (Client, Prestataire), sous le nom.

### Named Rules
**The Names Are Condensed Rule.** Les noms et titres se composent en semi-condensé gras ; le texte de lecture, les libellés et les tableaux restent en largeur normale.

**The Mono Means Secret Rule.** La chasse fixe est réservée aux identifiants et liens à copier ; elle n'est jamais décorative.

Les compteurs, identifiants et codes utilisent des chiffres tabulaires.

## Layout

**Ordinateur (1240px et plus).** Trois zones. À gauche, la colonne des organisations de 280px, sur indigo, collante sur la hauteur de la fenêtre (marges 26px 30px 20px 18px, écart de 24px entre blocs), bordée à droite d'un liseré vertical de 12px : logo, légende « Organisations » puis la liste qui défile seule, bouton « Créer une organisation » pour l'administrateur, et en bas, derrière un filet `indigo-700`, le nom de l'utilisateur, son rôle, la langue et la déconnexion. Le contenu commence par le liseré de 12px, puis une colonne plafonnée à 1440px avec 30px 40px 72px de marge : le nom de l'organisation et sa puce de type, les onglets de rubrique (écart de 28px, filet `line` dessous, 24px avant l'espace de travail), puis l'espace de travail en grille, écart de 28px.
- **Équipe :** liste flexible à gauche, détail de 300 à 360px à droite (280 à 320px entre 1240 et 1439px, cellules du tableau ramenées à 12px de marge latérale). Le détail est collant (24px du haut) et montre une seule chose : la carte « Ajouter à l'équipe », un formulaire, ou le secret à usage unique.
- **Sites et salles :** liste des sites de 260 à 340px à gauche, détail du site choisi à droite (titre, recherche plafonnée à 440px, lieux). Ajouter un lieu ouvre un troisième volet collant de 300 à 360px ; la liste des sites se replie alors, si bien que les lieux gardent leur place.

**Connexion.** Plein écran indigo : bandeau logo et langue, corps centré plafonné à 1120px en deux colonnes (revendication, sous-titre et échantillonnage des motifs / carte blanche de 440px au plus), écart de 72px, pied discret.

**De 760 à 1239px.** La colonne des organisations reste. Liste et détail ne sont plus côte à côte : ils alternent. Sur l'équipe, la carte d'actions se réduit à une rangée de boutons au-dessus de la liste (titre, explications et bord de tissu masqués) ; un formulaire ou un secret remplace la liste. Sur les sites, le texte d'attente du détail disparaît ; le site choisi remplace la liste et offre le lien de retour « Tous les sites » ; le formulaire de lieu remplace le détail du site. Les volets cessent d'être collants.

**À 1100px et moins.** Marges du contenu réduites à 26px 28px 64px ; écart de connexion à 48px.

**À 760px et moins.** Des écrans successifs. La colonne devient un bandeau indigo (14px 16px) : logo, langue et déconnexion en icône seule. Avec plusieurs organisations, la liste des organisations est un écran indigo à part entière (pleine hauteur, `100dvh`, liseré vertical à droite) ; choisir une organisation ouvre l'écran de l'organisation : lien de retour « Organisations », liseré horizontal sous le bandeau, nom (1.75rem) et puce de type, onglets à parts égales soulignés en indigo, puis la liste. Un formulaire ou le secret remplace la liste. Un administrateur sans organisation commence sur l'écran des organisations. Le tableau d'équipe devient une pile de cartes (nom et accès en haut, identifiant et rôle en dessous, alignés sur le nom). La connexion passe en une colonne, la carte d'abord. Les actions occupent toute la largeur disponible ; marges du contenu à 20px 16px 48px.

Le rythme d'espacement suit les pas 4, 8, 10, 12, 16, 18, 20, 24, 28, 36, 44, 72px ; les formulaires utilisent 18px entre champs.

## Elevation & Depth

Aucune ombre. La profondeur vient du contraste entre la colonne indigo et le fond clair, entre le fond teinté et les surfaces blanches, et des filets de 1px. Les formulaires, résultats et erreurs sont des cartes posées dans les volets de l'espace de travail, au plus collantes, jamais des fenêtres flottantes. Le seul `box-shadow` du code est un trait intérieur de 3px indigo qui souligne l'onglet de rubrique actif : c'est un soulignement, pas une élévation.

### Named Rules
**The Flat Cloth Rule.** Rien ne flotte. Une surface se distingue par sa teinte ou son filet, jamais par une ombre.

## Shapes

Coins doucement arrondis : 6px pour les boutons, champs, puces de type, pastilles de tissu, codes et messages ; 8px pour les conteneurs (tableaux, listes, cartes de détail, formulaires, organisations de la colonne, plaque, carte de connexion, cartes de membres). Les statuts et compteurs sont des capsules entièrement arrondies ; avatars et point du logo sont des cercles. Bordures continues de 1px ; l'état vide seul utilise un filet en pointillés teinté de la couleur de l'organisation. Icônes au trait sur grille de 24, trait 1.75, extrémités arrondies, affichées à 18px.

### Le système de motifs
Une tuile SVG de 16 unités, encre de l'organisation sur sa teinte. Clients : points, anneau à point central, anneau et point. Prestataires : losange évidé, chevrons, petits losanges. La tuile est posée en arrière-plan avec `background-repeat: round`, sur la teinte de l'organisation, si bien que le navigateur ajuste un nombre entier de tuiles, qu'aucun motif n'est coupé au bord et qu'aucune jointure n'apparaît. Tailles de tuile : 12px pour le liseré et les bords de cartes (une seule rangée), 16px pour les pastilles et la plaque, 20px pour l'échantillonnage de la connexion. Le tissu est décoratif (`aria-hidden` ou pseudo-élément) : le nom de l'organisation est toujours écrit à côté ou en tête de page.

## Components

### Buttons
Directs et compacts.
- **Shape :** coins de 6px.
- **Primary :** fond safran, texte indigo de nuit, graisse 600, 9px 16px ; pleine largeur avec 12px vertical sur la connexion. Fonce au survol.
- **Secondary (bouton par défaut) :** fond blanc, contour `control-line`, texte encre ; fond `hover` au survol.
- **Lien :** texte indigo souligné (1px, décalé de 3px), soulignement épaissi à 2px au survol ; sert aux retours (« Organisations », « Tous les sites ») et aux actions textuelles.
- **Sur indigo :** bouton pleine largeur transparent à contour `indigo-700`, 0.875rem, icône safran ; survol `indigo-800`. Déconnexion en bouton nu `rail-muted`, blanc au survol.
- **Focus :** anneau de 2px bleu roi décalé de 2px sur fond clair, safran sur indigo. Transitions de couleur de 150ms. Désactivé : opacité 0.55, curseur d'attente.

### Chips
- **Puce de type :** teinte de l'organisation, filet à 40 % de son encre, capitales espacées ; toujours sous le nom de l'organisation, jamais au-dessus.
- **Statut :** capsule avec pastille de 7px ; émeraude pour Actif, vermillon pour Suspendu.
- **Compteur :** capsule neutre indigo pâle à chiffres tabulaires, dans l'onglet Équipe, masquée aux technologies d'assistance (le titre caché de la liste porte le nombre).
- **Lieux :** type de salle en étiquette `hover` ; code en étiquette blanche à filet `line-strong`, graisse 700.

### Cards / Containers
- **Corner Style :** 8px.
- **Background :** surface blanche ; carte de secret sur `saffron-tint` ; état vide et texte d'attente sur un mélange de la teinte de l'organisation et du blanc.
- **Shadow Strategy :** aucune (voir Elevation & Depth).
- **Border :** filet `line` de 1px ; pointillés pour l'état vide. Les cartes de détail (sauf le secret), les formulaires des volets de détail et de formulaire, et la liste des lieux du site choisi portent en tête une bande de 12px du tissu de l'organisation active.
- **Internal Padding :** 22px 24px 24px pour les cartes de détail et les formulaires (20px 18px 22px sur téléphone), 28px pour l'état vide, 36px pour la carte de connexion.

### Inputs / Fields
- **Style :** fond blanc, contour `line-strong` de 1px, coins de 6px, 10px 12px ; libellé visible au-dessus à 6px. Listes natives avec chevron dessiné ; sur indigo, fond `indigo-800` et contour `indigo-700`. Le champ de recherche des lieux porte une loupe à gauche.
- **Focus :** anneau bleu roi de 2px décalé de 1px et contour bleu roi ; safran sur indigo.
- **Error / Disabled :** les erreurs applicatives apparaissent dans un bloc vermillon `role="alert"` ; aucune bordure d'erreur par champ n'est définie. Une erreur de chargement nomme ce qui a échoué (l'équipe, les sites, les lieux d'un site), en français et en anglais, et propose de réessayer ; un code d'erreur précis garde son propre message.

### Navigation
- **Liste des organisations :** navigation libellée par sa légende visible « Organisations », liste de boutons pleine largeur (8px, coins de 8px) : pastille de tissu de 32px, nom en semi-condensé gras, type et rôle en `rail-muted`. Survol `indigo-800`. L'organisation active (`aria-current="true"`) est posée sur sa teinte, texte encre ; sa pastille se déroule à chaque changement.
- **Onglets de rubrique :** « Équipe » et « Sites et salles », boutons nus en `ink-2` sur un filet `line` ; l'onglet courant (`aria-current="page"`) passe en encre, souligné de 3px indigo par un trait intérieur, icône indigo. Sur téléphone, onglets à parts égales, 0.875rem.
- **Langue et déconnexion :** en bas de la colonne sous le nom de l'utilisateur ; sur téléphone, en haut à droite du bandeau, la déconnexion réduite à son icône avec libellé accessible.

### Plaque d'organisation (signature)
Quand l'utilisateur n'a qu'une organisation, son entrée de liste devient une plaque : une bande de tissu de 32px de haut (tuiles de 16px) au-dessus du nom en semi-condensé gras et de son type et rôle (10px 12px 12px), sur la teinte de l'organisation, coins de 8px. Sans organisation, la colonne affiche un court texte `rail-muted` à la place de la liste.

### Liseré (signature)
Bande de 12px du tissu de l'organisation active en haut du contenu, et bande verticale de 12px sur le bord droit de la colonne des organisations (ordinateur, tablette, et écran des organisations sur téléphone). La même bande de 12px, tirée de `--org-cloth`, borde en tête les cartes de détail, les formulaires des volets et la liste des lieux du site choisi. Liseré et pastille active sont recréés à chaque changement d'organisation et se déroulent en 240ms (`clip-path` de gauche à droite, de haut en bas pour la bande verticale, courbe `cubic-bezier(.16, 1, .3, 1)`). Avec `prefers-reduced-motion: reduce`, déroulé, scintillement de chargement et transitions sont supprimés.

### Équipe
Tableau à vrais en-têtes sur fond `surface-2`, lignes séparées par des filets, avatar circulaire de 34px à initiales sur la teinte de l'organisation. Sur téléphone, chaque membre devient une carte de 8px. Chargement en lignes squelettes de 54px ; erreur avec relance. À droite, la carte « Ajouter à l'équipe » propose ses actions, chacune suivie d'une explication d'une ligne ; une seule est safran (ajouter un agent chez un prestataire, inviter chez un client).

### Sites et salles
Liste des sites en lignes blanches pleine largeur (nom, activité et fuseau, chevron) ; le site choisi (`aria-current="true"`) sur `hover`. Le détail nomme le site, porte « Ajouter un lieu » en safran, la recherche, puis la liste des lieux bordée de tissu (nom, chemin, type et code).

### Carte de secret à usage unique
Carte safran pâle annoncée poliment, dans le volet de détail : titre, explication, identifiant en code, zone de texte en lecture seule ajustée au contenu, puis Copier (secondaire) et Terminé (safran). Elle ne porte pas de bord de tissu. Fermer la carte efface le secret de l'interface.

## Do's and Don'ts

### Do:
- **Do** conserver des libellés visibles et les traductions françaises et anglaises.
- **Do** garder les messages de chargement, d'erreur et de résultat dans les volets de l'espace de travail, jamais en fenêtre flottante.
- **Do** nommer dans un message d'erreur de chargement ce qui n'a pas pu être chargé.
- **Do** dériver couleur et motif de l'identifiant de l'organisation (FNV-1a sur sept paires de wax) et poser le tissu avec `background-repeat: round` et des tailles de tuile entières (12, 16 ou 20px).
- **Do** écrire le nom de l'organisation à côté de tout tissu ; le motif reste décoratif.
- **Do** ré-imprimer le liseré et la pastille active à chaque changement d'organisation (240ms), et les laisser fixes en mouvement réduit.
- **Do** placer la puce de type sous le nom de l'organisation.
- **Do** utiliser l'anneau bleu roi (`focus`) sur fond clair et l'anneau safran sur indigo.
- **Do** border de 12px de tissu les cartes de détail et les formulaires des volets, jamais la carte de secret.
- **Do** garder liste et détail côte à côte à partir de 1240px, les faire alterner en dessous, et passer en écrans successifs avec le tableau d'équipe en cartes à 760px.

### Don't:
- **Don't** présenter des opérations futures comme disponibles.
- **Don't** remplacer les données absentes par des indicateurs fictifs.
- **Don't** conserver à l'écran les secrets après fermeture de leur carte.
- **Don't** afficher plus d'une action safran à la fois.
- **Don't** utiliser une couleur de wax pour un état, une action ou un lien.
- **Don't** utiliser le bleu roi dans l'interface ailleurs que pour le focus.
- **Don't** ajouter d'ombre portée ni de surface flottante.
- **Don't** couper un motif au bord ni réduire le liseré sous 12px.
- **Don't** employer la chasse fixe ailleurs que pour les identifiants et liens à copier.
- **Don't** réduire le choix de l'organisation à une liste déroulante : chaque organisation reste visible avec son tissu.
