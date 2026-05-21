alter table public.profiles
  add column if not exists onboarding_first_path text
    check (onboarding_first_path in ('monthly_plan', 'recurring_expenses'));
