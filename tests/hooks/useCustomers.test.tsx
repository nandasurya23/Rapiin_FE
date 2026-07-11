import { renderHook, waitFor } from "@testing-library/react";
import { useCustomers } from "@/hooks/use-customers";
import { createTestQueryClient } from "../setup/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";

jest.mock("@/components/providers/app-data-provider", () => ({
  useAppData: () => ({
    business: { id: "biz_123" },
    canAccessWriteMode: true,
    readOnlyReason: null,
    canCreateCustomer: true,
    currentBusinessUsage: { used: 0, limit: 100 },
  }),
}));

jest.mock("@/services/customer.service", () => {
  const localMockCustomer = {
    id: "cust_123",
    businessId: "biz_123",
    name: "John Doe",
    whatsappNumber: "628987654321",
    status: "NEW" as const,
  };
  return {
    ApiCustomerService: jest.fn().mockImplementation(() => ({
      getCustomers: jest.fn().mockResolvedValue([localMockCustomer]),
      createCustomer: jest.fn().mockResolvedValue(localMockCustomer),
      updateCustomer: jest.fn().mockResolvedValue(localMockCustomer),
      deleteCustomer: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

describe("useCustomers Custom Hook", () => {
  it("should fetch and load customers state", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCustomers(), { wrapper });

    await waitFor(() => expect(result.current.customers).toHaveLength(1));
    expect(result.current.customers[0].name).toBe("John Doe");
  });
});
