# Design System

This document outlines the design tokens, color palette, typography definitions, shadows, and interactive transition models configured within the Rapiin Frontend.

---

## 1. Brand & Semantic Colors

Rapiin uses custom-curated CSS variables in `src/app/globals.css` rather than default Tailwind colors:

### Brand Primitives
* **Navy Blue (Primary):** Representing authority and clarity.
  * `--color-navy-900`: `#0E2554` (Active)
  * `--color-navy-800`: `#223F73` (Hover)
  * `--color-navy-700` / `--color-primary`: `#375891` (Base)
  * `--color-navy-50`: `rgba(55, 88, 145, 0.04)` (Surface)
* **Gold (Accent):** Representing value, highlights, and conversions.
  * `--color-accent`: `#DA9F4E` (Base)
  * `--color-accent-hover`: `#AF752E` (Hover)

### Semantic Layout Elements
* **Background:** `--color-background` (`#FBFBFC`)
* **Surface/Cards:** `--color-surface` (`#FFFFFF`)
* **Elevated Surfaces:** `--color-surface-elevated` (`#F4F6FB`)
* **Inset Surfaces:** `--color-surface-inset` (`#EEF1F8`)

### Interactive Statuses
* **Success:** `--color-success` (`#1E7A52`) | Surface: `rgba(30, 122, 82, 0.08)`
* **Warning:** `--color-warning` (`#B8791E`) | Surface: `rgba(218, 159, 78, 0.1)`
* **Danger:** `--color-danger` (`#C53030`) | Surface: `rgba(197, 48, 48, 0.07)`
* **Info:** `--color-info` (`#375891`) | Surface: `rgba(55, 88, 145, 0.08)`

---

## 2. Typography

* **Primary Font Family:** `'Outfit'`, `'Inter'`, `sans-serif` (configured as `--font-sans`).
* **Weights:** `300` (Light), `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold), `800` (Extra-Bold).
* **Base Text Size:** `15px` (`line-height: 1.5`) configured on the body element.

---

## 3. Elevation & Border Radii

### Radius Tokens
* `--radius-xs`: `4px`
* `--radius-sm`: `6px`
* `--radius-md`: `8px` (Standard buttons, card containers)
* `--radius-lg`: `12px` (Modal windows, settings panes)
* `--radius-xl`: `16px`
* `--radius-full`: `9999px`

### Shadow Elevators
* `--shadow-xs`: `0 1px 2px rgba(14, 37, 84, 0.05)`
* `--shadow-sm`: `0 1px 4px rgba(14, 37, 84, 0.07)`
* `--shadow-md`: `0 4px 14px rgba(14, 37, 84, 0.09)` (Standard dropdowns, cards)
* `--shadow-modal`: `0 20px 60px rgba(14, 37, 84, 0.16)` (Centering overlays)

---

## 4. Layout Layout Measurements

* **Sidebar Width:** `240px` (collapsed: `72px`)
* **Topbar Height:** `56px`
* **Mobile Nav Height:** `64px`
