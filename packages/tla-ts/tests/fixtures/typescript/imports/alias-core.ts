export const hasTag = (value: unknown): boolean =>
  typeof value === "object" && value !== null && "tag" in value;
