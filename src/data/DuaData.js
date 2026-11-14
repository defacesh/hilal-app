// src/data/DuaData.js

/* ================================================================
   DUA KATEGORİLERİ
   ----------------------------------------------------------------
   Rehber ekranında chip filtre olarak kullanılır.
   id → DUA_VERILERI içindeki category alanıyla eşleşir
   ================================================================ */
export const DUA_KATEGORILERI = [
  { id: 'gunluk',       name: 'Günlük Dualar',    icon: 'sunny-outline',            color: '#F59E0B', desc: 'Her gün okunan temel dualar' },
  { id: 'sabah',        name: 'Sabah Duaları',    icon: 'partly-sunny-outline',     color: '#F97316', desc: 'Güne başlarken okunanlar' },
  { id: 'aksam',        name: 'Akşam Duaları',    icon: 'moon-outline',             color: '#6366F1', desc: 'Akşam ve gece için dualar' },
  { id: 'namaz',        name: 'Namaz Duaları',    icon: 'business-outline',         color: '#10B981', desc: 'Namaz içinde ve sonrasında' },
  { id: 'yemek',        name: 'Yemek Duaları',    icon: 'restaurant-outline',       color: '#EF4444', desc: 'Yemek öncesi ve sonrası' },
  { id: 'uyku',         name: 'Uyku Duaları',     icon: 'bed-outline',              color: '#8B5CF6', desc: 'Yatmadan ve uyanınca' },
  { id: 'yolculuk',     name: 'Yolculuk Duaları', icon: 'airplane-outline',         color: '#06B6D4', desc: 'Yola çıkarken ve dönerken' },
  { id: 'koruma',       name: 'Koruma Duaları',   icon: 'shield-checkmark-outline', color: '#0EA5E9', desc: 'Nazardan ve kötülükten' },
  { id: 'saglik',       name: 'Sağlık Duaları',   icon: 'medkit-outline',           color: '#EC4899', desc: 'Hastalık ve şifa için' },
  { id: 'sikinti',      name: 'Sıkıntı Duaları',  icon: 'thunderstorm-outline',     color: '#F43F5E', desc: 'Keder, borç, korku için' },
  { id: 'istigfar',     name: 'İstiğfar',         icon: 'refresh-outline',          color: '#14B8A6', desc: 'Tövbe ve bağışlanma' },
  { id: 'salavat',      name: 'Salavatlar',       icon: 'star-outline',             color: '#F59E0B', desc: 'Peygamberimize salât-u selam' },
  { id: 'hayir',        name: 'Hayır Duaları',    icon: 'sparkles-outline',         color: '#8B5CF6', desc: 'Hayırlısını isteme, hidayet' },
  { id: 'aile',         name: 'Aile Duaları',     icon: 'people-outline',           color: '#EC4899', desc: 'Anne-baba, çocuk ve eş' },
  { id: 'ilim',         name: 'İlim Duaları',     icon: 'school-outline',           color: '#6366F1', desc: 'Ders, sınav ve öğrenme' },
  { id: 'rizik',        name: 'Rızık Duaları',    icon: 'briefcase-outline',        color: '#10B981', desc: 'Bereket ve helal kazanç' },
  { id: 'ozel_gunler',  name: 'Özel Günler',      icon: 'calendar-outline',         color: '#F59E0B', desc: 'Ramazan, bayram, cuma' },
  { id: 'kuran',        name: "Kur'an Duaları",   icon: 'book-outline',             color: '#10B981', desc: "Kur'an-ı Kerim'den dualar" },
  { id: 'hadis',        name: 'Hadis Duaları',    icon: 'chatbubble-outline',       color: '#8B5CF6', desc: 'Peygamberimizin öğrettiği dualar' },
];

/* ================================================================
   DUA LİSTESİ — 73 Dua
   ----------------------------------------------------------------
   ⚠️ NOT: Arapça metinler yaygın olarak kabul görmüş
   transkripsiyonlarla verilmiştir. Mezhep farklılıkları ve
   detaylar için muteber ilmihal kaynaklarına başvurunuz.
   ================================================================ */
export const DUA_VERILERI = [

  /* ═══════════════════════════════════════════════════════════
     GÜNLÜK DUALAR (Mevcut 5 + 3 Yeni)
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-1',
    category: 'gunluk',
    title: 'Sabah Duası',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    transliteration: 'Esbahna ve esbahal mülkü lillah.',
    meaning: "Sabaha erdik ve mülk Allah'a ait olarak sabahladı.",
    source: 'Hadis-i Şerif',
    virtue: 'Sabah uyanınca okunması sünnettir.',
  },
  {
    id: 'dua-2',
    category: 'gunluk',
    title: 'Akşam Duası',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    transliteration: 'Emseyna ve emsel mülkü lillah.',
    meaning: "Akşama erdik ve mülk Allah'a ait olarak akşamladı.",
    source: 'Hadis-i Şerif',
    virtue: 'Akşam vakti okunması sünnettir.',
  },
  {
    id: 'dua-3',
    category: 'gunluk',
    title: 'Rabbena Atina',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbena âtina fid'dunyâ haseneten ve fil'âhirati haseneten ve kınâ azâben'nâr.",
    meaning: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.',
    source: 'Bakara Suresi, 201',
    virtue: "Peygamberimizin en çok yaptığı dualardan biridir.",
  },
  {
    id: 'dua-4',
    category: 'gunluk',
    title: 'İstiğfar Duası (Seyyidül İstiğfar)',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: 'Allahümme ente rabbi la ilahe illa ente...',
    meaning: "Allah'ım! Sen benim Rabbimsin. Senden başka ilah yoktur.",
    source: 'Buhari',
    virtue: 'Sabah-akşam okuyanın günahları affolunur.',
  },
  {
    id: 'dua-5',
    category: 'gunluk',
    title: 'Sıkıntı Anı Duası',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilahe illa ente subhaneke inni küntü minezzalimin.',
    meaning: 'Senden başka ilah yoktur. Seni tenzih ederim. Şüphesiz ben zalimlerden oldum.',
    source: 'Enbiya Suresi, 87',
    virtue: 'Yunus Peygamberin duası. Sıkıntıdan kurtuluş vesilesi.',
  },
  {
    id: 'dua-6',
    category: 'gunluk',
    title: 'Lâ Havle Velâ Kuvvete İllâ Billâh',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Lâ havle velâ kuvvete illâ billâh.',
    meaning: "Güç ve kuvvet ancak Allah'ın yardımıyladır.",
    source: 'Buhari, Müslim',
    virtue: "Cennet hazinelerinden bir hazinedir. Sıkıntı anında okunur.",
  },
  {
    id: 'dua-7',
    category: 'gunluk',
    title: 'Besmele',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Bismillâhirrahmânirrahîm.',
    meaning: "Rahman ve Rahim olan Allah'ın adıyla.",
    source: "Kur'an-ı Kerim",
    virtue: 'Her hayırlı işe besmele ile başlanmalıdır.',
  },
  {
    id: 'dua-8',
    category: 'gunluk',
    title: 'Tehlil (Lâ İlâhe İllallah)',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'Lâ ilâhe illallâhu vahdehû lâ şerîke leh, lehül mülkü ve lehül hamdü ve hüve alâ külli şey\'in kadîr.',
    meaning: "Allah'tan başka ilah yoktur. O birdir, ortağı yoktur. Mülk O'nundur, hamd O'nadır. O her şeye kadirdir.",
    source: 'Buhari, Müslim',
    virtue: 'Günde 100 defa okuyanın 100 sevabı yazılır.',
  },

  /* ═══════════════════════════════════════════════════════════
     SABAH DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-9',
    category: 'sabah',
    title: 'Uyanınca Okunacak Dua',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: "Elhamdülillâhillezî ahyânâ ba'de mâ emâtenâ ve ileyhin nüşûr.",
    meaning: "Bizi öldürdükten (uyuttuktan) sonra dirilten (uyandıran) Allah'a hamd olsun. Dönüş de O'nadır.",
    source: 'Buhari, Müslim',
    virtue: 'Uyanır uyanmaz okunması sünnettir.',
  },
  {
    id: 'dua-10',
    category: 'sabah',
    title: 'Elbise Giyerken',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: "Elhamdülillâhillezî kesânî hâzâ ve razakanîhi min gayri havlin minnî ve lâ kuvveh.",
    meaning: "Bana bunu giydiren ve güç kuvvet sarf etmeden rızık olarak veren Allah'a hamd olsun.",
    source: 'Tirmizî, Ebû Dâvûd',
    virtue: 'Elbise giyerken okunur.',
  },
  {
    id: 'dua-11',
    category: 'sabah',
    title: 'Evden Çıkarken',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: "Bismillâhi tevekkeltü alallâh, lâ havle ve lâ kuvvete illâ billâh.",
    meaning: "Allah'ın adıyla (çıkıyorum). Allah'a tevekkül ettim. Güç ve kuvvet ancak Allah'ın yardımıyladır.",
    source: 'Tirmizî, Ebû Dâvûd',
    virtue: 'Evden çıkarken okuyana melekler refakat eder.',
  },

  /* ═══════════════════════════════════════════════════════════
     AKŞAM DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-12',
    category: 'aksam',
    title: 'Eve Girerken',
    arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    transliteration: "Bismillâhi velecnâ, ve bismillâhi harecnâ, ve alâ rabbinâ tevekkelnâ.",
    meaning: "Allah'ın adıyla girdik, Allah'ın adıyla çıktık. Rabbimize tevekkül ettik.",
    source: 'Ebû Dâvûd',
    virtue: 'Eve girerken okunur, şeytan eve girmez.',
  },
  {
    id: 'dua-13',
    category: 'aksam',
    title: 'Akşam Zikri',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "Eûzü bi kelimâtillâhit tâmmeti min şerri mâ halak.",
    meaning: "Yarattıklarının şerrinden Allah'ın eksiksiz kelimelerine sığınırım.",
    source: 'Müslim',
    virtue: 'Akşam 3 defa okunur, o gece zarar görmez.',
  },
  {
    id: 'dua-14',
    category: 'aksam',
    title: 'Günah İşleyince',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    transliteration: "Estağfirullâhellezî lâ ilâhe illâ hüvel hayyel kayyûme ve etûbü ileyh.",
    meaning: "Kendisinden başka ilah olmayan, diri ve her şeyi ayakta tutan Allah'tan bağışlanma diler ve O'na tövbe ederim.",
    source: 'Tirmizî',
    virtue: 'Günah işleyince hemen okunur; tövbe yerine geçer.',
  },

  /* ═══════════════════════════════════════════════════════════
     NAMAZ DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-15',
    category: 'namaz',
    title: 'Sübhaneke Duası',
    arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
    transliteration: "Sübhânekellâhümme ve bi hamdik, ve tebârakesmük, ve teâlâ cedduk, ve lâ ilâhe gayruk.",
    meaning: "Allah'ım! Seni her türlü noksanlıktan tenzih ederim, sana hamd ederim. İsmin mübarektir, şanın yücedir. Senden başka ilah yoktur.",
    source: 'Ebû Dâvûd, Tirmizî',
    virtue: 'Namazın başında (iftitah tekbirinden sonra) okunur.',
  },
  {
    id: 'dua-16',
    category: 'namaz',
    title: 'Tahiyyat Duası',
    arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ',
    transliteration: "Ettehıyyâtü lillâhi ve\'s-salavâtü ve\'t-tayyibât. Esselâmü aleyke eyyühe\'n-nebiyyü ve rahmetullâhi ve berekâtüh...",
    meaning: "Her türlü dua, ibadet ve güzel sözler Allah içindir. Ey Peygamber! Sana selam olsun, Allah'ın rahmeti ve bereketleri üzerine olsun...",
    source: 'Buhari, Müslim',
    virtue: 'Namazın son oturuşunda (ka\'de-i âhire) okunur.',
  },
  {
    id: 'dua-17',
    category: 'namaz',
    title: 'Salli Duası',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: "Allâhümme salli alâ Muhammedin ve alâ âli Muhammed, kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd.",
    meaning: "Allah'ım! Muhammed'e ve ailesine rahmet et, İbrahim'e ve ailesine rahmet ettiğin gibi. Şüphesiz sen övgüye layıksın, şan ve şeref sahibisin.",
    source: 'Buhari, Müslim',
    virtue: 'Tahiyyattan sonra okunur.',
  },
  {
    id: 'dua-18',
    category: 'namaz',
    title: 'Bârik Duası',
    arabic: 'اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: "Allâhümme bârik alâ Muhammedin ve alâ âli Muhammed, kemâ bârekte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd.",
    meaning: "Allah'ım! Muhammed'e ve ailesine bereket ver, İbrahim'e ve ailesine bereket verdiğin gibi. Şüphesiz sen övgüye layıksın, şan ve şeref sahibisin.",
    source: 'Buhari, Müslim',
    virtue: 'Salli duasından hemen sonra okunur.',
  },
  {
    id: 'dua-19',
    category: 'namaz',
    title: 'Kunut Duası 1',
    arabic: 'اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ',
    transliteration: "Allâhümme innâ nesteînüke ve nestagfiruke ve nü'minü bike ve netevekkelü aleyke ve nüsnî aleykel hayra külleh...",
    meaning: "Allah'ım! Senden yardım dileriz, bağışlanma dileriz, sana inanırız, sana tevekkül ederiz, her hayrı sana nispet ederiz...",
    source: 'Beyhakî',
    virtue: 'Vitir namazının üçüncü rekâtında Kunut\'ta okunur.',
  },
  {
    id: 'dua-20',
    category: 'namaz',
    title: 'Kunut Duası 2',
    arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ',
    transliteration: "Allâhümmehdini fîmen hedeyt, ve âfinî fîmen âfeyt, ve tevellenî fîmen tevelleyt...",
    meaning: "Allah'ım! Hidayet verdiklerin arasında bana da hidayet ver, afiyet verdiklerin arasında bana da afiyet ver, dost edindiklerin arasında beni de dost edin...",
    source: 'Tirmizî, Ebû Dâvûd',
    virtue: 'Sabah namazı Kunut duası olarak da okunur.',
  },
  {
    id: 'dua-21',
    category: 'namaz',
    title: 'Rabbenağfirlî',
    arabic: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    transliteration: "Rabbenagfir lî ve li vâlideyye ve lil mü'minîne yevme yekûmül hisâb.",
    meaning: "Rabbimiz! Hesabın görüleceği gün beni, anne-babamı ve müminleri bağışla.",
    source: 'İbrahim Suresi, 41',
    virtue: 'Namaz sonunda okunması sünnettir.',
  },
  {
    id: 'dua-22',
    category: 'namaz',
    title: 'Namaz Sonrası Tesbihat',
    arabic: 'سُبْحَانَ اللَّهِ (٣٣) الْحَمْدُ لِلَّهِ (٣٣) اللَّهُ أَكْبَرُ (٣٣)',
    transliteration: 'Sübhânallâh (33), Elhamdülillâh (33), Allâhü Ekber (33).',
    meaning: "Allah'ı tenzih ederim (33), hamd Allah'a mahsustur (33), Allah en büyüktür (33).",
    source: 'Müslim',
    virtue: "Namazdan sonra 33'er defa okunur, günahlar affolunur.",
  },

  /* ═══════════════════════════════════════════════════════════
     YEMEK DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-23',
    category: 'yemek',
    title: 'Yemekten Önce',
    arabic: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ',
    transliteration: 'Bismillâhi ve alâ bereketillâh.',
    meaning: "Allah'ın adıyla ve Allah'ın bereketiyle (başlıyorum).",
    source: 'İbn Mâce',
    virtue: 'Yemeğe başlarken okunur.',
  },
  {
    id: 'dua-24',
    category: 'yemek',
    title: 'Yemekten Sonra',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ',
    transliteration: "Elhamdülillâhillezî et'amenâ ve sekânâ ve ce'alenâ minel müslimîn.",
    meaning: "Bizi yediren, içiren ve Müslümanlardan kılan Allah'a hamd olsun.",
    source: 'Tirmizî, Ebû Dâvûd',
    virtue: 'Yemekten sonra okunur.',
  },
  {
    id: 'dua-25',
    category: 'yemek',
    title: 'Sofra Duası',
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Allâhümme bârik lenâ fîmâ razaktenâ ve kınâ azâben nâr.",
    meaning: "Allah'ım! Bize rızık olarak verdiğin şeylerde bereket ver ve bizi ateş azabından koru.",
    source: 'İbn Sünnî',
    virtue: 'Sofra başında okunur.',
  },
  {
    id: 'dua-26',
    category: 'yemek',
    title: 'Su İçerken',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Bismillâhirrahmânirrahîm.',
    meaning: "Rahman ve Rahim olan Allah'ın adıyla.",
    source: 'Hadis-i Şerif',
    virtue: 'Su içmeden önce okunur. Oturarak ve üç yudumda içmek sünnettir.',
  },

  /* ═══════════════════════════════════════════════════════════
     UYKU DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-27',
    category: 'uyku',
    title: 'Yatmadan Önce',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: "Bismikellâhümme emûtü ve ahyâ.",
    meaning: "Allah'ım! Senin adınla ölür (uyur) ve dirilirim (uyanırım).",
    source: 'Buhari',
    virtue: 'Yatağa girerken okunur.',
  },
  {
    id: 'dua-28',
    category: 'uyku',
    title: 'Uykudan Uyanınca',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: "Elhamdülillâhillezî ahyânâ ba'de mâ emâtenâ ve ileyhin nüşûr.",
    meaning: "Bizi öldürdükten (uyuttuktan) sonra dirilten (uyandıran) Allah'a hamd olsun. Dönüş de O'nadır.",
    source: 'Buhari, Müslim',
    virtue: 'Uyanır uyanmaz okunması sünnettir.',
  },
  {
    id: 'dua-29',
    category: 'uyku',
    title: 'Kabus Görünce',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَمِنْ شَرِّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ',
    transliteration: "Eûzü bi kelimâtillâhit tâmmeti min gadabihî ve ikâbih, ve min şerri ibâdih, ve min hemezâtiş şeyâtîni ve en yahdurûn.",
    meaning: "Allah'ın gazabından, azabından, kullarının şerrinden, şeytanların vesvesesinden ve benimle beraber bulunmalarından Allah'ın eksiksiz kelimelerine sığınırım.",
    source: 'Ebû Dâvûd, Tirmizî',
    virtue: 'Kabus görünce veya korkunca okunur.',
  },
  {
    id: 'dua-30',
    category: 'uyku',
    title: 'Yatağa Girerken',
    arabic: 'بِسْمِكَ اللَّهُمَّ وَضَعْتُ جَنْبِي فَاغْفِرْ لِي ذَنْبِي وَاخْسَأْ شَيْطَانِي',
    transliteration: "Bismike allâhümme vada'tü cenbî fagfir lî zenbî vahse' şeytânî.",
    meaning: "Allah'ım! Senin adınla yanımı yatağa koydum. Günahımı bağışla, şeytanımı uzaklaştır.",
    source: 'Ebû Dâvûd',
    virtue: 'Yatağa uzanırken okunur.',
  },

  /* ═══════════════════════════════════════════════════════════
     YOLCULUK DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-31',
    category: 'yolculuk',
    title: 'Yola Çıkarken',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: "Sübhânellezî sahhara lenâ hâzâ ve mâ künnâ lehû mukrinîn, ve innâ ilâ rabbinâ le münkalibûn.",
    meaning: "Bunu bizim hizmetimize veren Allah'ı tenzih ederim. Yoksa biz buna güç yetiremezdik. Şüphesiz biz Rabbimize döneceğiz.",
    source: 'Müslim, Tirmizî',
    virtue: 'Yolculuğa çıkarken okunur.',
  },
  {
    id: 'dua-32',
    category: 'yolculuk',
    title: 'Bineğe Binerken',
    arabic: 'بِسْمِ اللَّهِ وَالْحَمْدُ لِلَّهِ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
    transliteration: "Bismillâhi vel hamdü lillâh. Sübhânellezî sahhara lenâ hâzâ ve mâ künnâ lehû mukrinîn.",
    meaning: "Allah'ın adıyla, hamd Allah'a mahsustur. Bunu bizim hizmetimize veren Allah'ı tenzih ederim. Yoksa biz buna güç yetiremezdik.",
    source: 'Tirmizî',
    virtue: 'Araba, uçak, gemi gibi bir araca binerken okunur.',
  },
  {
    id: 'dua-33',
    category: 'yolculuk',
    title: 'Yolculuk Dönüşü',
    arabic: 'آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ',
    transliteration: "Âyibûne tâibûne âbidûne li rabbinâ hâmidûn.",
    meaning: "Biz dönüyoruz, tövbe ediyoruz, kulluk ediyoruz, Rabbimize hamd ediyoruz.",
    source: 'Müslim',
    virtue: 'Yolculuktan dönerken okunur.',
  },

  /* ═══════════════════════════════════════════════════════════
     KORUMA DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-34',
    category: 'koruma',
    title: 'Nazar Duası',
    arabic: 'اللَّهُمَّ بَارِكْ فِيهِ وَلَا تَضُرَّهُ',
    transliteration: "Allâhümme bârik fîhi ve lâ tadurrah.",
    meaning: "Allah'ım! Ona bereket ver ve ona zarar verme.",
    source: 'Hadis-i Şerif',
    virtue: 'Bir kimseyi beğenince veya nazar değmesinden korkunca okunur.',
  },
  {
    id: 'dua-35',
    category: 'koruma',
    title: 'İhlas-Felak-Nas ile Koruma',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ - قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ - قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    transliteration: 'Üç defa İhlas, Felak ve Nâs sureleri okunur.',
    meaning: "İhlas, Felak ve Nâs sureleriyle Allah'a sığınılır.",
    source: 'Ebû Dâvûd, Tirmizî',
    virtue: 'Sabah-akşam 3 defa okuyana her şey yeter.',
  },
  {
    id: 'dua-36',
    category: 'koruma',
    title: 'Ev Koruma Duası',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "Eûzü bi kelimâtillâhit tâmmeti min şerri mâ halak.",
    meaning: "Yarattıklarının şerrinden Allah'ın eksiksiz kelimelerine sığınırım.",
    source: 'Müslim',
    virtue: 'Eve girerken ve akşamları okunur.',
  },
  {
    id: 'dua-37',
    category: 'koruma',
    title: 'Kötülükten Koruma',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ',
    transliteration: "Allâhümme innî eûzü bike min şerri nefsî ve min şerriş şeytâni ve şirkih.",
    meaning: "Allah'ım! Nefsimin şerrinden, şeytanın şerrinden ve şirkinden sana sığınırım.",
    source: 'Ebû Dâvûd, Tirmizî',
    virtue: 'Her türlü kötülükten korunmak için okunur.',
  },

  /* ═══════════════════════════════════════════════════════════
     SAĞLIK DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-38',
    category: 'saglik',
    title: 'Hasta Olunca',
    arabic: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ',
    transliteration: "Es'elüllâhel azîme rabbel arşil azîmi en yeşfiyek.",
    meaning: "Yüce Arş'ın Rabbi olan büyük Allah'tan sana şifa vermesini dilerim.",
    source: 'Tirmizî, Ebû Dâvûd',
    virtue: 'Hastayı ziyaret ederken 7 defa okunur.',
  },
  {
    id: 'dua-39',
    category: 'saglik',
    title: 'Şifa Duası',
    arabic: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَاسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لَا شَافِيَ إِلَّا أَنْتَ',
    transliteration: "Allâhümme rabben nâsi ezhibil be's, işfih, ve enteş şâfî, lâ şâfiye illâ ent.",
    meaning: "Allah'ım! İnsanların Rabbi! Sıkıntıyı gider. Şifa ver. Şüphesiz sen şifa verensin. Senden başka şifa veren yoktur.",
    source: 'Buhari, Müslim',
    virtue: 'Hastanın başında okunur.',
  },
  {
    id: 'dua-40',
    category: 'saglik',
    title: 'Ağrı İçin',
    arabic: 'بِسْمِ اللَّهِ (٣ كere) أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (٧ كere)',
    transliteration: "Bismillâh (3 defa). Eûzü billâhi ve kudretihî min şerri mâ ecidü ve ühâzir (7 defa).",
    meaning: "Allah'ın adıyla (3 defa). Hissettiğim ve korktuğum şeyin şerrinden Allah'a ve O'nun kudretine sığınırım (7 defa).",
    source: 'Müslim',
    virtue: 'Ağrıyan yere el konup okunur.',
  },
  {
    id: 'dua-41',
    category: 'saglik',
    title: 'Hastaya Ziyaret',
    arabic: 'لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ',
    transliteration: "Lâ be's, tahûrun inşâallâh.",
    meaning: "Sıkıntı yok, inşallah bu (hastalık) günahlara kefarettir.",
    source: 'Buhari',
    virtue: 'Hastayı ziyaret ederken söylenir.',
  },

  /* ═══════════════════════════════════════════════════════════
     SIKINTI DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-42',
    category: 'sikinti',
    title: 'Keder ve Üzüntü İçin',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ',
    transliteration: "Allâhümme innî eûzü bike minel hemmi vel hazen, vel aczi vel kesel, vel buhli vel cübn...",
    meaning: "Allah'ım! Üzüntüden, kederden, acizlikten, tembellikten, cimrilikten ve korkaklıktan sana sığınırım...",
    source: 'Buhari',
    virtue: 'Peygamberimizin sık sık yaptığı duadır.',
  },
  {
    id: 'dua-43',
    category: 'sikinti',
    title: 'Borç İçin',
    arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    transliteration: "Allâhümmekfinî bi halâlike an harâmik, ve agninî bi fadlike ammen sivâk.",
    meaning: "Allah'ım! Helalinle haramına karşı beni yeterli kıl. Lütfunla beni senden başkasına muhtaç etme.",
    source: 'Tirmizî',
    virtue: 'Borç sıkıntısı için okunur.',
  },
  {
    id: 'dua-44',
    category: 'sikinti',
    title: 'Korku Anında',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: "Hasbünallâhü ve ni'mel vekîl.",
    meaning: "Allah bize kâfidir. O ne güzel vekildir.",
    source: 'Âl-i İmrân Suresi, 173',
    virtue: 'Korku ve endişe anında okunur.',
  },
  {
    id: 'dua-45',
    category: 'sikinti',
    title: 'Öfke Anında',
    arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    transliteration: "Eûzü billâhi mineş şeytânir racîm.",
    meaning: "Kovulmuş şeytandan Allah'a sığınırım.",
    source: 'Buhari, Müslim',
    virtue: 'Öfkelendiğinde okunur ve abdest alınır.',
  },

  /* ═══════════════════════════════════════════════════════════
     İSTİĞFAR
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-46',
    category: 'istigfar',
    title: 'Estağfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: "Estağfirullâh.",
    meaning: "Allah'tan bağışlanma dilerim.",
    source: 'Hadis-i Şerif',
    virtue: "Günde 70-100 defa okunması sünnettir.",
  },
  {
    id: 'dua-47',
    category: 'istigfar',
    title: 'Estağfirullah el-Azim',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    transliteration: "Estağfirullâhel azîmellezî lâ ilâhe illâ hüvel hayyül kayyûmü ve etûbü ileyh.",
    meaning: "Kendisinden başka ilah olmayan, diri ve her şeyi ayakta tutan yüce Allah'tan bağışlanma diler ve O'na tövbe ederim.",
    source: 'Tirmizî',
    virtue: 'Kim okursa günahları affolunur, deniz köpüğü kadar olsa bile.',
  },
  {
    id: 'dua-48',
    category: 'istigfar',
    title: 'Tövbe Duası',
    arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    transliteration: "Rabbigfir lî ve tüb aleyye inneke entet tevvâbür rahîm.",
    meaning: "Rabbim! Beni bağışla ve tövbemi kabul et. Şüphesiz sen tövbeleri kabul edensin, merhamet edensin.",
    source: 'Tirmizî',
    virtue: 'Peygamberimizin günde 100 defa okuduğu dua.',
  },
  {
    id: 'dua-49',
    category: 'istigfar',
    title: 'Gece İstiğfarı',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    transliteration: "Estağfirullâhellezî lâ ilâhe illâ hüvel hayyül kayyûmü ve etûbü ileyh.",
    meaning: "Kendisinden başka ilah olmayan, diri ve her şeyi ayakta tutan Allah'tan bağışlanma diler ve O'na tövbe ederim.",
    source: 'Tirmizî',
    virtue: 'Gece yatmadan önce veya teheccüd vaktinde okunur.',
  },

  /* ═══════════════════════════════════════════════════════════
     SALAVATLAR
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-50',
    category: 'salavat',
    title: 'Salaten Tüncina',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ',
    transliteration: "Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed, salâten tüncînâ bihâ min cemî'il ehvâli vel âfât...",
    meaning: "Allah'ım! Efendimiz Muhammed'e ve ailesine salât et. Öyle bir salât ki onunla bizi bütün korkulardan ve afetlerden kurtar...",
    source: 'Klasik kaynaklar',
    virtue: 'Sıkıntı, kaza, bela ve musibetlerden korunmak için okunur.',
  },
  {
    id: 'dua-51',
    category: 'salavat',
    title: 'Kısa Salavat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَسَلِّمْ',
    transliteration: "Allâhümme salli alâ Muhammedin ve sellim.",
    meaning: "Allah'ım! Muhammed'e salât ve selam et.",
    source: 'Hadis-i Şerif',
    virtue: "Her fırsatta okunabilir. Peygamberimize en yakın olanlar en çok salavat getirenlerdir.",
  },

  /* ═══════════════════════════════════════════════════════════
     HAYIR DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-52',
    category: 'hayir',
    title: 'Hayırlısını İsteme (İstihare)',
    arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ',
    transliteration: "Allâhümme innî estehîruke bi ilmike, ve estakdiruke bi kudretike, ve es'elüke min fadlikel azîm...",
    meaning: "Allah'ım! İlmine sığınarak senden hayır diliyorum. Kudretinle bana güç vermeni istiyorum. Büyük lütfundan istiyorum...",
    source: 'Buhari',
    virtue: 'Bir karar verirken istihare için okunur.',
  },
  {
    id: 'dua-53',
    category: 'hayir',
    title: 'Hidayet Duası',
    arabic: 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي',
    transliteration: "Allâhümmehdini ve seddidnî.",
    meaning: "Allah'ım! Beni hidayete erdir ve doğru yola ilet.",
    source: 'Müslim',
    virtue: 'Doğru yolu bulmak ve istikamet için okunur.',
  },
  {
    id: 'dua-54',
    category: 'hayir',
    title: 'Şükür Duası',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allâhümme einnî alâ zikrike ve şükrike ve husni ibâdetik.",
    meaning: "Allah'ım! Seni anmak, sana şükretmek ve sana güzelce kulluk etmek için bana yardım et.",
    source: 'Ebû Dâvûd, Nesâî',
    virtue: 'Peygamberimizin Muaz\'a öğrettiği dua.',
  },
  {
    id: 'dua-55',
    category: 'hayir',
    title: 'Cennet Duası',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ',
    transliteration: "Allâhümme innî es'elükel cennete ve eûzü bike minen nâr.",
    meaning: "Allah'ım! Senden cennet istiyorum ve cehennem ateşinden sana sığınıyorum.",
    source: 'Ebû Dâvûd',
    virtue: 'Her namazdan sonra okunması tavsiye edilir.',
  },

  /* ═══════════════════════════════════════════════════════════
     AİLE DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-56',
    category: 'aile',
    title: 'Anne-Baba İçin',
    arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: "Rabbirhamhümâ kemâ rabbeyânî sagîrâ.",
    meaning: "Rabbim! Onlar beni küçükken nasıl yetiştirdilerse sen de onlara öyle merhamet et.",
    source: 'İsrâ Suresi, 24',
    virtue: 'Anne-baba için okunacak en güzel duadır.',
  },
  {
    id: 'dua-57',
    category: 'aile',
    title: 'Çocuk İçin',
    arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    transliteration: "Rabbenâ heb lenâ min ezvâcinâ ve zürriyyâtinâ kurrate a'yünin vec'alnâ lil müttekîne imâmâ.",
    meaning: "Rabbimiz! Bize eşlerimizden ve çocuklarımızdan gözümüzü aydınlatacak (hayırlı) kimseler ver. Bizi takva sahiplerine öncü yap.",
    source: 'Furkan Suresi, 74',
    virtue: 'Hayırlı eş ve evlat için okunur.',
  },
  {
    id: 'dua-58',
    category: 'aile',
    title: 'Evlat Hayırlısı',
    arabic: 'رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ',
    transliteration: "Rabbi heb lî mine\'s-sâlihîn.",
    meaning: "Rabbim! Bana salihlerden (hayırlı) bir evlat ver.",
    source: 'Sâffât Suresi, 100',
    virtue: 'İbrahim Peygamberin evlat duasıdır.',
  },

  /* ═══════════════════════════════════════════════════════════
     İLİM DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-59',
    category: 'ilim',
    title: 'İlim Duası',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: "Rabbi zidnî ilmâ.",
    meaning: "Rabbim! İlmimi artır.",
    source: 'Tâhâ Suresi, 114',
    virtue: 'Ders çalışırken, sınav öncesinde okunur.',
  },
  {
    id: 'dua-60',
    category: 'ilim',
    title: 'Anlama Duası',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي',
    transliteration: "Rabbih şerh lî sadrî ve yessir lî emrî vahlül ukdeten min lisânî yefkahû kavlî.",
    meaning: "Rabbim! Gönlüme genişlik ver, işimi kolaylaştır, dilimdeki düğümü çöz ki sözümü anlasınlar.",
    source: 'Tâhâ Suresi, 25-28',
    virtue: 'Musa Peygamberin duası. Konuşma, anlatma, ders çalışma öncesi okunur.',
  },

  /* ═══════════════════════════════════════════════════════════
     RIZIK DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-61',
    category: 'rizik',
    title: 'Rızık Duası',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
    transliteration: "Allâhümme innî es'elüke ilmen nâfiâ, ve rizkan tayyibâ, ve amelen mütekabbelâ.",
    meaning: "Allah'ım! Senden faydalı ilim, temiz rızık ve kabul edilecek amel isterim.",
    source: 'İbn Mâce',
    virtue: 'Sabah namazından sonra okunması tavsiye edilir.',
  },
  {
    id: 'dua-62',
    category: 'rizik',
    title: 'Bereket Duası',
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَزِدْنَا مِنْ فَضْلِكَ',
    transliteration: "Allâhümme bârik lenâ fîmâ razaktenâ ve zidnâ min fadlik.",
    meaning: "Allah'ım! Bize verdiğin rızıkta bereket ver ve lütfundan bize artır.",
    source: 'İbn Sünnî',
    virtue: 'Rızık ve bereket için okunur.',
  },

  /* ═══════════════════════════════════════════════════════════
     ÖZEL GÜNLER
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-63',
    category: 'ozel_gunler',
    title: 'Oruç Açma (İftar) Duası',
    arabic: 'اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    transliteration: "Allâhümme innî leke sumtü ve bike âmentü ve alâ rizkike eftartü.",
    meaning: "Allah'ım! Senin için oruç tuttum, sana inandım, senin rızkınla orucumu açtım.",
    source: 'Ebû Dâvûd',
    virtue: 'İftar açarken okunur.',
  },
  {
    id: 'dua-64',
    category: 'ozel_gunler',
    title: 'Sahur Duası',
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي سَحُورِنَا وَاجْعَلْنَا مِنَ الصَّائِمِينَ',
    transliteration: "Allâhümme bârik lenâ fî sahûrinâ vec'alnâ mine's-sâimîn.",
    meaning: "Allah'ım! Sahurumuzu bereketli kıl ve bizi oruç tutanlardan eyle.",
    source: 'Geleneksel',
    virtue: 'Sahurda okunur.',
  },
  {
    id: 'dua-65',
    category: 'ozel_gunler',
    title: 'Bayram Duası',
    arabic: 'اللَّهُمَّ تَقَبَّلْ مِنَّا صِيَامَنَا وَقِيَامَنَا وَاجْعَلْهُ فِي مِيزَانِ حَسَنَاتِنَا',
    transliteration: "Allâhümme tekabbel minnâ sıyâmenâ ve kıyâmenâ vec'alhü fî mîzâni hasenâtinâ.",
    meaning: "Allah'ım! Oruçlarımızı ve ibadetlerimizi kabul eyle, onları iyilik terazimize koy.",
    source: 'Geleneksel',
    virtue: 'Bayram günleri okunur.',
  },
  {
    id: 'dua-66',
    category: 'ozel_gunler',
    title: 'Cuma Günü Salavat',
    arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    transliteration: "Allâhümme salli ve sellim alâ nebiyyinâ Muhammed.",
    meaning: "Allah'ım! Peygamberimiz Muhammed'e salât ve selam et.",
    source: 'Hadis-i Şerif',
    virtue: 'Cuma günü salavat okumak faziletlidir.',
  },

  /* ═══════════════════════════════════════════════════════════
     KUR'AN DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-67',
    category: 'kuran',
    title: 'Fatiha Suresi',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۞ الرَّحْمَٰنِ الرَّحِيمِ ۞ مَالِكِ يَوْمِ الدِّينِ ۞ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۞ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۞ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    transliteration: "Bismillâhirrahmânirrahîm. Elhamdü lillâhi rabbil âlemîn. Errahmânirrahîm. Mâliki yevmiddîn. İyyâke na'büdü ve iyyâke nesteîn. İhdinas sırâtal müstakîm. Sırâtallezîne en'amte aleyhim gayril mağdûbi aleyhim ve leddâllîn.",
    meaning: "Rahman ve Rahim olan Allah'ın adıyla. Hamd, âlemlerin Rabbi Allah'a mahsustur. O Rahman'dır, Rahim'dir. Hesap gününün sahibidir. Yalnız sana ibadet eder, yalnız senden yardım dileriz. Bizi doğru yola ilet. Kendilerine nimet verdiklerinin yoluna, gazaba uğramışların ve sapmışların yoluna değil.",
    source: 'Fatiha Suresi, 1-7',
    virtue: "Kur'an'ın özüdür. Namazın her rekâtında okunur.",
  },
  {
    id: 'dua-68',
    category: 'kuran',
    title: 'İhlas Suresi',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    transliteration: "Kul hüvallâhü ehad. Allâhüs samed. Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.",
    meaning: "De ki: O Allah birdir. Allah Samed'dir (her şey O'na muhtaç, O hiçbir şeye muhtaç değildir). O doğurmamış ve doğmamıştır. Hiçbir şey O'nun dengi değildir.",
    source: 'İhlas Suresi, 1-4',
    virtue: "Kur'an'ın üçte birine denktir.",
  },
  {
    id: 'dua-69',
    category: 'kuran',
    title: 'Felak Suresi',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۞ مِنْ شَرِّ مَا خَلَقَ ۞ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۞ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۞ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    transliteration: "Kul eûzü bi rabbil felak. Min şerri mâ halak. Ve min şerri gâsikın izâ vekab. Ve min şerrin neffâsâti fil ukad. Ve min şerri hâsidin izâ hased.",
    meaning: "De ki: Sabahın Rabbine sığınırım. Yarattıklarının şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfleyenlerin şerrinden, haset ettiği zaman hasetçinin şerrinden.",
    source: 'Felak Suresi, 1-5',
    virtue: 'Nazardan ve büyüden korunmak için okunur.',
  },
  {
    id: 'dua-70',
    category: 'kuran',
    title: 'Nâs Suresi',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۞ مَلِكِ النَّاسِ ۞ إِلَٰهِ النَّاسِ ۞ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۞ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۞ مِنَ الْجِنَّةِ وَالنَّاسِ',
    transliteration: "Kul eûzü bi rabbin nâs. Melikin nâs. İlâhin nâs. Min şerril vesvâsil hannâs. Elležî yüvesvisü fî sudûrin nâs. Minel cinneti ven nâs.",
    meaning: "De ki: İnsanların Rabbine sığınırım. İnsanların Melikine (mutlak sahibine). İnsanların İlahına. Sinsi vesvesecinin şerrinden. O ki insanların göğüslerine vesvese verir. Gerek cinlerden, gerek insanlardan.",
    source: 'Nâs Suresi, 1-6',
    virtue: 'Vesvese ve şeytandan korunmak için okunur.',
  },

  /* ═══════════════════════════════════════════════════════════
     HADİS DUALARI
     ═══════════════════════════════════════════════════════════ */
  {
    id: 'dua-71',
    category: 'hadis',
    title: 'Sabah-Akşam Koruma',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: "Bismillâhillezî lâ yadurru ma'asmihî şey'ün fil ardı ve lâ fis semâ', ve hüves semîul alîm.",
    meaning: "Adı anıldığında yerde ve gökte hiçbir şeyin zarar veremeyeceği, her şeyi işiten ve bilen Allah'ın adıyla (sığınırım).",
    source: 'Tirmizî, Ebû Dâvûd',
    virtue: 'Sabah-akşam 3 defa okuyana hiçbir şey zarar vermez.',
  },
  {
    id: 'dua-72',
    category: 'hadis',
    title: 'Sıkıntı Duası (Peygamberimizin)',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
    transliteration: "Lâ ilâhe illallâhül azîmül halîm. Lâ ilâhe illallâhu rabbül arşil azîm. Lâ ilâhe illallâhu rabbüs semâvâti ve rabbül ardı ve rabbül arşil kerîm.",
    meaning: "Yüce ve müsamahakâr olan Allah'tan başka ilah yoktur. Yüce Arş'ın Rabbi olan Allah'tan başka ilah yoktur. Göklerin Rabbi, yerin Rabbi ve şerefli Arş'ın Rabbi olan Allah'tan başka ilah yoktur.",
    source: 'Buhari, Müslim',
    virtue: 'Peygamberimiz sıkıntı anında bu duayı okurdu.',
  },
  {
    id: 'dua-73',
    category: 'hadis',
    title: 'Hayırlı İş İçin Dua',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ',
    transliteration: "Allâhümme innî es'elüke minel hayri küllih, âcilihî ve âcilih, mâ alimtü minhü ve mâ lem a'lem...",
    meaning: "Allah'ım! Bütün hayırları senden istiyorum; peşin ve gelecek, bildiğim ve bilmediğim hepsini...",
    source: 'İbn Mâce',
    virtue: 'Hayırlı iş için kapsamlı bir duadır.',
  },
];

export default DUA_VERILERI;