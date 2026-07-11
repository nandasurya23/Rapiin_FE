import { ApiCustomerService } from "@/services/customer.service";
import { mockApiFetch } from "../mocks/api-client";
import { mockCustomer } from "../mocks/mock-data";

describe("ApiCustomerService", () => {
  let service: ApiCustomerService;

  beforeEach(() => {
    service = new ApiCustomerService();
    jest.clearAllMocks();
  });

  it("fetches customers successfully", async () => {
    mockApiFetch.mockResolvedValueOnce([mockCustomer]);

    const result = await service.getCustomers("biz_123");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/customers?limit=100");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("John Doe");
  });

  it("creates a customer successfully", async () => {
    mockApiFetch.mockResolvedValueOnce(mockCustomer);

    const payload = {
      name: "John Doe",
      whatsappNumber: "628987654321",
      status: "NEW" as const,
    };

    const result = await service.createCustomer(payload);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/customers", expect.objectContaining({
      method: "POST",
      body: JSON.stringify(payload),
    }));
    expect(result.id).toBe("cust_123");
  });
});
