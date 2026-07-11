# Rapiin Frontend Documentation

Welcome to the official developer documentation for the **Rapiin Frontend**. This documentation site provides all the necessary resources, guides, architecture maps, and standards to help you understand, run, develop, and maintain the Rapiin client application.

## Project Overview

Rapiin is a smart business assistant and manager tailored for small and medium-scale service businesses (such as barbershops, clinics, studios, etc.). The frontend is built as a responsive web app using Next.js, allowing business owners to manage bookings, orders, customers, WhatsApp-based messaging templates, billing invoices, and subscriptions.

---

## Tech Stack

The Rapiin Frontend relies on a modern, minimal, and performant web stack:

* **Framework:** [Next.js 15.3.0](https://nextjs.org/) (App Router, React 19 Client/Server Components)
* **Language:** [TypeScript](https://www.typescript.org/) (strict mode)
* **Styling:** [Tailwind CSS v3](https://tailwindcss.com/) & [Autoprefixer](https://github.com/postcss/autoprefixer)
* **State Management:** Hybrid State (TanStack Query for server state caching, Zustand for volatile message composer drafts, React Context for Auth session verification)
* **Testing:** Jest & React Testing Library (RTL) for production-ready unit testing
* **Icons:** [Lucide React](https://lucide.dev/)
* **Schema Validation:** [Zod](https://zod.dev/)
* **Utilities:** `clsx` & `tailwind-merge` for conditional class combinations

---

## Quick Start

To run Rapiin locally in development mode:

```bash
# 1. Clone the repository and install dependencies
npm install

# 2. Configure environment variables (copy and rename)
cp .env.example .env

# 3. Spin up the local development server
npm run dev

# 4. Run Jest unit test suites
npm run test
```

For detailed setup steps, environment configurations, and build tasks, please refer to the [Getting Started Guide](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/GETTING_STARTED.md).

---

## Documentation Index

Explore the documentation sections to learn more:

### 🚀 Getting Started & Setup
* [Getting Started](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/GETTING_STARTED.md) — Installing, configuring, building, and running.
* [Troubleshooting](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/TROUBLESHOOTING.md) — Solutions to common development and build issues.

### 📐 Architecture & Infrastructure
* [Project Structure](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/PROJECT_STRUCTURE.md) — Directory layout and folder responsibilities.
* [Architecture Overview](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/ARCHITECTURE.md) — Layered separation, rendering strategies, and component hierarchy.
* [Data Flow](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/DATA_FLOW.md) — Lifecycle of requests, page loading, and state synchronization.
* [Authentication](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/AUTHENTICATION.md) — Login, signup, reset password flows, and session management.
* [Routing](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/ROUTING.md) — Page structures, dynamic parameters, and path constants.
* [State Management](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/STATE_MANAGEMENT.md) — Local, context-based global state, and persistence rules.
* [API Integration](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/API_INTEGRATION.md) — HTTP Client custom logic, service wrappers, and mapper transformations.

### 🎨 Standards & Design
* [Component Guidelines](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/COMPONENT_GUIDELINES.md) — Conventions for building modular React components.
* [Design System](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/DESIGN_SYSTEM.md) — Implemented typography, colors, borders, shadows, and layout styles.
* [Coding Standards](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/CODING_STANDARDS.md) — Lint rules, formatting guidelines, naming conventions, and file structures.

### 🛠 Development & Practices
* [Development Guide](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/DEVELOPMENT_GUIDE.md) — Step-by-step guides to adding features, pages, hooks, or components.
* [Performance Guidelines](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/PERFORMANCE.md) — Image generation optimization, client bundle management, and layout shifts.
* [Security Guidelines](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/SECURITY.md) — JWT HttpOnly cookies, validation practices, XSS prevention, and access rules.
* [Contributing Guide](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/CONTRIBUTING.md) — Code submission guidelines, branching strategies, and PR processes.
* [Decision Log](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/DECISION_LOG.md) — Architectural decisions history, rationale, and tradeoffs.

### 🧪 Unit Testing Guide
* [Frontend Testing Guide](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/docs/testing/README.md) — Setup details, mock structures, running tests, and guidelines.
