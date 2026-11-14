import { Check } from "@phosphor-icons/react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";

const ITEM_CLASS_NAME =
  "relative flex cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-2 text-sm text-muted-foreground outline-none select-none data-highlighted:bg-foreground/8 data-highlighted:text-foreground pointer-coarse:py-2";

export const DropdownMenu = (props: Menu.Root.Props) => (
  <Menu.Root data-slot="dropdown-menu" {...props} />
);

interface TriggerProps extends Omit<Menu.Trigger.Props, "className"> {
  className?: string;
}

export const DropdownMenuTrigger = (props: TriggerProps) => (
  <Menu.Trigger data-slot="dropdown-menu-trigger" {...props} />
);

interface ContentProps extends Omit<Menu.Popup.Props, "className"> {
  align?: Menu.Positioner.Props["align"];
  className?: string;
}

export const DropdownMenuContent = (props: ContentProps) => {
  const { align, className, ...popupProps } = props;
  return (
    <Menu.Portal>
      <Menu.Positioner
        align={align ?? "start"}
        sideOffset={4}
        className="isolate z-50 outline-none"
      >
        <Menu.Popup
          data-slot="dropdown-menu-content"
          {...popupProps}
          className={cn(
            "max-h-[min(var(--available-height),20rem)] min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-raised outline-none transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
};

export const DropdownMenuRadioGroup = (props: Menu.RadioGroup.Props) => (
  <Menu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
);

interface RadioItemProps extends Omit<Menu.RadioItem.Props, "className"> {
  className?: string;
}

export const DropdownMenuRadioItem = (props: RadioItemProps) => (
  <Menu.RadioItem
    data-slot="dropdown-menu-radio-item"
    closeOnClick
    {...props}
    className={cn(ITEM_CLASS_NAME, "data-checked:text-foreground", props.className)}
  >
    {props.children}
    <Menu.RadioItemIndicator className="absolute right-2 flex">
      <Check weight="bold" className="size-3.5" />
    </Menu.RadioItemIndicator>
  </Menu.RadioItem>
);

interface ItemProps extends Omit<Menu.Item.Props, "className"> {
  className?: string;
}

export const DropdownMenuItem = (props: ItemProps) => (
  <Menu.Item
    data-slot="dropdown-menu-item"
    {...props}
    className={cn(ITEM_CLASS_NAME, props.className)}
  />
);

export const DropdownMenuGroup = (props: Menu.Group.Props) => (
  <Menu.Group data-slot="dropdown-menu-group" {...props} />
);

export const DropdownMenuLabel = (props: Menu.GroupLabel.Props) => (
  <Menu.GroupLabel
    data-slot="dropdown-menu-label"
    {...props}
    className="px-2 py-1 text-xs text-faint"
  />
);

interface SeparatorProps {
  className?: string;
}

export const DropdownMenuSeparator = (props: SeparatorProps) => (
  <Menu.Separator
    data-slot="dropdown-menu-separator"
    className={cn("-mx-1 my-1 h-px bg-border", props.className)}
  />
);
