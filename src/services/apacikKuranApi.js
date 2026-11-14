// src/services/apacikKuranApi.js
// Apaçık Kuran API — https://apacikkuran.com/api-dokumani
// Şinasi Güneş meali + Latin okunuş + Arapça

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://apacikkuran.com/api';
const CACHE_PREFIX = '@quran/apacik/v1/';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 gün
const REQUEST_TIMEOUT_MS = 15000;

const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;

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
    if (!res.ok) throw new Error(`Apaçık Kuran HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ================================================================
   Cache
   ================================================================ */
async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Date.now() - parsed.timestamp < CACHE_TTL &&
      parsed.value != null
    ) {
      return parsed.value;
    }
  } catch {}
  return null;
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ timestamp: Date.now(), value }),
    );
  } catch {}
}

/* ================================================================
   Normalizasyon — ortak format
   ================================================================ */
function normalizeVerse(item) {
  return {
    id: item.id,
    number: item.verse_number,
    verseKey: `${item.surah_id}:${item.verse_number}`,
    arabic: item.text_arabic || '',
    latin: item.text_latin || '',
    translation: item.text_turkish || '',
    words: [], // Apaçık Kuran kelime kelime desteklemiyor
    relatedVerses: Array.isArray(item.related_verses)
      ? item.related_verses
      : [],
    source: 'apacik',
  };
}

/* ================================================================
   Public API
   ================================================================ */
export async function fetchSurahVerses(surahNumber) {
  if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new Error('Geçersiz sure numarası.');
  }

  const key = `${CACHE_PREFIX}verses_${surahNumber}`;
  const cached = await readCache(key);
  if (cached) return cached;

  const url = `${API_BASE}/surahs/${surahNumber}/verses`;
  if (DEBUG) console.log('[Apaçık Kuran] GET', url);

  const json = await fetchWithTimeout(url);
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error('Apaçık Kuran geçersiz yanıt döndürdü.');
  }

  const verses = json.map(normalizeVerse);
  await writeCache(key, verses);

  if (DEBUG) {
    console.log(`[Apaçık Kuran] ${surahNumber} → ${verses.length} ayet`);
  }

  return verses;
}

export async function fetchSurahInfo(surahNumber) {
  const key = `${CACHE_PREFIX}info_${surahNumber}`;
  const cached = await readCache(key);
  if (cached) return cached;

  const url = `${API_BASE}/surahs/${surahNumber}`;
  const json = await fetchWithTimeout(url);
  await writeCache(key, json);
  return json;
}

export async function fetchSurahList(sort = 'general') {
  const key = `${CACHE_PREFIX}list_${sort}`;
  const cached = await readCache(key);
  if (cached) return cached;

  const url = `${API_BASE}/surahs?sort=${sort}`;
  const json = await fetchWithTimeout(url);
  if (!Array.isArray(json)) throw new Error('Geçersiz sure listesi.');
  await writeCache(key, json);
  return json;
}

export async function clearApacikKuranCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (targets.length > 0) await AsyncStorage.multiRemove(targets);
    return targets.length;
  } catch {
    return 0;
  }
}