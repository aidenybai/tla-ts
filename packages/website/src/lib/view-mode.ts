export type ViewMode = "code" | "json";

export const VIEW_MODES: ViewMode[] = ["code", "json"];

export const isViewMode = (value: unknown): value is ViewMode =>
  VIEW_MODES.some((mode) => mode === value);
