import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "cn";
import { buttonVariants } from "./button-variants";

interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {}

export const Button = (props: ButtonProps) => {
  const { variant, size, className, ...buttonProps } = props;
  return (
    <button
      type="button"
      data-slot="button"
      {...buttonProps}
      className={cn(buttonVariants({ variant, size }), className)}
    />
  );
};
