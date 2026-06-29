type ClassValue = string | false | null | undefined | ClassValue[];

export function cn(...values: ClassValue[]): string {
  return values.flat(Infinity as 0).filter(Boolean).join(" ");
}
