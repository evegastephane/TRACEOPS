# Tableau de bord de l’application React

Le tableau de bord étend la nouvelle interface Inter, grise, blanche et bleue. Le système visuel de référence reste `DESIGN.md` à la racine, accompagné de `.impeccable/design.json` ; cette extension ne remplace ni la navigation ni les composants existants.

Le tableau de bord est la vue initiale de tous les profils, à la connexion et au changement d’organisation. Il présente le profil actif, le nombre d’organisations accessibles et les sites de l’organisation sélectionnée lorsque les droits le permettent. Il reste accessible sans organisation.

Les organisations proviennent du contexte du compte. Les sites sont chargés par l’API `sites` avec le contexte de l’organisation active. Leur nombre correspond aux résultats accessibles ; chargement, erreur avec nouvelle tentative, liste vide et indisponibilité restent distincts. Un tiret représente une valeur indisponible. La liste de sites affiche leurs noms ; l’ouverture du module se fait depuis les actions rapides.

Les actions suivent les habilitations : création d’organisation pour l’administrateur, gestion d’équipe pour l’administrateur et les responsables, accès aux sites pour ces profils et les contrôleurs clients. Les agents terrain disposent du tableau de bord et d’un message sur la disponibilité future des missions. Les interventions, rapports à contrôler et anomalies restent explicitement indisponibles : aucun indicateur opérationnel simulé n’est calculé.

Les panneaux reprennent les tokens existants : fond `--white`, bordure `--gray-200`, coins `--radius-lg`, texte secondaire `--gray-600`, libellés `--gray-500` et séparations `--gray-100`. La typographie et les boutons héritent du système courant, sans nouvelle palette ni nouvelle police.

Sur ordinateur, une colonne flexible accueille les panneaux de données et une colonne de 280px les actions rapides, avec un espacement de 24px. À 1023px et moins, les actions précèdent les données dans une seule colonne. À 767px et moins, les panneaux passent de 24px à 18px de marge interne et les onglets peuvent revenir à la ligne. Les textes sont disponibles en français et en anglais.

Implémentation : `apps/web/src/dashboard.tsx`, intégration dans `apps/web/src/main.tsx` et extension finale de `apps/web/src/style.css`.
