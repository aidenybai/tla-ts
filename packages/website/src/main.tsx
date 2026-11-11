import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ROUTE_BASE } from "./lib/route";

// Each page imports its own stylesheet, since the editor has its own theme.
const isEditor = new RegExp(`^${ROUTE_BASE}(/|$)`).test(location.pathname);
const Page = isEditor ? (await import("./editor")).Editor : (await import("./app")).App;

await document.fonts.load('400 16px "Geist Mono Variable"');

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
}
