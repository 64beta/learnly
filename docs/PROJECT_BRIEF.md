Sən hakaton layihəsinə kömək edən köməkçisən. Aşağıda layihə haqqında tam kontekst var. Bütün cavablarını yalnız bu faktlara əsaslandır. Rəqəm və ya funksiya uydurma; nəyisə bilmirsənsə, "məlumat yoxdur" de.

TAPŞIRIQ: [bura nə istədiyini yaz — məs. "7 slaydlıq pitch deck mətni hazırla", "2 dəqiqəlik demo video ssenarisi yaz", "münsiflərin verə biləcəyi 10 sual və cavab hazırla"]

==================================================
LAYİHƏ: LEARNLY
==================================================

QISA TƏSVİR
Learnly autizmli uşaqlar üçün oyun əsaslı öyrənmə platformasıdır. Uşaq sakit, sadə dərslər keçir və sistem hər addımı ölçür. Valideyn aydın statistika və AI dəstəkli, sadə dildə tövsiyələr alır. Lazım olanda valideyn uşağın tam profilini razılığı ilə bir mütəxəssislə paylaşır.

HAKATON KONTEKSTİ
- Hakaton: NeuroBridge / OMNI AI Summit. Track: AI for Learning & Work.
- Qiymətləndirmə kartı (100 bal):
  - İstifadəçi üçün dəyər: 25
  - Prototip və AI-nin real töhfəsi: 30
  - Keyfiyyət testi (testlər, uğursuzluq nümunələri, mövcud yanaşma ilə müqayisə): 20
  - Reallıq (data, xərc, növbəti addım): 15
  - Orijinallıq: 10
- İlk turu GPT və Claude oxuyur, finalı insan münsiflər qiymətləndirir. Bərabərlikdə əvvəl prototip, sonra test balına baxılır.
- Tələblər: işləyən demo linki, quraşdırma təlimatı, mənbə kodu, ≤2 dəqiqəlik video, pitch deck (saat 20:00-a qədər). İstifadə olunan modellər, data və komponentlər açıqlanmalıdır. Layihə hakaton başlayandan sonra qurulub.

==================================================
1. İSTİFADƏÇİ VƏ PROBLEM
==================================================
İstifadəçi: Azərbaycanda 3–10 yaşlı autizmli uşağı olan valideynlər və qəyyumlar (ana, ata, qəyyum, digər ailə üzvü, konsultant/sosial işçi).
İkinci istifadəçi qrupu: mütəxəssislər — loqoped, defektoloq, ABA terapevt, psixoloq, erqoterapevt, xüsusi pedaqoq.

Bu gün nə pis gedir:
1. Terapiya seansları arasında valideyn uşağın nədə çətinlik çəkdiyini obyektiv bilmir. Əlində yalnız öz təəssüratı var.
2. Uşaq haqqında məlumat dağınıqdır: həkim rəyləri kağızdadır, diaqnoz, əlavə vəziyyətlər və terapiya qeydləri müxtəlif yerlərdə saxlanılır.
3. Mütəxəssis tanışlar vasitəsilə axtarılır. Hər yeni mütəxəssisə valideyn hər şeyi sıfırdan izah etməli olur.

Nəticə (həll edildikdən sonra):
- Hər dərsdən sonra obyektiv rəqəmlər görünür: ilk cəhddə düzgünlük, ilişmə, 7 günlük trend.
- Bir kliklə AI rəyi alınır: güclü tərəflər, diqqət tələb edən sahələr, evdə ediləcək 3 konkret fəaliyyət.
- Valideyn filtrlərlə mütəxəssis seçir və razılığı ilə uşağın tam profilini onunla paylaşır.

==================================================
2. MƏHSUL: 3 MODUL
==================================================

A) UŞAQ REJİMİ
- Uşağın ayrıca hesabı yoxdur. Rejim valideyn hesabından açılır, çıxmaq üçün valideynin 4 rəqəmli PIN-i lazımdır (PIN bcrypt hash ilə saxlanılır).
- 3 dərs:
  - "Əllərimizi yuyuruq" (gigiyena)
  - "Yolu təhlükəsiz keçirik" (təhlükəsizlik)
  - "Hisslərimizi tanıyırıq" (emosiyalar)
- 2 oyun:
  - "Günümü düzürəm" (ardıcıllıq)
  - "Fərqli olanı tap" (diqqət və məntiq)
- Addım növləri: məlumat kartı, seçim sualı, ardıcıllıqla düzmə.
- Hər sual üçün 3 cəhd var. 3-cü səhvdən sonra düzgün cavab yumşaq şəkildə göstərilir.
- "İpucu" düyməsi var. Səhvə görə cəza yoxdur, taymer yoxdur, yanıb-sönən element yoxdur.
- Profildə səsə yüksək həssaslıq qeyd olunubsa, səs default olaraq bağlıdır.
- Vizuallar vahid stilli SVG ikonlar (Lucide) və əl ilə çəkilmiş SVG illüstrasiyalardır: emosiya üzləri, svetofor, mikroblar və s. Emoji və AI ilə yaradılmış şəkil yoxdur.
- Dizayn: Sanzo Wada "A Dictionary of Color Combinations" kitabının №218 palitrası (Helvetia Blue, Grayish Lavender, Plumbeous). Sakit rənglər, böyük toxunma sahələri.
- Hər cəhd qeyd olunur: düzgün/səhv, cavab vaxtı (ms), ipucunun istifadəsi.

B) VALİDEYN PANELİ
- Qeydiyyatda "uşağa münasibət" sahəsi doldurulur.
- Uşaq profili 6 addımlı wizard ilə yaradılır:
  1. Əsas məlumat
  2. Diaqnoz: təsdiqlənib / şübhə var / qiymətləndirmə gedir; dəstək səviyyəsi 1–3; ICD kodu
  3. Əlavə vəziyyətlər (15 seçim): ADHD, intellektual ləngimə, nitq gecikməsi, epilepsiya, narahatlıq, yuxu, mədə-bağırsaq, qidalanma, sensor emal, dispraksiya, OKP, tik/Turett, eşitmə/görmə, genetik sindrom, digər
  4. Həkim rəyləri: tarixçə kimi saxlanılır — tarix, həkim, ixtisas, müəssisə, diaqnoz, ətraflı mətn, tövsiyələr, növbəti baxış
  5. Sağlamlıq: xroniki xəstəliklər, allergiyalar, dərmanlar (opsional)
  6. Gündəlik həyat: ünsiyyət səviyyəsi, alternativ ünsiyyət, sensor həssaslıq (səs/işıq/toxunma), maraqlar, hazırkı terapiyalar
- Yalnız 3 sahə məcburidir: ad, doğum tarixi, diaqnoz statusu. Qalan addımlar "Sonra doldururam" ilə keçilə bilər. Profildə doluluq faizi və çatışmayan bölmələrin linkləri göstərilir.
- Bir valideynin bir neçə uşağı ola bilər. Profili yalnız valideyn redaktə edir.
- Gündəlik müşahidə forması təxminən 30 saniyəyə doldurulur: əhval, yuxu, krizis (meltdown) və qeyd, sərbəst mətn.
- Dashboard:
  - bacarıq kartları: son 7 gündə düzgünlük, əvvəlki 7 gün, trend, ilişmə faizi, orta cavab vaxtı, dərs sayı;
  - gündəlik düzgünlük qrafiki;
  - son dərslər cədvəli.
- "AI-dan rəy al" düyməsi və əvvəlki rəylərin tarixçəsi.
- "Demo tarixçə yarat" düyməsi münsiflər üçündür: 14 günlük süni data yaradır, "demo" kimi işarələnir və silinə bilər.
- İnterfeys 3 dildədir: AZ (əsas), EN, RU.

C) MÜƏLLİM MARKETPLACE-İ (qəsdən AI-siz)
- Müəllim profilində bunlar var: ixtisaslar, təcrübə, şəhər və rayon, format (onlayn / mərkəzdə / evə gəlmə), dillər, qiymət aralığı (AZN), yaş qrupu, bio. "Təsdiqlənib" nişanını yalnız platforma verir.
- Valideyn üçün filtrlər: ixtisas, şəhər/rayon, format, dil, minimum təcrübə, maksimum qiymət, yalnız təsdiqlənmiş.
- İstək göndərilərkən razılıq qutusu məcburidir: "Uşağımın məlumatlarını bu müəllimlə paylaşmağa razıyam". Bu qayda bazada CHECK məhdudiyyəti ilə də yoxlanılır.
- İstək göndərildiyi anda müəllim uşağın tam profilini yalnız oxumaq üçün görür: diaqnoz, vəziyyətlər, həkim rəyləri, sağlamlıq (dərmanlar daxil), müşahidələr, statistika və AI rəyləri.
- Müəllim istəyi qəbul və ya rədd edir. Qəbuldan sonra tərəflər bir-birinin əlaqə məlumatını görür.
- Müəllim rədd edəndə, valideyn ləğv edəndə və ya əməkdaşlığı bitirəndə giriş avtomatik bağlanır.

==================================================
3. AI: NƏ EDİR, NƏ ETMİR
==================================================
Prinsip: rəqəmləri kod hesablayır, AI onları şərh edir.

Kim nə edir:
- SQL hesablayır:
  - düzgünlük = ilk cəhddə, ipucusuz düzgün addımlar / bütün addımlar;
  - həll faizi = ≤3 cəhddə həll edilən addımlar;
  - ilişmə = 20 saniyədən çox çəkən və ya ≥3 cəhd tələb edən addım;
  - trend = son 7 gün əvvəlki 7 günlə müqayisədə ±10 faiz bənd.
- Kod qərar verir: "mütəxəssislə məsləhətləşin" bayrağı (hər hansı bacarıqda 20 faiz bənddən çox geriləmə və ya həftədə ≥3 krizis).
- Gemini edir:
  - rəqəmləri valideyn üçün sadə dildə izah edir;
  - evdə ediləcək 3 fəaliyyəti uşağın ünsiyyət səviyyəsinə, sensor profilinə və maraqlarına uyğunlaşdırır;
  - növbəti dərsləri seçir.

Model və axın:
- Model: Google Gemini Flash (`gemini-flash-latest`, hazırda `gemini-3.8-flash`), demoda pulsuz səviyyə. Yalnız mətn istifadə olunur.
- Çağırış saytın öz server funksiyası (`/api/ai-report`, Vercel) vasitəsilə gedir. API açarı yalnız serverdə saxlanılır. Eyni kod Supabase Edge Function kimi də deploy oluna bilər.
- Model zənciri: `gemini-flash-latest` → `gemini-flash-lite-latest` → `gemini-2.5-flash`. Əsas model yüklənibsə (503/429) və ya cavab yoxlamadan keçmirsə, növbəti modelə keçilir.
- Real test: Aylin (süni profil) üçün əsas model 503 qaytardı, sistem ikinci modelə keçdi və 10.6 saniyəyə yoxlamalardan keçmiş, Azərbaycan dilində, uşağın sensor profilinə uyğun hesabat verdi (910 giriş / 801 çıxış token).
- Gemini-yə yalnız kompakt, əvvəlcədən hesablanmış JSON göndərilir (~1–2 min token). Cavab JSON sxemi ilə strukturlaşdırılır (`responseJsonSchema`).
- Cavabın sahələri: summary, strengths (≤3), attention_areas (≤3), home_activities (dəqiq 3), next_lessons (≤3), specialist_note.
- Cavab valideynin interfeys dilində yazılır (az/en/ru).

Guardrail-lar (kodda, cavab gəldikdən sonra):
1. Sxem və struktur yoxlaması.
2. Dərman/doza qadağası (AZ/EN/RU açar sözlər).
3. Uydurulmuş rəqəm yoxlaması: mətndəki hər faiz girişdəki dəyərlərdən biri olmalıdır (±1).
4. Dil yoxlaması: AZ mətnə kiril qarışmamalıdır.
5. Mövcud olmayan dərslər siyahıdan silinir.
6. Prompt injection: valideyn qeydləri <data> içində verilir və yalnız məlumat kimi qəbul edilir.
- Hər hansı yoxlama uğursuz olarsa, 1 dəfə təkrar cəhd edilir. Yenə alınmasa, AI-siz, yalnız rəqəmlərə əsaslanan ehtiyat hesabat göstərilir. Valideyn heç vaxt yoxlanılmamış AI cavabı görmür.
- Hər hesabat üçün AI-yə göndərilən dəqiq giriş, token sayı, model və uğursuzluq səbəbi saxlanılır.

Məlumat minimallaşdırması: uşağın adı, doğum tarixi (yalnız yaş göndərilir), həkimin adı, dərmanlar, allergiyalar və xam cavablar AI-yə göndərilmir. Uşağın adı sərbəst qeydlərdən də silinir.

==================================================
4. TEXNOLOGİYA VƏ TƏHLÜKƏSİZLİK
==================================================
- Frontend: React 19, Vite, TypeScript, Tailwind CSS 4, React Router, TanStack Query, i18next, Recharts. Hostinq: Netlify.
- Backend: Supabase (Postgres, Auth, Row Level Security, RPC funksiyaları, Edge Functions). Ayrıca REST API yazılmayıb: CRUD birbaşa client-dən gedir, onu RLS qoruyur.
- Rollar: valideyn və müəllim. Rolu sonradan dəyişmək mümkün deyil (column-level grant). Qeydiyyatda "admin" yazılsa belə, "parent" kimi qəbul olunur.
- Valideyn yalnız öz uşaqlarını görür.
- Müəllim uşağı yalnız aktiv istək olduqda görür. Xam cavabları heç vaxt görmür, profili redaktə edə bilmir.
- Dərs nəticələrini client saxtalaşdıra bilməz: onları yalnız server funksiyası yazır.

==================================================
5. KEYFİYYƏT TESTİ
==================================================
- 47 unit test (Vitest), hamısı keçir. Yoxladıqları:
  - AI-yə ad, doğum tarixi və dərmanın getməməsi;
  - mütəxəssis bayrağı;
  - hər guardrail;
  - ehtiyat hesabatın 3 dildə öz guardrail-larımızdan keçməsi;
  - kontentin bazadakı addım sayı ilə uyğunluğu;
  - profil doluluğu;
  - müəllim filtrləri;
  - tərcümə açarlarının tamlığı.
- 35 təhlükəsizlik və metrik yoxlaması real bazada işə salınıb: 35/35 keçdi. Yoxladıqları:
  - rolun dəyişdirilə bilməməsi;
  - başqa valideynin girişinin olmaması;
  - müəllimin istəkdən əvvəl girişinin olmaması, istəkdə açılması, rədd və bitirmədə bağlanması;
  - razılığın məcburi olması;
  - nəticələrin saxtalaşdırıla bilməməsi;
  - hazır sessiyada metrik riyaziyyatı: düzgünlük 1/4, həll 3/4, ilişmə 2, ipucu 1.
- AI eval: 12 süni profil, bizim sistem baseline ilə müqayisə olunur. Baseline = bütün xam data (ad, dərman, xam cavablar daxil) + "valideyn üçün hesabat yaz" promptu.
  - Profillər: sabit irəliləyiş, kəskin geriləmə, ilişmə, az data, ziddiyyətli siqnallar, çoxlu krizis, danışmayan uşaq, ADHD, prompt injection, dərman sualı, rus dilində qeydlər, hər şey yaxşı.
  - Ölçülənlər: guardrail pozuntuları, adın sızması, uydurma rəqəm, dil xətası, giriş tokeni, cavab vaxtı.
  - NƏTİCƏLƏR HƏLƏ ƏLDƏ EDİLMƏYİB (evals/RESULTS.md faylında olacaq). Rəqəm uydurma.
- İnkişaf zamanı tapılan və düzəldilən problemlər:
  1. AZ dil yoxlaması qısa ingilis mətnini buraxırdı. Unit test tutdu, hədd 80-dən 40 hərfə endirildi.
  2. Render xətası ağ ekran göstərirdi. Error boundary əlavə edildi.
  3. Profil sətri olmadıqda əbədi spinner fırlanırdı. Aydın xəta ekranı əlavə edildi.
  4. React StrictMode bir dərs üçün 2 sessiya yarada bilərdi. Qoruma əlavə edildi.
  5. Gemini əlçatan olmayanda və ya limit dolanda: təkrar cəhd, sonra AI-siz hesabat. Səbəb bazada saxlanılır.

==================================================
6. REALLIQ (FEASIBILITY)
==================================================
- Data: model öyrətmək lazım deyil. Kontenti komanda yazıb. Demoda yalnız süni data istifadə olunur, real uşaq məlumatı yoxdur.
- Xərc:
  - Demo: Supabase və Netlify pulsuz səviyyədə.
  - Real istifadə: Supabase Pro təxminən $25/ay-dan başlayır.
  - AI: bir rəy təxminən $0.01 tutur (Gemini Flash pullu qiyməti ilə). 1000 uşaq ayda 4 rəy alsa, təxminən $40–100/ay. Real token sayı hər hesabatda saxlanılır.
- Məxfilik: Gemini-nin pulsuz səviyyəsində göndərilən məlumat Google-un təlimində istifadə oluna bilər. Real ailələr üçün pullu səviyyəyə keçilir.
- Növbəti addım: 1 reabilitasiya mərkəzi ilə təxminən 10 ailəlik pilot, kontentin loqoped və psixoloq tərəfindən yoxlanması, Azərbaycanın şəxsi məlumatlar qanununa uyğunluq.

==================================================
7. ORİJİNALLIQ
==================================================
- Adi "autizm chatbotu" deyil: oyundan gələn davranış siqnalları (ilk cəhd, tərəddüd, ipucu) kompakt profilə çevrilir və AI onu izah edir. Təhlükəsizlik baxımından vacib qərarlar kodda qalır.
- Mütəxəssis girişi razılığa əsaslanır və avtomatik geri alınır. Bu, interfeysdə deyil, bazanın özündə tətbiq olunur.
- Sensor profilə uyğunlaşan uşaq rejimi.

==================================================
8. AÇIQLAMALAR (DISCLOSURE)
==================================================
- Model: Google Gemini Flash, yalnız mətn üçün.
- Data: tam süni, komanda tərəfindən yazılıb. Vizuallar Lucide ikonları və öz SVG illüstrasiyalarımızdır.
- Komponentlər: React, Vite, TypeScript, Tailwind, lucide-react, React Router, TanStack Query, i18next, Recharts, Supabase, @google/genai, Vitest.
- Kod AI kodlaşdırma köməkçisi (Claude Code) ilə yazılıb.
- Əvvəlcədən görülən iş: konsept sənədi və dizayn planı. Başqa adla bitməmiş köhnə prototip var idi, ondan heç bir kod istifadə olunmayıb.

==================================================
9. DEMO AXINI (≤2 DƏQİQƏ VİDEO ÜÇÜN)
==================================================
1. Valideyn girişi → uşaq profili: wizard, doluluq faizi.
2. Uşaq rejimi → "Əllərimizi yuyuruq": səhv cavab yumşaq qarşılanır, ipucu, ardıcıllıq tapşırığı → "Afərin".
3. Dashboard → bacarıq kartları (gigiyena ↑, təhlükəsizlik ↓, emosiyalarda ilişmə) və qrafik.
4. "AI-dan rəy al" → xülasə, güclü tərəflər, diqqət sahələri, 3 ev fəaliyyəti, mütəxəssis tövsiyəsi.
5. Marketplace → filtr → istək + razılıq qutusu → müəllim hesabında uşağın tam profili görünür → valideyn ləğv edir → müəllimdə "giriş bağlıdır".

Demo hesablar (süni):
- Valideyn: parent.demo@learnly.test
- Müəllim: teacher.demo@learnly.test
- Şifrə: Learnly-Demo-2026
- Uşaq rejimi PIN: 1234
- Demo uşaq: "Aylin", 14 günlük süni tarixçə ilə.

==================================================
10. HAZIRKI VƏZİYYƏT
==================================================
Hazırdır:
- bütün frontend;
- baza sxemi və RLS;
- AI funksiyası;
- unit testlər, təhlükəsizlik yoxlama skripti, eval skripti;
- README (münsiflər üçün) və SETUP sənədi.

Qalır:
- AI funksiyasının deploy-u;
- demo datanın yaradılması;
- təhlükəsizlik testinin real bazada işə salınması;
- eval nəticələri;
- Netlify deploy və demo linki;
- video və pitch deck.
