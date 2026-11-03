# Validation du premier parcours d’accès

## Réalisé
Interface React/TypeScript bilingue : connexion, organisation active, création d’organisation, invitations, liste des membres, ajout d’agent et changement du mot de passe initial.
API NestJS : sessions PostgreSQL, cookies protégés, limite d’essais, contrôle du contexte, créations transactionnelles et audit.
Migrations 001 et 002 exécutées sur PostgreSQL 17. Le runner a été rejoué sans doublon. Le bootstrap a créé uniquement un administrateur de test dans une base locale jetable.

## Preuves
16 tests automatisés réussis, dont un parcours HTTP contre PostgreSQL réel : création d’organisations, invitation à usage unique, adhésion existante multi-organisation, agent, changement obligatoire, révocation après logout, refus inter-organisations, rôle agent limité, audit et limitation des tentatives.
Build frontend TypeScript/Vite réussi. Parcours navigateur exécuté en Chromium local avec contrôle FR/EN et viewports 1440 et 390 pixels. Captures sans mot de passe ni jeton d’invitation affiché.

## Portée
La CI est configurée avec PostgreSQL ; son exécution distante reste à vérifier après publication. Aucun endpoint d’interventions ni migration de photos n’est livré. MFA, récupération de compte, suspension et révocation manuelle restent des travaux préalables à une ouverture en production.
Le lien d’invitation est à transmettre manuellement : l’envoi d’un courriel ne fait pas partie de ce lot.

## Revue de l’interface
Les trois remarques de la revue indépendante sont corrigées : tableau mobile lisible avec défilement accessible, changement de contexte bloqué pendant une mutation et erreur de chargement distincte d’une équipe vide. Les scénarios navigateur de mutation retardée et de chargement en erreur ont passé ; largeur 360 px également vérifiée sans débordement global.
