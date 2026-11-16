import React, { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from './api';
import { Avatar } from './avatar';
import type { Lang } from './i18n';
import { AlertIcon, BackIcon, CheckIcon, CloseIcon, DownloadIcon, LockIcon, PenIcon, PlusIcon, ScanIcon, SearchIcon, StarIcon, TenderIcon } from './icons';
import { Alert, Empty, PageHead, Sheet, Skeleton, VisaBand, type Visa } from './ui';
import { CriteriaEditor, FieldInput, QualityEditor, QuestionsEditor, SectionsEditor, SectionsView, cleanFieldsList, cleanForm } from './form-builder';
import {
  TZ, addDays, clone, dateText, extractTemplate, fcfa, fieldTypes, fill, isEmpty, loc, num, sampleFile, say, scoreBids, serviceLabel, serviceTypes, tenderRef, contractRef, todayKey, valueText,
  type Bid, type Criterion, type Ctx, type Field, type FieldValue, type Org, type QualityCriterion, type Score, type Section, type ServiceType, type Template,
} from './procurement-model';

/* ------------------------------------------------------------------ words */

const fr = {
  title: 'Appels d’offres', intro: 'Rédigez l’appel d’offres à partir du formulaire du type de prestation, consultez vos prestataires, comparez les offres sur tous les critères, pas seulement le prix, puis retenez un ou plusieurs prestataires.',
  providerIntro: 'Les consultations auxquelles vous êtes invité : lisez le dossier et remettez votre offre avant la date limite.',
  tabTenders: 'Appels d’offres', tabTemplates: 'Modèles de formulaires', newTender: 'Nouvel appel d’offres', open: 'En consultation', toAnalyse: 'À analyser', awarded: 'Attribués',
  toAnswer: 'À répondre', sent: 'Offres transmises', retained: 'Retenues', search: 'Rechercher', searchHint: 'N°, objet, site', status: 'Statut', all: 'Tous',
  number: 'N°', object: 'Objet', deadline: 'Date limite', offers: 'Offres', best: 'Offre la plus basse', client: 'Client', myOffer: 'Mon offre', result: 'Résultat',
  empty: 'Aucun appel d’offres pour le moment.', emptyText: 'Partez d’un formulaire par type de prestation : ses rubriques, son bordereau de réponse et ses critères sont prêts à adapter.',
  emptyProvider: 'Aucune consultation reçue.', emptyProviderText: 'Les appels d’offres auxquels un client vous invite apparaîtront ici.', noMatch: 'Aucun appel d’offres ne correspond.',
  loading: 'Chargement…', retry: 'Réessayer', loadError: 'Impossible de charger les appels d’offres. Réessayez.', back: 'Appels d’offres', backToFile: 'Retour au dossier',
  DRAFT: 'Brouillon', PUBLISHED: 'Consultation en cours', CLOSED: 'Offres à analyser', AWARDED: 'Attribué', CANCELLED: 'Annulé', deadlinePassed: 'Date limite dépassée',
  pToSend: 'Offre à remettre', pNone: 'Pas d’offre', pSent: 'Offre transmise', pAnalysis: 'En cours d’analyse', pRetained: 'Retenue', pNotRetained: 'Non retenue',
  inSpan: 'dans {s}', agoSpan: 'dépassée depuis {s}', sentOn: 'Transmise le {d}', notSent: 'Non transmise',
  // Picker
  pickTitle: 'Nouvel appel d’offres', pickIntro: 'Choisissez le formulaire du type de prestation : rubriques, bordereau de réponse, critères d’attribution et critères de qualité sont déjà prêts. Vous les adaptez ensuite.',
  ownTemplates: 'Vos modèles', library: 'Bibliothèque par type de prestation', libraryMeta: 'formulaires TRACEOPS', use: 'Utiliser', customise: 'Personnaliser', editTpl: 'Modifier', archive: 'Archiver',
  counts: '{s} rubriques · {f} informations · {c} critères', source: 'Origine', updated: 'Modifié le {d}',
  // Editor
  editTitle: 'Modifier {n}', saveDraft: 'Enregistrer le brouillon', publish: 'Publier l’appel d’offres', publishAmend: 'Publier l’additif', amendTitle: 'Appel d’offres déjà publié',
  amendText: 'Chaque modification est un additif : les prestataires consultés en voient le motif. Vous pouvez ajouter des prestataires, pas en retirer.', amendReason: 'Motif de l’additif',
  general: 'Informations générales', tTitle: 'Intitulé', tObject: 'Objet de la consultation', tType: 'Type de prestation', tSite: 'Site concerné', noSite: 'Plusieurs sites ou non précisé',
  tBudget: 'Budget prévisionnel', tBudgetHelp: 'Confidentiel : jamais montré aux prestataires, il sert à situer les offres.', tDeadline: 'Date limite de remise des offres', tStart: 'Démarrage souhaité', tDuration: 'Durée d’exécution',
  tTerms: 'Délai de règlement', tTermsHelp: 'Jours après l’acceptation de chaque prestation.', days: 'jours', spec: 'Cahier des charges', specIntro: 'Les rubriques propres à ce type de prestation. Renseignez-les ; adaptez une rubrique si votre site l’exige.',
  reply: 'Bordereau de réponse', replyIntro: 'Ce que chaque prestataire doit renseigner, en plus du montant, du délai, du contenu de son offre et de ses points forts.',
  criteria: 'Critères d’attribution', criteriaIntro: 'Le prix n’est qu’un critère parmi d’autres. Le prix et le délai sont notés à partir des offres ; les autres critères sont notés par la commission.',
  quality: 'Suivi de la qualité', qualityIntro: 'Une fois le prestataire retenu, votre technicien notera chacun de ces critères de 1 à 10, en justifiant ses notes.',
  consulted: 'Prestataires consultés', consultedMeta: '{n} sélectionné(s)', providerSearch: 'Rechercher un prestataire', linkedChip: 'Déjà rattaché à vos sites', noProvider: 'Aucun prestataire ne correspond.',
  beforePublish: 'Avant de publier', ckTitle: 'Intitulé renseigné', ckDeadline: 'Date limite à venir', ckProviders: '{n} prestataire(s) consulté(s)', ckCriteria: 'Critères d’attribution : {n} %',
  ckQuality: '{n} critère(s) de qualité', ckRequired: '{n} information(s) obligatoire(s) à renseigner', ckRequiredOk: 'Informations obligatoires renseignées',
  sealedNote: 'Les offres restent scellées jusqu’à la clôture : personne ne voit les montants avant l’ouverture.', saved: 'Brouillon enregistré.', publishedOk: 'Appel d’offres publié : les prestataires consultés peuvent répondre.', amended: 'Additif publié.',
  // Detail
  pdf: 'Éditer le dossier (PDF)', edit: 'Modifier', closeOffers: 'Clôturer et ouvrir les offres', cancelTender: 'Annuler l’appel d’offres', confirmCancel: 'Confirmer l’annulation', reason: 'Motif',
  saveAsTemplate: 'Enregistrer comme modèle', templateSaved: 'Modèle enregistré dans « Modèles de formulaires ».', site: 'Site', budget: 'Budget prévisionnel', terms: 'Règlement', termsValue: '{n} j après acceptation',
  received: 'Offres reçues', receivedOf: '{a} sur {n} consultés', start: 'Démarrage', duration: 'Durée',
  sPrep: 'Préparé par', sLaunch: 'Lancé', sOffers: 'Offres', sAnalysis: 'Analyse', sAward: 'Attribué à', toPublish: 'À publier', receivedN: '{n} reçue(s)', untilD: 'jusqu’au {d}', comparing: 'Comparaison',
  shortlistedN: '{n} présélectionnée(s)', cancelled: 'Annulé', yourTurn: 'À vous', invitedN: '{n} consulté(s)',
  next: 'Prochaine étape', nextDraft: 'Complétez le dossier puis publiez-le : les prestataires consultés pourront remettre leur offre jusqu’à la date limite.',
  nextPublished: '{a} prestataire(s) sur {n} ont répondu. Les offres restent scellées jusqu’à la clôture.', nextPublishedLate: 'La date limite est passée : clôturez pour ouvrir les offres et les comparer.',
  nextClosed: 'Comparez les offres, présélectionnez les meilleures, puis retenez un ou plusieurs prestataires.', nextAwarded: 'Attribué. Le suivi du coût, du délai et de la qualité se fait dans le contrat.',
  nextCancelled: 'Appel d’offres annulé.', recordBid: 'Saisir une offre reçue', recordHelp: 'Pour une offre reçue sur papier ou par courriel. Une offre transmise en ligne par le prestataire ne peut pas être remplacée.',
  award: 'Retenir un ou plusieurs prestataires', openContract: 'Ouvrir le contrat {n}', sealedTitle: 'Offres scellées', sealedText: 'Montants et contenus seront lisibles à la clôture.',
  receivedOn: 'Reçue le {d}', recorded: 'saisie par le client', online: 'transmise en ligne', invitations: 'Prestataires consultés', answered: 'Offre reçue le {d}', noAnswer: 'Pas encore de réponse',
  dossier: 'Dossier de consultation', replyAsked: 'Bordereau de réponse', replyFixed: 'Montant total, délai, contenu de l’offre et points forts, puis :', weight: 'Pondération', computed: 'calculé',
  qualityAsked: 'Critères de qualité (notés de 1 à 10)', history: 'Historique', none: '—', decision: 'Décision',
  // Comparison
  compare: 'Comparaison des offres', compareMeta: '{n} offre(s) · notes sur 10', onlyShort: 'Présélectionnées uniquement', criterion: 'Critère', rank: 'Note globale', amount: 'Montant', delay: 'Délai',
  perCriterion: 'Notes par critère', offer: 'Offre', content: 'Contenu de l’offre', strengths: 'Points forts', answers: 'Réponses au bordereau', opinion: 'Avis et décision', review: 'Avis de la commission',
  provisional: 'provisoire', notMarked: 'à noter', cheapest: 'Moins-disant', bestValue: 'Mieux-disant', fastest: 'Plus rapide', vsCheapest: '+{p} % / moins-disant', vsBudget: '{p} % / budget',
  mark: 'Noter', shortlist: 'Présélectionner', unshortlist: 'Retirer de la présélection', reject: 'Écarter', restore: 'Rétablir', readMore: 'Lire la suite', readLess: 'Réduire',
  SUBMITTED: 'Reçue', SHORTLISTED: 'Présélectionnée', REJECTED: 'Écartée', BID_AWARDED: 'Retenue', NOT_RETAINED: 'Non retenue', rejectReason: 'Motif de l’écartement',
  markTitle: 'Notation de l’offre — {p}', markHelp: 'De 0 à 10, par demi-point. Le prix et le délai sont calculés à partir des offres.', note: 'Justification', saveMarks: 'Enregistrer la notation', cancel: 'Annuler',
  awardTitle: 'Attribution', awardHelp: 'Chaque prestataire retenu reçoit un contrat à accepter ; une fois accepté, ses engagements (montant, délai) sont suivis jusqu’au bilan. S’il refuse, l’appel d’offres revient en analyse. Les autres offres ne sont pas retenues.',
  awardAmount: 'Montant engagé', awardDays: 'Durée d’exécution', awardStart: 'Début', awardInstallments: 'Échéancier', awardInstallmentsHelp: 'Nombre de prestations à réceptionner (une par mois pour un contrat long).',
  awardTarget: 'Note qualité visée', awardNote: 'Motif de la décision', awardNoteHint: 'ex. Mieux-disant : meilleure méthodologie et références, prix dans le budget.', confirmAward: 'Retenir et créer le contrat',
  scheduleLine: '{n} prestation(s) de {a}, fin prévue le {d}', awardedOk: 'Attribution enregistrée : le prestataire doit maintenant accepter le contrat.',
  // Bids
  bidTitle: 'Votre offre', bidHelp: 'Vous pouvez modifier votre offre jusqu’à la date limite du {d}.', bidAmount: 'Montant total de l’offre', bidDelay: 'Délai proposé', bidDelayHelp: 'Délai d’exécution ou de mise en place.',
  bidContent: 'Contenu de l’offre', bidContentHint: 'Organisation, moyens, planning, ce qui est inclus et exclu…', bidStrengths: 'Points forts', bidStrengthsHint: 'Ce qui distingue cette offre : références, certifications, réactivité…',
  bidAnswers: 'Réponses au bordereau', sendBid: 'Transmettre mon offre', updateBid: 'Mettre à jour mon offre', saveRecorded: 'Enregistrer l’offre', provider: 'Prestataire', chooseProvider: 'Choisir un prestataire',
  bidSent: 'Offre transmise.', bidUpdated: 'Offre mise à jour.', bidRecorded: 'Offre enregistrée.', editBid: 'Modifier mon offre', myBidTitle: 'Offre transmise le {d}',
  resultRetained: 'Votre offre est retenue : acceptez ou refusez le contrat dans « Contrats ».', resultNotRetained: 'Votre offre n’a pas été retenue.', resultAnalysis: 'La remise des offres est close : votre offre est en cours d’analyse.',
  resultNoBid: 'La remise des offres est close.', resultCancelled: 'Cet appel d’offres a été annulé.', pBand1: 'Lancé', pBand2: 'Votre offre', pBand3: 'Analyse', pBand4: 'Résultat', toSendBefore: 'À remettre avant le {d}',
  // Templates
  tplIntro: 'Chaque type de prestation a ses rubriques. Partez de la bibliothèque, adaptez-la à vos sites, ou extrayez les rubriques de vos anciens dossiers d’appel d’offres.',
  extract: 'Extraire d’un ancien dossier', blank: 'Nouveau modèle vierge', noOwn: 'Aucun modèle propre pour le moment : personnalisez un formulaire de la bibliothèque ou extrayez-en un d’un ancien dossier.',
  tplLoadError: 'Impossible de charger les modèles. Réessayez.', tplEditor: 'Modèle de formulaire', tplName: 'Nom du modèle', tplDescription: 'Description', tplSections: 'Rubriques du cahier des charges',
  tplSave: 'Enregistrer le modèle', tplSaved: 'Modèle enregistré.', tplArchived: 'Modèle archivé.', tplNewName: 'Nouveau modèle', tplCopy: '{n} — version adaptée',
  exTitle: 'Extraire les rubriques d’un ancien dossier', exIntro: 'Collez le texte d’un ancien dossier d’appel d’offres (sommaire, cahier des charges, pièces, grille de notation) ou chargez un fichier texte. TRACEOPS repère les titres, les informations demandées, la liste des pièces et la grille de notation ; vous vérifiez avant d’enregistrer.',
  exText: 'Texte du dossier', exFile: 'Charger un fichier texte', exSample: 'Essayer avec un exemple', exRun: 'Repérer les rubriques', exFound: '{s} rubriques, {f} informations et {c} critères repérés.',
  exNothing: 'Aucune rubrique repérée : vérifiez que le texte contient des titres (ARTICLE 1, I., 1., ou lignes en majuscules).', exOpen: 'Ouvrir dans l’éditeur de modèle', exType: 'Type de prestation du modèle',
  exCheck: 'Rubriques repérées automatiquement dans un ancien dossier : vérifiez les noms, les types et les critères avant d’enregistrer.', exSource: 'Extrait d’un ancien dossier', exCriteria: 'Critères repérés',
  pDeclined: 'Décliné', invAccepted: 'Participe — offre attendue', invDeclined: 'A décliné le {d}', participate: 'Je participe', decline: 'Décliner l’invitation',
  declineReason: 'Motif (communiqué au client)', confirmDecline: 'Confirmer le refus', invitedQ: 'Participez-vous à cette consultation ?',
  invitedHelp: 'Votre réponse est transmise au client. Envoyer une offre confirme votre participation.', youDeclined: 'Vous avez décliné cette consultation le {d}.',
  reconsider: 'Revenir sur ma décision', participated: 'Participation confirmée : le client en est informé.', declinedOk: 'Invitation déclinée : le client en est informé.',
  awaitingAcceptance: 'en attente d’acceptation', acceptedByProvider: 'accepté par le prestataire', declinedByProvider: 'refusé par le prestataire',
  nextAwardedPending: 'Attribué. Le prestataire retenu doit accepter le contrat (sans compte TRACEOPS, vous enregistrez sa réponse écrite dans « Contrats ») : il intervient sur vos sites seulement après acceptation.', BID_DECLINED: 'Contrat refusé',
};
type T = typeof fr;
const en: T = {
  title: 'Tenders', intro: 'Write the tender from the form of the type of service, invite your providers, compare the offers on every criterion, not only price, then retain one or several providers.',
  providerIntro: 'The tenders you are invited to: read the file and send your offer before the deadline.',
  tabTenders: 'Tenders', tabTemplates: 'Form templates', newTender: 'New tender', open: 'Open', toAnalyse: 'To analyse', awarded: 'Awarded',
  toAnswer: 'To answer', sent: 'Offers sent', retained: 'Retained', search: 'Search', searchHint: 'No., purpose, site', status: 'Status', all: 'All',
  number: 'No.', object: 'Purpose', deadline: 'Deadline', offers: 'Offers', best: 'Lowest offer', client: 'Client', myOffer: 'My offer', result: 'Result',
  empty: 'No tender yet.', emptyText: 'Start from a form for the type of service: its sections, reply form and criteria are ready to adapt.',
  emptyProvider: 'No tender received.', emptyProviderText: 'The tenders a client invites you to will appear here.', noMatch: 'No tender matches.',
  loading: 'Loading…', retry: 'Try again', loadError: 'The tenders could not be loaded. Try again.', back: 'Tenders', backToFile: 'Back to the file',
  DRAFT: 'Draft', PUBLISHED: 'Open for offers', CLOSED: 'Offers to analyse', AWARDED: 'Awarded', CANCELLED: 'Cancelled', deadlinePassed: 'Deadline passed',
  pToSend: 'Offer to send', pNone: 'No offer', pSent: 'Offer sent', pAnalysis: 'Under review', pRetained: 'Retained', pNotRetained: 'Not retained',
  inSpan: 'in {s}', agoSpan: 'passed {s} ago', sentOn: 'Sent on {d}', notSent: 'Not sent',
  pickTitle: 'New tender', pickIntro: 'Choose the form of the type of service: sections, reply form, award criteria and quality criteria are ready. You adapt them next.',
  ownTemplates: 'Your templates', library: 'Library by type of service', libraryMeta: 'TRACEOPS forms', use: 'Use', customise: 'Customise', editTpl: 'Edit', archive: 'Archive',
  counts: '{s} sections · {f} fields · {c} criteria', source: 'Source', updated: 'Updated on {d}',
  editTitle: 'Edit {n}', saveDraft: 'Save the draft', publish: 'Publish the tender', publishAmend: 'Publish the amendment', amendTitle: 'Tender already published',
  amendText: 'Every change is an amendment: invited providers see its reason. You can add providers, not remove them.', amendReason: 'Reason for the amendment',
  general: 'General information', tTitle: 'Title', tObject: 'Purpose of the tender', tType: 'Type of service', tSite: 'Site', noSite: 'Several sites or not specified',
  tBudget: 'Estimated budget', tBudgetHelp: 'Confidential: never shown to providers, it situates the offers.', tDeadline: 'Deadline for offers', tStart: 'Desired start', tDuration: 'Duration',
  tTerms: 'Payment terms', tTermsHelp: 'Days after the acceptance of each service.', days: 'days', spec: 'Specification', specIntro: 'The sections of this type of service. Fill them in; adapt a section when your site needs it.',
  reply: 'Reply form', replyIntro: 'What every provider must state, besides the amount, the lead time, the content of the offer and its strengths.',
  criteria: 'Award criteria', criteriaIntro: 'Price is one criterion among others. Price and lead time are marked from the offers; the other criteria are marked by the committee.',
  quality: 'Quality follow-up', qualityIntro: 'Once the provider is retained, your technician will mark each of these criteria from 1 to 10 and justify the marks.',
  consulted: 'Invited providers', consultedMeta: '{n} selected', providerSearch: 'Search providers', linkedChip: 'Already linked to your sites', noProvider: 'No provider matches.',
  beforePublish: 'Before publishing', ckTitle: 'Title filled in', ckDeadline: 'Deadline in the future', ckProviders: '{n} provider(s) invited', ckCriteria: 'Award criteria: {n}%',
  ckQuality: '{n} quality criteria', ckRequired: '{n} required field(s) to fill in', ckRequiredOk: 'Required fields filled in',
  sealedNote: 'Offers stay sealed until closing: nobody sees the amounts before they are opened.', saved: 'Draft saved.', publishedOk: 'Tender published: invited providers can answer.', amended: 'Amendment published.',
  pdf: 'Print the file (PDF)', edit: 'Edit', closeOffers: 'Close and open the offers', cancelTender: 'Cancel the tender', confirmCancel: 'Confirm cancellation', reason: 'Reason',
  saveAsTemplate: 'Save as template', templateSaved: 'Template saved in “Form templates”.', site: 'Site', budget: 'Estimated budget', terms: 'Payment', termsValue: '{n} d after acceptance',
  received: 'Offers received', receivedOf: '{a} of {n} invited', start: 'Start', duration: 'Duration',
  sPrep: 'Prepared by', sLaunch: 'Published', sOffers: 'Offers', sAnalysis: 'Analysis', sAward: 'Awarded to', toPublish: 'To publish', receivedN: '{n} received', untilD: 'until {d}', comparing: 'Comparison',
  shortlistedN: '{n} shortlisted', cancelled: 'Cancelled', yourTurn: 'Your turn', invitedN: '{n} invited',
  next: 'Next step', nextDraft: 'Complete the file and publish it: invited providers can send their offers until the deadline.',
  nextPublished: '{a} of {n} providers answered. Offers stay sealed until closing.', nextPublishedLate: 'The deadline has passed: close to open the offers and compare them.',
  nextClosed: 'Compare the offers, shortlist the best ones, then retain one or several providers.', nextAwarded: 'Awarded. Cost, delay and quality are followed in the contract.',
  nextCancelled: 'Tender cancelled.', recordBid: 'Record an offer received', recordHelp: 'For an offer received on paper or by e-mail. An offer sent online by the provider cannot be replaced.',
  award: 'Retain one or several providers', openContract: 'Open contract {n}', sealedTitle: 'Sealed offers', sealedText: 'Amounts and contents become readable at closing.',
  receivedOn: 'Received on {d}', recorded: 'recorded by the client', online: 'sent online', invitations: 'Invited providers', answered: 'Offer received on {d}', noAnswer: 'No answer yet',
  dossier: 'Tender file', replyAsked: 'Reply form', replyFixed: 'Total amount, lead time, content and strengths, then:', weight: 'Weight', computed: 'computed',
  qualityAsked: 'Quality criteria (marked from 1 to 10)', history: 'History', none: '—', decision: 'Decision',
  compare: 'Offer comparison', compareMeta: '{n} offer(s) · marks out of 10', onlyShort: 'Shortlisted only', criterion: 'Criterion', rank: 'Overall mark', amount: 'Amount', delay: 'Lead time',
  perCriterion: 'Marks per criterion', offer: 'Offer', content: 'Content of the offer', strengths: 'Strengths', answers: 'Reply form answers', opinion: 'Opinion and decision', review: 'Committee opinion',
  provisional: 'provisional', notMarked: 'to mark', cheapest: 'Lowest price', bestValue: 'Best value', fastest: 'Fastest', vsCheapest: '+{p}% vs lowest', vsBudget: '{p}% vs budget',
  mark: 'Mark', shortlist: 'Shortlist', unshortlist: 'Remove from shortlist', reject: 'Set aside', restore: 'Restore', readMore: 'Read more', readLess: 'Show less',
  SUBMITTED: 'Received', SHORTLISTED: 'Shortlisted', REJECTED: 'Set aside', BID_AWARDED: 'Retained', NOT_RETAINED: 'Not retained', rejectReason: 'Reason for setting aside',
  markTitle: 'Marking the offer — {p}', markHelp: 'From 0 to 10, in half points. Price and lead time are computed from the offers.', note: 'Justification', saveMarks: 'Save the marks', cancel: 'Cancel',
  awardTitle: 'Award', awardHelp: 'Each retained provider receives a contract to accept; once accepted, its commitments (amount, delay) are followed until the final review. If it declines, the tender goes back to analysis. The other offers are not retained.',
  awardAmount: 'Committed amount', awardDays: 'Duration', awardStart: 'Start', awardInstallments: 'Schedule', awardInstallmentsHelp: 'Number of services to accept (one per month for a long contract).',
  awardTarget: 'Target quality mark', awardNote: 'Reason for the decision', awardNoteHint: 'e.g. Best value: best method and references, price within budget.', confirmAward: 'Retain and open the contract',
  scheduleLine: '{n} service(s) of {a}, planned end {d}', awardedOk: 'Award recorded: the provider must now accept the contract.',
  bidTitle: 'Your offer', bidHelp: 'You can change your offer until the deadline on {d}.', bidAmount: 'Total amount of the offer', bidDelay: 'Proposed lead time', bidDelayHelp: 'Execution or set-up time.',
  bidContent: 'Content of the offer', bidContentHint: 'Organisation, means, planning, what is included and excluded…', bidStrengths: 'Strengths', bidStrengthsHint: 'What sets this offer apart: references, certifications, responsiveness…',
  bidAnswers: 'Reply form answers', sendBid: 'Send my offer', updateBid: 'Update my offer', saveRecorded: 'Record the offer', provider: 'Provider', chooseProvider: 'Choose a provider',
  bidSent: 'Offer sent.', bidUpdated: 'Offer updated.', bidRecorded: 'Offer recorded.', editBid: 'Change my offer', myBidTitle: 'Offer sent on {d}',
  resultRetained: 'Your offer is retained: accept or decline the contract in “Contracts”.', resultNotRetained: 'Your offer was not retained.', resultAnalysis: 'Offers are closed: your offer is under review.',
  resultNoBid: 'Offers are closed.', resultCancelled: 'This tender was cancelled.', pBand1: 'Published', pBand2: 'Your offer', pBand3: 'Analysis', pBand4: 'Result', toSendBefore: 'To send before {d}',
  tplIntro: 'Each type of service has its own sections. Start from the library, adapt it to your sites, or extract the sections of your previous tender files.',
  extract: 'Extract from a previous file', blank: 'New blank template', noOwn: 'No template of your own yet: customise a library form or extract one from a previous file.',
  tplLoadError: 'The templates could not be loaded. Try again.', tplEditor: 'Form template', tplName: 'Template name', tplDescription: 'Description', tplSections: 'Specification sections',
  tplSave: 'Save the template', tplSaved: 'Template saved.', tplArchived: 'Template archived.', tplNewName: 'New template', tplCopy: '{n} — adapted version',
  exTitle: 'Extract the sections of a previous file', exIntro: 'Paste the text of a previous tender file (contents, specification, documents, marking grid) or load a text file. TRACEOPS finds the titles, the requested information, the list of documents and the marking grid; you check before saving.',
  exText: 'Text of the file', exFile: 'Load a text file', exSample: 'Try with an example', exRun: 'Find the sections', exFound: '{s} sections, {f} fields and {c} criteria found.',
  exNothing: 'No section found: check that the text contains titles (ARTICLE 1, I., 1., or capitalised lines).', exOpen: 'Open in the template editor', exType: 'Type of service of the template',
  exCheck: 'Sections found automatically in a previous file: check names, types and criteria before saving.', exSource: 'Extracted from a previous file', exCriteria: 'Criteria found',
  pDeclined: 'Declined', invAccepted: 'Taking part — offer expected', invDeclined: 'Declined on {d}', participate: 'I take part', decline: 'Decline the invitation',
  declineReason: 'Reason (shared with the client)', confirmDecline: 'Confirm declining', invitedQ: 'Will you take part in this tender?',
  invitedHelp: 'Your answer is sent to the client. Sending an offer confirms that you take part.', youDeclined: 'You declined this tender on {d}.',
  reconsider: 'Change my answer', participated: 'Participation confirmed: the client is informed.', declinedOk: 'Invitation declined: the client is informed.',
  awaitingAcceptance: 'awaiting acceptance', acceptedByProvider: 'accepted by the provider', declinedByProvider: 'declined by the provider',
  nextAwardedPending: 'Awarded. The retained provider must accept the contract (without a TRACEOPS account, record its written answer in “Contracts”): it works on your sites only after accepting.', BID_DECLINED: 'Contract declined',
};

/* ------------------------------------------------------------------ types */

type Row = { id: string; number: number; title: string; service_type: string; status: string; deadline: string; created_at: string; published_at: string | null; closed_at: string | null;
  awarded_at: string | null; budget_xaf?: string | null; template_name: string | null; site_name: string | null; invited?: number; bids?: number; shortlisted?: number; best_amount?: string | null;
  awarded_to?: string | null; client_name?: string; response?: string | null; my_bid?: { id: string; status: string; submitted_at: string; updated_at: string; amount_xaf: string; delay_days: number } | null };
type Invitation = { provider_id: string; name: string; invited_at: string; city: string | null; services: string | null; submitted_at: string | null; response: string | null; response_reason: string | null; responded_at: string | null };
type Ev = { id: string; action: string; reason: string | null; created_at: string; actor: string };
type Tender = { id: string; number: number; client_id: string; site_id: string | null; template_name: string | null; service_type: ServiceType; title: string; object: string | null; budget_xaf?: string | null;
  deadline: string; start_date: string | null; duration_days: number | null; payment_terms_days: number; sections: Section[]; questions: Field[]; criteria: Criterion[]; quality_criteria: QualityCriterion[];
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'AWARDED' | 'CANCELLED'; decision_note?: string | null; created_at: string; updated_at: string; published_at: string | null; closed_at: string | null; awarded_at: string | null;
  site_name: string | null; client_name: string; created_by_name: string; invitations: Invitation[]; bids: Bid[]; events: Ev[]; contracts: { id: string; number: number; provider_id: string; provider_name: string; status: string }[];
  sealed: boolean; actions: string[]; my_invitation?: { response: string | null; response_reason: string | null; responded_at: string | null } | null };
type Draft = { title: string; object: string; serviceType: ServiceType; templateName: string; siteId: string; budget: string; deadline: string; startDate: string; durationDays: string; paymentTermsDays: string;
  sections: Section[]; questions: Field[]; criteria: Criterion[]; qualityCriteria: QualityCriterion[]; providerIds: string[] };
type DirectoryProvider = { id: string; name: string; city: string | null; services: string | null; site_ids: string[] };
type View = { kind: 'list' } | { kind: 'pick'; preset?: string } | { kind: 'new'; template: Template; preset?: string } | { kind: 'edit'; id: string } | { kind: 'detail'; id: string; notice?: string };

/* ---------------------------------------------------------------- helpers */

const events: Record<string, [string, string]> = {
  CREATED: ['Dossier créé', 'File created'], EDITED: ['Dossier modifié', 'File edited'], AMENDED: ['Additif publié', 'Amendment published'], PUBLISHED: ['Appel d’offres publié', 'Tender published'],
  CLOSED: ['Remise des offres close, offres ouvertes', 'Offers closed and opened'], CANCELLED: ['Appel d’offres annulé', 'Tender cancelled'], AWARDED: ['Attribution', 'Award'],
  BID_SUBMITTED: ['Offre transmise', 'Offer sent'], BID_UPDATED: ['Offre modifiée', 'Offer updated'], BID_RECORDED: ['Offre saisie par le client', 'Offer recorded by the client'],
  BID_REVIEWED: ['Offre notée', 'Offer marked'], BID_SHORTLISTED: ['Offre présélectionnée', 'Offer shortlisted'], BID_REJECTED: ['Offre écartée', 'Offer set aside'], BID_RESTORED: ['Offre rétablie', 'Offer restored'],
  CONTRACT_CREATED: ['Contrat proposé au prestataire', 'Contract offered to the provider'], INVITATION_ACCEPTED: ['Invitation acceptée', 'Invitation accepted'],
  INVITATION_DECLINED: ['Invitation déclinée', 'Invitation declined'], AWARD_ACCEPTED: ['Contrat accepté par le prestataire', 'Contract accepted by the provider'],
  AWARD_DECLINED: ['Contrat refusé par le prestataire', 'Contract declined by the provider'],
};
const span = (ms: number, lang: Lang) => { const h = Math.abs(ms) / 3600000; return h < 48 ? `${Math.max(1, Math.round(h))} h` : `${Math.round(h / 24)} ${lang === 'fr' ? 'j' : 'd'}`; };
function countdown(deadline: string, t: T, lang: Lang) { const ms = Date.parse(deadline) - Date.now(); return fill(ms >= 0 ? t.inSpan : t.agoSpan, { s: span(ms, lang) }); }
const localInput = (iso: string) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
function tenderState(r: { status: string; deadline: string }, t: T) {
  const late = r.status === 'PUBLISHED' && Date.parse(r.deadline) < Date.now();
  const tone = r.status === 'AWARDED' ? 'green' : r.status === 'CLOSED' || late ? 'amber' : r.status === 'PUBLISHED' ? 'blue' : 'neutral';
  return <span className={`state state-${tone}`}>{late ? t.deadlinePassed : t[r.status as 'DRAFT']}</span>;
}
function providerState(r: Row, t: T) {
  const b = r.my_bid, open = r.status === 'PUBLISHED' && Date.parse(r.deadline) > Date.now();
  const [label, tone] = r.status === 'CANCELLED' ? [t.CANCELLED, 'neutral'] : !b && r.response === 'DECLINED' ? [t.pDeclined, 'neutral'] : !b ? (open ? [t.pToSend, 'amber'] : [t.pNone, 'neutral'])
    : b.status === 'AWARDED' ? [t.pRetained, 'green'] : b.status === 'NOT_RETAINED' ? [t.pNotRetained, 'neutral'] : r.status === 'PUBLISHED' ? [t.pSent, 'blue'] : [t.pAnalysis, 'amber'];
  return <span className={`state state-${tone}`}>{label}</span>;
}
const bidState = (b: Bid, t: T) => {
  const [label, tone] = b.status === 'DECLINED' ? [t.BID_DECLINED, 'red'] : b.status === 'AWARDED' ? [t.BID_AWARDED, 'green'] : b.status === 'SHORTLISTED' ? [t.SHORTLISTED, 'blue'] : b.status === 'REJECTED' ? [t.REJECTED, 'red'] : b.status === 'NOT_RETAINED' ? [t.NOT_RETAINED, 'neutral'] : [t.SUBMITTED, 'neutral'];
  return <span className={`state state-${tone}`}>{label}</span>;
};
const counts = (s: { sections: Section[]; criteria: Criterion[] }, t: T) => fill(t.counts, { s: s.sections.length, f: s.sections.reduce((n, x) => n + x.fields.length, 0), c: s.criteria.length });
const missingRequired = (sections: Section[]) => sections.reduce((n, s) => n + s.fields.filter(f => f.required && isEmpty(f.value)).length, 0);
const markText = (v: number | null | undefined, lang: Lang) => v === null || v === undefined ? '—' : num(v, lang, 1);
const download = (url: string, org: string, name: string, onError: () => void) => fetch(url, { headers: { 'X-Organization-Id': org }, credentials: 'same-origin' })
  .then(r => r.ok ? r.blob() : Promise.reject()).then(b => { const href = URL.createObjectURL(b), a = document.createElement('a'); a.href = href; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(href), 2000); })
  .catch(onError);

function draftFrom(tpl: Template): Draft {
  return { title: '', object: '', serviceType: tpl.serviceType, templateName: tpl.name, siteId: '', budget: '', deadline: `${addDays(todayKey(), 14)}T12:00`, startDate: addDays(todayKey(), 30),
    durationDays: '', paymentTermsDays: '30', sections: clone(tpl.sections).map(s => ({ ...s, fields: s.fields.map(f => ({ ...f, value: null })) })), questions: clone(tpl.questions),
    criteria: clone(tpl.criteria), qualityCriteria: clone(tpl.qualityCriteria), providerIds: [] };
}
function draftOf(d: Tender): Draft {
  return { title: d.title, object: d.object ?? '', serviceType: d.service_type, templateName: d.template_name ?? '', siteId: d.site_id ?? '', budget: d.budget_xaf ? String(d.budget_xaf) : '',
    deadline: localInput(d.deadline), startDate: d.start_date ?? '', durationDays: d.duration_days ? String(d.duration_days) : '', paymentTermsDays: String(d.payment_terms_days),
    sections: clone(d.sections), questions: clone(d.questions), criteria: clone(d.criteria), qualityCriteria: clone(d.quality_criteria), providerIds: d.invitations.map(i => i.provider_id) };
}

/** A long text cut to a few lines, with a toggle. */
function Clamp({ text, t }: { text: string | null | undefined; t: T }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="muted">—</span>;
  const long = text.length > 220;
  return <div className="clamp-wrap"><p className={long && !open ? 'clamp' : 'clamp is-open'}>{text}</p>{long && <button type="button" className="link-button" onClick={() => setOpen(o => !o)}>{open ? t.readLess : t.readMore}</button>}</div>;
}

/* ================================================================== the page */

export function TendersPage({ org, lang, admin, ctx, onOpenContract, presetProvider, initialTenderId }: { org: Org; lang: Lang; admin: boolean; ctx: Ctx; onOpenContract: (id: string) => void;
  presetProvider?: string | null; initialTenderId?: string | null }) {
  const [view, setView] = useState<View>(() => initialTenderId ? { kind: 'detail', id: initialTenderId } : presetProvider && org.kind === 'CLIENT' ? { kind: 'pick', preset: presetProvider } : { kind: 'list' });
  const [tab, setTab] = useState<'tenders' | 'templates'>('tenders');
  const manager = !admin && org.kind === 'CLIENT' && (org.roles ?? []).includes('CLIENT_MANAGER');
  const toList = () => setView({ kind: 'list' });
  if (view.kind === 'detail') return <TenderDetail key={view.id + (view.notice ?? '')} org={org} lang={lang} id={view.id} initialNotice={view.notice} onBack={toList}
    onEdit={() => setView({ kind: 'edit', id: view.id })} onOpenContract={onOpenContract} />;
  if (view.kind === 'new') return <TenderEditor org={org} lang={lang} template={view.template} presetProviders={view.preset ? [view.preset] : undefined} onCancel={toList} onSaved={(id, notice) => setView({ kind: 'detail', id, notice })} />;
  if (view.kind === 'edit') return <TenderEditor org={org} lang={lang} tenderId={view.id} onCancel={() => setView({ kind: 'detail', id: view.id })} onSaved={(id, notice) => setView({ kind: 'detail', id, notice })} />;
  if (view.kind === 'pick') { const preset = view.preset; return <TemplatePicker org={org} lang={lang} onPick={tpl => setView({ kind: 'new', template: tpl, preset })} onCancel={toList} />; }
  return org.kind === 'CLIENT'
    ? <ClientTenders org={org} lang={lang} ctx={ctx} manager={manager} tab={tab} setTab={setTab} onOpen={id => setView({ kind: 'detail', id })} onNew={() => setView({ kind: 'pick' })} onUse={tpl => setView({ kind: 'new', template: tpl })} />
    : <ProviderTenders org={org} lang={lang} ctx={ctx} onOpen={id => setView({ kind: 'detail', id })} />;
}

function useRows(org: Org) {
  const [rows, setRows] = useState<Row[]>([]), [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [attempt, setAttempt] = useState(0);
  useEffect(() => { let a = true; setState('loading'); api('tenders', undefined, org.id).then(r => { if (a) { setRows(r); setState('ready'); } }).catch(() => { if (a) setState('error'); }); return () => { a = false; }; }, [org.id, attempt]);
  return { rows, state, reload: () => setAttempt(n => n + 1) };
}

function ClientTenders({ org, lang, ctx, manager, tab, setTab, onOpen, onNew, onUse }: { org: Org; lang: Lang; ctx: Ctx; manager: boolean; tab: 'tenders' | 'templates'; setTab: (t: 'tenders' | 'templates') => void;
  onOpen: (id: string) => void; onNew: () => void; onUse: (tpl: Template) => void }) {
  const t = lang === 'fr' ? fr : en;
  const { rows, state, reload } = useRows(org);
  const [q, setQ] = useState(''), [status, setStatus] = useState('');
  const needle = q.trim().toLocaleLowerCase(lang);
  const visible = rows.filter(r => (!status || r.status === status) && (!needle || [tenderRef(r.number), r.title, r.site_name, serviceLabel(r.service_type, lang)].join(' ').toLocaleLowerCase(lang).includes(needle)));
  const n = (s: string) => state === 'ready' ? String(rows.filter(r => r.status === s).length) : '–';
  return <section className="tenders">
    <PageHead title={t.title} subtitle={ctx.subtitle}
      cells={[{ label: t.open, value: n('PUBLISHED') }, { label: t.toAnalyse, value: n('CLOSED') }, { label: t.awarded, value: n('AWARDED') }]}
      actions={manager ? <button className="primary" onClick={onNew}><PlusIcon />{t.newTender}</button> : undefined} />
    <div className="toolbar">
      <div className="segmented" role="group" aria-label={t.title}>
        <button type="button" aria-pressed={tab === 'tenders'} onClick={() => setTab('tenders')}>{t.tabTenders}</button>
        <button type="button" aria-pressed={tab === 'templates'} onClick={() => setTab('templates')}>{t.tabTemplates}</button>
      </div>
    </div>
    {tab === 'templates' ? <TemplatesView org={org} lang={lang} manager={manager} onUse={onUse} /> : <>
      <p className="page-intro">{t.intro}</p>
      <div className="filters">
        <label className="filter-search">{t.search}<span className="search-field"><SearchIcon /><input type="search" value={q} placeholder={t.searchHint} onChange={e => setQ(e.target.value)} /></span></label>
        <label>{t.status}<select aria-label={t.status} value={status} onChange={e => setStatus(e.target.value)}><option value="">{t.all}</option>{(['DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED', 'CANCELLED'] as const).map(s => <option key={s} value={s}>{t[s]}</option>)}</select></label>
      </div>
      {state === 'error' ? <Alert retry={reload} retryLabel={t.retry}>{t.loadError}</Alert> : state === 'loading' && !rows.length ? <Skeleton label={t.loading} />
        : !rows.length ? <div className="sheet"><Empty icon={<TenderIcon />} title={t.empty} action={manager ? <button className="primary" onClick={onNew}><PlusIcon />{t.newTender}</button> : undefined}>{t.emptyText}</Empty></div>
        : !visible.length ? <Empty icon={<TenderIcon />}>{t.noMatch}</Empty>
        : <div className="table-card"><table className="audit-table tender-table">
            <thead><tr><th scope="col" className="col-ref">{t.number}</th><th scope="col">{t.object}</th><th scope="col" className="col-deadline">{t.deadline}</th><th scope="col" className="col-offers">{t.offers}</th>
              <th scope="col" className="col-amount num">{t.best}</th><th scope="col" className="col-status">{t.status}</th></tr></thead>
            <tbody>{visible.map(r => <tr key={r.id} className="clickable" onClick={() => onOpen(r.id)}>
              <td data-label={t.number}><span className="work-ref">{tenderRef(r.number)}</span></td>
              <td data-label={t.object} className="work-main-cell"><span className="work-head"><button type="button" className="work-title" title={r.title} onClick={e => { e.stopPropagation(); onOpen(r.id); }}>{r.title}</button></span>
                <span className="work-meta">{[serviceLabel(r.service_type, lang), r.site_name].filter(Boolean).join(' · ')}</span></td>
              <td data-label={t.deadline}><span className="slot-day">{dateText(r.deadline, lang)}</span>{r.status === 'PUBLISHED' && <span className="slot-hours">{countdown(r.deadline, t, lang)}</span>}</td>
              <td data-label={t.offers}><span className="offers-count" title={r.status === 'PUBLISHED' ? t.sealedText : undefined}>{r.status === 'PUBLISHED' && <LockIcon />}{r.bids}<small> / {r.invited}</small></span></td>
              <td data-label={t.best} className="num">{r.best_amount ? fcfa(r.best_amount, lang) : '—'}</td>
              <td data-label={t.status}><span className="work-status">{tenderState(r, t)}</span>{r.awarded_to && <span className="work-meta" title={r.awarded_to}>{r.awarded_to}</span>}</td>
            </tr>)}</tbody></table></div>}
    </>}
  </section>;
}

function ProviderTenders({ org, lang, ctx, onOpen }: { org: Org; lang: Lang; ctx: Ctx; onOpen: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const { rows, state, reload } = useRows(org);
  const ready = state === 'ready';
  const toAnswer = rows.filter(r => !r.my_bid && r.status === 'PUBLISHED' && Date.parse(r.deadline) > Date.now()).length;
  return <section className="tenders">
    <PageHead title={t.title} subtitle={ctx.subtitle}
      cells={[{ label: t.toAnswer, value: ready ? String(toAnswer) : '–' }, { label: t.sent, value: ready ? String(rows.filter(r => r.my_bid).length) : '–' }, { label: t.retained, value: ready ? String(rows.filter(r => r.my_bid?.status === 'AWARDED').length) : '–' }]} />
    <p className="page-intro">{t.providerIntro}</p>
    {state === 'error' ? <Alert retry={reload} retryLabel={t.retry}>{t.loadError}</Alert> : state === 'loading' && !rows.length ? <Skeleton label={t.loading} />
      : !rows.length ? <div className="sheet"><Empty icon={<TenderIcon />} title={t.emptyProvider}>{t.emptyProviderText}</Empty></div>
      : <div className="table-card"><table className="audit-table tender-table">
          <thead><tr><th scope="col" className="col-ref">{t.number}</th><th scope="col">{t.object}</th><th scope="col" className="col-deadline">{t.deadline}</th><th scope="col" className="col-mine">{t.myOffer}</th><th scope="col" className="col-status">{t.result}</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id} className="clickable" onClick={() => onOpen(r.id)}>
            <td data-label={t.number}><span className="work-ref">{tenderRef(r.number)}</span></td>
            <td data-label={t.object} className="work-main-cell"><span className="work-head"><button type="button" className="work-title" title={r.title} onClick={e => { e.stopPropagation(); onOpen(r.id); }}>{r.title}</button></span>
              <span className="work-meta">{[r.client_name, serviceLabel(r.service_type, lang), r.site_name].filter(Boolean).join(' · ')}</span></td>
            <td data-label={t.deadline}><span className="slot-day">{dateText(r.deadline, lang)}</span>{r.status === 'PUBLISHED' && <span className="slot-hours">{countdown(r.deadline, t, lang)}</span>}</td>
            <td data-label={t.myOffer}>{r.my_bid ? <><span className="slot-day">{fcfa(r.my_bid.amount_xaf, lang)}</span><span className="slot-hours">{fill(t.sentOn, { d: dateText(r.my_bid.updated_at ?? r.my_bid.submitted_at, lang) })}</span></> : <span className="muted">{t.notSent}</span>}</td>
            <td data-label={t.result}>{providerState(r, t)}</td>
          </tr>)}</tbody></table></div>}
  </section>;
}

/* ========================================================== templates */

function useTemplates(org: Org) {
  const [data, setData] = useState<{ library: Template[]; own: Template[] } | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => { let a = true; setFailed(false); api('tender-templates', undefined, org.id).then(r => { if (a) setData(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [org.id, attempt]);
  return { data, failed, reload: () => setAttempt(n => n + 1) };
}

function TemplateCards({ list, lang, t, actions }: { list: Template[]; lang: Lang; t: T; actions: (tpl: Template) => React.ReactNode }) {
  return <ul className="tpl-grid">{list.map(tpl => <li key={tpl.id} className="tpl-card">
    <span className="tpl-type">{serviceLabel(tpl.serviceType, lang)}</span>
    <h3>{lang === 'en' && tpl.nameEn ? tpl.nameEn : tpl.name}</h3>
    {tpl.description && <p className="tpl-desc">{tpl.description}</p>}
    <p className="tpl-meta">{counts(tpl, t)}</p>
    {!tpl.library && (tpl.source || tpl.updatedAt) && <p className="tpl-meta">{[tpl.source, tpl.updatedAt ? fill(t.updated, { d: dateText(tpl.updatedAt, lang) }) : ''].filter(Boolean).join(' · ')}</p>}
    <div className="tpl-actions">{actions(tpl)}</div>
  </li>)}</ul>;
}

function TemplatePicker({ org, lang, onPick, onCancel }: { org: Org; lang: Lang; onPick: (tpl: Template) => void; onCancel: () => void }) {
  const t = lang === 'fr' ? fr : en;
  const { data, failed, reload } = useTemplates(org);
  return <section className="tenders">
    <button className="back-link" onClick={onCancel}><BackIcon />{t.back}</button>
    <PageHead title={t.pickTitle} subtitle={t.pickIntro} />
    {failed ? <Alert retry={reload} retryLabel={t.retry}>{t.tplLoadError}</Alert> : !data ? <Skeleton label={t.loading} /> : <div className="stack">
      {data.own.length > 0 && <Sheet id="own" title={t.ownTemplates} meta={String(data.own.length)}><TemplateCards list={data.own} lang={lang} t={t} actions={tpl => <button className="primary small" onClick={() => onPick(tpl)}>{t.use}</button>} /></Sheet>}
      <Sheet id="lib" title={t.library} meta={t.libraryMeta}><TemplateCards list={data.library} lang={lang} t={t} actions={tpl => <button className="primary small" onClick={() => onPick(tpl)}>{t.use}</button>} /></Sheet>
    </div>}
  </section>;
}

function TemplatesView({ org, lang, manager, onUse }: { org: Org; lang: Lang; manager: boolean; onUse: (tpl: Template) => void }) {
  const t = lang === 'fr' ? fr : en;
  const { data, failed, reload } = useTemplates(org);
  const [edit, setEdit] = useState<{ tpl: Template; id?: string; check?: boolean } | null>(null), [extracting, setExtracting] = useState(false);
  const [notice, setNotice] = useState(''), [error, setError] = useState('');
  if (edit) return <TemplateEditor org={org} lang={lang} template={edit.tpl} id={edit.id} check={edit.check} onCancel={() => setEdit(null)} onSaved={() => { setEdit(null); setNotice(t.tplSaved); reload(); }} />;
  if (extracting && data) return <ExtractPanel lang={lang} library={data.library} onCancel={() => setExtracting(false)} onOpen={tpl => { setExtracting(false); setEdit({ tpl, check: true }); }} />;
  const blank: Template = { id: '', serviceType: 'OTHER', name: t.tplNewName, description: '', source: null, sections: [], questions: [], criteria: [], qualityCriteria: [], library: false };
  const archive = (tpl: Template) => { setError(''); api(`tender-templates/${tpl.id}/archive`, {}, org.id).then(() => { setNotice(t.tplArchived); reload(); }).catch(e => setError(say(e, lang))); };
  return <div className="stack">
    <p className="page-intro">{t.tplIntro}</p>
    <div className="toolbar">
      {manager && <div className="toolbar-actions"><button className="secondary" disabled={!data} onClick={() => setExtracting(true)}><ScanIcon />{t.extract}</button>
        <button className="secondary" disabled={!data} onClick={() => setEdit({ tpl: { ...blank, ...(data ? { serviceType: 'OTHER', sections: clone(data.library.find(l => l.serviceType === 'OTHER')?.sections ?? []), questions: clone(data.library.find(l => l.serviceType === 'OTHER')?.questions ?? []), criteria: clone(data.library.find(l => l.serviceType === 'OTHER')?.criteria ?? []), qualityCriteria: clone(data.library.find(l => l.serviceType === 'OTHER')?.qualityCriteria ?? []) } : {}) } })}><PlusIcon />{t.blank}</button></div>}
    </div>
    {notice && <Alert kind="success">{notice}</Alert>}
    {error && <Alert>{error}</Alert>}
    {failed ? <Alert retry={reload} retryLabel={t.retry}>{t.tplLoadError}</Alert> : !data ? <Skeleton label={t.loading} /> : <>
      <Sheet id="own" title={t.ownTemplates} meta={String(data.own.length)}>
        {data.own.length ? <TemplateCards list={data.own} lang={lang} t={t} actions={tpl => <>
          {manager && <button className="primary small" onClick={() => onUse(tpl)}>{t.use}</button>}
          {manager && <button className="secondary small" onClick={() => setEdit({ tpl: clone(tpl), id: tpl.id })}><PenIcon />{t.editTpl}</button>}
          {manager && <button className="link-button" onClick={() => archive(tpl)}>{t.archive}</button>}
        </>} /> : <p className="muted">{t.noOwn}</p>}
      </Sheet>
      <Sheet id="lib" title={t.library} meta={t.libraryMeta}>
        <TemplateCards list={data.library} lang={lang} t={t} actions={tpl => manager ? <>
          <button className="primary small" onClick={() => onUse(tpl)}>{t.use}</button>
          <button className="secondary small" onClick={() => setEdit({ tpl: { ...clone(tpl), id: '', library: false, name: fill(t.tplCopy, { n: tpl.name }), source: `${tpl.source ?? 'Bibliothèque TRACEOPS'} — ${tpl.name}` } })}>{t.customise}</button>
        </> : null} />
      </Sheet>
    </>}
  </div>;
}

function TemplateEditor({ org, lang, template, id, check, onCancel, onSaved }: { org: Org; lang: Lang; template: Template; id?: string; check?: boolean; onCancel: () => void; onSaved: () => void }) {
  const t = lang === 'fr' ? fr : en;
  const [tpl, setTpl] = useState<Template>(() => clone(template)), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const set = (patch: Partial<Template>) => setTpl(x => ({ ...x, ...patch }));
  const save = () => {
    setBusy(true); setError('');
    const body = { name: tpl.name, serviceType: tpl.serviceType, description: tpl.description || null, source: tpl.source || null, sections: cleanForm(tpl.sections, false), questions: cleanFieldsList(tpl.questions, false),
      criteria: tpl.criteria.map(c => ({ ...c, label: c.label.trim() })), qualityCriteria: tpl.qualityCriteria.map(q => ({ ...q, label: q.label.trim() })) };
    api(id ? `tender-templates/${id}` : 'tender-templates', body, org.id).then(onSaved).catch(e => { setError(say(e, lang)); window.scrollTo({ top: 0, behavior: 'smooth' }); }).finally(() => setBusy(false));
  };
  return <div className="stack template-editor">
    <button className="back-link" onClick={onCancel}><BackIcon />{t.tabTemplates}</button>
    {check && <p className="sheet-note info-note"><ScanIcon />{t.exCheck}</p>}
    {error && <Alert>{error}</Alert>}
    <Sheet id="tpl" title={t.tplEditor}>
      <div className="form-grid">
        <label className="span-2">{t.tplName}<input value={tpl.name} maxLength={160} required onChange={e => set({ name: e.target.value })} /></label>
        <label>{t.tType}<select value={tpl.serviceType} onChange={e => set({ serviceType: e.target.value as ServiceType })}>{(Object.keys(serviceTypes) as ServiceType[]).map(k => <option key={k} value={k}>{serviceLabel(k, lang)}</option>)}</select></label>
        <label>{t.source}<input value={tpl.source ?? ''} maxLength={200} onChange={e => set({ source: e.target.value })} /></label>
        <label className="span-2">{t.tplDescription}<textarea rows={2} maxLength={600} value={tpl.description ?? ''} onChange={e => set({ description: e.target.value })} /></label>
      </div>
    </Sheet>
    <Sheet id="tpl-sections" title={t.tplSections} meta={String(tpl.sections.length)}><SectionsEditor sections={tpl.sections} withValues={false} lang={lang} onChange={sections => set({ sections })} /></Sheet>
    <Sheet id="tpl-reply" title={t.reply}><p className="sheet-intro">{t.replyIntro}</p><QuestionsEditor questions={tpl.questions} lang={lang} onChange={questions => set({ questions })} /></Sheet>
    <Sheet id="tpl-criteria" title={t.criteria}><p className="sheet-intro">{t.criteriaIntro}</p><CriteriaEditor criteria={tpl.criteria} lang={lang} onChange={criteria => set({ criteria })} /></Sheet>
    <Sheet id="tpl-quality" title={t.quality}><p className="sheet-intro">{t.qualityIntro}</p><QualityEditor items={tpl.qualityCriteria} lang={lang} onChange={qualityCriteria => set({ qualityCriteria })} /></Sheet>
    <div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>{t.cancel}</button><button type="button" className="primary" disabled={busy || !tpl.name.trim()} onClick={save}>{busy ? t.loading : t.tplSave}</button></div>
  </div>;
}

function ExtractPanel({ lang, library, onCancel, onOpen }: { lang: Lang; library: Template[]; onCancel: () => void; onOpen: (tpl: Template) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [text, setText] = useState(''), [file, setFile] = useState(''), [result, setResult] = useState<ReturnType<typeof extractTemplate> | null>(null), [type, setType] = useState<ServiceType>('CLEANING');
  const open = () => {
    if (!result) return;
    const base = library.find(l => l.serviceType === type) ?? library[library.length - 1]!;
    const total = result.criteria.reduce((s, c) => s + c.weight, 0);
    onOpen({ id: '', serviceType: type, name: result.name || base.name, description: null, source: `${t.exSource}${file ? ` (${file})` : ''}`, sections: result.sections, questions: clone(base.questions),
      criteria: result.criteria.length && total === 100 ? result.criteria : clone(base.criteria), qualityCriteria: clone(base.qualityCriteria), library: false });
  };
  return <div className="stack">
    <button className="back-link" onClick={onCancel}><BackIcon />{t.tabTemplates}</button>
    <Sheet id="extract" title={t.exTitle}>
      <p className="sheet-intro">{t.exIntro}</p>
      <label>{t.exText}<textarea className="extract-text" rows={14} value={text} onChange={e => { setText(e.target.value); setResult(null); }} /></label>
      <div className="toolbar-actions extract-actions">
        <label className="upload secondary small"><input type="file" accept=".txt,.md,.csv,text/plain" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; setFile(f.name); f.text().then(v => { setText(v.slice(0, 200000)); setResult(null); }).catch(() => undefined); }} />{t.exFile}</label>
        <button type="button" className="link-button" onClick={() => { setText(sampleFile); setFile(''); setResult(null); }}>{t.exSample}</button>
        <button type="button" className="primary" disabled={!text.trim()} onClick={() => setResult(extractTemplate(text, lang))}><ScanIcon />{t.exRun}</button>
      </div>
      {result && (result.sections.length ? <div className="extract-result">
        <p className="sheet-note"><CheckIcon />{fill(t.exFound, { s: result.found.sections, f: result.found.fields, c: result.found.criteria })}</p>
        <ol className="extract-list">{result.sections.map(s => <li key={s.key}><strong>{s.title}</strong>
          <ul>{s.fields.map(f => <li key={f.key}><span>{f.label}</span><span className="badge">{fieldTypes[f.type][lang === 'fr' ? 0 : 1]}{f.unit ? ` · ${f.unit}` : ''}</span>{f.options?.length ? <span className="muted">{f.options.join(' · ')}</span> : null}</li>)}</ul></li>)}</ol>
        {result.criteria.length > 0 && <p className="extract-criteria"><strong>{t.exCriteria} : </strong>{result.criteria.map(c => `${c.label} ${c.weight} %`).join(' · ')}</p>}
        <div className="extract-open"><label>{t.exType}<select value={type} onChange={e => setType(e.target.value as ServiceType)}>{(Object.keys(serviceTypes) as ServiceType[]).map(k => <option key={k} value={k}>{serviceLabel(k, lang)}</option>)}</select></label>
          <button type="button" className="primary" onClick={open}>{t.exOpen}</button></div>
      </div> : <Alert>{t.exNothing}</Alert>)}
    </Sheet>
  </div>;
}

/* ============================================================== the editor */

function TenderEditor({ org, lang, template, tenderId, presetProviders, onCancel, onSaved }: { org: Org; lang: Lang; template?: Template; tenderId?: string; presetProviders?: string[]; onCancel: () => void; onSaved: (id: string, notice: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [draft, setDraft] = useState<Draft | null>(template ? { ...draftFrom(template), providerIds: presetProviders ?? [] } : null), [status, setStatus] = useState<Tender['status']>('DRAFT'), [number, setNumber] = useState(0);
  const [savedId, setSavedId] = useState<string | undefined>(tenderId);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]), [providers, setProviders] = useState<DirectoryProvider[]>([]);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [reason, setReason] = useState(''), [q, setQ] = useState(''), [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    Promise.all([api('sites', undefined, org.id), api('organization/directory', undefined, org.id)]).then(([s, p]) => { setSites(s); setProviders(p); }).catch(() => undefined);
    if (tenderId) api(`tenders/${tenderId}`, undefined, org.id).then((d: Tender) => { setDraft(draftOf(d)); setStatus(d.status); setNumber(d.number); }).catch(() => setLoadFailed(true));
  }, [org.id, tenderId]);
  if (loadFailed) return <Alert>{t.loadError}</Alert>;
  if (!draft) return <Skeleton label={t.loading} />;
  const set = (patch: Partial<Draft>) => setDraft(d => d && { ...d, ...patch });
  const published = status === 'PUBLISHED';
  const total = draft.criteria.reduce((s, c) => s + c.weight, 0), missing = missingRequired(draft.sections);
  const nowLocal = localInput(new Date().toISOString());
  const checks = [
    { ok: draft.title.trim().length > 0, label: t.ckTitle },
    { ok: Boolean(draft.deadline) && draft.deadline > nowLocal, label: t.ckDeadline },
    { ok: draft.providerIds.length > 0, label: fill(t.ckProviders, { n: draft.providerIds.length }) },
    { ok: total === 100, label: fill(t.ckCriteria, { n: total }) },
    { ok: draft.qualityCriteria.length > 0, label: fill(t.ckQuality, { n: draft.qualityCriteria.length }) },
    { ok: missing === 0, label: missing ? fill(t.ckRequired, { n: missing }) : t.ckRequiredOk },
  ];
  const needle = q.trim().toLocaleLowerCase(lang);
  const shown = providers.filter(p => !needle || [p.name, p.city, p.services].filter(Boolean).join(' ').toLocaleLowerCase(lang).includes(needle))
    .sort((a, b) => Number(draft.providerIds.includes(b.id)) - Number(draft.providerIds.includes(a.id)) || Number(b.site_ids.length > 0) - Number(a.site_ids.length > 0) || a.name.localeCompare(b.name));
  const body = () => ({ title: draft.title, object: draft.object || null, serviceType: draft.serviceType, templateName: draft.templateName || null, siteId: draft.siteId || null,
    budget: draft.budget ? Number(draft.budget) : null, deadline: draft.deadline, startDate: draft.startDate || null, durationDays: draft.durationDays ? Number(draft.durationDays) : null,
    paymentTermsDays: draft.paymentTermsDays === '' ? 30 : Number(draft.paymentTermsDays), sections: cleanForm(draft.sections, true), questions: cleanFieldsList(draft.questions, false),
    criteria: draft.criteria.map(c => ({ ...c, label: c.label.trim() })), qualityCriteria: draft.qualityCriteria.map(x => ({ ...x, label: x.label.trim() })), providerIds: draft.providerIds,
    ...(published ? { reason } : {}) });
  const save = async (publish: boolean) => {
    setBusy(true); setError('');
    try {
      let id = savedId;
      if (id) await api(`tenders/${id}`, body(), org.id);
      else { id = (await api('tenders', body(), org.id)).id as string; setSavedId(id); }
      if (publish && !published) await api(`tenders/${id}/publish`, {}, org.id);
      onSaved(id!, published ? t.amended : publish ? t.publishedOk : t.saved);
    } catch (e) { setError(say(e, lang)); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setBusy(false); }
  };
  return <section className="tender-editor">
    <button className="back-link" onClick={onCancel}><BackIcon />{tenderId ? t.backToFile : t.back}</button>
    <PageHead title={tenderId ? fill(t.editTitle, { n: tenderRef(number) }) : t.pickTitle} subtitle={[serviceLabel(draft.serviceType, lang), draft.templateName].filter(Boolean).join(' · ')}
      actions={<div className="toolbar-actions">
        {!published && <button className="secondary" disabled={busy || !draft.title.trim()} onClick={() => void save(false)}>{t.saveDraft}</button>}
        <button className="primary" disabled={busy || (published ? !reason.trim() : !checks.every(c => c.ok))} onClick={() => void save(true)}>{busy ? t.loading : published ? t.publishAmend : t.publish}</button>
      </div>} />
    {error && <Alert>{error}</Alert>}
    {published && <div className="sheet amend-card"><div className="sheet-body"><p className="board-note is-alert"><AlertIcon />{t.amendTitle}</p><p className="panel-desc">{t.amendText}</p>
      <label>{t.amendReason}<textarea rows={2} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label></div></div>}
    <div className="editor-grid">
      <div className="editor-main">
        <Sheet id="general" title={`1. ${t.general}`}>
          <div className="form-grid">
            <label className="span-2">{t.tTitle}<input value={draft.title} maxLength={200} required onChange={e => set({ title: e.target.value })} /></label>
            <label className="span-2">{t.tObject}<textarea rows={3} maxLength={4000} value={draft.object} onChange={e => set({ object: e.target.value })} /></label>
            <label>{t.tType}<select value={draft.serviceType} onChange={e => set({ serviceType: e.target.value as ServiceType })}>{(Object.keys(serviceTypes) as ServiceType[]).map(k => <option key={k} value={k}>{serviceLabel(k, lang)}</option>)}</select></label>
            <label>{t.tSite}<select value={draft.siteId} onChange={e => set({ siteId: e.target.value })}><option value="">{t.noSite}</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>{t.tDeadline}<input type="datetime-local" required value={draft.deadline} onChange={e => set({ deadline: e.target.value })} /></label>
            <label>{t.tBudget}<span className="unit-input"><input type="number" min={1} step={1} value={draft.budget} onChange={e => set({ budget: e.target.value })} /><span className="unit">FCFA</span></span><small>{t.tBudgetHelp}</small></label>
            <label>{t.tStart}<input type="date" value={draft.startDate} onChange={e => set({ startDate: e.target.value })} /></label>
            <label>{t.tDuration}<span className="unit-input"><input type="number" min={1} max={3650} step={1} value={draft.durationDays} onChange={e => set({ durationDays: e.target.value })} /><span className="unit">{t.days}</span></span></label>
            <label>{t.tTerms}<span className="unit-input"><input type="number" min={0} max={180} step={1} value={draft.paymentTermsDays} onChange={e => set({ paymentTermsDays: e.target.value })} /><span className="unit">{t.days}</span></span><small>{t.tTermsHelp}</small></label>
          </div>
        </Sheet>
        <Sheet id="spec" title={`2. ${t.spec}`} meta={fill(t.counts, { s: draft.sections.length, f: draft.sections.reduce((n, s) => n + s.fields.length, 0), c: draft.criteria.length }).split(' · ').slice(0, 2).join(' · ')}>
          <p className="sheet-intro">{t.specIntro}</p>
          <SectionsEditor sections={draft.sections} withValues lang={lang} onChange={sections => set({ sections })} />
        </Sheet>
        <Sheet id="reply" title={`3. ${t.reply}`}><p className="sheet-intro">{t.replyIntro}</p><QuestionsEditor questions={draft.questions} lang={lang} onChange={questions => set({ questions })} /></Sheet>
        <Sheet id="criteria" title={`4. ${t.criteria}`}><p className="sheet-intro">{t.criteriaIntro}</p><CriteriaEditor criteria={draft.criteria} lang={lang} onChange={criteria => set({ criteria })} /></Sheet>
        <Sheet id="quality" title={`5. ${t.quality}`}><p className="sheet-intro">{t.qualityIntro}</p><QualityEditor items={draft.qualityCriteria} lang={lang} onChange={qualityCriteria => set({ qualityCriteria })} /></Sheet>
        <Sheet id="providers" title={`6. ${t.consulted}`} meta={fill(t.consultedMeta, { n: draft.providerIds.length })}>
          <label className="location-search">{t.providerSearch}<span className="search-field"><SearchIcon /><input type="search" value={q} onChange={e => setQ(e.target.value)} /></span></label>
          {shown.length ? <ul className="checks provider-picks">{shown.map(p => {
            const locked = published && draft.providerIds.includes(p.id);
            return <li key={p.id}><label className="check"><input type="checkbox" checked={draft.providerIds.includes(p.id)} disabled={locked}
              onChange={e => set({ providerIds: e.target.checked ? [...draft.providerIds, p.id] : draft.providerIds.filter(x => x !== p.id) })} />
              <span><strong>{p.name}{p.site_ids.length > 0 && <span className="state state-blue chip-inline">{t.linkedChip}</span>}</strong><span className="muted">{[p.city, p.services].filter(Boolean).join(' · ')}</span></span></label></li>;
          })}</ul> : <p className="muted">{t.noProvider}</p>}
        </Sheet>
      </div>
      <aside className="editor-side">
        <div className="sheet checklist-card"><div className="sheet-head"><h2>{t.beforePublish}</h2></div><div className="sheet-body">
          <ul className="checklist">{checks.map(c => <li key={c.label} className={c.ok ? 'is-ok' : 'is-missing'}>{c.ok ? <CheckIcon /> : <CloseIcon />}<span>{c.label}</span></li>)}</ul>
          <p className="muted checklist-note"><LockIcon />{t.sealedNote}</p>
        </div></div>
      </aside>
    </div>
  </section>;
}

/* ============================================================== the detail */

function stagesOf(d: Tender, t: T, lang: Lang, manager: boolean): Visa[] {
  const last = (a: string) => [...d.events].filter(e => e.action === a).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
  const created = last('CREATED'), published = last('PUBLISHED'), closed = last('CLOSED'), awarded = last('AWARDED');
  const at = (iso?: string | null) => iso ? dateText(iso, lang) : undefined;
  const shortlisted = d.bids.filter(b => b.status === 'SHORTLISTED').length;
  const winners = d.bids.filter(b => b.status === 'AWARDED').map(b => b.provider_name);
  return [
    { key: 'prep', step: t.sPrep, state: 'signed', name: created?.actor ?? d.created_by_name, date: at(created?.created_at ?? d.created_at) },
    d.published_at ? { key: 'launch', step: t.sLaunch, state: 'signed', name: published?.actor ?? d.created_by_name, date: at(d.published_at), note: fill(t.invitedN, { n: d.invitations.length }) }
      : { key: 'launch', step: t.sLaunch, state: d.status === 'CANCELLED' ? 'future' : manager ? 'mine' : 'waiting', name: manager ? t.yourTurn : t.toPublish },
    d.closed_at ? { key: 'offers', step: t.sOffers, state: 'signed', name: fill(t.receivedN, { n: d.bids.length }), date: at(d.closed_at), note: closed?.actor }
      : d.status === 'PUBLISHED' ? { key: 'offers', step: t.sOffers, state: 'waiting', name: fill(t.receivedN, { n: d.bids.length }), note: fill(t.untilD, { d: dateText(d.deadline, lang, 'time') }) }
      : { key: 'offers', step: t.sOffers, state: 'future' },
    d.awarded_at ? { key: 'analysis', step: t.sAnalysis, state: 'signed', name: awarded?.actor ?? '—', date: at(d.awarded_at) }
      : d.status === 'CLOSED' ? { key: 'analysis', step: t.sAnalysis, state: manager ? 'mine' : 'waiting', name: manager ? t.yourTurn : t.comparing, note: shortlisted ? fill(t.shortlistedN, { n: shortlisted }) : undefined }
      : { key: 'analysis', step: t.sAnalysis, state: 'future' },
    d.status === 'AWARDED' ? { key: 'award', step: t.sAward, state: d.contracts.some(c => c.status === 'PROPOSED') ? 'waiting' : 'signed', name: winners.join(', ') || '—', date: at(d.awarded_at),
        note: d.contracts.some(c => c.status === 'PROPOSED') ? t.awaitingAcceptance : d.contracts.some(c => ['ACTIVE', 'CLOSED'].includes(c.status)) ? t.acceptedByProvider : undefined }
      : d.status === 'CANCELLED' ? { key: 'award', step: t.sAward, state: 'refused', name: t.cancelled, date: at(last('CANCELLED')?.created_at), note: d.decision_note ?? undefined }
      : { key: 'award', step: t.sAward, state: 'future' },
  ];
}
function providerStages(d: Tender, t: T, lang: Lang): Visa[] {
  const mine = d.bids[0], open = d.actions.includes('BID');
  return [
    { key: 'launch', step: t.pBand1, state: 'signed', name: d.client_name, date: d.published_at ? dateText(d.published_at, lang) : undefined },
    mine ? { key: 'bid', step: t.pBand2, state: 'signed', name: fcfa(mine.amount_xaf, lang), date: dateText(mine.updated_at ?? mine.submitted_at, lang) }
      : { key: 'bid', step: t.pBand2, state: open ? 'mine' : 'future', name: open ? t.yourTurn : t.pNone, note: open ? fill(t.toSendBefore, { d: dateText(d.deadline, lang, 'time') }) : undefined },
    { key: 'analysis', step: t.pBand3, state: d.status === 'AWARDED' ? 'signed' : d.status === 'CLOSED' ? 'waiting' : 'future', name: d.status === 'CLOSED' ? d.client_name : undefined, date: d.closed_at ? dateText(d.closed_at, lang) : undefined },
    d.status === 'AWARDED' ? { key: 'result', step: t.pBand4, state: mine?.status === 'AWARDED' ? 'signed' : 'refused', name: mine?.status === 'AWARDED' ? t.pRetained : t.pNotRetained, date: d.awarded_at ? dateText(d.awarded_at, lang) : undefined }
      : d.status === 'CANCELLED' ? { key: 'result', step: t.pBand4, state: 'refused', name: t.cancelled } : { key: 'result', step: t.pBand4, state: 'future' },
  ];
}

function TenderDetail({ org, lang, id, initialNotice, onBack, onEdit, onOpenContract }: { org: Org; lang: Lang; id: string; initialNotice?: string; onBack: () => void; onEdit: () => void; onOpenContract: (id: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [d, setD] = useState<Tender | null>(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(initialNotice ?? '');
  const [panel, setPanel] = useState<string>(''), [providers, setProviders] = useState<DirectoryProvider[]>([]);
  useEffect(() => { let a = true; setFailed(false); api(`tenders/${id}`, undefined, org.id).then(r => { if (a) setD(r); }).catch(() => { if (a) setFailed(true); }); return () => { a = false; }; }, [id, org.id, attempt]);
  const client = org.kind === 'CLIENT';
  const scores = useMemo(() => d ? scoreBids(d.bids, d.criteria) : new Map<string, Score>(), [d]);
  if (failed) return <><button className="back-link" onClick={onBack}><BackIcon />{t.back}</button><Alert retry={() => setAttempt(n => n + 1)} retryLabel={t.retry}>{t.loadError}</Alert></>;
  if (!d) return <Skeleton label={t.loading} />;
  const can = (a: string) => d.actions.includes(a);
  const manager = can('EDIT') || can('REVIEW') || can('RECORD_BID') || can('CANCEL');
  const run = (path: string, body: unknown, done?: string) => {
    setBusy(true); setError(''); setNotice('');
    return api(`tenders/${id}/${path}`, body, org.id).then(() => { setPanel(''); if (done) setNotice(done); setAttempt(n => n + 1); }).catch(e => setError(say(e, lang))).finally(() => setBusy(false));
  };
  const pdf = () => download(`/api/v1/tenders/${id}/document.pdf?lang=${lang}`, org.id, `TRACEOPS-${tenderRef(d.number)}.pdf`, () => setError(say(new ApiError('error'), lang)));
  const saveTemplate = () => {
    setBusy(true); setError('');
    api('tender-templates', { name: d.title.slice(0, 160), serviceType: d.service_type, description: d.object?.slice(0, 600) ?? null, source: `${lang === 'fr' ? 'Créé à partir de' : 'Created from'} ${tenderRef(d.number)}`,
      sections: cleanForm(d.sections, false), questions: d.questions, criteria: d.criteria, qualityCriteria: d.quality_criteria }, org.id)
      .then(() => setNotice(t.templateSaved)).catch(e => setError(say(e, lang))).finally(() => setBusy(false));
  };
  const openRecord = () => { setPanel('record'); if (!providers.length) api('organization/directory', undefined, org.id).then(setProviders).catch(() => undefined); };
  const late = d.status === 'PUBLISHED' && Date.parse(d.deadline) < Date.now();
  const mine = client ? undefined : d.bids[0];
  const visible = d.bids.filter(b => !b.sealed);
  const facts = client
    ? [{ label: t.deadline, value: <>{dateText(d.deadline, lang, 'time')}{d.status === 'PUBLISHED' && <small className="cart-sub">{countdown(d.deadline, t, lang)}</small>}</> },
      { label: t.received, value: fill(t.receivedOf, { a: d.bids.length, n: d.invitations.length }) },
      { label: t.budget, value: d.budget_xaf ? fcfa(d.budget_xaf, lang) : '—' },
      { label: t.terms, value: fill(t.termsValue, { n: d.payment_terms_days }) },
      { label: t.status, value: tenderState(d, t) }]
    : [{ label: t.deadline, value: <>{dateText(d.deadline, lang, 'time')}{d.status === 'PUBLISHED' && <small className="cart-sub">{countdown(d.deadline, t, lang)}</small>}</> },
      { label: t.start, value: [d.start_date ? dateText(d.start_date, lang) : '', d.duration_days ? `${d.duration_days} ${t.days}` : ''].filter(Boolean).join(' · ') || '—' },
      { label: t.terms, value: fill(t.termsValue, { n: d.payment_terms_days }) },
      { label: t.myOffer, value: mine ? fill(t.sentOn, { d: dateText(mine.updated_at ?? mine.submitted_at, lang) }) : t.notSent }];

  return <section className="detail tender-detail">
    <button className="back-link" onClick={onBack}><BackIcon />{t.back}</button>
    <PageHead title={d.title} subtitle={[tenderRef(d.number), serviceLabel(d.service_type, lang), d.site_name, client ? '' : d.client_name].filter(Boolean).join(' · ')} cells={facts}
      actions={<div className="toolbar-actions">
        <button className="secondary" onClick={pdf}><DownloadIcon />{t.pdf}</button>
        {can('EDIT') && <button className="secondary" onClick={onEdit}><PenIcon />{t.edit}</button>}
        {client && manager && d.status !== 'DRAFT' && <button className="secondary" disabled={busy} onClick={saveTemplate}>{t.saveAsTemplate}</button>}
      </div>} />
    <div className="visa-wrap"><VisaBand visas={client ? stagesOf(d, t, lang, manager) : providerStages(d, t, lang)} label={t.history} /></div>
    {error && <Alert>{error}</Alert>}
    {notice && <Alert kind="success">{notice}</Alert>}

    {client ? <>
      <Sheet id="next" title={t.next} className={['DRAFT', 'CLOSED'].includes(d.status) || late ? 'sheet-action' : undefined}>
        <p className="next-text">{d.status === 'DRAFT' ? t.nextDraft : d.status === 'PUBLISHED' ? (late ? t.nextPublishedLate : fill(t.nextPublished, { a: d.bids.length, n: d.invitations.length }))
          : d.status === 'CLOSED' ? t.nextClosed : d.status === 'AWARDED' ? (d.contracts.some(c => c.status === 'PROPOSED') ? t.nextAwardedPending : t.nextAwarded) : `${t.nextCancelled}${d.decision_note ? ` ${t.reason} : ${d.decision_note}` : ''}`}</p>
        <div className="toolbar-actions">
          {can('PUBLISH') && <button className="primary" disabled={busy} onClick={() => void run('publish', {}, t.publishedOk)}>{t.publish}</button>}
          {can('RECORD_BID') && panel !== 'record' && <button className="secondary" disabled={busy} onClick={openRecord}><PlusIcon />{t.recordBid}</button>}
          {can('CLOSE') && <button className={late ? 'primary' : 'secondary'} disabled={busy} onClick={() => void run('close', {})}><LockIcon />{t.closeOffers}</button>}
          {can('AWARD') && panel !== 'award' && <button className="primary" disabled={busy || !visible.some(b => b.status !== 'REJECTED')} onClick={() => setPanel('award')}><StarIcon />{t.award}</button>}
          {d.contracts.map(c => <button key={c.id} className={c.status === 'DECLINED' ? 'secondary' : 'primary'} onClick={() => onOpenContract(c.id)}>{fill(t.openContract, { n: `${contractRef(c.number)} · ${c.provider_name}` })}
            <small className="btn-note">{c.status === 'PROPOSED' ? t.awaitingAcceptance : c.status === 'DECLINED' ? t.declinedByProvider : t.acceptedByProvider}</small></button>)}
        </div>
        {panel === 'record' && <BidForm d={d} lang={lang} recording providers={providers} busy={busy} onCancel={() => setPanel('')}
          onSubmit={b => void run('bids', b, t.bidRecorded)} />}
        {panel === 'award' && <AwardForm d={d} lang={lang} scores={scores} busy={busy} onCancel={() => setPanel('')} onSubmit={b => void run('award', b, t.awardedOk)} />}
        {can('CANCEL') && (panel === 'cancel'
          ? <form className="link-form" onSubmit={e => { e.preventDefault(); void run('cancel', { reason: new FormData(e.currentTarget).get('reason') }); }}>
              <label>{t.reason}<textarea name="reason" required maxLength={1000} /></label>
              <div className="toolbar-actions"><button type="button" className="secondary" onClick={() => setPanel('')}>{t.cancel}</button><button className="danger" disabled={busy}>{t.confirmCancel}</button></div></form>
          : <button className="link-button danger-link" onClick={() => setPanel('cancel')}>{t.cancelTender}</button>)}
      </Sheet>

      {d.sealed && d.bids.length > 0 && <Sheet id="sealed" title={t.sealedTitle} meta={t.sealedText}>
        <ul className="sealed-list">{d.bids.map(b => <li key={b.id}><LockIcon /><strong>{b.provider_name}</strong><span className="muted">{fill(t.receivedOn, { d: dateText(b.updated_at ?? b.submitted_at, lang, 'time') })} · {b.source === 'RECORDED' ? t.recorded : t.online}</span></li>)}</ul>
      </Sheet>}

      {!d.sealed && visible.length > 0 && <Sheet id="compare" title={t.compare} meta={fill(t.compareMeta, { n: visible.length })}>
        <Comparison d={d} lang={lang} scores={scores} canReview={can('REVIEW')} busy={busy} panel={panel} setPanel={setPanel}
          onReview={(bid, body) => void run(`bids/${bid}/review`, body)} onStatus={(bid, body) => void run(`bids/${bid}/status`, body)} />
      </Sheet>}
    </> : <ProviderNext d={d} lang={lang} busy={busy} panel={panel} setPanel={setPanel} onSubmit={b => void run('bids', b, mine ? t.bidUpdated : t.bidSent)}
      onRespond={(accept, reason) => void run('invitation', { accept, reason }, accept ? t.participated : t.declinedOk)} />}

    <div className="detail-grid">
      <div className="detail-main">
        <Sheet id="dossier" title={t.dossier}>
          {d.object && <p className="detail-desc first">{d.object}</p>}
          <SectionsView sections={d.sections} lang={lang} />
          <h3 className="sheet-sub">{t.replyAsked}</h3>
          <p className="muted">{t.replyFixed}</p>
          <ol className="plain-list">{d.questions.map(q => <li key={q.key}>{q.label}{q.unit ? ` (${q.unit})` : ''}{q.required && <span className="req"> *</span>}</li>)}</ol>
          <h3 className="sheet-sub">{t.criteria}</h3>
          <ul className="criteria-view">{d.criteria.map(c => <li key={c.key}><span>{c.label}{c.auto && <small> · {t.computed}</small>}</span><span className="weight-bar" aria-hidden="true"><span style={{ width: `${c.weight}%` }} /></span><strong>{c.weight} %</strong></li>)}</ul>
          <h3 className="sheet-sub">{t.qualityAsked}</h3>
          <ol className="plain-list">{d.quality_criteria.map(q => <li key={q.key}>{q.label}</li>)}</ol>
        </Sheet>
      </div>
      <aside className="detail-side">
        {client && <Sheet id="invited" title={t.invitations} meta={String(d.invitations.length)}>
          <ul className="people invite-list">{d.invitations.map(i => <li key={i.provider_id}><span className="member-id"><Avatar name={i.name} seed={i.provider_id} shape="square" size="sm" /><span className="people-text"><strong>{i.name}</strong>
            <span className={i.response === 'DECLINED' && !i.submitted_at ? 'muted is-declined' : 'muted'}>{i.submitted_at ? fill(t.answered, { d: dateText(i.submitted_at, lang) })
              : i.response === 'DECLINED' ? `${fill(t.invDeclined, { d: dateText(i.responded_at, lang) })}${i.response_reason ? ` : ${i.response_reason}` : ''}` : i.response === 'ACCEPTED' ? t.invAccepted : t.noAnswer}</span></span></span>
            {i.submitted_at ? <CheckIcon /> : i.response === 'DECLINED' ? <CloseIcon /> : null}</li>)}</ul>
        </Sheet>}
        <Sheet id="history" title={t.history} meta={String(d.events.length)}>
          <ol className="timeline">{[...d.events].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(e => <li key={e.id}><strong>{(events[e.action] ?? [e.action, e.action])[lang === 'fr' ? 0 : 1]}</strong>
            <span className="muted">{e.actor} · {dateText(e.created_at, lang, 'time')}</span>{e.reason && <span className="timeline-reason">{e.reason}</span>}</li>)}</ol>
        </Sheet>
      </aside>
    </div>
  </section>;
}

/* ------------------------------------------------------------- comparison */

function Comparison({ d, lang, scores, canReview, busy, panel, setPanel, onReview, onStatus }: { d: Tender; lang: Lang; scores: Map<string, Score>; canReview: boolean; busy: boolean; panel: string; setPanel: (p: string) => void;
  onReview: (bid: string, body: unknown) => void; onStatus: (bid: string, body: unknown) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [onlyShort, setOnlyShort] = useState(false);
  const bids = d.bids.filter(b => !b.sealed);
  const pool = bids.filter(b => b.status !== 'REJECTED');
  const minAmount = Math.min(...pool.map(b => Number(b.amount_xaf))), minDelay = Math.min(...pool.map(b => b.delay_days));
  const shown = (onlyShort ? bids.filter(b => ['SHORTLISTED', 'AWARDED'].includes(b.status)) : bids)
    .sort((a, b) => (a.status === 'REJECTED' ? 1 : 0) - (b.status === 'REJECTED' ? 1 : 0) || (scores.get(a.id)?.rank ?? 99) - (scores.get(b.id)?.rank ?? 99));
  const budget = d.budget_xaf ? Number(d.budget_xaf) : null;
  const best = pool.find(b => scores.get(b.id)?.rank === 1);
  const reviewing = panel.startsWith('review:') ? bids.find(b => b.id === panel.slice(7)) : undefined;
  const rejecting = panel.startsWith('reject:') ? bids.find(b => b.id === panel.slice(7)) : undefined;
  const pct = (v: number) => `${v > 0 ? '+' : ''}${num(v, lang, 0)}`;
  const cols = shown.length + 1;
  return <>
    <div className="compare-tools">
      <label className="check inline"><input type="checkbox" checked={onlyShort} onChange={e => setOnlyShort(e.target.checked)} /><span><strong>{t.onlyShort}</strong></span></label>
    </div>
    <div className="compare-wrap" role="region" aria-label={t.compare} tabIndex={0}>
      <table className="compare" style={{ ['--cols' as string]: shown.length } as React.CSSProperties}>
        <thead><tr><th scope="col" className="compare-corner">{t.criterion}</th>{shown.map(b => {
          const s = scores.get(b.id);
          const badges = [b.status !== 'REJECTED' && Number(b.amount_xaf) === minAmount && t.cheapest, b.status !== 'REJECTED' && b.id === best?.id && t.bestValue, b.status !== 'REJECTED' && b.delay_days === minDelay && t.fastest].filter(Boolean) as string[];
          return <th scope="col" key={b.id} className={b.status === 'REJECTED' ? 'bid-col is-rejected' : b.id === best?.id ? 'bid-col is-best' : 'bid-col'}>
            <span className="bid-head"><Avatar name={b.provider_name} seed={b.provider_id} shape="square" size="sm" /><span className="bid-name"><strong>{b.provider_name}</strong>
              <span className="muted">{[b.provider_city, fill(t.receivedOn, { d: dateText(b.updated_at ?? b.submitted_at, lang) }), b.source === 'RECORDED' ? t.recorded : ''].filter(Boolean).join(' · ')}</span></span></span>
            {badges.length > 0 && <span className="bid-badges">{badges.map(x => <span key={x} className={x === t.bestValue ? 'state state-green' : 'state state-blue'}>{x === t.bestValue && <StarIcon />}{x}</span>)}</span>}
            {s?.rank && <span className="sr-only">rang {s.rank}</span>}
          </th>;
        })}</tr></thead>
        <tbody>
          <tr className="row-total"><th scope="row">{t.rank}</th>{shown.map(b => { const s = scores.get(b.id)!; return <td key={b.id}>
            <span className="total-line">{s.rank && <span className="rank-n">{s.rank}</span>}<strong className="total-mark">{markText(s.total, lang)}</strong><small>/10</small>{!s.complete && s.total !== null && <span className="muted"> · {t.provisional}</span>}</span>
            {s.total !== null && <span className="meter" aria-hidden="true"><span style={{ width: `${s.total * 10}%` }} /></span>}
          </td>; })}</tr>
          <tr><th scope="row">{t.amount}</th>{shown.map(b => { const a = Number(b.amount_xaf); return <td key={b.id} className={b.status !== 'REJECTED' && a === minAmount ? 'is-best-cell' : undefined}>
            <strong className="num-strong">{fcfa(a, lang)}</strong>
            <span className="cell-notes">{a > minAmount && <small>{fill(t.vsCheapest, { p: num(((a - minAmount) / minAmount) * 100, lang, 0) })}</small>}{budget && <small className={a > budget ? 'is-over' : undefined}>{fill(t.vsBudget, { p: pct(((a - budget) / budget) * 100) })}</small>}</span>
          </td>; })}</tr>
          <tr><th scope="row">{t.delay}</th>{shown.map(b => <td key={b.id} className={b.status !== 'REJECTED' && b.delay_days === minDelay ? 'is-best-cell' : undefined}><strong className="num-strong">{b.delay_days} {t.days}</strong></td>)}</tr>
          <tr className="group"><th colSpan={cols} scope="colgroup">{t.perCriterion}</th></tr>
          {d.criteria.map(c => <tr key={c.key}><th scope="row">{c.label}<small className="crit-weight">{c.weight} %{c.auto ? ` · ${t.computed}` : ''}</small></th>{shown.map(b => {
            const v = scores.get(b.id)?.per[c.key], note = b.scores?.[c.key]?.note;
            return <td key={b.id} className="score-cell">{v === null || v === undefined ? <span className="muted">{t.notMarked}</span> : <><span className="score-pill" data-tone={v >= 7.5 ? 'ok' : v >= 5 ? 'warn' : 'bad'}>{markText(v, lang)}</span>
              <span className="mini-meter" aria-hidden="true"><span style={{ width: `${v * 10}%` }} /></span></>}{note && <span className="score-note">{note}</span>}</td>;
          })}</tr>)}
          <tr className="group"><th colSpan={cols} scope="colgroup">{t.offer}</th></tr>
          <tr><th scope="row">{t.content}</th>{shown.map(b => <td key={b.id} className="text-cell"><Clamp text={b.content} t={t} /></td>)}</tr>
          <tr><th scope="row">{t.strengths}</th>{shown.map(b => <td key={b.id} className="text-cell"><Clamp text={b.strengths} t={t} /></td>)}</tr>
          {d.questions.length > 0 && <tr className="group"><th colSpan={cols} scope="colgroup">{t.answers}</th></tr>}
          {d.questions.map(q => <tr key={q.key}><th scope="row">{q.label}</th>{shown.map(b => <td key={b.id} className="text-cell">{q.type === 'textarea' ? <Clamp text={b.answers?.[q.key] as string | undefined} t={t} /> : valueText(q, b.answers?.[q.key], lang)}</td>)}</tr>)}
          <tr className="group"><th colSpan={cols} scope="colgroup">{t.opinion}</th></tr>
          <tr><th scope="row">{t.review}</th>{shown.map(b => <td key={b.id} className="text-cell"><Clamp text={b.review_note} t={t} /></td>)}</tr>
          <tr><th scope="row">{t.status}</th>{shown.map(b => <td key={b.id}>{bidState(b, t)}{b.status_reason && <span className="score-note">{b.status_reason}</span>}</td>)}</tr>
          {canReview && <tr className="row-actions"><th scope="row"><span className="sr-only">{t.decision}</span></th>{shown.map(b => <td key={b.id}><div className="bid-actions">
            <button className="secondary small" disabled={busy} onClick={() => setPanel(`review:${b.id}`)}><PenIcon />{t.mark}</button>
            {b.status === 'SUBMITTED' && <button className="secondary small" disabled={busy} onClick={() => onStatus(b.id, { status: 'SHORTLISTED' })}>{t.shortlist}</button>}
            {b.status === 'SHORTLISTED' && <button className="link-button" disabled={busy} onClick={() => onStatus(b.id, { status: 'SUBMITTED' })}>{t.unshortlist}</button>}
            {b.status !== 'REJECTED' ? <button className="link-button danger-link" disabled={busy} onClick={() => setPanel(`reject:${b.id}`)}>{t.reject}</button>
              : <button className="link-button" disabled={busy} onClick={() => onStatus(b.id, { status: 'SUBMITTED' })}>{t.restore}</button>}
          </div></td>)}</tr>}
        </tbody>
      </table>
    </div>
    {reviewing && <ReviewForm key={reviewing.id} d={d} bid={reviewing} lang={lang} busy={busy} onCancel={() => setPanel('')} onSubmit={body => onReview(reviewing.id, body)} />}
    {rejecting && <form className="link-form" onSubmit={e => { e.preventDefault(); onStatus(rejecting.id, { status: 'REJECTED', reason: new FormData(e.currentTarget).get('reason') }); }}>
      <h3 className="form-title">{t.reject} — {rejecting.provider_name}</h3>
      <label>{t.rejectReason}<textarea name="reason" required maxLength={1000} /></label>
      <div className="toolbar-actions"><button type="button" className="secondary" onClick={() => setPanel('')}>{t.cancel}</button><button className="danger" disabled={busy}>{t.reject}</button></div>
    </form>}
  </>;
}

function ReviewForm({ d, bid, lang, busy, onCancel, onSubmit }: { d: Tender; bid: Bid; lang: Lang; busy: boolean; onCancel: () => void; onSubmit: (body: unknown) => void }) {
  const t = lang === 'fr' ? fr : en;
  const manual = d.criteria.filter(c => !c.auto);
  const [marks, setMarks] = useState<Record<string, { score: string; note: string }>>(() => Object.fromEntries(manual.map(c => [c.key, { score: bid.scores?.[c.key]?.score !== undefined ? String(bid.scores[c.key]!.score) : '', note: bid.scores?.[c.key]?.note ?? '' }])));
  const [opinion, setOpinion] = useState(bid.review_note ?? '');
  return <form className="link-form review-form" onSubmit={e => {
    e.preventDefault();
    onSubmit({ reviewNote: opinion, scores: Object.fromEntries(manual.map(c => { const m = marks[c.key]!; return [c.key, m.score === '' ? null : { score: Number(m.score), note: m.note }]; })) });
  }}>
    <h3 className="form-title">{fill(t.markTitle, { p: bid.provider_name })}</h3>
    <p className="panel-desc">{t.markHelp}</p>
    {manual.map(c => <div key={c.key} className="mark-row">
      <label className="mark-score">{c.label} <small>({c.weight} %)</small><span className="unit-input"><input type="number" min={0} max={10} step={0.5} value={marks[c.key]!.score} onChange={e => setMarks(m => ({ ...m, [c.key]: { ...m[c.key]!, score: e.target.value } }))} /><span className="unit">/10</span></span></label>
      <label className="mark-note">{t.note}<input value={marks[c.key]!.note} maxLength={1000} onChange={e => setMarks(m => ({ ...m, [c.key]: { ...m[c.key]!, note: e.target.value } }))} /></label>
    </div>)}
    <label>{t.review}<textarea rows={3} maxLength={3000} value={opinion} onChange={e => setOpinion(e.target.value)} /></label>
    <div className="toolbar-actions"><button type="button" className="secondary" onClick={onCancel}>{t.cancel}</button><button className="primary" disabled={busy}>{t.saveMarks}</button></div>
  </form>;
}

function AwardForm({ d, lang, scores, busy, onCancel, onSubmit }: { d: Tender; lang: Lang; scores: Map<string, Score>; busy: boolean; onCancel: () => void; onSubmit: (body: unknown) => void }) {
  const t = lang === 'fr' ? fr : en;
  const candidates = d.bids.filter(b => !b.sealed && b.status !== 'REJECTED').sort((a, b) => (scores.get(a.id)?.rank ?? 99) - (scores.get(b.id)?.rank ?? 99));
  const shortlisted = candidates.filter(b => b.status === 'SHORTLISTED');
  const start0 = d.start_date && d.start_date >= todayKey() ? d.start_date : addDays(todayKey(), 7);
  const [rows, setRows] = useState(() => Object.fromEntries(candidates.map(b => {
    const days = d.duration_days ?? Math.max(1, b.delay_days);
    return [b.id, { on: shortlisted.length ? b.status === 'SHORTLISTED' : scores.get(b.id)?.rank === 1, amount: String(Number(b.amount_xaf)), days: String(days), start: start0, installments: String(days >= 60 ? Math.round(days / 30) : 1), target: '7' }];
  })));
  const [note, setNote] = useState('');
  const chosen = candidates.filter(b => rows[b.id]!.on);
  const set = (id: string, patch: Partial<typeof rows[string]>) => setRows(r => ({ ...r, [id]: { ...r[id]!, ...patch } }));
  return <form className="link-form award-form" onSubmit={e => {
    e.preventDefault();
    onSubmit({ note, awards: chosen.map(b => { const r = rows[b.id]!; return { bidId: b.id, amount: Number(r.amount), days: Number(r.days), startDate: r.start, installments: Number(r.installments), qualityTarget: Number(r.target) }; }) });
  }}>
    <h3 className="form-title">{t.awardTitle}</h3>
    <p className="panel-desc">{t.awardHelp}</p>
    <ul className="award-list">{candidates.map(b => {
      const r = rows[b.id]!, s = scores.get(b.id), n = Math.max(1, Number(r.installments) || 1), days = Math.max(1, Number(r.days) || 1);
      return <li key={b.id} className={r.on ? 'award-item is-on' : 'award-item'}>
        <label className="check"><input type="checkbox" checked={r.on} onChange={e => set(b.id, { on: e.target.checked })} />
          <span><strong>{b.provider_name}</strong><span className="muted">{[s?.total !== null && s?.total !== undefined ? `${markText(s.total, lang)}/10` : '', fcfa(b.amount_xaf, lang), `${b.delay_days} ${t.days}`, b.status === 'SHORTLISTED' ? t.SHORTLISTED : ''].filter(Boolean).join(' · ')}</span></span></label>
        {r.on && <div className="award-fields">
          <label>{t.awardAmount}<span className="unit-input"><input type="number" min={1} step={1} required value={r.amount} onChange={e => set(b.id, { amount: e.target.value })} /><span className="unit">FCFA</span></span></label>
          <label>{t.awardDays}<span className="unit-input"><input type="number" min={1} max={3650} step={1} required value={r.days} onChange={e => set(b.id, { days: e.target.value })} /><span className="unit">{t.days}</span></span></label>
          <label>{t.awardStart}<input type="date" required value={r.start} onChange={e => set(b.id, { start: e.target.value })} /></label>
          <label>{t.awardInstallments}<input type="number" min={1} max={36} step={1} required value={r.installments} onChange={e => set(b.id, { installments: e.target.value })} /></label>
          <label>{t.awardTarget}<span className="unit-input"><input type="number" min={1} max={10} step={0.5} required value={r.target} onChange={e => set(b.id, { target: e.target.value })} /><span className="unit">/10</span></span></label>
          <p className="award-line">{fill(t.scheduleLine, { n, a: fcfa(Math.floor((Number(r.amount) || 0) / n), lang), d: dateText(addDays(r.start || todayKey(), days - 1), lang, 'long') })}</p>
        </div>}
      </li>;
    })}</ul>
    <label>{t.awardNote}<textarea rows={2} maxLength={2000} placeholder={t.awardNoteHint} value={note} onChange={e => setNote(e.target.value)} /></label>
    <div className="toolbar-actions"><button type="button" className="secondary" onClick={onCancel}>{t.cancel}</button><button className="primary" disabled={busy || !chosen.length}>{t.confirmAward}</button></div>
  </form>;
}

/* -------------------------------------------------------------- offers */

function BidForm({ d, lang, mine, recording, providers = [], busy, onCancel, onSubmit }: { d: Tender; lang: Lang; mine?: Bid; recording?: boolean; providers?: DirectoryProvider[]; busy: boolean; onCancel?: () => void; onSubmit: (body: unknown) => void }) {
  const t = lang === 'fr' ? fr : en;
  const [amount, setAmount] = useState(mine ? String(Number(mine.amount_xaf)) : ''), [delay, setDelay] = useState(mine ? String(mine.delay_days) : '');
  const [content, setContent] = useState(mine?.content ?? ''), [strengths, setStrengths] = useState(mine?.strengths ?? '');
  const [answers, setAnswers] = useState<Record<string, FieldValue>>(() => ({ ...(mine?.answers ?? {}) })), [provider, setProvider] = useState('');
  const answered = new Set(d.bids.map(b => b.provider_id));
  const invitedFirst = [...d.invitations.filter(i => !answered.has(i.provider_id)).map(i => ({ id: i.provider_id, name: i.name })),
    ...providers.filter(p => !answered.has(p.id) && !d.invitations.some(i => i.provider_id === p.id)).map(p => ({ id: p.id, name: p.name }))];
  return <form className="link-form bid-form" onSubmit={e => {
    e.preventDefault();
    onSubmit({ ...(recording ? { providerId: provider } : {}), amount: Number(amount), delayDays: Number(delay), content, strengths: strengths || null,
      answers: Object.fromEntries(Object.entries(answers).filter(([, v]) => !isEmpty(v)).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) });
  }}>
    {recording && <><h3 className="form-title">{t.recordBid}</h3><p className="panel-desc">{t.recordHelp}</p>
      <label>{t.provider}<select required value={provider} onChange={e => setProvider(e.target.value)}><option value="">{t.chooseProvider}</option>{invitedFirst.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></>}
    <div className="form-row">
      <label>{t.bidAmount}<span className="unit-input"><input type="number" min={1} step={1} required value={amount} onChange={e => setAmount(e.target.value)} /><span className="unit">FCFA</span></span>{amount && <small>{fcfa(Number(amount), lang)}</small>}</label>
      <label>{t.bidDelay}<span className="unit-input"><input type="number" min={0} max={3650} step={1} required value={delay} onChange={e => setDelay(e.target.value)} /><span className="unit">{t.days}</span></span><small>{t.bidDelayHelp}</small></label>
    </div>
    <label>{t.bidContent}<textarea rows={5} required maxLength={6000} placeholder={t.bidContentHint} value={content} onChange={e => setContent(e.target.value)} /></label>
    <label>{t.bidStrengths}<textarea rows={3} maxLength={3000} placeholder={t.bidStrengthsHint} value={strengths} onChange={e => setStrengths(e.target.value)} /></label>
    {d.questions.length > 0 && <fieldset className="bid-answers"><legend>{t.bidAnswers}</legend>
      {d.questions.map(q => <FieldInput key={q.key} field={recording ? { ...q, required: false } : q} value={answers[q.key]} lang={lang} id={`ans-${q.key}`} onChange={v => setAnswers(a => ({ ...a, [q.key]: v }))} />)}</fieldset>}
    <div className="toolbar-actions">{onCancel && <button type="button" className="secondary" onClick={onCancel}>{t.cancel}</button>}
      <button className="primary" disabled={busy || (recording && !provider)}>{recording ? t.saveRecorded : mine ? t.updateBid : t.sendBid}</button></div>
  </form>;
}

function ProviderNext({ d, lang, busy, panel, setPanel, onSubmit, onRespond }: { d: Tender; lang: Lang; busy: boolean; panel: string; setPanel: (p: string) => void; onSubmit: (b: unknown) => void;
  onRespond: (accept: boolean, reason?: string) => void }) {
  const t = lang === 'fr' ? fr : en;
  const mine = d.bids[0], open = d.actions.includes('BID'), respond = d.actions.includes('RESPOND'), inv = d.my_invitation;
  if (inv?.response === 'DECLINED' && !mine) return <Sheet id="bid" title={t.bidTitle}>
    <p className="next-text">{fill(t.youDeclined, { d: dateText(inv.responded_at, lang) })}{inv.response_reason ? ` ${t.reason} : ${inv.response_reason}` : ''}</p>
    {respond && <button className="secondary" disabled={busy} onClick={() => onRespond(true)}>{t.reconsider}</button>}
  </Sheet>;
  if (open && (!mine || panel === 'bid' || panel === 'decline')) return <Sheet id="bid" title={t.bidTitle} className="sheet-action">
    {respond && !mine && <div className="invite-answer">
      <p><strong>{t.invitedQ}</strong> {t.invitedHelp}</p>
      {panel === 'decline'
        ? <form className="link-form" onSubmit={e => { e.preventDefault(); onRespond(false, String(new FormData(e.currentTarget).get('reason') ?? '')); }}>
            <label>{t.declineReason}<textarea name="reason" required maxLength={1000} rows={2} /></label>
            <div className="toolbar-actions"><button type="button" className="secondary" onClick={() => setPanel('')}>{t.cancel}</button><button className="danger" disabled={busy}>{t.confirmDecline}</button></div></form>
        : <div className="toolbar-actions">{inv?.response !== 'ACCEPTED' && <button className="secondary small" disabled={busy} onClick={() => onRespond(true)}><CheckIcon />{t.participate}</button>}
            <button className="link-button danger-link" onClick={() => setPanel('decline')}>{t.decline}</button></div>}
    </div>}
    <p className="next-text">{fill(t.bidHelp, { d: dateText(d.deadline, lang, 'time') })}</p>
    <BidForm d={d} lang={lang} mine={mine} busy={busy} onCancel={mine ? () => setPanel('') : undefined} onSubmit={onSubmit} />
  </Sheet>;
  const text = d.status === 'CANCELLED' ? t.resultCancelled : d.status === 'AWARDED' ? (mine?.status === 'AWARDED' ? t.resultRetained : t.resultNotRetained)
    : !open && d.status !== 'PUBLISHED' ? (mine ? t.resultAnalysis : t.resultNoBid) : '';
  return <Sheet id="bid" title={mine ? fill(t.myBidTitle, { d: dateText(mine.updated_at ?? mine.submitted_at, lang, 'time') }) : t.bidTitle} className={mine?.status === 'AWARDED' ? 'sheet-ok' : undefined}>
    {text && <p className={mine?.status === 'AWARDED' ? 'next-text is-ok' : 'next-text'}>{mine?.status === 'AWARDED' && <CheckIcon />}{text}</p>}
    {mine && <dl className="facts bid-facts">
      <div><dt>{t.bidAmount}</dt><dd>{fcfa(mine.amount_xaf, lang)}</dd></div><div><dt>{t.bidDelay}</dt><dd>{mine.delay_days} {t.days}</dd></div>
      <div className="span-2"><dt>{t.bidContent}</dt><dd><Clamp text={mine.content} t={t} /></dd></div>
      {mine.strengths && <div className="span-2"><dt>{t.bidStrengths}</dt><dd><Clamp text={mine.strengths} t={t} /></dd></div>}
      {d.questions.filter(q => !isEmpty(mine.answers?.[q.key])).map(q => <div key={q.key}><dt>{q.label}</dt><dd>{valueText(q, mine.answers[q.key], lang)}</dd></div>)}
    </dl>}
    {open && mine && <button className="secondary" onClick={() => setPanel('bid')}><PenIcon />{t.editBid}</button>}
  </Sheet>;
}


