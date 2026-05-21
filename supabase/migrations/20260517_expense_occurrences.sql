create table if not exists public.expense_occurrences (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  budget_item_id uuid not null references public.budget_items(id),
  source_schedule_id uuid not null references public.expense_schedules(id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  due_on date not null,
  note text not null default '',
  status text not null default 'planned' check (status in ('planned', 'paid', 'skipped')),
  paid_expense_entry_id uuid references public.expense_entries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_schedule_id, due_on),
  foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id)
);

alter table public.expense_occurrences enable row level security;

create policy "members can read expense occurrences"
  on public.expense_occurrences for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = expense_occurrences.budget_space_id
        and bsm.user_id = auth.uid()
    )
  );
