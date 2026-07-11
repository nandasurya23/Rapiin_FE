# Component Guidelines

This document outlines the conventions, patterns, and structure for building components in the Rapiin Frontend.

---

## 1. Directory Placement Rules

Where does a new component belong?

* **`src/components/ui/`**: Low-level UI atoms (buttons, inputs, checkboxes, loaders) that contain no business logic.
* **`src/components/shared/`**: Reusable compound components that may handle general app logic but are not bound to a single domain (e.g., date pickers, dialog boxes, custom calendars).
* **`src/features/[featureName]/components/`**: Feature-specific components containing domain knowledge (e.g., `CustomerEditDrawer.tsx` belongs in `src/features/customers/components/`).

---

## 2. Naming Conventions

* **Files & Folders:** Kebab-case (`date-picker.tsx`, `password-input.tsx`).
* **Component Declarations:** PascalCase (`Button`, `DatePicker`).
* **Prop Interfaces:** PascalCase ending with `Props` (`ButtonProps`).
* **UI Atom Exports:** Use named exports instead of default exports to prevent import naming drift:
  ```typescript
  export function Button(...) { ... }
  ```

---

## 3. Styling & Composition pattern

Use the custom `cn` utility to merge styles, combining Tailwind utility classes with CSS variables:

```typescript
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "elevated";
}

export function Card({ className, variant = "flat", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-border)] p-4",
        variant === "elevated" && "bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]",
        className
      )}
      {...props}
    />
  );
}
```

---

## 4. Reusability Principles

1. **Native Prop Propagation:** Always spread HTML attributes (e.g. extending `React.ButtonHTMLAttributes<HTMLButtonElement>`) to support standard behaviors like `disabled`, `onClick`, and `type`.
2. **Strict Accessibility:** Ensure interactive elements support loading states (`aria-busy`), proper aria roles, and screen-readers.
3. **No Hidden Logic:** Keep UI primitives purely representational. Never embed network fetch calls directly inside `components/ui/`.
