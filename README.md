# 🧩 Learnly

**Play-based learning for autistic children, with measurable progress and plain-language AI guidance for parents, and a consent-based way to share the child's profile with a specialist.**

Track: **AI for Learning & Work** · UI: Azerbaijani (primary), English, Russian

- **Demo:** `<NETLIFY_URL>`, demo accounts are listed [below](#demo-accounts)
- **Setup:** [SETUP.md](SETUP.md)

---

## 1. The user and the problem

**User:** parents and guardians in Azerbaijan of autistic children aged **3–10**.

**What goes wrong today:**
1. **Between therapy sessions, parents can't tell objectively what the child struggles with.** All they have is their own impression.
2. **Information about the child is scattered.** Doctor opinions are on paper, and diagnosis, co-occurring conditions and therapy notes are kept in different places.
3. **Finding a specialist goes through acquaintances.** With every new specialist, the parent has to explain everything again from scratch.

**Outcome:**
- After every lesson, the parent sees **objective numbers**: first-try accuracy, where the child got stuck, and the 7-day trend.
- One click gives an **AI review**: strengths, areas that need attention, and 3 concrete activities to do at home.
- The parent can send a request to a filtered specialist. The specialist then sees the full profile, and **only with explicit consent**.

## 2. Core scenario (what to try in the demo)

1. **Parent** registers and creates a child profile with a **6-step wizard**. Only 3 fields are required (name, birth date, diagnosis status); the rest can be filled in later and a completeness % is shown. The profile covers autism support level, co-occurring conditions (ADHD, epilepsy, speech delay …), doctor opinions (kept as history), health, medications (optional), and communication/sensory/interests.
2. **Child mode** is opened from the parent account; leaving it requires a 4-digit PIN. The child plays calm lessons: hand-washing, road safety, emotions, plus 2 games. Every attempt is logged: correctness, response time, hint use. Sound is muted by default when the profile says the child is highly sound-sensitive.
3. When a session ends, a SQL function computes the **session summary and 7-day skill stats**. The dashboard charts come from these numbers, with **no AI involved**.
4. **"Get AI review"** sends Gemini only a compact, pre-computed JSON (~1–2K tokens). It returns a structured report, which passes guardrails before the parent sees it.
5. **Teacher marketplace** has filters for specialization, city/district, format, language, experience, price and verified status. The parent sends a request with a **consent checkbox**, and the teacher immediately sees the child's full profile, read-only. **Access closes automatically** if the teacher rejects or the parent cancels.

## 3. How AI is used, and what it deliberately does not do

**Principle: code computes the numbers, AI interprets them.**

| Step | Who does it |
|---|---|
| Accuracy, stuck rate, trend, response time | **SQL** (`complete_session`, `_recompute_skill_stats`) |
| "Consult a specialist" flag (regression > 20 pp or ≥ 3 meltdowns/week) | **Code** (`specialistFlag`) |
| Explaining the numbers in plain language, personalising home activities to the child's communication level, sensory profile and interests, choosing next lessons | **Gemini** |
| Checking the AI output | **Code** (`validateReport`) |

**Guardrails** ([`report.ts`](supabase/functions/ai-report/report.ts)):
- **JSON schema** via Gemini `responseJsonSchema`, plus server-side shape validation.
- **No medication advice.** Mentions of medication or dosage in AZ/EN/RU are rejected.
- **No invented numbers.** Every percentage in the text must match a value from the input (±1).
- **Language check.** Output must be in the parent's language; Cyrillic mixed into Azerbaijani is rejected.
- **`next_lessons` filter.** Lessons that don't exist are removed.
- **Prompt injection.** Parent notes are wrapped in `<data>` and treated as data only.
- On any failure: 1 retry, then a **deterministic, numbers-only fallback report** (`status: fallback`). The parent never sees an unchecked AI answer.

**Data minimisation:** the child's name, birth date, doctor names, medications, allergies and raw answer events are **never sent** to the AI. The child's name is also redacted from free-text notes.

## 4. Architecture

```
React 19 + Vite + TS (Netlify)
   │ supabase-js (anon key + user JWT)
   ▼
Supabase
 ├─ Auth (email/password, roles: parent / teacher)
 ├─ Postgres + RLS: all CRUD directly from the client, no custom REST API
 ├─ RPC: complete_session, send_request, respond_to_request, cancel_request, set/verify_child_pin, seed_demo_history
 └─ Edge Function ai-report → Gemini (key only in Supabase Secrets)
```

**Privacy model (RLS):**
- A parent sees only their own children.
- A teacher sees a child only while a `pending`/`accepted` request exists, and never sees raw answer events.
- A teacher cannot edit the child profile.
- Roles cannot be self-escalated (column-level grants), and `is_verified` cannot be self-granted.
- Session results cannot be forged from the client.

## 5. Quality testing: what we tested and what broke

### Automated
| Suite | What it covers | How to run |
|---|---|---|
| **43 unit tests** ([tests/](tests)) | Data minimisation (no name, DOB or meds in the AI input; name redaction); specialist flag; every guardrail (meds, invented %, Cyrillic, bad JSON, unknown skill, invented lesson); the fallback report passes our own guardrails in AZ/EN/RU; lesson content matches DB `step_count`; profile completeness; teacher filters; i18n key parity, and every `t('…')` key in code exists | `npm test` |
| **35 security & metric checks on a live DB** ([scripts/rls-check.ts](scripts/rls-check.ts)) | Role escalation blocked; "admin" metadata at signup becomes "parent"; other parents can't read or write; teacher has no access before a request, gets it on request, loses it on reject and on end; consent is required; no duplicate active requests; raw events stay hidden from the teacher; forged summaries are blocked; metric math is checked on a crafted session (accuracy 1/4, solved 3/4, stuck 2, hints 1); PIN | `npm run test:rls` |
| **AI eval: 12 synthetic profiles** ([evals/](evals)), our system vs a baseline | Steady progress, sharp regression, stuck skill, little data, conflicting signals, many meltdowns, non-verbal/AAC, ADHD, **prompt injection**, **medication question**, Russian notes, all-good | `npm run eval` → [evals/RESULTS.md](evals/RESULTS.md) |

**Comparison with the current approach (baseline):** the same profiles, with *all* raw data (including name, medications, doctor name and ~month of raw answer events), are sent to the same model with a plain "write a report for the parent" prompt. We compare guardrail violations, name leaks, invented numbers, language errors and input tokens. *(Results: see `evals/RESULTS.md` after the run.)*

### What broke during development, and the fix
| What broke | How we found it | Fix |
|---|---|---|
| Azerbaijani language check let short English text through (letter threshold too high) | Unit test failed | Threshold lowered from 80 to 40 letters |
| A render error showed a blank white page | Manual test in the browser | Added `ErrorBoundary` with a recovery screen |
| A missing profile row (trigger not applied) left the user on an infinite spinner | Code review of the auth flow | Explicit "profile not found" screen with sign-out |
| React StrictMode double effects would create 2 sessions per lesson | Design review | Session start guarded per run with a ref |
| Gemini unavailable or rate-limited | By design (free tier) | Retry, then numbers-only fallback; the reason is stored in `ai_reports.failure_reason` |

## 6. Feasibility

- **Data:** no model training needed. Lesson content is written by the team, and a speech therapist/psychologist review is the next step. **The demo uses only synthetic data.**
- **Running cost:**
  - Hosting: Supabase and Netlify free tiers for the demo; production starts at about $25/month for Supabase Pro.
  - AI: one review is about 1–2K input tokens plus about 1–3K output (including thinking). At Gemini Flash paid-tier list prices that is **≈ $0.01 per review**, or about **$40–100/month for 1,000 children × 4 reviews**. Real per-report token counts are stored in `ai_reports.tokens_in/out` and measured by the eval.
- **Privacy note:** the Gemini *free* tier may use prompts to improve Google products. For real families we switch to the paid tier, where data is not used for training.
- **Next step:** a pilot with one rehabilitation centre and about 10 families, specialist review of lesson content, and compliance with Azerbaijan's personal-data law.

## 7. Design

- Colour palette from Sanzo Wada, *A Dictionary of Color Combinations*, **combination №218** (Helvetia Blue `#005b8d`, Grayish Lavender `#b5b1d8`, Deep Violet/Plumbeous `#70727c`). Status colours are Wada colours that appear in combinations *with* these three (Green Blue, Calamine Blue, Cream Yellow, Khaki, Pale Burnt Lake, Aconite Violet).
- Text colours are tuned to ≥ 4.5:1 contrast; child mode uses large touch targets, calm motion (respects `prefers-reduced-motion`) and no flashing or timers.

## 8. Originality

- Not a generic "autism chatbot". **Behavioural signals from play** (first-try accuracy, hesitation, hints) become a compact profile that AI explains. Safety-critical decisions (the specialist flag, the numbers) stay in code.
- **Consent-based, auto-revoking specialist access**, enforced in the database rather than the UI.
- **Sensory-aware child mode:** sound is muted for sound-sensitive children; no flashing, no timers, no penalties.

## 9. Disclosure: models, data, components, prior work

- **Model:** Google **Gemini** (`gemini-flash-latest`) via the Gemini API (free tier during the hackathon), used for text only. No image generation.
- **Data:** all child data in the demo, tests and evals is **synthetic and written by the team**. Lesson content is original. Pictures are [Lucide](https://lucide.dev) icons (ISC licence) plus hand-made SVG illustrations (emotion faces, traffic light, germs, toothbrush, crosswalk) — no AI-generated images.
- **Components:** React 19, Vite 8, TypeScript, Tailwind CSS 4, lucide-react, React Router, TanStack Query, i18next/react-i18next, Recharts, Supabase (Postgres, Auth, RLS, Edge Functions, supabase-js), `@google/genai`, Vitest, tsx.
- **AI assistance:** code was written with the help of an AI coding assistant (Claude Code).
- **Research done beforehand:** a concept document (problem, 3 modules) and a design plan. An earlier unfinished prototype under a different name existed; **no code from it was used**. This project was built after the hackathon started.

## Demo accounts

Created by `npm run seed:demo` (all data is synthetic):

| Role | Email | What you will see |
|---|---|---|
| Parent | `parent.demo@learnly.test` | 2 children (Aylin, Murad), each with 14 days of lesson history, observations, doctor opinions, charts |
| Teacher (speech therapist, verified) | `teacher.demo@learnly.test` | A **pending** request for Aylin, with the full read-only profile; accept / reject |
| Teacher (ABA, verified) | `teacher2.demo@learnly.test` | An **accepted** collaboration with Murad |
| Teachers 3–4 | `teacher3.demo@learnly.test`, `teacher4.demo@learnly.test` | Marketplace listings (psychologist, occupational therapist) |

Password for all demo accounts: `Learnly-Demo-2026` · Child-mode PIN (demo parent): `1234`

## Repository map

```
src/                          React app (pages/, features/, components/, i18n/, content/lessons.ts)
supabase/migrations/          schema + RLS + RPC (0001_schema.sql)
supabase/seed.sql             skills + lesson metadata
supabase/functions/ai-report/ Edge Function (index.ts) + pure AI logic & guardrails (report.ts)
tests/                        unit tests (Vitest)
scripts/                      seed-demo.ts, rls-check.ts
evals/                        12 synthetic profiles, eval runner, RESULTS.md
```
