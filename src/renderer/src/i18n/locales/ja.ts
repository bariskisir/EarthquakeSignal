/**
 * Japanese interface strings.
 */

import { earthquakeEn } from './earthquake'

const ja = {
  earthquake: { ...earthquakeEn, yourLocation: 'あなた', earthquakeCenter: '地震' },
  app: {
    name: 'Earthquake Signal',
    tagline: 'リアルタイム地震信号。',
  },
  common: {
    loading: '読み込み中…',
    delete: '削除',
    rename: '名前を変更',
    cancel: 'キャンセル',
  },
  nav: {
    sessions: '地震',
    settings: '設定',
  },
  sidebar: {
    hideSidebar: '地震を非表示',
    showSidebar: '地震を表示',
  },
  sessions: {
    newSession: '新しい地震',
    renameSession: '地震名を変更',
    deleteAll: 'すべての地震を削除',
    emptyTitle: '地震はまだありません',
  },
  windowControls: {
    minimize: '最小化',
    maximize: '最大化',
    restore: '元に戻す',
    close: '閉じる',
  },
  settings: {
    title: '設定',
    general: '一般',
    display: '表示',
    updates: 'アップデート',
    logging: 'ログ',
    about: 'について',
    interfaceLanguage: 'インターフェース言語',
    interfaceLanguageDescription: 'アプリケーションの表示言語を変更します。',
    timeFormat: '時刻形式',
    timeFormatDescription: '12時間表示と24時間表示を切り替えます。',
    startOnStartup: 'スタートアップ時に起動',
    startOnStartupDescription: 'サインイン時に Earthquake Signal を自動的に起動します。',
    timeFormats: {
      '24-hour': '24時間',
      '12-hour': '12時間',
    },
    displaySettings: '表示設定',
    theme: 'テーマ',
    themeDescription: 'アプリケーションの外観テーマを選択します。',
    navbarPosition: 'ナビゲーションバーの位置',
    navbarPositionDescription: 'ナビゲーション操作を左または上に配置します。',
    navbarPositions: {
      left: '左',
      top: '上',
    },
    zoomSettings: 'ズーム設定',
    pageZoom: 'ページズーム',
    pageZoomDescription: 'インターフェースの文字とコントロールを縮小または拡大します。',
    zoomOut: '縮小',
    zoomIn: '拡大',
    resetZoom: 'ズームをリセット',
    traySettings: 'システムトレイ設定',
    showTrayIcon: 'トレイアイコンを表示',
    showTrayIconDescription: 'Show Earthquake Signal in the system tray.',
    minimizeToTrayOnClose: '閉じるときにトレイへ最小化',
    minimizeToTrayOnCloseDescription:
      'ウィンドウを閉じたとき、終了せずにシステムトレイへ隠します。',
    trayUnavailable: 'Windows only',
    alwaysOnTop: '常に最前面に表示',
    checkUpdatesOnStartup: '起動時にアップデートを確認',
    checkUpdatesOnStartupDescription:
      'アプリケーション起動時にGitHub Releasesを自動的に確認します。',
    checkUpdates: '今すぐ確認',
    checking: 'アップデートを確認中…',
    upToDate: 'アプリケーションは最新です。',
    updateAvailable: 'バージョン {{version}} が利用可能です。',
    downloading: 'アップデートをダウンロード中… {{percent}}%',
    readyToInstall: 'バージョン {{version}} のインストール準備ができました。',
    installNow: 'インストールして再起動',
    openDownloadPage: 'ダウンロードページを開く',
    releaseNotes: 'リリースノート',
    updateError: 'アップデートの確認に失敗しました。',
    version: 'バージョン {{version}}',
    logLevel: 'ログレベル',
    logLevelDescription: 'アプリケーションログの詳細度を制御します。',
    logFiles: 'ログファイル',
    logFilesDescription: 'アプリケーションのログファイルが保存されているフォルダを開きます。',
    openLogs: '開く',
    logLevels: {
      error: 'エラーのみ',
      warn: '警告',
      info: '情報',
      debug: 'デバッグ',
      verbose: '詳細',
    },
    author: '作者',
    sourceCode: 'ソースコード',
  },
  locales: {
    en: '英語',
    tr: 'トルコ語',
    de: 'ドイツ語',
    fr: 'フランス語',
    pt: 'ポルトガル語',
    zh: '中国語',
    es: 'スペイン語',
    ru: 'ロシア語',
    ja: '日本語',
    ko: '韓国語',
  },
  themes: {
    system: 'システム',
    light: 'ライト',
    dark: 'ダーク',
  },
  about: {
    howItWorks: '仕組み',
    howItWorksTitle: 'Earthquake Signal の仕組み',
    howItWorksIntro:
      'Earthquake Signal は Earthquake Network モバイルアプリのデスクトップ版です。スマートフォン不要で同じ地震警報を受信します。',
    howItWorksSteps: {
      step1: '地図上で位置を選択 — 通知を受け取りたい場所を設定します。',
      step2: 'アプリが選択位置を Earthquake Network サーバーに登録します。',
      step3:
        '2つの警報チャンネルに登録：Global（全世界）と、お住まいの位置を中心とした 10×10 度のローカルゾーンです。',
      step4:
        '地震観測所が地震を検知すると、Earthquake Network サーバーから Firebase 経由で数秒以内にプッシュメッセージがコンピューターに届きます。',
      step5: '地震が地図上に表示されます。マグニチュード、推定揺れ、距離、深さを確認できます。',
      step6:
        'すべての地震データはコンピューターに保存されます。アカウント不要、個人情報も不要 — 座標とランダムなデバイスIDのみが共有されます。',
    },
  },
  errors: {
    generic: '問題が発生しました。',
  },
} as const

export default ja
