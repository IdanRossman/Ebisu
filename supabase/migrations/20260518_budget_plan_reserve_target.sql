alter table public.budget_plans
  add column if not exists reserve_target_amount numeric(12, 2)
    check (reserve_target_amount is null or reserve_target_amount >= 0);
