import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

export const Tooltip = (props: TooltipPrimitive.Root.Props) => (
  <TooltipPrimitive.Root data-slot="tooltip" {...props} />
);

export const TooltipTrigger = (props: TooltipPrimitive.Trigger.Props) => (
  <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
);

interface ContentProps extends Omit<TooltipPrimitive.Popup.Props, "className"> {
  className?: string;
}

export const TooltipContent = (props: ContentProps) => {
  const { className, ...popupProps } = props;
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner sideOffset={6} className="isolate z-50">
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          {...popupProps}
          className={cn(
            "origin-(--transform-origin) rounded-md bg-foreground px-2 py-1 text-xs text-background transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
};
