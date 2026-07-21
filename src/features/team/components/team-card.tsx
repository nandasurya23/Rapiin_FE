import { Edit2, Phone, Mail, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "./role-badge";
import { StatusBadge } from "./status-badge";
import type { TeamMember } from "@/types/team";

interface TeamCardProps {
 member: TeamMember;
 onEdit: (member: TeamMember) => void;
 showActions: boolean;
}

export function TeamCard({ member, onEdit, showActions }: TeamCardProps) {
 const initials = (member.name ?? "?")
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

 return (
  <div className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-sm">
   {/* Header */}
   <div className="flex items-start justify-between gap-4">
    <div className="flex items-center gap-3">
     <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-surface)] border border-[var(--color-border-strong)] text-sm font-bold text-[var(--color-primary)]">
      {initials}
     </div>
     <div className="min-w-0">
      <h4 className="truncate text-sm font-bold text-[var(--color-text)]">
       {member.name}
      </h4>
      <div className="mt-1 flex flex-wrap gap-1.5">
       <RoleBadge role={member.staffRole} />
       <StatusBadge status={member.status} />
      </div>
     </div>
    </div>

    {showActions && (
     <Button
      variant="secondary"
      size="icon-sm"
      className="opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={() => onEdit(member)}
      title="Edit Anggota"
     >
      <Edit2 className="h-3.5 w-3.5" />
     </Button>
    )}
   </div>

   {/* Details */}
   <div className="space-y-2 border-t border-[var(--color-border)] pt-3 mt-3 text-xs text-[var(--color-text-secondary)]">
    {member.phoneNumber && (
     <div className="flex items-center gap-2">
      <Phone className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
      <span className="truncate">{member.phoneNumber}</span>
     </div>
    )}
    {member.email && (
     <div className="flex items-center gap-2">
      <Mail className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
      <span className="truncate">{member.email}</span>
     </div>
    )}
    {member.joinedAt && (
     <div className="flex items-center gap-2">
      <Calendar className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
      <span>
       Bergabung{" "}
       {new Date(member.joinedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
       })}
      </span>
     </div>
    )}
    {member.lastActiveAt && (
     <div className="flex items-center gap-2">
      <Clock className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
      <span>
       Terakhir aktif{" "}
       {new Date(member.lastActiveAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
       })}
      </span>
     </div>
    )}
   </div>
  </div>
 );
}
