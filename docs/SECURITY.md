# Security Guidelines

This document outlines the security controls, validation strategies, and access restrictions implemented in the Rapiin Frontend.

---

## 1. Session and Cookie Protection

Rapiin enforces cookie-based session management to protect credentials:

* **HttpOnly Session Cookies:** User authentication tokens (JWT) are stored as HttpOnly, Secure, SameSite cookies. The frontend cannot access, read, or alter this cookie via Javascript (`document.cookie`), preventing token theft via Cross-Site Scripting (XSS).
* **Safe Credentials Propagation:** The custom API client (`apiFetch`) explicitly sets `credentials: "include"`. This ensures cookies are transmitted securely across cross-origin requests.

---

## 2. Input Validation & Form Hardening

All user-submitted forms must be validated client-side using **Zod** schema definitions before requests are made to the API.

* **Schema Location:** Store client validations in `src/lib/validation.ts`.
* **Prevention Benefits:** Client-side validation reduces backend exposure to malformed payloads, injection attempts, and empty parameters.

---

## 3. Client-Side Role Isolation

Access checks are implemented in [AppShell](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/layout/app-shell.tsx) to protect pages:

```typescript
if (currentUserRole === "SUPER_ADMIN" && !pathname.startsWith("/dashboard/super-admin")) {
  router.replace(ROUTES.superAdminBusinesses);
  return;
}
```

* **Client Redirection:** While client-side routing hides pages, it is a user-experience measure. True access controls are enforced at the API service boundary on the backend.
* **Sensitive Page Redirection:** If a user role changes or expires, `apiFetch` receives a `401 Unauthorized` status and dispatches the `"rapiin-unauthorized"` event, immediately redirecting the user back to `/auth/login` and cleaning up local caches.
