import { createRoot } from "react-dom/client";
import { Providers } from "./components/providers";
import { PlaygroundPage } from "./playground-page";
import "./index.css";

await document.fonts.load('400 16px "Geist Mono Variable"');

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <Providers>
      <PlaygroundPage />
    </Providers>,
  );
}
