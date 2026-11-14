// src/services/acikKuranApi.js
// Açık Kuran API — https://api.acikkuran.com
// v2: fallback URL, dedup, comprehensive logging, boş yanıt kontrolü

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.acikkuran.com';
const CACHE_PREFIX = '@quran/acikkuran/v2/';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;

export const DEFAULT_AUTHOR_ID = 105;

/* ================================================================
   In-flight dedup — aynı anda iki GET gitmesin
   ================================================================ */
const inflightRequests = new Map();

function dedupedRequest(key, factory) {
  if (inflightRequests.has(key)) {
    if (DEBUG) console.log('[Açık Kuran] dedup — önceki istek kullanılıyor:', key);
    return inflightRequests.get(key);
  }
  const promise = factory().finally(() => {
    inflightRequests.delete(key);
  });
  inflightRequests.set(key, promise);
  return promise;
}

/* ================================================================
   Timeout + race + log
   ================================================================ */
async function fetchWithTimeout(url, { signal, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  if (DEBUG) console.log('[Açık Kuran] →', url);

  const controller = new AbortController();

  const doAbort = () => {
    try {
      if (typeof controller.abort === 'function') controller.abort();
    } catch {}
  };

  // Timeout promise — race ile garanti rejection
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      if (DEBUG) console.warn('[Açık Kuran] ⏱ timeout', timeoutMs, 'ms', url);
      doAbort();
      reject(new Error(`Açık Kuran: ${Math.round(timeoutMs / 1000)} sn içinde yanıt gelmedi`));
    }, timeoutMs);
  });

  // Dış signal dinle
  const onExternalAbort = () => {
    if (DEBUG) console.log('[Açık Kuran] ⨯ iptal', url);
    doAbort();
  };
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new Error('Açık Kuran: istek iptal edildi');
    }
    if (typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    const fetchPromise = fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    const res = await Promise.race([fetchPromise, timeoutPromise]);

    if (DEBUG) console.log('[Açık Kuran] ←', res.status, url);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const short = body ? body.slice(0, 150).replace(/\s+/g, ' ') : '';
      throw new Error(
        `Açık Kuran HTTP ${res.status}${short ? `: ${short}` : ''}`,
      );
    }

    // res.json() yerine text + JSON.parse — daha güvenli
    const text = await res.text();
    if (DEBUG) {
      console.log('[Açık Kuran] yanıt boyutu:', text.length, 'bytes');
      if (text.length < 500) {
        console.log('[Açık Kuran] küçük yanıt örneği:', text);
      } else {
        console.log('[Açık Kuran] yanıt ilk 200:', text.slice(0, 200));
      }
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Açık Kuran: yanıt JSON değil');
    }
  } catch (e) {
    if (DEBUG) {
      console.warn('[Açık Kuran] ✗ fetch hatası:', e?.name, '—', e?.message, url);
    }
    throw e;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (signal && typeof signal.removeEventListener === 'function') {
      signal.removeEventListener('abort', onExternalAbort);
    }
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
    if (parsed && Date.now() - parsed.timestamp < CACHE_TTL) {
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
   Normalizasyon
   ================================================================ */
function stripFootnotes(text) {
  return String(text ?? '').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeVerse(verse, surahId) {
  const translation = verse?.translation || {};
  const raw = translation.text || '';
  const footnotes = Array.isArray(translation.footnotes)
    ? translation.footnotes.map((fn) => ({
        id: fn.id,
        number: fn.number,
        text: fn.text,
      }))
    : [];

  return {
    id: verse.id,
    number: verse.verse_number,
    verseKey: `${surahId}:${verse.verse_number}`,
    arabic: verse.verse || '',
    latin: verse.transcription || '',
    translation: stripFootnotes(raw),
    translationRaw: raw,
    footnotes,
    words: [],
    relatedVerses: [],
    source: 'acikkuran',
  };
}

function normalizeWord(part) {
  return {
    id: part.id,
    position: part.sort_number,
    arabic: part.arabic || '',
    transliteration: part.transcription_tr || part.transcription_en || '',
    translationTR: part.translation_tr || null,
    translationOriginal: part.translation_en || '',
    root: part.root || null,
    details: part.details || null,
  };
}

/* ================================================================
   Response doğrulama — hem `data.verses` hem `verses` kabul et
   ================================================================ */
function extractVersesArray(json) {
  if (!json) return null;

  // Format 1 (docs): { data: { verses: [...] } }
  if (json.data && Array.isArray(json.data.verses)) return json.data.verses;

  // Format 2 (belki değişti): { verses: [...] }
  if (Array.isArray(json.verses)) return json.verses;

  // Format 3: doğrudan array
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json)) return json;

  // Format 4: data bir obje ama verses yok — data'nın kendisi tek ayet olabilir
  if (json.data && typeof json.data === 'object' && json.data.verse) {
    return [json.data];
  }

  return null;
}

/* ================================================================
   Public — tam sure
   ================================================================ */
export async function fetchSurahVerses(surahNumber, options = {}) {
  const {
    authorId,
    signal,
    withWords = false,
  } = options;

  if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new Error('Geçersiz sure numarası.');
  }

  const cacheKey = `${CACHE_PREFIX}surah_${surahNumber}_${authorId ?? 'default'}${
    withWords ? '_w' : ''
  }`;

  // 1. Cache
  const cached = await readCache(cacheKey);
  if (cached) {
    if (DEBUG) console.log('[Açık Kuran] cache hit:', surahNumber);
    return cached;
  }

  // 2. Denenecek URL listesi — önce default (author yok), sonra ?author
  const urls = [
    {
      url: `${API_BASE}/surah/${surahNumber}`,
      label: 'default',
    },
  ];
  if (authorId) {
    urls.push({
      url: `${API_BASE}/surah/${surahNumber}?author=${authorId}`,
      label: `author=${authorId}`,
    });
  }

  let lastError = null;

  for (const { url, label } of urls) {
    try {
      const json = await dedupedRequest(url, () =>
        fetchWithTimeout(url, { signal }),
      );

      const versesArray = extractVersesArray(json);

      if (versesArray == null) {
        if (DEBUG) {
          console.warn(
            '[Açık Kuran] beklenmeyen yanıt şekli (' + label + ')',
            '— keys:',
            json ? Object.keys(json) : 'null',
            json?.data ? '— data keys: ' + Object.keys(json.data).join(',') : '',
          );
        }
        lastError = new Error(
          `Açık Kuran (${label}): yanıt şekli tanınmadı`,
        );
        continue; // sonraki URL'yi dene
      }

      if (versesArray.length === 0) {
        if (DEBUG) console.warn('[Açık Kuran] boş verses dizisi (' + label + ')');
        lastError = new Error(`Açık Kuran (${label}): boş yanıt`);
        continue; // sonraki URL'yi dene
      }

      // Başarılı
      if (DEBUG) {
        console.log(
          `[Açık Kuran] ✓ ${surahNumber} → ${versesArray.length} ayet (${label})`,
        );
      }

      const verses = versesArray.map((v) => normalizeVerse(v, surahNumber));

      // WBW isteğe bağlı (pahalı)
      if (withWords) {
        if (DEBUG) console.log(`[Açık Kuran] ${surahNumber} için WBW yükleniyor…`);
        await Promise.all(
          verses.map(async (verse) => {
            try {
              const words = await fetchVerseWords(surahNumber, verse.number, {
                signal,
              });
              verse.words = words;
            } catch (e) {
              if (DEBUG) {
                console.warn(
                  `[Açık Kuran] ${verse.verseKey} kelimeler alınamadı:`,
                  e?.message,
                );
              }
            }
          }),
        );
      }

      await writeCache(cacheKey, verses);
      return verses;
    } catch (e) {
      if (DEBUG) {
        console.warn(`[Açık Kuran] URL başarısız (${label}):`, e?.message);
      }
      lastError = e;

      // Abort ise daha fazla denemeye gerek yok
      if (e?.message?.includes('iptal')) {
        throw e;
      }
    }
  }

  // Hiçbir URL çalışmadı
  throw (
    lastError ||
    new Error('Açık Kuran: tüm denemeler başarısız oldu')
  );
}

/* ================================================================
   Public — tek ayet WBW
   ================================================================ */
export async function fetchVerseWords(surahNumber, verseNumber, options = {}) {
  const { signal } = options;
  const key = `${CACHE_PREFIX}words_${surahNumber}_${verseNumber}`;

  const cached = await readCache(key);
  if (cached) return cached;

  const url = `${API_BASE}/surah/${surahNumber}/verse/${verseNumber}/verseparts`;

  const json = await dedupedRequest(url, () =>
    fetchWithTimeout(url, { signal }),
  );

  const wordsArr = Array.isArray(json?.data) ? json.data : [];
  if (wordsArr.length === 0) return [];

  const words = wordsArr.map(normalizeWord);
  await writeCache(key, words);
  return words;
}

/* ================================================================
   Public — meal yazarları
   ================================================================ */
let cachedAuthors = null;

export async function fetchAuthors(options = {}) {
  if (cachedAuthors) return cachedAuthors;

  const key = `${CACHE_PREFIX}authors`;
  const cached = await readCache(key);
  if (cached) {
    cachedAuthors = cached;
    return cached;
  }

  const url = `${API_BASE}/authors`;
  const json = await fetchWithTimeout(url, { signal: options.signal });
  if (!json?.data || !Array.isArray(json.data)) return [];

  const authors = json.data.filter((a) => a.language === 'tr');
  cachedAuthors = authors;
  await writeCache(key, authors);
  return authors;
}

/* ================================================================
   Public — cache temizle
   ================================================================ */
export async function clearAcikKuranCache() {
  inflightRequests.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (targets.length) await AsyncStorage.multiRemove(targets);
    cachedAuthors = null;
    return targets.length;
  } catch {
    return 0;
  }
}