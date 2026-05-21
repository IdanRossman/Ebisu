alter table public.expense_entries
  add column if not exists category_name_snapshot text,
  add column if not exists subcategory_name_snapshot text;
