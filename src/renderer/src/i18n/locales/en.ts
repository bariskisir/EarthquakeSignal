/**
 * English interface strings.
 */

import { earthquakeEn } from './earthquake'

const en = {
  earthquake: earthquakeEn,
  app: {
    name: 'Earthquake Signal',
    tagline: 'Real-time earthquake signals.',
  },
  common: {
    loading: 'Loading...',
    delete: 'Delete',
    rename: 'Rename',
    cancel: 'Cancel',
  },
  nav: {
    sessions: 'Earthquakes',
    settings: 'Settings',
  },
  sidebar: {
    hideSidebar: 'Hide earthquakes',
    showSidebar: 'Show earthquakes',
  },
  sessions: {
    newSession: 'New earthquake',
    renameSession: 'Rename earthquake',
    deleteAll: 'Delete all earthquakes',
    emptyTitle: 'No earthquakes yet',
  },
  windowControls: {
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    close: 'Close',
  },
  settings: {
    title: 'Settings',
    general: 'General',
    display: 'Display',
    updates: 'Updates',
    logging: 'Logging',
    about: 'About',
    interfaceLanguage: 'Interface language',
    interfaceLanguageDescription: 'Choose the language used by the application.',
    timeFormat: 'Time format',
    timeFormatDescription: 'Choose how earthquake times are displayed.',
    startOnStartup: 'Start on startup',
    startOnStartupDescription:
      'Launch Earthquake Signal automatically in the system tray when you sign in.',
    timeFormats: {
      '24-hour': '24-hour',
      '12-hour': '12-hour',
    },
    displaySettings: 'Appearance',
    theme: 'Theme',
    themeDescription: 'Choose the application color theme.',
    navbarPosition: 'Navigation position',
    navbarPositionDescription: 'Place global navigation on the left or top.',
    navbarPositions: {
      left: 'Left',
      top: 'Top',
    },
    zoomSettings: 'Zoom',
    pageZoom: 'Page zoom',
    pageZoomDescription: 'Adjust the size of the application interface.',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    resetZoom: 'Reset zoom',
    traySettings: 'System tray',
    showTrayIcon: 'Show tray icon',
    showTrayIconDescription: 'Show Earthquake Signal in the system tray.',
    minimizeToTrayOnClose: 'Minimize to tray on close',
    minimizeToTrayOnCloseDescription: 'Keep the application running when the window closes.',
    trayUnavailable: 'System tray integration is unavailable on Linux.',
    alwaysOnTop: 'Always on top',
    checkUpdatesOnStartup: 'Check for updates on startup',
    checkUpdatesOnStartupDescription:
      'Check GitHub for a new Earthquake Signal version when the application starts.',
    checkUpdates: 'Check now',
    checking: 'Checking for updates...',
    upToDate: 'Application is up to date.',
    updateAvailable: 'Version {{version}} is available.',
    downloading: 'Downloading update... {{percent}}%',
    readyToInstall: 'Version {{version}} is ready to install.',
    installNow: 'Install and restart',
    openDownloadPage: 'Open download page',
    releaseNotes: 'Release notes',
    updateError: 'Update check failed.',
    version: 'Version {{version}}',
    logLevel: 'Log level',
    logLevelDescription: 'Control the verbosity of application logs.',
    logFiles: 'Log files',
    logFilesDescription: 'Open the folder containing application log files.',
    openLogs: 'Open',
    logLevels: {
      error: 'Error',
      warn: 'Warning',
      info: 'Info',
      debug: 'Debug',
      verbose: 'Verbose',
    },
    author: 'Author',
    sourceCode: 'Source code',
  },
  locales: {
    en: 'English',
    tr: 'Turkish',
    de: 'German',
    fr: 'French',
    pt: 'Portuguese',
    zh: 'Chinese',
    es: 'Spanish',
    ru: 'Russian',
    ja: 'Japanese',
    ko: 'Korean',
  },
  themes: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
  errors: {
    generic: 'Something went wrong.',
  },
  about: {
    howItWorks: 'How it works',
    howItWorksTitle: 'How Earthquake Signal works',
    howItWorksIntro:
      'Earthquake Signal is a desktop companion to the Earthquake Network mobile app. It receives the same earthquake alerts — no phone needed.',
    howItWorksSteps: {
      step1: 'Pick your location on the map — choose where you want to be notified about.',
      step2: 'The app registers your location with the Earthquake Network server.',
      step3:
        'It joins two alert channels: Global (worldwide) and your local 10×10 degree zone around your location.',
      step4:
        'When seismic stations detect an earthquake, a push message travels from Earthquake Network through Firebase to your computer within seconds.',
      step5:
        'The earthquake appears on your map. You see magnitude, estimated shaking, distance, and depth.',
      step6:
        'All earthquake data is stored on your computer. No account, no personal info — only your coordinates and a random device ID are shared.',
    },
  },
} as const

export default en
