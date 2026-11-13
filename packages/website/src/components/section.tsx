import type { ReactNode } from "react";

interface PartProps {
  children: ReactNode;
}

export const SectionRoot = (props: PartProps) => (
  <section className="flex flex-col gap-4">{props.children}</section>
);

export const SectionTitle = (props: PartProps) => (
  <h2 className="scroll-m-4 font-medium text-foreground">{props.children}</h2>
);
