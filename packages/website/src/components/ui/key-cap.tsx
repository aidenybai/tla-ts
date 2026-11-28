import type { ReactNode } from "react";
import { cn } from "cn";

interface KeyCapProps {
  className?: string;
  children: ReactNode;
}

export const KeyCap = (props: KeyCapProps) => (
  <kbd
    className={cn(
      "inline-flex size-7 items-center justify-center rounded-md bg-card font-sans text-sm text-foreground shadow-[inset_0_0_0_1px_var(--input),0_1px_0_var(--input)]",
      props.className,
    )}
  >
    {props.children}
  </kbd>
);
