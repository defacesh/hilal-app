
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAyah } from './ummahContentApi';

const CACHE_PREFIX = '@ummah/quran/ayah/';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ayahKey(surah, ayah, edition) {
  return `${CACHE_PREFIX}${edition}/${surah}/${ayah}`;
}

async function readCachedAyah(surah, ayah, edition) {
  try {
    const value = await AsyncStorage.getItem(
      ayahKey(surah, ayah, edition)
    );
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

async function saveCachedAyah(surah, ayah, edition, data) {
  await AsyncStorage.setItem(
    ayahKey(surah, ayah, edition),
    JSON.stringify(data)
  );
}

async function fetchWithRetry(surah, ayah, edition) {
  let lastError;

  // İlk deneme + en fazla 3 tekrar
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const data = await fetchAyah(surah, ayah, edition);

      if (
        !data ||
        typeof data.text !== 'string' ||
        !data.text.trim() ||
        typeof data.arabic !== 'string' ||
        !data.arabic.trim()
      ) {
        throw new Error(`Ayet verisi eksik: ${surah}:${ayah}`);
      }

      return data;
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        // 1, 2 ve 4 saniye bekle
        await delay(1000 * (2 ** attempt));
      }
    }
  }

  throw lastError || new Error('Ayet indirilemedi.');
}

/**
 * Önce kayıtlı ayetleri kullanır.
 * Yalnızca eksik ayetleri sırayla indirir.
 * Her başarılı ayeti hemen kalıcı olarak kaydeder.
 */
export async function getSurahOffline(
  surah,
  ayahCount,
  edition,
  onProgress
) {
  const ayahs = new Array(ayahCount);
  const missing = [];

  // Önce yerel kayıtları tara
  for (let number = 1; number <= ayahCount; number++) {
    const cached = await readCachedAyah(surah, number, edition);

    if (cached) {
      ayahs[number - 1] = cached;
    } else {
      missing.push(number);
    }
  }

  let completed = ayahCount - missing.length;

  onProgress?.({
    completed,
    total: ayahCount,
    fromCache: true,
  });

  // API'ye aynı anda yüzlerce istek gönderme
  for (const number of missing) {
    // İstekler arasında kısa bekleme
    await delay(350);

    const data = await fetchWithRetry(surah, number, edition);

    // İndirme başarılı olunca hemen kaydet
    await saveCachedAyah(surah, number, edition, data);

    ayahs[number - 1] = data;
    completed++;

    onProgress?.({
      completed,
      total: ayahCount,
      fromCache: false,
    });
  }

  // Tamlık kontrolü: eksik ayet varsa sureyi hazır sayma
  if (
    ayahs.length !== ayahCount ||
    ayahs.some((ayah) => !ayah?.text?.trim() || !ayah?.arabic?.trim())
  ) {
    throw new Error('Sure tamamlanamadı. Daha sonra tekrar deneyin.');
  }

  return ayahs;
}
