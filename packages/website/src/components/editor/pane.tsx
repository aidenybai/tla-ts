import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const Root = ({ className, ...props }: ComponentProps<"section">) => (
  <section data-slot="pane" className={cn("flex min-h-0 min-w-0 flex-col", className)} {...props} />
);

const Header = ({ className, ...props }: ComponentProps<"header">) => (
  <header
    data-slot="pane-header"
    className={cn(
      "flex h-8 shrink-0 items-center gap-2 border-b border-rule px-3 font-mono text-muted",
      className,
    )}
    {...props}
  />
);

const Body = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="pane-body"
    className={cn("min-h-0 flex-1 overflow-auto overscroll-none", className)}
    {...props}
  />
);

export const Pane = Object.assign(Root, { Header, Body });
