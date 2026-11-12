import { createRoot, hydrateRoot } from "react-dom/client";
import { Providers } from "./components/providers";
import { PlaygroundPage } from "./playground-page";
import "./index.css";

await document.fonts.load('400 16px "Geist Mono Variable"');

const root = document.getElementById("root");
const page = (
  <Providers>
    <PlaygroundPage />
  </Providers>
);
if (root?.hasChildNodes()) hydrateRoot(root, page);
else if (root) createRoot(root).render(page);
