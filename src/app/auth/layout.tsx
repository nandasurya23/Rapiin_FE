import type { ReactNode } from "react";
import { AppDataProvider } from "@/components/providers/app-data-provider";

export default function AuthLayout({ children }: { children: ReactNode }) {
 return <AppDataProvider>{children}</AppDataProvider>;
}
