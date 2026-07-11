# Performance Audit

This document analyzes the frontend performance, bundle metrics, and rendering efficiency of the Rapiin Frontend.

---

## 1. Bundle Analysis

Our bundle analysis identified opportunities to optimize initial page load times:

* **Static Import Bloat:**
  * *Finding:* Heavy client-side packages (e.g., `html-to-image`) are imported statically.
  * *Impact:* These libraries are included in the main Javascript bundle, increasing page load times for pages that don't use them (like the login page).
  * *Recommendation:* Use dynamic imports (`next/dynamic`) to load `html-to-image` only when the user clicks the export button:
    ```typescript
    const htmlToImage = await import("html-to-image");
    ```

---

## 2. Rendering Optimization

* **Context Re-renders:**
  * *Finding:* The global `AppDataProvider` updates state for all domains.
  * *Impact:* A state change in one domain (e.g. creating a customer) can trigger re-renders in components that only consume other domains (e.g. the calendar page), slowing down UI responsiveness.
  * *Recommendation:* Implement React selectors, divide the context, or migrate to a server-state library (like TanStack Query) to isolate updates.

---

## 3. Web Vitals Evaluation

| Metric | Score | Strategy to Improve |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | Good | Use dynamic imports to keep initial bundle sizes under 150kb. |
| **FID (First Input Delay)** | Excellent | Keep long-running JavaScript execution off the main thread. |
| **CLS (Cumulative Layout Shift)** | Good | Use Next.js loading skeletons (`loading.tsx`) to prevent layout shifts. |
