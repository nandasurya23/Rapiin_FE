# Contributing Guide

This document outlines the workflow and practices for contributing code modifications to the Rapiin Frontend.

---

## 1. Branch Naming Standards

To keep the repository history clean, prefix all branch names with their purpose:

* **New Features:** `feat/feature-name`
* **Bug Fixes:** `fix/bug-description`
* **Performance Enhancements:** `perf/optimization-target`
* **Documentation updates:** `docs/topic-name`
* **Code Refactoring:** `refactor/clean-up-scope`

*Example:* `feat/add-whatsapp-templates`

---

## 2. Local Verification Checklist

Before pushing your branch and opening a Pull Request, run the following commands locally:

1. **Lint Checks:** Verify formatting and coding standards:
   ```bash
   npm run lint
   ```
2. **Build Test:** Confirm Next.js can compile the production bundles:
   ```bash
   npm run build
   ```

---

## 3. Pull Request Best Practices

1. **Clean Diff:** Ensure your commits only contain changes related to the task. Avoid formatting changes in unrelated files.
2. **Review:** Request review from at least one principal engineer or peer before merging.
3. **No Direct Pushes:** All changes must go through a pull request; direct commits to `main` or `master` are blocked.
