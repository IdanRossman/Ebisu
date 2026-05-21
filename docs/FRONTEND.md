# Ebisu Frontend Current State

This document is the working reference for Ebisu's frontend direction: how the app should feel, what interaction patterns are already established, and where the current UI stands.

## Product Feeling

Ebisu should make budgeting feel less frightening without making it shallow.

The app is for ordinary people who want more flexibility than basic budget apps, but less ceremony, cost, and intimidation than heavy "premium" finance tools. The frontend should therefore feel:

- calm
- warm
- guided
- domestic rather than corporate
- capable without looking complex

Ebisu is not a spreadsheet with decoration. He is the emotional frame that helps users approach a difficult subject with less tension.

## Core Interaction Pattern

The strongest frontend pattern now established is:

```text
guidance first
  -> brief pause
  -> fade away
  -> practical UI appears
```

This is especially visible in the budget shaping flow.

Each meaningful step begins with a short Ebisu guidance moment:

1. Ebisu scene fades in.
2. A single calm sentence or two appears.
3. The user is given a moment to receive the idea.
4. The guidance fades out.
5. The actionable form fades in with the relevant controls.

This pattern matters because it separates emotional reassurance from cognitive work. The app first lowers tension, then asks for input.

The implementation currently lives mainly in:

- `BudgetFlowStepFrame`
- `useBudgetSetupFlow`
- shared `dropIn` / `fadeOut` motion helpers

Reduced-motion behavior is already respected: guidance and forms appear immediately when the user prefers reduced motion.

## Motion and Pacing

Current motion language:

- vertical entrance from slightly above
- soft opacity transitions
- staggered reveal of related controls
- no bounce, no theatrics, no "gamified" motion

Typical cadence:

- hero image appears first
- message follows
- controls arrive later in a gentle sequence

The home screen already follows a related entrance rhythm:

1. Ebisu illustration
2. greeting
3. data glimpse
4. actions

The important rule is that motion should create composure and hierarchy, not spectacle.

## Established Visual Language

The current frontend already has a recognizable system:

- warm surface background
- white translucent cards
- restrained green accents
- rounded controls
- soft borders
- clear typographic distinction between Ebisu's voice and practical UI

Typography:

- display / ritual voice for Ebisu copy
- body font for financial controls and supporting text

Controls:

- compact, calm, touch-friendly
- large enough to feel easy, not oversized
- detail added progressively rather than dumped all at once

## Frontend Product Principles

1. **Depth should unfold gradually.**  
   The app may be capable, but the interface should reveal complexity only when useful.

2. **Guidance should soften, not obscure.**  
   Ebisu's language can make finance gentler, but it must never make meaning vague.

3. **Every screen should have a clear emotional job.**  
   Example: setup reassures and shapes; review affirms and clarifies; home should orient and advise.

4. **Practical clarity wins over ornament.**  
   The app may feel ceremonial, but the user should always know what a number means and what to do next.

5. **Calm does not mean empty.**  
   We should avoid both dashboard clutter and oversimplified blankness.

## Current UI Progress

### Completed / Strongly Established

#### Sign-in and onboarding

- Sign-in screen uses Ebisu illustration and calm introduction.
- Onboarding captures user name and household currency.
- Onboarding is now intentionally lightweight: it creates the person and household only.
- Budget structure is no longer seeded during onboarding.

#### Budget shaping flow

The most mature frontend area.

Current steps:

1. plan foundation
2. available funds
3. steady obligations
4. household vessels
5. review

Current capabilities:

- plan name and planning rhythm
- optional funding amount
- detailed steady-obligation templates
- household vessels with editable entries
- optional savings recommendation from Ebisu
- live remaining / over-budget indication
- editable funding amount from later steps
- final review with clear line-by-line summary

Important UX decisions already made:

- steady obligations and household vessels are distinct concepts
- subcategories should be shown on separate lines, not inline
- savings is a suggestion, never a requirement
- review should feel affirming, not transactional

#### Backend-backed budget usage

The mobile app now reads actual remote budget data for:

- current plan
- items
- allocations
- expenses
- watch targets

Configuration actions are also remote-backed:

- rename item
- edit allocation
- archive item
- record expense
- save watched vessels

AsyncStorage now behaves as a cache / fallback rather than the primary budget source of truth.

### Present but Still Underdeveloped

#### Home

The home screen has the beginning of the correct feel:

- Ebisu image
- greeting
- animated entrance sequence
- quick action stack

But it is still visually and informationally closer to the older prototype than to the richer model we now have.

Current limitations:

- one placeholder stat card still exists
- the screen does not yet summarize the actual plan meaningfully
- it does not yet communicate funding, spent, remaining, or plan health in a complete way
- it does not yet fully act like Ebisu's daily counsel

The next major frontend task is to rebuild Home around the real budget data now available.

#### Budget configuration

Functional and backend-backed, but still more utility-oriented than emotionally integrated with the rest of the product.

It likely needs a later pass for:

- clearer separation of steady obligations vs household vessels
- more consistent terminology
- gentler empty / edge states
- potentially a more refined editing experience

#### Ledger

Present and connected to the current model, but not yet deeply reviewed in the same product-design depth as the setup flow.

## Current Data Model the UI Relies On

Frontend budget thinking now centers on:

- `BudgetPlan`
- `steadyObligations`
- `householdVessels`
- nested subcategories
- `fundingAmount`
- expenses
- watched targets

This is important because future UI should not regress toward generic "categories" where product meaning is already known.

## Near-Term Frontend Priorities

### 1. Rebuild Home around live data

Recommended structure:

1. **Ebisu guidance / greeting**
2. **Month at a glance**
   - available
   - spent
   - remaining
3. **What needs attention**
   - watched vessel
   - lowest remaining vessel or similar
4. **Next actions**
   - record expense
   - review ledger
   - adjust plan

The home screen should feel like:

> "Here is where your household stands today, and here is the next useful thing to do."

### 2. Bring secondary screens up to the shaping-flow standard

Likely candidates:

- ledger
- settings
- configuration
- empty states

These do not all need to repeat the full guidance ritual, but they should inherit the same calm hierarchy and language.

### 3. Continue replacing prototype remnants

Examples:

- old household item utilities that no longer represent the main product model
- any copy that still refers to older generic categories
- remaining placeholders on Home

## Reusable Frontend Decisions

When adding new screens, default to these choices:

- use Ebisu when a moment benefits from reassurance, orientation, or transition
- do not put Ebisu copy everywhere; practical screens may stay quieter
- prefer one excellent sentence over several mediocre helper lines
- reveal controls in meaningful groups
- use explicit financial wording when ambiguity would increase anxiety
- keep important financial state visible, especially "remaining" and "over"
- preserve the difference between obligations and flexible vessels

## Open Questions

- How much of the guidance ritual should repeat on returning visits versus first-time setup only?
- Should Home surface one primary recommendation from Ebisu, or multiple small signals?
- How should the app communicate healthy progress without drifting into gamification?
- When the user has no funding amount, what is the most useful Home summary?

## Short Version

Ebisu's frontend is now best understood as:

> A calm guided budgeting experience where emotional reassurance arrives first, practical work follows, and every layer of UI tries to make real financial depth feel approachable.

The budget shaping flow is the current gold standard.  
The home screen is the next major piece that needs to rise to that same level.
