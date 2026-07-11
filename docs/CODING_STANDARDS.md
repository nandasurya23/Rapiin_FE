# Coding Standards & Guidelines

This document outlines the coding standards, style guidelines, and TypeScript conventions required for the Rapiin Frontend codebase.

---

## 1. Naming Conventions

### File & Directory Naming
* **Folders:** Use kebab-case (`components/ui`, `features/business-link`).
* **Source Files:** Use kebab-case (`app-data-provider.tsx`, `use-auth.ts`, `api-client.ts`).

### Variable & Symbol Naming
* **React Components:** PascalCase (`AppShell`, `Button`).
* **Functions & Methods:** camelCase (`createCustomer`, `handleClose`).
* **TypeScript Types & Interfaces:** PascalCase (`AuthUser`, `CustomerInput`).
* **Constants:** UPPER_SNAKE_CASE (`STORAGE_KEY`, `ROUTES`).

---

## 2. Import Organization Rules

To keep file headers readable, group imports in the following order, separated by a blank line:

1. **System Core:** React core APIs and Next.js built-ins (`next/navigation`, `next/link`).
2. **Third-Party Packages:** External dependencies (`lucide-react`, `zod`).
3. **Absolute Project Modules:** Path aliases beginning with `@/` (`@/components`, `@/features`, `@/hooks`, `@/services`, `@/lib`, `@/types`).
4. **Relative Stylesheets:** CSS files or assets (`./style.css`).

```typescript
// 1. System Core
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Third-Party Packages
import { AlertCircle } from "lucide-react";
import { z } from "zod";

// 3. Absolute Project Modules
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
```

---

## 3. TypeScript Rules

* **Strict Type Enforcement:** `tsconfig.json` runs in strict mode. All arguments, returns, and variables must have explicit types.
* **No `any` Types:** Use of the `any` keyword is disallowed. Use `unknown` if a type is undefined, or create explicit interfaces.
* **Component Prop Types:** Always define props using a clean interface or type helper:
  ```typescript
  interface CardProps {
    title: string;
    children: React.ReactNode;
  }
  ```
