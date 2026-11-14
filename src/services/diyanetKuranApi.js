// src/services/diyanetKuranApi.js
// v6: arabic alan adı daha esnek, id her zaman eşsiz (verseKey), debug log

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://acikkaynakkuran-dev.diyanet.gov.tr';
const CACHE_PREFIX = '@quran/diyanet/v6/';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;

export const DIYANET_LIMITATIONS = {
  maxVersesPerSurah: 9,
  maxPages: 30,
  maxJuz: 1,
  disclaimer: 'Diyanet geliştirme API\'si sure başına yalnızca ilk 9 ayeti döndürür.',
};

export const SURAH_LIST_ENDPOINTS = ['/api/v1/chapters'];
export const SURAH_VERSES_ENDPOINTS = (n) => [`/api/v1/chapters/${n}`];

async function fetchWithTimeout(url, apiKey, options = {}) {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try { controller.abort(); } catch {}
  }, timeoutMs);
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => {
      try { controller.abort(); } catch {}
    }, { once: true });
  }
  try {
    if (DEBUG) console.log('[Diyanet] →', url);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (DEBUG) console.log('[Diyanet] ←', res.status, res.statusText || '');
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`HTTP ${res.status}${res.statusText ? ' ' + res.statusText : ''}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    const text = await res.text();
    if (!text || text.length === 0) {
      const err = new Error('Boş yanıt');
      err.status = 204;
      throw err;
    }
    if (DEBUG) console.log('[Diyanet] yanıt boyutu:', text.length, 'bytes');
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('JSON parse hatası');
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Date.now() - parsed.timestamp < CACHE_TTL) return parsed.value;
  } catch {}
  return null;
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), value }));
  } catch {}
}

function pickField(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  }
  return '';
}

const ARRAY_KEYS = [
  'Ayets', 'Ayetler', 'ayets', 'ayetler', 'AyetListesi',
  'verses', 'chapters', 'surahs', 'items', 'result', 'data',
];

function extractArray(json) {
  if (!json) return null;
  if (Array.isArray(json)) return json;
  for (const k of ARRAY_KEYS) {
    if (Array.isArray(json[k])) return json[k];
  }
  if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
    for (const k of ARRAY_KEYS) {
      if (Array.isArray(json.data[k])) return json.data[k];
    }
  }
  if (Array.isArray(json.data)) return json.data;
  return null;
}

/* ================================================================
   Ayet normalizasyonu — index fallback
   ================================================================ */
function normalizeVerse(item, surahId, fallbackNumber) {
  if (!item || typeof item !== 'object') return null;

  // 1) Ayet numarası — birçok olası alan
  const rawNumber = pickField(
    item,
    'AyetNo', 'ayetNo', 'AyetNumarasi', 'ayetNumarasi', 'AyetSira', 'Sira',
    'verseNumber', 'verse_number', 'ayet_no', 'number', 'no', 'index',
  );

  let number = Number(rawNumber);
  if (!Number.isFinite(number) || number <= 0) {
    // API'den ayet no gelmediyse array index'ini kullan
    number = fallbackNumber || 1;
  }

  // 2) Arapça metin — ÇOK GENİŞ
  const arabic = pickField(
    item,
    'Arapca', 'Arabca', 'Arapça', 'ArabcaMetin', 'ArapcaMetin',
    'AyetArapca', 'AyetMetni', 'Metin', 'metin',
    'ArabicText', 'arabicText', 'arabic', 'text_arabic', 'textArabic',
    'Arabic', 'Ayet', 'ayet', 'verse', 'Verse',
    'Kuran', 'Quran',
  );

  // 3) Latin okunuş
  const latin = pickField(
    item,
    'Okunus', 'okunus', 'LatinOkunus', 'LatinMetin', 'Okunuş',
    'transcription', 'latin', 'Latin', 'textLatin', 'text_latin', 'latinText',
  );

  // 4) Türkçe meal
  const translationRaw = pickField(
    item,
    'Meal', 'meal', 'Turkce', 'turkce', 'Türkçe', 'TurkceMeal', 'TürkçeMeal',
    'MealText', 'mealText', 'Aciklama', 'aciklama',
    'translation', 'turkish', 'textTurkish', 'text_turkish', 'text',
  );

  const translation =
    translationRaw && typeof translationRaw === 'object'
      ? pickField(translationRaw, 'text', 'meal', 'turkish', 'turkce', 'value')
      : String(translationRaw ?? '');

  // 5) En az bir içerik olmalı
  if (!arabic && !translation) return null;

  const verseKey = `${surahId}:${number}`;

  return {
    id: verseKey,                    // HER ZAMAN EŞSİZ
    number,
    verseKey,
    arabic: String(arabic ?? ''),
    latin: String(latin ?? ''),
    translation: String(translation ?? ''),
    footnotes: [],
    words: [],
    relatedVerses: [],
    source: 'diyanet',
  };
}

async function tryEndpoints(endpoints, apiKey, options = {}) {
  const attempts = [];
  let lastError = null;
  for (const path of endpoints) {
    const url = `${BASE_URL}${path}`;
    try {
      const json = await fetchWithTimeout(url, apiKey, options);
      const arr = extractArray(json);
      if (arr && arr.length > 0) {
        if (DEBUG) console.log('[Diyanet] ✓ ÇALIŞAN ENDPOINT:', path);
        return { path, json, array: arr, attempts };
      }
      attempts.push({ path, status: 200, result: 'empty or unrecognized' });
      if (DEBUG) {
        console.warn('[Diyanet] ⚠ 200 ama dizi yok:', path);
        console.warn('[Diyanet] JSON anahtarları:', json ? Object.keys(json) : 'null');
        if (json?.data && typeof json.data === 'object') {
          console.warn('[Diyanet] data anahtarları:', Object.keys(json.data));
        }
      }
    } catch (e) {
      const status = e?.status || 'ERR';
      attempts.push({ path, status, error: e?.message });
      lastError = e;
      if (DEBUG) console.log(`[Diyanet] ✗ ${path} → ${status} ${e?.message || ''}`);
      if (status === 401 || status === 403) {
        const err = new Error(
          status === 401
            ? 'API anahtarı geçersiz veya eksik (401).'
            : 'API anahtarı bu içeriğe erişim yetkisi vermiyor (403).',
        );
        err.status = status;
        err.attempts = attempts;
        throw err;
      }
    }
  }
  const summary = attempts.map((a) => `  ${a.path} → ${a.status}${a.error ? ` (${a.error})` : ''}`).join('\n');
  const err = new Error(`Hiçbir endpoint yanıt vermedi.\n\nDenenen endpoint'ler:\n${summary}`);
  err.attempts = attempts;
  throw err;
}

export async function testConnection(apiKey) {
  if (!apiKey || apiKey.length < 10) {
    return { ok: false, message: 'API anahtarı çok kısa (min 10 karakter)' };
  }
  try {
    const { path, array } = await tryEndpoints(SURAH_LIST_ENDPOINTS, apiKey);
    return { ok: true, message: `Bağlantı OK — ${array.length} sure döndü`, path, sample: array[0] };
  } catch (e) {
    return { ok: false, message: e?.message || 'Bağlantı başarısız', attempts: e?.attempts, status: e?.status };
  }
}

export async function fetchSurahList(apiKey, options = {}) {
  if (!apiKey) throw new Error('Diyanet API anahtarı eksik.');
  const cacheKey = `${CACHE_PREFIX}list`;
  const cached = await readCache(cacheKey);
  if (cached) return cached;
  const { array: arr } = await tryEndpoints(SURAH_LIST_ENDPOINTS, apiKey, options);
  const surahs = arr.map((s) => ({
    id: Number(pickField(s, 'SureId', 'sureId', 'id', 'chapterId', 'chapter_id', 'sureNo', 'number', 'surah_id')),
    name: String(pickField(s, 'SureNameTurkish', 'sureNameTurkish', 'SureAdi', 'sureAdi', 'name', 'chapterName', 'ad', 'isim')),
    verseCount: Number(pickField(s, 'AyetCount', 'ayetCount', 'AyetSayisi', 'ayetSayisi', 'verseCount', 'verse_count', 'count')),
  })).filter((s) => Number.isFinite(s.id) && s.id >= 1 && s.id <= 114);
  if (DEBUG) console.log(`[Diyanet] Sure listesi: ${surahs.length} sure (ham: ${arr.length})`);
  await writeCache(cacheKey, surahs);
  return surahs;
}

/* ================================================================
   SURE AYETLERİ — index tabanlı fallback
   ================================================================ */
export async function fetchSurahVerses(surahNumber, apiKey, options = {}) {
  if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new Error('Geçersiz sure numarası.');
  }
  if (!apiKey) throw new Error('Diyanet API anahtarı eksik.');

  const cacheKey = `${CACHE_PREFIX}surah_${surahNumber}`;
  const cached = await readCache(cacheKey);
  if (cached) {
    if (DEBUG) console.log('[Diyanet] cache hit:', surahNumber);
    return cached;
  }

  const { array: arr, path } = await tryEndpoints(
    SURAH_VERSES_ENDPOINTS(surahNumber),
    apiKey,
    options,
  );

  if (DEBUG) {
    console.log(`[Diyanet] sure ${surahNumber} endpoint: ${path}`);
    // İlk ham ayetin tam yapısını logla — şema teşhisi için
    console.log('[Diyanet] HAM ilk ayet:', JSON.stringify(arr[0]).slice(0, 600));
    if (arr[0]) {
      console.log('[Diyanet] HAM ilk ayet anahtarları:', Object.keys(arr[0]));
    }
  }

  const verses = arr
    .map((item, index) => normalizeVerse(item, surahNumber, index + 1))
    .filter(Boolean);

  if (verses.length === 0) {
    throw new Error(
      `Diyanet API: sure ${surahNumber} için geçerli ayet bulunamadı (${arr.length} ham).`,
    );
  }

  if (DEBUG) {
    console.log(
      `[Diyanet] ${surahNumber} → ${verses.length} ayet ` +
      `(limit: ${DIYANET_LIMITATIONS.maxVersesPerSurah})`,
    );
    console.log('[Diyanet] Normalize ilk ayet:', JSON.stringify(verses[0]));
  }

  await writeCache(cacheKey, verses);
  return verses;
}

export async function clearDiyanetKuranCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (targets.length) await AsyncStorage.multiRemove(targets);
    return targets.length;
  } catch {
    return 0;
  }
}