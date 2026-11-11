import { Check } from "@phosphor-icons/react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";

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
            "max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-raised outline-none transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
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
    className={cn(
      "relative flex cursor-default items-center rounded-md py-1 pr-8 pl-2 text-sm text-muted-foreground outline-none select-none data-checked:text-foreground data-highlighted:bg-muted data-highlighted:text-foreground",
      props.className,
    )}
  >
    {props.children}
    <Menu.RadioItemIndicator className="absolute right-2 flex">
      <Check weight="bold" className="size-3.5" />
    </Menu.RadioItemIndicator>
  </Menu.RadioItem>
);
