# Architecture Decision Log

This log documents the major technical decisions, context, and architectural trade-offs made in the Rapiin Frontend project.

---

## ADR 1: Next.js App Router Selection

* **Context:** The application requires responsive storefronts, secure dashboards, and public sharing links (e.g. invoices).
* **Decision:** Adopt the Next.js App Router framework.
* **Reason:** Provides native layout nesting (reducing rendering shifts), file-system routing, and built-in optimization tools (routing, loaders, skeletons).
* **Trade-offs:** Strict boundary between client and server components can introduce complexity, which we handle by keeping pages slim and features client-rendered.

---

## ADR 2: Global State via Unified Context (`AppDataProvider`)

* **Context:** Tenant configuration, customer directories, bookings, and messaging templates must be shared across dashboard panels.
* **Decision:** Utilize a single global React Context (`AppDataProvider`) rather than adding heavy external state libraries (e.g., Redux Toolkit or Zustand).
* **Reason:** Reduces third-party dependency load, utilizes React's built-in APIs, and simplifies synchronization of offline configs with `localStorage`.
* **Trade-offs:** Any change in global state triggers re-renders across all consuming components. We mitigate this using `useMemo` and `useCallback` inside our hooks.

---

## ADR 3: HttpOnly Cookies for Session Authentication

* **Context:** Sessions must be protected against token theft and cross-site scripting (XSS).
* **Decision:** Store session tokens inside backend-managed HttpOnly cookies, rather than storing JWTs inside client-side `localStorage`.
* **Reason:** Browsers prevent JavaScript scripts from accessing HttpOnly cookies, rendering XSS token harvesting impossible.
* **Trade-offs:** Requires explicitly setting `credentials: "include"` on all fetch calls and coordinating CORS configurations between the client and backend.
