import { domMax, LazyMotion, MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./index.css";

await document.fonts.load('400 16px "Geist Mono Variable"');

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LazyMotion features={domMax} strict>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </LazyMotion>
    </StrictMode>,
  );
}
