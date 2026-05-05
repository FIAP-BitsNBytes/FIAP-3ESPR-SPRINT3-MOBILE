# Batch Import Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update import aliases in the codebase to reflect the new directory structure for components and constants.

**Architecture:** Systematic string replacement in identified files to migrate `@/components/` and `@/constants/` to their new locations under `@/shared/`.

**Tech Stack:** TypeScript, React Native (Expo)

---

### Task 1: Update Imports in `src/app`

**Files:**
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `src/app/(tabs)/index.tsx`
- Modify: `src/app/(tabs)/two.tsx`
- Modify: `src/app/+not-found.tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/modal.tsx`

- [ ] **Step 1: Update `src/app/(tabs)/_layout.tsx`**
  - Replace `@/constants/` with `@/shared/constants/`
  - Replace `@/components/` with `@/shared/components/`

- [ ] **Step 2: Update `src/app/(tabs)/index.tsx`**
  - Replace `@/components/` with `@/shared/components/`

- [ ] **Step 3: Update `src/app/(tabs)/two.tsx`**
  - Replace `@/components/` with `@/shared/components/`

- [ ] **Step 4: Update `src/app/+not-found.tsx`**
  - Replace `@/components/` with `@/shared/components/`

- [ ] **Step 5: Update `src/app/_layout.tsx`**
  - Replace `@/components/` with `@/shared/components/`

- [ ] **Step 6: Update `src/app/modal.tsx`**
  - Replace `@/components/` with `@/shared/components/`

- [ ] **Step 7: Verify changes in `src/app`**
  Run: `grep -r "@/components/" src/app` and `grep -r "@/constants/" src/app`
  Expected: No matches.

### Task 2: Update Imports in `src/shared/components`

**Files:**
- Modify: `src/shared/components/EditScreenInfo.tsx`
- Modify: `src/shared/components/Themed.tsx`

- [ ] **Step 1: Update `src/shared/components/EditScreenInfo.tsx`**
  - Replace `@/constants/` with `@/shared/constants/`

- [ ] **Step 2: Update `src/shared/components/Themed.tsx`**
  - Replace `@/constants/` with `@/shared/constants/`

- [ ] **Step 3: Verify changes in `src/shared/components`**
  Run: `grep -r "@/constants/" src/shared/components`
  Expected: No matches.

### Task 3: Final Verification

- [ ] **Step 1: Global search for old patterns**
  Run: `grep -r "@/components/" src` and `grep -r "@/constants/" src`
  Expected: No matches.
