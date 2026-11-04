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
Comportements, droits, libellés FR/EN, sélecteurs natifs « Organisation active » et « Langue », classes `.zone-list`, rôles de tableau et messages d'état conservés (scripts/ui-smoke.mjs, scripts/sites-smoke.mjs). Aucune opération future présentée comme disponible ; aucune donnée fictive dans l'interface livrée.

## Retours de l'utilisateur
L'ancienne interface est jugée fade et générique, peu crédible, mal organisée (colonne latérale vide, rien ne guide le regard).

## Direction contract
THESIS: On agit toujours au nom d'une organisation précise ; chaque organisation porte son motif et sa couleur, comme le pagne qu'une entreprise fait imprimer à ses couleurs. Refuse la console SaaS grise où le contexte actif n'est qu'une petite liste déroulante.
OWN-WORLD: Rail indigo profond (#1d2457) ; fond clair teinté indigo ; surfaces blanches ; encre indigo-noir. Safran pour l'action principale (texte indigo), vermillon pour suspendu et erreurs, vert émeraude pour actif. Sept couleurs de wax pour les organisations. Motifs géométriques : points et cercles pour les clients, losanges et chevrons pour les prestataires. Archivo variable, noms d'organisation en semi-condensé gras. Coins 6 à 8 px, filets fins, aucune ombre décorative.
STORY: Le visiteur voit d'abord dans quelle organisation il agit, puis l'équipe ou les lieux de cette organisation, puis l'action à mener. Changer d'organisation change visiblement le liseré.
FIRST VIEWPORT: Ordinateur : rail indigo de 264 px (logo, échantillon-motif et sélecteur d'organisation, création d'organisation, rubriques, compte et langue en bas). Contenu : liseré de 10 px au motif de l'organisation, type puis nom en 34 px semi-condensé, actions à droite (safran pour l'action principale), puis tableau des membres. Téléphone : bandeau indigo (logo, langue, déconnexion), sélecteur avec échantillon, onglets de rubriques, membres en cartes.
FORM: Pagne d'entreprise, position 6 de la liste ordonnée ; seed:ad8cd18feb6f5f8c. Geste signature : liseré et échantillon générés depuis l'identifiant de l'organisation, déroulés en 240 ms au changement de contexte.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
