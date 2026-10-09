# Quraşdırma (Supabase + Gemini + Netlify)

Təxminən 15 dəqiqə çəkir. Addımları ardıcıllıqla edin.

## 1. Supabase layihəsi

1. [supabase.com](https://supabase.com) → **New project**.
2. **SQL Editor → New query**: `supabase/migrations/0001_schema.sql` faylının bütün mətnini yapışdırın → **Run**.
3. Yeni query açın: `supabase/seed.sql` → **Run** (bacarıqlar və dərslər).

> Bu fayllar cədvəlləri, RLS qaydalarını, trigger-ləri və RPC funksiyalarını yaradır. Əlavə icazə ayarı lazım deyil.

## 2. Auth ayarları

**Authentication → Sign In / Providers → Email**
- Hakaton demosu üçün **"Confirm email"** seçimini **söndürün** (yoxsa hər qeydiyyatdan sonra e-poçt təsdiqi lazım olacaq).

**Authentication → URL Configuration**
- **Site URL**: Netlify ünvanınız (məs. `https://learnly-xxx.netlify.app`)
- **Redirect URLs**: `http://localhost:5173` əlavə edin

## 3. Açarlar → `.env`

**Project Settings → API** (və ya **API Keys**) bölməsindən:

```bash
cp .env.example .env
```

`.env` faylında doldurun:

| Dəyişən | Haradan | Brauzerə düşür? |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | Bəli (normaldır) |
| `VITE_SUPABASE_ANON_KEY` | `anon` və ya `publishable` açar | Bəli (normaldır, RLS qoruyur) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` / `secret` açar | **Xeyr.** Yalnız lokal skriptlər üçün. Heç vaxt `VITE_` ilə yazmayın, Netlify-a qoymayın |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) | **Xeyr.** Yalnız `npm run eval` üçün |

`.env` faylı `.gitignore`-dadır, repoya düşmür.

## 4. AI funksiyası (Edge Function `ai-report`)

### Variant A: CLI (tövsiyə olunur)
```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase secrets set GEMINI_API_KEY=<açarınız>
npx supabase functions deploy ai-report --no-verify-jwt
```
`--no-verify-jwt` təhlükəsizdir: funksiya istifadəçini özü yoxlayır (`auth.getUser()`), etibarsız token-ə 401 qaytarır. Bu, Supabase-in yeni API açarları (`sb_publishable_…`) ilə də problemsiz işləyir.
`<PROJECT_REF>`: layihə URL-indəki `https://<PROJECT_REF>.supabase.co` hissəsidir.

### Variant B: Dashboard
1. **Edge Functions → Deploy a new function → Via Editor**, adı: `ai-report`.
2. İki fayl yaradın və məzmununu köçürün: `index.ts` ← `supabase/functions/ai-report/index.ts`, `report.ts` ← `supabase/functions/ai-report/report.ts`.
3. Funksiyanın ayarlarında **"Enforce JWT verification"** seçimini söndürün (funksiya istifadəçini özü yoxlayır).
4. **Deploy**.
5. **Edge Functions → Secrets**: `GEMINI_API_KEY` əlavə edin.

Opsional secrets: `GEMINI_MODEL` (default `gemini-flash-latest`), `MAX_REPORTS_PER_DAY` (default `20`).

> **CORS** üçün heç nə etmək lazım deyil: funksiya lazımi başlıqları özü qaytarır. Supabase REST API isə bütün mənbələrə açıqdır (RLS ilə qorunur).
>
> Gemini açarı yoxdursa və ya limit dolubsa, sistem çökmür: rəqəmlərə əsaslanan AI-siz hesabat göstərilir (`status: fallback`).

## 5. Lokal işə salma

```bash
npm install
npm run dev
```
→ http://localhost:5173

## 6. Demo məlumatı (münsiflər üçün)

```bash
npm run seed:demo
```
4 müəllim profili, 1 demo valideyn və 14 günlük süni tarixçəsi olan demo uşaq (Aylin) yaradır. Hesablar və şifrə `README.md → Demo accounts` bölməsindədir.

## 7. Yoxlamalar

```bash
npm test            # 43 unit test (internet tələb etmir)
npm run test:rls    # məxfilik (RLS) + metriklər real bazada (müvəqqəti istifadəçilər yaradıb silir)
npm run eval        # AI eval: 12 süni profil, bizim sistem və baseline (Gemini açarı lazımdır)
```
`npm run eval` nəticələri `evals/RESULTS.md` faylına yazır. Bu fayl submission üçündür.

## 8. Netlify deploy

1. Repo-nu GitHub-a push edin → Netlify → **Add new site → Import from Git**.
2. Build ayarları `netlify.toml`-dan avtomatik oxunur (`npm run build`, `dist`).
3. **Site settings → Environment variables**: yalnız `VITE_SUPABASE_URL` və `VITE_SUPABASE_ANON_KEY`.
4. Deploy edildikdən sonra Supabase-də **Site URL**-i Netlify ünvanı ilə yeniləyin (addım 2).

SPA marşrutları üçün `public/_redirects` artıq hazırdır.

## Problemlər

| Simptom | Səbəb / həll |
|---|---|
| "Supabase qoşulmayıb" ekranı | `.env` boşdur və ya dev server yenidən başladılmayıb |
| Qeydiyyatdan sonra "Profile not found" | `0001_schema.sql` tam işləməyib (trigger yoxdur) |
| AI rəyi həmişə "AI əlçatan olmadı" | `GEMINI_API_KEY` secret yoxdur. Səbəb `ai_reports.failure_reason` sütununda yazılır |
| `daily_limit_reached` | `MAX_REPORTS_PER_DAY` secret-ini artırın |
| Demo tarixçə düyməsi xəta verir | `seed.sql` işə salınmayıb (dərslər cədvəli boşdur) |
