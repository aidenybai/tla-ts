import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export const Tabs = ({ className, ...props }: TabsPrimitive.Root.Props) => (
  <TabsPrimitive.Root data-slot="tabs" className={cn("flex", className)} {...props} />
);

export const TabsList = ({ className, ...props }: TabsPrimitive.List.Props) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    className={cn("inline-flex h-7 items-center gap-0.5 rounded-md bg-well p-0.5", className)}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }: TabsPrimitive.Panel.Props) => (
  <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={cn("min-h-0 outline-none", className)}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: TabsPrimitive.Tab.Props) => (
  <TabsPrimitive.Tab
    data-slot="tabs-trigger"
    className={cn(
      "inline-flex h-6 items-center rounded-[5px] px-2 text-muted transition-colors duration-150 outline-none enabled:active:scale-100 hover:text-ink focus-visible:shadow-focus data-active:bg-ground data-active:text-ink data-active:shadow-card",
      className,
    )}
    {...props}
  />
);
