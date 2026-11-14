// src/utils/quranReferences.js
import { QURAN_SURAHS, getSurahByNumber } from '../data/quranSurahs';

const trLower = (s) => String(s ?? '').toLocaleLowerCase('tr-TR');

/**
 * Metindeki İngilizce/Arapça sure isimlerini normalize eder.
 * "At-Talaaq", "Al-Baqarah", "Ash-Sharh" gibi takıları ve çift harfleri temizler.
 */
function normalizeSurahName(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .replace(/^(al|an|at|as|ash|az|ad|ar|az)-/i, '') // "At-", "Al-" takılarını sil
    .replace(/aa/g, 'a') // "Talaaq" -> "Talaq"
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/q$/i, 'k')  // "Talaq" -> "Talak"
    .replace(/q/i, 'k')
    .replace(/['’`]/g, '') // Kesme işaretlerini kaldır
    .toLowerCase();
}

/* ================================================================
   İngilizce isim → Türkçe isim
   ================================================================ */
export function getTurkishSurahName(englishName) {
  if (!englishName) return '';

  const raw = String(englishName).trim();
  if (!raw) return '';

  // 1) Birebir eşleşme
  let found = QURAN_SURAHS.find(
    (s) => s.englishName && trLower(s.englishName) === trLower(raw)
  );
  if (found) return found.name;

  // 2) Zaten Türkçe isim mi?
  found = QURAN_SURAHS.find((s) => trLower(s.name) === trLower(raw));
  if (found) return found.name;

  // 3) Normalize edilmiş gelişmiş eşleşme (At-Talaaq -> Talaq -> Talâk)
  const normInput = normalizeSurahName(raw);
  found = QURAN_SURAHS.find((s) => {
    const normEng = normalizeSurahName(s.englishName);
    const normTr = normalizeSurahName(s.name);
    return normEng === normInput || normTr === normInput;
  });
  if (found) return found.name;

  // 4) Kısmi eşleşme (Fallback)
  found = QURAN_SURAHS.find(
    (s) => s.englishName && normalizeSurahName(s.englishName).includes(normInput)
  );
  if (found) return found.name;

  return raw;
}

/* ================================================================
   Sure numarası → Türkçe isim
   ================================================================ */
export function getSurahNameByNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '';
  return getSurahByNumber(num)?.name || '';
}

/* ================================================================
   Referans formatlayıcı
   ================================================================ */
export function formatVerseReference(reference) {
  if (!reference) return '';

  let s = String(reference).trim();
  if (!s) return '';

  // Metin temizliği
  s = s
    .replace(/\bSurah\b/gi, '')
    .replace(/\bSura\b/gi, '')
    .replace(/\bAyah\b/gi, '')
    .replace(/\bAyat\b/gi, '')
    .replace(/\bVerse\b/gi, '')
    .replace(/\bChapter\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Format 1: "At-Talaaq 65:1" veya "At-Talaaq: 65:1"
  const m1 = s.match(/^([A-Za-zÂ-ÿ'’\-\s.]+?)\s*[:,]?\s*(\d+)\s*:\s*(\d+)$/);
  if (m1) {
    const name = getTurkishSurahName(m1[1].trim());
    return `${name} ${m1[2]}:${m1[3]}`;
  }

  // Format 2: "At-Talaaq 1" veya "At-Talaaq, 1"
  const m2 = s.match(/^([A-Za-zÂ-ÿ'’\-\s.]+?)\s*[,:]?\s*(\d+)$/);
  if (m2) {
    const name = getTurkishSurahName(m2[1].trim());
    return `${name} ${m2[2]}. Ayet`;
  }

  // Format 3: "65:1" (sadece sayı)
  if (/^\d+\s*:\s*\d+$/.test(s)) return s;

  // Format 4: Sadece isim
  return getTurkishSurahName(s);
}

/* ================================================================
   Yapısal alanlardan referans
   ================================================================ */
export function buildVerseReference({
  surahName,
  surahNumber,
  ayahNumber,
  englishName,
}) {
  if (surahNumber && ayahNumber) {
    const turkishName = getSurahNameByNumber(surahNumber);
    if (turkishName) return `${turkishName} ${surahNumber}:${ayahNumber}`;
    return `${surahNumber}:${ayahNumber}`;
  }

  if (englishName && ayahNumber) {
    const turkishName = getTurkishSurahName(englishName);
    return `${turkishName} ${ayahNumber}. Ayet`;
  }

  if (surahName && ayahNumber) {
    return `${surahName} ${ayahNumber}. Ayet`;
  }

  return surahName || (englishName ? getTurkishSurahName(englishName) : '');
}