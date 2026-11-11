import { cva } from "class-variance-authority";
import { cn } from "cn";

export const LINK_CLASS_NAME =
  "text-foreground underline decoration-input decoration-dotted decoration-[1.5px] underline-offset-[3px] hover:decoration-faint";

const RAISED_CLASS_NAME =
  "border bg-linear-to-b text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_1px_2px_rgb(0_0_0/0.12)] text-shadow-[0_1px_0_rgb(0_0_0/0.15)] hover:brightness-105 enabled:active:scale-[0.97] enabled:active:shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] enabled:active:brightness-95 disabled:opacity-60";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent text-sm whitespace-nowrap outline-none transition-[scale,background-color,color] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        outline:
          "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground enabled:active:scale-[0.97]",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-60",
        success: cn(
          RAISED_CLASS_NAME,
          "border-[oklch(48%_0.11_152)] from-[oklch(66%_0.13_152)] to-[oklch(57%_0.13_152)] dark:border-[oklch(40%_0.1_152)] dark:from-[oklch(58%_0.13_152)] dark:to-[oklch(49%_0.12_152)]",
        ),
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
