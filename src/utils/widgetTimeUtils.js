// src/utils/widgetTimeUtils.js
// Widgetlar için kalan süreyi en mantıklı, anlaşılır ve okunaklı Türkçe formatta hesaplayan yardımcı fonksiyon

/**
 * Kalan milisaniyeyi veya hedef tarihi en kullanıcı dostu şekilde formatlar.
 * Örnek çıktılar:
 * - 2 sa 15 dk
 * - 45 dk
 * - 1 sa
 * - Vakit girdi (< 1 dk)
 * 
 * @param {number|Date} targetTimeOrMs - Hedef Date nesnesi veya kalan ms
 * @param {Date} [baseNow=new Date()] - Referans anlık zaman
 * @param {boolean} [includePrefix=false] - Başına 'Kalan: ' eklenip eklenmeyeceği
 * @returns {string} Kullanıcı dostu süre metni
 */
export function formatRemainingFriendly(targetTimeOrMs, baseNow = new Date(), includePrefix = false) {
  let ms = 0;
  if (targetTimeOrMs instanceof Date) {
    ms = targetTimeOrMs.getTime() - (baseNow ? baseNow.getTime() : Date.now());
  } else if (typeof targetTimeOrMs === 'number') {
    ms = targetTimeOrMs;
  }

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);

  let text = '';
  if (totalMinutes <= 0) {
    text = 'Vakit girdi';
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      if (minutes > 0) {
        text = `${hours} sa ${minutes} dk`;
      } else {
        text = `${hours} sa`;
      }
    } else {
      text = `${minutes} dk`;
    }
  }

  return includePrefix && text !== 'Vakit girdi' ? `Kalan: ${text}` : text;
}
