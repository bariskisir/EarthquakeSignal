/**
 * Turkish interface strings.
 */

import { earthquakeTr } from './earthquake'

const tr = {
  earthquake: earthquakeTr,
  app: {
    name: 'Earthquake Signal',
    tagline: 'Gerçek zamanlı deprem sinyalleri.',
  },
  common: {
    loading: 'Yükleniyor...',
    delete: 'Sil',
    rename: 'Yeniden adlandır',
    cancel: 'İptal',
  },
  nav: {
    sessions: 'Depremler',
    settings: 'Ayarlar',
  },
  sidebar: {
    hideSidebar: 'Depremleri gizle',
    showSidebar: 'Depremleri göster',
  },
  sessions: {
    newSession: 'Yeni deprem',
    renameSession: 'Depremi yeniden adlandır',
    deleteAll: 'Tüm depremleri sil',
    emptyTitle: 'Henüz deprem yok',
  },
  windowControls: {
    minimize: 'Simge durumuna küçült',
    maximize: 'Ekranı kapla',
    restore: 'Geri yükle',
    close: 'Kapat',
  },
  settings: {
    title: 'Ayarlar',
    general: 'Genel',
    display: 'Görünüm',
    updates: 'Güncellemeler',
    logging: 'Günlükleme',
    about: 'Hakkında',
    interfaceLanguage: 'Arayüz dili',
    interfaceLanguageDescription: 'Uygulamada kullanılan dili seçin.',
    timeFormat: 'Saat biçimi',
    timeFormatDescription: 'Deprem saatlerinin nasıl gösterileceğini seçin.',
    startOnStartup: 'Başlangıçta çalıştır',
    startOnStartupDescription:
      'Oturum açtığınızda Earthquake Signal uygulamasını sistem tepsisinde otomatik başlat.',
    timeFormats: {
      '24-hour': '24 saat',
      '12-hour': '12 saat',
    },
    displaySettings: 'Görünüm',
    theme: 'Tema',
    themeDescription: 'Uygulamanın renk temasını seçin.',
    navbarPosition: 'Gezinme konumu',
    navbarPositionDescription: 'Genel gezinmeyi sola veya üste yerleştirin.',
    navbarPositions: {
      left: 'Sol',
      top: 'Üst',
    },
    zoomSettings: 'Yakınlaştırma',
    pageZoom: 'Sayfa yakınlaştırma',
    pageZoomDescription: 'Uygulama arayüzünün boyutunu ayarlayın.',
    zoomOut: 'Uzaklaştır',
    zoomIn: 'Yakınlaştır',
    resetZoom: 'Yakınlaştırmayı sıfırla',
    traySettings: 'Sistem tepsisi',
    showTrayIcon: 'Tepsi simgesini göster',
    showTrayIconDescription: 'Earthquake Signal uygulamasını sistem tepsisinde göster.',
    minimizeToTrayOnClose: 'Kapatırken tepsiye küçült',
    minimizeToTrayOnCloseDescription: 'Pencere kapandığında uygulamayı çalışır durumda tut.',
    trayUnavailable: 'Sistem tepsisi bütünleştirmesi Linux üzerinde kullanılamıyor.',
    alwaysOnTop: 'Her zaman üstte',
    checkUpdatesOnStartup: 'Başlangıçta güncellemeleri denetle',
    checkUpdatesOnStartupDescription:
      'Uygulama açıldığında GitHub üzerinde yeni Earthquake Signal sürümünü denetle.',
    checkUpdates: 'Şimdi denetle',
    checking: 'Güncellemeler denetleniyor...',
    upToDate: 'Uygulama güncel.',
    updateAvailable: '{{version}} sürümü kullanılabilir.',
    downloading: 'Güncelleme indiriliyor... %{{percent}}',
    readyToInstall: '{{version}} sürümü kurulmaya hazır.',
    installNow: 'Kur ve yeniden başlat',
    openDownloadPage: 'İndirme sayfasını aç',
    releaseNotes: 'Sürüm notları',
    updateError: 'Güncelleme denetimi başarısız oldu.',
    version: 'Sürüm {{version}}',
    logLevel: 'Günlük düzeyi',
    logLevelDescription: 'Uygulama günlüklerinin ayrıntı düzeyini belirleyin.',
    logFiles: 'Günlük dosyaları',
    logFilesDescription: 'Uygulama günlük dosyalarının bulunduğu klasörü açın.',
    openLogs: 'Aç',
    logLevels: {
      error: 'Hata',
      warn: 'Uyarı',
      info: 'Bilgi',
      debug: 'Hata ayıklama',
      verbose: 'Ayrıntılı',
    },
    author: 'Geliştirici',
    sourceCode: 'Kaynak kodu',
  },
  locales: {
    en: 'İngilizce',
    tr: 'Türkçe',
    de: 'Almanca',
    fr: 'Fransızca',
    pt: 'Portekizce',
    zh: 'Çince',
    es: 'İspanyolca',
    ru: 'Rusça',
    ja: 'Japonca',
    ko: 'Korece',
  },
  themes: {
    system: 'Sistem',
    light: 'Açık',
    dark: 'Koyu',
  },
  errors: {
    generic: 'Bir hata oluştu.',
  },
  about: {
    howItWorks: 'Nasıl çalışır',
    howItWorksTitle: 'Earthquake Signal nasıl çalışır',
    howItWorksIntro:
      'Earthquake Signal, Earthquake Network mobil uygulamasının masaüstü sürümüdür. Aynı deprem bildirimlerini alır — telefon gerekmez.',
    howItWorksSteps: {
      step1: 'Haritadan konumunuzu seçin — nerede bildirim almak istediğinizi belirleyin.',
      step2: 'Uygulama, konumunuzu Earthquake Network sunucusuna kaydeder.',
      step3:
        'İki uyarı kanalına üye olur: Global (dünya çapında) ve konumunuzu merkez alan 10×10 derecelik yerel bölge.',
      step4:
        'Sismik istasyonlar bir deprem tespit ettiğinde, Earthquake Network sunucusundan Firebase üzerinden bilgisayarınıza saniyeler içinde bir anlık mesaj ulaşır.',
      step5:
        'Deprem haritanızda belirir. Büyüklük, tahmini sarsıntı, mesafe ve derinlik bilgilerini görürsünüz.',
      step6:
        'Tüm deprem verileri bilgisayarınızda saklanır. Hesap gerekmez, kişisel bilgi paylaşılmaz — yalnızca koordinatlarınız ve rastgele bir cihaz kimliği sunucuyla paylaşılır.',
    },
  },
} as const

export default tr
