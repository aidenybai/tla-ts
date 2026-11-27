import type { ReactNode } from "react";
import { Logo } from "./logo";

interface PartProps {
  children: ReactNode;
}

const HeroRoot = (props: PartProps) => (
  <header className="flex flex-col gap-6">{props.children}</header>
);

const HeroTitle = (props: PartProps) => (
  <h1 className="group/logo flex items-center gap-4 font-pixel text-[44px]/[1] text-primary uppercase">
    <Logo className="size-9" />
    {props.children}
  </h1>
);

const HeroBody = (props: PartProps) => (
  <div className="flex flex-col gap-3 text-pretty">{props.children}</div>
);

export const Hero = {
  Root: HeroRoot,
  Title: HeroTitle,
  Body: HeroBody,
};
