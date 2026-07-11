# Architecture Overview

This document describes the architectural patterns, component hierarchy, rendering strategies, and layer separation guidelines for the Rapiin Frontend.

---

## Architectural Patterns

Rapiin uses a **Feature-Based Modular Architecture** layered on top of Next.js App Router rules. This architecture divides the codebase into distinct modules representing domain concerns rather than technical layers.

```
┌──────────────────────────────────────────────────────────┐
│                     Client Browser                       │
└────────┬────────────────────────────────────────┬────────┘
         │ (HTTP Requests)                        │ (State Sync)
         ▼                                        ▼
┌──────────────────┐                     ┌─────────────────┐
│ Next.js App      │                     │ AppDataProvider │
│ Router (Pages)   │                     │ (Global State)  │
└────────┬─────────┘                     └────────┬────────┘
         │                                        │
         │ (Render Components)                    │ (CRUD Operations)
         ▼                                        ▼
┌──────────────────────────────────────────────────────────┐
│                   features/ Domain Modules               │
│         (e.g., invoices, orders, calendar, CRM)          │
└────────┬────────────────────────────────────────┬────────┘
         │                                        │
         │ (Call Hooks)                           │ (CRUD Actions)
         ▼                                        ▼
┌──────────────────┐                     ┌─────────────────┐
│  src/hooks/      │                     │  src/services/  │
│  (Custom Hooks)  │                     │  (Service Layer)│
└──────────────────┘                     └────────┬────────┘
                                                  │
                                                  │ (Fetch Calls)
                                                  ▼
                                         ┌─────────────────┐
                                         │  src/lib/       │
                                         │  (API Client)   │
                                         └────────┬────────┘
                                                  │ (HTTP Requests)
                                                  ▼
                                         ┌─────────────────┐
                                         │   Rapiin BE     │
                                         └─────────────────┘
```

---

## Rendering Strategy

Rapiin combines server-side initialization with client-side interactivity to deliver a responsive workspace:

1. **Server Layouts & Shells:** Root layouts and structure nodes are handled by Next.js Server Components, permitting initial SEO rendering and meta extraction.
2. **Client-Centric Interactivity:** Dashboard, CRM, scheduling calendars, and form Wizards require immediate UI state feedback. These pages are marked with `"use client"` and execute client-side.
3. **Data Hydration:** State is initialized via Next.js routes. Upon page load, the [AppDataProvider](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/providers/app-data-provider.tsx) fetches the active session, matches user roles, and loads relevant data structures into a unified local state container.

---

## Layer Separation

To maintain clean code boundaries, code must belong to one of four well-defined layers:

### 1. Presentation Layer (Components)
* **Responsibility:** Rendering UI elements and handling user gestures.
* **Constraints:** Must not contain raw HTTP fetch logic. Components should either read state via hooks or receive props directly.

### 2. State & Hooks Layer (Hooks)
* **Responsibility:** Managing local component state, validation, input forms, and mapping global states.
* **Examples:** `useAuth`, `useOrders`, `useCustomers`.

### 3. Service Layer (Services)
* **Responsibility:** Orchestrating API queries, handling endpoint paths, and applying data transformations.
* **Mappers:** Translate network payloads (DTOs) into frontend-friendly model types using the `Mapper` pattern to insulate UI components from server schema changes.

### 4. Core Utility Layer (Lib)
* **Responsibility:** Stateless mathematical functions, formatting helpers, and third-party API configurations.
* **Examples:** `format.ts` (currency, dates), `booking.ts` (time slot overlapping), `subscription.ts` (plan access rights).
