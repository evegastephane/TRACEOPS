---
version: 1
slug: "apps-web-src-main-tsx"
primary_target: "apps/web/src/main.tsx"
related_targets: ["apps/web/src/sites.tsx","apps/web/src/style.css"]
---

# Console TRACEOPS (connexion, organisations, équipe, sites et salles)

Mode : Operate. Refonte complète du 5 novembre 2026 : l'utilisateur a choisi le standard de la catégorie, à réaliser au niveau de finition de Linear, Stripe Dashboard, Vercel et Google Workspace Admin. Seul le mot-symbole TRACE·OPS (TRACE en graisse forte, OPS en graisse régulière, point rond) est conservé de l'interface précédente.

## Public et tâche
Administrateur, responsables client et prestataire, contrôleurs et agents. Ils se connectent, choisissent l'organisation au nom de laquelle ils agissent, gèrent l'équipe (invitations, agents, mot de passe temporaire affiché une fois) et définissent sites et lieux. Usage à égalité sur ordinateur de bureau (lumière du jour, néons) et sur téléphone en circulation sur site (couloirs d'hôpital, extérieur, forte lumière, réseau variable) : thème clair, contrastes forts.

## Contraintes
Comportements, droits, libellés FR/EN, sélecteur natif « Langue » présent une seule fois, classes `.zone-list`, rôles de tableau et messages d'état conservés. Le choix d'organisation reste une navigation « Organisations » de boutons (aria-current), visible sur ordinateur et désactivée pendant un enregistrement ; les rubriques « Équipe » et « Sites et salles » restent des boutons. Une seule zone de texte (le secret) à l'écran ; aucune action répétée dans les états vides. scripts/ui-smoke.mjs et scripts/sites-smoke.mjs suivent cette structure. Aucune opération future présentée comme disponible ; aucune donnée fictive dans l'interface livrée.

## Retours de l'utilisateur
L'interface « Pagne d'entreprise » est jugée trop chargée, pas assez professionnelle, mal organisée et terne. Refonte complète demandée ; entre « Le bon d'intervention », « La signalétique » et le standard, l'utilisateur choisit le standard, avec Linear, Stripe Dashboard, Vercel et Google Workspace Admin comme références de finition.

## Direction contract
THESIS: La console d'administration attendue, exécutée au niveau des meilleures : on sait où tout se trouve avant de remarquer le style. Refuse le décor (tissus, liserés, couleur d'organisation qui envahit l'écran) autant que la console grise négligée.
OWN-WORLD: Barre latérale gris très clair (#f9fafb) bordée d'un filet, contenu blanc ; encre #111827, texte secondaire #4b5563 ; un seul accent bleu (#2563eb) pour l'action principale, la sélection et le focus ; vert et rouge réservés aux états, toujours pastille plus texte. Inter Variable à tailles optiques, 14 px de base sur ordinateur. Coins de 6 px (petits éléments), 8 px (contrôles) et 12 px (conteneurs), filets #e5e7eb, ombres légères décalées. Avatars à initiales en teintes douces déterministes : carré arrondi pour une organisation, cercle pour une personne.
STORY: Le visiteur voit d'abord où il agit (organisation active dans la barre latérale et en titre), puis la liste de travail (équipe ou sites) avec son action principale en haut à droite ; formulaires et secrets s'ouvrent dans un tiroir à droite, sans perdre la liste.
FIRST VIEWPORT: Ordinateur (1280 px et plus) : barre latérale de 256 px avec mot-symbole, navigation « Organisations » groupée Clients / Prestataires (avatar carré et nom ; l'active sur blanc à ombre légère), « Créer une organisation » pour l'administrateur, puis compte, langue et déconnexion en bas. Contenu : en-tête (avatar de 40 px, nom de l'organisation en 24 px semi-gras, badge de type et rôle), onglets soulignés Équipe (compteur) / Sites et salles, barre d'outils (phrase d'aide à gauche, actions à droite, une seule bleue), puis tableau des membres dans un conteneur arrondi ; tiroir de 400 px à droite dès qu'un formulaire ou un secret est ouvert. Sites : liste de 320 px et détail du site. Sous 1280 px, liste et tiroir alternent ; sous 768 px, écrans successifs (organisations › organisation › tiroir) sous une barre supérieure portant langue et déconnexion.
FORM: Le standard de la catégorie, porte de sortie choisie par l'utilisateur, hors de la liste ordonnée ; seed:38ffafd6d1fd5e86. Geste signature : aucun décor ; le tiroir glisse de 12 px à l'ouverture (220 ms, ease-out) et le focus passe à son titre.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
