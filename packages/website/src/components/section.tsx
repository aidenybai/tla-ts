import { LinkSimple } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "cn";

interface RootProps {
  children: ReactNode;
}

const SectionRoot = (props: RootProps) => (
  <section className="flex flex-col gap-4">{props.children}</section>
);

interface TitleProps {
  className?: string;
  children: string;
}

const SectionTitle = (props: TitleProps) => {
  const id = props.children.toLowerCase().replaceAll(" ", "-");
  return (
    <h2
      id={id}
      className={cn(
        "group relative scroll-mt-8 text-[17px] font-medium tracking-[-0.01em] text-balance text-foreground",
        props.className,
      )}
    >
      <a
        href={`#${id}`}
        aria-label="Link to this section"
        className="absolute top-1/2 -left-7 flex size-7 -translate-y-1/2 items-center text-faint opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 focus-visible:opacity-100 max-sm:hidden"
      >
        <LinkSimple />
      </a>
      {props.children}
    </h2>
  );
};

export const Section = {
  Root: SectionRoot,
  Title: SectionTitle,
};
