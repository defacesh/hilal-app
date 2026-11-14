// src/data/siyerData.js

export const SIYER_INFO = {
  title: "Siyer-i Nebi",
  subtitle: "Hz. Muhammed'in (s.a.v) Mübarek Hayatı",
  description: "Cahiliye döneminden başlayarak Efendimizin doğumu, gençliği, peygamberliği, gazveleri, diplomasi yılları, güzel ahlakı (şemaili) ve vedaına kadar uzanan en kapsamlı siyer-i nebi rehberi.",
  version: "2.0",
  totalPeriods: 12,
  note: "Bu rehber; İbn Hişâm'ın Sîretü'n-Nebeviyye'si, İbn Sa'd'ın Tabakât'ı, Taberî Tarihi, Buhârî-Müslim hadis mecmuaları ve çağdaş siyer çalışmaları (M. Hamidullah, İbrahim Sarıçam, Casim Avcı) esas alınarak hazırlanmıştır."
};

export const SIYER_PERIODS = [
  /* ============================================================
     DÖNEM 1: İSLAM ÖNCESİ (CAHİLİYYE)
     ============================================================ */
  {
    id: "islam-oncesi",
    title: "İslam Öncesi Dönem (Cahiliyye)",
    dateRange: "M.Ö. - 571",
    icon: "history",
    events: [
      {
        id: "e1_1",
        title: "Arap Yarımadası'nın Yapısı",
        date: "İslam Öncesi",
        description: "Arap yarımadası coğrafi olarak çöl iklimine sahipti. Siyasi birlik yoktu, kabilecilik (asabiyet) hakimdi. Bedevi (çöl) ve Hadari (şehirli) olmak üzere iki sosyal sınıf mevcuttu. Yarımada; kuzeyde Bizans, kuzeydoğuda Sasani (İran) ve güneyde Habeşistan gibi büyük imparatorluklar arasında sıkışmıştı.",
        lesson: "Coğrafya ve siyasi parçalanmışlık, İslam'ın birleştirici mesajının ne kadar kritik olduğunu gösterir.",
        reference: "İbn Hişâm, Sîre, I, 8-15."
      },
      {
        id: "e1_2",
        title: "Cahiliyye'de İnanç ve Putperestlik",
        date: "İslam Öncesi",
        description: "Toplumda putperestlik hakimdi. Kâbe'nin etrafında 360 put vardı (Hubel, Lat, Menat, Uzza en meşhurlarıydı). Hıristiyanlık, Yahudilik, Mecusilik ve Hz. İbrahim'in dinine inanan Hanifler azınlıktaydı. Yemen'de Hıristiyanlık, Medine ve Hayber'de Yahudilik yaygındı.",
        lesson: "Tevhid inancının kaybolduğu bir toplum, ahlakî çöküşün de eşiğindedir.",
        reference: "İbn Kelbî, Kitâbü'l-Asnâm; İbn Hişâm, Sîre, I, 60-85."
      },
      {
        id: "e1_3",
        title: "Neseb-i Şerif (Soy Ağacı)",
        date: "İslam Öncesi",
        description: "Efendimizin (s.a.v) soyu, Hz. İsmail (a.s) ve Hz. İbrahim'e (a.s) dayanır. Kureyş kabilesinin Haşimoğulları kolundandır. Babası Abdullah, annesi Vehb'in kızı Âmine'dir. Soy zinciri: Muhammed b. Abdullah b. Abdülmuttalib b. Hâşim b. Abdümenâf…",
        lesson: "Peygamberimiz en asil soydan gelmekle birlikte, üstünlüğün soyla değil takvâyla olduğunu vurgulamıştır.",
        reference: "İbn Hişâm, Sîre, I, 157-162."
      },
      {
        id: "e1_4",
        title: "Hz. İbrahim, İsmail ve Kâbe",
        date: "Tarihi Arka Plan",
        description: "Kâbe, Hz. İbrahim ve oğlu Hz. İsmail tarafından inşa edildi. Mekke, Zemzem suyunun çıkması ve Kâbe'nin inşasıyla kutsal bir ticaret ve hac merkezi haline geldi. Cürhüm kabilesi, ardından Kureyş kabilesi şehre yerleşti.",
        lesson: "Mekke'nin kutsallığı, Kâbe'yi inşa eden tevhid inancından gelir; bu miras asırlar sonra Hz. Muhammed ile yeniden diriltilecektir.",
        reference: "Kur'ân-ı Kerîm, Bakara 2/125-127; İbn Hişâm, Sîre, I, 112-125."
      },
      {
        id: "e1_5",
        title: "Fil Vakası ve Abdulmuttalib",
        date: "571",
        description: "Yemen Valisi Ebrehe, Kâbe'yi yıkmak için fillerle destekli bir orduyla Mekke'ye geldi. Efendimizin dedesi Abdulmuttalib dirayetli duruş sergiledi. Ebabil kuşları orduyu helak etti. Bu olay Kur'ân'da Fil Suresi'nde anlatılır ve Efendimizin doğduğu yıl 'Fil Yılı' olarak anılır.",
        lesson: "Allah, kendi evini korumaya kadirdir; Kâbe'yi yıkmaya gelen ordu helak edilmiştir.",
        reference: "Kur'ân-ı Kerîm, Fîl 105/1-5; İbn Hişâm, Sîre, I, 43-56."
      },
      {
        id: "e1_6",
        title: "Kureyş Kabilesi ve Mekke Yönetimi",
        date: "İslam Öncesi",
        description: "Kureyş, Mekke'nin en güçlü kabilesiydi. Kabile içinde; hicâbe (Kâbe'nin anahtarlarını koruma), sikâye (hacılara su verme), rifâde (hacılara yemek verme), nedve (istişare meclisi), livâ (sancak), kıyâde (ordu komutanlığı) gibi görevler paylaşılmıştı. Bu görevler nüfuz mücadelesinin temelini oluşturuyordu.",
        lesson: "Görev paylaşımı olmasına rağmen adalet yoktu; İslam, kabile asabiyetini ümmet bilinciyle değiştirdi.",
        reference: "İbn Hişâm, Sîre, I, 128-142."
      },
      {
        id: "e1_7",
        title: "Cahiliyye'de Kadın ve Köle",
        date: "İslam Öncesi",
        description: "Kadınlar mirastan pay alamaz, kız çocukları diri diri toprağa gömülürdü (ve'd). Köleler ve cariyeler en ağır işlerde çalıştırılır, ticaret malı gibi alınıp satılırdı. Evlilikte kadının rızası aranmaz, çok eşlilik sınırsızdı.",
        lesson: "İslam; kız çocuklarını koruyan, kadına miras ve mülk hakkı tanıyan, köle azadını teşvik eden devrimci hükümler getirmiştir.",
        reference: "Kur'ân-ı Kerîm, Nahl 16/58-59, Tekvîr 81/8-9; Buhârî, Nikâh."
      },
      {
        id: "e1_8",
        title: "Cahiliyye'de Ahlak ve Edebiyat",
        date: "İslam Öncesi",
        description: "Araplar söz sanatında (belâgat) çok ileriydi; Ukâz panayırlarında şiir yarışmaları düzenlenir, Kâbe duvarına 'Muallakât-ı Seb'a' asılırdı. Bununla birlikte; yalan, hile, içki, kumar, zinâ ve kan davası yaygındı. Cömertlik, misafirperverlik ve sözünde durma gibi erdemler de mevcuttu.",
        lesson: "İslam; Arap dilinin belâgatını Kur'ân'ın mucizevî üslubuyla taçlandırmış, ahlakî zaafları da ıslah etmiştir.",
        reference: "Câhız, el-Beyân ve't-Tebyîn; İbn Kuteybe, eş-Şi'r ve'ş-Şuarâ."
      }
    ]
  },

  /* ============================================================
     DÖNEM 2: DOĞUMU, ÇOCUKLUĞU VE GENÇLİĞİ
     ============================================================ */
  {
    id: "dogum-genclik",
    title: "Doğumu, Çocukluğu ve Gençliği",
    dateRange: "571 - 610",
    icon: "baby-carriage",
    events: [
      {
        id: "e2_1",
        title: "Dünyaya Teşrifi",
        date: "571 (12 Rebiülevvel)",
        description: "Mekke'de Rebiülevvel ayının 12. gecesinde (Fil Yılı) dünyaya geldi. Babası Abdullah, O henüz doğmadan vefat etmişti. Dedesi O'na 'Muhammed' (Çok övülen) ismini verdi. Doğduğu gece İran'da Kisra'nın sarayında bazı sütunlar yıkıldığı, Sâve Gölü'nün kuruduğu gibi rivayetler sahih kaynaklarda yer alır.",
        lesson: "Peygamberimiz yetim olarak doğdu; yetimliğin zillet değil, şefkate vesile olduğunu hayatı boyunca gösterdi.",
        reference: "İbn Hişâm, Sîre, I, 157-168; İbn Sa'd, Tabakât, I, 100."
      },
      {
        id: "e2_2",
        title: "Sütanne Halime ve Şakk-ı Sadr",
        date: "571 - 575",
        description: "Mekke'nin iklimi ağır olduğu için çölde Halime hatuna sütanne olarak verildi. Orada bereket kaynağı oldu; koyunları süt verdi, evlerine bolluk geldi. Göğsünün yarılıp kalbinin yıkanması (Şakk-ı Sadr) hadisesi bu çölde gerçekleşti. Bu olay, ileride nübüvvet için manevî hazırlık olarak yorumlanır.",
        lesson: "Allah, peygamberini küçük yaştan itibaren özel bir terbiyeyle yetiştirmiştir.",
        reference: "Müslim, Îmân, 261; İbn Hişâm, Sîre, I, 172-176."
      },
      {
        id: "e2_3",
        title: "Annesi ve Dedesinin Vefatı",
        date: "577 - 579",
        description: "6 yaşında annesi Âmine hatun ile Medine'den dönerken Ebvâ'da annesini kaybetti. Annesinin kabri başında gözyaşı döktü. 8 yaşına kadar dedesi Abdulmuttalib'in yanında kaldı. Onun vefatıyla amcası Ebû Tâlib'in himayesine girdi. Artık hem yetim hem öksüzdü.",
        lesson: "Peygamberimizin çocukluk acıları, ileride yetimlere ve kimsesizlere şefkat göstermesinin temeli olmuştur.",
        reference: "İbn Hişâm, Sîre, I, 177-180; Buhârî, Cenâiz."
      },
      {
        id: "e2_4",
        title: "Çobanlık Yılları",
        date: "575 - 583",
        description: "Genç yaşta amcalarının koyunlarını güttü. 'Her peygamber koyun gütmüştür' hadisiyle çobanlığın peygamberlik mesleğinin ortak bir özelliği olduğunu bildirmiştir. Çobanlık, sabrı, sorumluluğu, tabiatı gözlemlemeyi ve yumuşak huyluluğu öğretir.",
        lesson: "Sorumluluk ve sabır, küçük yaşta başlayan bir eğitim sürecidir.",
        reference: "Buhârî, İcâre; İbn Hişâm, Sîre, I, 181."
      },
      {
        id: "e2_5",
        title: "Ticaret ve Rahip Bahira",
        date: "583",
        description: "12 yaşındayken amcası ile Şam kervanına katıldı. Busra'da Rahip Bahira O'ndaki peygamberlik mührünü ve bulut mucizesini görerek amcasını O'nu koruması için uyardı. Bu olay, genç Muhammed'in ne kadar dikkat çekici bir ahlaka sahip olduğunu gösterir.",
        lesson: "Ahlak ve dürüstlük, yaşça küçük olsa bile insanı fark ettirir.",
        reference: "İbn Hişâm, Sîre, I, 187-190; Tirmizî, Menâkıb."
      },
      {
        id: "e2_6",
        title: "Ficar Savaşları ve Hilfü'l-Fudûl",
        date: "590",
        description: "Kureyş ile Hevazin arasındaki Ficar savaşlarına gençken katıldı ama sadece atılan okları topladı; kan dökmedi. Ardından Mekke'de mazlumları korumak için kurulan Erdemliler İttifakı'na (Hilfü'l-Fudûl) dahil oldu. Bu ittifak, Mekke'de zulme uğrayanların hakkını korumayı amaçlıyordu.",
        lesson: "Hak ve adaletin yanında yer almak, Hz. Peygamber'in gençliğinin en belirgin vasfıdır.",
        reference: "İbn Hişâm, Sîre, I, 121-128; İbn Sa'd, Tabakât, I, 128-129."
      },
      {
        id: "e2_7",
        title: "Hz. Hatice ile Evliliği",
        date: "595",
        description: "Ticaretteki dürüstlüğü 'Muhammedü'l-Emîn' olarak bilinmesini sağladı. 25 yaşında iken, 40 yaşındaki Hz. Hatice ile evlendi. Hz. Hatice, ona ilk iman eden, ilk destekçisi ve en sadık hayat arkadaşı oldu. Kâsım, Abdullah, Zeynep, Rukiyye, Ümmü Gülsüm ve Fâtıma doğdu.",
        lesson: "Evlilikte esas olan; yaş, mal veya soy değil, ahlak ve karşılıklı güvendir.",
        reference: "Buhârî, Nikâh; İbn Hişâm, Sîre, I, 188-191."
      },
      {
        id: "e2_8",
        title: "Kâbe Hakemliği",
        date: "605",
        description: "Kâbe'nin onarımı sonrası Hacerü'l-Esved'i kimin yerine koyacağı kavgası hakemliği ile çözüldü. Taşı bir örtüye koydurup her kabileye tutturdu, kendi elleriyle yerleştirdi. Bu olay, O'nun Mekke'de ne kadar güvenilir ve saygın olduğunu gösterir.",
        lesson: "Adalet ve dirayet, çatışmaları çözmenin anahtarıdır.",
        reference: "İbn Hişâm, Sîre, I, 192-197."
      },
      {
        id: "e2_9",
        title: "Hira Mağarası İnzivası",
        date: "605 - 610",
        description: "Peygamberlik gelmeden önceki son yıllarında, Ramazan aylarında Nur Dağı'ndaki Hira mağarasına çekilerek derin tefekküre (tahannüs) dalmaya başladı. Toplumun putperestliğinden, ahlakî çöküntüsünden rahatsızlık duyuyor, hakikati arıyordu. Bu dönem, vahyin gelmesine manevî hazırlık dönemiydi.",
        lesson: "Hakikati arayan kalp, vahye muhatap olur.",
        reference: "Buhârî, Bed'ü'l-Vahy, 3; İbn Hişâm, Sîre, I, 236-237."
      },
      {
        id: "e2_10",
        title: "Gençliğinde Ahlakı",
        date: "590 - 610",
        description: "Cahiliye toplumunda yaşamasına rağmen putlara secde etmedi, içki içmedi, kumar oynamadı, yalan söylemedi. Ticarette aldatmadı, emanete ihanet etmedi. 'el-Emîn' (en güvenilir) lakabını aldı. Neslinin en güzel ahlaklısı, en iffetlisi ve en doğru sözlüsü olarak tanındı.",
        lesson: "Ahlak; içinde yaşanılan toplumun değil, kişinin kendi tercihinin ürünüdür.",
        reference: "İbn Hişâm, Sîre, I, 183-186; Ahmed b. Hanbel, Müsned."
      },
      {
        id: "e2_11",
        title: "Ümmü Eymen'in Himayesi",
        date: "577 - 590",
        description: "Babasından kalan Ümmü Eymen (Bereke), Peygamberimizin çocukluğunda ve gençliğinde ona baktı. Peygamberimiz ona 'Annemden sonra annem' diyerek hitap ederdi. Vefatına kadar onu gözetledi, oğlu Üsâme b. Zeyd'i de yanında büyüttü.",
        lesson: "Peygamberimizin vefakârlığı, kendisine hizmet edenlere ömrü boyunca sürmüştür.",
        reference: "İbn Sa'd, Tabakât, VIII, 222-226."
      },
      {
        id: "e2_12",
        title: "Ticaret Hayatı ve Güvenilirliği",
        date: "595 - 610",
        description: "Hz. Hatice'nin kervanlarını yönetti, Şam ve Yemen'e ticaret yolculukları yaptı. Ticarette helal-haram sınırlarına titizlik gösterdi. Kervan ortakları onun dürüstlüğünü itiraf etti. Bu sayede hem büyük kazanç sağladı hem de toplumda güvenilirliği arttı.",
        lesson: "Ticarette ahlak, hem dünya hem ahiret kazancının anahtarıdır.",
        reference: "İbn Hişâm, Sîre, I, 188; İbn Sa'd, Tabakât, I, 130."
      },
      {
        id: "e2_13",
        title: "Hz. Ali'nin Terbiyesi",
        date: "605 - 610",
        description: "Amcası Ebû Tâlib'in yoksulluğu sebebiyle oğlu Hz. Ali'yi yanına aldı ve onu büyüttü. Hz. Ali, Peygamberimizin yanında büyüyen, ilk Müslüman çocuk olan ve İslam tarihinde derin iz bırakan bir şahsiyet oldu. Peygamberimiz onu 'Ben ilmin şehriyim, Ali onun kapısıdır' diye övmüştür.",
        lesson: "Bir yetimi himaye etmek, toplumun en hayırlı fertlerinin yetişmesine vesile olur.",
        reference: "Tirmizî, Menâkıb; İbn Sa'd, Tabakât, I, 134."
      },
      {
        id: "e2_14",
        title: "Zeyd b. Hârise'nin Evlatlığı",
        date: "605",
        description: "Hz. Hatice'nin kölesi olan Zeyd b. Hârise'yi satın alıp azat etti ve evlat edindi. Bir süre 'Zeyd b. Muhammed' olarak anıldı; ancak kölelik ve evlatlık hükümlerinin ilgasıyla 'Zeyd b. Hârise' olarak anılmaya devam etti. Zeyd, Peygamberimizin en sadık sahabelerinden oldu.",
        lesson: "İslam, kölelik kurumunu eğitim ve tedricî hükümlerle ortadan kaldırma yoluna gitmiştir.",
        reference: "İbn Hişâm, Sîre, I, 190; Ahzâb 33/4-5."
      }
    ]
  },

  /* ============================================================
     DÖNEM 3: MEKKE DÖNEMİ VE NÜBÜVVET
     ============================================================ */
  {
    id: "mekke-nübüvvet",
    title: "Mekke Dönemi ve Nübüvvet",
    dateRange: "610 - 622",
    icon: "book-open-variant",
    events: [
      {
        id: "e3_1",
        title: "İlk Vahiy ve İnfıtâr",
        date: "610 (Ramazan)",
        description: "40 yaşında Hira Mağarası'nda Cebrail (a.s) aracılığıyla Alak Suresi'nin ilk 5 ayeti geldi ('Oku!'). Korkuyla eve dönüp Hz. Hatice'ye sığındı. Hz. Hatice onu teselli etti, amcası Varaka b. Nevfel onun peygamber olduğunu söyledi. Kısa bir vahiy kesintisi (Fetretü'l-Vahiy) yaşandı.",
        lesson: "İlk emir 'Oku'dur; İslam, cehalete karşı ilmi ve öğrenmeyi emreder.",
        reference: "Buhârî, Bed'ü'l-Vahy, 1-3; İbn Hişâm, Sîre, I, 250-255."
      },
      {
        id: "e3_2",
        title: "Fetretü'l-Vahiy (Vahyin Kesilmesi)",
        date: "610",
        description: "İlk vahiyden sonra bir süre vahiy kesildi. Peygamberimiz bu dönemde büyük üzüntü duydu, kendini yer yer yüksek yerlerden atmak istediği anlar oldu. Ancak sonunda 'Ey örtünüp bürünen! Kalk ve uyar!' (Müddessir 1-7) ayetleri nazil oldu ve vahiy düzenli hale geldi.",
        lesson: "Allah, kulunu zorluklarla olgunlaştırır; sabır sonunda ferahlık gelir.",
        reference: "Buhârî, Bed'ü'l-Vahy; Müddessir 74/1-7."
      },
      {
        id: "e3_3",
        title: "Gizli Davet ve Daru'l-Erkam",
        date: "610 - 613",
        description: "Müddessir Suresi ile tebliğ emredildi. 3 yıl gizli davet yapıldı. Safa tepesi eteklerindeki Erkam'ın Evi (Daru'l-Erkam) İslâm'ın ilk gizli karargâhı ve mektebi oldu. Hz. Ebubekir, Hz. Ali, Hz. Zeyd, Hz. Hatice gibi ilk Müslümanlar burada yetişti.",
        lesson: "Davet; hikmetle, tedricî ve ortamın şartlarına uygun yapılır.",
        reference: "İbn Hişâm, Sîre, I, 260-290."
      },
      {
        id: "e3_4",
        title: "İlk Müslümanlar",
        date: "610",
        description: "İslam'ı ilk kabul edenler: Hz. Hatice (ilk Müslüman hanım), Hz. Ebubekir (ilk Müslüman erkek), Hz. Ali (ilk Müslüman çocuk), Hz. Zeyd b. Hârise (ilk Müslüman azatlı). Sonra Hz. Osman, Hz. Talha, Hz. Zübeyir, Abdurrahman b. Avf, Sad b. Ebi Vakkas, Ebu Ubeyde gibi sahabeler geldi.",
        lesson: "İslam, kadın-erkek, çocuk-yetişkin, hür-köle ayrımı yapmaksızın herkese hitap eder.",
        reference: "İbn Hişâm, Sîre, I, 265-275; İbn Sa'd, Tabakât, III."
      },
      {
        id: "e3_5",
        title: "Açık Davet ve Safa Tepesi",
        date: "613",
        description: "'Sana emrolunanı açıkça söyle' ayetiyle Safa Tepesi'ne çıkarak tüm Mekke'ye açık davet yaptı. Ebu Leheb şiddetle karşı çıktı ve husumet dönemi başladı. 'Tebbet' suresi Ebu Leheb ve karısı hakkında nazil oldu.",
        lesson: "Hak söylemek, bedeli olsa bile ertelenemez; peygamberler en yakın akrabalarına karşı bile hakkı tebliğ etmiştir.",
        reference: "İbn Hişâm, Sîre, I, 280-282; Şuarâ 26/214; Tebbet 111/1-5."
      },
      {
        id: "e3_6",
        title: "İşkenceler ve İlk Şehitler",
        date: "614 - 615",
        description: "Müşrikler zayıf Müslümanlara işkenceye başladı. Hz. Bilal, kızgın kumlara yatırıldı. Hz. Yasir ve eşi Hz. Sümeyye, Ebu Cehil tarafından şehit edilerek İslam'ın ilk şehitleri oldular. Hz. Ammar b. Yâsir ağır işkenceler gördü ama davasından dönmedi. Bu dönem 'Sabır Müslümanlığı' dönemiydi.",
        lesson: "İman, işkence karşısında bile dönmeyen bir kararlılıktır.",
        reference: "İbn Hişâm, Sîre, I, 317-320; İbn Sa'd, Tabakât, III, 233-239."
      },
      {
        id: "e3_7",
        title: "Habeşistan Hicretleri",
        date: "615 - 616",
        description: "Zulüm artınca Efendimizin izniyle Müslümanlar adil kral Necaşi'nin ülkesi Habeşistan'a (Etiyopya) 2 kafile halinde hicret etti. Cafer bin Ebi Talip, krala mükemmel bir savunma yaptı; Meryem Suresi'ni okuyunca Necaşi ve papazlar ağladı. Necaşi, Müslümanları koruma altına aldı.",
        lesson: "Zulüm karşısında hicret etmek, dini yaşama özgürlüğünü korumanın meşru yoludur.",
        reference: "İbn Hişâm, Sîre, I, 343-365; Ahmed b. Hanbel, Müsned."
      },
      {
        id: "e3_8",
        title: "Hz. Hamza ve Hz. Ömer",
        date: "616",
        description: "Peygamberimize yapılan hakarete öfkelenen amcası Hz. Hamza Müslüman oldu ve Müslümanlar ilk kez güçlü bir koruyucu kazandı. Ardından Efendimizi öldürmeye giderken yolda duyduğu Kur'an'dan etkilenen Hz. Ömer'in İslam'a girmesiyle Müslümanlar Kâbe'de açıkça namaz kıldı. İslam, Ömer'le izzet buldu.",
        lesson: "Allah, İslam'ı bazen en beklenmedik kimselerle güçlendirir.",
        reference: "İbn Hişâm, Sîre, I, 315-330; İbn Sa'd, Tabakât, III, 267-275."
      },
      {
        id: "e3_9",
        title: "Boykot (Şe'b-i Ebi Talib)",
        date: "616 - 619",
        description: "Müşrikler, Haşimoğulları'nı Ebu Talip mahallesine sürerek 3 yıl süren acımasız bir sosyal ve ekonomik boykot (ambargo) uyguladı. Boykot belgesi Kâbe'ye asıldı. Ağaç yaprakları yenmek zorunda kalındı, çocukların sesi duyuldu. Ancak sonunda belgeyi güve yemiş olarak bulundu ve boykot kaldırıldı.",
        lesson: "Zulmün ömrü kısa, mazlumun duası kabuldür.",
        reference: "İbn Hişâm, Sîre, I, 350-380; İbn Sa'd, Tabakât, I, 209."
      },
      {
        id: "e3_10",
        title: "Hüzün Yılı",
        date: "619",
        description: "Boykotun bitmesinden kısa süre sonra Efendimizin (s.a.v) en büyük destekçileri olan amcası Ebu Talip ve çok sevdiği eşi Hz. Hatice art arda vefat etti. Bu yıla Hüzün Yılı denildi. Peygamberimiz aynı yıl içinde iki büyük dayanağını kaybetti; buna rağmen tebliğden geri durmadı.",
        lesson: "Musibetler imanı zayıflatmaz, aksine sabrı ve teslimiyeti artırır.",
        reference: "İbn Hişâm, Sîre, II, 57-60; İbn Sa'd, Tabakât, I, 209-211."
      },
      {
        id: "e3_11",
        title: "Taif Yolculuğu ve Addas",
        date: "620",
        description: "Zeyd bin Harise ile Taif'e tebliğe gitti. Sakîf kabilesi kendisini ağır hakaretlerle taşlayarak şehirden attı. Zeyd onu korumaya çalıştı. Dinlendiği bağda Hıristiyan köle Addas Müslüman oldu. Efendimiz Taif'in helakına değil ıslahına dua etti: 'Allah'ım! Bu kavmi hidayete erdir, çünkü onlar bilmiyorlar.'",
        lesson: "Tebliğ; güzel söz ve sabırla yapılır, beddua değil dua ile yapılır.",
        reference: "İbn Hişâm, Sîre, II, 60-64; Buhârî, Bed'ü'l-Halk."
      },
      {
        id: "e3_12",
        title: "İsra ve Miraç Mucizesi",
        date: "621 (27 Recep)",
        description: "Mescid-i Haram'dan Kudüs'teki Mescid-i Aksa'ya (İsra), oradan gök katmanlarına ve Sidretü'l-Münteha'ya (Miraç) yükseltildi. Beş vakit namaz ve Bakara Suresinin son ayetleri bu gece ihsan edildi. Bu olay, Hüzün Yılı ve Taif sonrası en büyük manevî teselliydi. Ebubekir tereddüt etmeden inandığı için 'Sıddîk' lakabını aldı.",
        lesson: "Namaz, mü'minin miracıdır; en büyük manevî yükseliş ibadettedir.",
        reference: "İsrâ 17/1; Necm 53/1-18; Buhârî, Salât; Müslim, Îmân."
      },
      {
        id: "e3_13",
        title: "Akabe Biatları",
        date: "621 - 622",
        description: "Medine'den hacca gelen Evs ve Hazrec kabileleri Akabe'de Efendimizle gizlice buluşup iman ettiler, koruma sözü vererek (I. ve II. Akabe Biatları) Medine'ye hicretin kapısını açtılar. II. Akabe Biatı'nda 12 kişi Medine'ye muallim olarak gönderildi; İslam ilk kez bir şehirde yerleşti.",
        lesson: "Davetin başarısı, doğru zamanda doğru insanlarla buluşmaktır.",
        reference: "İbn Hişâm, Sîre, II, 291-311."
      },
      {
        id: "e3_14",
        title: "Mus'ab b. Umeyr'in Medine'ye Gönderilmesi",
        date: "621",
        description: "I. Akabe Biatı sonrası Mus'ab b. Umeyr, Medine'ye İslam'ı öğretmek üzere muallim olarak gönderildi. Medine'nin en zengin ailelerinden gelen Mus'ab, bir yıl içinde Medine'de İslam'ın yayılmasına öncülük etti. Medine, hicretten önce İslam'ı kabul etmeye hazır hale geldi.",
        lesson: "Bir muallim, bir şehrin kaderini değiştirebilir.",
        reference: "İbn Hişâm, Sîre, II, 295-300."
      },
      {
        id: "e3_15",
        title: "Cebrail'in Öğrettiği Namaz",
        date: "610 - 615",
        description: "Namaz, ilk vahiyden sonra Cebrail (a.s) tarafından Peygamberimize öğretildi. Başlangıçta ikişer rekât kılınıyordu; Miraç'ta beş vakte indirildi. Müslümanlar, açıktan secde edemiyordu; gizli yerlerde kılıyorlardı. Kâbe'de açık namaz için aylar geçmesi gerekti.",
        lesson: "Namaz, İslam'ın ilk ve en temel ibadetidir.",
        reference: "Buhârî, Salât; Müslim, Salât."
      },
      {
        id: "e3_16",
        title: "Sahabe'nin Sabrı ve Dayanışması",
        date: "613 - 622",
        description: "Mekke'de Müslümanlar; işkence, boykot, alay ve sürgünle karşılaştı. Ebubekir malıyla, Ömer gücüyle, Hamza cesaretiyle, Hatice servetiyle, Bilal sabrıyla, Ammar azmiyle İslam'a hizmet etti. Bu sabır, İslam'ın temelini sağlamlaştırdı.",
        lesson: "İslam'ın ilk yıllarındaki sabır, sonraki zaferlerin temelidir.",
        reference: "İbn Hişâm, Sîre, I, 317-350; İbn Sa'd, Tabakât, III."
      },
      {
        id: "e3_17",
        title: "Yeni Vahiyler ve Sureler",
        date: "610 - 622",
        description: "Mekke döneminde inen sureler kısa, veciz, iman ve ahlak konulu idi. Alak, Kalem, Müzzemmil, Müddessir, Fatiha, Kevser, İhlas, Felak, Nas gibi sureler bu dönemde nazil oldu. Bu sureler; tevhid, ahiret, ahlak ve sabır temalarını işledi. Kur'an'ın ilk muhatapları bunları ezberleyerek öğrendi.",
        lesson: "Kur'an, indiği toplumun ihtiyacına göre tedricî olarak inmiştir.",
        reference: "Kur'ân-ı Kerîm; Zürkânî, Menâhilü'l-İrfân."
      },
      {
        id: "e3_18",
        title: "Cinlerin İslam'ı Kabulü",
        date: "620",
        description: "Peygamberimiz Taif dönüşünde Batn-ı Nahle'de gecelerken bir grup cin Kur'an dinledi ve iman etti. Bu olay Cin Suresi'nde anlatılır. Cinlerin imanı, İslam'ın sadece insanlara değil bütün mahlûkata hitap ettiğini gösterir.",
        lesson: "Tebliğ, insanüstü varlıklara da ulaşır; Kur'an bütün âlemlere hitaptır.",
        reference: "Cin 72/1-15; İbn Hişâm, Sîre, II, 64-65."
      },
      {
        id: "e3_19",
        title: "Medine'ye Hicret İzni",
        date: "622",
        description: "II. Akabe Biatı sonrası Efendimiz, Mekke'deki zulüm artınca Müslümanlara Medine'ye hicret izni verdi. Müslümanlar gizli gruplar halinde Medine'ye göç ettiler. Kısa sürede Medine'de büyük bir Müslüman topluluk oluştu.",
        lesson: "Hicret, sadece bir göç değil, İslam devletinin temelinin atılmasıdır.",
        reference: "İbn Hişâm, Sîre, II, 311-320."
      },
      {
        id: "e3_20",
        title: "Dârünnedve Suikast Planı",
        date: "622",
        description: "Mekke müşrikleri, Dârünnedve'de toplanarak Peygamberimizi öldürme kararı aldılar. Her kabileden bir gencin katılacağı ortak bir suikast planlandı; böylece Haşimoğulları tek başına intikam alamayacaktı. Ancak Allah, Peygamberimizi korudu ve hicret gecesi plan bozuldu.",
        lesson: "Allah, peygamberini korur; tuzak kuranlar kendi tuzaklarına düşer.",
        reference: "İbn Hişâm, Sîre, II, 320-327; Enfâl 8/30."
      }
    ]
  },

  /* ============================================================
     DÖNEM 4: HİCRET VE MEDİNE'YE VARIŞ
     ============================================================ */
  {
    id: "hicret-medine",
    title: "Hicret ve Medine'ye Varış",
    dateRange: "622",
    icon: "walk",
    events: [
      {
        id: "e4_1",
        title: "Hicret Kararı ve Sevr Mağarası",
        date: "622",
        description: "Müşriklerin Dârünnedve'deki suikast planı üzerine yatağına Hz. Ali'yi bırakarak Hz. Ebu Bekir ile hicrete çıktı. Sevr Mağarası'nda 3 gün gizlendiler; bir örümcek ve güvercin mağarayı korudu. Müşrikler mağaranın ağzına kadar geldi; Ebubekir endişelendiğinde Peygamberimiz 'Üzülme, Allah bizimle beraberdir' dedi.",
        lesson: "Tevekkül; tedbir alındıktan sonra Allah'a güvenmektir.",
        reference: "Tevbe 9/40; Buhârî, Menâkıb; İbn Hişâm, Sîre, II, 327-337."
      },
      {
        id: "e4_2",
        title: "Sürâka b. Mâlik'in Takibi",
        date: "622",
        description: "Müşrikler Peygamberimizi yakalayana 100 deve ödül koydu. Sürâka b. Mâlik atıyla takip etti; tam yakalayacakken atının ayakları kuma saplandı. Peygamberimizden eman diledi ve kendilerine dokunulmadı. Sürâka, ileride Müslüman oldu ve İran fethine katıldı.",
        lesson: "Allah'ın koruduğunu kimse yakalayamaz; düşman bile zamanla dost olabilir.",
        reference: "Buhârî, Menâkıb; İbn Hişâm, Sîre, II, 337-341."
      },
      {
        id: "e4_3",
        title: "Ümmü Ma'bed'in Çadırı",
        date: "622",
        description: "Hicret yolunda Ümmü Ma'bed'in çadırında konakladılar. Kuru koyunun memesinden süt sağıldı (mucize). Ümmü Ma'bed, Peygamberimizi tarif etti; bu tarif 'Hilye-i Şerif' literatürünün kaynaklarından biri oldu. Eşi ve oğlu ileride Müslüman oldu.",
        lesson: "Peygamberimizin bereketi, uğradığı her yere yansımıştır.",
        reference: "İbn Hişâm, Sîre, II, 341-344; İbn Sa'd, Tabakât, I, 231."
      },
      {
        id: "e4_4",
        title: "Kuba Mescidi ve Cuma Namazı",
        date: "622",
        description: "Medine'ye girmeden önce Kuba köyünde konaklayıp İslam'ın ilk mescidini inşa etti. Bu mescidin temeli takvâ üzere atıldı (Tevbe 108). Oradan Ranuna vadisine geçerek İslam tarihinin ilk Cuma namazını kıldırdı; ilk hutbeyi okudu.",
        lesson: "İlk mescidin inşası, İslam'ın sosyal hayata verdiği önemin göstergesidir.",
        reference: "Tevbe 9/108; İbn Hişâm, Sîre, II, 344-347."
      },
      {
        id: "e4_5",
        title: "Medine'ye Giriş",
        date: "622",
        description: "Yesrib halkı Efendimizi (s.a.v) 'Taleal Bedru Aleyna' ilahileriyle, coşkuyla karşıladı. Şehrin adı Medine-i Münevvere (Nurlanmış Şehir) oldu. Devesi Kusva'nın çöktüğü Ebu Eyyub el-Ensari'nin evine misafir oldu. Yedi ay orada kaldı.",
        lesson: "Medine halkının gösterdiği muhabbet, Ensar'ın fedakârlığının ilk işaretidir.",
        reference: "İbn Hişâm, Sîre, II, 348-353; Buhârî, Menâkıb."
      },
      {
        id: "e4_6",
        title: "Mescid-i Nebevi ve Suffe",
        date: "623",
        description: "İslam devletinin merkezi olan Mescid-i Nebevi inşa edildi. Kerpiçten, hurma dallarından yapıldı; basit ama fonksiyoneldi. Mescidin bitişiğine kimsesiz fakir sahabelerin kalıp ilim öğrendiği Suffe Mektebi kuruldu. Mescid, aynı zamanda idare merkezi, mahkeme, ordu karargâhı ve ilim meclisiydi.",
        lesson: "Mescid, İslam toplumunun kalbi ve merkezidir.",
        reference: "İbn Hişâm, Sîre, II, 353-359; Buhârî, Salât."
      },
      {
        id: "e4_7",
        title: "İlk Ezan ve Bilâl-i Habeşî",
        date: "623",
        description: "Namaz vaktinin duyurulması için ezan meşru kılındı. Hz. Bilâl-i Habeşî, İslam'ın ilk müezzini oldu. Sesi güzel ve gürdü. Peygamberimiz 'Bilâl'in sesini işittiğinizde onun söylediğini tekrar edin' buyurmuştur. Bilâl, İslam'da kölelikten müezzinliğe yükselen bir semboldür.",
        lesson: "İslam'da üstünlük; ırk, renk veya sosyal sınıf değil takvâ iledir.",
        reference: "Buhârî, Ezan; İbn Sa'd, Tabakât, III, 232-239."
      },
      {
        id: "e4_8",
        title: "Muahat ve Medine Sözleşmesi",
        date: "623",
        description: "Mekke'den gelen Muhacirler ile Medineli Ensar arasında eşsiz bir kardeşlik (Muahat) kuruldu. Her Muhacir bir Ensar kardeşiyle eşleştirildi; mallar paylaşıldı. Medine'deki Yahudiler ve müşriklerle tarihin ilk yazılı anayasası olan 'Medine Sözleşmesi' imzalandı. Bu sözleşme; din ve vicdan hürriyeti, can-mal güvenliği, savunma işbirliği gibi esaslar içeriyordu.",
        lesson: "İslam, farklı inanç gruplarıyla bir arada yaşamanın hukukî temelini ilk kez Medine'de kurmuştur.",
        reference: "İbn Hişâm, Sîre, II, 360-370; M. Hamidullah, el-Vesâiku's-Siyâsiyye."
      },
      {
        id: "e4_9",
        title: "Medine Dönemi İlk Yılların Zorlukları",
        date: "622 - 624",
        description: "Muhacirler yoksullukla boğuşuyordu; birçoğu Suffe'de kalıyor, günlerce yiyecek bulamıyordu. Medine'de humma salgını vardı. Yahudiler ve münafıklar içten içe karışıklık çıkarıyordu. Ancak Müslümanlar, sabır ve kardeşlik ruhuyla bu zorlukları aştı.",
        lesson: "İslam toplumu, zorlukları kardeşlik ve dayanışma ile aşar.",
        reference: "Buhârî, Menâkıb-ı Ensâr; İbn Hişâm, Sîre, II, 370-380."
      },
      {
        id: "e4_10",
        title: "Abdullah b. Selâm'ın İslam'a Girişi",
        date: "622 - 623",
        description: "Medine'nin en büyük Yahudi âlimlerinden Abdullah b. Selâm, Peygamberimizi görür görmez 'Bu yüz yalan bir yüz değildir' diyerek Müslüman oldu. Yahudi cemaatinden birçoğu da ardından iman etti. Bu olay, Peygamberimizin vasfının Tevrat'ta da bildirildiğini gösteren önemli bir hadisedir.",
        lesson: "Hakikati arayan âlim, hakikati görünce tereddüt etmez.",
        reference: "Buhârî, Menâkıb; İbn Hişâm, Sîre, II, 373."
      }
    ]
  },

  /* ============================================================
     DÖNEM 5: MEDİNE DÖNEMİ: GAZVE VE SERİYYELER
     ============================================================ */
  {
    id: "medine-gazveler",
    title: "Medine Dönemi: Gazve ve Seriyyeler",
    dateRange: "622 - 632",
    icon: "sword-cross",
    events: [
      {
        id: "e5_1",
        title: "Kıblenin Değişimi",
        date: "624 (Şaban)",
        description: "16 ay boyunca Mescid-i Aksa'ya kılınan namaz, Mescid-i Kıbleteyn'de öğle namazı esnasında inen vahiyle Mescid-i Haram'a (Kâbe) çevrildi. Yahudiler bu değişikliği bahane ettiler; ancak Kur'an bu hususu açıklığa kavuşturdu (Bakara 2/142-150).",
        lesson: "Kıble, ümmetin birliğinin sembolüdür; İslam'ın merkezi artık Kâbe'dir.",
        reference: "Bakara 2/142-150; Buhârî, Salât; İbn Hişâm, Sîre, II, 258."
      },
      {
        id: "e5_2",
        title: "Bedir Meydan Muharebesi",
        date: "624 (17 Ramazan)",
        description: "313 kişilik iman ordusu, Ebu Cehil komutasındaki 1000 kişilik tam donanımlı Mekke ordusunu kesin mağlup etti. Şehit sayısı 14'tür. Ebu Cehil öldürüldü. 70 müşrik öldü, 70'i esir alındı. Esirler; okuma-yazma bilenlerin 10 çocuğa okuma-yazma öğretmesi karşılığında serbest bırakıldı. Bu, İslam'ın ilk büyük askerî zaferidir.",
        lesson: "Allah'ın yardımı, hazırlık ve tevekkülle birlikte gelir; az sayı çok sayıya galip gelebilir.",
        reference: "Âl-i İmrân 3/123-127; Enfâl 8/1-19; Buhârî, Meğâzî; İbn Hişâm, Sîre, II, 257-310."
      },
      {
        id: "e5_3",
        title: "Bedir Esirleri ve Fidye",
        date: "624",
        description: "Bedir esirleri arasında Peygamberimizin damadı Ebû'l-Âs da vardı. Esirler; malî durumlarına göre fidye ödedi. Fakirler karşılıksız serbest bırakıldı. Okuma-yazma bilenler 10 çocuğa okuma-yazma öğretmek karşılığında salındı. Bu uygulama, İslam'ın eğitime verdiği önemi gösterir.",
        lesson: "İlim ve eğitim, en değerli kurtuluş vesilesidir.",
        reference: "İbn Hişâm, Sîre, II, 285-295; Ahmed b. Hanbel, Müsned."
      },
      {
        id: "e5_4",
        title: "Uhud Savaşı ve Okçular",
        date: "625 (Şevval)",
        description: "Mekkelilerin intikam için 3000 kişiyle geldiği savaştır. Ayneyn tepesindeki okçuların yerini terk etmesiyle ordu pusuya düştü. Hz. Hamza dahil 70 sahabe (Şüheda-i Uhud) şehit oldu. Peygamberimiz yaralandı, dişi kırıldı, miğferi başına battı. Ancak 'Allah'ım, kavmimi affet, onlar bilmiyorlar' diye dua etti.",
        lesson: "İtaat, zaferin anahtarıdır; itaatsizlik en güçlü orduyu bile bozar.",
        reference: "Âl-i İmrân 3/139-180; Buhârî, Meğâzî; İbn Hişâm, Sîre, III, 60-155."
      },
      {
        id: "e5_5",
        title: "Hz. Hamza'nın Şehadeti",
        date: "625 (Uhud)",
        description: "Peygamberimizin amcası ve sütkardeşi Hz. Hamza, Uhud'da şehit edildi. Vahşî b. Harb tarafından öldürüldü. Peygamberimiz onun naaşı başında ağladı: 'Hamza'yı hiçbir zaman unutmayacağım.' Hz. Hamza 'Seyyidü'ş-Şühedâ' (şehitlerin efendisi) lakabıyla anılır.",
        lesson: "Şehitlik, İslam'ın en yüce mertebelerinden biridir.",
        reference: "Buhârî, Meğâzî; İbn Hişâm, Sîre, III, 130-140."
      },
      {
        id: "e5_6",
        title: "Hendek (Ahzab) Savaşı",
        date: "627 (Şevval)",
        description: "Mekkeliler, Gatafan kabileleri ve Yahudilerin birleşmesiyle 10.000 kişilik ordu Medine'yi kuşattı. Selman-ı Farisi'nin fikriyle kazılan hendekler sayesinde kuşatma 1 ay sonra kırıldı. Soğuk, açlık ve fırtına düşmanı bozguna uğrattı. Kur'an bu olayı Ahzab Suresi'nde anlatır.",
        lesson: "İstişare ve teknik hazırlık, İslam'ın zaferinde önemli bir yer tutar.",
        reference: "Ahzâb 33/9-27; Buhârî, Meğâzî; İbn Hişâm, Sîre, III, 224-289."
      },
      {
        id: "e5_7",
        title: "Beni Kurayza Gazvesi",
        date: "627",
        description: "Hendek Savaşı sırasında müşriklerle işbirliği yapıp Müslümanları arkadan vurmaya kalkışan Beni Kurayza Yahudileri kuşatıldı. Yapılan anlaşma sonucu Sa'd b. Muâz'ın hakemliğinde kendi kitapları Tevrat hükmüne göre cezalandırıldılar. Bu olay, Medine'deki Yahudi meselesini kesin olarak çözdü.",
        lesson: "İhanet, en ağır karşılığı hak eder; ancak cezalandırmada bile hukukî süreç takip edilmiştir.",
        reference: "Ahzâb 33/26-27; İbn Hişâm, Sîre, III, 289-315."
      },
      {
        id: "e5_8",
        title: "Yahudi Kabilelerle İlişkiler",
        date: "624 - 627",
        description: "Medine sözleşmesine ihanet edip suikast ve düşmanla işbirliği yapan Beni Kaynuka, Beni Nadir ve Beni Kurayza Yahudileri Medine'den çıkarıldı veya cezalandırıldı. Peygamberimiz, ihanet edene kadar Yahudilerle antlaşmalara sadık kaldı; barış ve adalet tesis etmeye çalıştı.",
        lesson: "Antlaşmaya sadakat esastır; ihanet ise antlaşmanın sona ermesidir.",
        reference: "İbn Hişâm, Sîre, III, 45-75, 195-224, 289-315."
      },
      {
        id: "e5_9",
        title: "Hudeybiye Antlaşması ve Rıdvan",
        date: "628 (Zilkade)",
        description: "Umre için yola çıkıldı fakat Mekkeliler izin vermedi. Rıdvan Biatı (ölümüne sadakat sözü) alındı. 10 yıllık barış anlaşması imzalandı. Görünüşte aleyhte olsa da Fetih suresiyle 'Apaçık bir Fetih' müjdelendi. Bu antlaşma, İslam'ın diplomasi tarihinde bir dönüm noktasıdır.",
        lesson: "Bazen görünürde kayıp gibi olan, gerçekte büyük bir kazançtır; diplomasi gücü de bir zaferdir.",
        reference: "Fetih 48/1-29; Buhârî, Şurût; İbn Hişâm, Sîre, III, 321-346."
      },
      {
        id: "e5_10",
        title: "Hayber'in Fethi",
        date: "628 (Muharrem)",
        description: "Yahudilerin sığınağı ve kışkırtma merkezi olan muhkem Hayber kalesi, Hz. Ali'nin eşsiz kahramanlığıyla fethedildi. Hz. Ali, kapıyı kalkan olarak kullandı. Şam ticaret yolu güvene alındı. Ayrıca Peygamberimiz Habeşistan'dan dönen Cafer b. Ebi Talib'le ve eşi Esma ile kızı Ümmü Gülsüm ile görüştü.",
        lesson: "İslam, stratejik noktaları güvence altına alarak barışı tesis eder.",
        reference: "Buhârî, Meğâzî; İbn Hişâm, Sîre, III, 346-380."
      },
      {
        id: "e5_11",
        title: "Mute Savaşı",
        date: "629 (Cemaziyelevvel)",
        description: "Elçinin öldürülmesi üzerine Bizans'la ilk çarpışma. Zeyd bin Harise, Cafer bin Ebi Talib (Cafer-i Tayyar) ve Abdullah b. Revaha art arda şehit düştü. Halid bin Velid orduyu kurtardı. Peygamberimiz bu şehitler için 'Cennette gördüm' buyurdu. Halid, 'Seyfullah' (Allah'ın kılıcı) lakabını aldı.",
        lesson: "Komutan şehit olsa da ordu dağılmaz; istişareyle yeni komutan seçilir.",
        reference: "Buhârî, Meğâzî; İbn Hişâm, Sîre, IV, 15-27."
      },
      {
        id: "e5_12",
        title: "Mekke'nin Fethi",
        date: "630 (20 Ramazan)",
        description: "Kureyş antlaşmayı bozunca 10.000 kişilik orduyla girildi. Kâbe putlardan temizlendi. 360 put devrildi. Peygamberimiz Kâbe'ye girip 'Hak geldi, batıl yıkıldı' ayetini okudu. Kendisine zulmedenleri 'Bugün size kınama yoktur' diyerek affetti. Bu fetih, insanlık tarihinin en merhametli fetihlerinden biridir.",
        lesson: "Gerçek zafer, affedebilmektir; intikam değil merhamet İslam'ın vasfıdır.",
        reference: "Fetih 48/18-25; Buhârî, Meğâzî; İbn Hişâm, Sîre, IV, 40-60."
      },
      {
        id: "e5_13",
        title: "Huneyn ve Taif Kuşatması",
        date: "630 (Şevval)",
        description: "Fetih sonrası Hevazin kabilesiyle Evtas (Huneyn) vadisinde savaşıldı. Başta yaşanan paniğe rağmen kazanıldı. Ardından Taif kuşatıldı, kısa süre sonra Taifliler İslam'ı kabul etti. Bu savaşta ganimetler; müellefe-i kulûb denilen kalpleri İslam'a ısındırılacak kişilere dağıtıldı.",
        lesson: "İslam, kalpleri kazanmayı toprak kazanmaktan daha değerli görür.",
        reference: "Tevbe 9/25-27; Buhârî, Meğâzî; İbn Hişâm, Sîre, IV, 88-130."
      },
      {
        id: "e5_14",
        title: "Tebük Seferi (Gazvetü'l-Usre)",
        date: "630 (Recep)",
        description: "Bizans ordusu söylentisi üzerine kurak yaz aylarında (Zorluk zamanı) 30 bin kişiyle Arabistan'ın kuzeyine gidildi. Savaş olmadı fakat İslam devletinin gücü tescillendi. Bu seferde büyük fedakârlıklar yapıldı; Hz. Osman, Hz. Ebubekir, Hz. Ömer büyük yardımlarda bulundu.",
        lesson: "Zorluk zamanında fedakârlık, gerçek imanın göstergesidir.",
        reference: "Tevbe 9/38-99; Buhârî, Meğâzî; İbn Hişâm, Sîre, IV, 159-170."
      },
      {
        id: "e5_15",
        title: "Beni Mustalik Gazvesi",
        date: "626",
        description: "Medine'ye saldırı hazırlığı yapan Beni Mustalik kabilesi üzerine sefer düzenlendi. Savaş kazanıldı. Bu seferde münafıkların başı Abdullah b. Übey, 'Muhacirler Medine'den çıkarılmalı' gibi fitne sözler sarf etti. Ancak fitne ortaya çıkarıldı ve önlendi.",
        lesson: "Münafıklar, Müslümanların birliğini bozmaya çalışır; teyakkuz ve hikmetle bertaraf edilir.",
        reference: "Münafikûn 63/1-11; İbn Hişâm, Sîre, III, 289-302."
      },
      {
        id: "e5_16",
        title: "İfk Hadisesi",
        date: "626 (Beni Mustalik dönüşü)",
        description: "Hz. Aişe'ye iftira atıldı. Bu, Müslümanlar arasında büyük bir fitneye sebep oldu. Bir ay sonra Nur Suresi'nin ilgili ayetleri nazil oldu ve Hz. Aişe'nin masumiyeti ilan edildi. Bu hadise; iftiranın ne kadar büyük bir günah olduğunu ve sabrın mükâfatını gösterir.",
        lesson: "İftira büyük günahtır; sabredenler için ardından büyük bir müjde vardır.",
        reference: "Nûr 24/11-26; Buhârî, Meğâzî; İbn Hişâm, Sîre, III, 302-312."
      },
      {
        id: "e5_17",
        title: "Hudeybiye Sonrası Sükûnet Dönemi",
        date: "628 - 630",
        description: "Hudeybiye Barışı sonrası İslam hızla yayıldı. Krallara davet mektupları gönderildi. Müslümanların sayısı iki yılda ikiye katlandı. Halid b. Velid, Amr b. Âs gibi güçlü komutanlar Müslüman oldu. Bu dönem, İslam'ın en hızlı yayıldığı dönemdir.",
        lesson: "Barış, İslam'ın yayılmasının en etkili ortamıdır.",
        reference: "İbn Hişâm, Sîre, IV, 5-15; Vâkıdî, Meğâzî."
      },
      {
        id: "e5_18",
        title: "Sahabelerin Hicret Öncesi ve Sonrası Fedakârlıkları",
        date: "622 - 632",
        description: "Sahabeler; mallarını, yurtlarını, ailelerini bırakarak İslam için hicret ettiler. Bedir'de az sayıyla büyük orduya karşı durdular. Uhud'da Peygamberimizi korumak için bedenlerini siper ettiler. Hendek'te günlerce aç kaldılar. Bu fedakârlıklar, İslam'ın temelini oluşturdu.",
        lesson: "İslam'ın bugünlere ulaşması, ilk Müslümanların eşsiz fedakârlıkları sayesindedir.",
        reference: "İbn Sa'd, Tabakât, III-IV; Buhârî, Menâkıb."
      },
      {
        id: "e5_19",
        title: "Necran Hristiyanlarıyla Antlaşma",
        date: "630 - 631",
        description: "Necran Hristiyanları Medine'ye gelip Peygamberimizle görüştü. Mübahele olayı yaşandı (Âl-i İmrân 3/61). Antlaşma sonucu Necranlılar cizye ödemeyi kabul etti; can, mal ve inanç güvenlikleri güvence altına alındı. Bu, İslam'ın farklı inançlara tanıdığı özgürlüğün somut örneğidir.",
        lesson: "İslam, gayrimüslimlerin can, mal ve inanç güvenliğini hukukî teminat altına almıştır.",
        reference: "Âl-i İmrân 3/61; İbn Hişâm, Sîre, II, 199-215."
      },
      {
        id: "e5_20",
        title: "Vâdi'l-Kurâ ve Fedek",
        date: "628 - 629",
        description: "Hayber sonrası Vâdi'l-Kurâ ve Fedek Yahudileriyle anlaşma yapıldı. Bu bölgeler, Medine devletinin güvenliğini sağlamlaştırdı. Ayrıca Fedek arazisi Peygamberimize tahsis edildi; geliriyle Suffe'deki fakirlere ve yolculara yardım edildi.",
        lesson: "Kamu gelirleri, öncelikle ihtiyaç sahiplerine ve toplum yararına kullanılır.",
        reference: "İbn Hişâm, Sîre, III, 380-395."
      },
      {
        id: "e5_21",
        title: "Seriyyeler ve İslam Devletinin Güçlenmesi",
        date: "623 - 630",
        description: "Peygamberimiz döneminde 50'den fazla seriyye (küçük askerî birlik) gönderildi. Bu seriyyeler; İslam'ın güvenliğini sağladı, kabilelere İslam'ı tebliğ etti, casusları etkisiz hale getirdi. Abdullah b. Cahş'ın Nahle seriyyesi ilk seriyyedir.",
        lesson: "İslam, sadece savaş değil, stratejik önlemlerle de güvenliği sağlar.",
        reference: "Vâkıdî, Meğâzî; İbn Sa'd, Tabakât, II."
      },
      {
        id: "e5_22",
        title: "İslam Devleti'nin Yapısı",
        date: "622 - 632",
        description: "Peygamberimiz döneminde İslam devleti; mescid merkezli, istişareye dayalı, hukukî ve idarî bir yapı kurdu. Valiler, kadılar, muallimler, zekât memurları, ordu komutanları tayin edildi. Fethedilen bölgelere İslam'ı öğretecek muallimler gönderildi. Bu sistem, sonraki halifeler döneminde genişletildi.",
        lesson: "İslam, hayatın her alanını düzenleyen kapsamlı bir sistemdir.",
        reference: "M. Hamidullah, İslam Peygamberi; İbn Sa'd, Tabakât, I-II."
      }
    ]
  },

  /* ============================================================
     DÖNEM 6: DİPLOMASİ VE TEBLİĞ MEKTUPLARI
     ============================================================ */
  {
    id: "diplomasi",
    title: "Diplomasi ve Tebliğ Mektupları",
    dateRange: "628 - 631",
    icon: "email-newsletter",
    events: [
      {
        id: "e6_1",
        title: "Krallara İslam'a Davet",
        date: "628",
        description: "Hudeybiye Barışı'ndan sonra devlet başkanlarına İslam'a davet mektupları gönderildi. Bizans İmparatoru Herakliyus, Sasani (İran) Kisrası Perviz, Habeş Necaşisi ve Mısır Mukavkıs'ı elçilerle davet edildi. Mektuplar, Peygamberimizin evrensel risalet iddiasını açıkça ortaya koydu.",
        lesson: "İslam, sadece bir bölgenin değil, bütün insanlığın davetidir.",
        reference: "Buhârî, Bed'ü'l-Vahy; İbn Hişâm, Sîre, IV, 260-290."
      },
      {
        id: "e6_2",
        title: "Herakliyus'a Mektup ve Diyalog",
        date: "628",
        description: "Bizans İmparatoru Herakliyus'a Dihye b. Halîfe el-Kelbî ile mektup gönderildi. Herakliyus, ticaret için Şam'da bulunan Ebû Süfyân'ı çağırarak Peygamberimiz hakkında sorular sordu. Ebû Süfyan, henüz Müslüman değildi ama Peygamberimizin doğruluğunu, emanete sadakatini, asaletini itiraf etti. Herakliyus, İslam'a yakınlık gösterdi ama halkının tepkisinden çekindiği için Müslüman olamadı.",
        lesson: "Hakikati bilmek yetmez; kabul etmek de gerekir.",
        reference: "Buhârî, Bed'ü'l-Vahy, 6; İbn Hişâm, Sîre, IV, 271-280."
      },
      {
        id: "e6_3",
        title: "Kisra'ya Mektup ve Yırtılması",
        date: "628",
        description: "Sasani Kralı Kisra Perviz'e Abdullah b. Huzâfe ile mektup gönderildi. Kisra, mektubu öfkeyle yırttı ve Peygamberimize hakaret etti. Peygamberimiz 'Onun mülkü de parçalanacak' buyurdu. Nitekim kısa süre sonra Sasani İmparatorluğu yıkıldı. Kisra'nın oğlu Şireveyh ise İslam'a daha ılımlı yaklaştı.",
        lesson: "Hakikate düşmanlık eden, kendi sonunu hazırlar.",
        reference: "Buhârî, Bed'ü'l-Vahy; İbn Hişâm, Sîre, IV, 280-285."
      },
      {
        id: "e6_4",
        title: "Necaşi'ye Mektup ve Habeşistan",
        date: "628",
        description: "Habeş Necaşisi Ashame'ye Amr b. Ümeyye ile mektup gönderildi. Necaşi, Peygamberimize saygı gösterdi, İslam'a yakın ilgi duydu. Ancak o sırada ülkesindeki karışıklıklar sebebiyle Müslüman olamadı. Peygamberimiz onun vefatına gıyaben cenaze namazı kıldı.",
        lesson: "Gönlü İslam'a açık olanlar, en zor şartlarda bile hakikate saygı gösterir.",
        reference: "Buhârî, Cenâiz; İbn Hişâm, Sîre, IV, 285-290."
      },
      {
        id: "e6_5",
        title: "Mukavkıs'a Mektup ve Mâriye",
        date: "628",
        description: "Mısır Valisi Mukavkıs'a Hâtıb b. Ebî Beltea ile mektup gönderildi. Mukavkıs, hediyelerle karşılık verdi ve Peygamberimize Mâriye isimli cariyeyi hediye etti. Mâriye, İslam'ı kabul etti ve Peygamberimizin oğlu İbrahim'i dünyaya getirdi.",
        lesson: "Diplomatik nezaket, kalpleri kazanmanın vesilesi olabilir.",
        reference: "İbn Hişâm, Sîre, IV, 290-295; İbn Sa'd, Tabakât, I, 259."
      },
      {
        id: "e6_6",
        title: "Elçiler Yılı (Âmü'l-Vüfûd)",
        date: "631 (Hicri 9)",
        description: "Mekke fethi sonrası Arabistan'ın dört bir yanından kabile liderleri ve heyetleri akın akın Medine'ye gelerek İslam'ı kabul edip biat ettiler. Bu yıla 'Elçiler Yılı' denildi. Neredeyse tüm Arap Yarımadası İslam'ı kabul etti. Bu durum, Kur'an'da 'Allah'ın dinine bölük bölük girenler' (Nasr 110/2) olarak bildirildi.",
        lesson: "Sabır ve samimiyet, en büyük inkârcıları bile imana getirebilir.",
        reference: "Nasr 110/1-3; İbn Hişâm, Sîre, IV, 275-320; İbn Sa'd, Tabakât, I, 291-345."
      }
    ]
  },

  /* ============================================================
     DÖNEM 7: VEDA YILI VE VEFATI
     ============================================================ */
  {
    id: "veda-yili",
    title: "Veda Yılı ve Vefatı",
    dateRange: "632",
    icon: "star-crescent",
    events: [
      {
        id: "e7_1",
        title: "Veda Haccı ve Hutbesi",
        date: "632 (Zilhicce)",
        description: "Efendimiz (s.a.v) 100.000'den fazla sahabeyle ilk ve son haccını yaptı. Arafat'ta okuduğu Veda Hutbesi'nde; kan davalarını, faizi kaldırdı, kadın haklarını ve insanların eşitliğini (İnsan Hakları) ilan etti. 'Ey insanlar! Rabbiniz birdir, babanız birdir. Hepiniz Adem'in çocuklarısınız, Adem ise topraktandır. Arabın Arap olmayana, Arap olmayanın Araba üstünlüğü yoktur; üstünlük ancak takvâ iledir' buyurdu.",
        lesson: "Veda Hutbesi, insan hakları tarihinin en eski ve en kapsamlı beyannamelerinden biridir.",
        reference: "Buhârî, Hac; Müslim, Hac; İbn Hişâm, Sîre, IV, 275-290."
      },
      {
        id: "e7_2",
        title: "Veda Hutbesi'nin Esasları",
        date: "632",
        description: "Veda Hutbesi'nin ana başlıkları: (1) Can, mal ve namusun dokunulmazlığı, (2) Faizin kaldırılması, (3) Kan davalarının ilgası, (4) Kadın haklarının korunması, (5) Emanetin korunması, (6) İnsanların eşitliği, (7) Kur'an ve Sünnet'e sarılma tavsiyesi, (8) Ahiret inancının önemi, (9) Yüce Allah'a kulluk ve itaatin gerekliliği.",
        lesson: "Veda Hutbesi, İslam'ın evrensel ilkelerini özetler.",
        reference: "Buhârî, Hac; Müslim, Hac."
      },
      {
        id: "e7_3",
        title: "Hastalığı ve Son Günleri",
        date: "632",
        description: "Medine'ye dönüşünde Veda haccından kısa bir süre sonra humma hastalığına yakalandı. Hastalığı ağırlaşınca mescitte imameti Hz. Ebu Bekir'e bıraktı. Bir gece Baki mezarlığına çıkarak şehitler için dua etti. Son günlerinde 'Namaza ve emriniz altındaki kimselere dikkat edin' buyurdu.",
        lesson: "Son nefese kadar ümmetin sorumluluğunu taşımak, peygamber ahlakının zirvesidir.",
        reference: "Buhârî, Meğâzî; İbn Hişâm, Sîre, IV, 310-320."
      },
      {
        id: "e7_4",
        title: "Son Hutbe ve Vasiyet",
        date: "632",
        description: "Hastalığı ağırlaşmadan önce mescitte son bir hutbe okudu. Bu hutbede; ahirete gideceğini, kendisine hakkı geçenlere helallik verdiğini, Müslümanların birbirine sahip çıkmasını vasiyet etti. 'Size iki şey bırakıyorum; onlara sarılırsanız asla sapmazsınız: Allah'ın Kitabı ve Peygamber'in Sünneti' buyurdu.",
        lesson: "Kur'an ve Sünnet, Müslümanların yol ayrımında pusulasıdır.",
        reference: "Mâlik, Muvatta; İbn Hişâm, Sîre, IV, 320-325."
      },
      {
        id: "e7_5",
        title: "Vefatı ve Defni",
        date: "632 (12 Rebiülevvel)",
        description: "63 yaşında Hz. Aişe'nin odasında 'Yüce Dosta (er-Refîku'l-A'lâ)' diyerek vefat etti. Yıkandıktan sonra vefat ettiği odaya defnedildi (Ravza-i Mutahhara). Kabri, Mescid-i Nebevi'nin içindedir. Hz. Ebubekir 'Kim Muhammed'e kulluk ediyorsa bilsin ki o vefat etmiştir; kim Allah'a kulluk ediyorsa bilsin ki Allah diridir, ölümsüzdür' dedi.",
        lesson: "Peygamberimizin vefatı, İslam'ın sona ermediğinin, vahyin tamamlandığının ilanıdır.",
        reference: "Buhârî, Meğâzî; İbn Hişâm, Sîre, IV, 325-340."
      },
      {
        id: "e7_6",
        title: "Hz. Ebubekir'in Halife Seçilmesi",
        date: "632",
        description: "Peygamberimizin vefatından sonra Sakîfe toplantısında Hz. Ebubekir halife seçildi. Bu, İslam tarihinin ilk halife seçimidir. Hz. Ebubekir, Peygamberimizin en yakın dostu ve ilk halifedir. 'Sıddîk' lakabıyla anılır. İlk hutbesinde 'Ben en hayırlınız değilim; iyi iş yaparsam bana yardım edin, kötülük yaparsam beni düzeltin' demiştir.",
        lesson: "Halifelik, istişare ve biat ile kurulan bir yönetim modelidir.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Hişâm, Sîre, IV, 340-350."
      },
      {
        id: "e7_7",
        title: "Peygamberimizin Vefatı Sonrası",
        date: "632",
        description: "Peygamberimizin vefatı Müslümanlar için büyük bir sarsıntı oldu. Ancak sahabeler, Peygamberimizin vasiyeti doğrultusunda İslam'ı yaymaya devam ettiler. Kur'an-ı Kerim, Hz. Ebubekir döneminde toplanmaya başlandı. İslam, kısa sürede üç kıtaya yayıldı.",
        lesson: "Peygamberimizin vefatı, İslam'ın yayılmasının sonu değil, yeni bir aşamasıdır.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Sa'd, Tabakât, II-III."
      }
    ]
  },

  /* ============================================================
     DÖNEM 8: ŞEMAIL-İ ŞERİF VE AHLAK-I NEBEVÎ
     ============================================================ */
  {
    id: "semail",
    title: "Şemail-i Şerif ve Ahlak-ı Nebevî",
    dateRange: "Tematik Modül",
    icon: "flower-tulip",
    events: [
      {
        id: "e8_1",
        title: "Fiziki Özellikleri (Hilye-i Şerif)",
        date: "Şemail",
        description: "Orta boylu, geniş omuzlu, nurani yüzlü, kara gözlüydü. Saçları omuzlarına değecek kadardı; saçı ve sakalı siyahtı, arada beyazlar vardı. Bakışı heybetli ama gülümsemesi şefkatliydi. İki kürek kemiği arasında Nübüvvet Mührü vardı. Yürürken öne eğilmez, dimdik yürürdü. Terlediğinde teri gül gibi kokardı. Yüzü ayın on dördü gibi nurluydu.",
        lesson: "Peygamberimizin fizikî güzelliği, ahlakî güzelliğinin tezahürüydü.",
        reference: "Tirmizî, Şemâil; İbn Sa'd, Tabakât, I, 373-430."
      },
      {
        id: "e8_2",
        title: "Mucizeleri",
        date: "Şemail",
        description: "En büyük mucizesi Kur'an-ı Kerim'dir. Parmaklarından su akması (Hudeybiye), ayın ikiye yarılması (Şakk-ı Kamer), az yemeğin bereketlenmesi, ağaçların kendisine selam vermesi, kuru koyun memesinden süt sağılması (Ümmü Ma'bed), kuru hurma kütüğünün ağlaması gibi pek çok hissî mucizesi de sahih kaynaklarda yer alır. Ancak Peygamberimiz mucize ile değil, tebliğ ile gönderilmiştir.",
        lesson: "Mucizeler peygamberliğin ispatıdır; ancak iman, mucizeden önce gelir.",
        reference: "Buhârî, Meğâzî, Menâkıb; Müslim, Fedâil; Kâdî İyâz, Şifâ."
      },
      {
        id: "e8_3",
        title: "İbadeti ve Duaları",
        date: "Şemail",
        description: "Geceleri ayakları şişene kadar teheccüd namazı kılardı. 'Şükreden bir kul olmayayım mı?' derdi. Yemede, uykuda, her halinde Allah'ı zikreder, sade bir hayat yaşardı. Gündüzleri sürekli oruç tutmaz ama çoğu günleri oruçlu geçerdi. Namazda uzun kıyam ve secde yapardı. Duaları hem kapsamlı hem samimiydi.",
        lesson: "İbadet; sadece şekil değil, kalbin derinliğidir.",
        reference: "Buhârî, Teheccüd; Müslim, Salâtü'l-Müsâfirîn; Tirmizî, Şemâil."
      },
      {
        id: "e8_4",
        title: "Merhamet ve Adaleti",
        date: "Şemail",
        description: "Kendi işini kendi görür, yamalı elbise giyerdi. Çocuklarla oyun oynar, kadınlara nazik davranırdı. 'Kızım Fatıma dahi hırsızlık yapsa elini keserdim' diyecek kadar mutlak adaleti sağlardı. Torunları Hasan ve Hüseyin'i omzuna alır, secdede onların oynamasına müsaade ederdi. Merhameti tüm canlıları kapsardı.",
        lesson: "Adalet ve merhamet, birlikte var olur; biri olmadan diğeri eksiktir.",
        reference: "Buhârî, Hudûd; Müslim, Fedâil; Tirmizî, Şemâil."
      },
      {
        id: "e8_5",
        title: "Cömertliği ve Tevazuunun Örnekleri",
        date: "Şemail",
        description: "Kendisine bir şey istendiğinde asla 'hayır' demezdi. Bir gün bir bedevi gelip kendisinden bir koyun istedi; Peygamberimiz ona bir sürü verdi. Yıllarca kimsesizlere, yetimlere, yolculara infak etti. Kendi eliyle ayakkabısını tamir eder, koyununu sağardı. 'Ben bir kral peygamber değil, kul peygamberim' buyurmuştur.",
        lesson: "Cömertlik ve tevazu, imanın meyvesidir.",
        reference: "Tirmizî, Şemâil; İbn Sa'd, Tabakât, I, 350-370."
      },
      {
        id: "e8_6",
        title: "Cesareti ve Sabrı",
        date: "Şemail",
        description: "Uhud'da ordunun dağıldığı sırada tek başına direndi; savaş alanından kaçmadı. Hendek'te günlerce aç kaldı. Bedir'de en ön saftaydı. Ancak cesareti sadece savaşta değil; hakikati söylemekte, zulme karşı durmakta da ortaya çıktı. Hiçbir zaman intikam almadı; kendisine yapılan kötülükleri affetti.",
        lesson: "Gerçek cesaret, hak sözü söylemek ve affetmektir.",
        reference: "Buhârî, Meğâzî, Cihâd; Müslim, Fedâil."
      },
      {
        id: "e8_7",
        title: "Şemail-i Şerif'in Kaynakları",
        date: "Şemail",
        description: "Peygamberimizin fizikî ve ahlakî özelliklerini anlatan ilme 'Şemail' veya 'Hilye' denir. Tirmizî'nin 'Şemâilü'n-Nebî' eseri bu alanda en meşhurdur. Hilye-i Şerif, hat sanatında özel bir yere sahiptir; Osmanlı'da Hafız Osman ve Yesârîzâde Mustafa İzzet gibi hattatlar muhteşem hilyeler yazmıştır.",
        lesson: "Peygamberimizin vasıflarını öğrenmek, onu tanımanın ve sevmenin yoludur.",
        reference: "Tirmizî, Şemâil; Kâdî İyâz, Şifâ; Hâfız Osman Hilyeleri."
      },
      {
        id: "e8_8",
        title: "Konuşma Üslubu",
        date: "Şemail",
        description: "Peygamberimiz tane tane, anlaşılır konuşurdu. Sözleri kısa ve özdü; boş konuşmazdı. Gerektiğinde üç kere tekrar ederdi. Yüzü güler, sözü gönülleri fethederdi. Ne yüksek sesle bağırır ne de fısıldardı. Muhatabına değer verir, onu dinlerdi. Sözünde asla yalan yoktu; 'O, hiç yalan söylemedi' diye şahitlik edilirdi.",
        lesson: "Güzel söz ve üslup, en etkili tebliğ aracıdır.",
        reference: "Tirmizî, Şemâil; Buhârî, Edeb."
      },
      {
        id: "e8_9",
        title: "Yemek, Giyim ve Günlük Hayatı",
        date: "Şemail",
        description: "Yemekte sadeydi; arpa ekmeği, hurma, süt, kuru üzüm temel gıdalarıydı. İki öğün yer, çoğu zaman aç kalırdı. Giyimde gösterişten uzak dururdu; yamalı elbise giydiği olurdu. Güzel koku kullanırdı. Misvak kullanmaya önem verirdi. Ev işlerinde eşlerine yardım ederdi. Çarşıda alışveriş yapar, pazarlık ederdi.",
        lesson: "Peygamberimizin sade yaşamı, dünya malına değer vermediğini gösterir.",
        reference: "Tirmizî, Şemâil; İbn Sa'd, Tabakât, I, 400-430."
      },
      {
        id: "e8_10",
        title: "Çevre ve Hayvanlara Şefkati",
        date: "Şemail",
        description: "Peygamberimiz, hayvanlara şefkatle davranılmasını emretti. Bir kediye eziyet eden kadının cehennemlik, bir köpeğe su veren fahişenin cennetlik olduğunu bildirdi. Ağaçları korumayı, israf etmemeyi emretti. Uhud dağını severdi. Doğayı, canlıları ve tüm mahlûkatı Allah'ın emaneti olarak görürdü.",
        lesson: "Çevre ve hayvan sevgisi, imanın bir parçasıdır.",
        reference: "Buhârî, Edeb, Müsâkât; Müslim, Birr ve Sıla."
      }
    ]
  },

  /* ============================================================
     DÖNEM 9: EHL-İ BEYT VE ASHAB-I KİRAM
     ============================================================ */
  {
    id: "ehlibeyt-ashab",
    title: "Ehl-i Beyt ve Ashab-ı Kiram",
    dateRange: "Tematik Modül",
    icon: "account-group",
    events: [
      {
        id: "e9_1",
        title: "Ezvac-ı Tahirat (Mübarek Eşleri)",
        date: "Ehl-i Beyt",
        description: "Peygamberimizin eşleri 'Müminlerin Anneleri'dir (Ümmehâtü'l-Mü'minîn). İlki ve en uzun süreli eşi Hz. Hatice'dir. Hz. Sevde, Hz. Aişe (en genç eşi), Hz. Hafsa, Hz. Zeyneb bint Cahş, Hz. Ümmü Seleme, Hz. Safiyye, Hz. Meymune diğer eşlerindendir. Eşleri; İslam'ın ilk muallimeleri, ilk hemşireleri, ilk danışmanlarıydı.",
        lesson: "Peygamberimizin eşleri, İslam'ın yayılmasında ve ilmin aktarılmasında hayati rol oynamışlardır.",
        reference: "İbn Sa'd, Tabakât, VIII; Ahmed b. Hanbel, Müsned."
      },
      {
        id: "e9_2",
        title: "Çocukları ve Torunları",
        date: "Ehl-i Beyt",
        description: "Hz. Hatice'den Kâsım, Abdullah (Tayyib, Tâhir), Zeynep, Rukiyye, Ümmü Gülsüm, Fatıma; Hz. Mariye'den İbrahim doğmuştur. Soyu Hz. Fatıma ve Hz. Ali'nin çocukları Hz. Hasan ve Hz. Hüseyin üzerinden devam etmiştir. Torunlarına çok şefkatli davranırdı. 'Hasan ve Hüseyin cennet gençlerinin efendileridir' buyurdu.",
        lesson: "Peygamberimizin nesli, Ehl-i Beyt üzerinden devam etmiştir.",
        reference: "İbn Hişâm, Sîre, I, 190; Tirmizî, Menâkıb."
      },
      {
        id: "e9_3",
        title: "Aşere-i Mübeşşere",
        date: "Ashab",
        description: "Yaşarken Cennetle müjdelenen 10 sahabe: (1) Ebu Bekir, (2) Ömer, (3) Osman, (4) Ali, (5) Talha bin Ubeydullah, (6) Zübeyr bin Avvam, (7) Abdurrahman bin Avf, (8) Sad bin Ebi Vakkas, (9) Said bin Zeyd, (10) Ebu Ubeyde bin Cerrah. Bu sahabeler, İslam'ın yayılmasında büyük rol oynadı.",
        lesson: "Aşere-i Mübeşşere, İslam'ın ilk döneminin en seçkin sahabeleridir.",
        reference: "Tirmizî, Menâkıb; Ahmed b. Hanbel, Müsned."
      },
      {
        id: "e9_4",
        title: "Öne Çıkan Sahabiler",
        date: "Ashab",
        description: "Hz. Muaviye ve Zeyd b. Sabit gibi vahiy kâtipleri; Mescidde kalarak İslam ilimlerini yayan Suffe ashabı (Örn: Ebu Hureyre - 5374 hadis rivayet etti); ve Hz. Nesibe (Ümmü Umâre) gibi savaşlarda dahi ön safta yer alan kahraman kadın sahabiler. Sahabeler, İslam'ın ilk nesli, en hayırlı nesildir.",
        lesson: "Sahabeler, İslam'ın bugünlere ulaşmasında en büyük pay sahibi nesildir.",
        reference: "İbn Sa'd, Tabakât, III-VII; Buhârî, Fedâilü's-Sahâbe."
      },
      {
        id: "e9_5",
        title: "Hulefâ-i Râşidîn",
        date: "Ashab",
        description: "Dört büyük halife: Hz. Ebubekir (632-634), Hz. Ömer (634-644), Hz. Osman (644-656), Hz. Ali (656-661). Hz. Ebubekir Kur'an'ı toplattı; Hz. Ömer İslam devletini genişletti, adaleti tesis etti; Hz. Osman Kur'an'ı çoğalttı; Hz. Ali ilim ve cesaretiyle bilinir. Bu dönem, İslam tarihinin altın çağıdır.",
        lesson: "Hulefâ-i Râşidîn, İslam'ın ilk asrının en hayırlı yöneticileridir.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Sa'd, Tabakât, III."
      },
      {
        id: "e9_6",
        title: "Suffe Ashabı",
        date: "Ashab",
        description: "Suffe, Mescid-i Nebevi'nin bitişiğindeki, kimsesiz fakir sahabelerin kalıp ilim öğrendiği yerdi. Ebu Hureyre, Abdullah b. Ömer, Abdullah b. Mes'ud, Selman-ı Farisî, Suheyb-i Rûmî, Bilal-i Habeşî burada yetişti. Suffe, İslam'ın ilk eğitim kurumudur. Kur'an, hadis, Arapça, yazı burada öğretildi.",
        lesson: "Suffe, İslam'ın ilk eğitim kurumudur; ilim, Müslümanlar için en büyük hazinedir.",
        reference: "İbn Sa'd, Tabakât, II; Buhârî, İlim."
      },
      {
        id: "e9_7",
        title: "İslam'ın İlk Muallimeleri",
        date: "Ashab",
        description: "Hz. Hatice, Hz. Aişe, Hz. Hafsa, Hz. Ümmü Seleme gibi müminlerin anneleri İslam'ın ilk muallimeleriydi. Hz. Aişe, 2210 hadis rivayet etti; İslam'ın en büyük fıkıh âlimelerinden biri oldu. Hz. Ümmü Atiyye, Hz. Esma bint Ebu Bekir, Hz. Nesibe gibi kadın sahabiler ilim ve hizmette öne çıktı.",
        lesson: "İslam tarihinde kadınlar, ilim ve eğitim alanında her zaman var olmuştur.",
        reference: "İbn Sa'd, Tabakât, VIII; Buhârî, Fedâilü's-Sahâbe."
      },
      {
        id: "e9_8",
        title: "Muhacirler ve Ensar Kardeşliği",
        date: "Ashab",
        description: "Muhacirler; Mekke'den Medine'ye hicret edenlerdir. Ensar; Medineli Müslümanlardır. Muahat ile her Muhacir bir Ensar kardeşiyle eşleştirildi. Ensar, Muhacir kardeşleriyle mallarını paylaştı; bu fedakârlık İslam tarihinin en büyük kardeşlik örneğidir. Kur'an bu kardeşliği övmüştür (Haşr 59/9).",
        lesson: "İslam kardeşliği; soy, toprak veya çıkar değil, iman temelli bir bağdır.",
        reference: "Haşr 59/9; Buhârî, Menâkıb-ı Ensâr."
      },
      {
        id: "e9_9",
        title: "En Çok Hadis Rivayet Eden Sahabeler",
        date: "Ashab",
        description: "En çok hadis rivayet eden sahabiler: Ebu Hureyre (5374), Abdullah b. Ömer (2630), Aişe bint Ebu Bekir (2210), Abdullah b. Abbas (1660), Cabir b. Abdullah (1540), Ebu Said el-Hudrî (1170), Enes b. Mâlik (2286). Bu sahabiler, Peygamberimizin sünnetinin bugüne ulaşmasında hayati role sahiptir.",
        lesson: "Hadis ilmi, sahabelerin titiz rivayet zinciriyle korunmuştur.",
        reference: "Buhârî, İlim; İbn Sa'd, Tabakât; Zehebî, Siyer."
      },
      {
        id: "e9_10",
        title: "Şehit Sahabeler",
        date: "Ashab",
        description: "İslam tarihinin ilk şehitleri: Hz. Yasir ve Hz. Sümeyye. Bedir'de 14, Uhud'da 70, Hendek'te 6, Hayber'de 20, Mute'de 3 şehit vardır. Hz. Hamza 'Seyyidü'ş-Şühedâ', Hz. Hüseyin Kerbelâ şehidi, Hz. Ali, Hz. Osman suikastlarla şehit edilmiştir. Şehitlik, İslam'ın en yüce mertebelerinden biridir.",
        lesson: "İslam, şehitlerin kanıyla bugünlere ulaşmıştır.",
        reference: "İbn Sa'd, Tabakât, III; Buhârî, Cihâd."
      }
    ]
  },

  /* ============================================================
     DÖNEM 10: İLK MÜSLÜMANLAR — YENİ
     ============================================================ */
  {
    id: "ilk-muslumanlar",
    title: "İlk Müslümanlar ve Hayatları",
    dateRange: "Tematik Modül",
    icon: "account-heart",
    events: [
      {
        id: "e10_1",
        title: "Hz. Hatice bint Huveylid (v. 619)",
        date: "İlk Müslüman Hanım",
        description: "Peygamberimizin ilk eşi, ilk Müslüman hanım. Ticaretle uğraşan, iffetli ve asil bir hanımdı. Peygamberimizin peygamberliğini ilk tasdik eden kişi oldu. Malını İslam'a harcadı. Peygamberimiz 'Hatice'ye olan sevgim Allah tarafından bana ilham edildi' buyurmuştur. Vefatı Peygamberimizi derinden üzdü.",
        lesson: "İslam'ın ilk destekçisi bir kadındı; kadınlar İslam tarihinde her zaman öncü olmuştur.",
        reference: "Buhârî, Menâkıbü'l-Ensâr; İbn Sa'd, Tabakât, VIII, 11-22."
      },
      {
        id: "e10_2",
        title: "Hz. Ebubekir es-Sıddîk (v. 634)",
        date: "İlk Halife",
        description: "Peygamberimizin en yakın dostu, ilk halife. Zengin bir tüccardı; malını İslam için harcadı. Köleleri satın alıp azat etti (Hz. Bilal dahil). İsra-Miraç olayını tereddüt etmeden tasdik ettiği için 'Sıddîk' lakabını aldı. Hicrette Peygamberimizin yol arkadaşıydı. İki yıllık halifeliğinde Ridde savaşlarını bastırdı, Kur'an'ı toplattı, Bizans'a ordu gönderdi.",
        lesson: "Sıddîk lakabı, sadakatin en yüksek derecesini gösterir.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Sa'd, Tabakât, III, 169-233."
      },
      {
        id: "e10_3",
        title: "Hz. Ömer b. Hattâb (v. 644)",
        date: "İkinci Halife",
        description: "İslam'ın ikinci halifesi. Müslüman olmadan önce İslam'ın en büyük düşmanlarındandı. Müslüman olunca İslam sokağa çıktı. 'Fârûk' (hakkı batıldan ayıran) lakabını aldı. On yıllık halifeliğinde İslam devleti üç kıtaya yayıldı. Adaletiyle meşhur oldu. 'Ömer'in adaleti' bir darb-ı mesel oldu. Bir kölenin şikâyeti üzerine oğlunu cezalandırdı. Şehit edildi.",
        lesson: "Adalet, bir devletin temelidir; Hz. Ömer bunun en büyük örneğidir.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Sa'd, Tabakât, III, 269-315."
      },
      {
        id: "e10_4",
        title: "Hz. Osman b. Affân (v. 656)",
        date: "Üçüncü Halife",
        description: "İslam'ın üçüncü halifesi. Zengin bir tüccardı; İslam için büyük infaklarda bulundu (Tebük ordusunu teçhiz etti). 'Zinnûreyn' (iki nur sahibi) lakabıyla anılır çünkü Peygamberimizin iki kızıyla evlenmişti. On iki yıllık halifeliğinde Kur'an'ı çoğalttı, İslam donanmasını kurdu. Şehit edildi.",
        lesson: "Cömertlik ve Kur'an hizmeti, Hz. Osman'ın en belirgin vasıflarıdır.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Sa'd, Tabakât, III, 53-77."
      },
      {
        id: "e10_5",
        title: "Hz. Ali b. Ebî Tâlib (v. 661)",
        date: "Dördüncü Halife",
        description: "Peygamberimizin amcası oğlu, damadı, ilk Müslüman çocuk. İlmin kapısı, cesaretin timsali, adaletin sembolü. Bedir, Uhud, Hendek, Hayber gibi savaşlarda büyük kahramanlık gösterdi. Hz. Fatıma ile evlendi; neseb-i nebevî onun çocuklarıyla devam etti. Dördüncü halife oldu; iç karışıklıklar döneminde halifelik yaptı. Şehit edildi.",
        lesson: "Hz. Ali, ilim ve cesareti şahsında birleştirmiş bir şahsiyettir.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Sa'd, Tabakât, III, 19-40."
      },
      {
        id: "e10_6",
        title: "Hz. Bilâl-i Habeşî (v. 640)",
        date: "İlk Müezzin",
        description: "Habeşistanlı bir köleydi. İslam'ı kabul ettiği için ağır işkenceler gördü; kızgın kumlara yatırıldı ama 'Ehad! Ehad!' (Bir! Bir!) diyerek imanından dönmedi. Hz. Ebubekir onu satın alıp azat etti. İslam'ın ilk müezzini oldu. Peygamberimiz onu çok severdi. 'Bilâl'in sesini işittiğinizde onun söylediğini tekrar edin' buyurdu.",
        lesson: "Bilâl, kölelikten müezzinliğe yükselerek İslam'ın eşitlik ilkesini sembolize eder.",
        reference: "Buhârî, Ezan, Menâkıb; İbn Sa'd, Tabakât, III, 232-239."
      },
      {
        id: "e10_7",
        title: "Hz. Hamza b. Abdülmuttalib (v. 625)",
        date: "Şehitlerin Efendisi",
        description: "Peygamberimizin amcası ve sütkardeşi. Cesaretiyle tanınırdı. Bir gün Peygamberimize yapılan hakarete öfkelenerek Müslüman oldu. Bedir'de büyük kahramanlık gösterdi. Uhud'da Vahşî tarafından şehit edildi. Peygamberimiz onun naaşı başında ağladı. 'Seyyidü'ş-Şühedâ' (şehitlerin efendisi) lakabıyla anılır.",
        lesson: "Hz. Hamza, cesaretini hak yolunda kullanmış bir kahramandır.",
        reference: "Buhârî, Meğâzî; İbn Hişâm, Sîre, III, 130-140."
      },
      {
        id: "e10_8",
        title: "Hz. Aişe bint Ebu Bekir (v. 678)",
        date: "Müminlerin Annesi",
        description: "Peygamberimizin en genç eşi, Hz. Ebubekir'in kızı. İslam'ın en büyük fıkıh âlimelerinden biri. 2210 hadis rivayet etti. Peygamberimizin vefatına kadar yanında oldu. İfk hadisesinde masumiyeti Kur'an'la ilan edildi. İslam ilmine yaptığı katkılar büyüktür.",
        lesson: "Hz. Aişe, İslam ilminin en önemli kaynaklarından biridir.",
        reference: "Buhârî, Fedâilü's-Sahâbe; İbn Sa'd, Tabakât, VIII, 39-83."
      }
    ]
  },

  /* ============================================================
     DÖNEM 11: MEDİNE DÖNEMİ SOSYAL HAYAT — YENİ
     ============================================================ */
  {
    id: "medine-sosyal",
    title: "Medine Dönemi: Sosyal ve Kültürel Hayat",
    dateRange: "622 - 632",
    icon: "city-variant-outline",
    events: [
      {
        id: "e11_1",
        title: "Mescid-i Nebevi'nin Fonksiyonları",
        date: "Sosyal Hayat",
        description: "Mescid-i Nebevi sadece ibadet yeri değildi; aynı zamanda idare merkezi, mahkeme, okul, ordu karargâhı, misafirhane, hasta bakımevi ve sosyal buluşma merkeziydi. Peygamberimiz burada sahabelerle istişare eder, davaları çözer, heyetleri kabul eder, ilim öğretirdi.",
        lesson: "Mescid, İslam toplumunun kalbi ve merkezidir.",
        reference: "İbn Hişâm, Sîre, II, 353-359; Buhârî, Salât."
      },
      {
        id: "e11_2",
        title: "Medine Çarşısı ve Ekonomi",
        date: "Sosyal Hayat",
        description: "Peygamberimiz Medine'de bir çarşı kurdu. Çarşıda; aldatma, faiz, karaborsa, ihtikâr yasaklandı. Ölçü ve tartıda dürüstlük emredildi. Ticaret ahlakı tesis edildi. Zekât, sadaka, fitre gibi mali ibadetler kurumsallaştı. İslam ekonomisi, adalet ve infak üzerine kuruldu.",
        lesson: "Ekonomik hayat, ahlak ve adaletle düzenlenir.",
        reference: "İbn Hişâm, Sîre, II, 370; Buhârî, Büyû'."
      },
      {
        id: "e11_3",
        title: "Eğitim ve Öğretim",
        date: "Sosyal Hayat",
        description: "Peygamberimiz eğitime büyük önem verdi. 'İlim öğrenmek her Müslümana farzdır' buyurdu. Suffe'de okuma-yazma, Kur'an, hadis öğretildi. Bedir esirlerinden okuma-yazma bilenler 10 çocuğa öğretmek şartıyla serbest bırakıldı. Kadınlara özel eğitim günü tahsis edildi.",
        lesson: "İlim, Müslümanların en büyük hazinesidir.",
        reference: "Buhârî, İlim; İbn Mâce, Mukaddime."
      },
      {
        id: "e11_4",
        title: "Kadınların Sosyal Hayattaki Yeri",
        date: "Sosyal Hayat",
        description: "İslam, kadına miras hakkı, mülk hakkı, eğitim hakkı, ticaret hakkı tanıdı. Kadınlar sahabeler arasında ilim, ticaret, tıp, savaş gibi alanlarda öne çıktı. Hz. Hatice ticaret, Hz. Aişe ilim, Hz. Nesibe savaş, Hz. Ümmü Atiyye tıp alanında öncüydü. Kadınlar biat eder, fikir beyan eder, Peygamberimizle doğrudan görüşebilirdi.",
        lesson: "İslam, kadına toplum hayatında onurlu ve aktif bir yer vermiştir.",
        reference: "Buhârî, İlim; İbn Sa'd, Tabakât, VIII."
      },
      {
        id: "e11_5",
        title: "Çocuk ve Aile Hayatı",
        date: "Sosyal Hayat",
        description: "Peygamberimiz çocuklara şefkatle davranır, onlarla oyun oynardı. Torunları Hasan ve Hüseyin'i omzunda taşırdı. Aile hayatında adalet, sevgi ve merhamet esasları tesis edildi. Yetimlere, kimsesizlere özel önem verildi. Kadın-erkek ilişkileri hukukî çerçeveye alındı.",
        lesson: "Aile, toplumun temelidir; İslam aileye büyük önem verir.",
        reference: "Buhârî, Edeb; Müslim, Fedâil."
      },
      {
        id: "e11_6",
        title: "Adalet Sistemi",
        date: "Sosyal Hayat",
        description: "Peygamberimiz adaleti mutlak olarak uyguladı. 'Kızım Fatıma dahi hırsızlık yapsa elini keserdim' buyurdu. Davaları çözerken delil, şahit, yemin esaslarına uydu. Hâkimlere adalet tavsiye etti. Kimseye ayrıcalık tanımadı. Bu adalet anlayışı, İslam hukukunun temelini oluşturdu.",
        lesson: "Adalet, İslam devletinin temelidir; ayrıcalık yoktur.",
        reference: "Buhârî, Hudûd, Ahkâm; Müslim, Hudûd."
      },
      {
        id: "e11_7",
        title: "Gayrimüslimlerle İlişkiler",
        date: "Sosyal Hayat",
        description: "Medine Sözleşmesi ile Yahudi ve müşriklerle bir arada yaşama esasları belirlendi. Necran Hristiyanlarıyla antlaşma yapıldı; can, mal, inanç güvenlikleri güvence altına alındı. Gayrimüslimlere cizye karşılığında askerî muafiyet tanındı. Komşuluk haklarına riayet edildi. İslam, din ve vicdan hürriyetini tanıdı.",
        lesson: "İslam, farklı inanç gruplarıyla barış içinde yaşamayı esas alır.",
        reference: "İbn Hişâm, Sîre, II, 360-370; M. Hamidullah, el-Vesâiku's-Siyâsiyye."
      },
      {
        id: "e11_8",
        title: "Sağlık ve Hijyen",
        date: "Sosyal Hayat",
        description: "Peygamberimiz temizliğe büyük önem verdi. 'Temizlik imanın yarısıdır' buyurdu. Diş temizliği için misvak kullandı. Hastalara ziyaret tavsiye etti. Karantina uygulamasını öğretti ('Bir yerde veba çıkarsa oraya girmeyin, orada çıkarsa çıkmayın'). Tıp ilmine teşvik etti. Sağlık, İslam'ın önem verdiği bir konudur.",
        lesson: "Temizlik ve sağlık, imanın ve hayatın korunmasının bir parçasıdır.",
        reference: "Müslim, Tahâret, Selâm; Buhârî, Tıb."
      },
      {
        id: "e11_9",
        title: "Medine'nin İmarı",
        date: "Sosyal Hayat",
        description: "Medine hızla büyüdü, bayındır hale geldi. Mescid, Suffe, çarşı, yollar, kuyular yapıldı. Zekât gelirleriyle fakirlere yardım edildi. Su kuyuları (Rûme kuyusu Hz. Osman tarafından satın alınıp vakfedildi) açıldı. Şehir, İslam medeniyetinin ilk örnek modeli oldu.",
        lesson: "İmar ve bayındırlık, İslam medeniyetinin göstergelerindendir.",
        reference: "İbn Hişâm, Sîre, II; Buhârî, Menâkıb-ı Ensâr."
      },
      {
        id: "e11_10",
        title: "Medine Vesikası'nın Getirdiği Yenilikler",
        date: "Sosyal Hayat",
        description: "Medine Sözleşmesi (Vesîka); tarihin ilk yazılı anayasasıdır. (1) Din ve vicdan hürriyeti, (2) Can-mal güvenliği, (3) Savunma işbirliği, (4) Adalet önünde eşitlik, (5) Antlaşmaya sadakat, (6) Anlaşmazlıkların Peygamberimize götürülmesi gibi esaslar içerir. Bu sözleşme; modern anayasa hukukuna öncülük etmiştir.",
        lesson: "İslam, hukuk devleti ve toplumsal sözleşme fikrinin öncüsüdür.",
        reference: "İbn Hişâm, Sîre, II, 360-370; M. Hamidullah, el-Vesâiku's-Siyâsiyye."
      }
    ]
  },

  /* ============================================================
     DÖNEM 12: MUCİZELER — YENİ
     ============================================================ */
  {
    id: "mucizeler",
    title: "Mucizeler ve Deliller",
    dateRange: "Tematik Modül",
    icon: "star-four-points",
    events: [
      {
        id: "e12_1",
        title: "Kur'ân-ı Kerîm: En Büyük Mucize",
        date: "Mucize",
        description: "Peygamberimizin en büyük ve ebedî mucizesi Kur'an-ı Kerim'dir. Kur'an; belâgatı, i'câzı (taklit edilemezliği), gaybdan haberleri, ilmî işaretleri ve hidayet rehberliğiyle mucizedir. 'Andolsun, eğer insanlar ve cinler bu Kur'an'ın bir benzerini getirmek üzere bir araya gelselerdi, birbirlerine yardım etseler bile bir benzerini getiremezlerdi' (İsrâ 17/88).",
        lesson: "Kur'an, kıyamete kadar sürecek mucizevî bir kitaptır.",
        reference: "İsrâ 17/88; Bakara 2/23-24; Kâdî İyâz, Şifâ."
      },
      {
        id: "e12_2",
        title: "Şakk-ı Kamer (Ayın Yarılması)",
        date: "Mucize",
        description: "Mekke müşrikleri Peygamberimizden bir mucize istediler. Peygamberimiz eliyle işaret etti ve ay ikiye yarıldı; Mekkeliler bunu gördü. Ancak yine de inanmadılar; 'Bu bir büyüdür' dediler. Kur'an bu olayı Kamer Suresi'nde bildirir (54/1).",
        lesson: "Mucize bile inkârcı bir kalbi ikna etmez; iman kalbin işidir.",
        reference: "Kamer 54/1-2; Buhârî, Menâkıb; Müslim, Kıyâme."
      },
      {
        id: "e12_3",
        title: "Parmaklardan Su Akması",
        date: "Mucize",
        description: "Hudeybiye'de ve başka birçok seferde susuzluk tehlikesi vardı. Peygamberimiz parmaklarını kaba daldırdı ve parmaklarından su fışkırdı; tüm ordu bu sudan içti, abdest aldı. Bu mucize sağlam kaynaklarda birçok kez rivayet edilmiştir.",
        lesson: "Peygamberimizin bereketi, ümmetini sıkıntıdan kurtarmıştır.",
        reference: "Buhârî, Menâkıb; Müslim, Fedâil; İbn Hişâm, Sîre, III, 330."
      },
      {
        id: "e12_4",
        title: "Az Yemeğin Bereketlenmesi",
        date: "Mucize",
        description: "Birçok kez az miktarda yemek, Peygamberimizin bereketiyle çoğalmış ve yüzlerce kişiye yetmiştir. Hendek Savaşı'nda Cabir b. Abdullah'ın birkaç avuç yemeği bin kişilik orduya yetmiştir. Bu mucizeler sahih kaynaklarda rivayet edilmiştir.",
        lesson: "Bereket, Allah'ın dilediği kuluna verdiği bir lütuftur.",
        reference: "Buhârî, Meğâzî, Menâkıb; Müslim, Fedâil."
      },
      {
        id: "e12_5",
        title: "Ağaç Kütüğünün Ağlaması",
        date: "Mucize",
        description: "Peygamberimiz Medine'de hutbe okurken bir hurma kütüğü üzerinde dururdu. Sonra minber yapıldı. Minbere çıktığında kütük, çocuk gibi ağladı. Peygamberimiz inip onu teselli etti. Bu olay, Peygamberimizin mucizelerinden biri olarak sahih kaynaklarda yer alır.",
        lesson: "Cansız varlıklar bile Peygamberimizin manevî büyüklüğünü hisseder.",
        reference: "Buhârî, Cuma, Menâkıb; İbn Mâce, İkâme."
      },
      {
        id: "e12_6",
        title: "Hayvanların Konuşması",
        date: "Mucize",
        description: "Peygamberimiz birkaç kez hayvanlarla konuşmuştur. Devesinin şikâyeti, koyunların ona selam vermesi, Ümmü Ma'bed'in koyunundan süt sağması gibi olaylar rivayet edilmiştir. Bu mucizeler, peygamberliğin bir delilidir.",
        lesson: "Peygamberimizin sadece insanlara değil, tüm canlılara manevî otoritesi vardır.",
        reference: "Buhârî, Menâkıb; Müslim, Fedâil; İbn Hişâm, Sîre."
      },
      {
        id: "e12_7",
        title: "Gelecekten Haber Vermesi",
        date: "Mucize",
        description: "Peygamberimiz birçok gaybî haber vermiştir. (1) İstanbul'un fethi, (2) Sasani ve Bizans imparatorluklarının yıkılacağı, (3) Kisra'nın ölümü, (4) Hz. Hasan'ın halifeliği, (5) Kerbelâ olayı, (6) Bazı sahabelerin şehadeti gibi haberler sonradan gerçekleşmiştir. Bu haberler mucizevî bilgilerdir.",
        lesson: "Peygamberimizin gaybî haberleri, nübüvvetin delillerindendir.",
        reference: "Buhârî, Menâkıb, Meğâzî; Müslim, Fedâil, Fiten."
      },
      {
        id: "e12_8",
        title: "Hilye-i Şerif ve Şemail Mucizesi",
        date: "Mucize",
        description: "Peygamberimizin fizikî güzelliği ve nuraniyeti, görenleri etkilerdi. Yüzü ayın on dördüne benzetilirdi. Teri gül gibi kokardı. Cebrail'in getirdiği vahiy sırasında hâli değişirdi. Bu şemail, başlı başına bir mucize ve delildir.",
        lesson: "Peygamberimizin fizikî güzelliği, manevî güzelliğinin aynasıdır.",
        reference: "Tirmizî, Şemâil; Kâdî İyâz, Şifâ."
      },
      {
        id: "e12_9",
        title: "İsrâ ve Mirac'ın Manevî Boyutu",
        date: "Mucize",
        description: "İsrâ ve Mirac, sadece bir yolculuk değil, manevî bir yükseliştir. Peygamberimiz, fizikî olarak Mescid-i Haram'dan Mescid-i Aksa'ya, oradan gök katlarına yükseltildi. Bu yolculukta peygamberlerle görüştü, cennet ve cehennemi gördü, namaz emrini aldı. İsrâ ve Mirac, manevî miracın (namazın) temelidir.",
        lesson: "Namaz, mü'minin miracıdır; manevî yükselişin anahtarıdır.",
        reference: "İsrâ 17/1; Necm 53/1-18; Buhârî, Salât; Müslim, Îmân."
      },
      {
        id: "e12_10",
        title: "Mucizelerin Hikmeti",
        date: "Mucize",
        description: "Mucizeler, peygamberliğin ispatıdır; ancak imanın kaynağı değildir. Peygamberimiz mucize yerine tebliğ ile gönderilmiştir. Kur'an, aklı ve kalbi ikna eden ebedî mucizedir. Mucizeler, iman edenler için imanı artırır, inkârcılar için delil olur. İman, mucizeden önce gelir.",
        lesson: "İman; akıl, kalp ve iradeyle olur, mucizeye bağlı değildir.",
        reference: "Bakara 2/118; En'âm 6/109; Kâdî İyâz, Şifâ."
      }
    ]
  }
];