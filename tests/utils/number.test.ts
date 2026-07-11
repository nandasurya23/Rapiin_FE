import { formatIndonesianNumber, parseIndonesianNumber, normalizeIndonesianNumberInput } from "@/lib/number";

describe("Number Utilities", () => {
  describe("formatIndonesianNumber", () => {
    it("should format numbers with dot separators", () => {
      expect(formatIndonesianNumber(1250000)).toBe("1.250.000");
    });

    it("should return empty string for null, undefined, or NaN", () => {
      expect(formatIndonesianNumber(null)).toBe("");
      expect(formatIndonesianNumber(undefined)).toBe("");
      expect(formatIndonesianNumber(NaN)).toBe("");
    });
  });

  describe("parseIndonesianNumber", () => {
    it("should strip out all non-digits and parse the number", () => {
      expect(parseIndonesianNumber("1.250.000")).toBe(1250000);
      expect(parseIndonesianNumber("Rp 50.000,00")).toBe(5000000); // stripping non-digits leaves 5000000
    });

    it("should return undefined if string has no digits", () => {
      expect(parseIndonesianNumber("abc")).toBeUndefined();
      expect(parseIndonesianNumber("")).toBeUndefined();
    });
  });

  describe("normalizeIndonesianNumberInput", () => {
    it("should retain only digit characters", () => {
      expect(normalizeIndonesianNumberInput("Rp. 1.250.000")).toBe("1250000");
    });
  });
});
