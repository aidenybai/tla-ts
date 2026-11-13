import type { ReactNode } from "react";
import { LINK_CLASS_NAME } from "./button-variants";

interface LinkProps {
  href: string;
  children: ReactNode;
}

export const Link = (props: LinkProps) => (
  <a href={props.href} className={LINK_CLASS_NAME}>
    {props.children}
  </a>
);
