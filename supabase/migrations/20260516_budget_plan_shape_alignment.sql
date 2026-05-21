alter table public.budget_plans
  add column if not exists name text,
  add column if not exists funding_amount numeric(12, 2);

update public.budget_plans
set name = 'Budget Plan'
where name is null;

alter table public.budget_plans
  alter column name set not null;

alter table public.budget_plans
  drop constraint if exists budget_plans_period_type_check,
  add constraint budget_plans_period_type_check
    check (period_type in ('monthly', 'weekly', 'biweekly', 'daily', 'one_time')),
  drop constraint if exists budget_plans_funding_amount_check,
  add constraint budget_plans_funding_amount_check
    check (funding_amount is null or funding_amount >= 0);

alter table public.budget_items
  add column if not exists section_key text;

update public.budget_items
set section_key = 'household_vessels'
where section_key is null;

alter table public.budget_items
  alter column section_key set not null,
  drop constraint if exists budget_items_section_key_check,
  add constraint budget_items_section_key_check
    check (section_key in ('steady_obligations', 'household_vessels'));
