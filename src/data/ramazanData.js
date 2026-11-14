// src/data/ramazanData.js
// Ramazan ayı, kandiller ve dinî günler için sabit veriler + yardımcılar

/* ================================================================
   Hicri ay isimleri
   ================================================================ */
export const HIJRI_MONTHS = [
  'Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir',
  'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban',
  'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce',
];

/* ================================================================
   Bilinen dinî günler (2024–2030 yaklaşık)
   — Diyanet takvimine göre miladi tarihler
   — Ramazan ayı için ayrı hesap yapılır
   ================================================================ */
export const RELIGIOUS_DAYS = [
  // 2025
  { id: 'kandil-miraç-2025', date: '2025-01-26', name: 'Miraç Kandili', type: 'kandil' },
  { id: 'kandil-berat-2025', date: '2025-02-13', name: 'Berat Kandili', type: 'kandil' },
  { id: 'ramazan-baslangic-2025', date: '2025-03-01', name: 'Ramazan Başlangıcı', type: 'ramazan' },
  { id: 'kadir-gecesi-2025', date: '2025-03-26', name: 'Kadir Gecesi', type: 'kandil' },
  { id: 'ramazan-bayrami-2025', date: '2025-03-30', name: 'Ramazan Bayramı', type: 'bayram' },
  { id: 'kurban-bayrami-2025', date: '2025-06-06', name: 'Kurban Bayramı', type: 'bayram' },

  // 2026
  { id: 'kandil-regaip-2026', date: '2026-01-15', name: 'Regaip Kandili', type: 'kandil' },
  { id: 'kandil-miraç-2026', date: '2026-01-16', name: 'Miraç Kandili', type: 'kandil' },
  { id: 'kandil-berat-2026', date: '2026-02-02', name: 'Berat Kandili', type: 'kandil' },
  { id: 'ramazan-baslangic-2026', date: '2026-02-18', name: 'Ramazan Başlangıcı', type: 'ramazan' },
  { id: 'kadir-gecesi-2026', date: '2026-03-15', name: 'Kadir Gecesi', type: 'kandil' },
  { id: 'ramazan-bayrami-2026', date: '2026-03-20', name: 'Ramazan Bayramı', type: 'bayram' },
  { id: 'kurban-bayrami-2026', date: '2026-05-27', name: 'Kurban Bayramı', type: 'bayram' },

  // 2027
  { id: 'kandil-regaip-2027', date: '2027-01-04', name: 'Regaip Kandili', type: 'kandil' },
  { id: 'kandil-miraç-2027', date: '2027-01-05', name: 'Miraç Kandili', type: 'kandil' },
  { id: 'kandil-berat-2027', date: '2027-01-22', name: 'Berat Kandili', type: 'kandil' },
  { id: 'ramazan-baslangic-2027', date: '2027-02-07', name: 'Ramazan Başlangıcı', type: 'ramazan' },
  { id: 'kadir-gecesi-2027', date: '2027-03-04', name: 'Kadir Gecesi', type: 'kandil' },
  { id: 'ramazan-bayrami-2027', date: '2027-03-09', name: 'Ramazan Bayramı', type: 'bayram' },
  { id: 'kurban-bayrami-2027', date: '2027-05-16', name: 'Kurban Bayramı', type: 'bayram' },
];

/* ================================================================
   Türkçe gün/ay isimleri
   ================================================================ */
export const TR_WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/* ================================================================
   Yardımcılar
   ================================================================ */
export const pad = (v) => String(v).padStart(2, '0');

export const toLocalISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISOLocal = (iso) => {
  const m = String(iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

export const daysBetween = (a, b) =>
  Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

export const formatDateTR = (d) =>
  `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export const formatDateShort = (d) =>
  `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;

export const getWeekdayShort = (d) => {
  // JS: 0=Paz, 1=Pzt … 6=Cmt → Pzt başlangıçlı index
  const idx = (d.getDay() + 6) % 7;
  return TR_WEEKDAYS_SHORT[idx];
};

/* ================================================================
   Verilen yıl için Ramazan başlangıcı bul
   ================================================================ */
export function findRamazanStart(year) {
  const match = RELIGIOUS_DAYS.find(
    (d) => d.type === 'ramazan' && d.date.startsWith(String(year)),
  );
  return match ? parseISOLocal(match.date) : null;
}

/* ================================================================
   Bir sonraki dinî günü bul (bugüne göre)
   ================================================================ */
export function getNextReligiousDay(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sorted = [...RELIGIOUS_DAYS]
    .map((d) => ({ ...d, dateObj: parseISOLocal(d.date) }))
    .filter((d) => d.dateObj && d.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj);
  return sorted[0] || null;
}

/* ================================================================
   Aktif Ramazan bilgisini bul
   — Bugün Ramazan ayı içinde miyse { start, end, dayNumber }
   — Değilse bir sonraki Ramazan'ı döndür
   ================================================================ */
export function getRamazanInfo(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let year = today.getFullYear(); year <= today.getFullYear() + 2; year += 1) {
    const start = findRamazanStart(year);
    if (!start) continue;

    // Ramazan ~30 gün sürer
    const end = new Date(start);
    end.setDate(end.getDate() + 29);

    if (today >= start && today <= end) {
      const dayNumber = daysBetween(start, today) + 1;
      return {
        start, end, dayNumber,
        isActive: true,
        daysUntilStart: 0,
        daysUntilEnd: daysBetween(today, end) + 1,
      };
    }

    if (today < start) {
      return {
        start, end, dayNumber: 0,
        isActive: false,
        daysUntilStart: daysBetween(today, start),
        daysUntilEnd: 0,
      };
    }
  }

  return null;
}

/* ================================================================
   Ramazan için 30 günlük liste oluştur
   ================================================================ */
export function buildRamazanDays(start) {
  const days = [];
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      index: i + 1,
      date: d,
      iso: toLocalISO(d),
    });
  }
  return days;
}

/* ================================================================
   Kandil / bayram renk kodu
   ================================================================ */
export function getEventTypeColor(type, theme) {
  switch (type) {
    case 'ramazan': return theme.primary;
    case 'bayram': return '#E5A93C';
    case 'kandil': return '#8B7FD4';
    default: return theme.textDim;
  }
}