import { domMax, LazyMotion, MotionConfig } from "motion/react";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./index.css";

const PlaygroundPage = lazy(async () => ({
  default: (await import("./playground-page")).PlaygroundPage,
}));

await document.fonts.load('400 16px "Geist Mono Variable"');

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LazyMotion features={domMax} strict>
        <MotionConfig reducedMotion="user">
          <Suspense>
            {location.pathname.replace(/\/$/, "") === "/playground" ? <PlaygroundPage /> : <App />}
          </Suspense>
        </MotionConfig>
      </LazyMotion>
    </StrictMode>,
  );
}
