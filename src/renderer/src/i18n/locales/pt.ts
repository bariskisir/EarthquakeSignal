/**
 * Portuguese interface strings.
 */

import { earthquakeEn } from './earthquake'

const pt = {
  earthquake: { ...earthquakeEn, yourLocation: 'Você', earthquakeCenter: 'Terremoto' },
  app: {
    name: 'Earthquake Signal',
    tagline: 'Sinais sísmicos em tempo real.',
  },
  common: {
    loading: 'A carregar…',
    delete: 'Eliminar',
    rename: 'Renomear',
    cancel: 'Cancelar',
  },
  nav: {
    sessions: 'Sismos',
    settings: 'Definições',
  },
  sidebar: {
    hideSidebar: 'Ocultar sismos',
    showSidebar: 'Mostrar sismos',
  },
  sessions: {
    newSession: 'Novo sismo',
    renameSession: 'Renomear sismo',
    deleteAll: 'Eliminar todos os sismos',
    emptyTitle: 'Ainda não há sismos',
  },
  windowControls: {
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    restore: 'Restaurar',
    close: 'Fechar',
  },
  settings: {
    title: 'Definições',
    general: 'Geral',
    display: 'Aparência',
    updates: 'Atualizações',
    logging: 'Registo',
    about: 'Sobre',
    interfaceLanguage: 'Idioma da interface',
    interfaceLanguageDescription: 'Escolha o idioma utilizado pela aplicação.',
    timeFormat: 'Formato da hora',
    timeFormatDescription: 'Escolha entre o relógio de 24 ou 12 horas.',
    startOnStartup: 'Iniciar no arranque',
    startOnStartupDescription: 'Iniciar o Earthquake Signal automaticamente ao iniciar sessão.',
    timeFormats: {
      '24-hour': '24 horas',
      '12-hour': '12 horas',
    },
    displaySettings: 'Definições de aparência',
    theme: 'Tema',
    themeDescription: 'Escolha o tema de aparência da aplicação.',
    navbarPosition: 'Posição da barra de navegação',
    navbarPositionDescription: 'Coloque os controlos de navegação à esquerda ou no topo.',
    navbarPositions: {
      left: 'Esquerda',
      top: 'Topo',
    },
    zoomSettings: 'Definições de zoom',
    pageZoom: 'Zoom da página',
    pageZoomDescription: 'Reduza ou amplie o texto e os controlos da interface.',
    zoomOut: 'Reduzir',
    zoomIn: 'Ampliar',
    resetZoom: 'Repor zoom',
    traySettings: 'Definições da área de notificação',
    showTrayIcon: 'Mostrar ícone na área de notificação',
    showTrayIconDescription: 'Show Earthquake Signal in the system tray.',
    minimizeToTrayOnClose: 'Minimizar para a área de notificação ao fechar',
    minimizeToTrayOnCloseDescription:
      'Oculte a janela na área de notificação em vez de sair ao fechá-la.',
    trayUnavailable: 'Windows only',
    alwaysOnTop: 'Sempre visível',
    checkUpdatesOnStartup: 'Procurar atualizações ao iniciar',
    checkUpdatesOnStartupDescription:
      'Check GitHub for a new Earthquake Signal version when the application starts.',
    checkUpdates: 'Verificar',
    checking: 'A procurar atualizações…',
    upToDate: 'Está a utilizar a versão mais recente.',
    updateAvailable: 'A versão {{version}} está disponível.',
    downloading: 'A transferir atualização… {{percent}}%',
    readyToInstall: 'A versão {{version}} está pronta.',
    installNow: 'Instalar e reiniciar',
    openDownloadPage: 'Abrir página de download',
    releaseNotes: 'Notas da versão',
    updateError: 'A verificação de atualização falhou.',
    version: 'Versão {{version}}',
    logLevel: 'Nível de registo',
    logLevelDescription: 'Escolha o nível de detalhe de diagnóstico guardado localmente.',
    logFiles: 'Ficheiros de registo',
    logFilesDescription: 'Ficheiros de diagnóstico rotativos na pasta de dados da aplicação.',
    openLogs: 'Abrir',
    logLevels: {
      error: 'Apenas erros',
      warn: 'Avisos',
      info: 'Informações',
      debug: 'Depuração',
      verbose: 'Detalhado',
    },
    author: 'Autor',
    sourceCode: 'Código fonte',
  },
  locales: {
    en: 'Inglês',
    tr: 'Turco',
    de: 'Alemão',
    fr: 'Francês',
    pt: 'Português',
    zh: 'Chinês',
    es: 'Espanhol',
    ru: 'Russo',
    ja: 'Japonês',
    ko: 'Coreano',
  },
  themes: {
    system: 'Sistema',
    light: 'Claro',
    dark: 'Escuro',
  },
  about: {
    howItWorks: 'Como funciona',
    howItWorksTitle: 'Como funciona o Earthquake Signal',
    howItWorksIntro:
      'O Earthquake Signal é a versão desktop da aplicação móvel Earthquake Network. Recebe os mesmos alertas sísmicos — sem necessidade de telemóvel.',
    howItWorksSteps: {
      step1: 'Escolha a sua localização no mapa — defina onde quer ser notificado.',
      step2: 'A aplicação regista a sua localização no servidor Earthquake Network.',
      step3:
        'Subscreve dois canais de alerta: Global (mundial) e a sua zona local de 10×10 graus ao redor da sua localização.',
      step4:
        'Quando as estações sísmicas detetam um sismo, uma mensagem push viaja do servidor Earthquake Network através do Firebase até ao seu computador em segundos.',
      step5:
        'O sismo aparece no seu mapa. Vê a magnitude, intensidade estimada, distância e profundidade.',
      step6:
        'Todos os dados sísmicos são armazenados no seu computador. Sem conta, sem informações pessoais — apenas as suas coordenadas e um identificador de dispositivo aleatório são partilhados.',
    },
  },
  errors: {
    generic: 'Ocorreu um erro.',
  },
} as const

export default pt
