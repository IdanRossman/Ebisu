alter table public.profiles
  add column if not exists home_progress_scope text not null default 'living_money'
    check (home_progress_scope in ('living_money', 'whole_plan')),
  add column if not exists week_starts_on text not null default 'sunday'
    check (week_starts_on in ('sunday', 'monday'));
