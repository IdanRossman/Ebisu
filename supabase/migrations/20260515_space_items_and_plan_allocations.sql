alter table public.budget_items
  add column if not exists budget_space_id uuid;

update public.budget_items bi
set budget_space_id = bp.budget_space_id
from public.budget_plans bp
where bi.budget_plan_id = bp.id
  and bi.budget_space_id is null;

alter table public.budget_items
  alter column budget_space_id set not null;

alter table public.budget_items
  add constraint budget_items_id_budget_space_id_key
    unique (id, budget_space_id);

create table if not exists public.budget_plan_allocations (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  budget_plan_id uuid not null references public.budget_plans(id) on delete cascade,
  budget_item_id uuid not null references public.budget_items(id),
  planned_amount numeric(12, 2) not null default 0 check (planned_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_plan_id, budget_item_id),
  foreign key (budget_plan_id, budget_space_id)
    references public.budget_plans(id, budget_space_id),
  foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id)
);

insert into public.budget_plan_allocations (
  budget_space_id,
  budget_plan_id,
  budget_item_id,
  planned_amount,
  created_at,
  updated_at
)
select
  bi.budget_space_id,
  bi.budget_plan_id,
  bi.id,
  bi.planned_amount,
  bi.created_at,
  bi.updated_at
from public.budget_items bi
on conflict (budget_plan_id, budget_item_id) do nothing;

alter table public.expense_entries
  drop constraint if exists expense_entries_budget_item_plan_fkey;

alter table public.expense_schedules
  drop constraint if exists expense_schedules_budget_plan_id_budget_space_id_fkey,
  drop constraint if exists expense_schedules_budget_item_id_budget_plan_id_fkey;

alter table public.budget_watch_targets
  drop constraint if exists budget_watch_targets_budget_item_plan_fkey,
  drop constraint if exists budget_watch_targets_budget_plan_id_budget_space_id_fkey;

drop policy if exists "members can read budget items" on public.budget_items;

alter table public.budget_items
  drop constraint if exists budget_items_parent_id_budget_plan_id_fkey,
  drop constraint if exists budget_items_budget_plan_id_fkey,
  drop constraint if exists budget_items_id_budget_plan_id_key,
  drop column if exists budget_plan_id,
  drop column if exists planned_amount;

alter table public.budget_items
  add constraint budget_items_budget_space_id_fkey
    foreign key (budget_space_id)
    references public.budget_spaces(id)
    on delete cascade,
  add constraint budget_items_parent_space_fkey
    foreign key (parent_id, budget_space_id)
    references public.budget_items(id, budget_space_id);

alter table public.expense_entries
  add constraint expense_entries_budget_item_space_fkey
    foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id);

alter table public.expense_schedules
  drop column if exists budget_plan_id,
  add constraint expense_schedules_budget_item_space_fkey
    foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id);

alter table public.budget_watch_targets
  drop column if exists budget_plan_id,
  add constraint budget_watch_targets_budget_item_space_fkey
    foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id)
    on delete cascade;

drop index if exists public.unique_budget_item_watch_target;

create unique index if not exists unique_budget_item_watch_target
  on public.budget_watch_targets (budget_space_id, budget_item_id);

alter table public.budget_plan_allocations enable row level security;

create policy "members can read budget plan allocations"
  on public.budget_plan_allocations for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = budget_plan_allocations.budget_space_id
        and bsm.user_id = auth.uid()
    )
  );

create policy "members can read budget items"
  on public.budget_items for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = budget_items.budget_space_id
        and bsm.user_id = auth.uid()
    )
  );
