/**
 * French interface strings.
 */

import { earthquakeEn } from './earthquake'

const fr = {
  earthquake: { ...earthquakeEn, yourLocation: 'Toi', earthquakeCenter: 'Séisme' },
  app: {
    name: 'Earthquake Signal',
    tagline: 'Signaux sismiques en temps réel.',
  },
  common: {
    loading: 'Chargement…',
    delete: 'Supprimer',
    rename: 'Renommer',
    cancel: 'Annuler',
  },
  nav: {
    sessions: 'Séismes',
    settings: 'Paramètres',
  },
  sidebar: {
    hideSidebar: 'Masquer les séismes',
    showSidebar: 'Afficher les séismes',
  },
  sessions: {
    newSession: 'Nouveau séisme',
    renameSession: 'Renommer le séisme',
    deleteAll: 'Supprimer tous les séismes',
    emptyTitle: 'Aucun séisme',
  },
  windowControls: {
    minimize: 'Réduire',
    maximize: 'Agrandir',
    restore: 'Restaurer',
    close: 'Fermer',
  },
  settings: {
    title: 'Paramètres',
    general: 'Général',
    display: 'Affichage',
    updates: 'Mises à jour',
    logging: 'Journalisation',
    about: 'À propos',
    interfaceLanguage: "Langue de l'interface",
    interfaceLanguageDescription: "Choisissez la langue de l'application.",
    timeFormat: "Format de l'heure",
    timeFormatDescription: 'Choisissez entre une horloge de 24 ou 12 heures.',
    startOnStartup: 'Lancer au démarrage',
    startOnStartupDescription: 'Lancer automatiquement Earthquake Signal à la connexion.',
    timeFormats: {
      '24-hour': '24 heures',
      '12-hour': '12 heures',
    },
    displaySettings: "Paramètres d'affichage",
    theme: 'Thème',
    themeDescription: "Choisissez le thème d'affichage de l'application.",
    navbarPosition: 'Position de la barre de navigation',
    navbarPositionDescription: 'Placez les commandes de navigation à gauche ou en haut.',
    navbarPositions: {
      left: 'Gauche',
      top: 'Haut',
    },
    zoomSettings: 'Paramètres de zoom',
    pageZoom: 'Zoom de la page',
    pageZoomDescription: "Réduisez ou agrandissez le texte et les commandes de l'interface.",
    zoomOut: 'Réduire',
    zoomIn: 'Agrandir',
    resetZoom: 'Réinitialiser le zoom',
    traySettings: 'Paramètres de la zone de notification',
    showTrayIcon: "Afficher l'icône dans la zone de notification",
    showTrayIconDescription: 'Show Earthquake Signal in the system tray.',
    minimizeToTrayOnClose: 'Réduire dans la zone de notification à la fermeture',
    minimizeToTrayOnCloseDescription:
      "Masquez la fenêtre dans la zone de notification au lieu de quitter l'application.",
    trayUnavailable: 'Windows only',
    alwaysOnTop: 'Toujours au premier plan',
    checkUpdatesOnStartup: 'Rechercher les mises à jour au démarrage',
    checkUpdatesOnStartupDescription:
      'Check GitHub for a new Earthquake Signal version when the application starts.',
    checkUpdates: 'Vérifier',
    checking: 'Recherche de mises à jour…',
    upToDate: 'Vous utilisez la dernière version.',
    updateAvailable: 'La version {{version}} est disponible.',
    downloading: 'Téléchargement… {{percent}} %',
    readyToInstall: 'La version {{version}} est prête.',
    installNow: 'Installer et redémarrer',
    openDownloadPage: 'Ouvrir la page de téléchargement',
    releaseNotes: 'Notes de version',
    updateError: 'Échec de la recherche de mise à jour.',
    version: 'Version {{version}}',
    logLevel: 'Niveau de journal',
    logLevelDescription: 'Choisissez la quantité de détails de diagnostic enregistrés localement.',
    logFiles: 'Fichiers journaux',
    logFilesDescription: 'Fichiers de diagnostic rotatifs dans le dossier de données.',
    openLogs: 'Ouvrir',
    logLevels: {
      error: 'Erreurs uniquement',
      warn: 'Avertissements',
      info: 'Informations',
      debug: 'Débogage',
      verbose: 'Détaillé',
    },
    author: 'Auteur',
    sourceCode: 'Code source',
  },
  locales: {
    en: 'Anglais',
    tr: 'Turc',
    de: 'Allemand',
    fr: 'Français',
    pt: 'Portugais',
    zh: 'Chinois',
    es: 'Espagnol',
    ru: 'Russe',
    ja: 'Japonais',
    ko: 'Coréen',
  },
  themes: {
    system: 'Système',
    light: 'Clair',
    dark: 'Sombre',
  },
  errors: {
    generic: "Une erreur s'est produite.",
  },
  about: {
    howItWorks: 'Comment ça marche',
    howItWorksTitle: 'Comment fonctionne Earthquake Signal',
    howItWorksIntro:
      "Earthquake Signal est la version bureau de l'application mobile Earthquake Network. Il reçoit les mêmes alertes sismiques — sans téléphone.",
    howItWorksSteps: {
      step1:
        'Choisissez votre emplacement sur la carte — définissez où vous souhaitez être alerté.',
      step2: "L'application enregistre votre position auprès du serveur Earthquake Network.",
      step3:
        "Elle s'abonne à deux canaux d'alerte : Global (monde entier) et votre zone locale de 10×10 degrés autour de votre position.",
      step4:
        "Lorsque des stations sismiques détectent un séisme, un message push est envoyé depuis le serveur Earthquake Network via Firebase jusqu'à votre ordinateur en quelques secondes.",
      step5:
        'Le séisme apparaît sur votre carte. Vous voyez la magnitude, les secousses estimées, la distance et la profondeur.',
      step6:
        'Toutes les données sismiques sont stockées sur votre ordinateur. Aucun compte, aucune info personnelle — seules vos coordonnées et un identifiant aléatoire sont partagés.',
    },
  },
} as const

export default fr
