/* src/services/homePreloader.js
 *
 * NİDA ana ekran veri ön yükleyicisi.
 *
 * Namaz vakitleri : Diyanet -> Aladhan fallback -> Gün-içi önbellek
 * Hicri tarih     : Diyanet -> today-hijri fallback -> Gün-içi önbellek
 * İslami isimler  : Uzak veri -> Gün-içi önbellek
 * Vakit içerikleri: Ayet + dua + esma -> Slot bazlı önbellek
 *
 * Özellikler:
 *   • Stale-While-Revalidate önbellek mimarisi (0ms açılış süresi)
 *   • Paralel ağ istekleri (Düşük gecikme)
 *   • Zaman aşımı koruması (Timeout guard)
 *   • Multi-resource cache (vakit + hijri + isim + içerik)
 *   • In-flight request deduplication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchPrayerTimesFromAPI } from './ummahApi';
import { fetchDiyanetTimes } from './diyanetApi';

import {
  fetchIslamicNames,
  fetchTodayHijri,
  fetchVakitAyah,
  fetchVakitDua,
  fetchVakitEsma,
} from './ummahContentApi';

import { DEFAULT_MEAL_EDITION } from '../data/vakitContent';

/* ================================================================
   Güvenli opsiyonel modüller (New Architecture Interop)
   ================================================================ */
const getModule = (mod) => (mod && mod.default ? mod.default : mod);

let RNCNetInfo = null;
try { RNCNetInfo = getModule(require('@react-native-community/netinfo')); } catch {}

/* ================================================================
   Yapılandırma
   ================================================================ */

const CACHE_KEYS = Object.freeze({
  prayer:       'nida:home:prayer:v4',
  prayerLegacy: 'nida:home:prayer:v3',
  names:        'nida:home:names:v1',
  hijri:        'nida:home:hijri:v1',
  vakitContent: 'nida:home:vakit:v1',
});

const RETRY_CONFIG = Object.freeze({
  maxAttempts: 2,
  baseDelayMs: 400,
  backoff: 1.5,
});

const NETWORK_TIMEOUT_MS = 3500; // Ağ istekleri için maks 3.5 sn limit
const PRAYER_TIMEOUT_MS = 6000;  // Vakit isteği (Diyanet + yedek) toplam limiti
const DIYANET_TIMEOUT_MS = 2500; // Diyanet yanıt vermezse hızlıca yedeğe geç
const ALADHAN_TIMEOUT_MS = 3000;
const NETINFO_TIMEOUT_MS = 700;  // NetInfo asla açılışı bekletmesin
const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;

/* ================================================================
   Log ve Yardımcılar
   ================================================================ */
function log(...args) {
  if (DEBUG) console.log('[Preload]', ...args);
}
function warn(...args) {
  if (DEBUG) console.warn('[Preload]', ...args);
}

function getErrorMessage(error, fallback = 'Bilinmeyen hata') {
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return fallback;
}

function addError(errors, message) {
  if (message && !errors.includes(message)) errors.push(message);
}

function safeCall(cb, payload) {
  if (typeof cb !== 'function') return;
  try { cb(payload); } catch (e) { warn('onPartial hata:', getErrorMessage(e)); }
}

function withTimeout(promise, ms, timeoutErrorMsg = 'Ağ zaman aşımına uğradı') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutErrorMsg)), ms);
  });
  // Zamanlayıcı her durumda temizlenir (askıda kalan timer kalmaz)
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/* ================================================================
   Tarih & Konum Yardımcıları
   ================================================================ */

function getLocalDateKey(d = new Date()) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function isSameLocalDay(ms, now = Date.now()) {
  if (!ms || !Number.isFinite(ms)) return false;
  return getLocalDateKey(new Date(ms)) === getLocalDateKey(new Date(now));
}

function isFreshByDay(savedAt, now = Date.now()) {
  return isSameLocalDay(savedAt, now);
}

function normalizeLocationPart(value) {
  return String(value ?? '')
    .trim()
    .toLocaleUpperCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'I')
    .replace(/\s+/g, ' ');
}

function getLocationKey(location) {
  if (!location) return null;
  const city = normalizeLocationPart(location.city);
  const district = normalizeLocationPart(location.district);
  if (!city) return null;
  return `${city}|${district}`;
}

function isValidCoordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
}

export function getActiveVakitSlot(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 4 && hour < 7) return 'imsak';
  if (hour >= 7 && hour < 13) return 'dhuhr';
  if (hour >= 13 && hour < 17) return 'asr';
  if (hour >= 17 && hour < 19) return 'maghrib';
  return 'isha';
}

/* ================================================================
   Cache Okuma / Yazma
   ================================================================ */

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    warn(`Cache okunamadı (${key}):`, getErrorMessage(e));
    return null;
  }
}

async function writeCache(key, payload) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (e) {
    warn(`Cache yazılamadı (${key}):`, getErrorMessage(e));
    return false;
  }
}

/* ================================================================
   Retry + Dedup
   ================================================================ */

async function withRetry(fn, { maxAttempts = 2, baseDelayMs = 400, backoff = 1.5 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(backoff, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

const inflight = new Map();

function inflightKey(params) {
  return [
    String(params.location?.city ?? ''),
    String(params.location?.district ?? ''),
    String(params.latitude ?? ''),
    String(params.longitude ?? ''),
    String(params.method ?? ''),
    String(params.tuneMinutes ?? ''),
    String(params.mealEdition ?? ''),
  ].join('|');
}

/* ================================================================
   Cache Yöneticileri
   ================================================================ */

export async function readLastPrayerData(expectedLocation, { allowLegacy = true } = {}) {
  let entry = await readCache(CACHE_KEYS.prayer);
  let legacy = false;

  if (!entry && allowLegacy) {
    entry = await readCache(CACHE_KEYS.prayerLegacy);
    legacy = Boolean(entry);
  }

  if (!entry?.data) return null;

  const savedAt = Number(entry.savedAt) || 0;
  const fresh = isFreshByDay(savedAt);

  // Skeleton gösterimini engellemek için konum hafif uyumsuz veya eski olsa da önbellek döndürülür
  return {
    data: entry.data,
    stale: !fresh,
    savedAt: savedAt || null,
    locationKey: entry.locationKey || null,
    paramsKey: entry.paramsKey || null,
    source: 'cache',
    legacy,
    fresh,
  };
}

function writeLastPrayerData(data, location, paramsKey = null, source = null) {
  const payload = {
    data,
    savedAt: Date.now(),
    locationKey: getLocationKey(location) || getLocationKey(data?.location),
    paramsKey,
    source,
  };
  return writeCache(CACHE_KEYS.prayer, payload);
}

async function readCachedHijri() {
  const entry = await readCache(CACHE_KEYS.hijri);
  if (!entry?.data) return null;
  return { data: entry.data, stale: !isFreshByDay(Number(entry.savedAt) || 0) };
}

async function writeCachedHijri(data) {
  await writeCache(CACHE_KEYS.hijri, { data, savedAt: Date.now() });
}

async function readCachedIslamicNames() {
  const entry = await readCache(CACHE_KEYS.names);
  if (!Array.isArray(entry?.data) || entry.data.length === 0) return null;
  return { data: entry.data, stale: !isFreshByDay(Number(entry.savedAt) || 0) };
}

async function writeCachedIslamicNames(names) {
  if (!Array.isArray(names) || names.length === 0) return;
  await writeCache(CACHE_KEYS.names, { data: names, savedAt: Date.now() });
}

async function readCachedVakitContent(slot) {
  const entry = await readCache(CACHE_KEYS.vakitContent);
  if (!entry?.data) return null;
  const fresh = isSameLocalDay(Number(entry.savedAt) || 0) && entry.slot === slot;
  return { data: entry.data, stale: !fresh };
}

function writeCachedVakitContent(content, slot, mealEdition = null) {
  if (!content?.ayet && !content?.dua && !content?.esma) return Promise.resolve(false);
  return writeCache(CACHE_KEYS.vakitContent, { data: content, savedAt: Date.now(), slot, mealEdition });
}

// Açılışta 4 ayrı AsyncStorage çağrısı yerine tek multiGet
async function readHomeCaches() {
  const out = {};
  try {
    const pairs = await AsyncStorage.multiGet([
      CACHE_KEYS.prayer, CACHE_KEYS.names, CACHE_KEYS.hijri, CACHE_KEYS.vakitContent,
    ]);
    pairs.forEach(([key, raw]) => {
      try { out[key] = raw ? JSON.parse(raw) : null; } catch { out[key] = null; }
    });
  } catch (e) {
    warn('multiGet başarısız:', getErrorMessage(e));
  }
  if (!out[CACHE_KEYS.prayer]) {
    const legacy = await readCache(CACHE_KEYS.prayerLegacy);
    if (legacy) out[CACHE_KEYS.prayer] = { ...legacy, paramsKey: null };
  }
  return out;
}

/* ================================================================
   Namaz Vakitleri Çözümleyici
   ================================================================ */

async function resolvePrayerTimes({ location, latitude, longitude, method, tuneMinutes }) {
  const failures = [];

  if (location?.city) {
    try {
      const diyanet = await withTimeout(
        fetchDiyanetTimes(location.city, location.district),
        DIYANET_TIMEOUT_MS,
        'Diyanet zaman aşımı',
      );
      if (!diyanet?.times) throw new Error('Diyanet geçerli veri döndürmedi.');

      return {
        data: {
          ...diyanet,
          location: {
            ...diyanet.location,
            sehirAdi: diyanet.location?.sehirAdi || location.city,
            ilceAdi: diyanet.location?.ilceAdi || location.district || '',
          },
        },
        source: 'diyanet',
      };
    } catch (error) {
      failures.push(`Diyanet: ${getErrorMessage(error)}`);
    }
  }

  if (isValidCoordinates(latitude, longitude)) {
    try {
      const aladhan = await withTimeout(
        fetchPrayerTimesFromAPI(latitude, longitude, { method, tuneMinutes }),
        ALADHAN_TIMEOUT_MS,
        'Aladhan zaman aşımı',
      );
      if (!aladhan?.times) throw new Error('Aladhan geçerli veri döndürmedi.');

      return {
        data: {
          ...aladhan,
          location: aladhan.location || { sehirAdi: location?.city || '', ilceAdi: location?.district || '' },
        },
        source: 'aladhan',
      };
    } catch (error) {
      failures.push(`Aladhan: ${getErrorMessage(error)}`);
    }
  }

  throw new Error(failures.join(' | ') || 'Namaz vakitleri alınamadı.');
}

/* ================================================================
   Ana Ön Yükleyici (Optimize Paralel Akış)
   ================================================================ */

export async function preloadHomeData({
  latitude,
  longitude,
  location,
  method = 13,
  tuneMinutes = 0,
  mealEdition = DEFAULT_MEAL_EDITION,
  minLoadingMs = 0,
  onPartial,
  signal,
  force = false,
} = {}) {
  const key = inflightKey({ location, latitude, longitude, method, tuneMinutes, mealEdition });

  if (!force && !signal && inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = _runPreload({
    latitude, longitude, location, method, tuneMinutes, mealEdition,
    minLoadingMs, onPartial, signal, force,
  });

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

async function _runPreload({
  latitude, longitude, location, method, tuneMinutes, mealEdition,
  minLoadingMs, onPartial, signal, force,
}) {
  const startedAt = Date.now();
  const errors = [];
  const slot = getActiveVakitSlot();
  const paramsKey = `${method}|${tuneMinutes}`;

  const checkAbort = () => {
    if (signal?.aborted) throw new Error('aborted');
  };

  const safePartial = (payload) => {
    if (signal?.aborted) return;
    safeCall(onPartial, payload);
  };

  /* --------------------------------------------------------------
     Aşama 0: Önbellek (tek multiGet) — ekran 0ms'de dolsun
     -------------------------------------------------------------- */
  const caches = await readHomeCaches();
  const now0 = Date.now();

  const prayerEntry = caches[CACHE_KEYS.prayer];
  const namesEntry = caches[CACHE_KEYS.names];
  const hijriEntry = caches[CACHE_KEYS.hijri];
  const vakitEntry = caches[CACHE_KEYS.vakitContent];

  const cachedPrayer = prayerEntry?.data ? prayerEntry : null;
  const cachedNames = Array.isArray(namesEntry?.data) && namesEntry.data.length > 0 ? namesEntry : null;
  const cachedHijri = hijriEntry?.data ? hijriEntry : null;
  const cachedVakit = vakitEntry?.data ? vakitEntry : null;

  // Aynı gün + aynı konum + aynı ayarlar ise ağa gitmeye gerek yok
  const wantedLocKey = getLocationKey(location);
  const prayerFresh = !force && Boolean(cachedPrayer)
    && isFreshByDay(Number(cachedPrayer.savedAt) || 0, now0)
    && cachedPrayer.paramsKey === paramsKey
    && (!wantedLocKey || cachedPrayer.locationKey === wantedLocKey);
  const namesFresh = !force && Boolean(cachedNames)
    && isFreshByDay(Number(cachedNames.savedAt) || 0, now0);
  const hijriFresh = !force && Boolean(cachedHijri)
    && isFreshByDay(Number(cachedHijri.savedAt) || 0, now0);
  const vakitFresh = !force && Boolean(cachedVakit)
    && isSameLocalDay(Number(cachedVakit.savedAt) || 0, now0)
    && cachedVakit.slot === slot
    && cachedVakit.mealEdition === mealEdition;

  const state = {
    prayerData: cachedPrayer?.data ?? null,
    prayerSource: cachedPrayer ? (prayerFresh ? (cachedPrayer.source || 'cache') : 'cache') : null,
    islamicNames: cachedNames?.data ?? [],
    hijriData: cachedHijri?.data ?? null,
    vakitContent: cachedVakit?.data ?? { ayet: null, dua: null, esma: null },
  };

  const currentHijri = () => (
    state.prayerData?.hijri
      ? { formatted: state.prayerData.hijri, _source: 'diyanet' }
      : state.hijriData
  );

  const emit = (stage) => safePartial({
    stage,
    prayerData: state.prayerData,
    islamicNames: state.islamicNames,
    hijriData: currentHijri(),
    vakitContent: state.vakitContent,
    source: state.prayerSource,
    errors: [...errors],
  });

  if (cachedPrayer || cachedNames || cachedHijri || cachedVakit) {
    emit('cache_init');
  }

  checkAbort();

  const needNetwork = !(prayerFresh && namesFresh && hijriFresh && vakitFresh);
  let online = true;

  if (!needNetwork) {
    log('Tüm veriler güncel önbellekten geldi — ağ isteği atlandı.');
  } else {
    /* ------------------------------------------------------------
       Ağ kontrolü (kısa sınırlı; asla açılışı bekletmez)
       ------------------------------------------------------------ */
    if (RNCNetInfo?.fetch) {
      try {
        const net = await withTimeout(RNCNetInfo.fetch(), NETINFO_TIMEOUT_MS, 'NetInfo zaman aşımı');
        online = net.isConnected !== false && net.isInternetReachable !== false;
      } catch {}
    }

    checkAbort();

    if (!online) {
      log('Çevrimdışı — önbellek verileriyle devam ediliyor.');
    } else {
      /* ----------------------------------------------------------
         Aşama 1: Yalnızca eksik/eski olanlar, paralel.
         Her biri biter bitmez UI'a yansıtılır (en yavaşı beklenmez).
         ---------------------------------------------------------- */
      const tasks = [];

      if (!prayerFresh) {
        const attempts = cachedPrayer ? 1 : RETRY_CONFIG.maxAttempts;
        tasks.push(
          withTimeout(
            withRetry(
              () => resolvePrayerTimes({ location, latitude, longitude, method, tuneMinutes }),
              { ...RETRY_CONFIG, maxAttempts: attempts },
            ),
            PRAYER_TIMEOUT_MS,
          ).then(
            (res) => {
              if (res?.data) {
                state.prayerData = res.data;
                state.prayerSource = res.source;
                writeLastPrayerData(res.data, location, paramsKey, res.source);
                emit('prayer');
              } else if (!state.prayerData) {
                addError(errors, 'Namaz vakitleri yüklenemedi.');
              }
            },
            (err) => {
              if (!state.prayerData) {
                addError(errors, getErrorMessage(err, 'Namaz vakitleri yüklenemedi.'));
              }
            },
          ),
        );
      }

      if (!namesFresh) {
        tasks.push(
          withTimeout(fetchIslamicNames(2), NETWORK_TIMEOUT_MS).then(
            (names) => {
              if (Array.isArray(names) && names.length > 0) {
                state.islamicNames = names;
                writeCachedIslamicNames(names);
                emit('names');
              }
            },
            () => {},
          ),
        );
      }

      if (!hijriFresh) {
        tasks.push(
          withTimeout(fetchTodayHijri(), NETWORK_TIMEOUT_MS).then(
            (hijri) => {
              if (hijri) {
                state.hijriData = hijri;
                writeCachedHijri(hijri);
                emit('hijri');
              }
            },
            () => {},
          ),
        );
      }

      if (!vakitFresh) {
        tasks.push(
          Promise.allSettled([
            withTimeout(fetchVakitAyah(slot, 0, mealEdition), NETWORK_TIMEOUT_MS),
            withTimeout(fetchVakitDua(slot, 0), NETWORK_TIMEOUT_MS),
            withTimeout(fetchVakitEsma(slot, 0), NETWORK_TIMEOUT_MS),
          ]).then(([ayet, dua, esma]) => {
            const next = {
              ayet: ayet.status === 'fulfilled' ? ayet.value : state.vakitContent.ayet,
              dua: dua.status === 'fulfilled' ? dua.value : state.vakitContent.dua,
              esma: esma.status === 'fulfilled' ? esma.value : state.vakitContent.esma,
            };
            if (next.ayet || next.dua || next.esma) {
              state.vakitContent = next;
              writeCachedVakitContent(next, slot, mealEdition);
              emit('vakit');
            }
          }),
        );
      }

      await Promise.allSettled(tasks);
      checkAbort();
    }
  }

  const finalHijri = currentHijri();
  emit('content');

  const elapsed = Date.now() - startedAt;
  const minimum = Math.max(0, Number(minLoadingMs) || 0);
  if (minimum > elapsed) {
    await new Promise((r) => setTimeout(r, minimum - elapsed));
  }

  return {
    prayerData: state.prayerData,
    islamicNames: state.islamicNames,
    hijriData: finalHijri,
    vakitContent: state.vakitContent,
    source: state.prayerSource,
    errors,
    online,
    elapsedMs: Date.now() - startedAt,
  };
}

/* ================================================================
   Cache Yönetimi API
   ================================================================ */

export async function clearHomeCache() {
  try {
    await AsyncStorage.multiRemove([CACHE_KEYS.prayer, CACHE_KEYS.prayerLegacy]);
    return true;
  } catch (error) {
    return false;
  }
}

export async function clearAllCaches() {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    return true;
  } catch (error) {
    return false;
  }
}

export async function getCacheStats() {
  const [prayer, names, hijri, vakit] = await Promise.all([
    readCache(CACHE_KEYS.prayer),
    readCache(CACHE_KEYS.names),
    readCache(CACHE_KEYS.hijri),
    readCache(CACHE_KEYS.vakitContent),
  ]);
  const now = Date.now();

  return {
    prayer: { exists: !!prayer, savedAt: prayer?.savedAt ?? null, fresh: isFreshByDay(prayer?.savedAt, now) },
    names: { exists: !!names, savedAt: names?.savedAt ?? null, fresh: isFreshByDay(names?.savedAt, now) },
    hijri: { exists: !!hijri, savedAt: hijri?.savedAt ?? null, fresh: isFreshByDay(hijri?.savedAt, now) },
    vakitContent: { exists: !!vakit, savedAt: vakit?.savedAt ?? null, fresh: isSameLocalDay(vakit?.savedAt, now) },
    now,
  };
}