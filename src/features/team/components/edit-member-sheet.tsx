import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TeamMember, StaffRole, TeamMemberStatus } from "@/types/team";

interface EditMemberSheetProps {
 isOpen: boolean;
 onClose: () => void;
 member: TeamMember | null;
 onUpdate: (memberId: string, updates: { staffRole?: StaffRole; status?: TeamMemberStatus }) => Promise<void>;
 onDelete: (memberId: string) => Promise<void>;
}

export function EditMemberSheet({ isOpen, onClose, member, onUpdate, onDelete }: EditMemberSheetProps) {
 const [staffRole, setStaffRole] = useState<StaffRole>("STAFF");
 const [status, setStatus] = useState<TeamMemberStatus>("ACTIVE");
 const [isSaving, setIsSaving] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);

 useEffect(() => {
  if (member) {
   setStaffRole(member.staffRole);
   setStatus(member.status);
  }
 }, [member]);

 if (!member) return null;

 const roleOptions = [
  {
   value: "STAFF",
   label: "Staff / Operator",
   helperText: "Hanya dapat melihat jadwal pribadi, tidak bisa akses laporan & pengaturan.",
  },
  {
   value: "MANAGER",
   label: "Manager / Admin",
   helperText: "Bisa mengelola semua order, jadwal & pelanggan. Tidak bisa akses billing & settings.",
  },
 ];

 const statusOptions = [
  { value: "ACTIVE", label: "Aktif", helperText: "Akun dapat masuk dan menggunakan aplikasi." },
  { value: "SUSPENDED", label: "Dinonaktifkan (Suspended)", helperText: "Akun dikunci dan tidak bisa mengakses Rapiin." },
 ];

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!member) return;
  setIsSaving(true);
  try {
   await onUpdate(member.id, {
    ...(staffRole !== member.staffRole && { staffRole }),
    ...(status !== member.status && { status }),
   });
   onClose();
  } catch {
   // Error handled by parent via toast
  } finally {
   setIsSaving(false);
  }
 }

 async function handleDelete() {
  if (!member) return;
  if (!window.confirm(`Apakah Anda yakin ingin menghapus ${member.name} dari tim? Tindakan ini tidak bisa dibatalkan.`)) return;
  setIsDeleting(true);
  try {
   await onDelete(member.id);
   onClose();
  } catch {
   // Error handled by parent via toast
  } finally {
   setIsDeleting(false);
  }
 }

 return (
  <Sheet
   isOpen={isOpen}
   onClose={onClose}
   title="Edit Detail Anggota"
   description={`Perbarui hak akses atau status akun staf ${member.name}.`}
  >
   <form onSubmit={handleSubmit} className="space-y-6">
    <div className="space-y-1.5">
     <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
      Nama Karyawan
     </label>
     <div className="p-3 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold">
      {member.name}
     </div>
    </div>

    <div className="space-y-1.5">
     <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
      WhatsApp / Email
     </label>
     <div className="p-3 text-xs rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] space-y-1">
      {member.phoneNumber && <div>WA: {member.phoneNumber}</div>}
      {member.email && <div>Email: {member.email}</div>}
     </div>
    </div>

    <div className="space-y-1.5">
     <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
      Peran Hak Akses
     </label>
     <Select
      value={staffRole}
      options={roleOptions}
      onValueChange={(val) => setStaffRole(val as StaffRole)}
     />
    </div>

    <div className="space-y-1.5">
     <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
      Status Akun
     </label>
     <Select
      value={status}
      options={statusOptions}
      onValueChange={(val) => setStatus(val as TeamMemberStatus)}
     />
    </div>

    <div className="pt-4 space-y-3">
     <Button type="submit" variant="primary" className="w-full" isLoading={isSaving}>
      Simpan Perubahan
     </Button>

     <Button
      type="button"
      variant="secondary"
      className="w-full text-red-500 border-red-500/20 hover:bg-red-500/5 hover:text-red-600"
      onClick={handleDelete}
      isLoading={isDeleting}
     >
      Hapus Karyawan Dari Tim
     </Button>
    </div>
   </form>
  </Sheet>
 );
}
