---
name: TRACEOPS
description: Console d'administration des accès, des équipes et des sites, au standard de la catégorie, en français et en anglais.
colors:
  white: "#ffffff"
  gray-25: "#fcfcfd"
  gray-50: "#f9fafb"
  gray-100: "#f3f4f6"
  gray-200: "#e5e7eb"
  gray-300: "#d1d5db"
  gray-400: "#9ca3af"
  gray-500: "#6b7280"
  gray-600: "#4b5563"
  gray-700: "#374151"
  gray-800: "#1f2937"
  gray-900: "#111827"
  blue-50: "#eff6ff"
  blue-100: "#dbeafe"
  blue-600: "#2563eb"
  blue-700: "#1d4ed8"
  blue-800: "#1e40af"
  green-50: "#f0fdf4"
  green-200: "#bbf7d0"
  green-700: "#15803d"
  green-800: "#166534"
  red-50: "#fef2f2"
  red-200: "#fecaca"
  red-700: "#b91c1c"
  red-800: "#991b1b"
typography:
  wordmark:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
  headline:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.022em"
  title:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.017em"
  title-sm:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.011em"
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 550
    lineHeight: 1.35
  label:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 550
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Cascadia Mono, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.blue-600}"
    textColor: "{colors.white}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.blue-700}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.gray-900}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.gray-50}"
  button-small:
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.gray-500}"
    rounded: "{rounded.md}"
    size: "32px"
  icon-button-hover:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.gray-900}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.gray-900}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "38px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.gray-700}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.gray-900}"
  tab:
    textColor: "{colors.gray-600}"
    padding: "0 2px"
    height: "42px"
  tab-active:
    textColor: "{colors.gray-900}"
  count:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.gray-700}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 6px"
    height: "20px"
  count-active:
    backgroundColor: "{colors.blue-50}"
    textColor: "{colors.blue-700}"
  badge:
    backgroundColor: "{colors.gray-50}"
    textColor: "{colors.gray-700}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "1px 8px"
  status-active:
    backgroundColor: "{colors.green-50}"
    textColor: "{colors.green-700}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "1px 8px"
  status-suspended:
    backgroundColor: "{colors.red-50}"
    textColor: "{colors.red-700}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "1px 8px"
  table-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
  drawer:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    width: "400px"
  site-item-active:
    backgroundColor: "{colors.blue-50}"
    textColor: "{colors.blue-800}"
    rounded: "{rounded.md}"
    height: "56px"
  location-code:
    backgroundColor: "{colors.gray-50}"
    textColor: "{colors.gray-800}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: "1px 6px"
---

# Design System: TRACEOPS

## Overview

**Creative North Star: "La console qu'on sait déjà lire"**

TRACEOPS est la console d'administration attendue, exécutée au niveau de finition de Linear, Stripe Dashboard, Vercel et Google Workspace Admin : on sait où tout se trouve avant de remarquer le style. Une barre latérale gris très clair bordée d'un filet, un espace de travail blanc, une encre presque noire, un seul bleu. La qualité tient aux détails d'exécution (graisses intermédiaires d'Inter, ombres à peine visibles, alignements tenus, états toujours nommés), pas au décor.

La densité est celle d'un outil de travail : texte de 14 px sur ordinateur, lignes de tableau de 56 px, contrôles de 36 px. Sur téléphone, l'interface passe en écrans successifs (organisations, organisation, tiroir) avec des cibles de 44 px et un texte de 15 px, pour un usage debout, en circulation, en forte lumière. Thème clair uniquement, contrastes forts.

Le système refuse le décor (tissus, liserés, couleur d'organisation qui envahit l'écran) autant que la console grise négligée. De l'identité précédente, seul le mot-symbole TRACE·OPS subsiste : TRACE en graisse forte, OPS en graisse régulière, suivi d'un point rond bleu.

**Key Characteristics:**
- Barre latérale #f9fafb de 256 px, contenu blanc, filets #e5e7eb.
- Un seul accent bleu pour l'action principale, la sélection et le focus.
- Vert et rouge réservés aux états, toujours pastille plus mot.
- Inter Variable à tailles optiques ; mono réservé aux identifiants, codes et secrets.
- Trois rayons hiérarchisés (6, 8, 12 px) et des ombres douces décalées.
- Formulaires et secrets dans un tiroir de 400 px à droite, sans perdre la liste.
- Un seul mouvement signé : le tiroir glisse de 12 px.

## Colors

Une rampe de gris neutres porte toute l'interface ; un bleu unique signale ce qu'on peut faire et où l'on se trouve ; vert et rouge ne parlent que d'état.

### Primary
- **Bleu d'action** (blue-600) : bouton principal, soulignement de l'onglet actif, pastille du mot-symbole, anneau et contour de focus, curseur de saisie, `accent-color`. Survol du bouton principal en **Bleu appuyé** (blue-700), qui sert aussi aux liens texte, au compteur de l'onglet actif et à l'icône du site choisi.
- **Bleu de sélection** (blue-50) : fond du site choisi et du compteur de l'onglet actif ; le nom du site choisi passe en **Bleu profond** (blue-800). **Bleu de surlignage** (blue-100) : sélection de texte.

### Neutral
- **Encre** (gray-900) : titres, noms, texte principal, avatar actif.
- **Texte secondaire** (gray-600) : phrases d'aide, méta d'en-tête, description du tiroir, onglets au repos.
- **Texte tertiaire** (gray-500) : en-têtes de colonnes, libellés de groupe, chemins de lieux, icônes au repos, textes d'aide `small`.
- **Gris d'icône discrète** (gray-400) : icône de recherche, icônes d'onglet au repos, chevrons ; bordure de champ au survol.
- **Filet de contrôle** (gray-300) : bordure des boutons et champs, bordure pointillée des états vides.
- **Filet** (gray-200) : bordures de conteneurs, barre latérale, onglets, tiroir ; trait de chargement du skeleton.
- **Séparateur de ligne** (gray-100) : lignes de tableau, fonds de compteur, de type de lieu et d'icône de site ; survol des éléments de navigation.
- **Gris de panneau** (gray-50) : barre latérale, en-têtes de tableau, pied du tiroir, fond des pages de connexion, champs de secret.
- **Survol de ligne** (gray-25) : survol d'une ligne de membre.
- **Blanc** : espace de travail, cartes, tiroir, organisation active dans la barre latérale.

### États
- **Vert d'état** (green-700 sur green-50, filet green-200 ; green-800 dans l'alerte de succès) : « Actif », confirmations, pastille de statut du secret créé.
- **Rouge d'état** (red-700 sur red-50, filet red-200 ; red-800 dans l'alerte d'erreur) : « Suspendu », erreurs.

### Named Rules
**The Accent unique Rule.** Le bleu ne désigne que l'action principale, la sélection et le focus. Une vue ne montre qu'un bouton bleu : quand le tiroir s'ouvre, le bouton principal de la barre d'outils redevient secondaire et cède le bleu au bouton du tiroir.

**The État dit Rule.** Vert et rouge ne servent qu'aux états, et un état est toujours une pastille plus un mot, jamais une couleur seule. « Actif » porte une pastille pleine ; « Suspendu » une pastille creuse (anneau de 1,5 px), pour que l'état se lise aussi sans couleur.

**The Teinte muette Rule.** Les avatars à initiales prennent une teinte douce déterministe tirée de l'identifiant, parmi huit (indigo, violet, pourpre, ciel, cyan, ambre, ardoise, pierre). Le jeu exclut le vert, le rouge et le bleu d'accent : une teinte ne porte jamais un état ni un droit, et le nom est toujours écrit à côté.

## Typography

**Display Font:** Inter Variable (avec ui-sans-serif, system-ui, -apple-system, Segoe UI), auto-hébergée via `@fontsource-variable/inter/opsz.css`, `font-optical-sizing: auto`
**Body Font:** Inter Variable (même pile)
**Label/Mono Font:** ui-monospace, SFMono-Regular, Cascadia Mono, Menlo, Consolas, chiffres tabulaires

**Character:** Une seule famille, rendue précise par l'axe optique et par des graisses intermédiaires (550, 650) qu'offre la variable : assez de contraste pour hiérarchiser sans jamais crier. Le mono n'apparaît que là où un caractère doit être recopié exactement.

### Hierarchy
- **Wordmark** (800 puis 400, 17 px, interlettrage 0,06 em) : le mot-symbole TRACE·OPS, en haut de la barre latérale et des pages de connexion.
- **Headline** (650, 24 px, 1,25, -0,022 em) : nom de l'organisation dans l'en-tête de page, titre de la carte de connexion (22 px sur téléphone, 20 px pour le titre de page).
- **Title** (650, 20 px, 1,3, -0,017 em) : nom du site choisi.
- **Title small** (600, 16 px, 1,4, -0,011 em) : titre du tiroir. Les titres d'état vide prennent 600 à 15 px.
- **Body** (400, 14 px, 1,5) : texte courant, cellules, champs ; 15 px sur téléphone et 16 px dans les champs pour éviter le zoom. Paragraphes limités à 68 ch, titres en `text-wrap: balance`.
- **Body strong** (550, 14 px) : boutons, noms de membres, de sites et de lieux, nom de l'utilisateur.
- **Label** (550, 12 px) : en-têtes de colonnes, libellés de groupe de la navigation, badges, statuts, compteurs. Casse de phrase, jamais de capitales.
- **Mono** (400 à 600, 13 px, chiffres tabulaires) : identifiants de connexion, codes de lieu, secrets à usage unique.

### Named Rules
**The Mono réservé Rule.** La police mono est réservée aux identifiants, aux codes de lieu et aux secrets à usage unique ; tout ce qui se lit plutôt qu'il ne se recopie reste en Inter.

**The Graisse intermédiaire Rule.** La hiérarchie se fait par 400, 500, 550, 600 et 650, pas par 700. Le gras plein (800) n'appartient qu'au mot-symbole.

## Layout

**Coque.** Grille à deux colonnes : barre latérale collante de 256 px (pleine hauteur, gris de panneau, filet à droite) et contenu blanc limité à 1320 px, avec des marges de 28 × 40 px. La barre latérale empile le mot-symbole (60 px), la navigation « Organisations » groupée en Clients puis Prestataires (libellés de groupe de 12 px, éléments de 36 px séparés de 2 px, 18 px entre groupes), l'action « Créer une organisation » pour l'administrateur, puis le compte (avatar, nom, rôle, déconnexion à côté, sélecteur de langue dessous) au-dessus d'un filet. Sur ordinateur, chaque organisation tient sur une ligne avec points de suspension ; le nom complet est dans l'attribut `title`.

**En-tête de page.** Avatar carré de 40 px, nom de l'organisation (Headline), puis une ligne de méta : badge de type et rôle de l'utilisateur. 20 px sous l'en-tête, les onglets soulignés (24 px entre onglets, 24 px dessous), puis la barre d'outils : phrase d'aide à gauche, actions à droite.

**Espace de travail.** La liste occupe toute la largeur ; dès qu'un formulaire ou un secret s'ouvre, un tiroir de 400 px s'ajoute à droite (24 px d'écart), collant à 24 px du haut. Sites et salles : liste de sites de 320 px et détail du site côte à côte ; un formulaire de site ou de lieu remplace la colonne qu'il ne concerne pas par le tiroir de 400 px. Le site choisi se lit sur la page même, sans carte : en-tête, recherche (360 px max), puis un seul tableau bordé des lieux (colonnes nom, 128 px type, 120 px code).

**Rythme.** Pas de 4 px ; valeurs courantes 4, 8, 12, 16, 24 et 40 px. 16 px entre champs d'un formulaire, 16 px sous une barre d'outils, 12 × 16 px dans les cellules.

**Points de rupture.**
- **1280 px et plus** : liste et tiroir (ou liste de sites et site choisi) côte à côte.
- **Sous 1280 px** : ils alternent ; le tiroir prend la place de la liste (560 px max, hauteur libre) et un lien « retour » ramène à la liste des sites.
- **Sous 1024 px** : barre latérale de 232 px, marges de 24 × 28 px.
- **Sous 768 px (téléphone)** : écrans successifs organisations › organisation › tiroir. Une barre supérieure de 56 px porte le mot-symbole, la langue et la déconnexion ; tous les contrôles montent à 44 px. Les onglets se partagent la largeur, la barre d'outils s'empile (action principale en premier, pleine largeur), les tableaux deviennent des cartes, les noms d'organisation passent à la ligne au lieu d'être tronqués, le pied du tiroir empile ses boutons pleine largeur.

### Named Rules
**The Ligne tenue Rule.** Tant que le tiroir est ouvert, la barre d'outils garde une seule ligne : la phrase d'aide se tronque, les actions ne passent jamais à la ligne, et la liste ne saute pas.

**The Pied visible Rule.** Sur ordinateur, la hauteur du tiroir est plafonnée (`max(360px, 100dvh - 248px)`) : l'en-tête et le pied restent à l'écran, seul le corps défile.

**The Compteur réservé Rule.** L'emplacement du compteur d'onglet ne disparaît jamais : pendant le chargement il affiche un tiret gris, puis le nombre, sans que les onglets bougent.

## Elevation & Depth

Hybride, majoritairement plat. La profondeur vient d'abord des fonds tonals (barre latérale gris de panneau contre contenu blanc, en-têtes de tableau et pied de tiroir gris) et des filets ; les ombres sont douces, décalées vers le bas, teintées d'un bleu-noir (#101828) à très faible opacité, et ne servent qu'à détacher ce qui est saisissable ou superposé.

### Shadow Vocabulary
- **Contact** (`box-shadow: 0 1px 2px rgb(16 24 40 / .05)`) : boutons, champs, cartes de tableau, liste de sites, organisation active, cartes de membres sur téléphone.
- **Carte posée** (`box-shadow: 0 1px 3px rgb(16 24 40 / .08), 0 1px 2px rgb(16 24 40 / .04)`) : carte de connexion ; tiroir sur téléphone.
- **Tiroir** (`box-shadow: 0 12px 32px -8px rgb(16 24 40 / .14), 0 4px 8px -2px rgb(16 24 40 / .05)`) : le tiroir sur ordinateur, seul élément superposé au travail.
- **Anneau de focus** (`box-shadow: 0 0 0 3px rgb(37 99 235 / .22)`) : champs au focus, en plus de la bordure bleue.
- **Reflet du bouton principal** (`inset 0 1px 0 rgb(255 255 255 / .14)`) : liseré de lumière en haut du bouton bleu.

### Named Rules
**The Ombre douce Rule.** Les ombres sont floues, décalées vers le bas et à moins de 15 % d'opacité ; aucune ombre dure ni décalée en aplat. Plus un élément est superposé, plus son ombre s'élargit, jamais plus sombre.

## Shapes

Trois rayons hiérarchisés par taille d'objet : 6 px pour les petits éléments (codes de lieu, avatars carrés de 24 et 32 px, contour de focus des onglets), 8 px pour les contrôles (boutons, champs, alertes, icônes de site, tableau des lieux), 12 px pour les conteneurs (carte de tableau, liste de sites, tiroir, carte de connexion, état vide, cartes de membres sur téléphone). Les pastilles d'information (badges, statuts, compteurs, types de lieu) sont entièrement arrondies. Les avatars sont des cercles pour une personne et des carrés arrondis pour une organisation (10 px à 40 px). Bordures de 1 px partout ; seuls l'onglet actif (2 px, coins hauts arrondis) et l'état vide (pointillé) font exception. Icônes au trait de 1,75 sur grille de 24, joints ronds, affichées à 16 px (18 px dans les boutons d'icône).

## Components

### Buttons
Sobres, précis, un seul bleu à la fois.
- **Shape:** coins moyens (8 px), 36 px de haut, 14 px de marge latérale, 550, icône de 16 px à 6 px du texte.
- **Primary:** fond bleu d'action, bordure bleu appuyé, texte blanc, ombre de contact plus reflet interne ; survol en bleu appuyé.
- **Secondary (par défaut):** fond blanc, filet de contrôle, ombre de contact, icône gris tertiaire ; survol gris de panneau.
- **Small:** 32 px, 13 px de texte (réessayer dans une alerte). **Wide:** pleine largeur, 40 px (connexion).
- **Icon button:** 32 px, transparent, icône de 18 px gris tertiaire ; survol séparateur et encre (fermer le tiroir, déconnexion).
- **Link button:** texte bleu appuyé souligné à 35 % d'opacité, plein au survol. **Retour:** transparent, gris secondaire, chevron.
- **Hover / Focus:** transitions de couleur de 150 ms ; focus clavier en contour bleu de 2 px décalé de 2 px. Désactivé à 50 % d'opacité.

### Chips
- **Badge de type :** pilule gris de panneau, filet, texte gris 700, Label (« Client », « Prestataire »).
- **Statut :** pilule avec pastille de 6 px puis le mot ; vert pour « Actif » (pastille pleine), rouge pour « Suspendu » (pastille creuse). Le nom d'un membre suspendu passe en gris tertiaire.
- **Compteur :** pilule de 20 px, chiffres tabulaires ; gris au repos, bleu de sélection et bleu appuyé dans l'onglet actif ; tiret gris en attente.
- **Type de lieu :** pilule séparateur sans bordure. **Code de lieu :** mono 600 sur gris de panneau, filet, coins de 6 px.

### Cards / Containers
- **Corner Style:** 12 px (tableau des lieux : 8 px).
- **Background:** blanc ; en-têtes de tableau et pieds en gris de panneau.
- **Shadow Strategy:** ombre de contact au repos, ombre du tiroir pour le seul élément superposé (voir Elevation & Depth).
- **Border:** filet de 1 px ; lignes internes en séparateur.
- **Internal Padding:** cellules 12 × 16 px, en-têtes 10 × 16 px ; carte de connexion 32 px (24 × 20 sur téléphone).
- **État vide :** carte pointillée centrée, carré d'icône de 40 px gris, titre 600 et phrase de 46 ch ; aucune action répétée.
- **Chargement :** lignes skeleton de 56 px avec un disque de 28 px et une barre qui miroite ; spinner bleu de 16 px.

### Inputs / Fields
- **Style:** fond blanc, filet de contrôle, coins de 8 px, 38 px de haut, 8 × 12 px, ombre de contact ; libellé au-dessus (500, gris 800) à 6 px ; aide en `small` gris tertiaire. Sélecteurs natifs avec chevron dessiné à 10 px du bord. Recherche avec loupe à gauche.
- **Focus:** bordure bleu d'action plus anneau bleu de 3 px ; survol en bordure gris 400.
- **Error / Disabled:** les erreurs passent par une alerte rouge (icône, texte rouge 800 sur rouge 50, filet rouge 200) au-dessus du contenu ; les succès par l'alerte verte équivalente.

### Navigation
- **Barre latérale :** éléments de 36 px transparents, avatar carré de 24 px à 10 px du nom (500, gris 700) et méta de 12 px dessous ; survol séparateur. L'organisation active passe sur blanc avec filet et ombre de contact, en encre. Sur téléphone, éléments de 52 px, avatars de 32 px, noms sur plusieurs lignes.
- **Onglets :** soulignés, 42 px de haut, icône puis libellé (500, gris secondaire) puis compteur. Survol : encre et trait gris 300 ; actif : encre, icône gris 700, trait bleu de 2 px.
- **Liste de sites :** conteneur de 12 px, éléments de 56 px avec carré d'icône de 32 px, nom et adresse, chevron ; le site choisi sur bleu de sélection, nom en bleu profond, icône blanche à ombre de contact.

### Tiroir
Le geste signature du système. Panneau blanc de 400 px, coins de 12 px, ombre de tiroir. En-tête de 60 px (titre Title small, bouton fermer, ou pastille verte cochée pour un secret créé), corps défilant à 16 px d'écart, pied gris de panneau avec les actions alignées à droite, le principal en dernier. À l'ouverture, il glisse de 12 px depuis la droite en fondu (220 ms, `cubic-bezier(.16, 1, .3, 1)`) et le focus passe à son titre. C'est le seul mouvement signé ; les autres transitions sont des changements de couleur de 150 ms, et `prefers-reduced-motion` supprime toute animation et transition.

### Secret à usage unique
Dans le tiroir : l'identifiant sur une ligne grise bordée (libellé à gauche, code mono 600 à droite), puis le secret dans une zone de texte en lecture seule, mono 14 px sur gris de panneau, ajustée à son contenu. Bouton secondaire « Copier » (devient « Copié » avec une coche) et bouton principal « Terminé ».

### Avatar
Initiales (deux au plus, 600) sur une teinte douce stable. Tailles 24, 32 et 40 px ; cercle pour une personne, carré arrondi pour une organisation. Toujours décoratif (`aria-hidden`), le nom est écrit à côté.

## Do's and Don'ts

### Do:
- **Do** garder un seul bouton bleu par vue, et rendre secondaire l'action de la barre d'outils quand le tiroir apporte la sienne.
- **Do** écrire chaque état avec une pastille et un mot ; pastille pleine pour « Actif », creuse pour « Suspendu ».
- **Do** utiliser les rayons selon la taille : 6 px petits éléments, 8 px contrôles, 12 px conteneurs, pilule pour badges, statuts et compteurs.
- **Do** ouvrir formulaires et secrets dans le tiroir de 400 px à droite, plafonné en hauteur, avec seul le corps qui défile, et y porter le focus.
- **Do** monter tous les contrôles à 44 px sous 768 px et transformer les tableaux en cartes.
- **Do** composer les icônes au trait de 1,75 sur grille de 24, à 16 px, en `currentColor`.

### Don't:
- **Don't** utiliser le bleu d'accent pour décorer, catégoriser ou teinter une organisation.
- **Don't** utiliser vert ou rouge hors d'un état, ni signaler un état par la seule couleur.
- **Don't** donner à un avatar une teinte verte, rouge ou du bleu d'accent.
- **Don't** employer la police mono hors des identifiants, codes de lieu et secrets.
- **Don't** ajouter tissus, liserés, motifs ou couleur d'organisation en aplat : seul le mot-symbole TRACE·OPS reste de l'identité précédente.
- **Don't** poser d'ombre dure ou décalée en aplat ; les ombres restent floues et sous 15 % d'opacité.
- **Don't** laisser la barre d'outils passer sur deux lignes ni un compteur d'onglet disparaître pendant un chargement.
