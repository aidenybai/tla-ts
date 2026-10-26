import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export const Button = ({ className, variant, size, type = "button", ...props }: ButtonProps) => (
  <button
    data-slot="button"
    type={type}
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
);
