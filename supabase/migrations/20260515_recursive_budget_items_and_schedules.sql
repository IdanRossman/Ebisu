create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_plan_id uuid not null references public.budget_plans(id) on delete cascade,
  parent_id uuid references public.budget_items(id) on delete cascade,
  name text not null,
  planned_amount numeric(12, 2) not null default 0 check (planned_amount >= 0),
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, budget_plan_id),
  foreign key (parent_id, budget_plan_id)
    references public.budget_items(id, budget_plan_id)
);

insert into public.budget_items (
  id,
  budget_plan_id,
  parent_id,
  name,
  planned_amount,
  sort_order,
  archived_at,
  created_at,
  updated_at
)
select
  id,
  budget_plan_id,
  null,
  name,
  planned_amount,
  sort_order,
  archived_at,
  created_at,
  updated_at
from public.budget_categories
on conflict (id) do nothing;

insert into public.budget_items (
  id,
  budget_plan_id,
  parent_id,
  name,
  planned_amount,
  sort_order,
  archived_at,
  created_at,
  updated_at
)
select
  bs.id,
  bc.budget_plan_id,
  bs.category_id,
  bs.name,
  bs.planned_amount,
  bs.sort_order,
  bs.archived_at,
  bs.created_at,
  bs.updated_at
from public.budget_subcategories bs
join public.budget_categories bc on bc.id = bs.category_id
on conflict (id) do nothing;

alter table public.expense_entries
  add column if not exists budget_item_id uuid,
  add column if not exists source_schedule_id uuid;

update public.expense_entries
set budget_item_id = coalesce(subcategory_id, category_id)
where budget_item_id is null;

alter table public.expense_entries
  alter column budget_item_id set not null;

alter table public.expense_entries
  add constraint expense_entries_budget_item_plan_fkey
  foreign key (budget_item_id, budget_plan_id)
  references public.budget_items(id, budget_plan_id);

alter table public.budget_watch_targets
  add column if not exists budget_item_id uuid;

update public.budget_watch_targets
set budget_item_id = coalesce(subcategory_id, category_id)
where budget_item_id is null;

alter table public.budget_watch_targets
  alter column budget_item_id set not null;

alter table public.budget_watch_targets
  add constraint budget_watch_targets_budget_item_plan_fkey
  foreign key (budget_item_id, budget_plan_id)
  references public.budget_items(id, budget_plan_id)
  on delete cascade;

drop index if exists public.unique_category_watch_target;
drop index if exists public.unique_subcategory_watch_target;

create unique index if not exists unique_budget_item_watch_target
  on public.budget_watch_targets (budget_plan_id, budget_item_id);

create table if not exists public.expense_schedules (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  budget_plan_id uuid not null references public.budget_plans(id) on delete cascade,
  budget_item_id uuid not null references public.budget_items(id),
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  schedule_type text not null check (schedule_type in ('one_time', 'recurring')),
  recurrence_frequency text check (recurrence_frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval integer not null default 1 check (recurrence_interval > 0),
  starts_on date not null,
  ends_on date,
  next_due_on date not null,
  note text not null default '',
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  check (
    (schedule_type = 'one_time' and recurrence_frequency is null)
    or
    (schedule_type = 'recurring' and recurrence_frequency is not null)
  ),
  foreign key (budget_plan_id, budget_space_id)
    references public.budget_plans(id, budget_space_id),
  foreign key (budget_item_id, budget_plan_id)
    references public.budget_items(id, budget_plan_id)
);

alter table public.expense_entries
  add constraint expense_entries_source_schedule_id_fkey
  foreign key (source_schedule_id)
  references public.expense_schedules(id)
  on delete set null;

drop policy if exists "members can read categories" on public.budget_categories;
drop policy if exists "members can read subcategories" on public.budget_subcategories;

alter table public.budget_items enable row level security;
alter table public.expense_schedules enable row level security;

create policy "members can read budget items"
  on public.budget_items for select
  using (
    exists (
      select 1
      from public.budget_plans bp
      join public.budget_space_members bsm on bsm.budget_space_id = bp.budget_space_id
      where bp.id = budget_items.budget_plan_id
        and bsm.user_id = auth.uid()
    )
  );

create policy "members can read expense schedules"
  on public.expense_schedules for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = expense_schedules.budget_space_id
        and bsm.user_id = auth.uid()
    )
  );

alter table public.expense_entries
  drop column if exists subcategory_id,
  drop column if exists category_id;

alter table public.budget_watch_targets
  drop column if exists subcategory_id,
  drop column if exists category_id;

drop table if exists public.budget_subcategories;
drop table if exists public.budget_categories;
