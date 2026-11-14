#!/usr/bin/env node
// Kullanım: node scripts/downloadQuran.js
//
// Tüm Kur'an surelerini indirir: Arapça (Uthmani) + Türkçe (Diyanet) + Latin (transliteration)
// + standart Madani Mushaf sayfa numarası
// Kaynak: AlQuran Cloud API (https://alquran.cloud)
// Çıktı: assets/quran/{1..114}.json

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'quran');
const BASE = 'https://api.alquran.cloud/v1/surah';

// Aynı anda kaç sure indirilsin
const PARALLEL = 4;

// Retry yapısı
const RETRY = 3;
const DELAY = 800;

function ensureDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, attempt = 0) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (attempt < RETRY - 1) {
      await sleep(DELAY * (attempt + 1));
      return fetchWithRetry(url, attempt + 1);
    }
    throw e;
  }
}

async function fetchSurah(n) {
  // 3 edition birden iste: Arapça + Türkçe + Latin
  const url = `${BASE}/${n}/editions/quran-uthmani,tr.diyanet,en.transliteration`;
  const json = await fetchWithRetry(url);

  if (json?.code !== 200 || !Array.isArray(json.data)) {
    throw new Error(`Sure ${n}: geçersiz yanıt`);
  }

  const arabicEdition = json.data.find(
    (d) => d?.edition?.identifier === 'quran-uthmani',
  );
  const turkishEdition = json.data.find(
    (d) => d?.edition?.identifier === 'tr.diyanet',
  );
  const latinEdition = json.data.find(
    (d) => d?.edition?.identifier === 'en.transliteration',
  );

  if (!arabicEdition || !turkishEdition) {
    throw new Error(`Sure ${n}: Arapça veya Türkçe edition eksik`);
  }

  const arabicAyahs = arabicEdition.ayahs || [];
  const turkishAyahs = turkishEdition.ayahs || [];
  const latinAyahs = latinEdition?.ayahs || [];

  const trByNumber = new Map();
  turkishAyahs.forEach((a) => trByNumber.set(a.numberInSurah, a.text));

  const ltByNumber = new Map();
  latinAyahs.forEach((a) => ltByNumber.set(a.numberInSurah, a.text));

  // Her ayet için:
  //   n = ayet numarası (sure içi)
  //   ar = Arapça metin (Uthmani)
  //   tr = Türkçe meal (Diyanet)
  //   lt = Latin okunuş
  //   p = standart Madani Mushaf sayfa numarası (1-604)
  const verses = arabicAyahs.map((a) => ({
    n: a.numberInSurah,
    ar: String(a.text || '').trim(),
    tr: String(trByNumber.get(a.numberInSurah) || '').trim(),
    lt: String(ltByNumber.get(a.numberInSurah) || '').trim(),
    p: Number(a.page) || null,
  }));

  // Doğrulama: her ayetin Arapça metni olmalı
  if (verses.length === 0 || verses.some((v) => !v.ar)) {
    throw new Error(`Sure ${n}: Arapça metin eksik`);
  }

  // Sayfa doğrulama: en az bir ayette page olmalı
  const withPage = verses.filter((v) => Number.isFinite(v.p) && v.p > 0);
  if (withPage.length === 0) {
    console.warn(`⚠ Sure ${n}: page alanı gelmedi (fallback kullanılacak)`);
  }

  const firstPage = withPage[0]?.p;
  const lastPage = withPage[withPage.length - 1]?.p;

  return {
    number: n,
    name: arabicEdition.englishName || `Surah ${n}`,
    nameTr: arabicEdition.englishNameTranslation || '',
    ayahCount: verses.length,
    firstPage,
    lastPage,
    verses,
  };
}

async function worker(queue, results) {
  while (queue.length > 0) {
    const n = queue.shift();
    if (n == null) continue;

    try {
      process.stdout.write(`[${String(n).padStart(3, ' ')}/114] `);
      const surah = await fetchSurah(n);
      const filePath = path.join(OUT_DIR, `${n}.json`);
      fs.writeFileSync(filePath, JSON.stringify(surah, null, 0));
      const kb = (fs.statSync(filePath).size / 1024).toFixed(1);
      const pageInfo =
        surah.firstPage && surah.lastPage
          ? `s.${surah.firstPage}${surah.lastPage !== surah.firstPage ? '-' + surah.lastPage : ''}`
          : 's.?';
      console.log(
        `✓ ${surah.name.padEnd(20)} ${String(surah.ayahCount).padStart(3)} ayet · ${kb.padStart(5)} KB · ${pageInfo}`,
      );
      results[n] = surah;
    } catch (e) {
      console.log(`✗ Sure ${n}: ${e.message}`);
      queue.push(n);
      await sleep(1500);
    }
  }
}

async function main() {
  ensureDir();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Kur\'an İndirme Script\'i');
  console.log('  Arapça (Uthmani) + Türkçe (Diyanet) + Latin + Sayfa');
  console.log('  Çıktı:', OUT_DIR);
  console.log('═══════════════════════════════════════════════════════\n');

  const queue = Array.from({ length: 114 }, (_, i) => i + 1);
  const results = {};
  const workers = Array.from({ length: PARALLEL }, () => worker(queue, results));

  await Promise.all(workers);

  const totalBytes = Object.values(results).reduce((sum, s) => {
    return sum + JSON.stringify(s).length;
  }, 0);

  const totalAyahs = Object.values(results).reduce(
    (sum, s) => sum + (s.ayahCount || 0),
    0,
  );

  const allWithPage = Object.values(results).every(
    (s) => Array.isArray(s.verses) && s.verses.every((v) => v.p),
  );

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  TAMAMLANDI: ${Object.keys(results).length} / 114 sure`);
  console.log(`  Toplam ayet: ${totalAyahs} / 6236`);
  console.log(`  Toplam boyut: ~${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `  Sayfa bilgisi: ${allWithPage ? '✓ 604/604 sayfa kapsandı' : '⚠ bazı surelerde page eksik'}`,
  );
  console.log(`  Dizin: ${OUT_DIR}`);
  console.log('═══════════════════════════════════════════════════════');

  // Bundle index dosyası üret
  console.log('\nBundle index oluşturuluyor…');
  const requireLines = [];
  for (let i = 1; i <= 114; i += 1) {
    requireLines.push(`  ${i}: require('../../assets/quran/${i}.json'),`);
  }

  const indexPath = path.join(
    __dirname,
    '..',
    'src',
    'data',
    'quranOfflineBundle.js',
  );
  const indexContent = `// src/data/quranOfflineBundle.js
// OTOMATİK ÜRETİLDİ — scripts/downloadQuran.js tarafından
// Elle düzenlemeyin.

/* eslint-disable global-require */
export const QURAN_BUNDLES = {
${requireLines.join('\n')}
};

export const hasOfflineBundle = (n) => Boolean(QURAN_BUNDLES[n]);

export const getOfflineBundle = (n) => QURAN_BUNDLES[n] ?? null;

export const getOfflineSurahList = () => {
  return Object.values(QURAN_BUNDLES)
    .filter(Boolean)
    .map((s) => ({
      id: s.number,
      name: s.name,
      nameTr: s.nameTr,
      verseCount: s.ayahCount,
      firstPage: s.firstPage,
      lastPage: s.lastPage,
    }));
};
`;
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✓ ${indexPath} oluşturuldu`);
  console.log('\nŞimdi uygulamayı yeniden başlatın:');
  console.log('  npx expo start -c\n');
}

main().catch((e) => {
  console.error('\n✗ HATA:', e.message);
  process.exit(1);
});