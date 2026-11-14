// src/data/vedaHutbesiData.js
// Not: Veda Hutbesi adıyla bilinen yaygın Türkçe metin, farklı rivayetlerde
// aktarılan konuşma parçalarının bir araya getirilmiş hâlidir. Bu nedenle
// aşağıdaki metin, tek bir hadis kitabından yapılmış kelimesi kelimesine
// aktarım olarak değerlendirilmemelidir.

export const VEDA_HUTBESI_INFO = {
  title: 'Veda Hutbesi',
  date: '9 Zilhicce 10 (Hicrî)',
  location: 'Arafat – Veda Haccı',
  description:
    'Resûlullah’ın (s.a.v.) Veda Haccı sırasında Arafat’ta ve hac günlerinin farklı duraklarında insanlara yaptığı konuşmalardan nakledilen temel mesajlar.',
  historicalContext:
    'Veda Haccı, hicretin 10. yılında gerçekleşti. Peygamber Efendimiz (s.a.v.), Arafat’ta insanlara hitap ederek canın, malın ve onurun dokunulmazlığını; adaleti, emanet bilincini, aile sorumluluğunu ve kardeşliği hatırlattı.',
  editorialNote:
    'Bugün “Veda Hutbesi” adıyla okunan metin, hac günlerinde farklı yerlerde yapılan konuşmalara ait rivayetlerin derlenmiş yaygın bir aktarımıdır. Rivayetlerin lafızları ve sıralaması kaynaklara göre değişebilir. Aşağıdaki başlıklar, ana mesajları anlaşılır bir dille bir araya getirir.',
};

export const VEDA_HUTBESI_TEXT = [
  {
    id: 'hamd-ve-nasihat',
    title: 'Hamd, Tevhid ve Nasihat',
    category: 'Başlangıç',
    content:
      'Hamd Allah’a mahsustur. O’ndan yardım diler, O’ndan bağışlanma isteriz. Allah’a kulluk etmek ve O’nun gösterdiği doğru yolda yürümek, insanın en temel sorumluluğudur.\n\nEy insanlar! Sözlerimi dikkatle dinleyiniz. Bu yılın ardından sizinle burada yeniden buluşup buluşamayacağımı bilmiyorum.',
    keyMessage:
      'İnsanın hayatı Allah’a karşı sorumluluk bilinciyle şekillenmeli; hakikat dikkatle dinlenmeli ve öğrenilenler yaşanmalıdır.',
    keywords: ['hamd', 'tevhid', 'Allah', 'nasihat', 'sorumluluk'],
  },
  {
    id: 'can-mal-onur',
    title: 'Can, Mal ve Onur Dokunulmazlığı',
    category: 'İnsan hakları',
    content:
      'Canlarınız, mallarınız ve onurlarınız; içinde bulunduğunuz günün, ayın ve beldenin dokunulmazlığı gibi saygındır. Bir insanın hayatına, malına ve şerefine haksız yere zarar vermek büyük bir sorumluluktur.',
    keyMessage:
      'İnsanın canı, malı ve onuru korunmalıdır. Hiç kimse başkasının hakkını ihlal etme yetkisine sahip değildir.',
    keywords: ['can', 'mal', 'onur', 'hak', 'dokunulmazlık', 'adalet'],
  },
  {
    id: 'kardeslik-kan-davalari',
    title: 'Kardeşlik ve Kan Davalarının Kaldırılması',
    category: 'Toplumsal barış',
    content:
      'Câhiliye döneminden kalan kan davaları ve intikam anlayışı kaldırılmıştır. Haksızlık, kabile veya aile adına sürdürülen bir düşmanlıkla meşrulaştırılamaz. İnsanlar arasında barışın, adaletin ve kardeşliğin hâkim olması gerekir.',
    keyMessage:
      'Geçmişin düşmanlıkları yeni haksızlıklara gerekçe yapılmamalı; intikam yerine adalet ve barış tercih edilmelidir.',
    keywords: ['kan davası', 'intikam', 'kardeşlik', 'barış', 'adalet'],
  },
  {
    id: 'emanet-ve-faiz',
    title: 'Emanet, Borç ve Faiz',
    category: 'Kul hakkı',
    content:
      'Emanetler mutlaka sahiplerine iade edilmelidir. Câhiliye döneminden kalan faiz uygulamaları kaldırılmış; haksız kazanç ve başkasının malını haksız yere alma yasaklanmıştır. Borç ve alacak ilişkilerinde hakkaniyet gözetilmelidir.',
    keyMessage:
      'Emanete riayet etmek, borcu adaletle ödemek ve malî ilişkilerde haksızlıktan kaçınmak müminin sorumluluğudur.',
    keywords: ['emanet', 'faiz', 'borç', 'alacak', 'kul hakkı', 'haksız kazanç'],
  },
  {
    id: 'aile-ve-kadin-haklari',
    title: 'Aile Sorumluluğu ve Kadınların Hakları',
    category: 'Aile',
    content:
      'Kadınlar hakkında Allah’tan korkulması, onların haklarının gözetilmesi ve aile hayatında güzel muamele esas alınmalıdır. Aile ilişkileri emanet, karşılıklı sorumluluk, merhamet ve hakkaniyet bilinciyle yürütülmelidir.',
    keyMessage:
      'Aile hayatında güç değil merhamet; ihmal değil sorumluluk; haksızlık değil güzel muamele esas olmalıdır.',
    keywords: ['kadın', 'aile', 'hak', 'emanet', 'merhamet', 'güzel muamele'],
  },
  {
    id: 'nesep-ve-hukuk',
    title: 'Hakların Korunması ve Sorumluluk',
    category: 'Hukuk ve emanet',
    content:
      'İnsanların hakları, aile bağları ve sorumlulukları konusunda adaletli davranılmalıdır. Bir başkasının hakkını sahiplenmek, gerçeği çarpıtmak veya haksız iddiada bulunmak doğru değildir.',
    keyMessage:
      'Hak, kişisel çıkarla değiştirilemez. Herkesin hakkı korunmalı ve sorumluluklar dürüstlükle yerine getirilmelidir.',
    keywords: ['hak', 'hukuk', 'nesep', 'adalet', 'dürüstlük'],
  },
  {
    id: 'insanlar-arasi-esitlik',
    title: 'İnsanların Eşitliği ve Üstünlük Ölçüsü',
    category: 'Eşitlik',
    content:
      'Rab birdir, insanlığın atası Âdem’dir. İnsanlar aynı insanlık ailesinin fertleridir. Bir kişinin başka birine soy, renk, dil veya kavim üzerinden üstünlük taslaması doğru değildir. Allah katındaki değer, takva ve güzel davranışlarla ilgilidir.',
    keyMessage:
      'Irk, renk, dil, soy ve makam üstünlük sebebi değildir. İnsanlar birbirlerine karşı saygı ve kardeşlikle davranmalıdır.',
    keywords: ['eşitlik', 'ırk', 'renk', 'dil', 'takva', 'insanlık', 'kardeşlik'],
  },
  {
    id: 'kitap-ve-rehberlik',
    title: 'Allah’ın Kitabına ve Peygamberî Rehberliğe Sarılmak',
    category: 'İman ve rehberlik',
    content:
      'Mümin, hayatını Allah’ın kitabının rehberliğinde şekillendirmeli; Resûlullah’ın (s.a.v.) örnekliğini ve sahih sünnetini öğrenip anlamaya gayret etmelidir. Dini bilgi güvenilir kaynaklardan öğrenmek ve öğrendiğini güzel ahlakla yaşamak önemlidir.',
    keyMessage:
      'Kur’an’ı anlamak, Peygamberimizin örnekliğini öğrenmek ve bu rehberliği güzel ahlaka dönüştürmek gerekir.',
    keywords: ['Kur’an', 'Sünnet', 'rehberlik', 'ilim', 'güzel ahlak'],
  },
  {
    id: 'teblig-ve-sahitlik',
    title: 'Tebliğ, Şahitlik ve Mesajı Ulaştırmak',
    category: 'Sorumluluk',
    content:
      'Resûlullah (s.a.v.), kendisini dinleyenlere tebliğ görevini yerine getirip getirmediğini sormuş; orada bulunanların, işittiklerini bulunmayanlara ulaştırmalarını istemiştir. Mesajın doğru anlaşılması ve güvenilir biçimde aktarılması önemlidir.',
    keyMessage:
      'Duyulan iyiliği ve doğru bilgiyi emanet bilinciyle paylaşmak; aktarırken sözü çarpıtmamak gerekir.',
    keywords: ['tebliğ', 'şahitlik', 'emanet', 'bilgi', 'sorumluluk'],
  },
  {
    id: 'son-sahitlik',
    title: 'Son Şahitlik ve Dua',
    category: 'Kapanış',
    content:
      'Sahâbîler, Resûlullah’ın (s.a.v.) Allah’ın mesajını tebliğ ettiğine ve kendilerine nasihat ettiğine şahitlik ettiler. Bunun üzerine Peygamber Efendimiz’in Allah’ı şahit tutarak tebliğ görevini yerine getirdiğini vurguladığı rivayet edilir.',
    keyMessage:
      'Veda Hutbesi’nin hatırlattığı esaslar, yalnızca dinlenen sözler olarak kalmamalı; günlük hayatta adalet, merhamet ve güzel ahlak olarak yaşanmalıdır.',
    keywords: ['şahitlik', 'dua', 'tebliğ', 'ahlak', 'amel'],
  },
];

export const VEDA_HUTBESI_THEMES = [
  {
    id: 'hak',
    title: 'Hak ve adalet',
    description: 'Can, mal, onur ve kul hakkını korumak.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'emanet',
    title: 'Emanet ve dürüstlük',
    description: 'Emaneti sahibine vermek, haksız kazançtan kaçınmak.',
    icon: 'hand-left-outline',
  },
  {
    id: 'aile',
    title: 'Merhamet ve aile',
    description: 'Aile içinde güzel muamele ve karşılıklı sorumluluk.',
    icon: 'heart-outline',
  },
  {
    id: 'kardeslik',
    title: 'Kardeşlik ve eşitlik',
    description: 'Soy, renk ve dil ayrımı yapmadan saygı göstermek.',
    icon: 'people-outline',
  },
];

export const PEYGAMBERIMIZI_ANMA = {
  eyebrow: 'Salât ve selâm',
  title: 'Peygamber Efendimizi Anmak',
  description:
    'Resûlullah’ı (s.a.v.) sevgi ve hürmetle anmanın güzel yollarından biri ona salât ve selâm getirmek; bir diğeri de merhametini, doğruluğunu ve güzel ahlakını hayatımıza taşımaya çalışmaktır.',
  salawatArabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  salawatLatin: 'Allahümme salli ve sellim alâ nebiyyinâ Muhammed.',
  salawatMeaning:
    'Allah’ım, Peygamberimiz Muhammed’e salât ve selâm eyle.',
  practices: [
    {
      id: 'merhamet',
      title: 'Merhameti çoğalt',
      description:
        'İnsana, hayvana ve bütün canlılara karşı şefkatli ve incitmeyen bir tutum benimse.',
      icon: 'heart-outline',
    },
    {
      id: 'dogruluk',
      title: 'Doğru sözlü ol',
      description:
        'Sözünde dur, güvenilir ol ve emaneti sahibine ulaştır.',
      icon: 'checkmark-circle-outline',
    },
    {
      id: 'guzel-muamele',
      title: 'Güzel muamele et',
      description:
        'Ailene, komşuna ve birlikte yaşadığın insanlara nezaketle davran.',
      icon: 'people-outline',
    },
    {
      id: 'hakkaniyet',
      title: 'Hakkaniyeti gözet',
      description:
        'Kendi aleyhine olsa bile adaletten ayrılmamaya gayret et.',
      icon: 'scale-outline',
    },
  ],
  dua:
    'Allah’ım! Habibin Muhammed’e salât ve selâm eyle. Bize onu sevgiyle anmayı, güzel ahlakını öğrenmeyi ve öğrendiklerimizi hayatımızda yaşayabilmeyi nasip eyle. Âmin.',
};

export const VEDA_HUTBESI_REFERENCES = [
  {
    id: 'diyanet-hadislerle-islam',
    title: 'Diyanet – Hadislerle İslâm',
    detail: 'Cilt 5, sayfa 497: Veda Hutbesi ve can, mal dokunulmazlığı.',
    url: 'https://hadislerleislam.diyanet.gov.tr/sayfa.php?CILT=5&SAYFA=497',
  },
  {
    id: 'diyanet-ilmi',
    title: 'Diyanet – Vedâ Hutbesi’ndeki Temel Prensipler ve Kur’ânî Temelleri',
    detail:
      'Farklı rivayetlerdeki konuşmaların bir araya getirilmesi ve temel ilkeler üzerine inceleme.',
    url: 'https://www2.diyanet.gov.tr/DiniYay%C4%B1nlarGenelMudurlugu/DergiDokumanlar/Ilmi/2016/2016-%2052_3.pdf',
  },
  {
    id: 'muslim-hajj',
    title: 'Sahîh-i Müslim – Kitâbü’l-Hac',
    detail:
      'Câbir b. Abdullah’ın Veda Haccı anlatımı ve Arafat’taki hitaba ilişkin rivayetler.',
  },
  {
    id: 'bukhari',
    title: 'Sahîh-i Buhârî',
    detail:
      'Veda Haccı, hac menâsiki ve insan haklarına ilişkin rivayetler.',
  },
];
