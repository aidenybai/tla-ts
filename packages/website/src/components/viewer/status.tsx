import type { ReactNode } from "react";
import { ArcKey } from "./arc-key";
import { Chip } from "./chip";
import { useFocusedNode } from "@/store/viewer";
import { useViewer } from "./context";
import { ThemeToggle } from "./theme-toggle";

const Root = ({ children }: { children: ReactNode }) => (
  <div className="flex h-9 items-center gap-4 border-t pr-1.5 pl-3 whitespace-nowrap text-muted-foreground tabular-nums">
    {children}
  </div>
);

const Hover = () => {
  const hoveredNode = useFocusedNode();
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
      {hoveredNode && (
        <>
          <span className="hidden shrink-0 sm:inline">
            Line {hoveredNode.loc.start.line}, Offset {hoveredNode.loc.start.column}
          </span>
          <Chip nodeIds={[hoveredNode.id]} canDim={false}>
            {hoveredNode.name}
          </Chip>
          <span className="truncate">{hoveredNode.label}</span>
        </>
      )}
    </div>
  );
};

const Key = () => {
  const { mode } = useViewer();
  return mode === "code" ? <ArcKey /> : null;
};

const Controls = () => (
  <div className="flex shrink-0 items-center gap-0.5">
    <ThemeToggle />
  </div>
);

export const Status = Object.assign(Root, { Hover, Key, Controls });
