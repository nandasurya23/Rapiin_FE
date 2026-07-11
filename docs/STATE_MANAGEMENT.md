# State Management

This document describes how state is structured, updated, and accessed in Rapiin.

---

## 1. State Architecture

Rapiin does not use heavy external state libraries (such as Redux or Zustand) or Server-State managers (such as React Query/TanStack Query). Instead, it relies on a single **React Context Provider** coupled with domain hooks:

```
┌───────────────────────────────────────────────┐
│              AppDataProvider                  │
│       (Global React Context State)            │
└──────┬──────────────┬──────────────┬──────────┘
       │              │              │
       ▼              ▼              ▼
 ┌──────────┐   ┌──────────┐   ┌──────────┐
 │ useAuth  │   │useOrders │   │useCust...│
 └────┬─────┘   └────┬─────┘   └────┬─────┘
      │              │              │
      ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│Auth Comps │  │Order Comps│  │CRM Comps  │
└───────────┘  └───────────┘  └───────────┘
```

* **Global Context Container:** [AppDataProvider](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/providers/app-data-provider.tsx) maintains the state for all modules (`orders`, `customers`, `invoices`, etc.).
* **State Hydration:** Fetched from API endpoints on initialization.
* **Component Hooks:** Individual hooks (`useAuth`, `useOrders`, `useCustomers`) isolate specific sub-sections of the context for specific UI segments.

---

## 2. Global State Schema (`AppStorageState`)

The state schema is defined in `src/types/app-state.ts`. It includes:

1. **`auth`**: Holds information on registered users and current user ID.
2. **`business`**: Configuration object of the active business owner.
3. **`orders` / `customers` / `invoices`**: Main arrays containing the operational database.
4. **`messageTemplates`**: User-defined templates for client follow-ups.
5. **`upgradeRequests`**: Array of billing requests.

---

## 3. Caching & Synchronous Writes

When a mutation is requested:
1. The service is called to perform the server-side update.
2. If successful, `AppDataProvider` updates its internal state via `setAppState`.
3. An effect triggers to write non-sensitive details to `localStorage` via `writeAppStorageState`.

This ensures that the UI updates immediately and configuration state persists across page refreshes.
