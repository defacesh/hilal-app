// src/theme/homeThemes.js
//
// Ana Sayfa Düzen Temaları
// ============================================================
// Her tema; kendi hero'sunu, hangi bölümlerin gösterileceğini ve
// bölüm sırasını tanımlar. HomeScreen bu dosyadaki tanımları okuyup
// hangi bileşeni nasıl göstereceğine karar verir.
//
// Yeni tema eklemek için:
//   1. Aşağıdaki listeye yeni bir obje ekleyin
//   2. HomeScreen'de ilgili 'hero' bileşenini hazırlayın
//      (klasik hero'yu kullanacaksanız 'classic' bırakın)
//   3. Store'daki VALID_HOME_LAYOUT_THEMES bu dosyadan otomatik
//      olarak türetildiği için ekstra bir şey yapmanız gerekmez.

/**
 * Kullanılabilir anasayfa düzen temaları.
 * Her tema, Layout konfigürasyonu ile birlikte gelir.
 */
export const HOME_LAYOUT_THEMES = [
  {
    id: 'classic',
    name: 'Klasik Modern',
    icon: 'grid-outline',
    desc: 'Dengeli ve zengin görünüm',

    // Layout konfigürasyonu
    hero: 'classic',                // hangi hero bileşeni kullanılacak
    showPrayerStrip: true,          // yatay vakit şeridi
    showProgress: true,             // günlük ilerleme çubuğu
    showQuickActions: true,         // keşfet butonları
    quickActionsVariant: 'labeled', // 'labeled' | 'icons' | 'none'
    showDailyNames: true,           // günün isimleri
    showSpiritual: true,            // ayet / dua / esma
    showHeaderInfo: true,           // karşılama + konum + tarih
    spiritualFirst: false,          // manevi içerik en üstte mi?
    scrollPaddingTop: 8,            // ScrollView üst boşluk
    sectionGap: 0,                  // ekstra bölüm aralığı
  },
  {
    id: 'minimal',
    name: 'Sade Vakit',
    icon: 'speedometer-outline',
    desc: 'Dev saat ve geri sayım',
    hero: 'minimal',
    showPrayerStrip: false,
    showProgress: false,
    showQuickActions: true,
    quickActionsVariant: 'icons',
    showDailyNames: false,
    showSpiritual: false,
    showHeaderInfo: true,
    spiritualFirst: false,
    scrollPaddingTop: 8,
    sectionGap: 32,
  },
  {
    id: 'spiritual',
    name: 'Manevi Odak',
    icon: 'book-open-outline',
    desc: 'Ayet, dua ve içerik öncelikli',
    hero: 'spiritual',
    showPrayerStrip: false,
    showProgress: false,
    showQuickActions: true,
    quickActionsVariant: 'labeled',
    showDailyNames: true,
    showSpiritual: true,
    showHeaderInfo: false,
    spiritualFirst: true,
    scrollPaddingTop: 8,
    sectionGap: 24,
  },
  {
    id: 'timeline',
    name: 'Vakit Akışı',
    icon: 'git-commit-outline',
    desc: 'Yatay zaman çizgisi',
    hero: 'timeline',
    showPrayerStrip: false,
    showProgress: false,
    showQuickActions: true,
    quickActionsVariant: 'labeled',
    showDailyNames: true,
    showSpiritual: true,
    showHeaderInfo: true,
    spiritualFirst: false,
    scrollPaddingTop: 8,
    sectionGap: 20,
  },
  {
    id: 'zen',
    name: 'Sadelik',
    icon: 'leaf-outline',
    desc: 'Sadece sıradaki vakit',
    hero: 'zen',
    showPrayerStrip: false,
    showProgress: false,
    showQuickActions: false,
    quickActionsVariant: 'none',
    showDailyNames: false,
    showSpiritual: false,
    showHeaderInfo: false,
    spiritualFirst: false,
    scrollPaddingTop: 0,
    sectionGap: 0,
  },
];

export const DEFAULT_HOME_LAYOUT_THEME = 'classic';

/**
 * Geriye dönük uyumluluk için — eski kod HOME_LAYOUT_MODES
 * adıyla import ediyordu. Şimdi ana kaynak HOME_LAYOUT_THEMES
 * olsa da, eski import'ları bozmayalım diye koruyoruz.
 */
export const HOME_LAYOUT_MODES = HOME_LAYOUT_THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  icon: t.icon,
  desc: t.desc,
}));

/** Tema ID listesi — doğrulama için kullanılır. */
export const HOME_LAYOUT_THEME_IDS = HOME_LAYOUT_THEMES.map((t) => t.id);

/**
 * Bir layout temasının geçerli olup olmadığını kontrol eder.
 * @param {string} id
 * @returns {boolean}
 */
export const isValidHomeLayoutTheme = (id) =>
  HOME_LAYOUT_THEMES.some((t) => t.id === id);

/**
 * Bir layout temasının tam konfigürasyonunu döndürür.
 * Geçersiz ID verilirse varsayılan temaya düşer.
 * @param {string} id
 * @returns {typeof HOME_LAYOUT_THEMES[0]}
 */
export const getHomeLayoutTheme = (id) =>
  HOME_LAYOUT_THEMES.find((t) => t.id === id) || HOME_LAYOUT_THEMES[0];

/**
 * Layout temasına göre bölüm render sırasını döndürür.
 * HomeScreen'de sıralı render yapmak için kullanılabilir.
 *
 * @param {string} layoutId
 * @returns {Array<string>}
 */
export const getHomeSectionOrder = (layoutId = DEFAULT_HOME_LAYOUT_THEME) => {
  switch (layoutId) {
    case 'minimal':
      return ['hero', 'prayerStrip', 'quickActions'];

    case 'spiritual':
      return ['spiritualContent', 'hero', 'prayerStrip', 'dailyNames', 'quickActions'];

    case 'timeline':
      return ['hero', 'quickActions', 'dailyNames', 'spiritualContent'];

    case 'zen':
      return ['hero'];

    case 'classic':
    default:
      return ['hero', 'prayerStrip', 'quickActions', 'dailyNames', 'spiritualContent'];
  }
};

/**
 * Temanın okunabilir etiketi (bildirim / toast için).
 * @param {string} id
 * @returns {string}
 */
export const getHomeLayoutLabel = (id) =>
  getHomeLayoutTheme(id).name;