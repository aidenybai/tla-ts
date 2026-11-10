import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Menu = (props: MenuPrimitive.Root.Props) => (
  <MenuPrimitive.Root data-slot="menu" {...props} />
);

export const MenuTrigger = (props: MenuPrimitive.Trigger.Props) => (
  <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />
);

type MenuContentProps = MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "side" | "sideOffset">;

export const MenuContent = ({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  ...props
}: MenuContentProps) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Positioner
      align={align}
      side={side}
      sideOffset={sideOffset}
      className="isolate z-50 outline-none"
    >
      <MenuPrimitive.Popup
        data-slot="menu-content"
        className={cn(
          "grid max-h-(--available-height) min-w-48 origin-(--transform-origin) overflow-y-auto rounded-lg bg-ground p-1 text-ink shadow-card outline-none transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Positioner>
  </MenuPrimitive.Portal>
);

export const MenuRadioGroup = (props: MenuPrimitive.RadioGroup.Props) => (
  <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />
);

export const MenuRadioItem = ({ className, children, ...props }: MenuPrimitive.RadioItem.Props) => (
  <MenuPrimitive.RadioItem
    data-slot="menu-radio-item"
    className={cn(
      "flex cursor-default items-center gap-2 rounded-md px-2 py-1 outline-none select-none data-highlighted:bg-well",
      className,
    )}
    {...props}
  >
    <span className="flex-1">{children}</span>
    <MenuPrimitive.RadioItemIndicator className="flex">
      <Check className="size-3.5" />
    </MenuPrimitive.RadioItemIndicator>
  </MenuPrimitive.RadioItem>
);
