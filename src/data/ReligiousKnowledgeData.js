// src/data/ReligiousKnowledgeData.js
// Temel Dinî Bilgiler — genişletilmiş kütüphane.
// Mevcut 18 konu + 8 yeni konu (Tevhid, Melekler, Peygamberler, Kitaplar,
// Ahiret, Namaz Çeşitleri, Hac ve Umre, Ahlak Esasları).
// Toplam: 26 konu, ~230 madde.

/* ================================================================
   Konular (topic) — gruplar ve maddeler
   ================================================================ */
export const TOPICS = {
  /* ================================================================
     İNANÇ
     ================================================================ */
  '32-farz': {
    title: '32 Farz',
    heroTitle: '32 Farz Külliyatı',
    intro:
      'İman, İslam ve temel ibadetlerle ilgili 32 farzın özeti.',
    note:
      'Yaygın Hanefî öğretimindeki sınıflandırma esas alınmıştır. Teyemmümün farzları konusunda farklı anlatımlar olabilir.',
    groups: [
      {
        title: 'İmanın şartları · 6',
        items: [
          'Allah’a inanmak',
          'Meleklere inanmak',
          'Kitaplara inanmak',
          'Peygamberlere inanmak',
          'Ahiret gününe inanmak',
          'Kadere inanmak',
        ],
      },
      {
        title: 'İslam’ın şartları · 5',
        items: [
          'Kelime-i şehadet getirmek',
          'Namaz kılmak',
          'Ramazan orucunu tutmak',
          'Zekât vermek',
          'Gücü yetenin hacca gitmesi',
        ],
      },
      {
        title: 'Namazın dışındaki farzlar · 6',
        items: [
          'Hadesten taharet',
          'Necasetten taharet',
          'Setr-i avret',
          'İstikbal-i kıble',
          'Vakit',
          'Niyet',
        ],
      },
      {
        title: 'Namazın içindeki farzlar · 6',
        items: [
          'İftitah tekbiri',
          'Kıyam',
          'Kıraat',
          'Rükû',
          'Secde',
          'Ka’de-i ahîre',
        ],
      },
      {
        title: 'Abdestin farzları · 4',
        items: [
          'Yüzü yıkamak',
          'Kolları dirseklerle birlikte yıkamak',
          'Başın dörtte birini mesh etmek',
          'Ayakları topuklarla birlikte yıkamak',
        ],
      },
      {
        title: 'Guslün farzları · 3',
        items: [
          'Ağzı yıkamak',
          'Burnu yıkamak',
          'Bütün bedeni yıkamak',
        ],
      },
      {
        title: 'Teyemmümün farzları · 2',
        items: [
          'Teyemmüme niyet etmek',
          'Yüzü ve kolları mesh etmek',
        ],
      },
    ],
  },

  'iman-sartlari': {
    title: 'İmanın Şartları',
    heroTitle: 'İmanın Altı Şartı',
    intro: 'İmanın altı şartı ve kısa açıklamaları.',
    groups: [
      {
        title: 'İmanın altı şartı',
        items: [
          'Allah’a inanmak',
          'Meleklere inanmak',
          'Kitaplara inanmak',
          'Peygamberlere inanmak',
          'Ahiret gününe inanmak',
          'Kadere inanmak',
        ],
      },
    ],
  },

  'tevhid-iman': {
    title: 'Tevhid ve İman Esasları',
    heroTitle: 'Tevhidin Özü ve İmanın Mahiyeti',
    intro:
      'İslam inancının temeli olan tevhid, iman-amel ilişkisi ve şirkin sınırları.',
    note:
      'Ehl-i sünnet ve’l-cemaat çizgisindeki klasik kelam kaynakları esas alınmıştır. Bazı kavramların ayrıntısı mezhebe ve kaynağa göre farklılık gösterebilir.',
    groups: [
      {
        title: 'Tevhid ve iman',
        items: [
          'Tevhid nedir',
          'Tevhidin kısımları',
          'İmanın tanımı ve amelle ilişkisi',
          'Şirk nedir, çeşitleri nelerdir',
          'Münafıklık ve küfür sınırı',
        ],
      },
    ],
  },

  'meleklere-iman': {
    title: 'Meleklere İman',
    heroTitle: 'Meleklerin Mahiyeti ve Görevleri',
    intro:
      'Nurdan yaratılan, gözle görülmeyen meleklerin özellikleri ve insan hayatındaki rolleri.',
    groups: [
      {
        title: 'Melekler hakkında',
        items: [
          'Melek nedir, mahiyeti nasıldır',
          'Meleklerin ortak özellikleri',
          'Dört büyük melek ve görevleri',
          'Kirâmen Kâtibîn ve sorgu melekleri',
          'Meleklere imanın insan hayatına etkisi',
        ],
      },
    ],
  },

  'peygamberlere-iman': {
    title: 'Peygamberlere İman',
    heroTitle: 'Nübüvvet Anlayışı ve Peygamberler',
    intro:
      'Peygamberliğin mahiyeti, nebî-resûl farkı ve peygamberlerin ortak sıfatları.',
    groups: [
      {
        title: 'Peygamberlik',
        items: [
          'Peygamber nedir, niçin gönderilmiştir',
          'Nebî ile resûl arasındaki fark',
          'Peygamberlerin ortak sıfatları',
          'Ulü’l-azm peygamberler',
          'Hz. Muhammed’in nübüvvet özellikleri',
        ],
      },
    ],
  },

  'kutsal-kitaplar': {
    title: 'Kutsal Kitaplar',
    heroTitle: 'İlâhî Kitaplar ve Vahiy Geleneği',
    intro:
      'Allah tarafından peygamberlere indirilen büyük kitaplar ve suhuflar.',
    groups: [
      {
        title: 'İlâhî kitaplar',
        items: [
          'Dört büyük kitap ve peygamberleri',
          'Tevrat, Zebur ve İncil’in ortak özellikleri',
          'Kur’ân-ı Kerîm’in temel özellikleri',
          'Suhuf nedir, hangi peygamberlere verilmiştir',
        ],
      },
    ],
  },

  'ahiret-inanci': {
    title: 'Ahiret İnancı',
    heroTitle: 'Ölümden Sonra Hayat',
    intro:
      'Kıyamet, haşir, hesap, cennet ve cehennem ile ilgili temel bilgiler.',
    groups: [
      {
        title: 'Ahiret merhaleleri',
        items: [
          'Ahiret nedir, niçin inanılır',
          'Kabir hayatı ve berzah',
          'Kıyamet ve yeniden diriliş',
          'Mahşer, mîzân ve sırat',
          'Cennet ve cehennem',
        ],
      },
    ],
  },

  'islamin-sartlari': {
    title: 'İslam’ın Şartları',
    heroTitle: 'İslam’ın Beş Şartı',
    intro: 'İslam’ın beş şartı ve temel anlamları.',
    groups: [
      {
        title: 'İslam’ın beş şartı',
        items: [
          'Kelime-i şehadet getirmek',
          'Namaz kılmak',
          'Ramazan orucunu tutmak',
          'Zekât vermek',
          'Gücü yetenin hacca gitmesi',
        ],
      },
    ],
  },

  /* ================================================================
     NAMAZ
     ================================================================ */
  'namaz-farzlari': {
    title: 'Namazın Farzları',
    heroTitle: 'Namazın Farzları Rehberi',
    intro:
      'Hanefî sınıflandırmasında namazın altı şartı ve altı rüknü.',
    groups: [
      {
        title: 'Namazın dışındaki şartlar · 6',
        items: [
          'Hadesten taharet',
          'Necasetten taharet',
          'Setr-i avret',
          'İstikbal-i kıble',
          'Vakit',
          'Niyet',
        ],
      },
      {
        title: 'Namazın içindeki rükünler · 6',
        items: [
          'İftitah tekbiri',
          'Kıyam',
          'Kıraat',
          'Rükû',
          'Secde',
          'Ka’de-i ahîre',
        ],
      },
    ],
  },

  'namaz-sunnetleri': {
    title: 'Namazın Sünnetleri',
    heroTitle: 'Namazın Sünnet ve Âdâbı',
    intro:
      'Hanefî mezhebine göre namazın sünnetleri ve namaz içinde uygulanan edepler.',
    note:
      'Sünnetlerin bilerek terk edilmesi namazı bozmaz; ancak sevabını azaltır ve tekrarında sehiv secdesi gerekebilir.',
    groups: [
      {
        title: 'Namazın sünnetleri',
        items: [
          'İftitah tekbirinde elleri kaldırmak',
          'Kıyamda elleri bağlamak',
          'Sübhâneke duası okumak',
          'Eûzü-Besmele çekmek',
          'Fâtiha’dan sonra zamm-ı sûre okumak',
          'Fâtiha bitince “Âmîn” demek',
          'Rükûda üç kere “Sübhâne Rabbiye’l-Azîm” demek',
          'Secdede üç kere “Sübhâne Rabbiye’l-A’lâ” demek',
          'İki secde arasında oturmak',
          'Ka’de-i ûlâ (ilk oturuş)',
          'Tahiyyât duası okumak',
          'Son oturuşta salavât ve dua okumak',
          'Rükû ve secdelere giderken tekbir getirmek',
        ],
      },
    ],
  },

  'namaz-bozanlar': {
    title: 'Namazı Bozan Şeyler',
    heroTitle: 'Namazı Bozan Durumlar',
    intro:
      'Namazın geçersiz olmasına sebep olan temel durumlar (Hanefî mezhebine göre).',
    groups: [
      {
        title: 'Namazı bozan durumlar',
        items: [
          'Namazda konuşmak',
          'Namazda sesli gülmek',
          'Namazda yiyip içmek',
          'Kıbleden göğsü çevirmek',
          'Amel-i kesîr (yoğun hareket)',
          'Namazın farzlarından birini terk etmek',
          'Namazda abdestin bozulması',
          'Namazda “âh” gibi anlamlı sesler çıkarmak',
        ],
      },
    ],
  },

  'namaz-vakitleri': {
    title: 'Namaz Vakitleri',
    heroTitle: 'Beş Vakit ve Kerahat',
    intro:
      'Beş vaktin başlangıç ve bitişleri ile kerahat vakitleri hakkında özet.',
    groups: [
      {
        title: 'Ana vakitler',
        items: [
          'İmsak (Sabah namazının başlangıcı)',
          'Güneş doğuşu (Sabah namazının sonu)',
          'Öğle (Zeval sonrası)',
          'İkindi',
          'Akşam (Güneş batışı sonrası)',
          'Yatsı',
          'Vitir vakti',
        ],
      },
      {
        title: 'Kerahat vakitleri',
        items: [
          'Kerahat vakitleri',
        ],
      },
    ],
  },

  'namaz-rekatlari': {
    title: 'Beş Vaktin Rekatları',
    heroTitle: 'Rekat Dökümü',
    intro:
      'Hanefî mezhebine göre beş vakit namazın sünnet, farz ve vitir rekatları.',
    note:
      'Sünnetlerin sünnet-i müekkede / gayr-i müekkede ayrımı ve kaza hükümleri farklı kaynaklarda değişebilir.',
    groups: [
      {
        title: 'Vakitlere göre rekatlar',
        items: [
          'Sabah: 2 sünnet + 2 farz',
          'Öğle: 4 ilk sünnet + 4 farz + 2 son sünnet',
          'İkindi: 4 sünnet + 4 farz',
          'Akşam: 3 farz + 2 sünnet',
          'Yatsı: 4 ilk sünnet + 4 farz + 2 son sünnet + 3 vitir',
          'Cuma: 4 ilk sünnet + 2 farz + 4 son sünnet',
        ],
      },
    ],
  },

  'namaz-cesitleri': {
    title: 'Namaz Çeşitleri',
    heroTitle: 'Farzdan Nâfileye Namazlar',
    intro:
      'Farz, vacip, sünnet ve nâfile namazların sınıflandırması; kaza ve cemaat kavramları.',
    note:
      'Bu sınıflandırma Hanefî mezhebi esas alınarak hazırlanmıştır. Diğer mezheplerde vacip kavramı ve bayram namazlarının hükmü farklılık gösterebilir.',
    groups: [
      {
        title: 'Namaz türleri',
        items: [
          'Farz namazlar',
          'Vacip namazlar',
          'Sünnet namazlar',
          'Nâfile namazlar',
          'Kaza namazı',
          'Cemaatle namaz',
        ],
      },
    ],
  },

  'sehiv-secdesi': {
    title: 'Sehiv Secdesi',
    heroTitle: 'Yanılma Secdesi',
    intro:
      'Namazdaki unutma veya yanılma sebebiyle yapılan sehiv secdesinin tanımı ve uygulanışı.',
    groups: [
      {
        title: 'Temel bilgiler',
        items: [
          'Sehiv secdesi nedir',
          'Ne zaman yapılır',
          'Nasıl yapılır',
          'Sehiv secdesini gerektiren durumlar',
          'Sehiv secdesini gerektirmeyen durumlar',
          'Sehiv secdesinde yanılma',
        ],
      },
    ],
  },

  /* ================================================================
     TAHARET
     ================================================================ */
  'abdest-farzlari': {
    title: 'Abdestin Farzları',
    heroTitle: 'Abdest Rehberi',
    intro: 'Hanefî mezhebine göre abdestin dört farzı.',
    groups: [
      {
        title: 'Dört farz',
        items: [
          'Yüzü yıkamak',
          'Kolları dirseklerle birlikte yıkamak',
          'Başın dörtte birini mesh etmek',
          'Ayakları topuklarla birlikte yıkamak',
        ],
      },
    ],
  },

  'abdest-bozanlar': {
    title: 'Abdesti Bozan Şeyler',
    heroTitle: 'Abdesti Bozan Haller',
    intro:
      'Abdestin bozulmasına sebep olan durumlar (Hanefî mezhebine göre).',
    groups: [
      {
        title: 'Abdesti bozan haller',
        items: [
          'Önden veya arkadan bir şey çıkması',
          'Yellenmek',
          'Uyku',
          'Bayılmak veya delirmek',
          'Namazda sesli gülmek',
          'Kan veya irin gibi sıvıların yayılması',
          'Ağız dolusu kusmak',
          'Cinsel ilişki',
          'Hayız veya nifas hâli',
        ],
      },
    ],
  },

  'gusul-farzlari': {
    title: 'Guslün Farzları',
    heroTitle: 'Gusül Rehberi',
    intro: 'Hanefî mezhebine göre guslün üç farzı.',
    groups: [
      {
        title: 'Üç farz',
        items: [
          'Ağzı yıkamak',
          'Burnu yıkamak',
          'Bütün bedeni yıkamak',
        ],
      },
    ],
  },

  'gusul-gerektirenler': {
    title: 'Guslü Gerektiren Haller',
    heroTitle: 'Guslü Gerektiren Durumlar',
    intro:
      'Gusül abdesti almayı zorunlu kılan hâller.',
    groups: [
      {
        title: 'Guslü gerektiren hâller',
        items: [
          'Cinsel ilişki',
          'Cünüplük (meni çıkması)',
          'İhtilam (uykuda meni çıkması)',
          'Hayız hâlinin sona ermesi',
          'Nifas hâlinin sona ermesi',
        ],
      },
    ],
  },

  'teyemmum-farzlari': {
    title: 'Teyemmümün Farzları',
    heroTitle: 'Teyemmüm Rehberi',
    intro:
      'Hanefî mezhebine göre teyemmümün yaygın öğretilen iki farzı.',
    groups: [
      {
        title: 'İki farz',
        items: ['Niyet etmek', 'Yüzü ve kolları mesh etmek'],
      },
    ],
  },

  /* ================================================================
     ORUÇ
     ================================================================ */
  'oruc-turleri': {
    title: 'Oruç Türleri',
    heroTitle: 'Oruç Sınıflandırması',
    intro:
      'Farz, vacip, sünnet, nafile ve haram oruç türlerinin kısa tanıtımı.',
    groups: [
      {
        title: 'Oruç türleri',
        items: [
          'Farz oruç (Ramazan)',
          'Vacip oruç (Kaza, adak)',
          'Nafile oruç',
          'Sünnet oruç',
          'Mekruh oruç',
          'Haram oruç (Bayram günlerinde)',
        ],
      },
    ],
  },

  'oruc-bozanlar': {
    title: 'Orucu Bozan Şeyler',
    heroTitle: 'Orucu Bozan Durumlar',
    intro:
      'Orucu bozan ve bozmayan temel durumlar hakkında özet.',
    groups: [
      {
        title: 'Orucu bozan hâller',
        items: [
          'Bilerek yiyip içmek',
          'Cinsel ilişki',
          'Bilerek kusmak',
          'Hayız veya nifas başlaması',
          'Sigara içmek',
          'Ağız yoluyla ilaç almak',
          'Boğaza kan gitmesi',
        ],
      },
      {
        title: 'Orucu bozmayan hâller',
        items: [
          'Unutarak yiyip içmek',
          'Yalan ve iftira (sevabını giderir)',
        ],
      },
    ],
  },

  /* ================================================================
     ZEKÂT
     ================================================================ */
  'zekat-kimlere': {
    title: 'Zekât Kimlere Verilir',
    heroTitle: 'Zekât Verilecek Sekiz Sınıf',
    intro:
      'Kur’an-ı Kerim’de belirtilen zekât verilecek sınıflar ve zekât verilmeyecek kimseler.',
    note:
      'Zekâtın kimlere verileceği Tevbe sûresi 60. âyette belirtilmiştir. Fıkhî ayrıntılar mezhebe ve kaynağa göre değişebilir.',
    groups: [
      {
        title: 'Zekât verilebilecek sınıflar · 8',
        items: [
          'Fakirler',
          'Miskinler',
          'Zekât toplama görevlileri',
          'Kalpleri İslam’a ısındırılacak olanlar',
          'Köleler (klasik dönem)',
          'Borçlular',
          'Allah yolunda olanlar',
          'Yolda kalmışlar',
        ],
      },
      {
        title: 'Zekât verilmeyecek kimseler',
        items: [
          'Zenginler',
          'Güçlü ve çalışabilecek durumda olanlar',
          'Zekât verenin anne-babası ve üstsoyu',
          'Zekât verenin çocukları ve altsoyu',
          'Zekât verenin eşi',
        ],
      },
    ],
  },

  /* ================================================================
     HAC
     ================================================================ */
  'hac-ve-umre': {
    title: 'Hac ve Umre',
    heroTitle: 'Kutsal Yolculuğun Esasları',
    intro:
      'Hac ve umre ibadetinin mahiyeti, farzları, vacipleri ve temel menasiki.',
    note:
      'Hac menasikinin uygulanışı mezhebe göre kısmi farklılıklar gösterebilir. Ayrıntılı bilgi için güvenilir bir ilmihal kaynağına başvurulmalıdır.',
    groups: [
      {
        title: 'Hac ve umre bilgileri',
        items: [
          'Hac nedir, kimlere farzdır',
          'Haccın farzları',
          'Haccın vacipleri',
          'Umre nedir, hükmü nedir',
          'İhram ve yasakları',
          'Tavaf, sa’y ve Arafat vakfesi',
        ],
      },
    ],
  },

  /* ================================================================
     AHLAK
     ================================================================ */
  'ahlak-esaslari': {
    title: 'Ahlak Esasları',
    heroTitle: 'Güzel Ahlakın Temelleri',
    intro:
      'İslam ahlakının temel erdemleri ve bu erdemlerin kişi ve toplum hayatındaki yeri.',
    groups: [
      {
        title: 'Temel erdemler',
        items: [
          'İslam ahlakının temeli',
          'Dürüstlük ve doğru sözlülük',
          'Emanet ve güvenilirlik',
          'Adalet ve hakkaniyet',
          'Merhamet ve şefkat',
          'Tevazu ve alçakgönüllülük',
        ],
      },
    ],
  },

  '54-farz': {
    title: '54 Farz',
    heroTitle: 'Ahlak ve Sorumluluk Rehberi',
    intro:
      'Geleneksel ilmihallerde öğretilen 54 maddelik ahlak, ibadet ve sorumluluk özeti.',
    note:
      'Bu, geleneksel listelerden birinin sadeleştirilmiş aktarımıdır. Sıralamalar ve ifadeler kaynaklara göre değişebilir.',
    groups: [
      {
        title: 'Geleneksel 54 Farz listesi',
        items: [
          'Allah’ı bir bilmek ve O’nu zikretmek',
          'Helalinden kazanılmış temiz elbise giymek',
          'Abdest almak',
          'Beş vakit namaz kılmak',
          'Cünüplükten gusletmek',
          'Rızık konusunda Allah’a tevekkül etmek',
          'Helalinden yiyip içmek',
          'Allah’ın taksimine kanaat etmek',
          'Allah’a tevekkül etmek',
          'Allah’ın hükmüne razı olmak',
          'Nimetlere şükretmek',
          'Belalara sabretmek',
          'Günahlardan tövbe etmek',
          'İbadetleri ihlasla yapmak',
          'Şeytanı düşman bilmek',
          'Kur’an-ı Kerim’i dinî rehber kabul etmek',
          'Ölüme hazırlıklı olmak',
          'İyiliği emretmek ve kötülükten sakındırmak',
          'Gıybet etmemek ve kötü sözleri dinlememek',
          'Anne ve babaya iyilik etmek',
          'Akrabaları ziyaret etmek',
          'Emanete ihanet etmemek',
          'Uygunsuz şaka ve davranışlardan kaçınmak',
          'Allah’a ve Resulüne itaat etmek',
          'Günahtan kaçınmak ve Allah’a sığınmak',
          'Allah için sevmek ve Allah için buğzetmek',
          'Olaylardan ibret almak',
          'Tefekkür etmek',
          'İlim öğrenmeye çalışmak',
          'Kötü zandan sakınmak',
          'İnsanlarla alay etmemek',
          'Harama bakmamak',
          'Doğru sözlü olmak',
          'Şımarıklık ve azgınlıktan kaçınmak',
          'Sihir yapmamak',
          'Ölçü ve tartıda dürüst olmak',
          'Allah’ın azabından korkmak',
          'Allah’ın rahmetinden ümit kesmemek',
          'Yoksullara yardım etmek',
          'Nefsin haram arzularına uymamak',
          'İhtiyaç sahibini doyurmak',
          'Geçimini sağlamak için çalışmak',
          'Zekât ve öşür yükümlülüklerini yerine getirmek',
          'Hayız ve nifas dönemlerinde cinsel ilişkiden kaçınmak',
          'Kalbi günahlardan temiz tutmak',
          'Kibirden sakınmak',
          'Yetimin malını korumak',
          'Cinsel davranışlarda haramdan sakınmak',
          'Farz namazları vaktinde kılmak',
          'Allah’a şirk koşmamak',
          'Zinadan kaçınmak',
          'İçki içmemek',
          'Yalan yere yemin etmemek',
          'Başkalarının malını haksız yere almamak',
        ],
      },
    ],
  },
};

/* ================================================================
   Maddelerin kısa açıklamaları
   ================================================================ */
export const EXPLANATIONS = {
  /* ---------------- Mevcut açıklamalar ---------------- */
  'Allah’a inanmak':
    'Allah’ın varlığına, birliğine ve ibadete layık tek ilah olduğuna iman etmektir.',
  'Meleklere inanmak':
    'Allah’ın yarattığı, kendilerine verilen görevleri yerine getiren meleklere iman etmektir.',
  'Kitaplara inanmak':
    'Allah’ın peygamberlerine vahyettiği ilahî kitapların asıllarına iman etmektir. Kur’an-ı Kerim Müslümanların temel kitabıdır.',
  'Peygamberlere inanmak':
    'Allah’ın insanlara rehberlik etmek üzere gönderdiği peygamberlere iman etmektir.',
  'Ahiret gününe inanmak':
    'Ölümden sonraki dirilişe, hesap gününe ve ahiret hayatına iman etmektir.',
  'Kadere inanmak':
    'Allah’ın her şeyi bilmesine ve takdir etmesine iman etmektir. Bu inanç, insanın kendi tercih ve sorumluluğunu ortadan kaldırmaz.',

  'Kelime-i şehadet getirmek':
    'Allah’ın birliğine ve Hz. Muhammed’in Allah’ın elçisi olduğuna şahitlik etmektir.',
  'Namaz kılmak':
    'Müslümanın belirli vakitlerde, şartlarına ve rükünlerine uygun şekilde namaz ibadetini yerine getirmesidir.',
  'Ramazan orucunu tutmak':
    'Ramazan ayında, oruç tutmakla yükümlü olan kişinin tan yerinin ağarmasından güneş batımına kadar orucu bozan şeylerden uzak durmasıdır.',
  'Zekât vermek':
    'Gerekli şartları taşıyan malın belirli bir kısmını dinen zekât alabilecek kişilere vermektir.',
  'Gücü yetenin hacca gitmesi':
    'Sağlık, maddi imkân ve yol güvenliği gibi şartları taşıyan Müslümanın hac ibadetini yerine getirmesidir.',

  'Hadesten taharet':
    'Namaz gibi ibadetler için gerekli olan abdest veya gusül ile hükmî kirlilikten temizlenmektir.',
  'Necasetten taharet':
    'Namaz için beden, elbise ve namaz kılınacak yerde dinen necis sayılan maddelerin temizlenmesidir.',
  'Setr-i avret':
    'Namazda örtülmesi gereken beden bölgelerini dinî ölçülere uygun biçimde örtmektir.',
  'İstikbal-i kıble':
    'Namaz sırasında kıble yönüne dönmektir. Acizlik veya benzeri özel durumların hükümleri ayrıca değerlendirilir.',
  'Vakit':
    'Her farz namazı kendisi için belirlenmiş vakit içinde kılmaktır.',
  'Niyet':
    'Kılınacak namazı kalben belirlemek ve hangi ibadetin yapıldığının bilincinde olmaktır.',
  'İftitah tekbiri':
    'Namaza Allahu ekber diyerek başlamaktır.',
  'Kıyam':
    'Gücü yeten kişinin farz namazda ayakta durmasıdır.',
  'Kıraat':
    'Namazda gerekli olan Kur’an kıraatini yerine getirmektir.',
  'Rükû':
    'Namazda belirli ölçüde eğilerek rükû rüknünü yerine getirmektir.',
  'Secde':
    'Namazda usulüne uygun şekilde secde yapmaktır.',
  'Ka’de-i ahîre':
    'Namazın sonunda, ilgili mezhebin belirlediği süre ve biçimde son oturuşu gerçekleştirmektir.',
  'Kolları dirseklerle birlikte yıkamak':
    'Abdestte iki kolu, dirsekler dâhil yıkamaktır.',
  'Başın dörtte birini mesh etmek':
    'Hanefî mezhebinde abdest sırasında başın en az dörtte birini ıslak elle mesh etmektir.',
  'Ayakları topuklarla birlikte yıkamak':
    'Abdestte her iki ayağı topuklar dâhil yıkamaktır.',
  'Yüzü yıkamak':
    'Abdestte yüzü, normal saç bitiminden çene altına ve iki kulak arasına kadar yıkamaktır.',
  'Ağzı yıkamak':
    'Hanefî mezhebine göre gusülde ağzın içini suyla yıkamaktır.',
  'Burnu yıkamak':
    'Hanefî mezhebine göre gusülde burnun iç kısmına su ulaştırmaktır.',
  'Bütün bedeni yıkamak':
    'Gusülde bedenin tamamına, kuru yer kalmayacak şekilde su ulaştırmaktır.',
  'Teyemmüme niyet etmek':
    'Su bulunmadığında veya suyu kullanmaya geçerli bir engel olduğunda, dinî şartlara uygun teyemmüm için niyet etmektir.',
  'Niyet etmek':
    'Yapılacak ibadeti kalben kastetmektir. Teyemmümün ayrıntılı uygulanışı mezhep hükümlerine göre öğrenilmelidir.',
  'Yüzü ve kolları mesh etmek':
    'Teyemmümde temiz toprak cinsinden uygun bir maddeyle yüzü ve kolları, mezhebe uygun şekilde mesh etmektir.',

  'Allah’ı bir bilmek ve O’nu zikretmek':
    'Allah’ın birliğine inanmayı ve O’nu anmayı ifade eder.',
  'Helalinden kazanılmış temiz elbise giymek':
    'Kazançta ve giyimde helal-haram duyarlılığına dikkat etmektir.',
  'Abdest almak':
    'Namaz gibi ibadetler için gerekli olduğunda, abdestin farzlarına uygun şekilde temizlenmektir.',
  'Beş vakit namaz kılmak':
    'Yükümlü Müslümanın beş vakit farz namazı yerine getirmesidir.',
  'Cünüplükten gusletmek':
    'Guslü gerektiren hâllerden sonra, dinî usule uygun biçimde bütün bedeni yıkayarak temizlenmektir.',
  'Rızık konusunda Allah’a tevekkül etmek':
    'Geçim için meşru çaba gösterirken sonucu Allah’a bırakmak ve O’na güvenmektir.',
  'Helalinden yiyip içmek':
    'Yiyecek ve içeceklerde dinen helal kabul edilen şeyleri tercih etmektir.',
  'Allah’ın taksimine kanaat etmek':
    'İnsan elinden geleni yaptıktan sonra sahip olduğu nimetleri küçümsememeye ve kanaatkâr olmaya çalışmasıdır.',
  'Allah’a tevekkül etmek':
    'Gerekli çabayı gösterdikten sonra Allah’a güvenmek ve sonucu O’na bırakmaktır.',
  'Allah’ın hükmüne razı olmak':
    'İnsanın her şeyi kontrol edemediğini kabul etmesi ve başına gelenlere sabırla karşılık vermeye çalışmasıdır.',
  'Nimetlere şükretmek':
    'Nimetlerin kıymetini bilmek, Allah’a teşekkür etmek ve nimetleri doğru şekilde kullanmaktır.',
  'Belalara sabretmek':
    'Zorluklar karşısında umutsuzluğa kapılmadan, yanlış davranışlardan uzak durarak dayanma gayreti göstermektir.',
  'Günahlardan tövbe etmek':
    'Yanlışı bırakmak, pişmanlık duymak ve tekrar etmemeye karar vermektir. Kul hakkı varsa hakkı telafi etmek de önemlidir.',
  'İbadetleri ihlasla yapmak':
    'İbadeti gösteriş için değil, Allah rızasını gözeterek yerine getirmektir.',
  'Şeytanı düşman bilmek':
    'İnsanı kötülüğe yönelten vesveselere karşı dikkatli olmak ve dinî-ahlaki sorumlulukları korumaktır.',
  'Kur’an-ı Kerim’i dinî rehber kabul etmek':
    'Kur’an’ı temel vahiy kaynağı kabul etmek, anlamını öğrenmeye çalışmaktır.',
  'Ölüme hazırlıklı olmak':
    'Ömrünü sorumluluk bilinciyle yaşamak, ibadet ve iyiliklere yönelmek, kul haklarından sakınmaktır.',
  'İyiliği emretmek ve kötülükten sakındırmak':
    'İyiliği uygun bir dille teşvik etmek, yanlışlardan sakındırırken hikmet ve zarar vermeme ilkelerini gözetmektir.',
  'Gıybet etmemek ve kötü sözleri dinlememek':
    'Bir kişinin arkasından hoşlanmayacağı biçimde konuşmaktan ve zarar veren sözleri yaymaktan kaçınmaktır.',
  'Anne ve babaya iyilik etmek':
    'Anne babaya saygı ve iyilik göstermek; dinen yanlış konularda itaatin sınırlarını da bilmektir.',
  'Akrabaları ziyaret etmek':
    'Akrabalık bağlarını korumak, hâl hatır sormak ve imkân ölçüsünde yardım etmektir.',
  'Emanete ihanet etmemek':
    'Kişiye güvenilerek bırakılan malı, bilgiyi veya sorumluluğu korumak ve sahibine hakkıyla teslim etmektir.',
  'Uygunsuz şaka ve davranışlardan kaçınmak':
    'İnsanları aşağılayan, inciten veya dinî-ahlaki sınırları aşan şaka ve davranışlardan sakınmaktır.',
  'Allah’a ve Resulüne itaat etmek':
    'İslam’ın temel kaynaklarını öğrenmek ve dinî sorumlulukları bilinçli şekilde yerine getirmeye çalışmaktır.',
  'Günahtan kaçınmak ve Allah’a sığınmak':
    'Yanlış davranışlardan uzak durmak, hata edildiğinde tövbe etmek ve Allah’tan yardım dilemektir.',
  'Allah için sevmek ve Allah için buğzetmek':
    'Sevgi ve karşı çıkışlarında kişisel çıkar yerine ahlaki ilkeleri gözetmektir.',
  'Olaylardan ibret almak':
    'Yaşanan olayları düşünerek sonuç çıkarmak ve aynı hataları tekrarlamamaya çalışmaktır.',
  'Tefekkür etmek':
    'Yaratılış, hayat, sorumluluklar ve Allah’ın nimetleri üzerine düşünmektir.',
  'İlim öğrenmeye çalışmak':
    'Dinî ve dünyevi sorumlulukları doğru yerine getirmeye yardımcı olan faydalı bilgileri öğrenmeye gayret etmektir.',
  'Kötü zandan sakınmak':
    'Somut dayanak olmadan başkaları hakkında kötü hüküm vermekten kaçınmaktır.',
  'İnsanlarla alay etmemek':
    'Bir kişiyi görünüşü, dili, durumu veya başka bir özelliği nedeniyle küçümsememektir.',
  'Harama bakmamak':
    'Bakışlarını dinî ve ahlaki sınırlar içinde tutmaya, mahremiyete saygı göstermeye çalışmaktır.',
  'Doğru sözlü olmak':
    'Yalan söylememek, gerçeği çarpıtmamak ve verilen sözlerde dürüst davranmaktır.',
  'Şımarıklık ve azgınlıktan kaçınmak':
    'Güç, mal veya başarı sebebiyle başkalarını küçümsememek ve sınırları aşmaktan sakınmaktır.',
  'Sihir yapmamak':
    'İslamî gelenekte yasaklanan sihir ve büyü uygulamalarından uzak durmaktır.',
  'Ölçü ve tartıda dürüst olmak':
    'Alım satımda miktarları doğru ölçmek, hile yapmamak ve karşı tarafın hakkını korumaktır.',
  'Allah’ın azabından korkmak':
    'Yanlış davranışların sonuçlarını ciddiye alarak sorumluluk bilinciyle yaşamaktır.',
  'Allah’ın rahmetinden ümit kesmemek':
    'Hata ve günahlar karşısında tövbe kapısının açık olduğunu bilmektir.',
  'Yoksullara yardım etmek':
    'İhtiyaç sahiplerine imkân ölçüsünde maddi veya manevi destek vermektir.',
  'Nefsin haram arzularına uymamak':
    'İstekleri sorgulamak ve dinî-ahlaki açıdan yanlış olan davranışlardan kaçınmaktır.',
  'İhtiyaç sahibini doyurmak':
    'Açlık çeken kimselere gücü yettiğince yiyecek sağlamak ve ihtiyaçlarını gözetmektir.',
  'Geçimini sağlamak için çalışmak':
    'Kendinin ve sorumluluğu altındakilerin meşru ihtiyaçlarını karşılamak için helal yollardan çaba göstermektir.',
  'Zekât ve öşür yükümlülüklerini yerine getirmek':
    'Zekât ve öşür, şartları ve hesaplanması farklı olabilen mali ibadetlerdir.',
  'Hayız ve nifas dönemlerinde cinsel ilişkiden kaçınmak':
    'İlgili dinî hükümlere uymak; özel durumların ayrıntılarını güvenilir ilmihal kaynağından öğrenmektir.',
  'Kalbi günahlardan temiz tutmak':
    'Kibir, haset, riya ve benzeri kötü tutumlardan arınmaya çalışmaktır.',
  'Kibirden sakınmak':
    'Kendini başkalarından üstün görmemek, insanları küçümsememek ve tevazu sahibi olmaya çalışmaktır.',
  'Yetimin malını korumak':
    'Anne veya babasını kaybetmiş çocuğun malını haksız kullanımdan korumak ve hakkını gözetmektir.',
  'Cinsel davranışlarda haramdan sakınmak':
    'Cinsellikle ilgili dinî ve ahlaki sınırlara uymaktır.',
  'Farz namazları vaktinde kılmak':
    'Namazları belirlenmiş vakitlerinde yerine getirmek ve sebepsiz yere ertelememeye çalışmaktır.',
  'Allah’a şirk koşmamak':
    'Allah’a ait ilahlık ve ibadet hakkını başkasına vermemek, O’nun birliğine inanmak demektir.',
  'Zinadan kaçınmak':
    'İslam’ın cinsel ahlakla ilgili hükümlerine uymak ve başkalarının haklarını korumaktır.',
  'İçki içmemek':
    'İslam’da yasaklanan sarhoş edici içeceklerden uzak durmaktır.',
  'Yalan yere yemin etmemek':
    'Bir iddiayı desteklemek için bilerek gerçeğe aykırı yemin etmemektir.',
  'Başkalarının malını haksız yere almamak':
    'Hırsızlık, dolandırıcılık, gasp ve benzeri yollarla başkasının hakkını ihlal etmemektir.',

  /* ---------------- Namazın sünnetleri ---------------- */
  'İftitah tekbirinde elleri kaldırmak':
    'Namaza başlarken “Allahu ekber” derken elleri kulak hizasına (erkekler) veya omuz hizasına (kadınlar) kaldırmak sünnettir.',
  'Kıyamda elleri bağlamak':
    'Erkeklerde göbek altına, kadınlarda göğüs üstüne sağ eli sol el üzerine koyarak bağlamak sünnettir.',
  'Sübhâneke duası okumak':
    'Namaza başlarken Fâtiha’dan önce okunan açılış duasıdır.',
  'Eûzü-Besmele çekmek':
    'Her rekâtta Fâtiha’dan önce “Eûzü billâhi mineşşeytânirracîm” ve “Bismillâhirrahmânirrahîm” demek sünnettir.',
  'Fâtiha’dan sonra zamm-ı sûre okumak':
    'Farzların ilk iki rekâtında ve diğer namazların her rekâtında Fâtiha’ya ek olarak Kur’an’dan bir bölüm okumak sünnettir.',
  'Fâtiha bitince “Âmîn” demek':
    'Fâtiha sûresi bitince “Âmîn” demek sünnettir.',
  'Rükûda üç kere “Sübhâne Rabbiye’l-Azîm” demek':
    'Rükûda en az üç defa söylenmesi sünnettir.',
  'Secdede üç kere “Sübhâne Rabbiye’l-A’lâ” demek':
    'Secdede en az üç defa söylenmesi sünnettir.',
  'İki secde arasında oturmak':
    'İki secde arasında kısa bir süre oturmak sünnettir.',
  'Ka’de-i ûlâ (ilk oturuş)':
    'Üç veya dört rekâtlı namazların ikinci rekâtının sonunda yapılan ilk oturuş.',
  'Tahiyyât duası okumak':
    'Her oturuşta okunan “Ettehiyyâtü” duasıdır.',
  'Son oturuşta salavât ve dua okumak':
    'Son oturuşta Tahiyyât’tan sonra salavât ve uygun dualar okumak sünnettir.',
  'Rükû ve secdelere giderken tekbir getirmek':
    'Rükûya, secdeye inerken ve kalkarken tekbir getirmek sünnettir.',

  /* ---------------- Namazı bozanlar ---------------- */
  'Namazda konuşmak':
    'Namaz içinde bilerek konuşmak namazı bozar.',
  'Namazda sesli gülmek':
    'Namazda sesli gülmek namazı ve (Hanefî’de) abdesti bozar.',
  'Namazda yiyip içmek':
    'Namaz içinde bilerek yemek veya içmek namazı bozar.',
  'Kıbleden göğsü çevirmek':
    'Göğüs kıble yönünden çevrildiğinde namaz bozulur.',
  'Amel-i kesîr (yoğun hareket)':
    'Namaz dışı bir iş için art arda yoğun hareket etmek (amel-i kesîr) namazı bozar.',
  'Namazın farzlarından birini terk etmek':
    'Kıyam, kıraat, rükû, secde gibi farzlardan birinin bilerek terk edilmesi namazı bozar.',
  'Namazda abdestin bozulması':
    'Namaz içinde abdest bozulursa namaz da bozulur.',
  'Namazda “âh” gibi anlamlı sesler çıkarmak':
    'İnleme veya “âh” gibi anlamlı sesler namazı bozar.',

  /* ---------------- Namaz vakitleri ---------------- */
  'İmsak (Sabah namazının başlangıcı)':
    'Fecr-i sâdık ile sabah namazı vakti başlar ve güneş doğuncaya kadar devam eder.',
  'Güneş doğuşu (Sabah namazının sonu)':
    'Güneş doğmaya başladığında sabah namazının vakti sona erer.',
  'Öğle (Zeval sonrası)':
    'Güneşin tam tepe noktasından batıya doğru kaymasıyla öğle vakti girer.',
  'İkindi':
    'İkindi vakti, öğle vaktinin bitiminden güneş batımına kadar devam eder.',
  'Akşam (Güneş batışı sonrası)':
    'Güneş batınca akşam namazı vakti girer.',
  'Yatsı':
    'Akşam vaktinin bitiminden itibaren yatsı vakti girer ve imsak vaktine kadar devam eder.',
  'Vitir vakti':
    'Vitir namazı yatsı namazından sonra kılınır; sabah namazının başlamasıyla vakti sona erer.',
  'Kerahat vakitleri':
    'Güneşin doğuşu, tam tepe noktasında olması ve batışı sırasında kerahet vakitleri vardır. Bu vakitlerde nafile namaz kılmak uygun görülmez.',

  /* ---------------- Namaz rekatları ---------------- */
  'Sabah: 2 sünnet + 2 farz':
    'Sabah namazı 2 sünnet ve 2 farz olmak üzere 4 rekâttır.',
  'Öğle: 4 ilk sünnet + 4 farz + 2 son sünnet':
    'Öğle namazı 4 ilk sünnet, 4 farz ve 2 son sünnet olmak üzere 10 rekâttır.',
  'İkindi: 4 sünnet + 4 farz':
    'İkindi namazı 4 sünnet ve 4 farz olmak üzere 8 rekâttır.',
  'Akşam: 3 farz + 2 sünnet':
    'Akşam namazı 3 farz ve 2 sünnet olmak üzere 5 rekâttır.',
  'Yatsı: 4 ilk sünnet + 4 farz + 2 son sünnet + 3 vitir':
    'Yatsı namazı 4 ilk sünnet, 4 farz, 2 son sünnet ve 3 vitir olmak üzere 13 rekâttır.',
  'Cuma: 4 ilk sünnet + 2 farz + 4 son sünnet':
    'Cuma namazı 4 ilk sünnet, 2 farz ve 4 son sünnet olmak üzere 10 rekâttır. Bazı kaynaklarda son sünnetten sonra 2 sünnet daha kılındığı rivayet edilir.',

  /* ---------------- Sehiv secdesi ---------------- */
  'Sehiv secdesi nedir':
    'Namazda unutma veya yanılma sebebiyle yapılan eksiklik/fazlalığı telafi eden iki secdedir.',
  'Ne zaman yapılır':
    'Namazın sünnetlerinden birinin unutulması gibi hallerde, son oturuşta Tahiyyât’tan sonra sağa selam verilir ve iki secde ile telafi edilir.',
  'Nasıl yapılır':
    'Son oturuşta Tahiyyât okunur, sağa selam verilir, iki secde yapılır, tekrar oturulur; Tahiyyât, salavât ve dua okunup iki tarafa selam verilir.',
  'Sehiv secdesini gerektiren durumlar':
    'Namazın sünnet veya vaciplerinden birinin bilerek yapılmaması ya da unutulması sehiv secdesini gerektirebilir. Ayrıntılar için güvenilir bir ilmihale başvurulmalıdır.',
  'Sehiv secdesini gerektirmeyen durumlar':
    'Namazın farzlarından birinin terk edilmesi sehivle telafi edilemez; namazın yeniden kılınması gerekir.',
  'Sehiv secdesinde yanılma':
    'Sehiv secdesi sırasında yanılma olursa ayrı bir sehiv secdesi gerekmez; namaz tamamlanır.',

  /* ---------------- Abdesti bozanlar ---------------- */
  'Önden veya arkadan bir şey çıkması':
    'İdrar, gaita, meni gibi şeylerin çıkması abdesti bozar.',
  'Yellenmek':
    'Arkadan gaz çıkarmak abdesti bozar.',
  'Uyku':
    'Yatarak, dayanarak veya derin uykuya dalarak uyumak abdesti bozar.',
  'Bayılmak veya delirmek':
    'Şuur kaybı abdesti bozar.',
  'Kan veya irin gibi sıvıların yayılması':
    'Vücuttan çıkan kan, irin gibi necasetin namaza engel olacak kadar yayılması abdesti bozar.',
  'Ağız dolusu kusmak':
    'Ağız dolusu kusmak abdesti bozar.',
  'Cinsel ilişki':
    'Cinsel ilişki hem abdesti hem de guslü gerektirir.',
  'Hayız veya nifas hâli':
    'Kadınlarda hayız veya nifas başlaması abdesti bozar.',

  /* ---------------- Guslü gerektirenler ---------------- */
  'Cünüplük (meni çıkması)':
    'Şehvetle meni çıkması guslü gerektirir.',
  'İhtilam (uykuda meni çıkması)':
    'Uykuda meni çıkması (ihtilam) guslü gerektirir.',
  'Hayız hâlinin sona ermesi':
    'Kadınlarda hayız hâli bittikten sonra gusletmek gerekir.',
  'Nifas hâlinin sona ermesi':
    'Lohusalık (nifas) hâli bittikten sonra gusletmek gerekir.',

  /* ---------------- Oruç türleri ---------------- */
  'Farz oruç (Ramazan)':
    'Ramazan ayı orucu, oruç tutmakla yükümlü her Müslümana farzdır.',
  'Vacip oruç (Kaza, adak)':
    'Kaza veya adak sebebiyle tutulması gereken oruçlar vacip oruçlardandır.',
  'Nafile oruç':
    'Ramazan dışında sevap kazanmak amacıyla tutulan oruçlardır.',
  'Sünnet oruç':
    'Pazartesi-Perşembe, Aşure, Şevval ayı oruçları gibi sünnet kabul edilen oruçlar.',
  'Mekruh oruç':
    'Sadece Cuma veya sadece Cumartesi gibi tek gün tutulan oruçlar bazı âlimlerce mekruh sayılmıştır.',
  'Haram oruç (Bayram günlerinde)':
    'Ramazan ve Kurban Bayramı günlerinde oruç tutmak haramdır.',

  /* ---------------- Orucu bozanlar ---------------- */
  'Bilerek yiyip içmek':
    'Oruçlu iken bilerek bir şey yiyip içmek orucu bozar ve kaza gerektirir.',
  'Bilerek kusmak':
    'Ağız dolusu bilerek kusmak orucu bozar.',
  'Hayız veya nifas başlaması':
    'Kadınlarda hayız veya nifas hâlinin başlaması orucu bozar; sonrasında kaza gerekir.',
  'Sigara içmek':
    'Oruçlu iken sigara içmek orucu bozar.',
  'Ağız yoluyla ilaç almak':
    'Ağız yoluyla ilaç almak orucu bozar.',
  'Boğaza kan gitmesi':
    'Diş çekimi veya kan aldırma sırasında boğaza kan gitmesi hâlinde oruç bozulabilir; ayrıntılar için ilmihale başvurulmalıdır.',
  'Unutarak yiyip içmek':
    'Unutarak yiyip içmek orucu bozmaz; kişi orucuna devam eder.',
  'Yalan ve iftira (sevabını giderir)':
    'Yalan ve iftira orucu bozmaz; ancak orucun sevabını azaltır.',

  /* ---------------- Zekât kimlere ---------------- */
  'Fakirler':
    'Nisap miktarından az mala sahip olan veya hiç malı olmayan Müslümanlar zekât alabilir.',
  'Miskinler':
    'Hiçbir şeyi olmayan, çok zor durumda olan kimseler zekât alabilir.',
  'Zekât toplama görevlileri':
    'Zekâtı toplamak ve dağıtmakla görevli kişiler zekât alabilir.',
  'Kalpleri İslam’a ısındırılacak olanlar':
    'İslam’a ısındırılmak istenen veya İslam’a bağlılığı güçlendirilmek istenen kişiler zekât alabilir.',
  'Köleler (klasik dönem)':
    'Klasik dönemde özgürlüğüne kavuşmak isteyen köleler zekât alabilirdi. Günümüzde bu hüküm doğrudan uygulanmaz; ağır borç altındaki kişiler “borçlular” sınıfında değerlendirilir.',
  'Borçlular':
    'Borcu sebebiyle zor durumda olan kimseler zekât alabilir.',
  'Allah yolunda olanlar':
    'Allah yolunda ilim, davet veya cihat gibi hizmetlerde bulunanlar zekât alabilir.',
  'Yolda kalmışlar':
    'Yolculuk sırasında maddi sıkıntıya düşen kimseler zekât alabilir.',
  'Zenginler':
    'Nisap miktarından fazla mala sahip olan zenginlere zekât verilmez.',
  'Güçlü ve çalışabilecek durumda olanlar':
    'Sağlıklı ve çalışabilecek durumda olan yoksullara, çalışmıyor olmaları sebebiyle zekât verilmesi uygun görülmez.',
  'Zekât verenin anne-babası ve üstsoyu':
    'Kişi anne-babasına, dede-nine gibi üstsoyuna zekât veremez.',
  'Zekât verenin çocukları ve altsoyu':
    'Kişi çocuklarına, torunlarına zekât veremez.',
  'Zekât verenin eşi':
    'Kişi eşine zekât veremez.',

  /* ============================================================
     YENİ — Tevhid ve İman Esasları
     ============================================================ */
  'Tevhid nedir':
    'Tevhid, Allah’ın bir ve tek olduğuna, eşi ve benzeri bulunmadığına, kâinatın tek yaratıcısı ve tek ilâhı olduğuna inanmaktır. İslam’ın temeli olup tüm peygamberlerin tebliğ ettiği esasların başıdır. Kelime-i şehadetin ilk bölümü olan “Lâ ilâhe illallah” tevhidin öz ifadesidir.',
  'Tevhidin kısımları':
    'Klasik kelam âlimleri tevhidi üç boyutta ele alır: Rubûbiyet tevhidi (Allah’ın yaratıcı, tek idareci ve rızık verici olduğuna iman), Ulûhiyet tevhidi (ibadete layık tek ilâhın Allah olduğuna iman) ve Esmâ-Sıfât tevhidi (Allah’ın isim ve sıfatlarında eşsiz ve benzersiz olduğuna iman).',
  'İmanın tanımı ve amelle ilişkisi':
    'İman; kalp ile tasdik, dil ile ikrar ve amelle desteklenen bir bütündür. Ehl-i sünnete göre iman, ibadet ve itaatle artar, günah ve isyanla zayıflar. Ancak büyük günah işlemek kişiyi İslam dairesinden çıkarmaz; tövbe kapısı her zaman açıktır.',
  'Şirk nedir, çeşitleri nelerdir':
    'Şirk, Allah’a ait olan ilahlık, yaratıcılık veya ibadet hakkını başka bir varlığa vermektir. İslam’da en büyük günah sayılır. Büyük şirk kişiyi İslam dairesinden çıkarır; küçük şirk (riya, gösteriş gibi) ise imanı zayıflatır ve amelin sevabını azaltır.',
  'Münafıklık ve küfür sınırı':
    'Münafıklık, inanmadığı hâlde Müslüman görünmektir. İtikâdî münafıklık İslam’dan çıkarır; amelî münafıklık ise imanı zayıflatır ve kişi İslam dairesinde kalır. Küfür ise iman esaslarını inkâr etmektir; kişiyi dinden çıkarır. Bu sınırların tespiti için samimiyetle ilim öğrenmek ve ehline danışmak esastır.',

  /* ============================================================
     YENİ — Meleklere İman
     ============================================================ */
  'Melek nedir, mahiyeti nasıldır':
    'Melekler; Allah’ın nurdan yarattığı, gözle görülmeyen, cinsiyeti olmayan, yemeyen-içmeyen, kendilerine verilen emirleri eksiksiz yerine getiren ve günah işlemeyen şuurlu varlıklardır. Vahiy, kâinatın işleyişi ve insan hayatıyla ilgili görevleri vardır.',
  'Meleklerin ortak özellikleri':
    'Melekler masumdur; günah işlemez ve emrolunmadıkları işi yapmazlar. Çok hızlı hareket edebilir, Allah’ın izniyle farklı şekillere girebilirler. Sayıları yalnızca Allah tarafından bilinir; ibadetle meşguldürler ve asla isyan etmezler.',
  'Dört büyük melek ve görevleri':
    'Cebrâil (a.s.) peygamberlere vahiy getirir; Mîkâil (a.s.) tabiat olayları, rızık ve yağmurla ilgili emirleri uygular; İsrâfil (a.s.) kıyamet günü sûra üflemekle görevlidir; Azrâil (a.s.) eceli gelenlerin ruhunu alır. Bu dört melek “melek-i mukarrebîn” olarak da anılır.',
  'Kirâmen Kâtibîn ve sorgu melekleri':
    'Her insanın sağında ve solunda iki melek bulunur; biri iyilikleri, diğeri kötülükleri yazar. Bunlara Kirâmen Kâtibîn denir. Kabirde ise Münker ve Nekir isimli iki melek sorgu ile görevlidir.',
  'Meleklere imanın insan hayatına etkisi':
    'Meleklere iman, kişide sorumluluk bilinci, iyiliğe teşvik ve kötülükten sakınma duygusu oluşturur. Amellerin kayıt altına alındığını bilmek, kişiyi daha dikkatli ve ahlaklı davranmaya yönlendirir. Ayrıca kâinatın düzenli bir şekilde idare edildiğini fark ettirir.',

  /* ============================================================
     YENİ — Peygamberlere İman
     ============================================================ */
  'Peygamber nedir, niçin gönderilmiştir':
    'Peygamber, Allah’ın insanlar arasından seçip kendi mesajlarını tebliğ etmekle görevlendirdiği seçkin kuldur. Peygamberler beşer olup vahiy dışında diğer insanlar gibidir; ancak günahtan korunmuşlardır. İnsanlara tevhid inancını, ibadet esaslarını ve güzel ahlakı öğretmek için gönderilmişlerdir.',
  'Nebî ile resûl arasındaki fark':
    'Nebî, kendisine vahiy gelen ve önceki şeriatı devam ettiren peygamberdir. Resûl ise yeni bir şeriat ve kitapla gönderilen peygamberdir. Bu tanıma göre her resûl nebidir; ancak her nebi resûl değildir.',
  'Peygamberlerin ortak sıfatları':
    'Peygamberlerin ortak sıfatları beştir: Sıdk (doğru sözlülük), Emânet (güvenilirlik), Tebliğ (Allah’ın emirlerini eksiksiz iletme), Fetânet (yüksek akıl ve zekâ) ve İsmet (büyük günahlardan korunmuşluk). Bu sıfatlar onların güvenilir rehberler olduğunu gösterir.',
  'Ulü’l-azm peygamberler':
    'Ulü’l-azm; en büyük sıkıntılara göğüs geren, yeni şeriatlarla gönderilen ve üstün azim gösteren beş peygambere denir: Hz. Nûh, Hz. İbrâhim, Hz. Mûsâ, Hz. Îsâ ve Hz. Muhammed (s.a.v.). Bu peygamberler, risalet zincirinin en önemli halkalarıdır.',
  'Hz. Muhammed’in nübüvvet özellikleri':
    'Hz. Muhammed (s.a.v.), peygamberlerin sonuncusudur; kendisinden sonra peygamber gelmeyecektir. Tüm insanlığa gönderilmiş, risaleti kıyamete kadar geçerli olan “hâtemü’n-nebiyyîn”dir. Kendisine Kur’ân-ı Kerîm vahyedilmiş; en büyük mucizesi de Kur’ân olmuştur.',

  /* ============================================================
     YENİ — Kutsal Kitaplar
     ============================================================ */
  'Dört büyük kitap ve peygamberleri':
    'Allah tarafından peygamberlere indirilen dört büyük kitap vardır: Tevrat (Hz. Mûsâ), Zebur (Hz. Dâvûd), İncil (Hz. Îsâ) ve Kur’ân-ı Kerîm (Hz. Muhammed). Bunların dışında bazı peygamberlere küçük ilahî sayfalar (suhuf) verilmiştir.',
  'Tevrat, Zebur ve İncil’in ortak özellikleri':
    'Bu üç kitap, kendi dönemlerine ait ilahî vahiylerdir ve asli hallerinde hak üzereydiler. Ancak zamanla tahrif edilmiş, değiştirilmiş ve orijinal metinleri korunamamıştır. Bu kitaplardaki bazı hakikatler Kur’ân tarafından tasdik edilmiş, bazı tahrif edilmiş hükümler ise düzeltilmiştir.',
  'Kur’ân-ı Kerîm’in temel özellikleri':
    'Kur’ân-ı Kerîm, Hz. Muhammed’e vahyedilen son ilahî kitaptır. Kıyamete kadar korunacağı Allah tarafından garanti edilmiştir; hiçbir değişikliğe uğramamıştır. Tüm insanlığa hitap eder, evrensel ve son şeriattır. Hem lafzı hem de manası itibarıyla mucizedir.',
  'Suhuf nedir, hangi peygamberlere verilmiştir':
    'Suhuf, büyük kitaplardan önce bazı peygamberlere verilen küçük ilahî sayfalardır. Rivayete göre Hz. Âdem’e 10, Hz. Şît’e 50, Hz. İdrîs’e 30 ve Hz. İbrâhim’e 10 suhuf verilmiştir. Günümüze asli halleriyle ulaşmamışlardır.',

  /* ============================================================
     YENİ — Ahiret İnancı
     ============================================================ */
  'Ahiret nedir, niçin inanılır':
    'Ahiret, ölümden sonra başlayan ebedî hayattır. Kur’an’da pek çok âyette ahiret inancı vurgulanır. Ahiret inancı, insanın dünyadaki davranışlarının bir hesabı olduğu bilinciyle ahlaklı yaşamasını sağlar. Aynı zamanda ümit ve sabır kaynağıdır.',
  'Kabir hayatı ve berzah':
    'Berzah, ölüm ile kıyamet arasındaki geçiş dönemidir. Kabirde insan ruhu belli bir idrak içinde olur; iyi kullar huzur, kötüler sıkıntı içinde olurlar. Kabir hayatının mahiyeti tam olarak bilinmez; ancak Kur’an ve hadislerde bildirilen esaslar çerçevesinde kabul edilir.',
  'Kıyamet ve yeniden diriliş':
    'Kıyamet, İsrâfil’in sûra üflemesiyle başlayacak olan kozmik son durumdur. Ardından yeniden diriliş (ba’s) gerçekleşecek, tüm insanlar Allah’ın huzurunda toplanacaktır. Bu, Allah’ın kudretinin bir göstergesi ve her insanın hesap vereceği kesin bir gerçektir.',
  'Mahşer, mîzân ve sırat':
    'Mahşer, yeniden dirilen insanların toplanacağı büyük meydandır. Mîzân, amellerin tartılacağı adalet ölçüsüdür. Sırat, cehennem üzerinden cennete uzanan köprüdür; müminler kolaylıkla geçerken, inkârcılar zorlukla karşılaşırlar. Bu merhaleler Kur’an ve hadislerde bildirilmiştir.',
  'Cennet ve cehennem':
    'Cennet, iyi kulların ebedî mükâfat yurdudur; cehennem ise inkâr ve isyanda ısrar edenlerin cezalandırılacağı yerdir. Müminler için cennet nihai mutluluk; tövbe edip iman üzere ölen her insan için ümit kapısı açıktır. Cennet ve cehennem ebedîdir; ancak bazı günahkâr müminler cezalarını çektikten sonra cennete girebilirler.',

  /* ============================================================
     YENİ — Namaz Çeşitleri
     ============================================================ */
  'Farz namazlar':
    'Günde beş vakit namaz (sabah, öğle, ikindi, akşam, yatsı) her yükümlü Müslümana farzdır. Cuma namazı da cuma günü öğle namazı yerine farz olarak kılınır. Farz namazların inkârı kişiyi dinden çıkarır; tembellik sebebiyle kılmamak ise büyük günahtır.',
  'Vacip namazlar':
    'Hanefî mezhebinde vacip, farz kadar kesin olmayan ancak sünnetten daha kuvvetli olan hükümdür. Vitir namazı ve bayram namazları Hanefî’de vacip kabul edilir. Vacibin inkârı dinden çıkarmaz; ancak özürsüz terk edilmesi günah ve kazayı gerektirir.',
  'Sünnet namazlar':
    'Sünnet namazlar, farz namazlara eşlik eden ve Peygamberimizin devamlı kıldığı namazlardır. “Sünnet-i müekkede” (kuvvetle tavsiye edilen) ve “sünnet-i gayr-i müekkede” (tavsiye edilen) olarak iki kısımdır. Beş vaktin sünnetleri genellikle müekkededir; ancak ikindi ve yatsının ilk sünnetleri gayr-i müekkede kabul edilir.',
  'Nâfile namazlar':
    'Nâfile; farz ve vacip dışında, sevap kazanmak amacıyla kılınan gönüllü namazlardır. Kuşluk (duhâ), teheccüd, istihâre, tesbih ve hâcet namazları bunlara örnektir. Nafile namazlar, farz namazlardaki eksiklikleri tamamlar ve manevi dereceleri yükseltir.',
  'Kaza namazı':
    'Kaza namazı, vaktinde kılınamayan farz veya vacip namazların sonradan kılınmasıdır. Özürsüz terk edilen namazlar için kaza gerekir ve geciktirmek ayrıca günahtır. Mazeret (uyku, unutma gibi) sebebiyle kaçırılan namazın da kazası yapılır. Nafile namazlar için kaza gerekmez.',

  'Cemaatle namaz':
    'Cemaatle namaz, imam ve en az bir kişinin birlikte kıldığı namazdır. Farz namazlarda cemaat sünnet-i müekkede olup büyük sevap içerir. Cemaatte imama uyma şartları, safların düzeni ve imamın arkasında yapılması gerekenler fıkhî olarak belirlenmiştir. Camide cemaate katılmak ayrıca sosyal birlik ve dayanışmayı güçlendirir.',

  /* ============================================================
     YENİ — Hac ve Umre
     ============================================================ */
  'Hac nedir, kimlere farzdır':
    'Hac, ömürde bir kez olmak üzere imkânı olan her Müslümana farzdır. Haccın farz olması için şu şartlar gereklidir: Müslüman olmak, akıl sağlığı, ergenlik çağına gelmiş olmak, hür olmak, yol güvenliği ve maddi imkân. Hac, belirli zaman diliminde (Zilhicce ayı) Mekke ve çevresindeki kutsal mekânlarda yapılan ibadettir.',
  'Haccın farzları':
    'Haccın üç farzı vardır: İhrâma girmek (niyet), Arafat’ta vakfe yapmak (Zilhicce’nin 9. günü) ve Kâbe’yi tavaf etmek (ziyaret tavafı). Bu üç farzdan birinin yapılmaması haccı geçersiz kılar.',
  'Haccın vacipleri':
    'Haccın vacipleri arasında şunlar sayılır: Saç tıraşı olmak veya saçı kısaltmak, Mina’da şeytan taşlamak, kurban kesmek (temettû ve kırân haccında), Safâ ile Merve arasında sa’y yapmak, ihram yasaklarından sakınmak. Vaciplerden birinin terk edilmesi ceza (dem) gerektirir; ancak haccı bozmaz.',
  'Umre nedir, hükmü nedir':
    'Umre, belirli bir zaman dilimiyle sınırlı olmayan; ihrama girip Kâbe’yi tavaf etmek ve Safâ-Merve arasında sa’y yapmaktan ibaret olan bir ibadettir. Hanefî’de sünnet-i müekkede; Şâfiî ve Hanbelî mezheplerinde ise ömürde bir kez farzdır.',
  'İhram ve yasakları':
    'İhram, hac veya umre niyetiyle normalde mubah olan bazı fiilleri kendine yasaklamaktır. İhramlı kişi; saç-sakal kesemez, tırnak kesemez, koku sürünemez, evlenemez, cinsel ilişkide bulunamaz, avlanamaz, dikilmiş dikişli elbise giyemez (erkekler). Bu yasaklardan birinin ihlali ceza gerektirir.',
  'Tavaf, sa’y ve Arafat vakfesi':
    'Tavaf, Kâbe’nin etrafında yedi kez dönmektir. Sa’y, Safâ ile Merve arasında yedi kez gidip gelmektir. Arafat vakfesi ise Zilhicce’nin 9. günü Arafat’ta bir süre durmaktır; hac menasikinin en önemli rüknüdür. Bu üç merasim, hac ve umrenin temel unsurlarıdır.',

  /* ============================================================
     YENİ — Ahlak Esasları
     ============================================================ */
  'İslam ahlakının temeli':
    'İslam ahlakı; Kur’an, sünnet ve İslam âlimlerinin ortaya koyduğu temel değerler üzerine kurulmuştur. Ahlakın temeli; iman, takva, doğruluk, emanet ve Allah’a karşı sorumluluk bilincidir. Peygamberimiz (s.a.v.) “Ben ancak güzel ahlakı tamamlamak için gönderildim” buyurmuştur.',
  'Dürüstlük ve doğru sözlülük':
    'Dürüstlük; sözde, özde ve amelde doğru olmaktır. Yalan söylememek, verdiği sözü tutmak, gerçeği gizlememek Müslümanın temel ahlaki özellikleridir. Kur’an’da “Ey iman edenler! Allah’a karşı gelmekten sakının ve doğru söz söyleyin” (Ahzâb, 70) buyrulur.',
  'Emanet ve güvenilirlik':
    'Emanet, kendisine bırakılan malı, sırrı, bilgiyi veya sorumluluğu korumaktır. Peygamberimiz “Emaneti olmayanın imanı yoktur” buyurmuştur. Müslüman, hem maddi hem manevi emanetleri en iyi şekilde koruyan güvenilir bir kişidir.',
  'Adalet ve hakkaniyet':
    'Adalet, her hak sahibine hakkını vermek; hakkaniyet ise aynı durumdaki kişilere eşit davranmaktır. Adalet, kişisel duygulardan bağımsız uygulanmalıdır. Kur’an “Bir topluluğa olan kininiz sizi adaletsizliğe sürüklemesin” (Mâide, 8) buyurur. İslam’da adalet, sosyal hayatın temelidir.',
  'Merhamet ve şefkat':
    'Merhamet, acı çekene şefkatle yaklaşmak ve onu rahatlatmaya çalışmaktır. Peygamberimiz “Merhamet etmeyene merhamet edilmez” buyurmuştur. Merhamet; çocuklara, yaşlılara, hayvanlara ve tüm mahlûkata karşı gösterilir. Ancak merhamet, hakkın kaybedilmesine sebep olacak kadar sınırsız değildir.',
  'Tevazu ve alçakgönüllülük':
    'Tevazu, kendini başkalarından üstün görmemek, kibirden sakınmaktır. Alçakgönüllü kişi, hem Allah’a karşı hem de insanlara karşı mütevazı davranır. Peygamberimiz “Kim Allah için alçakgönüllü olursa, Allah onu yükseltir” buyurmuştur. Kibir ise ahlaki hastalıkların başında gelir.',
};

/* ================================================================
   Açıklaması olmayan madde için varsayılan metin
   ================================================================ */
export const FALLBACK_EXPLANATION =
  'Bu madde, ilgili dinî sorumluluğun temel anlamını ifade eder. Ayrıntılı hüküm ve istisnalar için güvenilir bir ilmihal kaynağına başvurabilirsin.';