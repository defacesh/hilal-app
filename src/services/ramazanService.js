// src/services/ramazanService.js
// Aladhan API tabanlı, çoklu ay destekli Ramazan ve imsakiye servisi

import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_CACHE_PREFIX = '@nida_ramazan_';

/* ================================================================
   Yardımcılar
   ================================================================ */
const pad = (v) => String(v).padStart(2, '0');
const toLocalISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function normalizeTime(timeStr) {
  if (!timeStr) return null;
  const match = String(timeStr).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

// Belirli bir yıl ve ay için Aladhan takvim verisini çeker
async function fetchAladhanMonth(year, month, lat, lng, method, signal) {
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${method}`;

  if (__DEV__) {
    console.log('[Aladhan Ramazan] GET', url);
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Aladhan API hatası (${response.status})`);
  }

  const json = await response.json();
  if (json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error('Aladhan verisi geçersiz formatta döndü.');
  }

  return json.data.map((item) => {
    const gDate = item.date.gregorian;
    const [d, m, y] = gDate.date.split('-');
    const iso = `${y}-${m}-${d}`;

    return {
      iso,
      hijri: `${item.date.hijri.day} ${item.date.hijri.month.en} ${item.date.hijri.year}`,
      imsak: normalizeTime(item.timings.Imsak),
      gunes: normalizeTime(item.timings.Sunrise),
      ogle: normalizeTime(item.timings.Dhuhr),
      ikindi: normalizeTime(item.timings.Asr),
      aksam: normalizeTime(item.timings.Maghrib),
      yatsi: normalizeTime(item.timings.Isha),
      source: 'aladhan',
    };
  });
}

/* ================================================================
   Public: Ramazan imsakiyesi (Çoklu Ay Birleştirme Destekli)
   ================================================================ */
export async function fetchRamazanImsakiye({
  ramazanStart,
  location,
  method = 13, // Diyanet / Türkiye hesaplama metodu
  signal,
}) {
  if (!ramazanStart) {
    throw new Error('Ramazan başlangıç tarihi belirtilmedi.');
  }
  if (signal?.aborted) {
    const err = new Error('İstek iptal edildi.');
    err.code = 'ABORTED';
    throw err;
  }

  const lat = location?.latitude ?? 41.0082;
  const lng = location?.longitude ?? 28.9784;

  const startDate = new Date(ramazanStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 29); // 30 günlük Ramazan dönemi

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  // Başlangıç ve bitiş aylarını belirle (Aynı ay veya farklı aylar olabilir)
  const monthsToFetch = [{ year: startYear, month: startMonth }];
  if (startYear !== endYear || startMonth !== endMonth) {
    monthsToFetch.push({ year: endYear, month: endMonth });
  }

  // Gerekli ayların verilerini paralel olarak çek
  const monthResults = await Promise.all(
    monthsToFetch.map((m) => fetchAladhanMonth(m.year, m.month, lat, lng, method, signal))
  );

  // Gelen aylık verileri tek bir dizide birleştir ve tarihe göre sırala
  const allDays = monthResults.flat();
  const targetIsoStart = toLocalISO(startDate);
  const targetIsoEnd = toLocalISO(endDate);

  const filteredRows = allDays
    .filter((r) => r.iso >= targetIsoStart && r.iso <= targetIsoEnd)
    .sort((a, b) => (a.iso < b.iso ? -1 : 1));

  if (filteredRows.length === 0) {
    throw new Error('Ramazan dönemi için Aladhan imsakiye verisi bulunamadı.');
  }

  const todayISO = toLocalISO(new Date());

  return filteredRows.map((r, i) => ({
    ...r,
    dayNumber: i + 1,
    isToday: r.iso === todayISO,
  }));
}

/* ================================================================
   Public: Bugünün imsakiye satırı
   ================================================================ */
export async function fetchTodayImsakiye({ location, method = 13, signal }) {
  if (signal?.aborted) {
    const err = new Error('İstek iptal edildi.');
    err.code = 'ABORTED';
    throw err;
  }

  const lat = location?.latitude ?? 41.0082;
  const lng = location?.longitude ?? 28.9784;
  const today = new Date();

  const dayStr = pad(today.getDate());
  const monthStr = pad(today.getMonth() + 1);
  const yearStr = today.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${dayStr}-${monthStr}-${yearStr}?latitude=${lat}&longitude=${lng}&method=${method}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error('Bugünün vakitleri alınamadı.');
  }

  const json = await response.json();
  if (json.code !== 200 || !json.data) {
    return null;
  }

  const timings = json.data.timings;
  const todayISO = toLocalISO(today);

  return {
    iso: todayISO,
    imsak: normalizeTime(timings.Imsak),
    gunes: normalizeTime(timings.Sunrise),
    ogle: normalizeTime(timings.Dhuhr),
    ikindi: normalizeTime(timings.Asr),
    aksam: normalizeTime(timings.Maghrib),
    yatsi: normalizeTime(timings.Isha),
    source: 'aladhan',
    isToday: true,
  };
}

/* ================================================================
   Public: Eski ramazan cache'ini temizle
   ================================================================ */
export async function clearRamazanCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const legacy = keys.filter((k) => k.startsWith(LEGACY_CACHE_PREFIX));
    if (legacy.length > 0) await AsyncStorage.multiRemove(legacy);
    return legacy.length;
  } catch {
    return 0;
  }
}