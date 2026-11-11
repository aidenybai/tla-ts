import type { ReactNode } from "react";

interface PartProps {
  children: ReactNode;
}

interface LinkProps extends PartProps {
  href: string;
}

export const HeroRoot = (props: PartProps) => (
  <header className="flex flex-col gap-3">{props.children}</header>
);

export const HeroHeader = (props: PartProps) => (
  <div className="flex items-center justify-between">{props.children}</div>
);

export const HeroTitle = (props: PartProps) => (
  <h1 className="text-2xl font-semibold text-gray-1200">{props.children}</h1>
);

export const HeroBody = (props: PartProps) => (
  <div className="flex flex-col gap-4 text-pretty">{props.children}</div>
);

export const HeroLink = (props: LinkProps) => (
  <a
    href={props.href}
    className="text-gray-1200 underline decoration-gray-700 underline-offset-[3px] hover:decoration-gray-1200"
  >
    {props.children}
  </a>
);
