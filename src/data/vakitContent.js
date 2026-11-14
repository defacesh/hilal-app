// src/data/vakitContent.js

export const DEFAULT_MEAL_EDITION = 'tr.diyanet';

export const MEAL_EDITIONS = [
  { id: 'tr.diyanet', name: 'Diyanet İşleri Başkanlığı' },
  { id: 'tr.ates', name: 'Süleyman Ateş' },
  { id: 'tr.bulac', name: 'Ali Bulaç' },
  { id: 'tr.yazir', name: 'Elmalılı Hamdi Yazır' },
  { id: 'tr.ozturk', name: 'Yaşar Nuri Öztürk' },
  { id: 'tr.vakfi', name: 'Türkiye Diyanet Vakfı' },
];

export function getMealEditionName(id) {
  const found = MEAL_EDITIONS.find((m) => m.id === id);
  return found?.name ?? 'Diyanet İşleri Başkanlığı';
}

export function getVakitBaslik(prayerId) {
  switch (prayerId) {
    case 'imsak':
      return 'Sabah / İmsak Vakti';
    case 'sunrise':
      return 'Güneş Doğuşu';
    case 'dhuhr':
      return 'Öğle Vakti';
    case 'asr':
      return 'İkindi Vakti';
    case 'maghrib':
      return 'Akşam Vakti';
    case 'isha':
      return 'Yatsı Vakti';
    default:
      return 'Günün Vakti';
  }
}

/* ================================================================
   ESMAÜL HÜSNA — TÜRKÇE İSİMLERİ VE ANLAMLARI
   ================================================================ */

export const ESMA_TR_ISIMLER = {
  1: 'Er-Rahmân', 2: 'Er-Rahîm', 3: 'El-Melik', 4: 'El-Kuddûs', 5: 'Es-Selâm',
  6: 'El-Mü’min', 7: 'El-Müheymin', 8: 'El-Azîz', 9: 'El-Cebbâr', 10: 'El-Mütekebbir',
  11: 'El-Hâlık', 12: 'El-Bâri', 13: 'El-Musavvir', 14: 'El-Gaffâr', 15: 'El-Kahhâr',
  16: 'El-Vehhâb', 17: 'Er-Rezzâk', 18: 'El-Fettâh', 19: 'El-Alîm', 20: 'El-Kâbıd',
  21: 'El-Bâsıt', 22: 'El-Hâfıd', 23: 'Er-Râfi‘', 24: 'El-Mü‘ızz', 25: 'El-Müzill',
  26: 'Es-Semî‘', 27: 'El-Basîr', 28: 'El-Hakem', 29: 'El-Adl', 30: 'El-Latîf',
  31: 'El-Habîr', 32: 'El-Halîm', 33: 'El-Azîm', 34: 'El-Gafûr', 35: 'Eş-Şekûr',
  36: 'El-Aliyy', 37: 'El-Kebîr', 38: 'El-Hafîz', 39: 'El-Mukît', 40: 'El-Hasîb',
  41: 'El-Celîl', 42: 'El-Kerîm', 43: 'Er-Rakîb', 44: 'El-Mücîb', 45: 'El-Vâsi‘',
  46: 'El-Hakîm', 47: 'El-Vedûd', 48: 'El-Mecîd', 49: 'El-Bâ‘ıs', 50: 'Eş-Şehîd',
  51: 'El-Hakk', 52: 'El-Vekîl', 53: 'El-Kaviyy', 54: 'El-Metîn', 55: 'El-Veliyy',
  56: 'El-Hamîd', 57: 'El-Muhsî', 58: 'El-Mübdi’', 59: 'El-Mu‘îd', 60: 'El-Muhyî',
  61: 'El-Mümît', 62: 'El-Hayy', 63: 'El-Kayyûm', 64: 'El-Vâcid', 65: 'El-Mâcid',
  66: 'El-Vâhid', 67: 'Es-Samed', 68: 'El-Kâdir', 69: 'El-Muktedir', 70: 'El-Mukaddim',
  71: 'El-Muahhir', 72: 'El-Evvel', 73: 'El-Âhir', 74: 'Ez-Zâhir', 75: 'El-Bâtın',
  76: 'El-Vâlî', 77: 'El-Müteâlî', 78: 'El-Berr', 79: 'Et-Tevvâb', 80: 'El-Müntekım',
  81: 'El-Afüvv', 82: 'Er-Raûf', 83: 'Mâlikü’l-Mülk', 84: 'Zû’l-Celâli ve’l-İkrâm',
  85: 'El-Muksıt', 86: 'El-Câmi‘', 87: 'El-Ganiyy', 88: 'El-Mugnî', 89: 'El-Mâni‘',
  90: 'Ed-Dârr', 91: 'En-Nâfi‘', 92: 'En-Nûr', 93: 'El-Hâdî', 94: 'El-Bedî‘',
  95: 'El-Bâkı', 96: 'El-Vâris', 97: 'Er-Raşîd', 98: 'Es-Sabûr', 99: 'Er-Rabb'
};

export const ESMA_TR_ANLAMLAR = {
  1: 'Dünyada yarattığı bütün mahlûkata merhamet eden, şefkat gösteren.',
  2: 'Ahirette yalnız müminlere sonsuz ikram ve merhamette bulunan.',
  3: 'Mülkün, kâinatın yegâne sahibi ve hükümdarı.',
  4: 'Her türlü eksiklikten, kusurdan uzak ve pek mukaddes olan.',
  5: 'Esenlik veren, kullarını her türlü tehlikeden selamete çıkaran.',
  6: 'Gönüllerde iman ışığını yakan, emniyet ve güven veren.',
  7: 'Kâinatın bütün işlerini gözetip koruyan, yöneten.',
  8: 'İzzet ve azamet sahibi, üstünlüğü her zaman galip gelen.',
  9: 'Dilediğini zorla yaptıran, kırılanları onaran, eksikleri tamamlayan.',
  10: 'Büyüklükte eşi ve benzeri olmayan, azametini gösteren.',
  11: 'Yaratıcı; her şeyi yoktan var eden.',
  12: 'Her şeyi kusursuz ve birbirine uygun şekilde yaratan.',
  13: 'Tasarlayan, varlıklara biçim ve şekil veren.',
  14: 'Kullarının günahlarını örten, çok bağışlayan.',
  15: 'Her şeye mutlak galip gelen, kahreden ve hakim olan.',
  16: 'Karşılıksız, bol bol hibeler ve nimetler bahşeden.',
  17: 'Bütün mahlûkatın rızkını veren ve ihtiyacını karşılayan.',
  18: 'Her türlü müşkülü çözen, hayır kapılarını açan.',
  19: 'Gizli açık her şeyi en ince detayına kadar bilen.',
  20: 'Dilediğinin rızkını ve ruhunu sıkan, daraltan.',
  21: 'Dilediğine rızkı ve lütfu bol bol veren, genişleten.',
  22: 'Kafirleri ve zalimleri alçaltan, derecelerini düşüren.',
  23: 'Müminleri yükselten, şeref ve derece bahşeden.',
  24: 'Dilediğine izzet veren, şereflendiren.',
  25: 'Dilediğini zillete düşüren, hor ve hakir kılan.',
  26: 'Gizli açık her sesi, yakarışı ve duayı işiten.',
  27: 'Karanlıktaki en küçük şeyi ve kalpten geçenleri gören.',
  28: 'Hükmeden, hakkı batıldan ayıran adil hakim.',
  29: 'Mutlak adalet sahibi, hiçbir şeyde haksızlık etmeyen.',
  30: 'Lütuf sahibi, kullarına sezdirmeden iyilik ulaştıran.',
  31: 'Her şeyin iç yüzünden ve gizli taraflarından haberdar olan.',
  32: 'Cezada acele etmeyen, yumuşaklık gösteren, halim olan.',
  33: 'Pek yüce, azametli, büyüklüğünün sınırı olmayan.',
  34: 'Bağışlaması bol olan, günahları örten ve affeden.',
  35: 'Kendi rızası için yapılan az amele çok mükafat veren.',
  36: 'Yüceler yücesi, makamı ve kadri en yüksek olan.',
  37: 'Büyüklükte dengi ve benzeri bulunmayan, pek büyük.',
  38: 'Her şeyi muhafaza eden, koruyan ve denetleyen.',
  39: 'Her mahlûkatın gıdasını ve azığını verip gözeten.',
  40: 'Kulların hesabını en iyi gören, herkese yettiğince kafi gelen.',
  41: 'Büyüklüğü ve ululuğu pek yüce olan.',
  42: 'İkramı, lütfu ve cömertliği sonsuz olan.',
  43: 'Bütün varlıkları her an gözetim altında tutan.',
  44: 'Duaları kabul eden, istekleri ve dilekleri geri çevirmeyen.',
  45: 'İlmi, ihsanı ve rahmeti sınır tanımayacak kadar geniş olan.',
  46: 'Her buyruğu ve her yarattığı hikmetli olan.',
  47: 'İtaatkar kullarını çok seven ve sevilmeye en layık olan.',
  48: 'Şanı, şerefi ve övgüsü pek yüce olan.',
  49: 'Ölüleri dirilten, peygamberler gönderen.',
  50: 'Her zaman ve her yerde hazır ve nazır olan, tanık olan.',
  51: 'Varlığı hiç değişmeden duran, gerçeğin ta kendisi.',
  52: 'Kullarının işlerini en iyi şekilde yöneten ve güvenilen.',
  53: 'Pek güçlü, kudretine hiçbir şey karşı koyamayan.',
  54: 'Kudret kaynağı sonsuz, sarsılmaz derecede güçlü.',
  55: 'İnananların dostu ve yardımcısı olan.',
  56: 'Övülmeye en layık, her türlü hamde layık olan.',
  57: 'Yaratılmış her şeyin sayısını bir bir bilen.',
  58: 'Maddesiz ve örneksiz olarak ilk defa yaratan.',
  59: 'Öldükten sonra mahlûkatı yeniden diriltecek olan.',
  60: 'Cansızlara hayat veren, can bağışlayan.',
  61: 'Canlıların hayatına son veren, ölümü yaratan.',
  62: 'Daima diri, ezeli ve ebedi hayat sahibi.',
  63: 'Kendi kendine var olan, kâinatı ayakta tutan.',
  64: 'Dilediğini istediği an bulan, hiçbir şeye muhtaç olmayan.',
  65: 'Şanı ve keremi pek yüce, cömertliği sonsuz.',
  66: 'Zatında, sıfatlarında ve fiillerinde tek ve eşsiz olan.',
  67: 'Her şeyin kendisine muhtaç olduğu, kendisi kimseye muhtaç olmayan.',
  68: 'İstediğini istediği gibi yapmaya gücü yeten.',
  69: 'Kudret sahipleri üzerinde dilediği gibi tasarruf eden.',
  70: 'Dilediğini öne alan, öne geçiren.',
  71: 'Dilediğini geride bırakan, erteleyen.',
  72: 'Başlangıcı olmayan, her şeyden önce var olan.',
  73: 'Sonu olmayan, her şey yok olduktan sonra da var kalacak olan.',
  74: 'Varlığı ve kudreti aşikar olan, eserleriyle görünen.',
  75: 'Mahiyeti akıllardan ve duyulardan gizli olan.',
  76: 'Bütün kâinatı yöneten ve idare eden tek hakim.',
  77: 'Aklın alabileceği her şeyden pek yüce ve noksansız olan.',
  78: 'İyiliği ve ihsanı bol olan, kullarına şefkat gösteren.',
  79: 'Tevbeleri kabul eden, günahları bağışlayan.',
  80: 'Zalimlerden ve suçlulardan adaletle intikam alan.',
  81: 'Affı bol olan, günahları silip yok eden.',
  82: 'Pek merhametli, kullarına çok acıyan ve koruyan.',
  83: 'Mülkün gerçek ve ebedi tek sahibi.',
  84: 'Büyüklük, ululuk ve ikram sahibi olan.',
  85: 'Bütün işleri birbirine denk, adaletle yapan.',
  86: 'İstediği varlıkları istediği zaman ve yerde toplayan.',
  87: 'Çok zengin, hiçbir şeye ve kimseye muhtaç olmayan.',
  88: 'Dilediğini zengin kılan, müstağni kılan.',
  89: 'İstediği şeylerin gerçekleşmesine engel olan, koruyan.',
  90: 'Dilediğine zarar veren veya zarar verilmesine müsaade eden.',
  91: 'Dilediğine fayda sağlayan, yararlı şeyleri yaratan.',
  92: 'Âlemleri aydınlatan, gönüllere hidayet ışığı veren.',
  93: 'Yol gösteren, kullarına doğru yolu ilham eden.',
  94: 'Örneksiz, emsalsiz ve harika şeyler yaratan.',
  95: 'Varlığının sonu olmayan, ebedi kalan.',
  96: 'Mülkün gerçek sahibi; her şey yok olduktan sonra geriye kalan.',
  97: 'Doğru yolu gösteren, her işi isabetli olan.',
  98: 'Çok sabırlı, cezalandırmada acele etmeyen.',
  99: 'Bütün varlıkları terbiye eden, gözeten ve yetiştiren Rabbimiz.'
};

/* ================================================================
   VAKİT DUALARI HAKKINDA TÜRKÇE METİNLER
   ================================================================ */

export const VAKIT_DUA_TR = {
  imsak: [
    {
      tr: 'Allahım! Bu sabahın hayrını, zaferini, yardımını, nurunu ve bereketini senden isterim.',
      kaynak: 'Sabah Duası',
    },
    {
      tr: 'Allahım! Bedenime, kulağıma ve gözüme afiyet ver. Senden sağlık ve afiyet dilerim.',
      kaynak: 'Ebû Dâvûd, Edeb, 101',
    },
  ],
  dhuhr: [
    {
      tr: 'Allahım! Seni anmak, sana şükretmek ve sana güzelce ibadet etmek için bana yardım et.',
      kaynak: 'Ebû Dâvûd, Vitir, 26',
    },
    {
      tr: 'Rabbimiz! Bizi doğru yola ilettikten sonra kalplerimizi eğriltme. Bize katından bir rahmet bağışla.',
      kaynak: 'Âl-i İmrân, 8',
    },
  ],
  asr: [
    {
      tr: 'Ey kalpleri halden hale çeviren Allahım! Kalbimi dinin ve itaatin üzere sabit kıl.',
      kaynak: 'Tirmizî, Kader, 7',
    },
    {
      tr: 'Allahım! Fayda vermeyen ilimden, huşû duymayan kalpten ve kabul olunmayan duadan sana sığınırım.',
      kaynak: 'Müslim, Zikir, 73',
    },
  ],
  maghrib: [
    {
      tr: 'Allahım! Akşamın gelişinde ve gecenin örtüsünde günahlarımızı bağışla, bizi koru.',
      kaynak: 'Akşam Duası',
    },
    {
      tr: 'Ey Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver. Bizi cehennem azabından koru!',
      kaynak: 'Bakara, 201',
    },
  ],
  isha: [
    {
      tr: 'Allahım! Senin adınla yatar, senin adınla kalkarım. Günahlarımı bağışla ve beni koru.',
      kaynak: 'Buhârî, Deavât, 13',
    },
    {
      tr: 'Rabbimiz! Üzerimize sabır yağdır, adımlarımızı sağlamlaştır ve kafirler topluluğuna karşı bize yardım et.',
      kaynak: 'Bakara, 250',
    },
  ],
};

export function pickDuaTR(prayerId, seed = 0) {
  const pool = VAKIT_DUA_TR[prayerId] ?? VAKIT_DUA_TR.imsak;
  const idx = Math.abs(Math.floor(seed)) % pool.length;
  return pool[idx];
}

/* ================================================================
   ESMA — API numarası → Türkçe isim ve anlam

   UmmahAPI standart sıralamayı kullanır: 66 El-Vâhid, 67 El-Ehad,
   68 Es-Samed ... 99 Es-Sabûr. Yukarıdaki yerel tablolarda El-Ehad
   bulunmadığı için 67'den sonrası bir geri kayar. Bu fonksiyon
   dönüşümü tek yerde yapar.
   ================================================================ */

const ESMA_EHAD = {
  name: 'El-Ehad',
  meaning: 'Zatında ve sıfatlarında tek olan, eşi ve benzeri bulunmayan.',
};

export function getEsmaTR(number) {
  const n = Number(number);
  if (!Number.isInteger(n) || n < 1 || n > 99) return null;
  if (n === 67) return ESMA_EHAD;

  const localIndex = n > 67 ? n - 1 : n;
  const name = ESMA_TR_ISIMLER[localIndex];
  const meaning = ESMA_TR_ANLAMLAR[localIndex];
  if (!name && !meaning) return null;

  return { name: name ?? '', meaning: meaning ?? '' };
}