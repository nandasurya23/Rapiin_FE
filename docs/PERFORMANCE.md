# Performance Optimization Guidelines

This document outlines the performance strategies, optimization techniques, and rendering rules enforced in the Rapiin Frontend.

---

## 1. State Memoization and Re-render Control

Because Rapiin consolidates global state into a single Context Provider ([AppDataProvider](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/providers/app-data-provider.tsx)), improper updates could trigger full app re-renders:

* **Actions Memoization:** All state mutation functions (e.g., `createCustomer`, `updateOrder`) are wrapped in `useCallback` to maintain referential equality.
* **Derived Calculations:** Computed metrics (e.g., `currentUser`, `subscriptionForCurrentBusiness`, `currentBusinessUsage`) use `useMemo` with strict dependency arrays to avoid calculations on unrelated updates.

---

## 2. Dynamic Code Splitting & Heavy Libraries

For operations that rely on heavy client-side packages:

1. **`html-to-image`:** Used for invoice PDF/visual generation. This library is imported dynamically or only executed in response to user events (like clicking "Unduh Invoice").
2. **Icons (`lucide-react`):** Import individual icons directly to enable treeshaking, rather than using full module imports.

---

## 3. Core Web Vitals & Asset Optimizations

* **Font Loading:** Google Fonts (`Outfit`) are loaded using CSS `@import` in `globals.css` with `display=swap` to allow immediate system-font rendering during network download, preventing Layout Shifts (CLS).
* **Layout Skeletons:** Dynamic pages utilize `loading.tsx` loaders to serve skeleton layouts while data hydration completes, improving perceived load speed.
