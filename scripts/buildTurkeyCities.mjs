import fs from "node:fs/promises";
import path from "node:path";

const API_URL = "https://turkiyeapi.dev/api/v1/provinces";
const OUTPUT_PATH = path.resolve("src/data/turkeyCities.json");

async function main() {
  console.log("Türkiye il ve ilçe verileri çekiliyor...");
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`API hatası: HTTP ${res.status}`);
  }

  const json = await res.json();
  const provinces = Array.isArray(json.data) ? json.data : [];

  const formatted = provinces
    .map((prov) => {
      const provLat = Number(prov.coordinates?.latitude);
      const provLon = Number(prov.coordinates?.longitude);

      const districts = (prov.districts || [])
        .map((dist) => ({
          name: dist.name,
          // İlçe koordinatı varsa onu al, yoksa il merkezini kullan
          lat: Number(dist.coordinates?.latitude ?? provLat),
          lon: Number(dist.coordinates?.longitude ?? provLon),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));

      // Eğer ilçeler içinde il merkezi yoksa başa "Merkez" ekle
      if (districts.length === 0 && Number.isFinite(provLat)) {
        districts.push({ name: "Merkez", lat: provLat, lon: provLon });
      }

      return {
        plate: Number(prov.id),
        city: prov.name,
        districts,
      };
    })
    .sort((a, b) => a.plate - b.plate);

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(formatted, null, 2), "utf8");

  const totalDistricts = formatted.reduce(
    (sum, item) => sum + item.districts.length,
    0,
  );
  console.log(
    `Tamamlandı: ${formatted.length} il, ${totalDistricts} ilçe -> ${OUTPUT_PATH}`,
  );
}

main().catch((err) => {
  console.error("Hata:", err.message);
  process.exit(1);
});