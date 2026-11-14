// src/services/quranApi.js
// AlQuran Cloud — Türkçe meal için birincil kaynak
// v3: retry + timeout + signal + batch + memory cache + stale fallback + prefetch

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_MEAL_EDITION } from '../data/vakitContent';

const API_BASE = 'https://api.alquran.cloud/v1';
const CACHE_PREFIX = 'nida:quran:v3:';
const LEGACY_CACHE_PREFIXES = ['nida:quran:v1:', 'nida:quran:v2:'];
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 gün
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 3;
const MEMORY_CACHE_LIMIT = 200;

const ARABIC_EDITION = 'quran-uthmani';
const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;

/* ================================================================
   Bellek cache — LRU benzeri basit Map
   ================================================================ */
const memoryCache = new Map();
const memoryKeys = [];

function memGet(key) {
  return memoryCache.get(key) ?? null;
}

function memSet(key, value) {
  if (!memoryCache.has(key)) memoryKeys.push(key);
  memoryCache.set(key, value);
  while (memoryKeys.length > MEMORY_CACHE_LIMIT) {
    const old = memoryKeys.shift();
    memoryCache.delete(old);
  }
}

function memClearAll() {
  memoryCache.clear();
  memoryKeys.length = 0;
}

/* ================================================================
   AsyncStorage cache
   ================================================================ */
async function readCacheRecord(key) {
  try {
    let raw = await AsyncStorage.getItem(key);

    // Eski sürümlerle uyumluluk
    if (!raw && key.startsWith(CACHE_PREFIX)) {
      for (const legacy of LEGACY_CACHE_PREFIXES) {
        const legacyKey = key.replace(CACHE_PREFIX, legacy);
        // eslint-disable-next-line no-await-in-loop
        raw = await AsyncStorage.getItem(legacyKey);
        if (raw) break;
      }
    }

    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      value: parsed.value ?? null,
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch {
    return null;
  }
}

async function readCache(key, { allowStale = false } = {}) {
  const record = await readCacheRecord(key);
  if (!record || !record.value) return null;

  const age = Date.now() - record.savedAt;
  const isFresh = record.savedAt > 0 && age >= 0 && age < CACHE_TTL;

  if (isFresh) return { value: record.value, stale: false };
  if (allowStale) return { value: record.value, stale: true };

  // Bayat veriyi temizle (arka planda)
  AsyncStorage.removeItem(key).catch(() => {});
  return null;
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ value, savedAt: Date.now() }),
    );
  } catch {}
}

/* ================================================================
   HTTP — timeout + retry + AbortSignal
   ================================================================ */
async function fetchWithRetry(url, { signal, retries = MAX_RETRIES } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    if (signal?.aborted) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try { controller.abort(); } catch {}
    }, REQUEST_TIMEOUT_MS);

    const onExternalAbort = () => {
      try { controller.abort(); } catch {}
    };
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      if (DEBUG) {
        console.log(
          `[QuranAPI] GET ${url} (deneme ${attempt + 1}/${retries})`,
        );
      }

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onExternalAbort);

      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        // 4xx (429 hariç) retry edilmez
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw err;
        }
        lastError = err;
      } else {
        return await res.json();
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onExternalAbort);

      if (e?.name === 'AbortError' || signal?.aborted) {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        throw err;
      }

      lastError = e;

      // 4xx (kalıcı hata) → retry yapma
      if (e?.status && e.status >= 400 && e.status < 500 && e.status !== 429) {
        throw e;
      }
    }

    // Üstel gecikme: 300, 600, 1200 ms
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
    }
  }

  throw lastError || new Error('Quran API isteği başarısız');
}

/* ================================================================
   Yardımcılar
   ================================================================ */
function getAyahCacheKey(edition, surah, ayah) {
  return `${CACHE_PREFIX}${edition}:${surah}:${ayah}`;
}

function getRangeCacheKey(edition, surah, from, to) {
  return `${CACHE_PREFIX}${edition}:range:${surah}:${from}-${to}`;
}

function getSurahCacheKey(edition, surah) {
  return `${CACHE_PREFIX}${edition}:surah:${surah}`;
}

/**
 * AlQuran Cloud yanıtından (editions=2) iki edition'ı bul.
 */
function pickEditionsFromResponse(json, edition) {
  if (json?.code !== 200 || !Array.isArray(json?.data)) {
    throw new Error('Quran API yanıtı geçersiz');
  }
  const arabic = json.data.find(
    (d) => d?.edition?.identifier === ARABIC_EDITION,
  );
  const turkish = json.data.find(
    (d) => d?.edition?.identifier === edition,
  );
  return { arabic, turkish };
}

function buildAyahResult({ surah, ayah, arabicText, turkishText, edition, arabicEdition, turkishEdition }) {
  const surahInfo = arabicEdition?.surah ?? turkishEdition?.surah;
  const surahName = surahInfo?.englishName ?? `Sûre ${surah}`;
  const surahNameTr = surahInfo?.englishNameTranslation ?? '';

  return {
    surah,
    ayah,
    text: turkishText || '(Türkçe meal mevcut değil)',
    arabic: arabicText || '',
    kaynak: `${surahName} ${surah}:${ayah}`,
    surahNameTr,
    mealEdition: edition,
    hasTurkish: Boolean(turkishText),
  };
}

/* ================================================================
   Public — Tek ayet
   ================================================================
   Geriye dönük uyumlu:
   - Sözleşme: { text, arabic, kaynak, ... } | null
   - null döner ama sebebi DEBUG'da log'da görünür
   ================================================================ */
export async function fetchAyahTR(
  surah,
  ayah,
  mealEdition = DEFAULT_MEAL_EDITION,
  options = {},
) {
  const { signal, forceRefresh = false, allowStale = true } = options;
  const edition = mealEdition || DEFAULT_MEAL_EDITION;
  const key = getAyahCacheKey(edition, surah, ayah);

  // 1) Bellek cache
  if (!forceRefresh) {
    const mem = memGet(key);
    if (mem) return { ...mem, source: 'memory' };
  }

  // 2) AsyncStorage cache
  if (!forceRefresh) {
    const cached = await readCache(key);
    if (cached) {
      memSet(key, cached.value);
      return { ...cached.value, source: 'cache' };
    }
  }

  // 3) Ağ
  const url = `${API_BASE}/ayah/${surah}:${ayah}/editions/${ARABIC_EDITION},${edition}`;
  try {
    const json = await fetchWithRetry(url, { signal });
    const { arabic, turkish } = pickEditionsFromResponse(json, edition);

    const arabicText = arabic?.text ?? '';
    const turkishText = turkish?.text ?? '';

    if (!arabicText && !turkishText) {
      if (DEBUG) console.warn(`[QuranAPI ${surah}:${ayah}] boş içerik`);
      return null;
    }

    const result = buildAyahResult({
      surah, ayah, arabicText, turkishText,
      edition, arabicEdition: arabic, turkishEdition: turkish,
    });

    if (DEBUG) {
      console.log(
        `[QuranAPI ${surah}:${ayah}] OK — edition: ${edition}` +
        ` | TR: ${result.hasTurkish} | ilk 60: ${turkishText.slice(0, 60)}`,
      );
    }

    await writeCache(key, result);
    memSet(key, result);
    return { ...result, source: 'live' };
  } catch (error) {
    if (error?.name === 'AbortError') return null;
    console.warn(`[QuranAPI ${surah}:${ayah}] alınamadı:`, error?.message);

    // 4) Stale fallback — bayat cache varsa kullan
    if (allowStale) {
      const stale = await readCache(key, { allowStale: true });
      if (stale?.value) {
        if (DEBUG) console.log(`[QuranAPI ${surah}:${ayah}] stale cache kullanıldı`);
        return { ...stale.value, source: 'stale' };
      }
    }

    return null;
  }
}

/* ================================================================
   Public — Aralık (batch)
   ================================================================
   Tek istekte birden çok ayet — örn 2:255-260
   Dönüş: array (boş olabilir)
   ================================================================ */
export async function fetchAyahRangeTR(
  surah,
  from,
  to,
  mealEdition = DEFAULT_MEAL_EDITION,
  options = {},
) {
  const { signal, forceRefresh = false, allowStale = true } = options;
  const edition = mealEdition || DEFAULT_MEAL_EDITION;

  const start = Math.max(1, Math.min(from, to));
  const end = Math.max(from, to);

  if (start === end) {
    const single = await fetchAyahTR(surah, start, edition, options);
    return single ? [single] : [];
  }

  const key = getRangeCacheKey(edition, surah, start, end);

  // Memory
  if (!forceRefresh) {
    const mem = memGet(key);
    if (mem) return mem.map((a) => ({ ...a, source: 'memory' }));
  }

  // AsyncStorage
  if (!forceRefresh) {
    const cached = await readCache(key);
    if (cached) {
      memSet(key, cached.value);
      return cached.value.map((a) => ({ ...a, source: 'cache' }));
    }
  }

  // Network
  const url = `${API_BASE}/ayah/${surah}:${start}-${end}/editions/${ARABIC_EDITION},${edition}`;

  try {
    const json = await fetchWithRetry(url, { signal });
    const { arabic, turkish } = pickEditionsFromResponse(json, edition);

    const arabicAyahs = Array.isArray(arabic?.ayahs) ? arabic.ayahs : [];
    const turkishAyahs = Array.isArray(turkish?.ayahs) ? turkish.ayahs : [];

    const byNumber = new Map();
    turkishAyahs.forEach((a) => byNumber.set(a.numberInSurah, a));
    const trByNumber = byNumber;

    const results = arabicAyahs
      .map((a) => {
        const tr = trByNumber.get(a.numberInSurah);
        return buildAyahResult({
          surah,
          ayah: a.numberInSurah,
          arabicText: a.text ?? '',
          turkishText: tr?.text ?? '',
          edition,
          arabicEdition: arabic,
          turkishEdition: turkish,
        });
      })
      .filter((r) => r.arabic || r.text);

    if (results.length === 0) return [];

    // Her ayeti tek tek de cache'le (tekil çağrılar hızlandırmak için)
    await Promise.all(
      results.map((r) => {
        const singleKey = getAyahCacheKey(edition, surah, r.ayah);
        memSet(singleKey, r);
        return writeCache(singleKey, r);
      }),
    );

    await writeCache(key, results);
    memSet(key, results);
    return results.map((r) => ({ ...r, source: 'live' }));
  } catch (error) {
    if (error?.name === 'AbortError') return [];
    console.warn(
      `[QuranAPI ${surah}:${start}-${end}] alınamadı:`,
      error?.message,
    );

    if (allowStale) {
      const stale = await readCache(key, { allowStale: true });
      if (stale?.value) {
        return stale.value.map((a) => ({ ...a, source: 'stale' }));
      }
    }

    return [];
  }
}

/* ================================================================
   Public — Tam sure
   ================================================================
   Bir surenin tüm ayetlerini tek istekte getirir.
   Dönüş: { surah, ayahs: [...], surahNameTr, ... } | null
   ================================================================ */
export async function fetchSurahTR(
  surah,
  mealEdition = DEFAULT_MEAL_EDITION,
  options = {},
) {
  const { signal, forceRefresh = false, allowStale = true } = options;
  const edition = mealEdition || DEFAULT_MEAL_EDITION;
  const key = getSurahCacheKey(edition, surah);

  if (!forceRefresh) {
    const mem = memGet(key);
    if (mem) return { ...mem, source: 'memory' };

    const cached = await readCache(key);
    if (cached) {
      memSet(key, cached.value);
      return { ...cached.value, source: 'cache' };
    }
  }

  const url = `${API_BASE}/surah/${surah}/editions/${ARABIC_EDITION},${edition}`;

  try {
    const json = await fetchWithRetry(url, { signal });
    const { arabic, turkish } = pickEditionsFromResponse(json, edition);

    const arabicAyahs = Array.isArray(arabic?.ayahs) ? arabic.ayahs : [];
    const turkishAyahs = Array.isArray(turkish?.ayahs) ? turkish.ayahs : [];

    const turkishByNumber = new Map();
    turkishAyahs.forEach((a) => turkishByNumber.set(a.numberInSurah, a));

    const ayahs = arabicAyahs.map((a) => {
      const tr = turkishByNumber.get(a.numberInSurah);
      return buildAyahResult({
        surah,
        ayah: a.numberInSurah,
        arabicText: a.text ?? '',
        turkishText: tr?.text ?? '',
        edition,
        arabicEdition: arabic,
        turkishEdition: turkish,
      });
    });

    const surahInfo = arabic?.surah ?? turkish?.surah ?? {};
    const result = {
      surah,
      ayahs,
      surahNameTr: surahInfo?.englishNameTranslation ?? '',
      surahNameEn: surahInfo?.englishName ?? '',
      revelationType: surahInfo?.revelationType ?? '',
      ayahCount: ayahs.length,
      mealEdition: edition,
    };

    // Tüm ayetleri tek tek de cache'le
    await Promise.all(
      ayahs.map((r) => {
        const singleKey = getAyahCacheKey(edition, surah, r.ayah);
        memSet(singleKey, r);
        return writeCache(singleKey, r);
      }),
    );

    await writeCache(key, result);
    memSet(key, result);
    return { ...result, source: 'live' };
  } catch (error) {
    if (error?.name === 'AbortError') return null;
    console.warn(`[QuranAPI surah ${surah}] alınamadı:`, error?.message);

    if (allowStale) {
      const stale = await readCache(key, { allowStale: true });
      if (stale?.value) return { ...stale.value, source: 'stale' };
    }

    return null;
  }
}

/* ================================================================
   Public — Prefetch (fire & forget)
   ================================================================
   Arka planda ısıtır, hata yutar. Örn: reader'da sonraki ayet.
   ================================================================ */
export function prefetchAyahTR(surah, ayah, edition = DEFAULT_MEAL_EDITION) {
  fetchAyahTR(surah, ayah, edition, { allowStale: false }).catch(() => {});
}

export function prefetchAyahRangeTR(
  surah,
  from,
  to,
  edition = DEFAULT_MEAL_EDITION,
) {
  fetchAyahRangeTR(surah, from, to, edition, { allowStale: false }).catch(() => {});
}

/* ================================================================
   Public — Edition listesi
   ================================================================
   AlQuran Cloud'dan mevcut Türkçe meal listesi
   ================================================================ */
let cachedEditions = null;
export async function getAvailableEditions({ signal } = {}) {
  if (cachedEditions) return cachedEditions;
  try {
    const json = await fetchWithRetry(`${API_BASE}/edition?language=tr`, { signal });
    if (json?.code !== 200 || !Array.isArray(json?.data)) return [];
    cachedEditions = json.data.map((e) => ({
      identifier: e.identifier,
      name: e.name,
      englishName: e.englishName,
      type: e.type,
    }));
    return cachedEditions;
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.warn('[QuranAPI editions] alınamadı:', error?.message);
    }
    return [];
  }
}

/* ================================================================
   Public — Cache temizleme
   ================================================================ */
export async function clearQuranCache() {
  memClearAll();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter(
      (k) =>
        k.startsWith(CACHE_PREFIX) ||
        LEGACY_CACHE_PREFIXES.some((p) => k.startsWith(p)),
    );
    if (targets.length) await AsyncStorage.multiRemove(targets);
    return targets.length;
  } catch {
    return 0;
  }
}