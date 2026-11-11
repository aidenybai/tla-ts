import { isViewMode, type ViewMode } from "./view-mode";

export const ROUTE_BASE = "/editor";

interface Route {
  name: string | null;
  mode: ViewMode;
}

export const getSlug = (pathname: string): string[] =>
  pathname
    .slice(ROUTE_BASE.length)
    .split("/")
    .filter((segment) => segment !== "");

export const parseRoute = (slug: string[] | undefined, names: Set<string>): Route | null => {
  const [name, mode, ...rest] = slug ?? [];
  if (rest.length > 0) return null;
  if (name === undefined) return { name: null, mode: "code" };
  if (!names.has(name)) return null;
  if (mode === undefined) return { name, mode: "code" };
  return isViewMode(mode) && mode !== "code" ? { name, mode } : null;
};

export const getRouteHref = (name: string, mode: ViewMode = "code"): string =>
  mode === "code" ? `${ROUTE_BASE}/${name}` : `${ROUTE_BASE}/${name}/${mode}`;

export const getPathMode = (pathname: string): ViewMode => {
  const last = pathname.split("/").at(-1);
  return isViewMode(last) ? last : "code";
};
