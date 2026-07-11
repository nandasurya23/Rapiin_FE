import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MessageCategory } from "@/types/message";
import type { ID } from "@/types/common";

export type MessageComposerState = {
  activeCategory: MessageCategory;
  selectedCustomerId: ID | null;
  selectedOrderId: ID | null;
  selectedTemplateId: ID | null;
  drafts: Record<
    string,
    {
      title: string;
      content: string;
    }
  >;
};

export type MessageComposerActions = {
  updateMessageComposer: (payload: Partial<Omit<MessageComposerState, "drafts">>) => void;
  saveMessageDraft: (templateId: string, payload: { title: string; content: string }) => void;
  resetComposer: () => void;
};

const initialState: MessageComposerState = {
  activeCategory: "FOLLOW_UP",
  selectedCustomerId: null,
  selectedOrderId: null,
  selectedTemplateId: null,
  drafts: {},
};

export const useMessageComposerStore = create<MessageComposerState & MessageComposerActions>()(
  persist(
    (set) => ({
      ...initialState,
      updateMessageComposer: (payload) =>
        set((state) => ({
          ...state,
          ...payload,
        })),
      saveMessageDraft: (templateId, payload) =>
        set((state) => ({
          ...state,
          drafts: {
            ...state.drafts,
            [templateId]: payload,
          },
        })),
      resetComposer: () => set(initialState),
    }),
    {
      name: "rapiin-message-composer",
    }
  )
);
