import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./index.css";

await document.fonts.load('400 16px "Geist Mono Variable"');

const Page =
  location.pathname.replace(/\/$/, "") === "/editor" ? (await import("./editor")).Editor : App;

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
}
