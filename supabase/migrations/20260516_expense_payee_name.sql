alter table public.expense_entries
  add column if not exists payee_name text not null default '';
