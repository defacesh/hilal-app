// src/services/zekatApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ================================================================
   Sabitler ve 5 Kasım 2026 Gerçekçi Güvenli Varsayılanları
   ================================================================ */
export const NISAP_GRAM_ALTIN = 85;
export const ZEKAT_ORANI = 0.025; // %2.5 = 1/40
export const GRAM_PER_TROY_OUNCE = 31.1034768;

export const DEFAULT_PRICES = {
  goldPerGram: 6654,
  silverPerGram: 85,
  usdRate: 50.00,
  eurRate: 56.27,
};

const CACHE_PREFIX = 'nida:zekat:v4:';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 saat
const NETWORK_TIMEOUT = 5000;

const FX_PRIMARY = 'https://open.er-api.com/v6/latest/TRY';
const GOLD_PRIMARY = 'https://api.gold-api.com/price/XAU';

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.savedAt && Date.now() - parsed.savedAt < CACHE_TTL) {
      return { ...parsed.value, cachedAt: parsed.savedAt };
    }
    await AsyncStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ value, savedAt: Date.now() }));
  } catch {}
}

async function fetchJson(url, timeoutMs = NETWORK_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ================================================================
   Güvenli Fiyat Çekme ve Doğrulama Zinciri
   ================================================================ */
export async function fetchZekatNisapAndPrices({ forceRefresh = false } = {}) {
  const cacheKey = `${CACHE_PREFIX}prices`;

  if (!forceRefresh) {
    const cached = await readCache(cacheKey);
    if (cached && cached.goldPerGram > 100) {
      return { ...cached, fromCache: true };
    }
  }

  try {
    const [fxJson, goldJson] = await Promise.all([
      fetchJson(FX_PRIMARY).catch(() => null),
      fetchJson(GOLD_PRIMARY).catch(() => null),
    ]);

    let usdRate = DEFAULT_PRICES.usdRate;
    let eurRate = DEFAULT_PRICES.eurRate;

    if (fxJson && fxJson.rates) {
      const u = Number(fxJson.rates.USD);
      const e = Number(fxJson.rates.EUR);
      // open.er-api TRY bazlı döndüğü için 1 / rate yaparak 1 Doların TL karşılığını buluyoruz
      if (u > 0) usdRate = Math.round((1 / u) * 100) / 100;
      if (e > 0) eurRate = Math.round((1 / e) * 100) / 100;
    }

    let goldPerGram = DEFAULT_PRICES.goldPerGram;
    if (goldJson && goldJson.price) {
      const ounceUsd = Number(goldJson.price);
      if (ounceUsd > 0) {
        // Ons fiyatından gram fiyatına ve TL'ye çeviri
        goldPerGram = Math.round(((ounceUsd / GRAM_PER_TROY_OUNCE) * usdRate) * 100) / 100;
      }
    }

    // GÜVENLİK FİLTRESİ: Eğer API'ler saçma veya çok düşük bir değer dönerse kul hakkı oluşmaması için varsayılan güvenli değerleri koru
    if (goldPerGram < 100 || usdRate < 10) {
      if (__DEV__) console.warn('[Zekat] API\'den gelen veriler güvenli sınırın altında, varsayılanlar kullanılıyor.');
      throw new Error('Geçersiz API verisi');
    }

    const result = {
      goldPerGram,
      silverPerGram: DEFAULT_PRICES.silverPerGram,
      usdRate,
      eurRate,
      nisapTL: NISAP_GRAM_ALTIN * goldPerGram,
      source: 'live',
      sourceLabel: 'Canlı Piyasa',
      lastUpdated: Date.now(),
    };

    await writeCache(cacheKey, result);
    return result;

  } catch (e) {
    if (__DEV__) console.warn('[Zekat] Canlı fiyat alınamadı, güvenli varsayılanlar devrede:', e?.message);
    
    const fallback = {
      ...DEFAULT_PRICES,
      nisapTL: NISAP_GRAM_ALTIN * DEFAULT_PRICES.goldPerGram,
      source: 'fallback',
      sourceLabel: 'Güvenli Sabit (5 Kasım 2026)',
      lastUpdated: Date.now(),
    };
    return fallback;
  }
}

/* ================================================================
   Yerel Hesaplama (Loglu ve Güvenli)
   ================================================================ */
const parseAmount = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val).replace(/\./g, '').replace(',', '.');
  return Number(clean) || 0;
};

export function calculateZekat(assets = {}, prices = DEFAULT_PRICES) {
  const cashTL = parseAmount(assets.cashTL);
  const cashUSD = parseAmount(assets.cashUSD) * (prices.usdRate || DEFAULT_PRICES.usdRate);
  const cashEUR = parseAmount(assets.cashEUR) * (prices.eurRate || DEFAULT_PRICES.eurRate);
  const goldTL = parseAmount(assets.goldGram) * (prices.goldPerGram || DEFAULT_PRICES.goldPerGram);
  const silverTL = parseAmount(assets.silverGram) * (prices.silverPerGram || DEFAULT_PRICES.silverPerGram);
  const goods = parseAmount(assets.commercialGoods);
  const receivables = parseAmount(assets.receivables);
  const debts = parseAmount(assets.debts);

  const totalAssets = cashTL + cashUSD + cashEUR + goldTL + silverTL + goods + receivables;
  const netAssets = Math.max(0, totalAssets - debts);
  const nisapTL = NISAP_GRAM_ALTIN * (prices.goldPerGram || DEFAULT_PRICES.goldPerGram);
  const isEligible = netAssets >= nisapTL && nisapTL > 0;
  const zekatAmount = isEligible ? netAssets * ZEKAT_ORANI : 0;

  if (__DEV__) {
    console.log('\n--- GÜVENLİ ZEKÂT HESAPLAMA LOGU ---');
    console.log('Kullanılan Fiyatlar:', prices);
    console.log('Net Varlık:', netAssets.toFixed(2), 'TL');
    console.log('Nisap Sınırı:', nisapTL.toFixed(2), 'TL');
    console.log('Zekât Mükellefi mi?:', isEligible);
    console.log('Ödenecek Zekât:', zekatAmount.toFixed(2), 'TL');
    console.log('-----------------------------------\n');
  }

  return {
    totalAssets,
    netAssets,
    nisapTL,
    isEligible,
    zekatAmount,
    source: 'local',
  };
}

export function calculateZekatAPI(assets = {}, prices = DEFAULT_PRICES) {
  return Promise.resolve(calculateZekat(assets, prices));
}

export async function clearZekatCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (targets.length) await AsyncStorage.multiRemove(targets);
    return targets.length;
  } catch {
    return 0;
  }
}