import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import type { TeamMember } from "@/types/team";
import { TeamCard } from "./team-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface TeamListProps {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
  onOpenInvite: () => void;
  showActions: boolean;
}

export function TeamList({ members, onEdit, onOpenInvite, showActions }: TeamListProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filterOptions = [
    { value: "ALL", label: "Semua Peran" },
    { value: "MANAGER", label: "Manager" },
    { value: "STAFF", label: "Staff" },
  ];

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      (m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.phoneNumber ?? "").includes(search) ||
      (m.email ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "ALL" || m.staffRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter & Action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              type="text"
              placeholder="Cari nama, whatsapp, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={roleFilter}
              options={filterOptions}
              onValueChange={setRoleFilter}
            />
          </div>
        </div>

        {showActions && (
          <Button
            type="button"
            variant="primary"
            onClick={onOpenInvite}
            className="flex gap-2 items-center justify-center font-bold"
          >
            <UserPlus className="h-4 w-4" />
            <span>Undang Karyawan</span>
          </Button>
        )}
      </div>

      {/* Grid List */}
      {filteredMembers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              onEdit={onEdit}
              showActions={showActions}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--color-border)] rounded-3xl bg-[var(--color-surface-elevated)] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500/10 mb-4">
            <Search className="h-6 w-6 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text)]">
            Tidak ada karyawan ditemukan
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-sm">
            {search || roleFilter !== "ALL"
              ? "Coba ganti filter pencarian atau saringan peran Anda."
              : "Mulailah dengan mengundang anggota tim pertama Anda."}
          </p>
          {!search && roleFilter === "ALL" && showActions && (
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenInvite}
              className="mt-4 font-semibold"
            >
              Undang Karyawan Baru
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
