-- Learnly: bütün quraşdırma bir faylda (0001_schema.sql + seed.sql).
-- Supabase SQL Editor-ə yapışdırın və Run basın. Yalnız BİR DƏFƏ işə salın.

-- =====================================================================
-- Learnly — sxem, RLS, funksiyalar
-- Supabase SQL Editor-də bir dəfə işə salın (və ya `supabase db push`).
-- Sonra supabase/seed.sql faylını işə salın.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 1. Hesablar
-- ---------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            text not null check (role in ('parent', 'teacher')),
  full_name       text not null default '',
  phone           text,
  city            text,
  locale          text not null default 'az' check (locale in ('az', 'en', 'ru')),
  parent_relation text check (parent_relation in ('mother', 'father', 'guardian', 'relative', 'consultant')),
  created_at      timestamptz not null default now()
);

-- Uşaq rejimindən çıxış PIN-i ayrıca cədvəldə saxlanılır ki, heç bir
-- siyasət onu başqasına göstərməsin. Yalnız RPC ilə oxunur və yazılır.
create table public.parent_settings (
  parent_id      uuid primary key references public.profiles(id) on delete cascade,
  child_pin_hash text
);

create table public.teacher_profiles (
  id               uuid primary key references public.profiles(id) on delete cascade,
  display_name     text not null default '',
  specializations  text[] not null default '{}',
  experience_years int not null default 0 check (experience_years between 0 and 60),
  city             text,
  district         text,
  formats          text[] not null default '{}',
  languages        text[] not null default '{az}',
  price_min        numeric(8, 2),
  price_max        numeric(8, 2),
  age_min          int not null default 2,
  age_max          int not null default 18,
  bio              text,
  is_verified      boolean not null default false,
  is_listed        boolean not null default true,
  updated_at       timestamptz not null default now()
);
create trigger teacher_profiles_updated before update on public.teacher_profiles
  for each row execute function public.set_updated_at();

-- Qeydiyyatda profili avtomatik yaradır. Rol metadata-dan gəlir, amma
-- istifadəçi metadata-nı özü göndərdiyi üçün yalnız parent/teacher qəbul olunur.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role   text := m->>'role';
  v_locale text := m->>'locale';
  v_rel    text := m->>'parent_relation';
begin
  if v_role is null or v_role not in ('parent', 'teacher') then
    v_role := 'parent';
  end if;
  if v_locale is null or v_locale not in ('az', 'en', 'ru') then
    v_locale := 'az';
  end if;
  if v_role <> 'parent' or v_rel not in ('mother', 'father', 'guardian', 'relative', 'consultant') then
    v_rel := null;
  end if;

  insert into public.profiles (id, role, full_name, phone, city, locale, parent_relation)
  values (new.id, v_role, left(coalesce(m->>'full_name', ''), 120), left(m->>'phone', 40),
          left(m->>'city', 80), v_locale, v_rel);

  if v_role = 'teacher' then
    insert into public.teacher_profiles (id, display_name, city)
    values (new.id, left(coalesce(m->>'full_name', ''), 120), left(m->>'city', 80));
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- 2. Uşaq
-- ---------------------------------------------------------------------
create table public.children (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  first_name          text not null check (length(trim(first_name)) between 1 and 60),
  birth_date          date not null check (birth_date > date '2000-01-01'),
  gender              text check (gender in ('male', 'female')),
  diagnosis_status    text not null check (diagnosis_status in ('confirmed', 'suspected', 'in_evaluation')),
  support_level       smallint check (support_level between 1 and 3),
  diagnosis_date      date,
  diagnosed_by        text,
  icd_code            text,
  conditions_reviewed boolean not null default false,
  chronic_conditions  text,
  allergies           text,
  medications         text,
  health_reviewed     boolean not null default false,
  communication_level text check (communication_level in ('verbal', 'limited', 'nonverbal')),
  uses_aac            boolean,
  sensory             jsonb not null default '{}'::jsonb,
  interests           text[] not null default '{}',
  current_therapies   text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index children_parent_idx on public.children(parent_id);
create trigger children_updated before update on public.children
  for each row execute function public.set_updated_at();

create table public.child_conditions (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references public.children(id) on delete cascade,
  condition_code text not null check (condition_code in (
    'adhd', 'intellectual_disability', 'speech_delay', 'epilepsy', 'anxiety', 'sleep', 'gastro',
    'feeding', 'sensory_processing', 'dyspraxia', 'ocd', 'tic', 'hearing_vision', 'genetic', 'other')),
  status         text not null default 'confirmed' check (status in ('confirmed', 'suspected')),
  note           text,
  unique (child_id, condition_code)
);

create table public.medical_opinions (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references public.children(id) on delete cascade,
  opinion_date    date not null,
  doctor_name     text,
  specialty       text,
  institution     text,
  diagnosis_text  text,
  opinion_text    text not null,
  recommendations text,
  next_visit_date date,
  created_at      timestamptz not null default now()
);
create index medical_opinions_child_idx on public.medical_opinions(child_id, opinion_date desc);

create table public.observations (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children(id) on delete cascade,
  observed_on   date not null default current_date,
  mood          text check (mood in ('good', 'neutral', 'bad')),
  sleep         text check (sleep in ('good', 'ok', 'bad')),
  meltdown      boolean not null default false,
  meltdown_note text,
  free_text     text check (length(free_text) <= 2000),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (child_id, observed_on)
);

-- ---------------------------------------------------------------------
-- 3. Kontent (dərslərin özü frontend-də src/content/lessons.ts faylındadır)
-- ---------------------------------------------------------------------
create table public.skills (
  code  text primary key,
  name  jsonb not null,
  sort  int not null default 0
);

create table public.lessons (
  slug         text primary key,
  skill_code   text not null references public.skills(code),
  kind         text not null check (kind in ('lesson', 'game')),
  level        smallint not null default 1 check (level between 1 and 3),
  age_min      int not null default 3,
  age_max      int not null default 10,
  title        jsonb not null,
  step_count   int not null check (step_count > 0),
  is_published boolean not null default true,
  sort         int not null default 0
);

-- ---------------------------------------------------------------------
-- 4. İzləmə
-- ---------------------------------------------------------------------
create table public.activity_sessions (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children(id) on delete cascade,
  lesson_slug text not null references public.lessons(slug),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  status      text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  is_demo     boolean not null default false
);
create index activity_sessions_child_idx on public.activity_sessions(child_id, started_at desc);

create table public.answer_events (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.activity_sessions(id) on delete cascade,
  step_id     text not null,
  attempt_no  int not null check (attempt_no between 1 and 10),
  is_correct  boolean not null,
  response_ms int not null check (response_ms between 0 and 600000),
  hint_used   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index answer_events_session_idx on public.answer_events(session_id);

create table public.session_summaries (
  session_id      uuid primary key references public.activity_sessions(id) on delete cascade,
  child_id        uuid not null references public.children(id) on delete cascade,
  lesson_slug     text not null references public.lessons(slug),
  skill_code      text not null references public.skills(code),
  step_count      int not null,
  accuracy        numeric(5, 4) not null,  -- ilk cəhddə, ipucusuz düzgün / bütün addımlar
  solved_rate     numeric(5, 4) not null,  -- ≤3 cəhddə həll edilən / bütün addımlar
  avg_response_ms int not null,
  stuck_count     int not null,            -- >20 san. və ya ≥3 cəhd çəkən addımlar
  hints_used      int not null,
  duration_s      int not null,
  completed_at    timestamptz not null default now()
);
create index session_summaries_child_idx on public.session_summaries(child_id, completed_at desc);

create table public.child_skill_stats (
  child_id           uuid not null references public.children(id) on delete cascade,
  skill_code         text not null references public.skills(code),
  sessions_7d        int not null default 0,
  accuracy_7d        numeric(5, 4),
  accuracy_prev_7d   numeric(5, 4),
  avg_response_ms_7d int,
  stuck_rate_7d      numeric(5, 4),
  trend              text not null default 'flat' check (trend in ('up', 'down', 'flat')),
  total_sessions     int not null default 0,
  last_activity_at   timestamptz,
  updated_at         timestamptz not null default now(),
  primary key (child_id, skill_code)
);

-- ---------------------------------------------------------------------
-- 5. AI və müəllim istəkləri
-- ---------------------------------------------------------------------
create table public.ai_reports (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references public.children(id) on delete cascade,
  period_start   date not null,
  period_end     date not null,
  input_snapshot jsonb not null,
  output         jsonb not null,
  status         text not null check (status in ('ok', 'fallback')),
  failure_reason text,
  model          text,
  tokens_in      int,
  tokens_out     int,
  created_at     timestamptz not null default now()
);
create index ai_reports_child_idx on public.ai_reports(child_id, created_at desc);

create table public.teacher_requests (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid not null references public.profiles(id) on delete cascade,
  child_id      uuid not null references public.children(id) on delete cascade,
  teacher_id    uuid not null references public.teacher_profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'ended')),
  message       text,
  consent_given boolean not null check (consent_given = true),
  consent_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz
);
create unique index teacher_requests_one_active
  on public.teacher_requests(child_id, teacher_id) where status in ('pending', 'accepted');

-- ---------------------------------------------------------------------
-- 6. Giriş köməkçiləri
-- ---------------------------------------------------------------------
create or replace function public.owns_child(p_child uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.children where id = p_child and parent_id = auth.uid())
$$;

-- Müəllim uşağı yalnız pending/accepted istək olduqda görür. Rədd və ya
-- ləğv olunanda bu funksiya false qaytarır və giriş özü bağlanır.
create or replace function public.teacher_can_view_child(p_child uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_requests
    where child_id = p_child and teacher_id = auth.uid() and status in ('pending', 'accepted')
  )
$$;

create or replace function public.can_view_child(p_child uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.owns_child(p_child) or public.teacher_can_view_child(p_child)
$$;

-- ---------------------------------------------------------------------
-- 7. RLS
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.parent_settings   enable row level security;
alter table public.teacher_profiles  enable row level security;
alter table public.children          enable row level security;
alter table public.child_conditions  enable row level security;
alter table public.medical_opinions  enable row level security;
alter table public.observations      enable row level security;
alter table public.skills            enable row level security;
alter table public.lessons           enable row level security;
alter table public.activity_sessions enable row level security;
alter table public.answer_events     enable row level security;
alter table public.session_summaries enable row level security;
alter table public.child_skill_stats enable row level security;
alter table public.ai_reports        enable row level security;
alter table public.teacher_requests  enable row level security;

-- profiles: özünü, bir də aktiv istəyin qarşı tərəfini görür
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from public.teacher_requests r
    where r.status in ('pending', 'accepted')
      and ((r.parent_id = auth.uid() and r.teacher_id = profiles.id)
        or (r.teacher_id = auth.uid() and r.parent_id = profiles.id))
  )
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- parent_settings: birbaşa giriş yoxdur (yalnız RPC)

-- teacher_profiles: marketplace hamıya açıqdır, redaktəni yalnız sahibi edir
create policy teacher_profiles_select on public.teacher_profiles for select to authenticated using (
  is_listed or id = auth.uid()
  or exists (select 1 from public.teacher_requests r where r.teacher_id = teacher_profiles.id and r.parent_id = auth.uid())
);
create policy teacher_profiles_update on public.teacher_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- children: yalnız valideyn yazır, müəllim yalnız oxuyur
create policy children_select on public.children for select to authenticated
  using (parent_id = auth.uid() or public.teacher_can_view_child(id));
create policy children_insert on public.children for insert to authenticated
  with check (parent_id = auth.uid() and public.my_role() = 'parent');
create policy children_update on public.children for update to authenticated
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy children_delete on public.children for delete to authenticated
  using (parent_id = auth.uid());

-- uşağa bağlı cədvəllər: eyni qayda
create policy child_conditions_select on public.child_conditions for select to authenticated using (public.can_view_child(child_id));
create policy child_conditions_insert on public.child_conditions for insert to authenticated with check (public.owns_child(child_id));
create policy child_conditions_update on public.child_conditions for update to authenticated using (public.owns_child(child_id)) with check (public.owns_child(child_id));
create policy child_conditions_delete on public.child_conditions for delete to authenticated using (public.owns_child(child_id));

create policy medical_opinions_select on public.medical_opinions for select to authenticated using (public.can_view_child(child_id));
create policy medical_opinions_insert on public.medical_opinions for insert to authenticated with check (public.owns_child(child_id));
create policy medical_opinions_update on public.medical_opinions for update to authenticated using (public.owns_child(child_id)) with check (public.owns_child(child_id));
create policy medical_opinions_delete on public.medical_opinions for delete to authenticated using (public.owns_child(child_id));

create policy observations_select on public.observations for select to authenticated using (public.can_view_child(child_id));
create policy observations_insert on public.observations for insert to authenticated with check (public.owns_child(child_id));
create policy observations_update on public.observations for update to authenticated using (public.owns_child(child_id)) with check (public.owns_child(child_id));
create policy observations_delete on public.observations for delete to authenticated using (public.owns_child(child_id));

-- kontent: hamı oxuyur
create policy skills_select on public.skills for select to authenticated using (true);
create policy lessons_select on public.lessons for select to authenticated using (is_published);

-- izləmə
create policy activity_sessions_select on public.activity_sessions for select to authenticated using (public.can_view_child(child_id));
create policy activity_sessions_insert on public.activity_sessions for insert to authenticated
  with check (public.owns_child(child_id) and status = 'in_progress' and not is_demo);

-- xam cavablar: müəllim görmür
create policy answer_events_select on public.answer_events for select to authenticated using (
  exists (select 1 from public.activity_sessions s where s.id = session_id and public.owns_child(s.child_id))
);
create policy answer_events_insert on public.answer_events for insert to authenticated with check (
  exists (select 1 from public.activity_sessions s
          where s.id = session_id and s.status = 'in_progress' and public.owns_child(s.child_id))
);

create policy session_summaries_select on public.session_summaries for select to authenticated using (public.can_view_child(child_id));
create policy child_skill_stats_select on public.child_skill_stats for select to authenticated using (public.can_view_child(child_id));
create policy ai_reports_select on public.ai_reports for select to authenticated using (public.can_view_child(child_id));

create policy teacher_requests_select on public.teacher_requests for select to authenticated
  using (parent_id = auth.uid() or teacher_id = auth.uid());

-- ---------------------------------------------------------------------
-- 8. Metriklərin hesablanması (daxili, client çağıra bilməz)
-- ---------------------------------------------------------------------
create or replace function public._recompute_skill_stats(p_child uuid, p_skill text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_now timestamptz := now();
  r     record;
begin
  select
    count(*) filter (where completed_at >= v_now - interval '7 days')                       as s7,
    avg(accuracy) filter (where completed_at >= v_now - interval '7 days')                  as a7,
    avg(accuracy) filter (where completed_at >= v_now - interval '14 days'
                            and completed_at <  v_now - interval '7 days')                  as ap7,
    avg(avg_response_ms) filter (where completed_at >= v_now - interval '7 days')           as rt7,
    sum(stuck_count) filter (where completed_at >= v_now - interval '7 days')               as st7,
    sum(step_count) filter (where completed_at >= v_now - interval '7 days')                as sc7,
    count(*)                                                                                as total,
    max(completed_at)                                                                       as last_at
  into r
  from public.session_summaries
  where child_id = p_child and skill_code = p_skill;

  insert into public.child_skill_stats as c (
    child_id, skill_code, sessions_7d, accuracy_7d, accuracy_prev_7d, avg_response_ms_7d,
    stuck_rate_7d, trend, total_sessions, last_activity_at, updated_at)
  values (
    p_child, p_skill, coalesce(r.s7, 0), round(r.a7, 4), round(r.ap7, 4), round(r.rt7)::int,
    case when coalesce(r.sc7, 0) > 0 then round(r.st7::numeric / r.sc7, 4) end,
    case
      when r.a7 is null or r.ap7 is null then 'flat'
      when r.a7 - r.ap7 >  0.10 then 'up'
      when r.a7 - r.ap7 < -0.10 then 'down'
      else 'flat'
    end,
    coalesce(r.total, 0), r.last_at, v_now)
  on conflict (child_id, skill_code) do update set
    sessions_7d        = excluded.sessions_7d,
    accuracy_7d        = excluded.accuracy_7d,
    accuracy_prev_7d   = excluded.accuracy_prev_7d,
    avg_response_ms_7d = excluded.avg_response_ms_7d,
    stuck_rate_7d      = excluded.stuck_rate_7d,
    trend              = excluded.trend,
    total_sessions     = excluded.total_sessions,
    last_activity_at   = excluded.last_activity_at,
    updated_at         = excluded.updated_at;
end $$;

create or replace function public._finalize_session(p_session_id uuid, p_completed_at timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare
  s          public.activity_sessions;
  v_skill    text;
  v_steps    int;
  v_answered int;
  v_first    int;
  v_solved   int;
  v_avg      int;
  v_stuck    int;
  v_hints    int;
begin
  select * into s from public.activity_sessions where id = p_session_id;
  select skill_code, step_count into v_skill, v_steps from public.lessons where slug = s.lesson_slug;

  select count(*),
         count(*) filter (where first_ok),
         count(*) filter (where solved),
         coalesce(round(avg(total_ms)), 0),
         count(*) filter (where total_ms > 20000 or attempts >= 3),
         count(*) filter (where hinted)
    into v_answered, v_first, v_solved, v_avg, v_stuck, v_hints
  from (
    select step_id,
           max(attempt_no)                                          as attempts,
           bool_or(is_correct)                                      as solved,
           bool_or(is_correct and attempt_no = 1 and not hint_used) as first_ok,
           sum(response_ms)                                         as total_ms,
           bool_or(hint_used)                                       as hinted
    from public.answer_events
    where session_id = p_session_id
    group by step_id
  ) per_step;

  -- Cavablanmamış addımlar da hesablanır (həll edilməmiş sayılır)
  v_steps := greatest(coalesce(v_steps, 0), v_answered, 1);

  insert into public.session_summaries (
    session_id, child_id, lesson_slug, skill_code, step_count, accuracy, solved_rate,
    avg_response_ms, stuck_count, hints_used, duration_s, completed_at)
  values (
    p_session_id, s.child_id, s.lesson_slug, v_skill, v_steps,
    round(v_first::numeric / v_steps, 4), round(v_solved::numeric / v_steps, 4),
    v_avg, v_stuck, v_hints,
    greatest(0, extract(epoch from (p_completed_at - s.started_at)))::int,
    p_completed_at)
  on conflict (session_id) do nothing;

  update public.activity_sessions
     set status = 'completed', ended_at = p_completed_at
   where id = p_session_id;

  perform public._recompute_skill_stats(s.child_id, v_skill);
end $$;

-- ---------------------------------------------------------------------
-- 9. RPC-lər (client çağırır)
-- ---------------------------------------------------------------------
create or replace function public.complete_session(p_session_id uuid) returns public.session_summaries
language plpgsql security definer set search_path = public as $$
declare
  s public.activity_sessions;
  r public.session_summaries;
begin
  select * into s from public.activity_sessions where id = p_session_id for update;
  if not found or not public.owns_child(s.child_id) then
    raise exception 'forbidden';
  end if;
  if s.status = 'in_progress' then
    perform public._finalize_session(p_session_id, now());
  end if;
  select * into r from public.session_summaries where session_id = p_session_id;
  return r;
end $$;

create or replace function public.refresh_child_stats(p_child uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_skill text;
begin
  if not public.owns_child(p_child) then
    raise exception 'forbidden';
  end if;
  for v_skill in select distinct skill_code from public.session_summaries where child_id = p_child loop
    perform public._recompute_skill_stats(p_child, v_skill);
  end loop;
end $$;

create or replace function public.set_child_pin(p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.my_role() is distinct from 'parent' then
    raise exception 'forbidden';
  end if;
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'pin_must_be_4_digits';
  end if;
  insert into public.parent_settings (parent_id, child_pin_hash)
  values (auth.uid(), crypt(p_pin, gen_salt('bf')))
  on conflict (parent_id) do update set child_pin_hash = excluded.child_pin_hash;
end $$;

create or replace function public.has_child_pin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.parent_settings where parent_id = auth.uid() and child_pin_hash is not null)
$$;

create or replace function public.verify_child_pin(p_pin text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select coalesce(
    (select child_pin_hash = crypt(p_pin, child_pin_hash)
       from public.parent_settings where parent_id = auth.uid()),
    false)
$$;

create or replace function public.send_request(p_child uuid, p_teacher uuid, p_message text, p_consent boolean)
returns public.teacher_requests
language plpgsql security definer set search_path = public as $$
declare
  r public.teacher_requests;
begin
  if not public.owns_child(p_child) then
    raise exception 'forbidden';
  end if;
  if coalesce(p_consent, false) = false then
    raise exception 'consent_required';
  end if;
  if not exists (select 1 from public.teacher_profiles where id = p_teacher and is_listed) then
    raise exception 'teacher_not_found';
  end if;
  if exists (select 1 from public.teacher_requests
             where child_id = p_child and teacher_id = p_teacher and status in ('pending', 'accepted')) then
    raise exception 'already_requested';
  end if;

  insert into public.teacher_requests (parent_id, child_id, teacher_id, message, consent_given, consent_at)
  values (auth.uid(), p_child, p_teacher, left(coalesce(p_message, ''), 1000), true, now())
  returning * into r;
  return r;
end $$;

create or replace function public.respond_to_request(p_request uuid, p_accept boolean)
returns public.teacher_requests
language plpgsql security definer set search_path = public as $$
declare
  r public.teacher_requests;
begin
  update public.teacher_requests
     set status = case when p_accept then 'accepted' else 'rejected' end,
         responded_at = now()
   where id = p_request and teacher_id = auth.uid() and status = 'pending'
  returning * into r;
  if not found then
    raise exception 'request_not_pending';
  end if;
  return r;
end $$;

-- Valideyn gözləyən istəyi ləğv edir və ya aktiv əməkdaşlığı bitirir.
-- Hər iki halda müəllimin girişi dərhal bağlanır.
create or replace function public.cancel_request(p_request uuid)
returns public.teacher_requests
language plpgsql security definer set search_path = public as $$
declare
  r public.teacher_requests;
begin
  update public.teacher_requests
     set status = case when status = 'pending' then 'cancelled' else 'ended' end,
         responded_at = coalesce(responded_at, now())
   where id = p_request and parent_id = auth.uid() and status in ('pending', 'accepted')
  returning * into r;
  if not found then
    raise exception 'request_not_active';
  end if;
  return r;
end $$;

-- ---------------------------------------------------------------------
-- 10. Demo tarixçə (süni data). is_demo = true ilə işarələnir.
-- ---------------------------------------------------------------------
create or replace function public.seed_demo_history(p_child uuid, p_days int default 14) returns int
language plpgsql security definer set search_path = public as $$
declare
  d          int;
  k          int;
  v_slug     text;
  v_skill    text;
  v_steps    int;
  v_session  uuid;
  v_start    timestamptz;
  v_progress numeric;
  p_first    numeric;
  v_slow     boolean;
  step_i     int;
  att        int;
  ok         boolean;
  v_count    int := 0;
  v_slugs    text[];
  v_notes    text[] := array[
    'Bu gün səhər çox sakit idi, dərsə həvəslə başladı.',
    'Axşam yeməyindən sonra əllərini özü yumağa getdi.',
    'Mağazada səs-küydən narahat oldu, qulaqlarını tutdu.',
    'Küçədə svetofora baxıb "qırmızı" dedi.',
    'Yuxuya gec getdi, səhər yorğun idi.',
    'Bacısı ilə oyuncağı paylaşdı.'];
begin
  if not public.owns_child(p_child) then
    raise exception 'forbidden';
  end if;
  perform setseed(0.42);
  p_days := least(greatest(p_days, 7), 28);

  for d in reverse (p_days - 1)..0 loop
    -- 0 (ən köhnə) → 1 (bu gün)
    v_progress := 1 - d::numeric / greatest(p_days - 1, 1);
    v_slugs := case d % 3
      when 0 then array['hand-washing', 'road-crossing']
      when 1 then array['emotions', 'daily-routine']
      else        array['hand-washing', 'odd-one-out', 'road-crossing']
    end;

    foreach v_slug in array v_slugs loop
      select skill_code, step_count into v_skill, v_steps from public.lessons where slug = v_slug;
      if not found then
        continue;
      end if;

      -- Ssenari: gigiyena yaxşılaşır, təhlükəsizlik geriləyir, emosiyalarda ilişmə var
      p_first := case v_skill
        when 'hygiene'   then 0.40 + 0.50 * v_progress
        when 'safety'    then 0.90 - 0.45 * v_progress
        when 'emotions'  then 0.50
        else                  0.75
      end;
      v_slow := v_skill = 'emotions';

      v_start := date_trunc('day', now()) - make_interval(days => d) + make_interval(hours => 10 + (random() * 8)::int);
      insert into public.activity_sessions (child_id, lesson_slug, started_at, status, is_demo)
      values (p_child, v_slug, v_start, 'in_progress', true)
      returning id into v_session;

      for step_i in 1..v_steps loop
        att := 1;
        loop
          ok := random() < case when att = 1 then p_first else 0.6 end;
          insert into public.answer_events (session_id, step_id, attempt_no, is_correct, response_ms, hint_used, created_at)
          values (v_session, 's' || step_i, att, ok,
                  case when v_slow then 9000 + (random() * 14000)::int else 3000 + (random() * 6000)::int end,
                  att = 3 and random() < 0.5,
                  v_start + make_interval(secs => step_i * 20 + att * 5));
          exit when ok or att >= 3;
          att := att + 1;
        end loop;
      end loop;

      perform public._finalize_session(v_session, v_start + make_interval(mins => 2 + v_steps));
      v_count := v_count + 1;
    end loop;

    insert into public.observations (child_id, observed_on, mood, sleep, meltdown, meltdown_note, free_text, is_demo)
    values (
      p_child, (now() - make_interval(days => d))::date,
      (array['good', 'good', 'neutral', 'bad'])[1 + floor(random() * 4)::int],
      (array['good', 'ok', 'ok', 'bad'])[1 + floor(random() * 4)::int],
      d in (1, 3, 5),
      case when d in (1, 3, 5) then 'Səs-küylü yerdə krizis yaşadı, 10 dəqiqəyə sakitləşdi.' end,
      case when d % 2 = 0 then v_notes[1 + floor(random() * array_length(v_notes, 1))::int] end,
      true)
    on conflict (child_id, observed_on) do nothing;
  end loop;

  perform public.refresh_child_stats(p_child);
  return v_count;
end $$;

create or replace function public.clear_demo_history(p_child uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.owns_child(p_child) then
    raise exception 'forbidden';
  end if;
  delete from public.activity_sessions where child_id = p_child and is_demo;
  delete from public.observations where child_id = p_child and is_demo;
  delete from public.child_skill_stats where child_id = p_child;
  perform public.refresh_child_stats(p_child);
end $$;

-- ---------------------------------------------------------------------
-- 11. İcazələr
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- profiles: rolu dəyişmək olmaz
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone, city, locale, parent_relation) on public.profiles to authenticated;

-- teacher_profiles: is_verified sahəsini müəllim özü dəyişə bilməz
revoke insert, update, delete on public.teacher_profiles from authenticated;
grant update (display_name, specializations, experience_years, city, district, formats, languages,
              price_min, price_max, age_min, age_max, bio, is_listed) on public.teacher_profiles to authenticated;

-- yalnız RPC və ya server yazır
revoke all on public.parent_settings from authenticated;
revoke insert, update, delete on public.teacher_requests  from authenticated;
revoke insert, update, delete on public.session_summaries from authenticated;
revoke insert, update, delete on public.child_skill_stats from authenticated;
revoke insert, update, delete on public.ai_reports        from authenticated;
revoke insert, update, delete on public.skills            from authenticated;
revoke insert, update, delete on public.lessons           from authenticated;
revoke update, delete on public.activity_sessions from authenticated;
revoke update, delete on public.answer_events     from authenticated;

-- daxili funksiyalar
revoke execute on function public._finalize_session(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public._recompute_skill_stats(uuid, text)   from public, anon, authenticated;

-- RPC-lər yalnız daxil olmuş istifadəçilər üçün
revoke execute on function public.complete_session(uuid)                       from public, anon;
revoke execute on function public.refresh_child_stats(uuid)                    from public, anon;
revoke execute on function public.set_child_pin(text)                          from public, anon;
revoke execute on function public.has_child_pin()                              from public, anon;
revoke execute on function public.verify_child_pin(text)                       from public, anon;
revoke execute on function public.send_request(uuid, uuid, text, boolean)      from public, anon;
revoke execute on function public.respond_to_request(uuid, boolean)            from public, anon;
revoke execute on function public.cancel_request(uuid)                         from public, anon;
revoke execute on function public.seed_demo_history(uuid, int)                 from public, anon;
revoke execute on function public.clear_demo_history(uuid)                     from public, anon;
grant execute on function public.complete_session(uuid), public.refresh_child_stats(uuid),
  public.set_child_pin(text), public.has_child_pin(), public.verify_child_pin(text),
  public.send_request(uuid, uuid, text, boolean), public.respond_to_request(uuid, boolean),
  public.cancel_request(uuid), public.seed_demo_history(uuid, int), public.clear_demo_history(uuid),
  public.owns_child(uuid), public.teacher_can_view_child(uuid), public.can_view_child(uuid), public.my_role()
  to authenticated;


-- Learnly — əsas kontent (bacarıqlar və dərslər).
-- 0001_schema.sql-dən sonra işə salın. Təkrar işə salmaq təhlükəsizdir.
-- step_count = src/content/lessons.ts-dəki qiymətləndirilən addımların sayı.

insert into public.skills (code, name, sort) values
  ('hygiene',   '{"az": "Gigiyena", "en": "Hygiene", "ru": "Гигиена"}', 1),
  ('safety',    '{"az": "Təhlükəsizlik", "en": "Safety", "ru": "Безопасность"}', 2),
  ('emotions',  '{"az": "Emosiyalar", "en": "Emotions", "ru": "Эмоции"}', 3),
  ('cognitive', '{"az": "Diqqət və məntiq", "en": "Attention & logic", "ru": "Внимание и логика"}', 4)
on conflict (code) do update set name = excluded.name, sort = excluded.sort;

insert into public.lessons (slug, skill_code, kind, level, age_min, age_max, title, step_count, sort) values
  ('hand-washing',  'hygiene',   'lesson', 1, 3, 10, '{"az": "Əllərimizi yuyuruq", "en": "Washing our hands", "ru": "Моем руки"}', 4, 1),
  ('road-crossing', 'safety',    'lesson', 1, 3, 10, '{"az": "Yolu təhlükəsiz keçirik", "en": "Crossing the road safely", "ru": "Безопасно переходим дорогу"}', 4, 2),
  ('emotions',      'emotions',  'lesson', 1, 3, 10, '{"az": "Hisslərimizi tanıyırıq", "en": "Recognising feelings", "ru": "Узнаём чувства"}', 5, 3),
  ('daily-routine', 'cognitive', 'game',   1, 3, 10, '{"az": "Günümü düzürəm", "en": "Order my day", "ru": "Мой распорядок дня"}', 3, 4),
  ('odd-one-out',   'cognitive', 'game',   1, 3, 10, '{"az": "Fərqli olanı tap", "en": "Find the odd one", "ru": "Найди лишнее"}', 4, 5)
on conflict (slug) do update set
  skill_code = excluded.skill_code, kind = excluded.kind, level = excluded.level,
  title = excluded.title, step_count = excluded.step_count, sort = excluded.sort;
