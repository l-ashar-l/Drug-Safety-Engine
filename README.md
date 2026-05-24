# Drug Safety Engine

A full-stack clinical safety demo: deterministic drug interaction, allergy, renal dosing checks, plus Claude/OpenAI comparison.

## Setup

1. Copy environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `LLM_API_KEY`
   - `LLM_PROVIDER=anthropic` or `openai`

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Load Supabase schema and seed data in `supabase/schema.sql` and `supabase/seed.sql`.

## Project structure

- `src/app/page.tsx` — demo UI
- `src/app/api/safety-check/route.ts` — deterministic safety engine API
- `src/app/api/claude/route.ts` — LLM wrapper for generic/enhanced comparisons
- `src/lib/safety-engine.ts` — drug, allergy, and renal validation logic
- `src/lib/calculators.ts` — eGFR and CHA₂DS₂-VASc formulas
- `src/lib/supabase.ts` — Supabase client helper
- `supabase/schema.sql` — database schema
- `supabase/seed.sql` — seed data for 50 drugs, 30 interactions, and allergy cross-reactivity
- `docs/architecture.md` — architecture notes
