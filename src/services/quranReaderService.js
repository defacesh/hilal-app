// src/services/quranReaderService.js
// 5 kaynak arasında birleştirici arayüz

import * as OfflineApi from './quranOfflineApi';
import * as QuranComApi from './quranWordByWordApi';
import * as ApacikApi from './apacikKuranApi';
import * as AcikKuranApi from './acikKuranApi';
import * as DiyanetApi from './diyanetKuranApi';

/* ================================================================
   Kaynak tanımları
   ================================================================ */
export const QURAN_SOURCES = {
  offline: {
    id: 'offline',
    label: 'Çevrimdışı Kur\'an',
    description: 'Diyanet meali · İnternet gerekmez · tam metin',
    wordByWord: false,
    latin: false,
    footnotes: false,
    attribution:
      'Kur\'an-ı Kerim · Diyanet İşleri Başkanlığı meali · cihaza gömülü',
    requiresApiKey: false,
    isOffline: true,
  },
  qurancom: {
    id: 'qurancom',
    label: 'Quran.com',
    description: 'Diyanet meali + kelime kelime',
    wordByWord: true,
    latin: true,
    footnotes: false,
    attribution: 'Kur\'an-ı Kerim · Diyanet İşleri Başkanlığı meali',
    requiresApiKey: false,
  },
  diyanet: { // API anahtarı zorunluluğu sebebiyle kaldırmalıyız.
    id: 'diyanet',
    label: 'Diyanet (Beta)',
    description: 'Resmî API · sure başına 9 ayet',
    wordByWord: false,
    latin: true,
    footnotes: false,
    attribution:
      'Kur\'an-ı Kerim · T.C. Diyanet İşleri Başkanlığı · açık kaynak API',
    requiresApiKey: true,
    disclaimer:
      'Diyanet geliştirme API\'si sure başına yalnızca ilk 9 ayeti döndürür',
  },
  acikkuran: {
    id: 'acikkuran',
    label: 'Açık Kuran',
    description: 'Erhan Aktaş meali + dipnotlar',
    wordByWord: false,
    latin: true,
    footnotes: true,
    attribution:
      'Kur\'an-ı Kerim · Erhan Aktaş (Kerim Kur\'an) meali · açık kaynak',
    requiresApiKey: false,
  },
  apacik: {
    id: 'apacik',
    label: 'Apaçık Kuran',
    description: 'Şinasi Güneş meali',
    wordByWord: false,
    latin: true,
    footnotes: false,
    attribution: 'Kur\'an-ı Kerim · Şinasi Güneş meali · Apaçık Kuran',
    requiresApiKey: false,
  },
};

// FİLTRE YOK — 5 kaynak da her build'de görünür
export const QURAN_SOURCE_LIST = Object.values(QURAN_SOURCES);

export function getSourceInfo(sourceId) {
  return QURAN_SOURCES[sourceId] || QURAN_SOURCES.offline;
}

/* ================================================================
   Birleşik fetch
   ================================================================ */
export async function fetchSurahVerses(sourceId, surahNumber, options = {}) {
  const source = getSourceInfo(sourceId);

  // Offline — bundled JSON'dan okur, internet gerekmez
  if (source.id === 'offline') {
    return await OfflineApi.fetchSurahVerses(surahNumber);
  }

  // Apaçık Kuran
  if (source.id === 'apacik') {
    return await ApacikApi.fetchSurahVerses(surahNumber);
  }

  // Açık Kuran
  if (source.id === 'acikkuran') {
    return await AcikKuranApi.fetchSurahVerses(surahNumber, {
      authorId: options.authorId ?? AcikKuranApi.DEFAULT_AUTHOR_ID,
      signal: options.signal,
      withWords: options.withWords === true,
    });
  }

  // Diyanet resmî API (Beta)
  if (source.id === 'diyanet') {
    if (!options.apiKey) {
      throw new Error(
        'Diyanet API anahtarı gerekli.\n\n' +
        'Ayarlar → İbadet → Diyanet API Anahtarı bölümünden anahtarınızı ekleyin.',
      );
    }
    return await DiyanetApi.fetchSurahVerses(
      surahNumber,
      options.apiKey,
      { signal: options.signal },
    );
  }

  // qurancom (fallback)
  const verses = await QuranComApi.fetchSurahWordByWord(
    surahNumber,
    options.translationId ?? QuranComApi.DEFAULT_TRANSLATION_ID,
  );

  return verses.map((v) => ({
    ...v,
    latin: v.words.map((w) => w.transliteration).filter(Boolean).join(' '),
    relatedVerses: [],
    footnotes: [],
    source: 'qurancom',
  }));
}

/* ================================================================
   Cache temizleme
   ================================================================ */
export async function clearAllQuranCache() {
  const results = await Promise.all([
    QuranComApi.clearQuranCache().catch(() => 0),
    ApacikApi.clearApacikKuranCache().catch(() => 0),
    AcikKuranApi.clearAcikKuranCache().catch(() => 0),
    DiyanetApi.clearDiyanetKuranCache().catch(() => 0),
    OfflineApi.clearOfflineCache().catch(() => 0),
  ]);
  return results.reduce((sum, n) => sum + (n || 0), 0);
}