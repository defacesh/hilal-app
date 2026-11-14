// src/services/quranWordByWordApi.js
// Quran.com API v4 — kelime kelime Kur'an verisi (Türkçe çeviri desteğiyle)
// Cache: AsyncStorage, 30 gün TTL

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.quran.com/api/v4';
const CACHE_PREFIX = '@quran/wbw/v2/'; // Sürüm güncellendi (Türkçe map için)
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 gün
const REQUEST_TIMEOUT_MS = 15000;

// Diyanet İşleri Başkanlığı Türkçe meal ID'si (Quran.com'da 77)
export const DEFAULT_TRANSLATION_ID = 77;

/* ================================================================
   Sık Karşılaşılan Kelime Çevirileri Sözlüğü (İngilizce -> Türkçe)
   ================================================================ */
const TR_WORD_DICTIONARY = {
  'In the name of': 'Rahman ve Rahim olan Allah\'ın adıyla',
  'God': 'Allah',
  'Most Gracious': 'Rahman',
  'Most Merciful': 'Rahim',
  'Praise': 'Hamd',
  'be to': 'mahsustur',
  'Lord': 'Rabb',
  'the worlds': 'âlemlerin',
  'Master': 'Malik',
  'Day': 'Gün',
  'Judgment': 'Din (Hesap)',
  'You': 'Sadece Sen',
  'we worship': 'ibadet ederiz',
  'and': 've',
  'You': 'Sadece Senden',
  'we ask for help': 'yardım dileriz',
  'Guide': 'Hidayet et / İlet',
  'us': 'bizi',
  'the': 'o',
  'straight': 'dosdoğru',
  'path': 'yola',
  'Path': 'Yol',
  'of those': 'o kimselerin ki',
  'whom': 'üzerine',
  'You have bestowed': 'nimet verdin',
  'grace': 'nimet',
  'not': 'değil',
  'of those who': 'o kimseler ki',
  'earned wrath': 'gazaba uğrayanlar',
  'nor': 've de',
  'who go astray': 'sapıtanlar',
  'O': 'Ey',
  'who': 'ki o / kim',
  'believed': 'iman edenler',
  'say': 'de',
  'He is': 'O',
  'One': 'Birdir (Tektir)',
  'Eternal': 'Susamayan, her şeyin kendisine muhtaç olduğu',
  'Absolute': 'Samed',
  'He neither begets': 'O doğurmamıştır',
  'nor is born': 'doğrulmamıştır',
  'And there is none': 'Ve hiç kimse yoktur',
  'comparable': 'Ona denk',
  'to Him': 'O\'na',
};

function translateWord(englishText) {
  if (!englishText) return '';
  const trimmed = englishText.trim();
  if (TR_WORD_DICTIONARY[trimmed]) {
    return TR_WORD_DICTIONARY[trimmed];
  }
  return trimmed;
}

/* ================================================================
   HTML temizleme
   ================================================================ */
const stripHtml = (s) =>
  String(s ?? '')
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/* ================================================================
   Fetch
   ================================================================ */
async function fetchWithTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Quran.com HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ================================================================
   Normalizasyon ve Türkçe Çeviri Eşlemesi
   ================================================================ */
function normalizeVerse(verse) {
  const words = Array.isArray(verse?.words)
    ? verse.words
        .filter((w) => w && w.char_type_name !== 'end')
        .map((w, i) => {
          const rawTrans = stripHtml(w.translation?.text || '');
          // İngilizce gelen kelimeyi Türkçe sözlükle eşleştiriyoruz, yoksa ham halini bırakıyoruz
          const localizedTrans = translateWord(rawTrans);

          return {
            id: w.id,
            position: w.position ?? i + 1,
            arabic: stripHtml(w.text_uthmani || w.text || ''),
            transliteration: stripHtml(w.transliteration?.text || ''),
            translation: localizedTrans,
          };
        })
        .filter((w) => w.arabic)
    : [];

  const translationText =
    verse?.translations?.[0]?.text
      ? stripHtml(verse.translations[0].text)
      : '';

  return {
    id: verse.id,
    number: verse.verse_number,
    verseKey: verse.verse_key,
    arabic: stripHtml(verse.text_uthmani || ''),
    words,
    translation: translationText,
  };
}

/* ================================================================
   Kamu API
   ================================================================ */
export async function fetchSurahWordByWord(
  surahNumber,
  translationId = DEFAULT_TRANSLATION_ID,
) {
  if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new Error('Geçersiz sure numarası.');
  }

  const key = `${CACHE_PREFIX}${surahNumber}_${translationId}`;

  // 1. Cache
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Date.now() - parsed.timestamp < CACHE_TTL &&
        Array.isArray(parsed.verses) &&
        parsed.verses.length > 0
      ) {
        return parsed.verses;
      }
    }
  } catch {}

  // 2. API
  const url =
    `${API_BASE}/verses/by_chapter/${surahNumber}` +
    `?words=true&word_fields=text_uthmani,translation,transliteration` +
    `&translations=${translationId}&fields=text_uthmani`;

  const json = await fetchWithTimeout(url);

  if (!Array.isArray(json?.verses) || json.verses.length === 0) {
    throw new Error('Quran.com geçersiz yanıt döndürdü.');
  }

  const verses = json.verses.map(normalizeVerse);

  // 3. Cache'e yaz
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ timestamp: Date.now(), verses }),
    );
  } catch {}

  return verses;
}

/* ================================================================
   Son okunan pozisyon
   ================================================================ */
const LAST_POSITION_KEY = '@quran/last_position/v1';

export async function saveLastPosition(surahNumber, verseNumber) {
  try {
    await AsyncStorage.setItem(
      LAST_POSITION_KEY,
      JSON.stringify({
        surahNumber,
        verseNumber,
        timestamp: Date.now(),
      }),
    );
  } catch {}
}

export async function getLastPosition() {
  try {
    const raw = await AsyncStorage.getItem(LAST_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Number.isFinite(parsed.surahNumber) &&
      Number.isFinite(parsed.verseNumber)
    ) {
      return parsed;
    }
  } catch {}
  return null;
}

/* ================================================================
   Cache temizleme
   ================================================================ */
export async function clearQuranCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((k) => k.startsWith('@quran/'));
    if (targets.length > 0) await AsyncStorage.multiRemove(targets);
    return targets.length;
  } catch {
    return 0;
  }
}