import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app";
import { Providers } from "./components/providers";
import "./index.css";

await document.fonts.load('400 16px "Geist Mono Variable"');

const root = document.getElementById("root");
const app = (
  <Providers>
    <App />
  </Providers>
);
if (root?.hasChildNodes()) hydrateRoot(root, app);
else if (root) createRoot(root).render(app);
