# API Integration & Service Layer

This document details Rapiin's networking layer, custom HTTP request wrappers, error interception mechanics, and API mapper patterns.

---

## 1. Network Layer Architecture

All network communication flows through a dedicated layered service architecture:

```
┌───────────────────────────────────────┐
│           React Components            │
└──────────────────┬────────────────────┘
                   │
                   ▼ (Calls Service)
┌───────────────────────────────────────┐
│        Services (e.g., auth.service)  │
└──────────────────┬────────────────────┘
                   │
                   ▼ (Maps payloads)
┌───────────────────────────────────────┐
│      Mapper (Transforms DTO ↔ Domain) │
└──────────────────┬────────────────────┘
                   │
                   ▼ (Executes Request)
┌───────────────────────────────────────┐
│    apiFetch Client (api-client.ts)    │
└──────────────────┬────────────────────┘
                   │
                   ▼ (HTTP request)
┌───────────────────────────────────────┐
│         Rapiin API Backend            │
└───────────────────────────────────────┘
```

---

## 2. Custom HTTP Client (`src/lib/api-client.ts`)

The `apiFetch` function is a wrapper built on top of native `fetch` containing key interceptors:

### Key Features
* **URL Resolution:** Combines path with `process.env.NEXT_PUBLIC_API_URL`.
* **Automatic JSON headers:** Sets `Content-Type: application/json` unless body is `FormData`.
* **Path Tracking:** Dynamically appends custom header `X-Rapiin-Path` containing client location for backend analytics.
* **Credentials Exchange:** Uses `credentials: "include"` for HttpOnly cookie exchange.
* **Response Unwrapping:** If backend returns `{ ok: true, data: T }` wrapping structure, automatically extracts the inner `data` node.

### Error Interceptor
If a request fails (`response.ok === false`):
1. **Unauthorized Handlers (401):** Dispatches a CustomEvent `"rapiin-unauthorized"` to trigger local session cleanup.
2. **Error Parsing:** Inspects payload for Zod validation errors (`data.error.details`), flattening them into readables: `"field: error message"`.
3. **Class Throw:** Instantiates and throws an `ApiError`.

---

## 3. Service Layer and Mapper Pattern (`src/services/`)

Each domain uses service classes to define network commands. To protect component views from API modifications, data is converted using mappers:

```typescript
export interface Mapper<DTO, Domain> {
  toDomain(raw: DTO): Domain;
  toDTO(domain: Domain): DTO;
}
```

### Example: Auth Mapper in action (`auth.service.ts`)
```typescript
export class AuthUserMapper implements Mapper<AuthUserDTO, AuthUser> {
  toDomain(raw: AuthUserDTO): AuthUser {
    return { ...raw };
  }
  toDTO(domain: AuthUser): AuthUserDTO {
    return { ...domain };
  }
}
```
Using this approach, if the backend changes a property from `phoneNumber` to `mobile`, the adjustment is isolated inside the Mapper class instead of editing multiple visual files.
