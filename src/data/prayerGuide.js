// src/data/prayerGuide.js
//
// Namaz Rehberi — kapsamlı içerik.
// Tüm metinsel içerik burada; ekran sadece render eder.

/* ================================================================
   SEKMELER
   ================================================================ */
export const SECTIONS = [
  { id: 'bilgi',     title: 'Genel Bilgi', icon: 'information-circle-outline' },
  { id: 'abdest',    title: 'Abdest',      icon: 'water-outline' },
  { id: 'kilinis',   title: 'Kılınış',     icon: 'footsteps-outline' },
  { id: 'namazlar',  title: 'Çeşitler',    icon: 'list-outline' },
  { id: 'bozanlar',  title: 'Bozanlar',    icon: 'alert-circle-outline' },
];

/* ================================================================
   GENEL BİLGİ KARTLARI
   ================================================================ */
export const GENERAL_INFO = [
  {
    id: 'nedir',
    title: 'Namaz Nedir?',
    icon: 'help-circle-outline',
    body:
      'Namaz, sözlükte "dua etmek, ibadet etmek, yüceltmek" manasına gelir. ' +
      'Dini terim olarak ise tekbirle başlayıp selamla biten, belirli hareketleri ' +
      've duaları içeren en temel bedenî ibadettir. İslam\'ın beş şartından biridir.',
  },
  {
    id: 'farz',
    title: 'Kime Farzdır?',
    icon: 'person-outline',
    body:
      'Namaz kılmak; Müslüman, akıl sağlığı yerinde ve ergenlik çağına (bülûğ) ' +
      'gelmiş olan her erkek ve kadına farz-ı ayn\'dır. Çocuklara 7 yaşından ' +
      'itibaren namaz alışkanlığı kazandırılması, 10 yaşında ise namaz kılmaları ' +
      'konusunda teşvik edilmesi emredilmiştir.',
  },
  {
    id: 'sartlar',
    title: 'Namazın Dışındaki 6 Şart',
    icon: 'checkmark-done-outline',
    body: 'Namazın geçerli olabilmesi için şu 6 şart yerine getirilmelidir:',
    bullets: [
      { label: 'Hadesten Taharet', desc: 'Abdest almak, gerekirse gusletmek.' },
      { label: 'Necasetten Taharet', desc: 'Bedenin, elbisenin ve yerin temiz olması.' },
      { label: 'Setr-i Avret', desc: 'Erkeğin göbek ile diz kapağı arası; kadının yüz, el ve ayaklar hariç tüm bedenini örtmesi.' },
      { label: 'İstikbal-i Kıble', desc: 'Kâbe yönüne (kıbleye) yönelmek.' },
      { label: 'Vakit', desc: 'Namazın kendi vaktinin girmesi.' },
      { label: 'Niyet', desc: 'Kılınacak namaz için kalben niyet etmek.' },
    ],
  },
  {
    id: 'rukunler',
    title: 'Namazın İçindeki 6 Rükün',
    icon: 'layers-outline',
    body: 'Namazın içinde yerine getirilmesi gereken rükünler:',
    bullets: [
      { label: 'İftitah Tekbiri', desc: '"Allahu Ekber" diyerek namaza başlamak.' },
      { label: 'Kıyam', desc: 'Farz namazlarda ayakta durmak.' },
      { label: 'Kıraat', desc: 'Kur\'an\'dan bir miktar okumak (Fatiha + zammı sure).' },
      { label: 'Rükû', desc: 'Eğilip elleri dizlere koyarak "Sübhane Rabbiye\'l-Azim" demek.' },
      { label: 'Secde', desc: 'Alın, burun, avuç içi, dizler ve ayak parmakları yere değecek şekilde secdeye varmak.' },
      { label: 'Kade-i Ahire', desc: 'Son oturuşta "Et-Tahiyyat" okuyacak kadar oturmak.' },
    ],
  },
];

/* ================================================================
   ABDEST ADIMLARI
   ================================================================ */
export const WUDU_STEPS = [
  { step: 1,  title: 'Niyet ve Besmele',         desc: 'Abdest almaya niyet edilir ve "Bismillâhirrahmânirrahîm" denir.' },
  { step: 2,  title: 'Elleri Yıkamak',            desc: 'Bileklere kadar elleri 3 kere yıkamak.' },
  { step: 3,  title: 'Ağza Su Vermek',            desc: 'Ağza 3 kere su alıp çalkalamak (oruçlu değilse gargara yapılır).' },
  { step: 4,  title: 'Burna Su Vermek',           desc: 'Burna 3 kere su çekip temizlemek.' },
  { step: 5,  title: 'Yüzü Yıkamak',              desc: 'Alın saç bitiminden çene altına, iki kulak yumuşağı arasına kadar 3 kere yıkamak.' },
  { step: 6,  title: 'Kolları Yıkamak',           desc: 'Sağ kol dirseklerle birlikte 3 kere, sonra sol kol aynı şekilde yıkanır.' },
  { step: 7,  title: 'Başı Meshetmek',            desc: 'Elleri ıslatıp alın ön kısmından başın arkasına doğru bir kere geçirmek.' },
  { step: 8,  title: 'Kulakları Meshetmek',       desc: 'İşaret parmaklarıyla kulak içlerini, başparmaklarla kulak arkalarını meshetmek.' },
  { step: 9,  title: 'Ayakları Yıkamak',          desc: 'Sağ ayak topuklarla birlikte 3 kere, sonra sol ayak aynı şekilde yıkanır.' },
  { step: 10, title: 'Kelime-i Şehadet Okumak',   desc: '"Eşhedü en lâ ilâhe illallah ve eşhedü enne Muhammeden abdühû ve rasûlüh" duası okunur.' },
];

/* ================================================================
   KILINIŞ — Adım Adım Namaz
   ================================================================ */
export const PRAYER_STEPS = [
  { step: 1,  title: 'Niyet',              desc: 'Kılınacak namaz için kalpten niyet edilir. "Niyet ettim Allah rızası için ... namazını kılmaya" denilebilir.' },
  { step: 2,  title: 'İftitah Tekbiri',    desc: 'Eller kulak hizasına kaldırılır, "Allahu Ekber" denir ve eller bağlanır. Namaz başlamış olur; bu andan itibaren konuşmak, yemek, dünyevî işle meşgul olmak namazı bozar.' },
  { step: 3,  title: 'Sübhaneke',          desc: 'Bağlanmış ellerle "Sübhânekellâhümme ve bihamdik..." duası okunur.' },
  { step: 4,  title: 'Kıraat',             desc: 'Euzü-besmele çekilir. Fatiha suresi okunur, ardından bir zammı sure (Kevser, İhlas gibi) eklenir.' },
  { step: 5,  title: 'Rükû',               desc: '"Allahu Ekber" denip eğilinir. Eller dizlere konur, sırt düz tutulur. 3 kere "Sübhâne Rabbiye\'l-Azîm" denir.' },
  { step: 6,  title: 'Secde',              desc: '"Semi\'allahu limen hamideh, Rabbenâ leke\'l-hamd" denilerek doğrulunur. "Allahu Ekber" ile secdeye varılır. Alın, burun, avuç içi, dizler ve ayak parmakları yere değmelidir. 3 kere "Sübhâne Rabbiye\'l-A\'lâ" denir.' },
  { step: 7,  title: 'İki Secde Arası',    desc: '"Allahu Ekber" ile oturulur. Kısa bir süre "Rabbi\'ğfir lî" denir. Ardından tekrar secdeye varılır.' },
  { step: 8,  title: 'İkinci Rekât',       desc: 'Ayağa kalkılır, besmele, Fatiha ve zammı sure okunur. Rükû ve iki secde yapılır.' },
  { step: 9,  title: 'Kade-i Ahire',       desc: 'Son oturuşta "Et-Tahiyyâtü", "Salli-Bârik" ve "Rabbenâ âtinâ" duaları okunur.' },
  { step: 10, title: 'Selam',              desc: 'Baş sağa ve sola çevrilerek "Es-Selâmü aleyküm ve rahmetullah" denir. Namaz tamamlanır.' },
  { step: 11, title: 'Dua',                desc: 'Namazdan sonra eller açılıp dua edilir, salavat getirilir, istiğfar yapılır. "Allahümme ente\'s-selâmü ve minke\'s-selâm" duası okunur.' },
];

/* ================================================================
   NAMAZ ÇEŞİTLERİ
   ================================================================ */
export const PRAYER_CATEGORIES = [
  {
    title: 'Farz Namazlar',
    description: 'Allah\'ın kesin olarak emrettiği, kılınması zorunlu 5 vakit namaz.',
    items: [
      {
        id: 'sabah',
        name: 'Sabah Namazı',
        rakats: '2 Sünnet + 2 Farz = 4 Rekât',
        details: 'Önce 2 rekat sünnet kılınır (sabah sünneti müekked sünnettir). Ardından ikamet getirilerek 2 rekat farz kılınır.',
        duas: 'Sübhaneke, Fatiha, zammı sure, Et-Tahiyyâtü, Salli-Bârik ve Rabbenâ duaları okunur.',
        vakit: 'İmsaktan (fecre) güneşin doğuşuna kadar.',
      },
      {
        id: 'ogle',
        name: 'Öğle Namazı',
        rakats: '4 İlk Sünnet + 4 Farz + 2 Son Sünnet = 10 Rekât',
        details: 'İlk 4 rekat sünnet kılınır. Ardından 4 rekat farz, son olarak da 2 rekat son sünnet kılınır.',
        duas: 'Her rekatta Fatiha ve zammı sure; oturuşlarda Tahiyyât, Salli-Bârik ve Rabbenâ duaları okunur.',
        vakit: 'Zeval vakti geçtikten sonra ikindi vaktine kadar.',
      },
      {
        id: 'ikindi',
        name: 'İkindi Namazı',
        rakats: '4 Sünnet + 4 Farz = 8 Rekât',
        details: 'Önce 4 rekat sünnet (gayri müekkede), ardından 4 rekat farz kılınır.',
        duas: 'Fatiha ve zammı sureler ile oturuş duaları okunur.',
        vakit: 'Öğle namazından sonra akşam vaktine kadar.',
      },
      {
        id: 'aksam',
        name: 'Akşam Namazı',
        rakats: '3 Farz + 2 Sünnet = 5 Rekât',
        details: 'Önce 3 rekat farz kılınır (farz biter bitmez sünnete geçilir). Ardından 2 rekat sünnet kılınır.',
        duas: 'Farzın ilk iki rekatından sonra oturuş yapılmaz, 3. rekatta oturulup Tahiyyât okunur.',
        vakit: 'Güneş battıktan sonra şafağın kaybolmasına (yatsı vaktine) kadar.',
      },
      {
        id: 'yatsi',
        name: 'Yatsı Namazı',
        rakats: '4 İlk Sünnet + 4 Farz + 2 Son Sünnet + 3 Vitir = 13 Rekât',
        details: 'Sırasıyla 4 rekat sünnet, 4 rekat farz, 2 rekat son sünnet ve vacip olan 3 rekat Vitir namazı kılınır.',
        duas: 'Vitir namazının 3. rekatında rükûdan önce Kunut duaları okunur.',
        vakit: 'Şafak kaybolduktan sonra imsak vaktine kadar.',
      },
      {
        id: 'cuma',
        name: 'Cuma Namazı',
        rakats: '4 İlk Sünnet + 2 Farz + 4 Son Sünnet = 10 Rekât',
        details: 'Cuma günü öğle vakti, hutbe ile birlikte cemaatle kılınır. Öğle namazı yerine geçer.',
        duas: 'Hutbe dinlendikten sonra cemaatle 2 rekat farz kılınır. Öncesinde ve sonrasında sünnetler kılınır.',
        vakit: 'Cuma günü öğle vakti.',
      },
    ],
  },
  {
    title: 'Nafile Namazlar',
    description: 'Farz ve vacip dışında, sevap kazanmak için kılınan gönüllü namazlar.',
    items: [
      {
        id: 'teheccud',
        name: 'Teheccüd Namazı',
        rakats: '2 ile 8 Rekât Arası',
        details: 'Gece uykusundan uyandıktan sonra kılınan nafile namazdır. En faziletli nafile ibadetlerdendir.',
        duas: 'İkişer rekatlar hâlinde kılınması tavsiye edilir.',
        vakit: 'Gece yarısından imsak vaktine kadar.',
      },
      {
        id: 'duha',
        name: 'Duha (Kuşluk) Namazı',
        rakats: '2, 4 veya 8 Rekât',
        details: 'Güneş doğup yükseldikten (işrak vakti geçtikten) zeval vaktine kadar kılınır.',
        duas: 'Gündüz kılınan faziletli nafile namazlardandır.',
        vakit: 'Güneş doğduktan yaklaşık 45 dk sonra, öğle vaktine kadar.',
      },
      {
        id: 'istihare',
        name: 'İstihare Namazı',
        rakats: '2 Rekât',
        details: 'Bir işin hayırlı olup olmadığını anlamak için kılınan nafile namaz. Ardından istihare duası yapılır.',
        duas: 'Namazdan sonra Peygamberimiz\'in öğrettiği istihare duası okunur.',
        vakit: 'Herhangi bir vakit (kerahet vakitleri hariç).',
      },
      {
        id: 'hacet',
        name: 'Hacet Namazı',
        rakats: '2 veya 4 Rekât',
        details: 'Meşru bir dileği veya ihtiyacı olan kişinin Allah\'a yakınlaşmak ve yardım istemek için kıldığı namaz.',
        duas: 'Namazdan sonra özel hacet duası yapılır.',
        vakit: 'Kerahet vakitleri dışında her vakit.',
      },
      {
        id: 'tesbih',
        name: 'Tesbih Namazı',
        rakats: '4 Rekât',
        details: 'Her rekatta 75 kere "Sübhânallâhi ve\'l-hamdü lillâhi ve lâ ilâhe illallâhü vallâhü ekber" okunan özel nafile namaz.',
        duas: 'Belirli aralıklarla tesbih duası tekrarlanır.',
        vakit: 'Kerahet vakitleri dışında her vakit.',
      },
      {
        id: 'evvabin',
        name: 'Evvâbîn Namazı',
        rakats: '6 Rekât',
        details: 'Akşam namazından sonra kılınan nafile namaz. "Tevbe edenlerin namazı" anlamına gelir.',
        duas: 'İkişer veya üçer rekat hâlinde kılınır.',
        vakit: 'Akşam namazından sonra, yatsı vaktine kadar.',
      },
    ],
  },
  {
    title: 'Vacip ve Özel Namazlar',
    description: 'Vacip olan veya özel durumlarda kılınan namazlar.',
    items: [
      {
        id: 'vitir',
        name: 'Vitir Namazı',
        rakats: '3 Rekât (Vacip)',
        details: 'Yatsı namazından sonra kılınan 3 rekatlık vacip namaz. 3. rekatta rükûdan önce Kunut duaları okunur.',
        duas: 'Kunut duaları (Allahümme innâ neste\'înüke...).',
        vakit: 'Yatsı namazından sonra, imsak vaktine kadar.',
      },
      {
        id: 'bayram',
        name: 'Bayram Namazı',
        rakats: '2 Rekât (Vacip)',
        details: 'Ramazan ve Kurban Bayramı\'nın ilk günü, cemaatle kılınan 2 rekatlık vacip namaz. Hutbe ile birlikte kılınır.',
        duas: 'İlk rekatta 7, ikinci rekatta 5 tekbir alınır.',
        vakit: 'Bayram günü güneş doğup yükseldikten sonra.',
      },
      {
        id: 'cenaze',
        name: 'Cenaze Namazı',
        rakats: 'Rükû ve secdesi yok',
        details: 'Vefat eden Müslüman için cemaatle kılınan farz-ı kifâye namaz. Ayakta 4 tekbirle kılınır.',
        duas: 'Her tekbirden sonra Sübhaneke, salavat ve cenaze duası okunur.',
        vakit: 'Vefat sonrası, definden önce.',
      },
    ],
  },
];

/* ================================================================
   NAMAZI BOZAN HALLER
   ================================================================ */
export const BREAKING_REASONS = [
  { title: 'Konuşmak', desc: 'Bilerek veya bilmeyerek bir kelime bile söylemek namazı bozar.' },
  { title: 'Yemek / İçmek', desc: 'Namaz içinde yemek veya içmek.' },
  { title: 'Sesli Gülmek', desc: 'Yanındakilerin duyacağı şekilde gülmek hem namazı hem abdesti bozar. Tebessüm bozmaz.' },
  { title: 'Göğsü Kıbleden Çevirmek', desc: 'Göğsün kıble yönünden başka tarafa döndürülmesi.' },
  { title: 'Abdestin Bozulması', desc: 'Namaz içinde abdesti bozan bir hâl meydana gelmesi.' },
  { title: 'Avret Yerinin Açılması', desc: 'Örtülmesi gereken yerin açılması ve hemen örtülmemesi.' },
  { title: 'Yabancı İş / Çok Hareket', desc: 'Namaza yabancı bir iş yapmak veya ard arda çok hareket etmek.' },
  { title: 'Suyu Görmek (Teyemmüm)', desc: 'Teyemmüm edenin namaz kılarken suyu görmesi.' },
  { title: 'Güneşin Doğması / Batması', desc: 'Sabah namazında güneşin doğması, ikindi namazında güneşin batması.' },
];