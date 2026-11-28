import type { ReactNode } from "react";

interface KeyCapProps {
  children: ReactNode;
}

export const KeyCap = (props: KeyCapProps) => (
  <kbd className="inline-flex size-7 items-center justify-center rounded-md bg-card font-sans text-sm text-foreground shadow-[inset_0_0_0_1px_var(--input),0_1px_0_var(--input)]">
    {props.children}
  </kbd>
);
