# Ebisu Vision

Ebisu is an iOS household budgeting app for partners managing money together. It should not feel like a spreadsheet, bank app, or generic finance dashboard. The emotional goal is guidance: the user is being met by a calm guardian of household prosperity.

## Product Feeling

- Ebisu speaks like a wise, warm presence.
- The app should feel ceremonial but not theatrical.
- Finance actions should feel domestic, steady, and clear.
- The UI should stay quiet: soft surfaces, restrained controls, no cheap icons or noisy gamification.
- The word **Ebisu** is treated as a marked word: jade green, display font, visually distinct.

## Current Flow

1. Sign-in opens with Ebisu line art.
2. Ebisu greets the user.
3. Ebisu introduces himself as the god of fortune and business.
4. The user chooses an identity provider: Apple, Google, or Discord.
5. Auth is mocked for now.
6. Onboarding asks what Ebisu should call the user.
7. After the name is kept, Ebisu confirms the meeting.
8. Ebisu asks how he can guide the user.
9. The user chooses guidance goals:
   - Shape a monthly budget
   - Watch daily spending
   - Track shared household costs
   - Save toward a goal

## Visual Direction

- Aoboshi One is the display voice for Ebisu and ritual prompts.
- Inter remains the practical body font for finance UI and form controls.
- Ebisu illustrations are treated as transparent line-art assets.
- The fishing scene keeps the pond as a soft blue wash to ground the onboarding page.
- Controls should be compact and calm, closer to identity tokens than large CTAs.

## Near-Term Plans

- Keep auth mocked while we finish onboarding and app structure.
- Move real Supabase profile updates to the end of onboarding.
- Persist onboarding data as a single completed profile payload.
- Design the first real app shell after onboarding instead of using placeholder home screens.
- Define household setup: solo household, partner invite, or shared household creation.
- Decide how guidance goals shape the first dashboard experience.

## Open Questions

- What is the first real home screen after onboarding?
- Should onboarding ask about household members immediately, or later?
- Should budgets start with categories, income, or monthly target?
- How should Ebisu speak when giving financial insights without feeling gimmicky?
