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
