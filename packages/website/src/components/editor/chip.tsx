import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getRegionStyle } from "./linked-lines";
import { useActiveName, useHighlight, useViewer } from "./viewer-context";

interface ChipProps {
  name: string;
  className?: string;
  children: ReactNode;
}

export const Chip = ({ name, className, children }: ChipProps) => {
  const color = useViewer().colors.get(name);
  const highlight = useHighlight();
  const isActive = useActiveName() === name;
  return (
    <button
      type="button"
      data-chip
      data-name={name}
      data-active={isActive || undefined}
      className={cn(
        "region rounded-sm px-[5px] py-px text-left font-mono wrap-anywhere text-ink enabled:active:scale-100",
        className,
      )}
      style={getRegionStyle(color)}
      onMouseEnter={() => highlight.setHovered(name)}
      onMouseLeave={() => highlight.setHovered(undefined)}
      onFocus={() => highlight.setHovered(name)}
      onBlur={() => highlight.setHovered(undefined)}
      onClick={() => highlight.select({ name, origin: "outline" })}
    >
      {children}
    </button>
  );
};
