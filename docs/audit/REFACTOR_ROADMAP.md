# Refactoring & Engineering Roadmap

This roadmap outlines our recommendations for improving codebase maintainability, scalability, and performance.

---

## Phase 1: Short-Term Actions (1-2 Months)

### 1. Optimize Heavy Imports
* **Goal:** Improve initial page load times by reducing bundle sizes.
* **Action:** Convert the static import of `html-to-image` inside the invoice features to a dynamic import, loading it only when the user clicks the export button.

### 2. Implement Automated Testing
* **Goal:** Reduce regression risks during development.
* **Action:** Install Jest and React Testing Library, and write unit tests for critical business logic (such as scheduling calculations in `src/lib/booking.ts`).

### 3. Add Pre-Commit Hooks
* **Goal:** Automate code quality checks.
* **Action:** Set up `husky` and `lint-staged` to run ESLint and TypeScript compilation checks automatically before code is committed.

---

## Phase 2: Medium-Term Actions (3-6 Months)

### 1. Refactor Monolithic Context
* **Goal:** Improve code maintainability and component rendering efficiency.
* **Action:** Split `app-data-provider.tsx` into smaller, domain-specific contexts:
  * `AuthProvider` (session recovery, login, logout)
  * `CRMProvider` (customers, orders, invoices)
  * `AdminProvider` (business listings, upgrade approvals)

### 2. Secure Local Caches
* **Goal:** Protect client configuration settings.
* **Action:** Obfuscate or encrypt cached configurations before saving them to local storage.

---

## Phase 3: Long-Term Actions (6+ Months)

### 1. Adopt Server-State Management
* **Goal:** Support scaling to larger datasets.
* **Action:** Replace full client-side state arrays with an API-driven cache manager (such as TanStack Query). This reduces client memory usage by loading data page-by-page from the backend instead of storing everything in memory.
