import type { ComponentType } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import Layout from "@/app/layout";
import { startJsTlaWorker } from "@/lib/js-tla-worker";
import { getPageFile } from "./router";
import "./app/globals.css";

// Each page is a chunk of its own, so a route loads only its page.
const pages = import.meta.glob<ComponentType>("./app/**/page.tsx", { import: "default" });
const route = location.pathname.replace(/(?:\.html|\/)$/, "") || "/";
// The playground's checker loads JS.tla as the page loads, before the page's chunk and its fonts.
if (route === "/playground") startJsTlaWorker();
const [Page] = await Promise.all([
  (pages[getPageFile(route)] ?? pages[getPageFile("/")])(),
  document.fonts.load('400 16px "Geist Mono Variable"'),
]);

const root = document.getElementById("root");
const page = (
  <Layout>
    <Page />
  </Layout>
);
if (root?.hasChildNodes()) hydrateRoot(root, page);
else if (root) createRoot(root).render(page);
