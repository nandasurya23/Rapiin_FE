# Security Audit

This document evaluates the security architecture of the Rapiin Frontend.

---

## 1. Authentication Security

* **HttpOnly Session Cookies:**
  * *Status:* Secure.
  * *Details:* JWT tokens are stored as HttpOnly cookies, protecting them from script-based access (XSS).
* **Cross-Site Request Forgery (CSRF):**
  * *Status:* Protected.
  * *Details:* SameSite cookie policies prevent cookies from being sent along with cross-site requests.

---

## 2. Storage Analysis

* **Plaintext Caching:**
  * *Finding:* Configuration settings are stored in plaintext in the browser's `localStorage` (key: `rapiin-app-storage`).
  * *Impact:* While the application isolates sensitive data (e.g. customer lists, order records) and only stores configuration data locally, malicious browser extensions can still read these settings.
  * *Recommendation:* Encrypt configuration settings before saving them to local storage using simple cryptographic utilities, or reduce the amount of data cached on the client.

---

## 3. Input Sanitization & Validation

* **Client-Side Validation:**
  * *Status:* Good.
  * *Details:* Zod schemas validate form inputs client-side, reducing the risk of invalid or malformed payloads reaching the backend.
  * *Recommendation:* Verify that all API endpoints have matching Zod validation schemas to maintain consistent safety rules across the client and server.
