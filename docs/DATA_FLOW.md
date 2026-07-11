# Data Flow & Request Lifecycle

This document explains how data flows through Rapiin, from page load and state initialization to API mutations and client-side persistence.

---

## 1. Initial State Hydration Flow

When a user opens the application, data is synchronized and loaded into memory using the following steps:

```
[User visits page]
        │
        ▼
[Next.js Server renders Layout]
        │
        ▼
[Browser loads Client Bundle]
        │
        ▼
[AppDataProvider mounts]
        │
        ▼
[useEffect runs: ApiAuthService.getCurrentUser()]
        │
  ┌─────┴────────────────────────────────────────┐
  │                                              │
  ▼ (No Token / Expired)                         ▼ (Valid User JWT Cookie)
[User redirected to Login]                [Set currentUserId in React state]
                                                 │
                                                 ▼
                                        [onboardingCompleted?]
                                          ├── No ──► [Redirect to Onboarding Wizard]
                                          └── Yes ─► [fetchAllData() runs]
                                                           │
                                                           ▼
                                               [Concurrent API Calls]
                                               - fetchOrders()
                                               - fetchCustomers()
                                               - fetchInvoices()
                                               - fetchTemplates()
                                                           │
                                                           ▼
                                               [Update React state & set hydrated=true]
                                                           │
                                                           ▼
                                               [Sync non-sensitive state to localStorage]
```

---

## 2. API Request Lifecycle (Read / Write)

All API operations follow a structured path to decouple network details from UI presentation:

### Read Operations (Query Flow)
1. **Trigger:** A page component accesses data via `useAppData` or domain-specific custom hooks (e.g., `useOrders`).
2. **Context:** The hook reads the shared state object in the context (`state.orders`).
3. **Rendering:** If the cache is present, components render immediately. Otherwise, the app shows a loading spinner until `fetchAllData` resolves.

### Write Operations (Mutation Flow)
To create or update data, components use actions provided by `useAppData` (e.g., `createCustomer`):

```
[UI Trigger: Submit Form]
         │
         ▼
[Call createCustomer(payload) in AppDataProvider]
         │
         ▼
[Call ApiCustomerService.createCustomer(dto)]
         │
         ▼
[apiFetch sends POST request to Backend with credentials: "include"]
         │
         ├───► [Backend returns 201 Created with DTO]
         │              │
         │              ▼
         │     [Mapper transforms DTO to Customer model]
         │              │
         │              ▼
         │     [Update state.customers with new customer]
         │              │
         │              ▼
         │     [Local storage sync runs for backup caching]
         │              │
         │              ▼
         │     [UI re-renders automatically]
         │
         └───► [Backend returns 4xx/5xx Error]
                        │
                        ▼
               [apiFetch throws ApiError]
                        │
                        ▼
               [UI displays Toast notification / field validation errors]
```

---

## 3. Local Storage Caching & Backup Policy

* **Scope of Caching:** The app synchronizes non-sensitive client configuration elements (`business`, `auth` user identifiers, and UI state overrides) to `localStorage` key `rapiin-app-storage` via `writeAppStorageState`.
* **Sensitive Data Isolation:** Customers, invoices, message templates, and order lists are **never** stored inside the standard localStorage key to prevent unauthorized access from other client scripts or browser extensions.
* **Offline Backups:** For resilience, the application features an on-demand database backup system (`createBackup` in `storage-service.ts`) allowing users to download a JSON file containing their configurations and restore them using `restoreBackup`.
