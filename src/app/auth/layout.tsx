import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(32,166,122,0.09),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(20,122,92,0.08),_transparent_24%),var(--background)]">
      {children}
    </div>
  );
}
