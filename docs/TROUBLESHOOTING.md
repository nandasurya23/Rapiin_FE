# Troubleshooting Guide

This guide resolves common setup, runtime, and build issues in the Rapiin Frontend.

---

## 1. Local Caching Mismatches (Hydration/State Errors)

### Symptom
The UI displays old settings, crashes during page load, or shows hydration warnings like:
`Text content did not match. Server: "..." Client: "..."`

### Cause
Changes in database structures or local state schemas may conflict with legacy caches stored inside the browser's `localStorage`.

### Resolution
Clear the local storage key to force the application to fetch fresh records:
1. Open Chrome DevTools (`F12`).
2. Go to **Application** -> **Local Storage**.
3. Right-click and delete the `rapiin-app-storage` key.
4. Refresh the page to reload the state.

---

## 2. API Connection Failures (Network Errors / 401 Redirect Loops)

### Symptom
API actions fail immediately, showing `API request failed with status 401` or redirection loops back to the login page.

### Cause
* The backend API server (`Rapiin_BE`) is not running or is hosted on a different port than defined in the `.env` file.
* Cookie exchange is failing due to domain configuration issues.

### Resolution
1. Verify that your `.env` contains the correct API address:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
2. Check your browser console: if you see CORS warnings, confirm that the backend server's whitelist configurations permit requests from `http://localhost:3000`.
3. Confirm that `credentials: "include"` is set in your `apiFetch` calls (refer to [api-client.ts](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/lib/api-client.ts)).

---

## 3. ESLint & TypeScript Compilation Failures

### Symptom
Running `npm run build` fails with type checks or naming warnings:
`Property 'x' does not exist on type 'y'`

### Cause
TypeScript is configured in strict mode, which throws compile-time errors for implicit types, missing properties, or incorrect interfaces.

### Resolution
* Run `npm run lint` locally before building to catch syntax warnings early.
* Avoid using `any` types; define interfaces in `src/types/` to keep parameters clean.
