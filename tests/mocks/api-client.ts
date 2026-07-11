import { apiFetch } from "@/lib/api-client";

export const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
