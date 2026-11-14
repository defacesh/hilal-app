// src/data/tesbihat.js
//
// Vakte göre tesbihat türleri.
// Her tür: kendi adımları + kendi sayaç hafızası.

export const STORAGE_PREFIX = 'nida-tesbihat-v3';
const KEY = (id) => `${STORAGE_PREFIX}:${id}`;

/* ================================================================
   ORTAK ADIM ŞABLONLARI
   ================================================================ */

const istigfarStep = {
  id: 1,
  type: 'info',
  title: 'İstiğfar ve Selam Duası',
  subtitle: 'Namazın ardından tesbihata başlarken',
  text:
    '3 defa:\n"Estağfirullahel\'azîm ve etûbu ileyh"\n\n' +
    'Ardından:\n"Allahümme entesselâmü ve minkel-selâm, ' +
    'tebarekte ya zel-celâli vel-ikrâm."',
};

const ayetelKursiStep = {
  id: 2,
  type: 'sure',
  title: 'Âyetü\'l-Kürsî',
  subtitle: 'Bakara Suresi, 255. Ayet',
  source: 'Bakara 255',
  arabic:
    'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ ' +
    'لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ ' +
    'لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ ' +
    'مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ ' +
    'يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ ' +
    'وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ ' +
    'وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ ' +
    'وَلَا يَئُودُهُ حِفْظُهُمَا ۚ ' +
    'وَهُوَ الْعَلِيُّ الْعَظِيمُ',
  latin:
    'Allâhü lâ ilâhe illâ hüve\'l-hayyü\'l-kayyûm. ' +
    'Lâ te\'huzühû sinetün velâ nevm. ' +
    'Lehû mâ fi\'s-semâvâti ve mâ fi\'l-ard. ' +
    'Men zellezî yeşfeu indehû illâ bi-iznih. ' +
    'Ya\'lemü mâ beyne eydîhim ve mâ halfehüm. ' +
    'Velâ yühîtûne bi-şey\'in min ilmihî illâ bimâ şâe. ' +
    'Vesia kürsiyyühü\'s-semâvâti ve\'l-ard. ' +
    'Velâ yeûdühû hıfzuhümâ. ' +
    'Ve hüve\'l-aliyyü\'l-azîm.',
  meaning:
    'Allah, kendisinden başka hiçbir ilah olmayandır. Diridir, her şeyin ' +
    'varlığı O\'na bağlı ve dayalıdır. O\'nu ne bir uyuklama tutar ne de ' +
    'bir uyku. Göklerdeki her şey, yerdeki her şey O\'nundur. İzni ' +
    'olmaksızın O\'nun katında şefaatte bulunacak kimdir? O, kulların ' +
    'önlerindekini ve arkalarındakini bilir. Onlar O\'nun ilminden, ' +
    'kendisinin dilediği kadarından başka bir şey kavrayamazlar. O\'nun ' +
    'kürsüsü bütün gökleri ve yeri kaplayıp kuşatmıştır. Onları koruyup ' +
    'gözetmek O\'na ağır gelmez. O, yücedir, büyüktür.',
};

const ihlasStep = {
  id: 3,
  type: 'sure',
  title: 'İhlas Suresi',
  subtitle: 'Tevhidin özü, 4 ayet',
  source: 'İhlas 1-4',
  arabic:
    'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ ' +
    'لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
  latin:
    'Kul hüvellâhü ehad. Allâhü\'s-samed. ' +
    'Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.',
  meaning:
    'De ki: O, Allah\'tır, bir tektir. Allah Samed\'dir. (Her şey O\'na ' +
    'muhtaç, O hiçbir şeye muhtaç değildir.) O\'ndan çocuk olmamıştır. ' +
    'Kendisi de doğmamıştır. Hiçbir şey O\'na denk ve benzer değildir.',
};

const felakStep = {
  id: 4,
  type: 'sure',
  title: 'Felak Suresi',
  subtitle: 'Sabah aydınlığının Rabbine sığınma, 5 ayet',
  source: 'Felak 1-5',
  arabic:
    'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ ' +
    'وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ ' +
    'وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ ' +
    'وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
  latin:
    'Kul eûzü bi-rabbi\'l-felak. Min şerri mâ halak. ' +
    'Ve min şerri gâsikın izâ vekab. ' +
    'Ve min şerri\'n-neffâsâti fi\'l-ukad. ' +
    'Ve min şerri hâsidin izâ hased.',
  meaning:
    'De ki: Sabahın Rabbine sığınırım. Yarattığı şeylerin şerrinden. ' +
    'Karanlığı çöktüğü zaman gecenin şerrinden. Düğümlere üfleyen ' +
    'büyücülerin şerrinden. Ve haset ettiği zaman hasetçinin şerrinden.',
};

const nasStep = {
  id: 5,
  type: 'sure',
  title: 'Nâs Suresi',
  subtitle: 'İnsanların Rabbine sığınma, 6 ayet',
  source: 'Nâs 1-6',
  arabic:
    'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ ' +
    'مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ ' +
    'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ ' +
    'مِنَ الْجِنَّةِ وَالنَّاسِ',
  latin:
    'Kul eûzü bi-rabbi\'n-nâs. Meliki\'n-nâs. İlâhi\'n-nâs. ' +
    'Min şerri\'l-vesvâsi\'l-hannâs. ' +
    'Ellezî yüvesvisü fî sudûri\'n-nâs. ' +
    'Mine\'l-cinneti ve\'n-nâs.',
  meaning:
    'De ki: Cinlerden ve insanlardan; insanların kalplerine vesvese ' +
    'veren sinsi vesvesecinin şerrinden, insanların Rabbine, insanların ' +
    'Melik\'ine (mutlak sahip ve hakimine), insanların İlah\'ına sığınırım.',
};

const subhanallahCounter = {
  id: 6,
  type: 'counter',
  title: 'Sübhanallah',
  subtitle: 'Yüceltme zikri',
  arabic: 'سُبْحَانَ اللّٰه',
  target: 33,
};

const elhamdulillahCounter = {
  id: 7,
  type: 'counter',
  title: 'Elhamdülillah',
  subtitle: 'Şükür zikri',
  arabic: 'اَلْحَمْدُ لِلّٰه',
  target: 33,
};

const allahuEkberCounter = {
  id: 8,
  type: 'counter',
  title: 'Allahu Ekber',
  subtitle: 'Tekbir zikri',
  arabic: 'اَللّٰهُ أَكْبَر',
  target: 33,
};

const tevhidStep = {
  id: 9,
  type: 'info',
  title: 'Tevhid Duası',
  subtitle: 'Tesbihatın tamamlanması',
  text:
    '"Lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehül-mülkü ve ' +
    'lehül-hamdü ve hüve alâ külli şey\'in kadîr."',
};

const tesbihatDuaStep = {
  id: 10,
  type: 'info',
  title: 'Tesbihat Duası',
  subtitle: 'Ellerin açılıp dua edilmesi',
  text:
    'Tüm bu zikirlerin ardından eller açılarak ümmet-i Muhammed için, ' +
    'günahların bağışlanması ve dünya-ahiret hayrı için dua edilir.',
};

/* ================================================================
   VAKİT BAZLI ZİKİR SETİ ÜRETİCİ
   ================================================================ */
const makeVakitSteps = ({ vakitName, extraZikir }) => {
  const base = [
    { ...istigfarStep, id: 1 },
    { ...ayetelKursiStep, id: 2 },
    { ...ihlasStep, id: 3 },
    { ...felakStep, id: 4 },
    { ...nasStep, id: 5 },
    { ...subhanallahCounter, id: 6 },
    { ...elhamdulillahCounter, id: 7 },
    { ...allahuEkberCounter, id: 8 },
  ];

  if (extraZikir) {
    base.push({
      id: 9,
      type: 'counter',
      title: extraZikir.title,
      subtitle: `${vakitName} zikri`,
      arabic: extraZikir.arabic,
      target: extraZikir.target,
    });
  }

  base.push(
    { ...tevhidStep, id: 10 },
    { ...tesbihatDuaStep, id: 11 },
  );

  return base;
};

/* ================================================================
   TESBİHAT TÜRLERİ
   ================================================================ */

export const TESBIHAT_TYPES = [
  /* ---------- GENEL NAMAZ TESBİHATI ---------- */
  {
    id: 'genel',
    name: 'Namaz Tesbihatı',
    shortName: 'Namaz',
    description: 'Her namazın ardından okunan genel tesbihat',
    icon: 'moon-outline',
    color: '#10B981',
    vakitIds: null, // her vakte uygun
    steps: [
      { ...istigfarStep, id: 1 },
      { ...ayetelKursiStep, id: 2 },
      { ...ihlasStep, id: 3 },
      { ...felakStep, id: 4 },
      { ...nasStep, id: 5 },
      { ...subhanallahCounter, id: 6 },
      { ...elhamdulillahCounter, id: 7 },
      { ...allahuEkberCounter, id: 8 },
      { ...tevhidStep, id: 9 },
      { ...tesbihatDuaStep, id: 10 },
    ],
  },

  /* ---------- SABAH (İMSAK / SABAH NAMAZI SONRASI) ---------- */
  {
    id: 'sabah',
    name: 'Sabah Tesbihatı',
    shortName: 'Sabah',
    description: 'Sabah namazının ardından — gün doğumuna hazırlık',
    icon: 'sunny-outline',
    color: '#F59E0B',
    vakitIds: ['imsak', 'sunrise', 'sabah'],
    steps: makeVakitSteps({
      vakitName: 'Sabah',
      extraZikir: {
        title: 'Yâ Hayyü Yâ Kayyûm',
        arabic: 'يَا حَيُّ يَا قَيُّومُ',
        target: 33,
      },
    }),
  },

  /* ---------- ÖĞLE ---------- */
  {
    id: 'ogle',
    name: 'Öğle Tesbihatı',
    shortName: 'Öğle',
    description: 'Öğle namazının ardından — gün ortası zikir',
    icon: 'partly-sunny-outline',
    color: '#3B82F6',
    vakitIds: ['dhuhr', 'ogle'],
    steps: makeVakitSteps({
      vakitName: 'Öğle',
      extraZikir: {
        title: 'Yâ Latîf',
        arabic: 'يَا لَطِيفُ',
        target: 33,
      },
    }),
  },

  /* ---------- İKİNDİ ---------- */
  {
    id: 'ikindi',
    name: 'İkindi Tesbihatı',
    shortName: 'İkindi',
    description: 'İkindi namazının ardından — ikindi zikri',
    icon: 'cloud-outline',
    color: '#8B5CF6',
    vakitIds: ['asr', 'ikindi'],
    steps: makeVakitSteps({
      vakitName: 'İkindi',
      extraZikir: {
        title: 'Yâ Gaffâr',
        arabic: 'يَا غَفَّارُ',
        target: 33,
      },
    }),
  },

  /* ---------- AKŞAM ---------- */
  {
    id: 'aksam',
    name: 'Akşam Tesbihatı',
    shortName: 'Akşam',
    description: 'Akşam namazının ardından — gün batımı zikri',
    icon: 'cloudy-outline',
    color: '#D8C17B',
    vakitIds: ['maghrib', 'aksam'],
    steps: makeVakitSteps({
      vakitName: 'Akşam',
      extraZikir: {
        title: 'Yâ Settâr',
        arabic: 'يَا سَتَّارُ',
        target: 33,
      },
    }),
  },

  /* ---------- YATSI ---------- */
  {
    id: 'yatsi',
    name: 'Yatsı Tesbihatı',
    shortName: 'Yatsı',
    description: 'Yatsı namazının ardından — gece zikri',
    icon: 'moon-outline',
    color: '#1E3A5F',
    vakitIds: ['isha', 'yatsi'],
    steps: makeVakitSteps({
      vakitName: 'Yatsı',
      extraZikir: {
        title: 'Yâ Vâhid',
        arabic: 'يَا وَاحِدُ',
        target: 33,
      },
    }),
  },

  /* ---------- UYKU ÖNCESİ ---------- */
  {
    id: 'uyku',
    name: 'Uyku Öncesi',
    shortName: 'Uyku',
    description: 'Yatmadan önce okunacak kısa sureler ve dualar',
    icon: 'bed-outline',
    color: '#6366F1',
    vakitIds: null,
    steps: [
      { ...ayetelKursiStep, id: 1 },
      { ...ihlasStep, id: 2 },
      { ...felakStep, id: 3 },
      { ...nasStep, id: 4 },
      {
        id: 5,
        type: 'info',
        title: 'Uyku Duası',
        subtitle: 'Yatmadan önce okunur',
        text:
          '"Bismikellâhümme emûtü ve ahyâ" —\n' +
          '"Allah\'ım! Senin adınla ölür (uyur) ve dirilirim (uyanırım)."\n\n' +
          'Ardından sağ tarafa yatılır, son düşünce Allah olmalıdır.',
      },
    ],
  },

  /* ---------- SABAH KALKIŞI ---------- */
  {
    id: 'sabah-kalkis',
    name: 'Sabah Kalkışı',
    shortName: 'Kalkış',
    description: 'Uyanınca okunacak şükür ve uyanış duaları',
    icon: 'sunny-outline',
    color: '#F59E0B',
    vakitIds: null,
    steps: [
      {
        id: 1,
        type: 'info',
        title: 'Uyanış Duası',
        subtitle: 'Gözü açınca okunur',
        text:
          '"Elhamdülillâhillezî ahyânâ ba\'de mâ emâtenâ ve ileyhi\'n-nüşûr."\n\n' +
          '"Bizi öldürdükten (uyuttuktan) sonra dirilten (uyandıran) Allah\'a hamd olsun. Dönüş O\'nadır."',
      },
      {
        id: 2,
        type: 'counter',
        title: 'Estağfirullah',
        subtitle: 'Günün ilk istiğfarı',
        arabic: 'أَسْتَغْفِرُ اللّٰه',
        target: 10,
      },
      {
        id: 3,
        type: 'counter',
        title: 'Elhamdülillah',
        subtitle: 'Şükür zikri',
        arabic: 'اَلْحَمْدُ لِلّٰه',
        target: 10,
      },
      {
        id: 4,
        type: 'counter',
        title: 'Allahu Ekber',
        subtitle: 'Tekbir',
        arabic: 'اَللّٰهُ أَكْبَر',
        target: 10,
      },
      {
        id: 5,
        type: 'info',
        title: 'Sabah Duası',
        subtitle: 'Günün bereketi için',
        text:
          '"Allahümme bike asbahnâ ve bike emseynâ ve bike nahyâ ve bike nemûtü ve ileyke\'n-nüşûr."\n\n' +
          '"Allah\'ım! Senin sayende sabaha erdik, Senin sayende akşama ereriz. Senin sayende yaşar, Senin sayende ölürüz. Dönüş Sanadır."',
      },
    ],
  },
];

/* ================================================================
   YARDIMCILAR
   ================================================================ */

export const getTesbihatTypeById = (id) =>
  TESBIHAT_TYPES.find((t) => t.id === id) ?? TESBIHAT_TYPES[0];

export const getStorageKey = (typeId) => KEY(typeId);

export const getRecitationOrder = (typeId) => {
  const type = getTesbihatTypeById(typeId);
  return type.steps.map((s, i) => ({
    idx: i,
    id: s.id,
    title: s.title,
    type: s.type,
    short:
      s.type === 'counter'
        ? `${s.target} defa`
        : s.type === 'sure'
          ? s.source || 'Sure'
          : 'Dua / Zikir',
  }));
};

export const getTotalZikirCount = (typeId) => {
  const type = getTesbihatTypeById(typeId);
  return type.steps
    .filter((s) => s.type === 'counter')
    .reduce((sum, s) => sum + (s.target || 0), 0);
};

/**
 * O anki vakte göre önerilen tesbihat türünü bul.
 * - Saate göre imsak / sabah / öğle / ikindi / akşam / yatsı aralığı belirler
 * - İlgili türü döndürür
 */
export const getRecommendedTypeId = (date = new Date()) => {
  const h = date.getHours();
  if (h >= 4 && h < 7) return 'sabah';       // imsak/sabah
  if (h >= 7 && h < 12) return 'genel';      // gündüz
  if (h >= 12 && h < 15) return 'ogle';      // öğle
  if (h >= 15 && h < 18) return 'ikindi';    // ikindi
  if (h >= 18 && h < 20) return 'aksam';     // akşam
  return 'yatsi';                             // yatsı / gece
};