# 🌙 Hilal - İslami Yaşam & Namaz Vakitleri Uygulaması

<p align="center">
  <img src="./assets/icon.png" alt="Hilal Logo" width="120" style="border-radius: 24px;" />
</p>

<p align="center">
  <b>Sade, modern, reklamsız ve tamamen gizlilik odaklı açık kaynak İslami asistan.</b>
</p>

<p align="center">
  <a href="https://github.com/defacesh/hilal-app/blob/main/LICENSE"><img src="https://img.shields.io/badge/Lisans-MIT-emerald.svg" alt="License"></a>
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-SDK%2058-blue.svg" alt="Expo SDK 58"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.88-cyan.svg" alt="React Native"></a>
  <a href="https://github.com/defacesh/hilal-app/stargazers"><img src="https://img.shields.io/github/stars/defacesh/hilal-app?style=flat&color=amber" alt="Stars"></a>
</p>

---

## 📖 Hakkında

**Hilal**, günlük ibadetlerinizi ve İslami yaşantınızı kolaylaştırmak için modern mobil standartlar ve yüksek performans gözetilerek geliştirilmiş kapsamlı bir mobil uygulamadır.

Piyasadaki karmaşık, reklam dolu ve kullanıcı verisi toplayan uygulamaların aksine Hilal; **sıfır reklam**, **üst düzey gizlilik** ve **akıcı kullanıcı deneyimi** prensiplerini benimser. Tüm hesaplamalar ve kullanıcı tercihleri yalnızca kullanıcının kendi cihazında güvenle saklanır.

---

## ✨ Özellikler

### 🕌 Namaz Vakitleri & Bildirimler
- **Hassas Konum ve Hesaplama:** GPS veya ilçe seçimi ile Diyanet İşleri Başkanlığı ve uluslararası astronomik hesaplama yöntemleri.
- **Akıllı Geri Sayım:** Bir sonraki vakte kalan süreyi dinamik olarak gösteren arayüz.
- **Ezân & Vakit Hatırlatıcıları:** Her vakit için kişiselleştirilebilir bildirimler ve ezan alarmları.

### 🧭 Kıble Pusulası
- Manyetik sensör ve GPS destekli yüksek hassasiyetli görsel kıble pusulası.
- Manyetik sapma açısı (declination) hesabı ve kalibrasyon desteği.

### 📖 Kur'an-ı Kerim
- Sure, cüz ve sayfa bazlı akıcı okuma deneyimi.
- Ayet ayet meal desteği ve arama.
- Ayraç ve son okunan yeri otomatik hatırlama.

### 📿 Zikirmatik & Dualar
- **Gelişmiş Zikirmatik:** Hedef belirleme, sesli ve dokunsal (haptic) geri bildirimler, özel zikirler ekleme.
- **Kapsamlı Dua Kütüphanesi:** Kur'an'dan dualar, Peygamber duaları, günlük dualar, Arapça metin, Türkçe okunuş ve mealleri.
- **Namaz Sonrası Tesbihatı:** Sabah, öğle, ikindi, akşam ve yatsı namazı tesbihatları.

### 🌟 Diğer İslami Araçlar
- **Esma-ül Hüsna:** Allah'ın 99 ismi, Arapça yazılışı, ebced değerleri, anlamları ve faziletleri.
- **Hicri Takvim & Dini Günler:** Kandiller, Ramazan başlangıcı, bayramlar ve önemli İslami günler.
- **Ramazan İmsakiyesi:** İftar ve sahur geri sayımı, özel Ramazan duaları.
- **Zekât Hesaplayıcı:** Altın, gümüş, nakit para, hisse ve ticaret mallarına göre nisap miktarı ve zekât hesabı.
- **Namaz Rehberi:** 5 vakit namaz, cuma, bayram, cenaze ve teravih namazlarının kılınışı.
- **Siyer & Veda Hutbesi:** Peygamber Efendimiz'in (s.a.v.) hayatı ve Veda Hutbesi'nin tam metni.
- **Dini Terimler Sözlüğü & İslami Rüya Tabirleri.**

### 📱 Android Dinamik Widget Desteği
- Ana ekranınızdan uygulamayı açmadan bir sonraki vakti ve kalan süreyi takip edebileceğiniz yerel Android widget'ları (Küçük 2x2, Orta 4x2 ve Büyük 4x4 imsakiye görünümü).

### 🎨 Görünüm & Erişilebilirlik
- **Tema Desteği:** Açık (Light), Koyu (Dark), Saf Siyah (OLED) ve Sistem teması seçenekleri.
- **Yüksek Kontrast & Yazı Boyutu:** Kolay okunabilirlik için ayarlanabilir yazı boyutları ve erişilebilirlik seçenekleri.

---

## 🔒 Gizlilik Politikası

- **Veri Toplanmaz:** Hilal, hiçbir kişisel verinizi sunuculara göndermez, analiz (telemetry) veya reklam kimliği takibi yapmaz.
- **Çevrimdışı Çalışır:** İnternet bağlantınız olmasa dahi önceden indirilen vakit verileri ve dahili içerikler çalışmaya devam eder.
- **Reklamsız:** İbadet anında dikkatinizi dağıtacak hiçbir reklam veya sponsorlu içerik barındırmaz.

---

## 🛠️ Kurulum & Geliştirme

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz:

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri önerilir)
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/)

### Adımlar

1. **Depoyu Klonlayın:**
   ```bash
   git clone https://github.com/defacesh/hilal-app.git
   cd hilal-app
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirici Sunucusunu Başlatın:**
   ```bash
   npx expo start
   ```

4. **Uygulamayı Cihazda / Emülatörde Çalıştırın:**
   - **Android:** `npx expo run:android`
   - **iOS:** `npx expo run:ios`
   - Veya Expo Go / Development Client ile terminaldeki QR kodu taratarak test edin.

---

## 👨‍💻 Geliştirici

- **Geliştirici:** Hasan Hüseyin KARAKAYA
- **GitHub:** [@defacesh](https://github.com/defacesh)
- **İletişim:** [krkyhsn@proton.me](mailto:krkyhsn@proton.me)
- **Proje Deposu:** [https://github.com/defacesh/hilal-app](https://github.com/defacesh/hilal-app)

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında açık kaynak olarak lisanslanmıştır. Dilediğiniz gibi inceleyebilir, katkıda bulunabilir ve geliştirebilirsiniz.
