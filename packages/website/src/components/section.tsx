import type { ReactNode } from "react";

interface PartProps {
  children: ReactNode;
}

export const SectionRoot = (props: PartProps) => (
  <section className="flex flex-col gap-3">{props.children}</section>
);

export const SectionTitle = (props: PartProps) => (
  <h2 className="font-semibold text-gray-1200">{props.children}</h2>
);
