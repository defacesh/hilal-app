import AsyncStorage from '@react-native-async-storage/async-storage';

/* ================================================================
   Sabitler
   ================================================================ */

const API_BASE = 'https://api.aladhan.com/v1';
const DEFAULT_METHOD = 13; // Diyanet İşleri Başkanlığı (Türkiye)
const CACHE_VERSION = 'v5';
const IN_MEMORY_TTL_MS = 5 * 60 * 1000; // aynı process içinde 5 dk tekrar sorma

/* Hicri ay isimleri (Aladhan / diakritik varyasyonlar → Türkçe) */
const HIJRI_MONTHS_TR = {
  muharram: 'Muharrem',
  safar: 'Safer',
  'rabi al-awwal': 'Rebiülevvel',
  'rabi al-thani': 'Rebiülahir',
  'rabi al-akhir': 'Rebiülahir',
  'jumada al-awwal': 'Cemaziyelevvel',
  'jumada al-ula': 'Cemaziyelevvel',
  'jumada al-thani': 'Cemaziyelahir',
  'jumada al-akhirah': 'Cemaziyelahir',
  'jumada al-akhira': 'Cemaziyelahir',
  rajab: 'Recep',
  shaban: 'Şaban',
  "sha'ban": 'Şaban',
  ramadan: 'Ramazan',
  shawwal: 'Şevval',
  'dhu al-qidah': 'Zilkade',
  "dhu al-qa'dah": 'Zilkade',
  'dhu al-hijjah': 'Zilhicce',
};

/* ================================================================
   Yardımcılar
   ================================================================ */

const toTimestamp = (date) => Math.floor(date.getTime() / 1000);

const localDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const cacheKey = (latitude, longitude, date, method) =>
  `nida:prayer-times:${CACHE_VERSION}:${latitude.toFixed(4)}:${longitude.toFixed(4)}:m${method}:${localDateKey(date)}`;

/**
 * Aladhan `timings` nesnesini sadeleştirir.
 * Örn. `"05:42 (EET)"` → `"05:42"`
 */
const normalizeTimings = (timings) => {
  if (
    !timings?.Imsak ||
    !timings?.Sunrise ||
    !timings?.Dhuhr ||
    !timings?.Asr ||
    !timings?.Maghrib ||
    !timings?.Isha
  ) {
    throw new Error('API yanıtında eksik namaz vakti var.');
  }

  const clean = (value) => String(value).match(/\d{1,2}:\d{2}/)?.[0];

  const result = {
    imsak: clean(timings.Imsak),
    sunrise: clean(timings.Sunrise),
    dhuhr: clean(timings.Dhuhr),
    asr: clean(timings.Asr),
    maghrib: clean(timings.Maghrib),
    isha: clean(timings.Isha),
  };

  if (Object.values(result).some((value) => !value)) {
    throw new Error('Namaz vakti biçimi tanınamadı.');
  }

  return result;
};

/**
 * Diakritik işaretleri temizleyip ay anahtarını normalize eder.
 * Örn. "Jumādá al-ākhirah" → "jumada al-akhirah"
 */
const cleanHijriKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[āàáâãä]/g, 'a')
    .replace(/[ēèéêë]/g, 'e')
    .replace(/[īìíîï]/g, 'i')
    .replace(/[ōòóôõö]/g, 'o')
    .replace(/[ūùúûü]/g, 'u')
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, ' ');

/**
 * Aladhan hijri bilgisini (veya İngilizce hijri metnini) Türkçe string'e dönüştürür.
 * Örn. { day: "6", month: { en: "Jumādá al-ākhirah" }, year: "1448" } → "6 Cemaziyelahir 1448"
 */
const normalizeHijri = (hijri) => {
  if (!hijri) return '';

  if (typeof hijri === 'string') {
    const cleaned = cleanHijriKey(hijri);
    for (const [enKey, trName] of Object.entries(HIJRI_MONTHS_TR)) {
      if (cleaned.includes(enKey)) {
        const parts = hijri.trim().split(/\s+/);
        if (parts.length >= 3) {
          return `${parts[0]} ${trName} ${parts[parts.length - 1]}`;
        }
        return trName;
      }
    }
    return hijri.trim();
  }

  const monthEn = hijri.month?.en ?? '';
  const monthTr = HIJRI_MONTHS_TR[cleanHijriKey(monthEn)] ?? monthEn;
  return [hijri.day, monthTr, hijri.year].filter(Boolean).join(' ').trim();
};

/* ================================================================
   In-memory cache (process ömrü boyunca)
   ================================================================ */

const memoryCache = new Map(); // key → { value, expiresAt }

const memGet = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const memSet = (key, value) => {
  memoryCache.set(key, { value, expiresAt: Date.now() + IN_MEMORY_TTL_MS });
};

/* ================================================================
   AsyncStorage cache
   ================================================================ */

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.hijri) {
      parsed.hijri = normalizeHijri(parsed.hijri);
    }
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ ...value, cachedAt: new Date().toISOString() }),
    );
  } catch {
    // Cache yazımı başarısız olsa da canlı yanıt geçerli kalır
  }
}

/* ================================================================
   API çağrısı
   ================================================================ */

async function fetchDay(latitude, longitude, date, method) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    method: String(method),
    school: '0', // Standart / Asr-ı Evvel (Diyanet İşleri Başkanlığı ile uyumlu)
  });
  const url = `${API_BASE}/timings/${toTimestamp(date)}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Namaz vakti API hatası (${response.status}).`);
  }

  const json = await response.json();
  if (json?.code !== 200 || !json?.data?.timings) {
    throw new Error('Namaz vakitleri API yanıtından alınamadı.');
  }

  return {
    times: normalizeTimings(json.data.timings),
    hijri: normalizeHijri(json.data.date?.hijri),
    gregorianDate: json.data.date?.gregorian?.date ?? localDateKey(date),
    timezone: json.data.meta?.timezone ?? null,
    method: Number(json.data.meta?.method?.id) ?? method,
  };
}

/* ================================================================
   Sapma (tune) uygulama
   ================================================================ */

/**
 * @param {{ times: object, hijri: string, gregorianDate: string }} data
 * @param {number} minutes  +/− dakika
 */
function applyTune(data, minutes) {
  const normalizedData = data?.hijri
    ? { ...data, hijri: normalizeHijri(data.hijri) }
    : data;

  if (!minutes || !Number.isFinite(minutes) || minutes === 0) return normalizedData;

  const shift = (timeStr) => {
    if (!timeStr) return timeStr;
    const m = String(timeStr).match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return timeStr;
    let total = Number(m[1]) * 60 + Number(m[2]) + minutes;
    total = ((total % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const mm = total % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  return {
    ...normalizedData,
    times: {
      imsak: shift(normalizedData.times.imsak),
      sunrise: shift(normalizedData.times.sunrise),
      dhuhr: shift(normalizedData.times.dhuhr),
      asr: shift(normalizedData.times.asr),
      maghrib: shift(normalizedData.times.maghrib),
      isha: shift(normalizedData.times.isha),
    },
  };
}

/* ================================================================
   Public API
   ================================================================ */

export async function fetchPrayerTimesFromAPI(latitude, longitude, options = {}) {
  const { method = DEFAULT_METHOD, tuneMinutes = 0, bypassCache = false } = options;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Geçerli bir konum seçilmemiş.');
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayKey = cacheKey(latitude, longitude, today, method);
  const tomorrowKey = cacheKey(latitude, longitude, tomorrow, method);

  /* 1) In-memory cache (yalnızca bypass kapalıysa) */
  if (!bypassCache) {
    const memToday = memGet(todayKey);
    const memTomorrow = memGet(tomorrowKey);
    if (memToday) {
      return {
        ...memToday,
        hijri: normalizeHijri(memToday.hijri),
        tomorrowImsak: memTomorrow?.times?.imsak ?? null,
        source: 'live',
        fetchedAt: new Date().toISOString(),
        warning: null,
      };
    }
  }

  /* 2) API paralel çek */
  const [todayResult, tomorrowResult] = await Promise.allSettled([
    fetchDay(latitude, longitude, today, method),
    fetchDay(latitude, longitude, tomorrow, method),
  ]);

  const [cachedToday, cachedTomorrow] = await Promise.all([
    readCache(todayKey),
    readCache(tomorrowKey),
  ]);

  /* 3) Bugünkü canlı veri geldi */
  if (todayResult.status === 'fulfilled') {
    const todayData = applyTune(todayResult.value, tuneMinutes);
    memSet(todayKey, todayData);
    await writeCache(todayKey, todayData);

    let tomorrowImsak = cachedTomorrow?.times?.imsak ?? null;

    if (tomorrowResult.status === 'fulfilled') {
      const tomorrowData = applyTune(tomorrowResult.value, tuneMinutes);
      memSet(tomorrowKey, tomorrowData);
      await writeCache(tomorrowKey, tomorrowData);
      tomorrowImsak = tomorrowData.times.imsak;
    }

    return {
      ...todayData,
      tomorrowImsak,
      source: 'live',
      fetchedAt: new Date().toISOString(),
      warning: tomorrowImsak ? null : 'Yarının imsak vakti şu an alınamadı.',
    };
  }

  /* 4) Bugünkü canlı veri gelmedi → AsyncStorage cache */
  if (cachedToday?.times) {
    return {
      ...applyTune(cachedToday, tuneMinutes),
      tomorrowImsak: cachedTomorrow?.times?.imsak
        ? applyTune(cachedTomorrow, tuneMinutes).times.imsak
        : null,
      source: 'cache',
      fetchedAt: cachedToday.cachedAt ?? null,
      warning: todayResult.reason?.message ?? 'API bağlantısı kurulamadı.',
    };
  }

  /* 5) Hiç cache yok */
  throw new Error(
    'Namaz vakitleri alınamadı ve bu konum için kayıtlı veri yok. İnternet bağlantınızı kontrol edip tekrar deneyin.',
  );
}

/* ================================================================
   Yardımcı export'lar
   ================================================================ */

export const prayerApi = {
  defaultMethod: DEFAULT_METHOD,
  methods: [
    { id: 13, name: 'Diyanet İşleri Başkanlığı (Türkiye)' },
    { id: 3, name: 'Muslim World League (MWL)' },
    { id: 2, name: 'Islamic Society of North America (ISNA)' },
    { id: 5, name: 'Egyptian General Authority of Survey' },
    { id: 4, name: 'Umm Al-Qura University, Makkah' },
    { id: 1, name: 'University of Islamic Sciences, Karachi' },
  ],
  fetch: fetchPrayerTimesFromAPI,
};

export async function clearPrayerCache() {
  try {
    memoryCache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter(
      (k) =>
        k.startsWith(`nida:prayer-times:${CACHE_VERSION}:`) ||
        k.startsWith('nida:prayer-times:'),
    );
    if (targets.length) {
      await AsyncStorage.multiRemove(targets);
    }
    return targets.length;
  } catch (error) {
    console.warn('Önbellek temizlenemedi:', error);
    return 0;
  }
}