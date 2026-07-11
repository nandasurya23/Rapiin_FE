# Authentication & Session Management

This document outlines the authentication flows, session handling mechanisms, and route protection implemented within the Rapiin Frontend.

---

## 1. Authentication Mechanisms

Rapiin uses cookie-based sessions for security. No tokens (JWT, OAuth) are stored in local storage to prevent token theft via cross-site scripting (XSS).

* **Protocol:** HTTPS HttpOnly, SameSite cookies managed by the backend server.
* **Credentials:** All API calls include `credentials: "include"` inside [api-client.ts](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/lib/api-client.ts) to automatically attach cookies to requests.
* **Auth Service:** Defined inside [auth.service.ts](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/services/auth.service.ts).

---

## 2. Authentication Flows

### Login Workflow
1. User enters email/phone number and password in the login form.
2. Form triggers `login` in `useAuth()`, calling `ApiAuthService.login()`.
3. Backend authenticates and returns user details while placing the HttpOnly session cookie in browser storage.
4. The client state resolves, storing user profiles in memory and triggering `fetchAllData()`.
5. User is redirected to `/dashboard/[businessSlug]`.

### Logout Workflow
1. User clicks "Keluar" (Logout).
2. The UI triggers `logout()` in `useAuth()`.
3. API call sent to `POST /api/auth/logout` to clear/invalidate the cookie server-side.
4. Client state is wiped completely (`currentUser = null`), and `localStorage` is cleared.
5. Redirected automatically to `/auth/login`.

---

## 3. Route Protection & Guards

Authentication checks and path redirection are managed by the [AppShell](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/layout/app-shell.tsx) component wrapper. This client-side guard acts as the security middleware for all paths prefixed with `/dashboard`.

### Redirection Rules Matrix

| Current User State | Requested Path | Action / Redirect Target |
| :--- | :--- | :--- |
| **Not logged in** (No cookie) | `/dashboard/*` | `/auth/login` |
| **Not logged in** (No cookie) | `/dashboard/super-admin/*` | `/auth/login` |
| **Logged in as OWNER** | `/dashboard/super-admin/*` | `/dashboard/[businessSlug]` |
| **Logged in as SUPER_ADMIN** | `/dashboard/[businessSlug]/*` | `/dashboard/super-admin/businesses` |
| **Logged in as OWNER (Onboarding incomplete)** | `/dashboard/[businessSlug]/*` | `/onboarding` |
| **Logged in as OWNER (Slug Mismatch)** | `/dashboard/incorrect-slug/*` | `/dashboard/[actualBusinessSlug]/*` |

---

## 4. Session Recovery (Silent Re-auth)

When a page refreshes, the app performs a silent check:
1. `AppDataProvider` mounts.
2. Triggers `getCurrentUser()` which requests `/api/auth/me`.
3. If the cookie is valid, the server replies with user info, and the app resumes.
4. If the cookie is expired or invalid, `/api/auth/me` fails, `hydrated` resolves, and the user is redirected to the login page.
