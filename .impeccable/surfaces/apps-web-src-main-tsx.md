---
version: 1
slug: "apps-web-src-main-tsx"
primary_target: "apps/web/src/main.tsx"
related_targets: ["apps/web/src/style.css","apps/web/src/interventions.tsx","apps/web/src/sites.tsx","apps/web/src/platform.tsx"]
---

# Console TRACEOPS (toutes les rubriques)

Mode : Operate. Refonte complète du 10 novembre 2026 : style et écrans. La console standard (gris, bleu, Inter) est jugée banale, mal organisée et peu lisible ; avant elle, « Pagne d'entreprise » était jugée chargée et peu professionnelle. Direction choisie : « Le rapport d'audit ». Seul le mot-symbole TRACE·OPS est conservé.

## Public et tâche
Responsables client et prestataire, contrôleurs, agents terrain, administrateur. Ils suivent et font avancer des interventions de nettoyage et de maintenance : demander, chiffrer, affecter, réaliser avec photos, contrôler, accepter. Bureau (Windows, néons, lumière du jour) et téléphone sur site (plein soleil, réseau variable).

## Réussite attendue (réponses du 10 novembre 2026)
Des tableaux de bord détaillés avec des graphiques pour mieux suivre ; un prospect convaincu en démonstration ; un agent autonome sur site au téléphone ; la traçabilité visible (qui a fait quoi, quand, avec photos et validation).

## Contraintes
Fonctions, droits, données et libellés FR/EN conservés ; navigation à plat, chaque rubrique un onglet, aucun sous-menu ni groupe replié (liste des organisations comprise). Aucune donnée inventée : chaque chiffre est calculé sur les interventions réelles renvoyées par l'API ; rien d'« à venir » présenté comme disponible. Pas d'œilleton de surtitre au-dessus des titres, pas de bande colorée latérale, pas de numérotation décorative.

## Direction contract
THESIS: Chaque intervention se lit comme un rapport qualité signé : la bande de visa (demandé, devis, affecté, réalisé, contrôlé) porte à chaque case un nom et une date, et la case vide dit qui doit agir. Refuse la console grise à un seul bleu de la catégorie autant que le document costumé (papier, tampons, sceaux).
OWN-WORLD: Coque pétrole #0e4a5c pleine hauteur, fond de page gris document #f1f4f5, feuilles blanches à filets #c9d5d9 et coins de 2 px ; encre #17262c, libellés #55656c en petites capitales espacées. Couleurs de conformité réservées aux états : vert #2e8b57 conforme, ambre #d99a1e observation ou en attente, rouge #c8372d non-conformité, retard, erreur, toujours avec un mot. Rampe ordinale pétrole pour les étapes dans les graphiques. Source Sans 3 variable pour tout, Source Code Pro pour références, codes et secrets. Densité de registre : lignes de 44 px, chiffres tabulaires.
STORY: Le responsable lit en tête le cartouche (organisation, site, période, édité par), puis la conformité et ce qui est en retard, puis les tendances et ce qu'il doit viser. Il ouvre un dossier : la bande de visa dit qui a fait quoi et quand, la prochaine étape est en tête, les tâches se lisent comme un tableau de conformité avec photos avant et après. L'agent voit ses missions du jour et coche ses tâches. Le prospect reconnaît le rapport qu'un auditeur demande.
FIRST VIEWPORT: Ordinateur 1440 × 900, responsable client, Vue d'ensemble : barre latérale pétrole de 240 px (mot-symbole, organisation, rubriques à plat, compte). Contenu : cartouche pleine largeur à cellules filetées (titre « Vue d'ensemble » en 28 px, organisation et site, période réglable 7 / 30 / 90 jours, édité le … par …) ; bande d'indicateurs (conformité au premier contrôle en grand avec jauge et objectif, passages réalisés, en retard en rouge, délai de contrôle, devis en attente) ; deux feuilles : évolution hebdomadaire de la conformité et interventions par étape (cliquables vers la liste) ; puis le tableau « À viser » avec la bande de visa compacte. Téléphone 390 : barre pétrole, rubriques défilantes, indicateurs en grille de deux, cartes au lieu des tableaux.
FORM: Le rapport d'audit, candidat 1 de ma liste ordonnée, carte IMPECCABLE’S PICK choisie par l'utilisateur contre le tirage (Le classeur) ; seed:7a7ce21f12b5cdea. Geste signature : la bande de visa, en grand sur chaque dossier, compacte dans chaque liste, en registre des étapes sur les tableaux de bord ; une case signée apparaît d'un « coup de tampon » de 180 ms (léger rebond d'échelle, coche qui se trace), seul mouvement signé avec le panneau latéral qui glisse de 8 px ; prefers-reduced-motion supprime tout.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Décisions ouvertes
Aucune référence de document inventée pour les tableaux de bord : le cartouche n'affiche que des faits (organisation, site, période, auteur, date d'édition). Les montants de devis ne figurent pas dans la liste des interventions : le tableau de bord compte les devis sans les chiffrer.
Écart assumé au FIRST VIEWPORT : aucun objectif de conformité n'est configurable dans le produit, donc aucun n'est affiché ; la jauge montre le taux seul et le graphique « Contrôles par semaine » dit les semaines sans contrôle. Un objectif viendra d'un réglage réel, jamais d'une valeur choisie par l'interface.
Les passages du jeu AFISA n'ont ni photo ni événement d'affectation (équipe posée par le script) : les cellules affichent « sans photo » et l'affectation nomme le prestataire sans personne ni date. Les vraies photos téléversées et les affectations faites dans l'application s'affichent avec leur auteur et leur date.
Les étapes en attente (planifiées, à affecter) prennent la rampe ordinale pétrole dans les graphiques ; vert, ambre et rouge restent aux résultats.
