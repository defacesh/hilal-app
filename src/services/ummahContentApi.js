// src/services/ummahContentApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getEsmaTR,
  VAKIT_DUA_TR,
  pickDuaTR,
  DEFAULT_MEAL_EDITION,
} from '../data/vakitContent';
import { getDailyNamePairs } from '../data/islamicNames';
import { fetchAyahTR } from './quranApi';

const API_BASE = 'https://ummahapi.com';
const CACHE_PREFIX = 'nida:ummah:v8:';

const CACHE_TTL = {
  dua: 7 * 24 * 60 * 60 * 1000,
  esma: 7 * 24 * 60 * 60 * 1000,
  daily: 12 * 60 * 60 * 1000,
};

const DEBUG = __DEV__;

/* Vakit → UmmahAPI dua kategorisi */
export const VAKIT_DUA_KATEGORI = {
  imsak: 'morning',
  sunrise: 'morning',
  dhuhr: 'prayer',
  asr: 'prayer',
  maghrib: 'evening',
  isha: 'evening',
};

/* Vakit → sabit esma havuzu */
export const VAKIT_ESMA_NUMARALARI = {
  imsak: [1, 4, 11, 17, 19, 34, 41, 62],
  dhuhr: [3, 9, 20, 28, 31, 40, 44, 46],
  asr: [6, 15, 30, 39, 51, 53, 66, 71],
  maghrib: [7, 11, 35, 42, 52, 76, 87, 94],
  isha: [4, 5, 8, 22, 38, 47, 59, 95],
};

/* Vakit → sabit ayet referansları */
export const VAKIT_AYAH_REF = {
  imsak: [
    { surah: 2, ayah: 152 },
    { surah: 3, ayah: 190 },
    { surah: 39, ayah: 53 },
    { surah: 6, ayah: 1 },
  ],
  dhuhr: [
    { surah: 103, ayah: 1 },
    { surah: 94, ayah: 5 },
    { surah: 2, ayah: 286 },
    { surah: 13, ayah: 28 },
  ],
  asr: [
    { surah: 14, ayah: 7 },
    { surah: 2, ayah: 155 },
    { surah: 65, ayah: 3 },
    { surah: 57, ayah: 4 },
  ],
  maghrib: [
    { surah: 24, ayah: 31 },
    { surah: 4, ayah: 110 },
    { surah: 71, ayah: 10 },
    { surah: 25, ayah: 70 },
  ],
  isha: [
    { surah: 67, ayah: 1 },
    { surah: 32, ayah: 16 },
    { surah: 17, ayah: 79 },
    { surah: 3, ayah: 190 },
  ],
};

/* ================================================================
   Yardımcılar
   ================================================================ */

function toSafeString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return '';
  if (Array.isArray(value)) {
    return value.map(toSafeString).filter(Boolean).join(' ');
  }
  if (typeof value === 'object') {
    for (const k of [
      'tr',
      'turkish',
      'en',
      'english',
      'text',
      'value',
      'meaning',
      'description',
    ]) {
      const v = value[k];
      if (typeof v === 'string' && v) return v;
      if (v && typeof v === 'object') {
        const nested = toSafeString(v);
        if (nested) return nested;
      }
    }
    return '';
  }
  return '';
}

let legacyPurged = false;
async function purgeLegacyCache() {
  if (legacyPurged) return;
  legacyPurged = true;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const old = keys.filter(
      (k) =>
        k.startsWith('nida:ummah:') && !k.startsWith(CACHE_PREFIX),
    );
    if (old.length) await AsyncStorage.multiRemove(old);
  } catch {}
}

async function readCache(key, ttl) {
  purgeLegacyCache();
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.savedAt && Date.now() - parsed.savedAt < ttl) {
      return parsed.value;
    }
    await AsyncStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ value, savedAt: Date.now() }),
    );
  } catch {}
}

async function fetchJson(path) {
  const url = `${API_BASE}${path}`;
  if (DEBUG) console.log('[UmmahAPI] GET', url);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (json?.success === false) {
    throw new Error(json?.error || 'API hatası');
  }
  return json;
}

/* ================================================================
   AYET — AlQuran Cloud
   ================================================================ */

export async function fetchAyah(
  surah,
  ayah,
  mealEdition = DEFAULT_MEAL_EDITION,
) {
  return fetchAyahTR(surah, ayah, mealEdition);
}

export async function fetchVakitAyah(
  prayerId,
  seed = 0,
  mealEdition = DEFAULT_MEAL_EDITION,
) {
  const pool = VAKIT_AYAH_REF[prayerId] ?? VAKIT_AYAH_REF.imsak;
  for (let i = 0; i < pool.length; i++) {
    const idx = (Math.abs(Math.floor(seed)) + i) % pool.length;
    const { surah, ayah } = pool[idx];
    const res = await fetchAyah(surah, ayah, mealEdition);
    if (res) return res;
  }
  return null;
}

export function getNextAyahRef(prayerId, currentIndex) {
  const pool = VAKIT_AYAH_REF[prayerId] ?? VAKIT_AYAH_REF.imsak;
  const nextIdx = (currentIndex + 1) % pool.length;
  return { ...pool[nextIdx], index: nextIdx };
}

/* ================================================================
   DUA — UmmahAPI şeması: data.duas[]
   ================================================================ */

export async function fetchVakitDua(prayerId, seed = 0) {
  const kategori = VAKIT_DUA_KATEGORI[prayerId] ?? 'morning';
  const key = `${CACHE_PREFIX}dua:${kategori}`;
  let list = await readCache(key, CACHE_TTL.dua);

  if (!Array.isArray(list) || list.length === 0) {
    try {
      const json = await fetchJson(
        `/api/duas/category/${kategori}`,
      );

      const data = json?.data;
      if (!data || typeof data !== 'object') return null;

      const rawList = Array.isArray(data.duas) ? data.duas : [];
      if (rawList.length === 0) return null;

      list = rawList
        .filter((d) => d && typeof d === 'object')
        .map((d) => ({
          id: d.id ?? null,
          arabic: toSafeString(d.arabic),
          englishTitle: toSafeString(d.title),
        }))
        .filter((d) => d.arabic);

      if (list.length) await writeCache(key, list);
    } catch (error) {
      console.warn(
        `[Dua ${kategori}] alınamadı:`,
        error?.message,
      );
      return null;
    }
  }

  if (!list || list.length === 0) return null;

  const day = new Date().getDate();
  const idx = Math.abs(Math.floor(seed + day)) % list.length;
  const picked = list[idx];

  const trDua = pickDuaTR(prayerId, seed);

  return {
    id: picked.id,
    arabic: picked.arabic,
    text: trDua?.tr ?? '(Türkçe dua mevcut değil)',
    kaynak: trDua?.kaynak ?? 'Dua',
    englishTitle: picked.englishTitle,
    hasTurkish: Boolean(trDua?.tr),
  };
}

/* ================================================================
   ESMA
   ================================================================ */

export async function fetchVakitEsma(prayerId, seed = 0) {
  const nums =
    VAKIT_ESMA_NUMARALARI[prayerId] ??
    VAKIT_ESMA_NUMARALARI.imsak;
  const idx = Math.abs(Math.floor(seed)) % nums.length;
  const number = nums[idx];

  const key = `${CACHE_PREFIX}esma:${number}`;
  const cached = await readCache(key, CACHE_TTL.esma);
  if (
    cached &&
    typeof cached === 'object' &&
    typeof cached.name === 'string' &&
    typeof cached.meaning === 'string' &&
    typeof cached.arabic === 'string'
  ) {
    return cached;
  }

  const tr = getEsmaTR(number);

  try {
    const json = await fetchJson(
      `/api/asma-ul-husna/${number}`,
    );
    const data = json?.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Esma yanıtı geçersiz');
    }

    const nameObj =
      data.name && typeof data.name === 'object'
        ? data.name
        : data;

    const arabic = toSafeString(nameObj.arabic);
    const transliteration = toSafeString(
      nameObj.transliteration,
    );
    const apiMeaningEn =
      toSafeString(nameObj.meaning) ||
      toSafeString(nameObj.english);

    if (!arabic && !transliteration && !tr) return null;

    const result = {
      number: Number(nameObj.number ?? number) || number,
      name: tr?.name || transliteration || '',
      arabic,
      meaning: tr?.meaning || apiMeaningEn || '',
      _nameSource: tr?.name ? 'local' : 'api',
      _meaningSource: tr?.meaning ? 'local' : 'api',
      _offline: false,
    };

    await writeCache(key, result);
    return result;
  } catch (error) {
    console.warn(
      `[Esma ${number}] alınamadı:`,
      error?.message,
    );

    if (tr) {
      return {
        number,
        name: tr.name,
        arabic: '',
        meaning: tr.meaning,
        _nameSource: 'local',
        _meaningSource: 'local',
        _offline: true,
      };
    }
    return null;
  }
}

/* ================================================================
   İSLAMİ İSİMLER — Yerel veri (getDailyNamePairs)
   ================================================================ */

/**
 * Günün İslami isimlerini getirir.
 * Sıra: [kız, erkek, ...ekstra isimler]
 *
 * @param {number} limit 2-50 (default 2)
 */
export async function fetchIslamicNames(limit = 2) {
  const clamped = Math.max(
    2,
    Math.min(50, Number(limit) || 2),
  );

  try {
    const list = getDailyNamePairs(clamped);

    if (DEBUG) {
      console.log(
        `[Names] getDailyNamePairs döndü: ${list.length}`,
      );
      if (list[0]) {
        console.log('[Names] ilk:', list[0].name);
      }
    }

    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn(
      '[Names] getDailyNamePairs hata:',
      e?.message,
    );
    return [];
  }
}

/* ================================================================
   HİCRİ TARİH
   ================================================================ */
const HIJRI_MONTHS_TR = {
  Muharram: 'Muharrem',
  Safar: 'Safer',
  "Rabi' al-awwal": 'Rebiülevvel',
  "Rabi' al-thani": 'Rebiülahir',
  "Jumada al-awwal": 'Cemaziyelevvel',
  "Jumada al-thani": 'Cemaziyelahir',
  Rajab: 'Recep',
  "Sha'ban": 'Şaban',
  Ramadan: 'Ramazan',
  Shawwal: 'Şevval',
  "Dhu al-Qi'dah": 'Zilkade',
  "Dhu al-Hijjah": 'Zilhicce',
  'Rabi al-awwal': 'Rebiülevvel',
  'Rabi al-thani': 'Rebiülahir',
  'Jumada al-awwal': 'Cemaziyelevvel',
  'Jumada al-thani': 'Cemaziyelahir',
  Shaban: 'Şaban',
  'Dhu al-Qidah': 'Zilkade',
  'Dhu al-Hijjah': 'Zilhicce',
};

export async function fetchTodayHijri() {
  const key = `${CACHE_PREFIX}hijri:today`;
  const cached = await readCache(key, CACHE_TTL.daily);
  if (cached && typeof cached.formatted === 'string') {
    return cached;
  }

  try {
    const json = await fetchJson('/api/today-hijri');
    const raw = json?.data ?? json;
    if (!raw || typeof raw !== 'object') return null;

    const monthEn =
      toSafeString(raw.month?.en) ||
      toSafeString(raw.month?.name) ||
      toSafeString(raw.month);

    const monthTr = HIJRI_MONTHS_TR[monthEn] ?? monthEn;

    const result = {
      day: raw.day,
      month: monthTr,
      year: raw.year,
      formatted: [raw.day, monthTr, raw.year]
        .filter(Boolean)
        .join(' '),
    };
    await writeCache(key, result);
    return result;
  } catch (error) {
    console.warn('[Hicri] alınamadı:', error?.message);
    return null;
  }
}

/* ================================================================
   CACHE TEMİZLEME
   ================================================================ */

export async function clearUmmahContentCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter(
      (k) =>
        k.startsWith('nida:ummah:') ||
        k.startsWith('nida:quran:'),
    );
    if (targets.length) await AsyncStorage.multiRemove(targets);
    return targets.length;
  } catch {
    return 0;
  }
}