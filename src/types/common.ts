export type ID = string;

export type Maybe<T> = T | null | undefined;

export type StatusTone = "info" | "warning" | "success" | "danger" | "neutral";

export type Timestamped = {
  createdAt: string;
  updatedAt: string;
};
