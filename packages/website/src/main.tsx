import { registerCustomLanguage } from "@pierre/diffs";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./index.css";
import { TLA_GRAMMAR, TLC_CONFIG_GRAMMAR } from "./lib/tla-grammars";

registerCustomLanguage("tlaplus", async () => ({ default: [TLA_GRAMMAR] }), ["tla"]);
registerCustomLanguage("tlaplus-config", async () => ({ default: [TLC_CONFIG_GRAMMAR] }), ["cfg"]);

await Promise.all([
  document.fonts.load('400 13px "Geist Mono Variable"'),
  document.fonts.load('400 13px "Inter Variable"'),
]);

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
