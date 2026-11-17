import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "cn";
import { Button } from "./ui/button";

interface ResultRootProps {
  isOpen: boolean;
  children: ReactNode;
}

export const ResultRoot = (props: ResultRootProps) => (
  <aside
    aria-label="Result"
    inert={!props.isOpen}
    className={cn(
      "absolute inset-y-0 right-0 z-20 flex w-88 max-w-full flex-col border-l bg-background text-sm transition-[translate,visibility] duration-200 ease-out motion-reduce:transition-none max-sm:w-full max-sm:border-l-0",
      !props.isOpen && "invisible translate-x-full",
    )}
  >
    {props.children}
  </aside>
);

interface ResultHeaderProps {
  onClose: () => void;
}

export const ResultHeader = (props: ResultHeaderProps) => (
  <header className="flex h-11 shrink-0 items-center justify-between border-b pr-1.5 pl-4">
    <h2 className="font-medium text-foreground">Result</h2>
    <Button
      size="icon"
      aria-label="Hide result"
      onClick={props.onClose}
      className="border-transparent"
    >
      <X />
    </Button>
  </header>
);

interface ResultBodyProps {
  children: ReactNode;
}

export const ResultBody = (props: ResultBodyProps) => (
  <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-6 p-4">
    {props.children}
  </div>
);

interface ResultSectionProps {
  title: string;
  count?: number;
  className?: string;
  children: ReactNode;
}

export const ResultSection = (props: ResultSectionProps) => (
  <section className={cn("grid shrink-0 gap-2", props.className)}>
    <header className="flex items-center justify-between gap-3">
      <h3 className="font-medium text-foreground">{props.title}</h3>
      {props.count !== undefined && (
        <span className="text-muted-foreground tabular-nums">{props.count.toLocaleString()}</span>
      )}
    </header>
    {props.children}
  </section>
);
