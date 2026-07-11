# Getting Started Guide

This document walks you through setting up the Rapiin Frontend project from scratch, running the local development environment, and preparing build bundles for production.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js:** version **`>= 18.x`** (Recommended: **`v20.x LTS`** or higher)
2. **Package Manager:** **`npm`** (packaged with Node.js) or **`pnpm`** (version 8+)
3. **Backend Instance:** The Rapiin Backend (`Rapiin_BE`) running locally (typically on port `3001`) or a hosted API environment.

---

## Step 1: Clone and Install

Clone the repository to your local directory and run the dependency installation command:

```bash
# Clone the repository
git clone <repository-url>
cd Rapiin_FE

# Install dependencies using npm
npm install
```

---

## Step 2: Environment Variables

Copy the `.env.example` file to create your local environment file:

```bash
cp .env.example .env
```

Open the newly created `.env` file and configure the variables:

| Variable Name | Purpose | Example / Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | The public client URL of this frontend application. | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | The server URL where Rapiin backend API endpoints are hosted. | `http://localhost:3001` |
| `NEXT_PUBLIC_SENTRY_DSN` | *(Optional)* DSN key for Sentry application monitoring. | `https://example-dsn@sentry.io` |
| `NEXT_PUBLIC_POSTHOG_KEY` | *(Optional)* Client-side PostHog product analytics tracking key. | `phc_xxxxxxxxxxxx` |

---

## Step 3: Run Locally (Development)

Start the Next.js development server:

```bash
npm run dev
```

* The app will start on **[http://localhost:3000](http://localhost:3000)**.
* Fast Refresh is enabled automatically. Edits to any component, page, or stylesheet will immediately update in the browser without losing state.

---

## Step 4: Build and Serve (Production)

To test the production behavior locally, or when deploying to production environments:

### 1. Build the Application
This generates optimized HTML, CSS, client-side bundles, and static page chunks inside the `.next` directory.

```bash
npm run build
```

### 2. Start the Production Server
Run the built application locally using the built resources.

```bash
npm run start
```

* The production bundle will serve on the same port configured (typically `http://localhost:3000`).

---

## Step 5: Run Code Verification (Linting)

Ensure your code aligns with our TypeScript and styling rules before submitting changes:

```bash
npm run lint
```

* This executes ESLint targeting all `.ts` and `.tsx` source files in the codebase.
* If any syntax or type-check errors are found, fix them before committing.
