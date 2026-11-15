// src/data/zikirData.js

export const PRESET_ZIKIRS = [
  /* ================================================================
     GÜNLÜK — her zaman çekilebilecek temel zikirler
     ================================================================ */
  { 
    id: 'z1',  
    name: 'Sübhanallah', 
    target: 33, 
    category: 'Günlük',
    description: 'Anlamı: "Allah\'ı her türlü noksan sıfatlardan tenzih ederim." Hz. Peygamber (s.a.v.) bu zikrin mizanı dolduracak kadar sevaplı olduğunu müjdelemiştir.'
  },
  { 
    id: 'z2',  
    name: 'Elhamdülillah', 
    target: 33, 
    category: 'Günlük',
    description: 'Anlamı: "Hamd Allah\'a mahsustur, şükürler olsun." Nimetlerin artmasına vesile olan ve kalbe huzur veren en faziletli şükür zikirlerindendir.'
  },
  { 
    id: 'z3',  
    name: 'Allahu Ekber', 
    target: 33, 
    category: 'Günlük',
    description: 'Anlamı: "Allah en büyüktür." O\'nun büyüklüğünü ve azametini kalben tasdik etmenin en güzel ifadesidir.'
  },
  { 
    id: 'z4',  
    name: 'Sübhanallahi ve bihamdihi', 
    target: 100, 
    category: 'Günlük',
    description: 'Fazileti: Günde 100 defa söyleyenin günahları deniz köpüğü kadar çok olsa bile bağışlanır (Buhârî).'
  },
  { 
    id: 'z5',  
    name: 'Sübhanallahil azim', 
    target: 100, 
    category: 'Günlük',
    description: 'Fazileti: Dilde hafif, mizanda ağır gelen, Rahman olan Allah\'ın çok sevdiği iki mübarek kelimeden biridir.'
  },
  { 
    id: 'z6',  
    name: 'Sübhanallahi ve bihamdihi sübhanallahil azim', 
    target: 100, 
    category: 'Günlük',
    description: 'Fazileti: Hz. Muhammed (s.a.v.) tarafından ümmetine şiddetle tavsiye edilen, sevabı çok büyük bir zikirdir.'
  },
  { 
    id: 'z7',  
    name: 'La havle ve la kuvvete illa billah', 
    target: 100, 
    category: 'Günlük',
    description: 'Anlamı: "Güç ve kuvvet ancak yüce ve büyük olan Allah\'ın yardımıyla elde edilir." Cennet hazinelerinden bir hazinedir.'
  },
  { 
    id: 'z8',  
    name: 'Hasbünallahu ve ni\'mel vekil', 
    target: 100, 
    category: 'Günlük',
    description: 'Anlamı: "Allah bize yeter, O ne güzel vekildir." Hz. İbrahim (a.s.) ateşe atıldığında ve Hz. Muhammed (s.a.v.) zorluklar karşısında bu tespihi okumuştur.'
  },
  { 
    id: 'z9',  
    name: 'La ilahe illa ente sübhaneke inni küntü minez zalimin', 
    target: 33, 
    category: 'Günlük',
    description: 'Yunus Peygamber\'in (a.s.) balığın karnındayken yaptığı ve sıkıntılardan kurtulmasını sağlayan kurtuluş duasıdır (Enbiya Suresi, 87).'
  },
  { 
    id: 'z10', name: 'Bismillah', target: 33, category: 'Günlük',
    description: 'Her hayırlı işin başına bereket ve rahmet celbetmek için hedeflenen temel zikirdir.'
  },
  { 
    id: 'z11', name: 'Bismillahirrahmanirrahim', target: 33, category: 'Günlük',
    description: 'Anlamı: "Rahman ve Rahim olan Allah\'ın adıyla." Kur\'an-ı Kerim\'in anahtarı ve en mukaddes zikirlerdendir.'
  },
  { 
    id: 'z12', name: 'Maşallah', target: 33, category: 'Günlük',
    description: 'Anlamı: "Allah ne güzel yazmış / dilediği olur." Güzellikler karşısında nazardan korunmak ve şükretmek için çekilir.'
  },
  { 
    id: 'z13', name: 'Allahümme barik', target: 33, category: 'Günlük',
    description: 'Namazlarda okunan İbrahimiyye salavatının devamı niteliğinde bereket ve rahmet duasıdır.'
  },
  { 
    id: 'z14', name: 'Radıyallahu anh', target: 33, category: 'Günlük',
    description: 'Anlamı: "Allah ondan razı olsun." Sahabeler ve salih zatlar anıldığında hürmeten söylenen dua cümlesidir.'
  },
  { 
    id: 'z15', name: 'Sübhanallahi ve bihamdihi adede halkıhi', target: 3, category: 'Günlük',
    description: 'Hz. Peygamber\'in (s.a.v.) Zeynep Validemize öğrettiği, saatlerce yapılan zikir sevabına denk gelen kapsamlı tespihtir.'
  },

  /* ================================================================
     TESBİHAT — namaz sonrası tesbihatın parçası
     ================================================================ */
  { 
    id: 'z16', name: 'La ilahe illallah vahdehu la şerike leh', target: 100, category: 'Tesbihat',
    description: 'Günde 100 defa okuyana on köle azat etmiş kadar sevap yazılır, yüz günahı silinir ve şeytandan korunur.'
  },
  { 
    id: 'z17', name: 'Sübhanallahi velhamdülillahi ve la ilahe illallahu vallahu ekber', target: 33, category: 'Tesbihat',
    description: 'Namaz sonralarında tespihatın temelini oluşturan, Hz. Peygamber\'in en çok sevdgği zikirlerdendir.'
  },
  { 
    id: 'z18', name: 'La havle ve la kuvvete illa billahil aliyyil azim', target: 100, category: 'Tesbihat',
    description: 'Doksan dokuz derdin, en hafifi sıkıntı olan "la havle vela kuvvete illa billah" dermanıdır.'
  },
  { 
    id: 'z19', name: 'Allahümme entesselam ve minkesselam', target: 1, category: 'Tesbihat',
    description: 'Namazdan sonra selam verildikten hemen sonra okunan sünnet zikirdir.'
  },
  { 
    id: 'z20', name: 'Ayetü\'l Kürsi', target: 1, category: 'Tesbihat',
    description: 'Bakara Suresi\'nin 255. ayeti olup, okuyanı sabaha kadar koruyan en büyük koruma ve tevhiddir.'
  },

  /* ================================================================
     İSTİĞFAR — bağışlanma zikirleri
     ================================================================ */
  { 
    id: 'z21', name: 'Estağfirullah', target: 100, category: 'İstiğfar',
    description: 'Anlamı: "Allah\'tan bağışlanma dilerim." Kalbin pasını siler, rızık kapılarını açar ve darlıkları giderir.'
  },
  { 
    id: 'z22', name: 'Estağfirullahe ve etûbü ileyh', target: 100, category: 'İstiğfar',
    description: 'Anlamı: "Allah\'tan af diler ve O\'na tövbe ederim." Günde 70-100 kez Hz. Peygamber tarafından okunmuştur.'
  },
  { 
    id: 'z23', name: 'Estağfirullahe\'l-azîm', target: 33, category: 'İstiğfar',
    description: 'Yüce Allah\'ın azametine sığınarak günahlardan arınma ve af talebinde bulunma zikridir.'
  },
  { 
    id: 'z24', name: 'Estağfirullah el-kerîm', target: 33, category: 'İstiğfar',
    description: 'Kerem sahibi, ikramı bol olan Allah\'tan bağışlanma dileme ifadesidir.'
  },
  { 
    id: 'z25', name: 'Rabbiğfir lî ve tüb aleyye', target: 100, category: 'İstiğfar',
    description: 'Anlamı: "Rabbim beni bağışla ve tövbemi kabul et." Hz. Peygamber\'in meclislerinde defalarca okuduğu istiğfardır.'
  },
  { 
    id: 'z26', name: 'Allahümme inneke afüvvün tuhibbül afve fa\'fü annî', target: 33, category: 'İstiğfar',
    description: 'Kadir Gecesi\'nde Hz. Aişe\'nin Efendimize sorduğu ve okunması şiddetle tavsiye edilen af duasıdır.'
  },
  { 
    id: 'z27', name: 'Seyyidül istiğfar', target: 1, category: 'İstiğfar',
    description: 'Tövbe istiğfarların en büyüğü ve efendisidir. Gündüz okuyan akşam ölürse cennetliktir, gece okuyan sabah ölürse yine cennetliktir.'
  },
  { 
    id: 'z28', name: 'Rabbena zalemna enfusena', target: 33, category: 'İstiğfar',
    description: 'Hz. Âdem ve Havva\'nın dünyaya indiklerinde okudukları pişmanlık ve af yalvarışıdır (A\'raf Suresi, 23).'
  },
  { 
    id: 'z29', name: 'Rabbenâğfir lî ve li vâlideyye ve lil mü\'minîn', target: 33, category: 'İstiğfar',
    description: 'Anlamı: "Rabbimiz! Beni, anne-babamı ve tüm müminleri bağışla." (İbrahim Suresi, 41).'
  },

  /* ================================================================
     SALAVAT — Peygamberimize salat ve selam
     ================================================================ */
  { 
    id: 'z30', name: 'Allahümme salli ala Muhammed', target: 100, category: 'Salavat',
    description: 'Peygamber Efendimiz\'e (s.a.v.) salatü selam getirmenin en pratik ve huzur veren formlarındandır.'
  },
  { 
    id: 'z31', name: 'Allahümme salli ve sellim ala nebiyyina Muhammed', target: 100, category: 'Salavat',
    description: 'Nebimiz Muhammed\'e salat ve selam olsun duasıdır; Cuma günleri bolca okunması tavsiye edilir.'
  },
  { 
    id: 'z32', name: 'Sallallahu aleyhi ve sellem', target: 100, category: 'Salavat',
    description: 'Anlamı: "Allah\'ın salat ve selamı onun üzerine olsun." Efendimizin adı anıldığında söylenen en yaygın salavattır.'
  },
  { 
    id: 'z33', name: 'Salavat-ı Şerife', target: 100, category: 'Salavat',
    description: 'Peygamber sevgisini kalbe yerleştiren, sıkıntıları gideren ve şefaat vesilesi olan salavattır.'
  },
  { 
    id: 'z34', name: 'Allahümme salli ala seyyidina Muhammed', target: 100, category: 'Salavat',
    description: 'Efendimiz Hz. Muhammed\'e saygı ve hürmet içeren faziletli salavattır.'
  },
  { 
    id: 'z35', name: 'Salavat-ı İbrahimiyye', target: 1, category: 'Salavat',
    description: 'Namazların son oturuşunda okunan, en mükemmel ve esash salavat formudur.'
  },
  { 
    id: 'z36', name: 'Allahümme salli ala Muhammedin ve ala ali Muhammed', target: 100, category: 'Salavat',
    description: 'Hz. Muhammed\'e ve onun aline (Ehl-i Beytine) salat olsun duasıdır.'
  },

  /* ================================================================
     TEVHİD — Allah'ın birliği
     ================================================================ */
  { 
    id: 'z37', name: 'La ilahe illallah', target: 100, category: 'Tevhid',
    description: 'Zikirlerin en üstünü "La ilahe illallah"dır (Tirmizî). Kalbi nurlandırır ve imanı tazeler.'
  },
  { 
    id: 'z38', name: 'La ilahe illallah', target: 1000, category: 'Tevhid',
    description: 'Bin defa çekilen tevhid kelimesi kişinin cehennemden azat olmasına büyük bir vesiledir.'
  },
  { 
    id: 'z39', name: 'La ilahe illallahu vahdehu la şerike leh', target: 100, category: 'Tevhid',
    description: 'Mülk O\'nundur, hamd O\'nundur ve O\'nun her şeye gücü yeter hakikatini haykıran tevhittir.'
  },
  { 
    id: 'z40', name: 'Muhammedün Resulullah', target: 100, category: 'Tevhid',
    description: 'Hz. Muhammed\'in Allah\'ın elçisi olduğunu tasdik eden kutsal kelime-i tevhidin ikinci parçasıdır.'
  },
  { 
    id: 'z41', name: 'La ilahe illallahül melikül hakkul mübin', target: 100, category: 'Tevhid',
    description: 'Günde 100 defa okuyanın fakirliği giderilir, kabir vahşetinden emin olunur ve zenginlik kapısı açılır.'
  },
  { 
    id: 'z42', name: 'Kul hüvallahu ehad', target: 3, category: 'Dua',
    description: 'İhlas Suresi\'nin ilk ayeti olup Kur\'an\'ın üçte birine denk gelen fazilete sahiptir.'
  },

  /* ================================================================
     ESMÂÜL HÜSNÂ — 99 ismin tamamı
     ================================================================ */
  { id: 'z43',  name: 'Ya Allah', target: 100, category: 'Esmaül Hüsna', description: 'Yaradan\'ın en büyük ve tüm isimlerini kapsayan yüce ismidir. Kalbi mutmain eder.' },
  { id: 'z44',  name: 'Ya Rahman', target: 100, category: 'Esmaül Hüsna', description: 'Dünyada bütün mahlukata merhamet eden, nimet veren.' },
  { id: 'z45',  name: 'Ya Rahim', target: 100, category: 'Esmaül Hüsna', description: 'Ahirette sadece müminlere merhamet eden, bağışlayan.' },
  { id: 'z46',  name: 'Ya Melik', target: 100, category: 'Esmaül Hüsna', description: 'Kâinatın mutlak sahibi, mülkün ve sultanlığın hakiki meliki.' },
  { id: 'z47',  name: 'Ya Kuddüs', target: 100, category: 'Esmaül Hüsna', description: 'Her türlü noksanlıktan uzak, tertemiz, mukaddes olan.' },
  { id: 'z48',  name: 'Ya Selam', target: 100, category: 'Esmaül Hüsna', description: 'Her türlü tehlikeden selamet veren, kullarına huzur ve güvenlik bahşeden.' },
  { id: 'z49',  name: 'Ya Mümin', target: 100, category: 'Esmaül Hüsna', description: 'Güven veren, emniyet bahşeden, kullarını inancında doğrultan.' },
  { id: 'z50',  name: 'Ya Müheymin', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyi görüp gözeten, mahlûkatını koruy̧up denetleyen.' },
  { id: 'z51',  name: 'Ya Aziz', target: 100, category: 'Esmaül Hüsna', description: 'İzzet sahibi, mağlup edilmesi imkansız olan yegane galip.' },
  { id: 'z52',  name: 'Ya Cebbar', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğini yapan, kırık kalpleri onaran, azamet sahibi.' },
  { id: 'z53',  name: 'Ya Mütekebbir', target: 100, category: 'Esmaül Hüsna', description: 'Büyüklük ve azamette eşi ve benzeri olmayan.' },
  { id: 'z54',  name: 'Ya Halik', target: 100, category: 'Esmaül Hüsna', description: 'Yoktan var eden, her şeyin ölçüsünü tayin edip yaratan.' },
  { id: 'z55',  name: 'Ya Bari', target: 100, category: 'Esmaül Hüsna', description: 'Kusursuz ve uyumlu bir şekilde örneksiz var eden.' },
  { id: 'z56',  name: 'Ya Musavvir', target: 100, category: 'Esmaül Hüsna', description: 'Varlıklara şekil ve suret veren, ayırt edici özellikler katan.' },
  { id: 'z57',  name: 'Ya Gaffar', target: 100, category: 'Esmaül Hüsna', description: 'Günahları çok örten, mağfireti ve affı sonsuz olan.' },
  { id: 'z58',  name: 'Ya Kahhar', target: 100, category: 'Esmaül Hüsna', description: 'Her şeye ve her an galip gelen, zalimleri kahreden.' },
  { id: 'z59',  name: 'Ya Vehhab', target: 100, category: 'Esmaül Hüsna', description: 'Karşılıksız bol bol bağışlayan, sınırsız hediyeler veren.' },
  { id: 'z60',  name: 'Ya Rezzak', target: 100, category: 'Esmaül Hüsna', description: 'Bütün mahlukata maddi ve manevi rızık veren.' },
  { id: 'z61',  name: 'Ya Fettah', target: 100, category: 'Esmaül Hüsna', description: 'Her türlü müşkülleri çözen, hayır kapılarını açan.' },
  { id: 'z62',  name: 'Ya Alim', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyi en ince detayına kadar bilen, ilmi sınırsız olan.' },
  { id: 'z63',  name: 'Ya Kabıd', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğinin rızkını veya kalbini daraltan, sıkan.' },
  { id: 'z64',  name: 'Ya Basıt', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğinin rızkını genişleten, kalplere ferahlık veren.' },
  { id: 'z65',  name: 'Ya Hafıd', target: 100, category: 'Esmaül Hüsna', description: 'Kafirlerin ve zalimlerin derecesini alçaltan.' },
  { id: 'z66',  name: 'Ya Rafi', target: 100, category: 'Esmaül Hüsna', description: 'Şeref veren, inananların derecesini yükselten.' },
  { id: 'z67',  name: 'Ya Muiz', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğine izzet ve onur veren.' },
  { id: 'z68',  name: 'Ya Müzil', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğini zelil eden, hor ve hakir kılan.' },
  { id: 'z69',  name: 'Ya Semi', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyi en iyi işiten, gizli fısıltıları bile duyan.' },
  { id: 'z70',  name: 'Ya Basir', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyi en ince ayrıntısına kadar gören.' },
  { id: 'z71',  name: 'Ya Hakem', target: 100, category: 'Esmaül Hüsna', description: 'Mutlak hüküm veren, hak ile batılı ayıran.' },
  { id: 'z72',  name: 'Ya Adl', target: 100, category: 'Esmaül Hüsna', description: 'Mutlak adalet sahibi, hiç kimseye zulmetmeyen.' },
  { id: 'z73',  name: 'Ya Latif', target: 100, category: 'Esmaül Hüsna', description: 'Lütuf ve ihsan sahibi, kullarına en ince işlerle kolaylık sağlayan.' },
  { id: 'z74',  name: 'Ya Habir', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyin iç yüzünden, gizli hallerinden haberdar olan.' },
  { id: 'z75',  name: 'Ya Halim', target: 100, category: 'Esmaül Hüsna', description: 'Cezada acele etmeyen, yumuşak davranan, hilaf sahibi.' },
  { id: 'z76',  name: 'Ya Azim', target: 100, category: 'Esmaül Hüsna', description: 'Çok yüce, azamet ve ululuk sahibi.' },
  { id: 'z77',  name: 'Ya Gafur', target: 100, category: 'Esmaül Hüsna', description: 'Affı ve bağışlaması çok olan.' },
  { id: 'z78',  name: 'Ya Şekur', target: 100, category: 'Esmaül Hüsna', description: 'Az amele karşılık çok bol mukafat veren, şükrü kabul eden.' },
  { id: 'z79',  name: 'Ya Aliyy', target: 100, category: 'Esmaül Hüsna', description: 'Çok yüce, her şeyden üstün ve ulu olan.' },
  { id: 'z80',  name: 'Ya Kebir', target: 100, category: 'Esmaül Hüsna', description: 'Pek büyük, büyüklükte kendisinden üstünü olmayan.' },
  { id: 'z81',  name: 'Ya Hafiz', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyi mufazara eden, koruyup gözeten.' },
  { id: 'z82',  name: 'Ya Mukit', target: 100, category: 'Esmaül Hüsna', description: 'Her yaratılmışın rızkını veren, tayin eden.' },
  { id: 'z83',  name: 'Ya Hasib', target: 100, category: 'Esmaül Hüsna', description: 'Kulların hesabını en iyi gören, kifayet eden.' },
  { id: 'z84',  name: 'Ya Celil', target: 100, category: 'Esmaül Hüsna', description: 'Celal ve ululuk sahibi olan.' },
  { id: 'z85',  name: 'Ya Kerim', target: 100, category: 'Esmaül Hüsna', description: 'Cömertliği, ikramı ve keremi bol olan.' },
  { id: 'z86',  name: 'Ya Rakib', target: 100, category: 'Esmaül Hüsna', description: 'Bütün varlıkları ve işleri sürekli gözetim altında tutan.' },
  { id: 'z87',  name: 'Ya Mücib', target: 100, category: 'Esmaül Hüsna', description: 'Dualara icabet eden, kullarının yakarışlarına cevap veren.' },
  { id: 'z88',  name: 'Ya Vasi', target: 100, category: 'Esmaül Hüsna', description: 'Rahmeti, ilmi ve kudreti her şeyi kuşatan.' },
  { id: 'z89',  name: 'Ya Hakim', target: 100, category: 'Esmaül Hüsna', description: 'Hikmet sahibi, her işi hikmetli ve uyumlu olan.' },
  { id: 'z90',  name: 'Ya Vedud', target: 100, category: 'Esmaül Hüsna', description: 'Kullarını çok seven, sevilmeye ve dost olunmaya en layık olan.' },
  { id: 'z91',  name: 'Ya Mecid', target: 100, category: 'Esmaül Hüsna', description: 'Şanı yüce, şerefi ve kadrü kıymeti çok büyük olan.' },
  { id: 'z92',  name: 'Ya Bais', target: 100, category: 'Esmaül Hüsna', description: 'Ölüleri dirilten, kabirlerden çıkaran.' },
  { id: 'z93',  name: 'Ya Şehid', target: 100, category: 'Esmaül Hüsna', description: 'Her yerde ve her zaman hazir ve nazır olan, şahitlik eden.' },
  { id: 'z94',  name: 'Ya Hakk', target: 100, category: 'Esmaül Hüsna', description: 'Varlığı hak ve gerçek olan, hakikatin ta kendisi.' },
  { id: 'z95',  name: 'Ya Vekil', target: 100, category: 'Esmaül Hüsna', description: 'Kendisine tevekkül edenlerin işlerini en iyi idare eden.' },
  { id: 'z96',  name: 'Ya Kaviyy', target: 100, category: 'Esmaül Hüsna', description: 'Pek güçlü, kudret ve kuvvet sahibi.' },
  { id: 'z97',  name: 'Ya Metin', target: 100, category: 'Esmaül Hüsna', description: 'Çok sağlam, metanetli ve sarsılmaz güç sahibi.' },
  { id: 'z98',  name: 'Ya Veliyy', target: 100, category: 'Esmaül Hüsna', description: 'İnananların dostu, yardımcısı ve koruyucusu.' },
  { id: 'z99',  name: 'Ya Hamid', target: 100, category: 'Esmaül Hüsna', description: 'Ancak kendisine hamdü sena edilen, övülmeye layık olan.' },
  { id: 'z100', name: 'Ya Muhsi', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyin sayısını tek tek bilen.' },
  { id: 'z101', name: 'Ya Mübdi', target: 100, category: 'Esmaül Hüsna', description: 'Varlıkları örneksiz ve ilk kez yaratan.' },
  { id: 'z102', name: 'Ya Muid', target: 100, category: 'Esmaül Hüsna', description: 'Yaratılmışları yok olduktan sonra tekrar yaratan.' },
  { id: 'z103', name: 'Ya Muhyi', target: 100, category: 'Esmaül Hüsna', description: 'Can veren, hayat bağışlayan, şifa veren.' },
  { id: 'z104', name: 'Ya Mümit', target: 100, category: 'Esmaül Hüsna', description: 'Ölümü yaratan, can alan.' },
  { id: 'z105', name: 'Ya Hayy', target: 100, category: 'Esmaül Hüsna', description: 'Ebedi diri olan, asla ölmeyen, hayatın kaynağı.' },
  { id: 'z106', name: 'Ya Kayyum', target: 100, category: 'Esmaül Hüsna', description: 'Varlıkları ayakta tutan, kâinatı yöneten ve zatiyle kaim olan.' },
  { id: 'z107', name: 'Ya Vacid', target: 100, category: 'Esmaül Hüsna', description: 'Hiçbir şeyi kaybetmeyen, aradığını dilediği an bulan.' },
  { id: 'z108', name: 'Ya Macid', target: 100, category: 'Esmaül Hüsna', description: 'Şanı yüce, kerem ve şeref sahibi.' },
  { id: 'z109', name: 'Ya Vahid', target: 100, category: 'Esmaül Hüsna', description: 'Tek olan, zâtında, sıfatlarında ortağı olmayan.' },
  { id: 'z110', name: 'Ya Samed', target: 100, category: 'Esmaül Hüsna', description: 'Her şey O\'na muhtaç fakat O hiç kimseye muhtaç olmayan.' },
  { id: 'z111', name: 'Ya Kadir', target: 100, category: 'Esmaül Hüsna', description: 'Her şeye gücü yeten, mutlak kudret sahibi.' },
  { id: 'z112', name: 'Ya Muktedir', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğini her an yapmaya muktedir olan mutlak güç.' },
  { id: 'z113', name: 'Ya Mukaddim', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğini öne geçiren, öne alan.' },
  { id: 'z114', name: 'Ya Muahhir', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğini sona bırakan, erteleyen.' },
  { id: 'z115', name: 'Ya Evvel', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyden önce var olan, başlangıcı olmayan.' },
  { id: 'z116', name: 'Ya Ahir', target: 100, category: 'Esmaül Hüsna', description: 'Her şey yok olduktan sonra kalan, sonu olmayan.' },
  { id: 'z117', name: 'Ya Zahir', target: 100, category: 'Esmaül Hüsna', description: 'Varlığı delillerle ve eserleriyle apaçık belli olan.' },
  { id: 'z118', name: 'Ya Batın', target: 100, category: 'Esmaül Hüsna', description: 'Mahiyeti akıllarca gizli olan, duyularla idrak edilemeyen.' },
  { id: 'z119', name: 'Ya Vali', target: 100, category: 'Esmaül Hüsna', description: 'Kâinatı ve bütün olayları idare eden tek sahip.' },
  { id: 'z120', name: 'Ya Müteali', target: 100, category: 'Esmaül Hüsna', description: 'Aklın tasavvur edebileceği her şeyden yüce ve ulu.' },
  { id: 'z121', name: 'Ya Berr', target: 100, category: 'Esmaül Hüsna', description: 'İyilik ve ihsanı bol olan, kullarına şefkatle yaklaşan.' },
  { id: 'z122', name: 'Ya Tevvab', target: 100, category: 'Esmaül Hüsna', description: 'Tövbeleri kabul eden, kullarının af kapısını her daim açık tutan.' },
  { id: 'z123', name: 'Ya Müntekim', target: 100, category: 'Esmaül Hüsna', description: 'Zalimlerden adaletle intikam alan.' },
  { id: 'z124', name: 'Ya Afüvv', target: 100, category: 'Esmaül Hüsna', description: 'Günahları affeden, bağışlamayı seven.' },
  { id: 'z125', name: 'Ya Rauf', target: 100, category: 'Esmaül Hüsna', description: 'Çok merhametli, şefkatli ve lütufkar.' },
  { id: 'z126', name: 'Ya Malikül Mülk', target: 100, category: 'Esmaül Hüsna', description: 'Mülkün ebedi ve hakiki sahibi olan.' },
  { id: 'z127', name: 'Ya Zül Celali Vel İkram', target: 100, category: 'Esmaül Hüsna', description: 'Hem azamet (celal) hem de ikram sahibi yüce Yaratıcı.' },
  { id: 'z128', name: 'Ya Muksit', target: 100, category: 'Esmaül Hüsna', description: 'Bütün işlerini denk, adalete ve nizama uygun yapan.' },
  { id: 'z129', name: 'Ya Cami', target: 100, category: 'Esmaül Hüsna', description: 'İstediğini dilediği yerde toplayan, bir araya getiren.' },
  { id: 'z130', name: 'Ya Ganiyy', target: 100, category: 'Esmaül Hüsna', description: 'Çok zengin, hiçbir şeye ihtiyacı olmayan.' },
  { id: 'z131', name: 'Ya Mugni', target: 100, category: 'Esmaül Hüsna', description: 'Dilediğine zenginlik ve bolluk veren, tatmin eden.' },
  { id: 'z132', name: 'Ya Mani', target: 100, category: 'Esmaül Hüsna', description: 'Kötülükleri ve istenmeyen şeyleri engelleyen, mani olan.' },
  { id: 'z133', name: 'Ya Darr', target: 100, category: 'Esmaül Hüsna', description: 'Hikmeti gereği elem ve zarar verici şeyler yaratan.' },
  { id: 'z134', name: 'Ya Nafi', target: 100, category: 'Esmaül Hüsna', description: 'Fayda ve menfaat verici şeyler yaratan.' },
  { id: 'z135', name: 'Ya Nur', target: 100, category: 'Esmaül Hüsna', description: 'Alemleri nurlandıran, aydınlatan ışık kaynağı.' },
  { id: 'z136', name: 'Ya Hadi', target: 100, category: 'Esmaül Hüsna', description: 'Hidayete erdiren, doğru yolu gösteren.' },
  { id: 'z137', name: 'Ya Bedi', target: 100, category: 'Esmaül Hüsna', description: 'Eşsiz ve benzersiz güzellikte kâinatı yaratan.' },
  { id: 'z138', name: 'Ya Baki', target: 100, category: 'Esmaül Hüsna', description: 'Varlığının sonu olmayan, ebedi olan.' },
  { id: 'z139', name: 'Ya Varis', target: 100, category: 'Esmaül Hüsna', description: 'Her şeyin hakiki varisi, geriye kalan tek sahip.' },
  { id: 'z140', name: 'Ya Reşid', target: 100, category: 'Esmaül Hüsna', description: 'Bütün işleri irşat eden, doğru yola ulaştıran.' },
  { id: 'z141', name: 'Ya Sabur', target: 100, category: 'Esmaül Hüsna', description: 'Çok sabırlı olan, isyancılara azapta acele etmeyen.' },

  /* ================================================================
     SABAH — sadece sabah okunan özel zikirler
     ================================================================ */
  { 
    id: 'z142', name: 'Âmene\'r-Resûlü', target: 1, category: 'Sabah',
    description: 'Bakara Suresi\'nin son iki ayeti olup, gece yatarken veya sabah okunması büyük faziletler barındırır.'
  },
  { 
    id: 'z143', name: 'Radîtü billahi rabben', target: 3, category: 'Sabah',
    description: 'Anlamı: "Rab olarak Allah\'tan, din olarak İslam\'dan, peygamber olarak Hz. Muhammed\'den razı oldum." Sabah 3 kez okuyana cennet vacip olur.'
  },
  { 
    id: 'z144', name: 'Allahümme bike asbahna', target: 1, category: 'Sabah',
    description: 'Sabah vakti girdiğinde okunan, güne Allah\'ın koruması ve bereketiyle başlama duasıdır.'
  },
  { 
    id: 'z145', name: 'La ilahe illallah vahdehu la şerike leh', target: 10, category: 'Sabah',
    description: 'Sabah namazından sonra 10 defa okuyan kişi o gün boyunca her türlü kazadan ve şeytandan muhafaza olunur.'
  },

  /* ================================================================
     AKŞAM — sadece akşam okunan özel zikirler
     ================================================================ */
  { 
    id: 'z146', name: 'Allahümme bike emseyna', target: 1, category: 'Akşam',
    description: 'Akşam vaktine ulaşıldığında okunan, geceyi Allah\'ın himayesinde geçirme duasıdır.'
  },
  { 
    id: 'z147', name: 'Euzü bi kelimatillahit tammati', target: 3, category: 'Akşam',
    description: 'Akşam ezanından sonra 3 defa okunan bu dua, sabaha kadar hiçbir zararlı şeyin (zehir, haşere vs.) dokunmamasını sağlar.'
  },

  /* ================================================================
     SABAH & AKŞAM — ortak okunan sureler ve zikirler
     ================================================================ */
  { 
    id: 'z148', name: 'İhlâs Suresi', target: 3, category: 'Sabah & Akşam',
    description: 'Sabah ve akşam üçer defa okunması halinde her türlü kötülüğe ve belaya karşı yeterli koruma sağlar.'
  },
  { 
    id: 'z149', name: 'Felak Suresi', target: 3, category: 'Sabah & Akşam',
    description: 'Sabah ve akşam 3 kez okunarak sabah ve gece şerrinden, karanlığın ve nazarın kötülüğünden korunulur.'
  },
  { 
    id: 'z150', name: 'Nas Suresi', target: 3, category: 'Sabah & Akşam',
    description: 'İnsanların kalbine vesvese veren şeytanın şerrinden korunmak için sabah ve akşam üçer kez okunur.'
  },
  { 
    id: 'z151', name: 'Bismillahillezi la yedurru', target: 3, category: 'Sabah & Akşam',
    description: 'Sabah ve akşam 3\'er defa okuyana gökten ve yerden hiçbir bela ve musibet gelmez (Ebu Davud).'
  },

  /* ================================================================
     ŞÜKÜR — şükür zikirleri
     ================================================================ */
  { 
    id: 'z152', name: 'Elhamdülillahi rabbil alemin', target: 33, category: 'Şükür',
    description: 'Anlamı: "Alemlerin Rabbi olan Allah\'a hamdolsun." Fatiha suresinin de özünü oluşturan temel şükürdür.'
  },
  { 
    id: 'z153', name: 'Şükürler olsun Allah\'ım', target: 33, category: 'Şükür',
    description: 'Verilen sayısız nimetler karşısında kalpten gelen samimi teşekkür ve şükran ifadesidir.'
  },
  { 
    id: 'z154', name: 'Elhamdülillahi ala külli hal', target: 33, category: 'Şükür',
    description: 'Anlamı: "Her halükarda Allah\'a hamdolsun." Hem bollukta hem darlıkta hamdetme bilincini kazandırır.'
  },
  { 
    id: 'z155', name: 'Elhamdülillah', target: 1000, category: 'Şükür',
    description: 'Yoğun şükür seanslarında bin defa çekilerek nimetlerin katlanarak artmasına vesile olan zikirdir.'
  },

  /* ================================================================
     DUA — dua ayetleri
     ================================================================ */
  { id: 'z156', name: 'Rabbena atina fid dünya haseneten', target: 33, category: 'Dua', description: 'Kur\'an\'da geçen en kapsamlı dünya ve ahiret iyilik isteme duasıdır (Bakara Suresi, 201).' },
  { id: 'z157', name: 'Rabbi zidni ilma', target: 33, category: 'Dua', description: 'Anlamı: "Rabbim, ilmimi artır." Hz. Muhammed\'e doğrudan emredilen ilim artırma duasıdır (Taha Suresi, 114).' },
  { id: 'z158', name: 'Hasbiyallahu la ilahe illa hu', target: 100, category: 'Dua', description: 'Anlamı: "Bana Allah yeter, O\'ndan başka ilah yoktur." (Tevbe Suresi, 129).' },
  { id: 'z159', name: 'Allahümme inni es\'elükel afve vel afiye', target: 33, category: 'Dua', description: 'Dünya ve ahirette af, bağışlanma ve sağlık (afiyet) istemek için yapılan en güzel dualardandır.' },
  { id: 'z160', name: 'Rabbena heb lena min ezvacina', target: 33, category: 'Dua', description: 'Eşlerden ve çocuklardan göz aydınlığı ve hayır isteme duasıdır (Furkan Suresi, 74).' },
  { id: 'z161', name: 'Ya Hayyu ya Kayyum birahmetike esteğis', target: 33, category: 'Dua', description: 'Sıkıntılı anlarda Hz. Peygamber\'in imdat ve rahmet talebiyle okuduğu ism-i azam duasıdır.' },
  { id: 'z162', name: 'Allahümme inni es\'elükel cennete', target: 33, category: 'Dua', description: 'Cenneti istemek ve cehennemden sığınmak için yapılan samimi niyazdır.' },
  { id: 'z163', name: 'Allahümme ecirni minen nar', target: 7, category: 'Dua', description: 'Anlamı: "Allah\'ım beni cehennem ateşinden koru." Özellikle akşam ve sabah namazlarından sonra 7\'şer defa okunur.' },
  { id: 'z164', name: 'Rabbi yessir ve la tuassir', target: 33, category: 'Dua', description: 'Anlamı: "Rabbim kolaylaştır, zorlaştırma, rabbim işimi hayırla sonuçlandır." İşlerin kolaylaşması için çekilir.' },
  { id: 'z165', name: 'İnna lillahi ve inna ileyhi raciun', target: 33, category: 'Dua', description: 'Bir musibet veya kötü haber alındığında sabır ve teslimiyet amacıyla söylenir.' },
  { id: 'z166', name: 'Allahümme inni es\'elüke ilmen nafi\'an', target: 33, category: 'Dua', description: 'Faydalı ilim, helal rızık ve kabul olunmuş amel isteme duasıdır.' },
  { id: 'z167', name: 'Rabbena la tüziğ kulubena', target: 33, category: 'Dua', description: 'Kalplerin hidayet bulduktan sonra sapmasından Allah\'a sığınma duasıdır (Al-i İmran, 8).' },
  { id: 'z168', name: 'Rabbenâ âtinâ min ledünke rahmeten', target: 33, category: 'Dua', description: 'Katından rahmet ve işlerimizde kolaylık isteme duasıdır (Kehf Suresi, 10).' },
  { id: 'z169', name: 'Allahümme inni es\'elükessıhhate vel afiyete', target: 33, category: 'Dua', description: 'Sağlık, sıhhat ve afiyet dairesinde ömür sürmek için yapılan niyazdır.' },
  { id: 'z170', name: 'Allahümme inni eûzü bike minel hemmi vel hazen', target: 33, category: 'Dua', description: 'Kederden, hüzünden, acizlikten ve tembellikten Allah\'a sığınma duasıdır.' },
  { id: 'z171', name: 'Rabbena tekabbel minna', target: 33, category: 'Dua', description: 'Anlamı: "Rabbimiz, ibadetlerimizi ve dualarımızı kabul buyur." (Bakara Suresi, 127).' },
];

export const CATEGORIES = [
  'Tümü',
  'Favoriler',
  'Günlük',
  'Tesbihat',
  'İstiğfar',
  'Salavat',
  'Tevhid',
  'Esmaül Hüsna',
  'Sabah',
  'Akşam',
  'Sabah & Akşam',
  'Şükür',
  'Dua',
  'Kişisel',
];

export const SORT_OPTIONS = [
  { id: 'default', label: 'Varsayılan' },
  { id: 'alpha', label: 'Alfabetik (A-Z)' },
  { id: 'target-asc', label: 'Hedef (Küçükten Büyüğe)' },
  { id: 'target-desc', label: 'Hedef (Büyükten Küçüğe)' },
];

export const TARGET_OPTIONS = [1, 3, 7, 10, 11, 33, 40, 99, 100, 313, 500, 1000, 70000];