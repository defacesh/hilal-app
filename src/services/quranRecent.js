// src/services/quranRecent.js
// Son okunan sureleri AsyncStorage'da tutar.
// Store'a dokunmadan lokal cache ile çalışır.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@quran/recent_surahs/v1';
const MAX_ENTRIES = 10;

export async function addRecentSurah(surahNumber) {
  try {
    if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return;
    }

    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    const safe = Array.isArray(list) ? list : [];

    // Aynı sure varsa çıkar, başa ekle
    const filtered = safe.filter(
      (x) => x && Number.isFinite(x.n) && x.n !== surahNumber,
    );
    filtered.unshift({ n: surahNumber, t: Date.now() });

    await AsyncStorage.setItem(
      KEY,
      JSON.stringify(filtered.slice(0, MAX_ENTRIES)),
    );
  } catch {}
}

export async function getRecentSurahs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    return list
      .filter((x) => x && Number.isFinite(x.n) && Number.isFinite(x.t))
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export async function clearRecentSurahs() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}