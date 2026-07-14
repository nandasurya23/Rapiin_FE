import { apiFetch } from "@/lib/api-client";
import { logServiceError } from "./utils";
import type { MessageTemplate, MessageCategory } from "@/types/message";

export interface MessageTemplateDTO {
  id: string;
  businessId: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateService {
  getTemplates(businessId: string): Promise<MessageTemplate[]>;
  createTemplate(payload: { category: string; title: string; content: string }): Promise<MessageTemplate>;
  updateTemplate(id: string, payload: { title: string; content: string }): Promise<MessageTemplate | null>;
  deleteTemplate(id: string): Promise<void>;
}

export class ApiMessageTemplateService implements MessageTemplateService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTemplates(_businessId: string): Promise<MessageTemplate[]> {
    try {
      const response = await apiFetch<MessageTemplateDTO[]>("/api/message-templates");
      return response.map((item) => ({
        ...item,
        category: item.category as MessageCategory,
        variables: (item.content.match(/\{\{([^}]+)\}\}/g) || []).map((v) => v.slice(2, -2).trim()),
      }));
    } catch (err) {
      logServiceError("Failed to fetch templates", err);
      return [];
    }
  }

  async createTemplate(payload: { category: string; title: string; content: string }): Promise<MessageTemplate> {
    const response = await apiFetch<MessageTemplateDTO>("/api/message-templates", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      ...response,
      category: response.category as MessageCategory,
      variables: (response.content.match(/\{\{([^}]+)\}\}/g) || []).map((v) => v.slice(2, -2).trim()),
    };
  }

  async updateTemplate(id: string, payload: { title: string; content: string }): Promise<MessageTemplate | null> {
    const response = await apiFetch<MessageTemplateDTO>(`/api/message-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return {
      ...response,
      category: response.category as MessageCategory,
      variables: (response.content.match(/\{\{([^}]+)\}\}/g) || []).map((v) => v.slice(2, -2).trim()),
    };
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiFetch(`/api/message-templates/${id}`, {
      method: "DELETE",
    });
  }
}
