import type { ReactNode } from "react";
import { useCopy } from "../use-copy";
import { CopyIcon } from "./copy-icon";
import { Logo } from "./logo";
import { Button } from "./ui/button";

interface PartProps {
  children: ReactNode;
}

export const HeroRoot = (props: PartProps) => (
  <header className="flex flex-col gap-4">{props.children}</header>
);

export const HeroTitle = (props: PartProps) => (
  <h1 className="flex items-center gap-2 text-2xl font-medium text-foreground">
    <Logo />
    {props.children}
  </h1>
);

export const HeroBody = (props: PartProps) => (
  <div className="flex flex-col gap-3 text-pretty">{props.children}</div>
);

interface CopyProps {
  text: string;
  children: ReactNode;
}

export const HeroCopy = (props: CopyProps) => {
  const copy = useCopy(props.text);
  return (
    <Button variant="primary" onClick={copy.copy}>
      <CopyIcon isCopied={copy.isCopied} />
      <span aria-live="polite">{copy.isCopied ? "Copied" : props.children}</span>
    </Button>
  );
};
