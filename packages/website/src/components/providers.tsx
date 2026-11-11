import { domMax, LazyMotion, MotionConfig } from "motion/react";
import { StrictMode, type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = (props: ProvidersProps) => (
  <StrictMode>
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{props.children}</MotionConfig>
    </LazyMotion>
  </StrictMode>
);
