import { cn } from "cn";
import { Group, Panel, Separator, type GroupProps, type PanelProps } from "react-resizable-panels";

interface ResizablePanelGroupProps extends Omit<GroupProps, "className"> {
  className?: string;
}

export const ResizablePanelGroup = (props: ResizablePanelGroupProps) => (
  <Group
    data-slot="resizable-panel-group"
    {...props}
    className={cn("flex size-full aria-[orientation=vertical]:flex-col", props.className)}
  />
);

export const ResizablePanel = (props: PanelProps) => (
  <Panel data-slot="resizable-panel" {...props} />
);

export const ResizableHandle = () => (
  <Separator
    data-slot="resizable-handle"
    className="relative flex w-px items-center justify-center bg-border outline-none transition-colors duration-150 ease-out after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 pointer-coarse:after:w-6 pointer-coarse:aria-[orientation=horizontal]:after:h-6 hover:bg-input focus-visible:bg-ring focus-visible:ring-2 focus-visible:ring-ring/50 data-[separator=active]:bg-ring aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:inset-y-auto aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-2 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2"
  />
);
