// src/data/zikirData.js

export const PRESET_ZIKIRS = [
  /* ================================================================
     GÜNLÜK — her zaman çekilebilecek temel zikirler
     ================================================================ */
  { id: 'z1',  name: 'Sübhanallah', target: 33, category: 'Günlük' },
  { id: 'z2',  name: 'Elhamdülillah', target: 33, category: 'Günlük' },
  { id: 'z3',  name: 'Allahu Ekber', target: 33, category: 'Günlük' },
  { id: 'z4',  name: 'Sübhanallahi ve bihamdihi', target: 100, category: 'Günlük' },
  { id: 'z5',  name: 'Sübhanallahil azim', target: 100, category: 'Günlük' },
  { id: 'z6',  name: 'Sübhanallahi ve bihamdihi sübhanallahil azim', target: 100, category: 'Günlük' },
  { id: 'z7',  name: 'La havle ve la kuvvete illa billah', target: 100, category: 'Günlük' },
  { id: 'z8',  name: 'Hasbünallahu ve ni\'mel vekil', target: 100, category: 'Günlük' },
  { id: 'z9',  name: 'La ilahe illa ente sübhaneke inni küntü minez zalimin', target: 33, category: 'Günlük' },
  { id: 'z10', name: 'Bismillah', target: 33, category: 'Günlük' },
  { id: 'z11', name: 'Bismillahirrahmanirrahim', target: 33, category: 'Günlük' },
  { id: 'z12', name: 'Maşallah', target: 33, category: 'Günlük' },
  { id: 'z13', name: 'Allahümme barik', target: 33, category: 'Günlük' },
  { id: 'z14', name: 'Radıyallahu anh', target: 33, category: 'Günlük' },
  { id: 'z15', name: 'Sübhanallahi ve bihamdihi adede halkıhi', target: 3, category: 'Günlük' },

  /* ================================================================
     TESBİHAT — namaz sonrası tesbihatın parçası
     ================================================================ */
  { id: 'z16', name: 'La ilahe illallah vahdehu la şerike leh', target: 100, category: 'Tesbihat' },
  { id: 'z17', name: 'Sübhanallahi velhamdülillahi ve la ilahe illallahu vallahu ekber', target: 33, category: 'Tesbihat' },
  { id: 'z18', name: 'La havle ve la kuvvete illa billahil aliyyil azim', target: 100, category: 'Tesbihat' },
  { id: 'z19', name: 'Allahümme entesselam ve minkesselam', target: 1, category: 'Tesbihat' },
  { id: 'z20', name: 'Ayetü\'l Kürsi', target: 1, category: 'Tesbihat' },

  /* ================================================================
     İSTİĞFAR — bağışlanma zikirleri
     ================================================================ */
  { id: 'z21', name: 'Estağfirullah', target: 100, category: 'İstiğfar' },
  { id: 'z22', name: 'Estağfirullahe ve etûbü ileyh', target: 100, category: 'İstiğfar' },
  { id: 'z23', name: 'Estağfirullahe\'l-azîm', target: 33, category: 'İstiğfar' },
  { id: 'z24', name: 'Estağfirullah el-kerîm', target: 33, category: 'İstiğfar' },
  { id: 'z25', name: 'Rabbiğfir lî ve tüb aleyye', target: 100, category: 'İstiğfar' },
  { id: 'z26', name: 'Allahümme inneke afüvvün tuhibbül afve fa\'fü annî', target: 33, category: 'İstiğfar' },
  { id: 'z27', name: 'Seyyidül istiğfar', target: 1, category: 'İstiğfar' },
  { id: 'z28', name: 'Rabbena zalemna enfusena', target: 33, category: 'İstiğfar' },
  { id: 'z29', name: 'Rabbenâğfir lî ve li vâlideyye ve lil mü\'minîn', target: 33, category: 'İstiğfar' },

  /* ================================================================
     SALAVAT — Peygamberimize salat ve selam
     ================================================================ */
  { id: 'z30', name: 'Allahümme salli ala Muhammed', target: 100, category: 'Salavat' },
  { id: 'z31', name: 'Allahümme salli ve sellim ala nebiyyina Muhammed', target: 100, category: 'Salavat' },
  { id: 'z32', name: 'Sallallahu aleyhi ve sellem', target: 100, category: 'Salavat' },
  { id: 'z33', name: 'Salavat-ı Şerife', target: 100, category: 'Salavat' },
  { id: 'z34', name: 'Allahümme salli ala seyyidina Muhammed', target: 100, category: 'Salavat' },
  { id: 'z35', name: 'Salavat-ı İbrahimiyye', target: 1, category: 'Salavat' },
  { id: 'z36', name: 'Allahümme salli ala Muhammedin ve ala ali Muhammed', target: 100, category: 'Salavat' },

  /* ================================================================
     TEVHİD — Allah'ın birliği
     ================================================================ */
  { id: 'z37', name: 'La ilahe illallah', target: 100, category: 'Tevhid' },
  { id: 'z38', name: 'La ilahe illallah', target: 1000, category: 'Tevhid' },
  { id: 'z39', name: 'La ilahe illallahu vahdehu la şerike leh', target: 100, category: 'Tevhid' },
  { id: 'z40', name: 'Muhammedün Resulullah', target: 100, category: 'Tevhid' },
  { id: 'z41', name: 'La ilahe illallahül melikül hakkul mübin', target: 100, category: 'Tevhid' },
  { id: 'z42', name: 'Kul hüvallahu ehad', target: 3, category: 'Tevhid' },

  /* ================================================================
     ESMÂÜL HÜSNÂ — 99 ismin tamamı
     ================================================================ */
  { id: 'z43',  name: 'Ya Allah', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z44',  name: 'Ya Rahman', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z45',  name: 'Ya Rahim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z46',  name: 'Ya Melik', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z47',  name: 'Ya Kuddüs', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z48',  name: 'Ya Selam', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z49',  name: 'Ya Mümin', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z50',  name: 'Ya Müheymin', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z51',  name: 'Ya Aziz', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z52',  name: 'Ya Cebbar', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z53',  name: 'Ya Mütekebbir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z54',  name: 'Ya Halik', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z55',  name: 'Ya Bari', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z56',  name: 'Ya Musavvir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z57',  name: 'Ya Gaffar', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z58',  name: 'Ya Kahhar', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z59',  name: 'Ya Vehhab', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z60',  name: 'Ya Rezzak', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z61',  name: 'Ya Fettah', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z62',  name: 'Ya Alim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z63',  name: 'Ya Kabıd', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z64',  name: 'Ya Basıt', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z65',  name: 'Ya Hafıd', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z66',  name: 'Ya Rafi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z67',  name: 'Ya Muiz', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z68',  name: 'Ya Müzil', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z69',  name: 'Ya Semi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z70',  name: 'Ya Basir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z71',  name: 'Ya Hakem', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z72',  name: 'Ya Adl', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z73',  name: 'Ya Latif', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z74',  name: 'Ya Habir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z75',  name: 'Ya Halim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z76',  name: 'Ya Azim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z77',  name: 'Ya Gafur', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z78',  name: 'Ya Şekur', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z79',  name: 'Ya Aliyy', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z80',  name: 'Ya Kebir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z81',  name: 'Ya Hafiz', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z82',  name: 'Ya Mukit', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z83',  name: 'Ya Hasib', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z84',  name: 'Ya Celil', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z85',  name: 'Ya Kerim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z86',  name: 'Ya Rakib', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z87',  name: 'Ya Mücib', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z88',  name: 'Ya Vasi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z89',  name: 'Ya Hakim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z90',  name: 'Ya Vedud', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z91',  name: 'Ya Mecid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z92',  name: 'Ya Bais', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z93',  name: 'Ya Şehid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z94',  name: 'Ya Hakk', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z95',  name: 'Ya Vekil', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z96',  name: 'Ya Kaviyy', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z97',  name: 'Ya Metin', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z98',  name: 'Ya Veliyy', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z99',  name: 'Ya Hamid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z100', name: 'Ya Muhsi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z101', name: 'Ya Mübdi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z102', name: 'Ya Muid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z103', name: 'Ya Muhyi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z104', name: 'Ya Mümit', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z105', name: 'Ya Hayy', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z106', name: 'Ya Kayyum', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z107', name: 'Ya Vacid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z108', name: 'Ya Macid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z109', name: 'Ya Vahid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z110', name: 'Ya Samed', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z111', name: 'Ya Kadir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z112', name: 'Ya Muktedir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z113', name: 'Ya Mukaddim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z114', name: 'Ya Muahhir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z115', name: 'Ya Evvel', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z116', name: 'Ya Ahir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z117', name: 'Ya Zahir', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z118', name: 'Ya Batın', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z119', name: 'Ya Vali', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z120', name: 'Ya Müteali', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z121', name: 'Ya Berr', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z122', name: 'Ya Tevvab', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z123', name: 'Ya Müntekim', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z124', name: 'Ya Afüvv', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z125', name: 'Ya Rauf', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z126', name: 'Ya Malikül Mülk', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z127', name: 'Ya Zül Celali Vel İkram', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z128', name: 'Ya Muksit', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z129', name: 'Ya Cami', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z130', name: 'Ya Ganiyy', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z131', name: 'Ya Mugni', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z132', name: 'Ya Mani', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z133', name: 'Ya Darr', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z134', name: 'Ya Nafi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z135', name: 'Ya Nur', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z136', name: 'Ya Hadi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z137', name: 'Ya Bedi', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z138', name: 'Ya Baki', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z139', name: 'Ya Varis', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z140', name: 'Ya Reşid', target: 100, category: 'Esmaül Hüsna' },
  { id: 'z141', name: 'Ya Sabur', target: 100, category: 'Esmaül Hüsna' },

  /* ================================================================
     SABAH — sadece sabah okunan özel zikirler
     ================================================================ */
  { id: 'z142', name: 'Âmene\'r-Resûlü', target: 1, category: 'Sabah' },
  { id: 'z143', name: 'Radîtü billahi rabben', target: 3, category: 'Sabah' },
  { id: 'z144', name: 'Allahümme bike asbahna', target: 1, category: 'Sabah' },
  { id: 'z145', name: 'La ilahe illallah vahdehu la şerike leh', target: 10, category: 'Sabah' },

  /* ================================================================
     AKŞAM — sadece akşam okunan özel zikirler
     ================================================================ */
  { id: 'z146', name: 'Allahümme bike emseyna', target: 1, category: 'Akşam' },
  { id: 'z147', name: 'Euzü bi kelimatillahit tammati', target: 3, category: 'Akşam' },

  /* ================================================================
     SABAH & AKŞAM — ortak okunan sureler ve zikirler
     ================================================================ */
  { id: 'z148', name: 'İhlâs Suresi', target: 3, category: 'Sabah & Akşam' },
  { id: 'z149', name: 'Felak Suresi', target: 3, category: 'Sabah & Akşam' },
  { id: 'z150', name: 'Nas Suresi', target: 3, category: 'Sabah & Akşam' },
  { id: 'z151', name: 'Bismillahillezi la yedurru', target: 3, category: 'Sabah & Akşam' },

  /* ================================================================
     ŞÜKÜR — şükür zikirleri
     ================================================================ */
  { id: 'z152', name: 'Elhamdülillahi rabbil alemin', target: 33, category: 'Şükür' },
  { id: 'z153', name: 'Şükürler olsun Allah\'ım', target: 33, category: 'Şükür' },
  { id: 'z154', name: 'Elhamdülillahi ala külli hal', target: 33, category: 'Şükür' },
  { id: 'z155', name: 'Elhamdülillah', target: 1000, category: 'Şükür' },

  /* ================================================================
     DUA — dua ayetleri
     ================================================================ */
  { id: 'z156', name: 'Rabbena atina fid dünya haseneten', target: 33, category: 'Dua' },
  { id: 'z157', name: 'Rabbi zidni ilma', target: 33, category: 'Dua' },
  { id: 'z158', name: 'Hasbiyallahu la ilahe illa hu', target: 100, category: 'Dua' },
  { id: 'z159', name: 'Allahümme inni es\'elükel afve vel afiye', target: 33, category: 'Dua' },
  { id: 'z160', name: 'Rabbena heb lena min ezvacina', target: 33, category: 'Dua' },
  { id: 'z161', name: 'Ya Hayyu ya Kayyum birahmetike esteğis', target: 33, category: 'Dua' },
  { id: 'z162', name: 'Allahümme inni es\'elükel cennete', target: 33, category: 'Dua' },
  { id: 'z163', name: 'Allahümme ecirni minen nar', target: 7, category: 'Dua' },
  { id: 'z164', name: 'Rabbi yessir ve la tuassir', target: 33, category: 'Dua' },
  { id: 'z165', name: 'İnna lillahi ve inna ileyhi raciun', target: 33, category: 'Dua' },
  { id: 'z166', name: 'Allahümme inni es\'elüke ilmen nafi\'an', target: 33, category: 'Dua' },
  { id: 'z167', name: 'Rabbena la tüziğ kulubena', target: 33, category: 'Dua' },
  { id: 'z168', name: 'Rabbenâ âtinâ min ledünke rahmeten', target: 33, category: 'Dua' },
  { id: 'z169', name: 'Allahümme inni es\'elükessıhhate vel afiyete', target: 33, category: 'Dua' },
  { id: 'z170', name: 'Allahümme inni eûzü bike minel hemmi vel hazen', target: 33, category: 'Dua' },
  { id: 'z171', name: 'Rabbena tekabbel minna', target: 33, category: 'Dua' },
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