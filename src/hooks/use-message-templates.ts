import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiMessageTemplateService } from "@/services/message-template.service";
import { useAppData } from "@/components/providers/app-data-provider";

const messageTemplateService = new ApiMessageTemplateService();

export function useMessageTemplates() {
  const queryClient = useQueryClient();
  const { business, canAccessWriteMode, readOnlyReason } = useAppData();

  const { data: messageTemplates = [], isLoading } = useQuery({
    queryKey: ["messageTemplates", business?.id],
    queryFn: () => messageTemplateService.getTemplates(business?.id || ""),
    enabled: !!business?.id && business.id !== "biz_default",
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { category: string; title: string; content: string }) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return messageTemplateService.createTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messageTemplates"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { title: string; content: string } }) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return messageTemplateService.updateTemplate(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messageTemplates"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return messageTemplateService.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messageTemplates"] });
    },
  });

  return {
    messageTemplates,
    isLoading,
    createMessageTemplate: (payload: { category: string; title: string; content: string }) => createMutation.mutateAsync(payload),
    updateMessageTemplate: (id: string, payload: { title: string; content: string }) => updateMutation.mutateAsync({ id, payload }),
    deleteMessageTemplate: (id: string) => deleteMutation.mutateAsync(id),
  };
}
