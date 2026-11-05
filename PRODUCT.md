# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Responsable client** (entreprise, hôpital, hôtel, immeuble) : prépare ses sites et ses lieux, gère son équipe (responsables, contrôleurs) ; à terme, crée, suit et contrôle les interventions.
- **Responsable prestataire** (nettoyage, maintenance) : gère son équipe, ajoute ses agents, consulte les sites rattachés ; à terme, affecte les interventions reçues.
- **Agent terrain** : se connecte, remplace son mot de passe temporaire ; à terme, consulte et réalise ses missions sur téléphone.
- **Contrôleur client** : consulte les sites où il est habilité ; à terme, valide ou demande une reprise.
- **Administrateur global** : le porteur du projet, seul ; crée les organisations, invite, et n'intervient pour un client qu'exceptionnellement, avec un motif conservé.

Une personne peut appartenir à plusieurs organisations, avec un contexte et des droits séparés. Usage à parts égales sur ordinateur au bureau (gestion, contrôle) et sur téléphone sur site (couloirs d'hôpital, extérieur, forte lumière, réseau variable).

## Product Purpose

TRACEOPS est une application web responsive de suivi et de contrôle d'interventions de nettoyage et de maintenance, entre des clients et les prestataires avec qui ils travaillent déjà. Le client crée et contrôle, le prestataire affecte, l'agent exécute. Le succès : une intervention comprise, réalisée, documentée puis validée, avec une responsabilité identifiable à chaque étape.

Pilote au Cameroun : 10 clients, 10 prestataires, 10 sites et 10 agents annoncés.

## Positioning

Les responsabilités sont séparées par organisation et vérifiées côté serveur : le client valide directement le travail de son prestataire, sans prévalidation par le prestataire, et chaque action conserve son auteur réel. On agit toujours au nom d'une organisation précise, sur un lieu identifié par son code ; ce contexte est affiché mais ne vaut jamais autorisation.

## Operating Context

- Lieux : site → bâtiment → étage → zone → salle → équipement, niveaux intermédiaires facultatifs ; chaque lieu porte un code unique dans son site (par exemple SAL-101). Secteurs : entreprises, hôpitaux, hôtels, immeubles, autres.
- Fuseau du site proposé Africa/Douala ; instants stockés en UTC.
- Invitations à usage unique, valables 48 heures, transmises à la main (aucun courriel envoyé). Agents créés directement par leur responsable, avec un mot de passe temporaire affiché une seule fois et changé à la première connexion.
- Les écritures administratives sur les sites et lieux exigent un motif, conservé dans le journal d'audit.
- Fonctionnement en ligne uniquement ; aucun travail hors connexion au lancement.

## Capabilities and Constraints

**Livré :** connexion par mot de passe et session, changement obligatoire du mot de passe initial, organisations clientes et prestataires, invitations, ajout d'agents, membres et état d'accès (actif, suspendu), sites et lieux hiérarchiques (création, consultation, recherche), français et anglais.

**À venir, jamais présenté comme disponible :** interventions persistantes, affectation, comptes rendus, photos avant/après, contrôle et reprise, anomalies, récurrence, QR, PDF, notifications dans l'application, modification et archivage des lieux, récupération de mot de passe. Les rattachements prestataires et les habilitations des contrôleurs n'existent que par API.

Le contrôle des droits appartient au serveur ; l'interface ne fait qu'en refléter le résultat.

## Brand Commitments

- Nom : TRACEOPS. Le mot-symbole TRACE·OPS (TRACE en graisse forte, OPS en graisse régulière, point rond) est conservé ; le reste du visuel a été laissé libre lors de la refonte de novembre 2026.
- Direction visuelle : le standard des consoles d'administration, exécuté sans décor au niveau de finition de Linear, Stripe Dashboard, Vercel et Google Workspace Admin. Choisi le 5 novembre 2026 de préférence aux directions plus typées qui lui étaient proposées.
- Voix : français et anglais, phrases courtes et factuelles, vocabulaire métier ; aucune promesse sur ce qui n'est pas implémenté.

## Evidence on Hand

- Comptes de démonstration synthétiques (`demo.admin`, `demo.client`, `demo.controleur`, `demo.prestataire`, `demo.agent`) et site « Hôpital de démonstration », créés par `docker compose run --rm setup` (voir docs/TESTER_EN_LOCAL.md).
- Dossier produit : docs/PRD.md, docs/DECISIONS_PILOTE.md, docs/ux/.
- Aucun client nommé, témoignage, logo partenaire, chiffre d'usage ni photographie réelle : n'en inventer aucun. Aucun test utilisateur n'a encore été mené.

## Product Principles

1. Le contexte d'action est toujours explicite : on sait au nom de quelle organisation et sur quel lieu on agit.
2. Une seule action principale par étape ; la prochaine action autorisée se trouve sans chercher.
3. Dire l'état réel : chargement, échec, enregistrement confirmé. Jamais de réussite ni de donnée fictive.
4. Des responsabilités séparées et traçables : qui crée, qui affecte, qui exécute, qui valide ; un motif pour l'exceptionnel.
5. Utilisable sur le terrain : téléphone, forte lumière, réseau variable, cibles tactiles confortables.

## Accessibility & Inclusion

Cible WCAG 2.2 AA : navigation au clavier, focus visible, libellés persistants, erreurs annoncées, cibles tactiles de 44 px visées, zoom à 200 %, statut jamais porté par la couleur seule. Tous les états et messages sont traduits en français et en anglais.
