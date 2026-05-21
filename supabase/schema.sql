create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  guidance_goals text[] not null default '{}',
  onboarding_first_path text check (onboarding_first_path in ('monthly_plan', 'recurring_expenses')),
  home_progress_scope text not null default 'living_money' check (home_progress_scope in ('living_money', 'whole_plan')),
  week_starts_on text not null default 'sunday' check (week_starts_on in ('sunday', 'monday')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  space_type text not null check (space_type in ('personal', 'shared')),
  currency_code text not null check (currency_code in ('ILS', 'USD', 'EUR', 'GBP')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_space_members (
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (budget_space_id, user_id)
);

create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  name text not null,
  period_type text not null check (period_type in ('monthly', 'weekly', 'biweekly', 'daily', 'one_time')),
  starts_on date not null,
  ends_on date not null,
  currency_code text not null check (currency_code in ('ILS', 'USD', 'EUR', 'GBP')),
  funding_amount numeric(12, 2) check (funding_amount is null or funding_amount >= 0),
  reserve_target_amount numeric(12, 2) check (reserve_target_amount is null or reserve_target_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (budget_space_id, period_type, starts_on, ends_on),
  unique (id, budget_space_id)
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  parent_id uuid references public.budget_items(id) on delete cascade,
  section_key text not null check (section_key in ('steady_obligations', 'household_vessels')),
  name text not null,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, budget_space_id),
  foreign key (parent_id, budget_space_id)
    references public.budget_items(id, budget_space_id)
);

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

create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  budget_plan_id uuid not null references public.budget_plans(id) on delete cascade,
  budget_item_id uuid not null references public.budget_items(id),
  source_schedule_id uuid,
  category_name_snapshot text,
  subcategory_name_snapshot text,
  amount numeric(12, 2) not null check (amount > 0),
  payee_name text not null default '',
  note text not null default '',
  spent_on date not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key (budget_plan_id, budget_space_id)
    references public.budget_plans(id, budget_space_id),
  foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id)
);

create table if not exists public.expense_schedules (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  budget_item_id uuid not null references public.budget_items(id),
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  schedule_type text not null check (schedule_type in ('one_time', 'recurring')),
  recurrence_frequency text check (recurrence_frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval integer not null default 1 check (recurrence_interval > 0),
  recurrence_day_of_month integer check (recurrence_day_of_month between 1 and 31),
  recurrence_weekday integer check (recurrence_weekday between 0 and 6),
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
  foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id)
);

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

alter table public.expense_entries
  add constraint expense_entries_source_schedule_id_fkey
  foreign key (source_schedule_id)
  references public.expense_schedules(id)
  on delete set null;

create table if not exists public.budget_watch_targets (
  id uuid primary key default gen_random_uuid(),
  budget_space_id uuid not null references public.budget_spaces(id) on delete cascade,
  budget_item_id uuid not null references public.budget_items(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key (budget_item_id, budget_space_id)
    references public.budget_items(id, budget_space_id)
);

create unique index if not exists unique_budget_item_watch_target
  on public.budget_watch_targets (budget_space_id, budget_item_id);

create index if not exists expense_entries_budget_plan_idx
  on public.expense_entries (budget_plan_id, spent_on desc, created_at desc);

alter table public.profiles enable row level security;
alter table public.budget_spaces enable row level security;
alter table public.budget_space_members enable row level security;
alter table public.budget_plans enable row level security;
alter table public.budget_items enable row level security;
alter table public.budget_plan_allocations enable row level security;
alter table public.expense_entries enable row level security;
alter table public.expense_schedules enable row level security;
alter table public.budget_watch_targets enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "members can read spaces"
  on public.budget_spaces for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = budget_spaces.id
        and bsm.user_id = auth.uid()
    )
  );

create policy "members can read memberships"
  on public.budget_space_members for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = budget_space_members.budget_space_id
        and bsm.user_id = auth.uid()
    )
  );

create policy "members can read budget plans"
  on public.budget_plans for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = budget_plans.budget_space_id
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

create policy "members can read expenses"
  on public.expense_entries for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = expense_entries.budget_space_id
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

create policy "members can read watch targets"
  on public.budget_watch_targets for select
  using (
    exists (
      select 1
      from public.budget_space_members bsm
      where bsm.budget_space_id = budget_watch_targets.budget_space_id
        and bsm.user_id = auth.uid()
    )
  );
