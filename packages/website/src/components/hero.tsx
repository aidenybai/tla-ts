import type { ReactNode } from "react";
import { Logo } from "./logo";

interface PartProps {
  children: ReactNode;
}

const HeroRoot = (props: PartProps) => (
  <header className="flex flex-col gap-4">{props.children}</header>
);

const HeroTitle = (props: PartProps) => (
  <h1 className="group/logo flex items-center gap-2 text-2xl font-medium tracking-[-0.02em] text-foreground">
    <span className="flex motion-safe:animate-logo-arrive">
      <Logo />
    </span>
    <span className="motion-safe:animate-title-shove">{props.children}</span>
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
