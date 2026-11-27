import type { ReactNode } from "react";

interface InlineCodeProps {
  children: ReactNode;
}

export const InlineCode = (props: InlineCodeProps) => (
  <code className="rounded-sm border bg-card px-1 py-0.5 text-[13px] whitespace-nowrap text-foreground">
    {props.children}
  </code>
);
