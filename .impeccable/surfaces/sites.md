# Sites et salles

Mode : Operate. Extension de la console TRACEOPS existante, sans remplacement de son identité visuelle.

## Objectif
Un responsable client définit un site et ses lieux ; un contrôleur habilité ou un responsable prestataire consulte les lieux de son périmètre. L’administrateur renseigne un motif pour chaque création.

## Direction
Le monde visuel suit la console refondue (direction « Pagne d'entreprise », voir apps-web-src-main-tsx.md) ; les formulaires restent intégrés au flux. Ajouter deux rubriques explicites : Équipe et Sites et salles, avec état actif. Dans la première vue, afficher les sites accessibles ou l’action pour créer le premier site. Dans le détail, montrer le nom du site, les lieux, leurs codes et leurs chemins de rattachement. Une liste à plat avec chemins lisibles évite une indentation trop profonde sur téléphone. La recherche porte aussi sur les ancêtres.

## Comportements attendus
Chargement, erreur avec relance et absence de données sont distincts. La saisie reste visible après une erreur de création. Changer de type réinitialise le parent proposé. Une mutation bloque temporairement le changement d’organisation et de rubrique. Le changement d’organisation efface les données de détail du contexte précédent. Les permissions restent contrôlées par le backend.

## Limites de ce lot
Création et consultation uniquement. Rattachements prestataires et habilitations des contrôleurs disponibles par API. Archivage, modification, déplacement et suppression des lieux non exposés. Aucun parcours d’intervention prétendument livré.

## Comportements livrés
Les rubriques sont visibles pour l’administrateur, les responsables client/prestataire et les contrôleurs client. La rubrique active utilise un fond indigo clair et une icône safran sur ordinateur, un soulignement safran sur téléphone, avec `aria-current="page"`. Les boutons sont empilés dans le rail sur ordinateur et deviennent des onglets à 760px et moins. Le changement de rubrique est local à l’application, sans URL dédiée.

La création est proposée dans une organisation client à son responsable ou à l’administrateur. Les autres utilisateurs habilités consultent les sites accessibles. Un site comporte un nom, une activité (avec saisie libre pour Autre) et un fuseau horaire prérempli avec Africa/Douala. Après création, son détail s’ouvre. Les lieux proposent Bâtiment, Étage, Zone, Salle et Équipement ; le parent proposé doit appartenir à un type situé plus haut dans cette hiérarchie, ou au site directement. Le code est unique dans le site. Le motif administratif est obligatoire pour l’administrateur.

Les sites sont des lignes cliquables sur fond blanc. Les lieux sont des lignes de consultation avec nom, chemin des ancêtres (« Directement au site » pour un lieu sans parent), type et code ; à 760px et moins, les métadonnées passent sous le nom et le chemin. La recherche filtre le nom, le code et les noms des ancêtres, sans tenir compte de la casse. Une recherche sans résultat propose son effacement.

Les formulaires réutilisent les panneaux et champs existants. Leur titre reçoit le focus à l’ouverture ; la fermeture ou une création réussie ramène le focus au titre de la surface. Les chargements et confirmations utilisent `role="status"`, les erreurs `role="alert"`. Pendant l’enregistrement, les champs, la navigation de contexte, la déconnexion et les actions concurrentes sont désactivés. Le composant est recréé au changement d’organisation et les réponses de chargement devenues obsolètes sont ignorées. Les libellés et messages sont disponibles en français et en anglais.

## Documentation de référence
DESIGN.md et .impeccable/design.json ont été régénérés lors de la refonte « Pagne d'entreprise » : ils décrivent désormais la console complète, rubriques et étiquettes de lieux comprises. Le présent document garde les comportements propres à cette surface. PRODUCT.md décrit le premier parcours livré, sans inventorier cette extension.

## Preuves
scripts/sites-smoke.mjs : parcours navigateur sur PostgreSQL, comptes synthétiques. Captures locales non versionnées dans .impeccable/review/sites-desktop.png (1440), sites-mobile.png (390) et sites-form-mobile.png (360). Tests : motif admin, hiérarchie, doublon de code, recherche, erreur/reprise, droits prestataire/contrôleur, changement de contexte, FR/EN et absence de débordement horizontal.
