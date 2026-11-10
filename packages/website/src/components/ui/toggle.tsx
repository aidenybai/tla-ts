import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cn } from "@/lib/utils";
import { type ButtonVariants, getButtonClassName } from "./button";

type ToggleProps = TogglePrimitive.Props & ButtonVariants;

export const Toggle = ({ className, variant, size, ...props }: ToggleProps) => (
  <TogglePrimitive
    data-slot="toggle"
    className={cn(getButtonClassName({ variant, size }), className)}
    {...props}
  />
);
