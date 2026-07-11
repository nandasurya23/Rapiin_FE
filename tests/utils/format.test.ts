import { formatCurrency, formatDate, formatLongDate, formatDateTime } from "@/lib/format";

describe("Format Utilities", () => {
  describe("formatCurrency", () => {
    it("should format valid number to Rupiah format", () => {
      // Rupiah formatter uses non-breaking space (or normal space) depending on Jest Intl version.
      // We check for number presence and currency symbol.
      const formatted = formatCurrency(50000);
      expect(formatted).toContain("Rp");
      expect(formatted).toContain("50.000");
    });

    it("should return hyphen if value is null, undefined, or NaN", () => {
      expect(formatCurrency(null)).toBe("-");
      expect(formatCurrency(undefined)).toBe("-");
      expect(formatCurrency(NaN)).toBe("-");
    });
  });

  describe("formatDate", () => {
    it("should format string date correctly", () => {
      const formatted = formatDate("2026-07-11");
      expect(formatted).toContain("11");
      // Short month for July is Jul
      expect(formatted).toContain("Jul");
      expect(formatted).toContain("2026");
    });

    it("should return hyphen for invalid input", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate("invalid-date")).toBe("-");
    });
  });

  describe("formatLongDate", () => {
    it("should format date into long Indonesian month format", () => {
      const formatted = formatLongDate("2026-07-11");
      expect(formatted).toContain("Juli");
      expect(formatted).toContain("2026");
    });
  });

  describe("formatDateTime", () => {
    it("should render correct time component alongside date", () => {
      const formatted = formatDateTime("2026-07-11T10:15:00.000Z");
      expect(formatted).toContain("11");
      expect(formatted).toContain("Jul");
      expect(formatted).toContain("2026");
    });
  });
});
