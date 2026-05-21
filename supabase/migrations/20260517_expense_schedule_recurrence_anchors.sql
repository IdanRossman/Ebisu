alter table public.expense_schedules
  add column if not exists recurrence_day_of_month integer check (recurrence_day_of_month between 1 and 31),
  add column if not exists recurrence_weekday integer check (recurrence_weekday between 0 and 6);
