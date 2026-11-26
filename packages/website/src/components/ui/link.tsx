import type { ReactNode } from "react";
import { cn } from "cn";
import { LINK_CLASS_NAME } from "./button-variants";

interface LinkProps {
  href: string;
  children: ReactNode;
}

export const Link = (props: LinkProps) => (
  <a href={props.href} className={cn(LINK_CLASS_NAME, "pointer-coarse:py-1.5")}>
    {props.children}
  </a>
);
