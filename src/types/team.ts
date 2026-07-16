// src/types/team.ts
// Data types for the Team Management feature.
// Mirrors the backend response shape from GET /api/business/team.

export type StaffRole = "MANAGER" | "STAFF";
export type TeamMemberStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type TeamMember = {
  id: string;             // TeamMember record ID (not User ID)
  userId: string;         // The User.id this TeamMember belongs to
  name: string;
  email: string | null;
  phoneNumber: string | null;
  staffRole: StaffRole;
  status: TeamMemberStatus;
  invitedBy: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
};

export type InvitationResult = {
  inviteId: string;
  token: string;
  inviteUrl: string;
  whatsappMessage: string;
  expiresAt: string;
};

export type Invitation = {
  id: string;
  staffRole: StaffRole;
  label: string | null;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  invitedBy: string;
};

export type CreateInvitationPayload = {
  staffRole: StaffRole;
  label?: string;
  expiresInHours?: number;
};

export type UpdateTeamMemberPayload = {
  staffRole?: StaffRole;
  status?: TeamMemberStatus;
};
