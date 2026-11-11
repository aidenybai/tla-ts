export const ROUTE_BASE = "/editor";

// The example that a path such as `/editor/die-hard` names.
export const getRouteName = (pathname: string): string | undefined =>
  pathname
    .slice(ROUTE_BASE.length)
    .split("/")
    .find((segment) => segment !== "");

export const getRouteHref = (name: string): string => `${ROUTE_BASE}/${name}`;
