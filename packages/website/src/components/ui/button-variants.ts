import { cva } from "class-variance-authority";
import { cn } from "cn";

export const LINK_CLASS_NAME =
  "text-foreground underline decoration-input decoration-1 underline-offset-[3px] hover:text-primary hover:decoration-primary";

const RAISED_CLASS_NAME =
  "border-primary bg-primary text-primary-foreground hover:bg-primary/90 not-disabled:active:scale-[0.97] disabled:opacity-60";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer select-none aria-disabled:pointer-events-none pointer-coarse:after:absolute pointer-coarse:after:-inset-1 items-center justify-center gap-1.5 rounded-lg border border-transparent font-pixel text-[11px] uppercase whitespace-nowrap outline-none transition-[scale,background-color,color] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        outline:
          "border-input bg-transparent text-foreground hover:border-foreground hover:bg-accent not-disabled:active:scale-[0.97]",
        primary:
          "bg-foreground text-background hover:bg-foreground/85 not-disabled:active:scale-[0.97] disabled:opacity-60",
        success: RAISED_CLASS_NAME,
        link: cn(
          LINK_CLASS_NAME,
          "inline rounded-xs font-sans normal-case aria-pressed:no-underline aria-pressed:hover:text-foreground",
        ),
      },
      size: {
        default: "h-8 px-2.5",
        icon: "size-8",
        inline: "h-auto p-0 text-[length:inherit]",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  },
);
