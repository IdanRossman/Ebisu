# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run typecheck  # TypeScript type check (no build emit)
```

EAS builds use `eas build --profile <development|preview|production>`. Requires EAS CLI >= 13.0.0.

## Environment Variables

Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000/api`)

## Architecture

### Feature-based with Clean Layers

Each feature under `src/features/<feature>/` follows a strict 4-layer structure:

| Layer | Folder | Purpose |
|-------|--------|---------|
| Domain | `domain/` | Pure functions and type definitions — no I/O |
| Application | `application/` | Hooks and API call orchestration |
| Infrastructure | `infrastructure/` | AsyncStorage persistence |
| Presentation | `presentation/` | React components specific to this feature |

The `budget` feature is the most complete example. `domain/budget.ts` contains 40+ pure transformation functions; `application/budgetApi.ts` handles remote↔local mapping (snake_case → camelCase); `infrastructure/budgetRepository.ts` handles AsyncStorage persistence.

### Routing (Expo Router)

File-based routing under `src/app/`:
- `_layout.tsx` — root layout, loads fonts, initializes `AuthProvider` and `QueryClient`
- `index.tsx` — auth router: redirects to `(auth)/sign-in` or `(app)/home` based on session + onboarding state
- `(auth)/` — unauthenticated routes
- `(app)/` — protected routes; `_layout.tsx` here enforces auth guard

### State Management

- **Auth state**: React Context via `AuthProvider` + Supabase session; consumed with `useAuth()`
- **Server state**: TanStack React Query (staleTime: 5 min, retry: 2). Query keys use factory functions (e.g. `authKeys.profile(userId)`)
- **Local persistence**: AsyncStorage for budget plan, onboarding flags, currency preference, watch targets

### API Layer

`src/lib/api.ts` exports `apiRequest<T>(path, init?)` — attaches the Supabase Bearer token automatically. All feature API modules (e.g. `budgetApi.ts`) call this function and handle data mapping.

### Theming

All design tokens live in `src/constants/theme.ts`:
- `Colors` — palette (primary green + neutrals)
- `Typography` — presets: `hero`, `screenTitle`, `sectionTitle`, `body`, `caption`, etc.
- `Space` — scale from `xxs` to `4xl`
- `Radius`, `Shadows`, `Sizes` (touch target: 44, button height: 56)

Shared UI primitives are in `src/components/ui/` and exported from `index.ts`.

### Auth Providers

Supabase Auth supports: Apple Sign-In, Google (IdToken), Discord OAuth, Anonymous, and a Mock provider for development. OAuth flows use Expo Auth Session.

## Key Conventions

- Remote API uses snake_case; domain models use camelCase — conversion happens in `application/` layer
- Money amounts are rounded to 2 decimals: `Math.round(amount * 100) / 100`
- "Active" items are those not marked skipped or archived
- Budget sections: `steadyObligations` (fixed costs) and `householdVessels` (variable categories with optional subcategories)
