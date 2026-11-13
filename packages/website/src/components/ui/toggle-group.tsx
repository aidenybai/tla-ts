import { m } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";

interface ToggleGroupState {
  value: string;
  isDisabled: boolean;
  indicatorId: string;
  onValueChange: (value: string) => void;
}

const toggleGroupContext = createPartsContext<ToggleGroupState>("ToggleGroup");

interface ToggleGroupProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  isDisabled?: boolean;
  className?: string;
  children: ReactNode;
}

export const ToggleGroup = (props: ToggleGroupProps) => {
  const indicatorId = useId();
  return (
    <toggleGroupContext.PartsContext
      value={{
        value: props.value,
        isDisabled: props.isDisabled ?? false,
        indicatorId,
        onValueChange: props.onValueChange,
      }}
    >
      <div
        role="group"
        aria-label={props.label}
        data-slot="toggle-group"
        className={cn("flex w-fit shrink-0 items-center bg-muted p-0.5", props.className)}
      >
        {props.children}
      </div>
    </toggleGroupContext.PartsContext>
  );
};

interface ToggleGroupItemProps {
  value: string;
  label?: string;
  className?: string;
  children: ReactNode;
}

export const ToggleGroupItem = (props: ToggleGroupItemProps) => {
  const group = toggleGroupContext.useParts();
  return (
    <button
      type="button"
      data-slot="toggle-group-item"
      aria-pressed={group.value === props.value}
      aria-label={props.label}
      title={props.label}
      disabled={group.isDisabled}
      onClick={() => group.onValueChange(props.value)}
      className={cn(
        "relative flex cursor-pointer items-center justify-center text-faint outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default aria-pressed:text-foreground",
        props.className,
      )}
    >
      {group.value === props.value && (
        <m.span
          layoutId={group.indicatorId}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className="absolute inset-0 rounded-[inherit] bg-raised shadow-raised"
        />
      )}
      <span className="relative z-10 flex">{props.children}</span>
    </button>
  );
};
