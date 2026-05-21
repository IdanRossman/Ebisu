# Ebisu Backend V1

## Shape

```text
mobile app
  -> NestJS API
      -> Supabase Auth
      -> Supabase Postgres
```

The mobile app should call product verbs exposed by the API. Supabase remains the identity and persistence layer, but the API owns Ebisu's business rules.

## Domain Modules

- `auth`: verify Supabase JWTs and expose the current user.
- `profiles`: display name and user-level onboarding state.
- `spaces`: personal/shared budget spaces, membership, shared settings.
- `budgets`: budget plans, recursive budget items, plan allocations, watched targets.
- `expenses`: ledger entries, scheduled obligations, and expense recording.

## First API Surface

```text
GET    /api/health
GET    /api/me
DELETE /api/me
POST   /api/spaces
GET    /api/spaces
GET    /api/spaces/:spaceId
GET    /api/budgets/current
POST   /api/budgets
POST   /api/budgets/shaped-plan
GET    /api/budgets/items
POST   /api/budgets/items
PATCH  /api/budgets/items/:itemId
GET    /api/budgets/:planId/allocations
PUT    /api/budgets/allocations
PUT    /api/budgets/watch-targets
GET    /api/expenses
POST   /api/expenses
GET    /api/expenses/schedules
POST   /api/expenses/schedules
```

## Data Decisions

- One user can belong to multiple budget spaces: personal or shared. A household is product language for a shared space, not a separate structural type.
- Space currency lives on the budget space, because each space needs one canonical accounting currency.
- Budget plans keep their own currency snapshot so old periods remain understandable if the space currency changes later.
- The schema supports `monthly`, `weekly`, `biweekly`, `daily`, and `one_time` plans.
- Budget plans keep the user-facing plan name plus an optional funding amount snapshot from shaping.
- Budget items are space-level categories, recursive, and may currently be nested up to three levels deep in application logic.
- Onboarding creates the person and household only; the first budget item tree is created by the dedicated budget shaping flow.
- Every budget item belongs to one product section: `steady_obligations` or `household_vessels`.
- Budget plan allocations hold period-specific planned amounts for those reusable items.
- Budget items are archived rather than destroyed.
- Expense rows are immutable records; editing totals should be derived from entries or updated through controlled application logic.
- Watched targets point to any budget item and belong to a space so the user's Home choices survive month rollover.
- `POST /api/budgets/shaped-plan` is the product-level write used when the mobile shaping flow is completed: it creates the plan, item tree, and plan allocations together from the finished draft.
- Scheduled expenses are separate from actual expense entries so recurring obligations and one-time upcoming payments can be modeled without confusing expectation with reality.

## Sync Direction

The current mobile app uses AsyncStorage as a local prototype store. Backend adoption should happen in stages:

1. Keep local flows as-is while the API and schema stabilize.
2. Add API-backed auth/profile/space bootstrap.
3. Replace local monthly-budget reads and writes with API calls against a monthly `budget_plan`.
4. Keep a small local cache for responsiveness, but make the API/Postgres state authoritative.

## Later, Not V1

- invitations
- income streams
- bank sync
- notifications
- audit/event log
- month rollover rules
