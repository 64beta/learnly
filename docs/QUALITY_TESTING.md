# Learnly — Quality testing results

All numbers below come from runs on 9 October 2026. Every test uses **synthetic data only** — no real child data was used anywhere.

## 1. What we tested

| Suite | Scope | Result | Reproduce |
|---|---|---|---|
| **Unit tests** (Vitest) | Data minimisation (no name, birth date or medications reach the AI; the child's name is redacted from free-text notes) · every AI guardrail (medication/dosage talk, invented percentages, wrong language, broken JSON, unknown skills, non-existent lessons) · Gemini model fallback chain · numbers-only fallback report passes our own checks in AZ/EN/RU · progress metrics · profile completeness · teacher filters · lesson content matches the database · all UI translation keys exist | **47 / 47 pass** | `npm test` |
| **Live security & metric checks** (real Supabase database, temporary users) | Role escalation blocked · another parent cannot read or edit a child · a teacher sees nothing before a request, sees the full profile once the parent sends it **with consent**, and loses access automatically on reject or cancel · raw answers never visible to teachers · results cannot be forged from the browser · metric maths on a crafted session (first-try accuracy 1/4, solved 3/4, stuck 2, hints 1) · child-mode PIN | **35 / 35 pass** | `npm run test:rls` |
| **AI evaluation vs today's approach** | 12 synthetic child profiles: steady progress, sharp regression, stuck on one skill, very little data, conflicting signals, frequent meltdowns, non-verbal child, ADHD, Russian-language notes, all-good, plus 2 adversarial cases (prompt injection in a parent note, a direct medication-dosage question) | see §2 | `npm run eval` → `evals/RESULTS.md` |
| **Live end-to-end runs** | Real parent account → real database → AI endpoint → Gemini → checks → saved review | 200 OK, 8.6–21 s per review | — |

## 2. Comparison with how it is done today

**Today:** a parent who wants help understanding progress pastes everything they have — the child's name, medications, the doctor's name, a month of raw answers — into a general chatbot and asks for a report.
**Learnly:** code computes the metrics; the AI receives only a ~700-token anonymised summary, must answer in a fixed structure, and every answer is checked before a parent sees it.

Same Gemini models on both sides (`gemini-flash-latest → gemini-flash-lite-latest → gemini-2.5-flash`), same 12 profiles.

| Metric | Learnly | Today's approach |
|---|---|---|
| Model's **first** answer passed every check | **12 / 12** | 0 / 12 |
| Answer shown to the parent was checked (guardrails → model chain → numbers-only fallback) | **12 / 12** | 0 / 12 |
| Child's name appears in the answer | **0 / 12** (the name is never sent) | 12 / 12 |
| Medication or dosage discussed in the answer | **0 / 12** | 12 / 12 |
| Adversarial cases resisted (prompt injection, dosage question) | **2 / 2** | 0 / 2 |
| "Consult a specialist" note present where the code raised the flag | **12 / 12** | n/a (no structure) |
| Average input tokens | **689** | 5,090 (≈ 7× more) |
| Average latency | 10.2 s | 13.6 s |

Note on fairness: the baseline mentions the name and medications because it was given them — which is exactly what happens when a parent pastes records into a chatbot. Learnly avoids this by design (data minimisation) and enforces it with checks.

## 3. Failures we hit and how we fixed them

| What broke | How we found it | Fix | Verified by |
|---|---|---|---|
| **Gemini returned `503 high demand`** on the primary model | Live AI run | Model chain (primary → lite → 2.5 Flash) with a short back-off, then a numbers-only fallback report | Next live run succeeded on the second model in 10.6 s; in the eval 11 of 12 answers came from the fallback model |
| **`504` timeout** on the deployed AI endpoint | First Vercel deploy | 60 s function limit, function moved next to the database (Frankfurt), 20 s per-call and 40 s total AI budget, frontend falls back instead of failing | Unit tests for the chain; live runs 8.6–21 s |
| **`400` / `401` on AI requests** — the shared demo account's sessions died | User report on the deployed site | Sign-out now ends only the current browser (the default ended every session of the account); access tokens are refreshed before AI calls; clear "session expired" message | Live check: 3 concurrent sessions, one signs out, the other two keep working and refreshing |
| AI review came back **in English** after the language switch | User report | The request now carries the language currently on screen | Live run in Azerbaijani |
| Azerbaijani **language check let short English text through** | Unit test failed | Lowered the length threshold | Unit tests |
| **PIN field seemed not to accept input** (tiny dots, letters silently dropped, possible password-manager interference) | User report | 4-box numeric PIN, "digits only" warning, paste support, account-password escape hatch | Manual browser test |
| **Blank page** on an unexpected render error | Manual testing | Error boundary with a recovery screen | Manual test |
| **`server_keys_missing`** on the first deploy | User report | Error now names the missing variable; deploy picked up the variables | Live endpoint check |

## 4. Known limitations (honest)

- Profiles are synthetic; usefulness of the advice has **not yet** been rated by parents or specialists — that is the first step of the pilot.
- The invented-number check covers percentages only; the medication check is keyword-based (AZ / EN / RU).
- On Gemini's free tier a review takes ~8–25 s and the primary model is often overloaded; production would use the paid tier (also required so that data is not used for training).
