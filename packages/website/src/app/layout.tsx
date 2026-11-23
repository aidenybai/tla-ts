import { LazyMotion, MotionConfig } from "motion/react";
import { StrictMode, type ReactNode } from "react";

// Every animation here follows a click or a hover, so the engine loads after the page.
const loadMotionFeatures = () => import("@/lib/motion-features").then((loaded) => loaded.domMax);

interface LayoutProps {
  children: ReactNode;
}

const Layout = (props: LayoutProps) => (
  <StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">{props.children}</MotionConfig>
    </LazyMotion>
  </StrictMode>
);

export default Layout;
