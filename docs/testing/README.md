# Rapiin Frontend Testing Guide

This guide establishes the conventions, architecture, configuration, and best practices for writing and executing unit tests in the Rapiin Frontend application.

---

## 1. Testing Strategy

We follow a **behavior-driven unit testing approach** using **Jest** and **React Testing Library (RTL)**.
* **Component Testing:** Focuses on component outputs, DOM updates, event callbacks, and user behaviors, avoiding internal state implementation details.
* **Utility Testing:** Covers all edge cases, null/undefined inputs, and mathematical boundaries.
* **Hooks & Services:** Uses mocked API requests and mocked query clients to verify state mutations and async data flows.

---

## 2. Directory Structure

All testing files must live in the `/tests` root folder, matching the module paths of the `src` directory:

```text
tests/
├── setup/                 # Test framework configurations and utilities
│   ├── jest.setup.ts      # Global environment setup and localStorage mocks
│   └── test-utils.tsx     # Custom render wrapping standard React Query clients
├── mocks/                 # Global mock profiles and API adapters
│   ├── api-client.ts      # Mock adapter for apiFetch calls
│   └── mock-data.ts       # Reusable mock records (Business, Customer, Order)
├── components/            # UI components and primitives tests
├── hooks/                 # React hook tests (Zustand stores, Query hooks)
├── utils/                 # Pure utility function tests
├── services/              # API Client service classes tests
└── lib/                   # Complex core business libraries tests
```

---

## 3. Naming Conventions

Always align testing filenames with the target code unit being tested:
* Primitives / Forms: `Button.test.tsx`, `LoginForm.test.tsx`
* Hooks: `useCustomers.test.ts`
* Utilities: `format.test.ts`
* Service Classes: `customer.service.test.ts`

---

## 4. Run Commands & Coverage Targets

### Running Tests
To run all test suites in the application:
```bash
npm run test
```

### Running Test Coverage
To generate a comprehensive test coverage report:
```bash
npx jest --coverage
```

### Coverage Goals
* **Statements:** &ge; 90%
* **Branches:** &ge; 85%
* **Functions:** &ge; 90%
* **Lines:** &ge; 90%

---

## 5. Mocking Strategy & Best Practices

1. **Deterministic Isolation (AAA):** Structure tests using the Arrange-Act-Assert pattern. Each test must remain independent of state mutations from other tests.
2. **Never Make Actual HTTP Calls:** Always mock the network adapter (`apiFetch`) using the mocked client:
   ```typescript
   import { mockApiFetch } from "../mocks/api-client";
   ```
3. **Use custom wrappers for hooks:** Hook tests relying on Query Client or context must use `createTestQueryClient` or custom render wrappers from `tests/setup/test-utils`.

---

## 6. Common Mistakes to Avoid

* **Forget TSX Extension:** Putting JSX tags inside `.test.ts` instead of `.test.tsx` will cause SWC compiler syntax errors.
* **Hoisting order with mocked data:** Declaring `mockCustomer` from external files inside a `jest.mock` closure before it is initialized. Make sure mock variables are prefixed with the word `mock` or declared locally inside the hoisted block.
* **Unmocked API Calls:** Forgetting to mock custom services or the global API transport Client, resulting in fetch ReferenceErrors in the jsdom environment.

---

## 7. How to Write a New Test (Step-by-Step)

### Step 1: Place in the matching subfolder under `/tests`
If you are testing `src/utils/math.ts`, create `tests/utils/math.test.ts`.

### Step 2: Set up your Test Case
For a utility function:
```typescript
import { add } from "@/utils/math";

describe("Math Utility", () => {
  it("should add two positive integers correctly", () => {
    // Arrange & Act
    const result = add(2, 3);
    // Assert
    expect(result).toBe(5);
  });
});
```

### Step 3: Run the Test
Verify it runs and passes in isolation:
```bash
npx jest tests/utils/math.test.ts
```

