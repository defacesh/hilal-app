// src/services/quranOfflineApi.js
// Bundled Çevrimdışı Kur'an — internet gerektirmez
// Kaynak: assets/quran/{1..114}.json (scripts/downloadQuran.js ile üretildi)

import {
  QURAN_BUNDLES,
  hasOfflineBundle,
  getOfflineBundle,
} from '../data/quranOfflineBundle';

const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;

/* ================================================================
   Public — sure ayetleri
   ================================================================ */
export async function fetchSurahVerses(surahNumber) {
  if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new Error('Geçersiz sure numarası.');
  }

  if (!hasOfflineBundle(surahNumber)) {
    throw new Error(
      `Çevrimdışı Kur'an paketi eksik (sure ${surahNumber}).\n` +
      'Geliştirici: node scripts/downloadQuran.js komutunu çalıştırın.',
    );
  }

  const bundle = getOfflineBundle(surahNumber);

  if (!bundle || !Array.isArray(bundle.verses) || bundle.verses.length === 0) {
    throw new Error(`Sure ${surahNumber} için geçerli veri bulunamadı.`);
  }

  const verses = bundle.verses.map((v) => ({
    id: `${surahNumber}:${v.n}`,
    number: v.n,
    verseKey: `${surahNumber}:${v.n}`,
    arabic: v.ar,
    latin: '',
    translation: v.tr,
    footnotes: [],
    words: [],
    relatedVerses: [],
    source: 'offline',
  }));

  if (DEBUG) {
    console.log(
      `[Offline] ${surahNumber} → ${verses.length} ayet (bundle)`,
    );
  }

  return verses;
}

/* ================================================================
   Public — sure listesi (bundle'dan)
   ================================================================ */
export async function fetchSurahList() {
  return Object.values(QURAN_BUNDLES)
    .filter(Boolean)
    .map((s) => ({
      id: s.number,
      name: s.name,
      nameTr: s.nameTr,
      verseCount: s.ayahCount,
    }))
    .sort((a, b) => a.id - b.id);
}

/* ================================================================
   Public — hazır mı?
   ================================================================ */
export function isOfflineAvailable() {
  return Boolean(QURAN_BUNDLES && QURAN_BUNDLES[1]);
}

export function getOfflineInfo() {
  const bundles = Object.values(QURAN_BUNDLES).filter(Boolean);
  const totalAyahs = bundles.reduce((sum, s) => sum + (s.ayahCount || 0), 0);
  return {
    surahCount: bundles.length,
    totalAyahs,
    ready: bundles.length === 114,
  };
}

export async function clearOfflineCache() {
  // Bundle-based olduğu için temizlenecek bir şey yok
  return 0;
}