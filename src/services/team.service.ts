// src/services/team.service.ts
// API service for Team Management endpoints.
// All calls proxy through the same-origin Next.js BE server.

import { apiFetch } from "@/lib/api-client";
import type {
  TeamMember,
  Invitation,
  InvitationResult,
  CreateInvitationPayload,
  UpdateTeamMemberPayload,
} from "@/types/team";

export class ApiTeamService {
  // ── Team Members ──────────────────────────────────────────────────────────

  async getMembers(): Promise<TeamMember[]> {
    const res = await apiFetch<{ members: TeamMember[] }>("/api/business/team");
    return res.members ?? [];
  }

  async getMember(memberId: string): Promise<TeamMember> {
    const res = await apiFetch<{ member: TeamMember }>(`/api/business/team/${memberId}`);
    return res.member;
  }

  async updateMember(memberId: string, payload: UpdateTeamMemberPayload): Promise<TeamMember> {
    const res = await apiFetch<{ member: TeamMember }>(`/api/business/team/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res.member;
  }

  async deleteMember(memberId: string): Promise<void> {
    await apiFetch(`/api/business/team/${memberId}`, { method: "DELETE" });
  }

  // ── Invitations ──────────────────────────────────────────────────────────

  async createInvitation(payload: CreateInvitationPayload): Promise<InvitationResult> {
    const res = await apiFetch<InvitationResult>("/api/business/team/invite", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  }

  async listInvitations(): Promise<Invitation[]> {
    const res = await apiFetch<{ invitations: Invitation[] }>("/api/business/team/invite");
    return res.invitations ?? [];
  }

  async revokeInvitation(inviteId: string): Promise<void> {
    await apiFetch(`/api/business/team/invite/${inviteId}/revoke`, { method: "POST" });
  }

  // ── Public (no auth required) ────────────────────────────────────────────

  async validateToken(token: string): Promise<{
    valid: boolean;
    staffRole: string;
    businessName: string;
    businessSlug: string;
    expiresAt: string;
  }> {
    return apiFetch(`/api/invite/validate?token=${encodeURIComponent(token)}`);
  }

  async joinTeam(payload: {
    token: string;
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<{ user: unknown }> {
    return apiFetch("/api/invite/join", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export const teamService = new ApiTeamService();
