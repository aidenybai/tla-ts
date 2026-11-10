import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "bg-ink text-ground hover:bg-ink/90",
  ghost:
    "text-muted hover:bg-well hover:text-ink active:bg-well-2 data-pressed:bg-well data-pressed:text-ink",
};

const SIZES = {
  default: "px-2",
  icon: "w-7 px-0",
};

export interface ButtonVariants {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export const getButtonClassName = ({ variant = "ghost", size = "default" }: ButtonVariants) =>
  cn(
    "inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors duration-150 outline-none enabled:active:scale-100 focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
  );

type ButtonProps = ComponentProps<"button"> & ButtonVariants;

export const Button = ({ className, variant, size, type = "button", ...props }: ButtonProps) => (
  <button
    data-slot="button"
    type={type}
    className={cn(getButtonClassName({ variant, size }), className)}
    {...props}
  />
);
