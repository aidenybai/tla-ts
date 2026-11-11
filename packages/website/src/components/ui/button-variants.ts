import { cva } from "class-variance-authority";
import { cn } from "cn";

export const LINK_CLASS_NAME =
  "text-foreground underline decoration-input decoration-dotted decoration-[1.5px] underline-offset-[3px] hover:decoration-faint";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent text-sm whitespace-nowrap outline-none transition-[scale,background-color,color] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        outline:
          "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground enabled:active:scale-[0.97]",
        link: cn(LINK_CLASS_NAME, "inline rounded-none aria-pressed:no-underline"),
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
