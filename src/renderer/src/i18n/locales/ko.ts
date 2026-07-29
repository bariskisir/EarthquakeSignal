/**
 * Korean interface strings.
 */

import { earthquakeEn } from './earthquake'

const ko = {
  earthquake: { ...earthquakeEn, yourLocation: '너', earthquakeCenter: '지진' },
  app: {
    name: 'Earthquake Signal',
    tagline: '실시간 지진 신호.',
  },
  common: {
    loading: '로딩 중…',
    delete: '삭제',
    rename: '이름 변경',
    cancel: '취소',
  },
  nav: {
    sessions: '지진',
    settings: '설정',
  },
  sidebar: {
    hideSidebar: '지진 숨기기',
    showSidebar: '지진 표시',
  },
  sessions: {
    newSession: '새 지진',
    renameSession: '지진 이름 변경',
    deleteAll: '모든 지진 삭제',
    emptyTitle: '아직 지진이 없습니다',
  },
  windowControls: {
    minimize: '최소화',
    maximize: '최대화',
    restore: '복원',
    close: '닫기',
  },
  settings: {
    title: '설정',
    general: '일반',
    display: '디스플레이',
    updates: '업데이트',
    logging: '로깅',
    about: '정보',
    interfaceLanguage: '인터페이스 언어',
    interfaceLanguageDescription: '애플리케이션 표시 언어를 변경합니다.',
    timeFormat: '시간 형식',
    timeFormatDescription: '12시간제와 24시간제 중에서 선택합니다.',
    startOnStartup: '시작할 때 실행',
    startOnStartupDescription: '로그인할 때 Earthquake Signal을 자동으로 실행합니다.',
    timeFormats: {
      '24-hour': '24시간제',
      '12-hour': '12시간제',
    },
    displaySettings: '디스플레이 설정',
    theme: '테마',
    themeDescription: '애플리케이션의 모양 테마를 선택합니다.',
    navbarPosition: '탐색 모음 위치',
    navbarPositionDescription: '탐색 컨트롤을 왼쪽 또는 위쪽에 배치합니다.',
    navbarPositions: {
      left: '왼쪽',
      top: '위쪽',
    },
    zoomSettings: '확대/축소 설정',
    pageZoom: '페이지 확대/축소',
    pageZoomDescription: '인터페이스 텍스트와 컨트롤을 축소하거나 확대합니다.',
    zoomOut: '축소',
    zoomIn: '확대',
    resetZoom: '확대/축소 초기화',
    traySettings: '시스템 트레이 설정',
    showTrayIcon: '트레이 아이콘 표시',
    showTrayIconDescription: 'Show Earthquake Signal in the system tray.',
    minimizeToTrayOnClose: '닫을 때 트레이로 최소화',
    minimizeToTrayOnCloseDescription: '창을 닫을 때 종료하지 않고 시스템 트레이로 숨깁니다.',
    trayUnavailable: 'Windows only',
    alwaysOnTop: '항상 위에 표시',
    checkUpdatesOnStartup: '시작 시 업데이트 확인',
    checkUpdatesOnStartupDescription: '애플리케이션 시작 시 GitHub 릴리스를 자동으로 확인합니다.',
    checkUpdates: '지금 확인',
    checking: '업데이트 확인 중…',
    upToDate: '최신 버전을 사용 중입니다.',
    updateAvailable: '버전 {{version}}을(를) 사용할 수 있습니다.',
    downloading: '업데이트 다운로드 중… {{percent}}%',
    readyToInstall: '버전 {{version}} 설치 준비 완료.',
    installNow: '설치 후 다시 시작',
    openDownloadPage: '다운로드 페이지 열기',
    releaseNotes: '릴리스 노트',
    updateError: '업데이트 확인에 실패했습니다.',
    version: '버전 {{version}}',
    logLevel: '로그 레벨',
    logLevelDescription: '애플리케이션 로그의 상세도를 제어합니다.',
    logFiles: '로그 파일',
    logFilesDescription: '애플리케이션 로그 파일이 있는 폴더를 엽니다.',
    openLogs: '열기',
    logLevels: {
      error: '오류만',
      warn: '경고',
      info: '정보',
      debug: '디버그',
      verbose: '상세',
    },
    author: '제작자',
    sourceCode: '소스 코드',
  },
  locales: {
    en: '영어',
    tr: '터키어',
    de: '독일어',
    fr: '프랑스어',
    pt: '포르투갈어',
    zh: '중국어',
    es: '스페인어',
    ru: '러시아어',
    ja: '일본어',
    ko: '한국어',
  },
  themes: {
    system: '시스템',
    light: '라이트',
    dark: '다크',
  },
  about: {
    howItWorks: '작동 방식',
    howItWorksTitle: 'Earthquake Signal 작동 방식',
    howItWorksIntro:
      'Earthquake Signal은 Earthquake Network 모바일 앱의 데스크톱 버전입니다. 휴대폰 없이도 동일한 지진 알림을 받습니다.',
    howItWorksSteps: {
      step1: '지도에서 위치를 선택하세요 — 알림을 받고 싶은 곳을 설정합니다.',
      step2: '앱이 선택한 위치를 Earthquake Network 서버에 등록합니다.',
      step3: '두 가지 알림 채널을 구독합니다: Global(전 세계)과 내 위치 주변 10×10도 지역입니다.',
      step4:
        '지진 관측소가 지진을 감지하면 Earthquake Network 서버에서 Firebase를 통해 몇 초 안에 컴퓨터로 푸시 메시지가 도착합니다.',
      step5: '지진이 지도에 표시됩니다. 규모, 예상 진도, 거리, 깊이를 확인할 수 있습니다.',
      step6:
        '모든 지진 데이터는 컴퓨터에 저장됩니다. 계정 불필요, 개인정보 불필요 — 좌표와 임의의 기기 ID만 공유됩니다.',
    },
  },
  errors: {
    generic: '문제가 발생했습니다.',
  },
} as const

export default ko
