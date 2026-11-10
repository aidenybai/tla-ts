import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Badge = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    data-slot="badge"
    className={cn(
      "inline-flex h-[19px] shrink-0 items-center rounded-sm bg-well px-[5px] text-[12px]/none font-medium whitespace-nowrap text-muted",
      className,
    )}
    {...props}
  />
);
