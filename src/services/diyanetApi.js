/* src/services/diyanetApi.js
 * Diyanet namaz vakitleri API servisi
 * API: https://namazvakti.mtopal.dev
 *
 * Not: Hermes motorunda String.prototype.normalize bazen mevcut
 * olmayabilir. Bu dosyada normalize() çağrısı yapılmaz; Türkçe
 * karakter eşleştirmesi manuel yapılır.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://namazvakti.mtopal.dev';
const CACHE_PREFIX = 'nida:diyanet:v3:';
const LEGACY_CACHE_PREFIXES = [
  'nida:diyanet:v1:',
  'nida:diyanet:v2:',
];
const TURKIYE_ULKE_ID = '2';

const CACHE_TTL = {
  cities: 30 * 24 * 60 * 60 * 1000,
  districts: 30 * 24 * 60 * 60 * 1000,
  times: 6 * 60 * 60 * 1000,
  monthly: 6 * 60 * 60 * 1000,
};

const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 3;
const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;

const PRAYER_FIELDS = [
  ['imsak', 'Imsak'],
  ['sunrise', 'Gunes'],
  ['dhuhr', 'Ogle'],
  ['asr', 'Ikindi'],
  ['maghrib', 'Aksam'],
  ['isha', 'Yatsi'],
];

/* ================================================================
   Türkçe karakter normalizasyonu — String.normalize KULLANMAZ
   ================================================================ */

const TR_UPPER_MAP = {
  i: 'I',
  ı: 'I',
  İ: 'I',
  ş: 'S',
  Ş: 'S',
  ğ: 'G',
  Ğ: 'G',
  ü: 'U',
  Ü: 'U',
  ö: 'O',
  Ö: 'O',
  ç: 'C',
  Ç: 'C',
};

/**
 * İsmi karşılaştırma için normalize eder.
 * Türkçe karakterleri ASCII karşılığına çevirir
 * Küçük/büyük harf farkını kaldırır
 * Boşluk ve noktalama işaretlerini temizler
 */
function normalizeName(value) {
  try {
    const raw = String(value ?? '').trim();
    if (!raw) return '';

    let out = '';
    for (let i = 0; i < raw.length; i += 1) {
      const ch = raw[i];
      const mapped = TR_UPPER_MAP[ch];
      if (mapped !== undefined) {
        out += mapped;
      } else {
        const upper = ch.toUpperCase();
        const code = upper.charCodeAt(0);
        if (
          (code >= 65 && code <= 90) ||
          (code >= 48 && code <= 57)
        ) {
          out += upper;
        }
        // A-Z, 0-9 dışındaki her şeyi at
      }
    }
    return out;
  } catch {
    return '';
  }
}

/* ================================================================
   Hata yardımcıları
   ================================================================ */

function createError(message, code = 'API_ERROR') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function log(...args) {
  if (DEBUG) {
    console.log('[DiyanetAPI]', ...args);
  }
}

function warn(...args) {
  if (DEBUG) {
    console.warn('[DiyanetAPI]', ...args);
  }
}

/* ================================================================
   Önbellek
   ================================================================ */

async function readCacheRecord(key) {
  try {
    let raw = await AsyncStorage.getItem(key);

    // Önceki sürümlerin verileriyle uyumluluk.
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

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Object.prototype.hasOwnProperty.call(parsed, 'value')
    ) {
      return null;
    }

    return {
      value: parsed.value,
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch (error) {
    warn('Önbellek okunamadı:', error?.message);
    return null;
  }
}

async function readCache(key, ttl, allowStale = false) {
  const record = await readCacheRecord(key);

  if (!record || record.value == null) {
    return null;
  }

  const age = Date.now() - record.savedAt;
  const isFresh =
    record.savedAt > 0 &&
    age >= 0 &&
    age < ttl;

  if (isFresh || allowStale) {
    return record.value;
  }

  return null;
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        value,
        savedAt: Date.now(),
      }),
    );
  } catch (error) {
    warn('Önbellek yazılamadı:', error?.message);
  }
}

async function getCachedOrFetch({
  key,
  ttl,
  fetcher,
  bypassCache = false,
}) {
  if (!bypassCache) {
    const cached = await readCache(key, ttl);

    if (cached !== null) {
      return {
        value: cached,
        source: 'cache',
      };
    }
  }

  try {
    const value = await fetcher();
    await writeCache(key, value);

    return {
      value,
      source: 'live',
    };
  } catch (error) {
    const stale = await readCache(key, ttl, true);

    if (stale !== null) {
      warn('Ağ isteği başarısız; eski önbellek kullanılıyor.');

      return {
        value: stale,
        source: 'cache',
        warning:
          'İnternet bağlantısı nedeniyle kayıtlı veriler kullanılıyor. Vakitleri doğrulayın.',
      };
    }

    throw error;
  }
}

/* ================================================================
   HTTP istekleri
   ================================================================ */

async function fetchJson(path, options = {}) {
  const {
    retries = MAX_RETRIES,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;

  const url = `${API_BASE}${path}`;
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    let timeoutId = null;
    let controller = null;

    try {
      log('GET', url, `Deneme ${attempt + 1}/${retries}`);

      try {
        if (
          typeof AbortController !== 'undefined' &&
          typeof AbortController === 'function'
        ) {
          controller = new AbortController();
        }
      } catch {
        controller = null;
      }

      const fetchOptions = {
        method: 'GET',
        headers: { Accept: 'application/json' },
      };

      if (controller && controller.signal) {
        fetchOptions.signal = controller.signal;
      }

      const request = fetch(url, fetchOptions);

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          try {
            controller?.abort?.();
          } catch {}
          reject(
            createError('İstek zaman aşımına uğradı.', 'TIMEOUT'),
          );
        }, timeoutMs);
      });

      const response = await Promise.race([
        request,
        timeoutPromise,
      ]);

      if (!response.ok) {
        const retryable =
          response.status === 408 ||
          response.status === 429 ||
          response.status >= 500;

        const error = createError(
          `Diyanet API hatası (${response.status}).`,
          `HTTP_${response.status}`,
        );

        if (!retryable || attempt === retries - 1) {
          throw error;
        }

        lastError = error;
      } else {
        let data;

        try {
          data = await response.json();
        } catch {
          throw createError(
            'API geçerli bir JSON yanıtı döndürmedi.',
            'INVALID_JSON',
          );
        }

        if (data == null) {
          throw createError(
            'API boş yanıt döndürdü.',
            'EMPTY_RESPONSE',
          );
        }

        return data;
      }
    } catch (error) {
      lastError = error;

      const isHttpError = String(error?.code || '').startsWith(
        'HTTP_',
      );
      const status = isHttpError
        ? Number(String(error.code).replace('HTTP_', ''))
        : null;

      const shouldRetry =
        !isHttpError ||
        status === 408 ||
        status === 429 ||
        status >= 500;

      if (!shouldRetry || attempt === retries - 1) {
        throw error;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 300 * (attempt + 1));
    });
  }

  throw lastError || createError('Diyanet API isteği başarısız.');
}

/* ================================================================
   İsim eşleştirme
   ================================================================ */

function findByName(items, field, requestedName) {
  if (!Array.isArray(items)) return null;

  const target = normalizeName(requestedName);
  if (!target) return null;

  return (
    items.find(
      (item) => normalizeName(item?.[field]) === target,
    ) || null
  );
}

/* ================================================================
   Tarih yardımcıları
   ================================================================ */

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatApiDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}.${month}.${date.getFullYear()}`;
}

/* ================================================================
   Tarih parse
   ================================================================ */

const TR_MONTH_LOOKUP = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
};

function buildValidDate(year, month, day) {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (year < 1900 || year > 2200) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseApiDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  // Format 1: "18.02.2026"
  let m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    return buildValidDate(Number(m[3]), Number(m[2]), Number(m[1]));
  }

  // Format 2: "2026-02-18" veya "2026-02-18T00:00:00..."
  m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) {
    return buildValidDate(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  // Format 3: "18/02/2026"
  m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return buildValidDate(Number(m[3]), Number(m[2]), Number(m[1]));
  }

  // Format 4: "18 Şubat 2026 Çarşamba"
  const lower = raw.toLowerCase();
  m = lower.match(/^(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/);
  if (m) {
    const month = TR_MONTH_LOOKUP[m[2]];
    if (month) {
      return buildValidDate(Number(m[3]), month, Number(m[1]));
    }
  }

  return null;
}

function isValidTime(value) {
  const match = String(value ?? '').match(
    /^([01]?\d|2[0-3]):([0-5]\d)$/,
  );

  return Boolean(match);
}

function normalizeTime(value) {
  if (!isValidTime(value)) return null;

  const [hour, minute] = String(value).split(':');

  return (
    `${String(Number(hour)).padStart(2, '0')}:` +
    `${String(Number(minute)).padStart(2, '0')}`
  );
}

/* ================================================================
   İl / ilçe ID çözümleme
   ================================================================ */

async function getCities() {
  const key = `${CACHE_PREFIX}cities:tr`;

  const result = await getCachedOrFetch({
    key,
    ttl: CACHE_TTL.cities,
    fetcher: async () => {
      const cities = await fetchJson(
        `/sehirler/${TURKIYE_ULKE_ID}`,
      );

      if (!Array.isArray(cities) || cities.length === 0) {
        throw createError('Şehir listesi alınamadı.');
      }

      return cities;
    },
  });

  return result.value;
}

async function getDistricts(cityId) {
  const key = `${CACHE_PREFIX}districts:${cityId}`;

  const result = await getCachedOrFetch({
    key,
    ttl: CACHE_TTL.districts,
    fetcher: async () => {
      const districts = await fetchJson(`/ilceler/${cityId}`);

      if (!Array.isArray(districts) || districts.length === 0) {
        throw createError('İlçe listesi alınamadı.');
      }

      return districts;
    },
  });

  return result.value;
}

async function resolveIlceID(cityName, districtName) {
  if (!String(cityName ?? '').trim()) {
    throw createError(
      'Şehir bilgisi belirtilmedi.',
      'INVALID_LOCATION',
    );
  }

  const cities = await getCities();
  const city = findByName(cities, 'SehirAdi', cityName);

  if (!city?.SehirID) {
    warn('Şehir bulunamadı:', cityName);

    throw createError(
      `Şehir Diyanet listesinde bulunamadı: ${cityName}`,
      'CITY_NOT_FOUND',
    );
  }

  const districts = await getDistricts(city.SehirID);
  let district = null;

  if (String(districtName ?? '').trim()) {
    district = findByName(
      districts,
      'IlceAdi',
      districtName,
    );

    if (!district) {
      throw createError(
        `İlçe bulunamadı: ${city.SehirAdi} / ${districtName}. Lütfen ilçe adını kontrol edin.`,
        'DISTRICT_NOT_FOUND',
      );
    }
  } else {
    district =
      findByName(districts, 'IlceAdi', city.SehirAdi) ||
      findByName(districts, 'IlceAdi', 'MERKEZ');

    if (!district) {
      district = districts[0] || null;
    }
  }

  if (!district?.IlceID) {
    throw createError(
      `İlçe ID bilgisi alınamadı: ${city.SehirAdi}`,
      'DISTRICT_ID_MISSING',
    );
  }

  const result = {
    ilceID: String(district.IlceID),
    ilceAdi: district.IlceAdi,
    sehirAdi: city.SehirAdi,
  };

  log(
    `Konum: ${result.sehirAdi} / ${result.ilceAdi} (ID: ${result.ilceID})`,
  );

  return result;
}

/* ================================================================
   Vakit verisi doğrulama ve dönüşüm
   ================================================================ */

function normalizeTimes(item) {
  if (!item || typeof item !== 'object') {
    throw createError('Namaz vakti kaydı geçersiz.');
  }

  const times = {};

  for (const [key, field] of PRAYER_FIELDS) {
    const raw = String(item[field] ?? '').trim();
    const normalized = normalizeTime(raw);

    if (!normalized) {
      throw createError(
        `Namaz vakti verisi eksik veya hatalı: ${field}`,
        'INVALID_PRAYER_TIME',
      );
    }

    times[key] = normalized;
  }

  return times;
}

function normalizeTimesLoose(item) {
  const out = {};
  for (const [key, field] of PRAYER_FIELDS) {
    const raw = String(item?.[field] ?? '').trim();
    out[key] = normalizeTime(raw);
  }
  return out;
}

function pickTodayAndTomorrow(list, now = new Date()) {
  if (!Array.isArray(list) || list.length === 0) {
    throw createError('Diyanet vakit verisi boş.');
  }

  const todayKey = formatApiDate(now);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const tomorrowKey = formatApiDate(tomorrowDate);

  const today = list.find(
    (item) => item?.MiladiTarihKisa === todayKey,
  );

  const tomorrow = list.find(
    (item) => item?.MiladiTarihKisa === tomorrowKey,
  );

  if (!today) {
    throw createError(
      `Bugünün vakit kaydı bulunamadı (${todayKey}).`,
      'TODAY_NOT_FOUND',
    );
  }

  return {
    today,
    tomorrow: tomorrow || null,
  };
}

/* ================================================================
   Public API — Günlük vakitler
   ================================================================ */

export async function fetchDiyanetTimes(
  cityName,
  districtName,
  options = {},
) {
  const { bypassCache = false } = options;

  const ilce = await resolveIlceID(cityName, districtName);
  const timesKey = `${CACHE_PREFIX}times:${ilce.ilceID}`;

  const result = await getCachedOrFetch({
    key: timesKey,
    ttl: CACHE_TTL.times,
    bypassCache,
    fetcher: async () => {
      const list = await fetchJson(`/vakitler/${ilce.ilceID}`);

      if (!Array.isArray(list) || list.length === 0) {
        throw createError('Diyanet vakit verisi boş.');
      }

      const { today, tomorrow } = pickTodayAndTomorrow(list);
      const times = normalizeTimes(today);

      const tomorrowImsak = tomorrow?.Imsak
        ? normalizeTime(tomorrow.Imsak)
        : null;

      return {
        times,
        tomorrowImsak,
        hijri: today.HicriTarihUzun || '',
        gregorianDate: today.MiladiTarihKisa || '',
        location: {
          ilceID: ilce.ilceID,
          ilceAdi: ilce.ilceAdi,
          sehirAdi: ilce.sehirAdi,
        },
        fetchedAt: new Date().toISOString(),
        warning: null,
      };
    },
  });

  const data = result.value;

  log('Vakitler:', data.times, 'Kaynak:', result.source);

  return {
    ...data,
    source: result.source,
    ...(result.warning ? { warning: result.warning } : {}),
  };
}

/* ================================================================
   Public API — Aylık imsakiye (Ramazan takvimi)
   ================================================================ */

export async function fetchDiyanetMonthlyTimes(
  cityName,
  districtName,
  options = {},
) {
  const {
    bypassCache = false,
    startDate = null,
    endDate = null,
  } = options;

  const ilce = await resolveIlceID(cityName, districtName);
  const monthlyKey = `${CACHE_PREFIX}monthly:${ilce.ilceID}`;

  const result = await getCachedOrFetch({
    key: monthlyKey,
    ttl: CACHE_TTL.monthly,
    bypassCache,
    fetcher: async () => {
      const list = await fetchJson(`/vakitler/${ilce.ilceID}`);

      if (!Array.isArray(list) || list.length === 0) {
        throw createError('Diyanet aylık vakit verisi boş.');
      }

      let parseFailCount = 0;
      let timeFailCount = 0;
      let sampleParseFail = null;

      const rows = list
        .map((item) => {
          const rawDate =
            item?.MiladiTarihKisa ??
            item?.MiladiTarihUzun ??
            item?.MiladiTarih ??
            item?.Tarih ??
            item?.miladiTarihKisa ??
            item?.tarih ??
            null;

          const parsed = parseApiDate(rawDate);
          if (!parsed) {
            parseFailCount += 1;
            if (!sampleParseFail) sampleParseFail = rawDate;
            return null;
          }

          const iso = localDateKey(parsed);
          const times = normalizeTimesLoose(item);

          // Alias Tanımları (Hem İngilizce hem Türkçe key uyumluluğu)
          const imsakVal = times.imsak ?? normalizeTime(item?.Imsak);
          const gunesVal = times.gunes ?? times.sunrise ?? normalizeTime(item?.Gunes);
          const ogleVal = times.ogle ?? times.dhuhr ?? normalizeTime(item?.Ogle);
          const ikindiVal = times.ikindi ?? times.asr ?? normalizeTime(item?.Ikindi);
          const aksamVal = times.aksam ?? times.maghrib ?? normalizeTime(item?.Aksam);
          const yatsiVal = times.yatsi ?? times.isha ?? normalizeTime(item?.Yatsi);

          if (!imsakVal || !aksamVal) {
            timeFailCount += 1;
            if (!sampleParseFail) {
              sampleParseFail = `date=${rawDate} imsak=${imsakVal} aksam=${aksamVal}`;
            }
            return null;
          }

          return {
            iso,
            hijri:
              item?.HicriTarihUzun ??
              item?.HicriTarihKisa ??
              item?.hicriTarihUzun ??
              null,
            imsak: imsakVal,
            gunes: gunesVal,
            ogle: ogleVal,
            ikindi: ikindiVal,
            aksam: aksamVal,
            yatsi: yatsiVal,
            source: 'diyanet',
          };
        })
        .filter(Boolean)
        .sort((a, b) => (a.iso < b.iso ? -1 : 1));

      if (rows.length === 0) {
        throw createError(
          `Geçerli imsakiye satırı bulunamadı. (Ham: ${list.length}, Tarih parse fail: ${parseFailCount}, Vakit eksik: ${timeFailCount})`,
          'MONTHLY_EMPTY',
        );
      }

      return {
        rows,
        location: {
          ilceID: ilce.ilceID,
          ilceAdi: ilce.ilceAdi,
          sehirAdi: ilce.sehirAdi,
        },
        fetchedAt: new Date().toISOString(),
      };
    },
  });

  const data = result.value;
  let rows = data.rows;

  // İstenen tarih aralığına esnek kırpma
  if (startDate || endDate) {
    const startISO = startDate ? localDateKey(startDate) : null;
    const endISO = endDate ? localDateKey(endDate) : null;

    const apiMinISO = rows[0]?.iso ?? null;
    const apiMaxISO = rows[rows.length - 1]?.iso ?? null;

    // Eğer istenen tarih aralığı API kapsamı dışındaysa, çökmesini önle ve API'deki tüm verileri dön
    const isOutOfRange =
      (startISO && apiMaxISO && startISO > apiMaxISO) ||
      (endISO && apiMinISO && endISO < apiMinISO);

    if (isOutOfRange) {
      if (DEBUG) {
        console.warn(
          '[Diyanet Monthly] İstenen aralık API verisinin dışında kalıyor. Mevcut tüm imsakiye verisi gösteriliyor.',
        );
      }
    } else {
      const filtered = rows.filter((r) => {
        if (startISO && r.iso < startISO) return false;
        if (endISO && r.iso > endISO) return false;
        return true;
      });

      if (filtered.length > 0) {
        rows = filtered;
      }
    }
  }

  log(
    `Aylık imsakiye: ${data.location.sehirAdi}/${data.location.ilceAdi}`,
    `${rows.length} gün, kaynak: ${result.source}`,
  );

  return {
    rows,
    location: data.location,
    fetchedAt: data.fetchedAt,
    source: result.source,
    ...(result.warning ? { warning: result.warning } : {}),
  };
}

/* ================================================================
   Public API — Önbellek temizleme
   ================================================================ */

export async function clearDiyanetCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();

    const targets = keys.filter(
      (key) =>
        key.startsWith(CACHE_PREFIX) ||
        LEGACY_CACHE_PREFIXES.some((prefix) =>
          key.startsWith(prefix),
        ),
    );

    if (targets.length > 0) {
      await AsyncStorage.multiRemove(targets);
    }

    log(`${targets.length} önbellek kaydı temizlendi.`);

    return targets.length;
  } catch (error) {
    warn('Önbellek temizlenemedi:', error?.message);
    return 0;
  }
}