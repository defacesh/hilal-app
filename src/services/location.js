
// src/services/location.js

const EARTH_RADIUS_KM = 6371;

/**
 * İki koordinat arasındaki kuş uçuşu mesafeyi hesaplar.
 * Haversine formülü kullanılır.
 *
 * @param {number} lat1 - İlk konumun enlemi
 * @param {number} lon1 - İlk konumun boylamı
 * @param {number} lat2 - İkinci konumun enlemi
 * @param {number} lon2 - İkinci konumun boylamı
 * @returns {number} Kilometre cinsinden mesafe
 * @throws {TypeError} Koordinatlar geçersizse
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const coordinates = [lat1, lon1, lat2, lon2];

  if (!coordinates.every(Number.isFinite)) {
    throw new TypeError('Koordinatlar geçerli sayılar olmalıdır.');
  }

  if (
    lat1 < -90 || lat1 > 90 ||
    lat2 < -90 || lat2 > 90 ||
    lon1 < -180 || lon1 > 180 ||
    lon2 < -180 || lon2 > 180
  ) {
    throw new RangeError('Koordinatlar geçerli enlem ve boylam aralıklarında olmalıdır.');
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const latitude1 = toRadians(lat1);
  const latitude2 = toRadians(lat2);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const a =
    sinLat * sinLat +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      sinLon *
      sinLon;

  // Yuvarlama kaynaklı küçük sapmaların NaN oluşturmasını önler.
  const safeA = Math.min(1, Math.max(0, a));
  const centralAngle = 2 * Math.atan2(
    Math.sqrt(safeA),
    Math.sqrt(1 - safeA)
  );

  return EARTH_RADIUS_KM * centralAngle;
};

/**
 * Konum değişikliğinde seyahat konumunu güncelleme eşiği (km).
 */
export const SHOULD_TRAVEL_UPDATE_KM = 50;
