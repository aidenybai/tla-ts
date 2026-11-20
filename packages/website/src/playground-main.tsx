import { createRoot, hydrateRoot } from "react-dom/client";
import { Providers } from "./components/providers";
import { startEscoreWorker } from "./escore-worker";
import { PlaygroundPage } from "./playground-page";
import "./index.css";

// The checker loads ESCore as the page loads, before the page waits for its fonts and renders.
startEscoreWorker();

await document.fonts.load('400 16px "Geist Mono Variable"');

const root = document.getElementById("root");
const page = (
  <Providers>
    <PlaygroundPage />
  </Providers>
);
if (root?.hasChildNodes()) hydrateRoot(root, page);
else if (root) createRoot(root).render(page);
