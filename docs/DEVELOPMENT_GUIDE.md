# Development Guide

This guide provides step-by-step instructions for adding new features, pages, components, services, and hooks to the Rapiin Frontend.

---

## 1. Adding a New Page

To add a new page (e.g. dynamic reports page under `/dashboard/[businessSlug]/reports/custom`):

1. **Register the Route:** Open [src/lib/routes.ts](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/lib/routes.ts) and add your path builder function:
   ```typescript
   customReport: (slug: string) => `/dashboard/${slug}/reports/custom`
   ```
2. **Create the Folder & File:** In `src/app/dashboard/[businessSlug]/reports/`, create a new folder `custom/` containing `page.tsx`:
   ```tsx
   "use client";
   import { CustomReportsFeature } from "@/features/reports/components/custom-reports-feature";

   export default function CustomReportsPage() {
     return <CustomReportsFeature />;
   }
   ```
3. **Keep Pages Thin:** Pages should only serve as routing wrappers. Embed the main layout and state triggers in the Feature layer (`src/features`).

---

## 2. Adding a New Service & API Integration

To add a new database communication service:

1. **Create the Service File:** Create `src/services/report.service.ts`:
   ```typescript
   import { apiFetch } from "@/lib/api-client";

   export interface CustomReportDTO {
     id: string;
     revenue: number;
     createdAt: string;
   }

   export class ApiReportService {
     static async getReport(businessId: string): Promise<CustomReportDTO[]> {
       return apiFetch<CustomReportDTO[]>(`/api/businesses/${businessId}/reports/custom`);
     }
   }
   ```
2. **Add state to Context:** Update the [AppDataProvider](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/providers/app-data-provider.tsx) to coordinate loading, cache, and state variables:
   ```typescript
   const [reports, setReports] = useState<CustomReportDTO[]>([]);
   ```

---

## 3. Adding a Reusable UI Component

To add a reusable atom component (e.g., `tooltip.tsx`):

1. **Create Component:** Put it in `src/components/ui/tooltip.tsx`:
   ```tsx
   import type { ReactNode } from "react";
   import { cn } from "@/lib/cn";

   export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
     return (
       <div className="relative group inline-block">
         {children}
         <div className="absolute hidden group-hover:block bg-[var(--color-text)] text-[var(--color-text-inverse)] text-xs rounded p-2">
           {content}
         </div>
       </div>
     );
   }
   ```
2. **Usage:** Import it using the absolute import path:
   ```typescript
   import { Tooltip } from "@/components/ui/tooltip";
   ```
