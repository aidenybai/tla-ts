import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

interface PartProps {
  children: ReactNode;
}

export const HeroRoot = (props: PartProps) => (
  <header className="flex flex-col gap-4">{props.children}</header>
);

export const HeroTitle = (props: PartProps) => (
  <h1 className="group/logo flex items-center gap-2 text-2xl font-medium text-foreground">
    <Logo />
    {props.children}
  </h1>
);

export const HeroBody = (props: PartProps) => (
  <div className="flex flex-col gap-3 text-pretty">{props.children}</div>
);

export const Hero = {
  Root: HeroRoot,
  Title: HeroTitle,
  Body: HeroBody,
};
