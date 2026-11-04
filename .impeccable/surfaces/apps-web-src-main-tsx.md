---
version: 1
slug: "apps-web-src-main-tsx"
primary_target: "apps/web/src/main.tsx"
related_targets: ["apps/web/src/sites.tsx","apps/web/src/style.css"]
---

# Console TRACEOPS (connexion, équipe, sites et salles)

Mode : Operate. Refonte complète du monde visuel de l'application web ; seul le mot-symbole TRACE·OPS (TRACE en graisse forte, OPS en graisse régulière, point rond) est conservé.

## Public et tâche
Administrateur, responsables client et prestataire, contrôleurs et agents. Ils se connectent, choisissent l'organisation au nom de laquelle ils agissent, gèrent l'équipe (invitations, agents, mot de passe temporaire affiché une fois) et définissent sites et lieux. Usage à égalité sur ordinateur de bureau (lumière de jour, néons) et sur téléphone en circulation sur site (couloirs d'hôpital, extérieur, forte lumière, réseau variable) : thème clair, contrastes forts.

## Contraintes
Comportements, droits, libellés FR/EN, sélecteur natif « Langue », classes `.zone-list`, rôles de tableau et messages d'état conservés. Depuis la disposition maître-détail, le choix d'organisation est une navigation « Organisations » de boutons (aria-current), désactivés pendant un enregistrement ; scripts/ui-smoke.mjs et scripts/sites-smoke.mjs suivent cette structure. Aucune opération future présentée comme disponible ; aucune donnée fictive dans l'interface livrée.

## Retours de l'utilisateur
L'ancienne interface est jugée fade et générique, peu crédible, mal organisée (colonne latérale vide, rien ne guide le regard). Après la première refonte, l'utilisateur demande de réarranger les écrans (rail, en-tête et actions, listes, téléphone) en gardant le monde visuel ; il choisit la disposition maître-détail.

## Direction contract
THESIS: On agit toujours au nom d'une organisation précise ; chaque organisation porte son motif et sa couleur, comme le pagne qu'une entreprise fait imprimer à ses couleurs. Refuse la console SaaS grise où le contexte actif n'est qu'une petite liste déroulante.
OWN-WORLD: Rail indigo profond (#1d2457) ; fond clair teinté indigo ; surfaces blanches ; encre indigo-noir. Safran pour l'action principale (texte indigo), vermillon pour suspendu et erreurs, vert émeraude pour actif. Sept couleurs de wax pour les organisations. Motifs géométriques : points et cercles pour les clients, losanges et chevrons pour les prestataires. Archivo variable, noms d'organisation en semi-condensé gras. Coins 6 à 8 px (statuts et compteurs en capsule), filets fins, aucune ombre. Liens en indigo soulignés ; le bleu roi est réservé aux anneaux de focus.
STORY: Le visiteur voit d'abord les organisations et celle où il agit, puis la liste (équipe ou sites) au centre, puis l'action ou le détail dans le panneau de droite, sans que rien ne pousse la liste. Changer d'organisation change visiblement le liseré.
FIRST VIEWPORT: Ordinateur (1240 px et plus) : trois zones. À gauche, colonne indigo de 280 px bordée d'un liseré vertical : logo, navigation « Organisations » (échantillon de tissu, nom en semi-condensé, type et rôle ; l'organisation active sur sa teinte), création d'organisation, compte et langue en bas. Au centre : liseré de 12 px en haut, nom de l'organisation en 34 px avec sa puce de type dessous, onglets Équipe / Sites et salles soulignés d'indigo, puis la liste (tableau des membres, ou liste des sites). À droite, panneau de détail : actions de l'équipe (une seule safran) ou formulaire, secret à usage unique, site choisi avec ses lieux. Entre 760 et 1240 px, la liste et le détail alternent. Téléphone : écrans successifs (organisations › liste › détail) sous un bandeau indigo (logo, langue, déconnexion), retour « Organisations » quand il y en a plusieurs.
FORM: Pagne d'entreprise, position 6 de la liste ordonnée ; seed:ad8cd18feb6f5f8c. Disposition : maître-détail, structure 3 de 7, tirage de surface seed:bbb245f6d36cbda6. Geste signature : liserés (12 px, une rangée de tuiles de 12 px) et coupon de la plaque générés depuis l'identifiant de l'organisation, ré-imprimés (déroulé de 240 ms) au changement de contexte. Amendement après revue : 12 px au lieu de 10 px pour garder le motif entier, et liseré vertical ajouté pour que le rail porte le tissu.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
