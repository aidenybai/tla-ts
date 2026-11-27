import type { ReactNode } from "react";
import { cn } from "cn";

interface KeyCapProps {
  // Whether the key is held down.
  isLit?: boolean;
  children: ReactNode;
}

export const KeyCap = (props: KeyCapProps) => (
  <kbd
    className={cn(
      "mx-0.5 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md px-1 align-[-0.15em] font-sans text-xs transition-colors duration-150 ease-out",
      props.isLit
        ? "bg-foreground text-background"
        : "bg-card text-foreground shadow-[inset_0_0_0_1px_var(--input),0_1px_0_var(--input)]",
    )}
  >
    {props.children}
  </kbd>
);
