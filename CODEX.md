# NutriApp - AI Operational Guidelines

## Project Context
- **Name:** NutriApp
- **Tech Stack:** Expo SDK 54 (React Native for Web), TypeScript, Supabase (Auth, DB, Real-time), Expo Router.
- **Architecture:** Feature-First + Domain-Driven Design (DDD).
- **Core Goal:** Health and nutrition platform with gamification and real-time medical monitoring.

## 🛠 Engineering Standards
- **Surgical Updates:** Use targeted edits (`replace`) instead of full file rewrites whenever possible.
- **Type Safety:** No `any`. Strict TypeScript everywhere.
- **Component Pattern:** Prefer functional components with hooks. Move complex logic to custom hooks.
- **Centralization:** All application code, business rules, and components MUST live within the `src/` directory.
- **Directory Structure:**
  - `src/app/`: Expo Router pages.
  - `src/features/`: Feature modules (auth, calendar, etc.).
  - `src/shared/`: Global components, domain logic, hooks, and infrastructure.

## ⚖️ Audit & Compliance Rules (NON-NEGOTIABLE)

1. **Database Changes (Migrations Only):**
   - NO direct schema changes via Supabase Dashboard or ad-hoc scripts.
   - Every database change MUST be written as a timestamped migration file in `supabase/migrations/` (e.g., `20260504120000_initial_schema.sql`).
   - All migrations must include Row Level Security (RLS) policies.

2. **File-Level Technical Documentation:**
   - For every page, hook, or core component created/modified, update or create a technical documentation file in a `__docs__` directory alongside the file.
   - Include: Purpose, State/Props, Dependencies, and Edge Cases.

3. **Feature-Level Audit Documentation:**
   - Upon completing a feature, generate a comprehensive audit report in `docs/features/`.
   - Include: Architecture overview, Data flow diagram (markdown/mermaid), RLS policy verification, and Requirement mapping.

## 🔐 Security Mandates
- **Credential Protection:** NEVER log or commit secrets, API keys, or `.env` files.
- **RBAC:** Ensure strict Role-Based Access Control (Admin, Nutritionist, Patient).
- **Data Privacy:** Admin accounts must NOT have access to patient-sensitive clinical data (enforce via RLS).

## 🚀 Workflow Lifecycle
1. **Research:** Map codebase and validate assumptions.
2. **Strategy:** Formulate a grounded plan.
3. **Execution:** Apply targeted changes + tests + documentation.
4. **Validation:** Run tests, lints, and type checks to confirm behavioral and structural integrity.
