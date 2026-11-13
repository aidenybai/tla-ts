import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "cn";
import type { Mark, Token } from "../site-data";
import type { LineNote } from "../run-worker";

const WORDS = /\s+|[A-Za-z_]\w*|\d+|[^\sA-Za-z_\d]+/g;

interface Word {
  text: string;
  style: Record<string, string>;
  column: number;
}

const getWords = (tokens: Token[]) =>
  tokens
    .flatMap((token) =>
      (token.content.match(WORDS) ?? []).map((text) => ({ text, style: token.style })),
    )
    .reduce<Word[]>((words, word) => {
      const last = words.at(-1);
      words.push({ ...word, column: last ? last.column + last.text.length : 0 });
      return words;
    }, []);

interface LineNumberProps {
  number: number;
}

export const LineNumber = (props: LineNumberProps) => (
  <span aria-hidden className="block w-[3ch] shrink-0 text-right text-faint select-none">
    {props.number}
  </span>
);

interface CodeLineProps {
  tokens: Token[];
  number?: number;
  note?: LineNote;
  aside?: ReactNode;
  isActive?: boolean;
  isDimmed?: boolean;
  isWrapped?: boolean;
  offset?: number;
  marks?: Mark[];
  hoveredName?: string;
  colors?: Record<string, string>;
  className?: string;
}

export const CodeLine = (props: CodeLineProps) => (
  <span
    className={cn(
      "flex min-h-[1.7em] gap-x-4 max-sm:flex-wrap transition-[background-color,box-shadow] duration-200 ease-out",
      props.isActive && "bg-muted shadow-[inset_2px_0_0_var(--foreground)]",
      props.note?.tone === "danger" &&
        "bg-destructive/10 shadow-[inset_2px_0_0_var(--destructive)]",
      props.className,
    )}
  >
    {props.number !== undefined && <LineNumber number={props.number} />}
    <span
      className={cn(
        "min-w-0 flex-1 transition-opacity duration-150 ease",
        props.isDimmed && "opacity-40",
        props.isWrapped === false ? "whitespace-pre" : "break-words whitespace-pre-wrap",
      )}
    >
      {getWords(props.tokens).map((word) => {
        if (/^\s/.test(word.text)) return word.text;
        const start = (props.offset ?? 0) + word.column;
        const marks = (props.marks ?? []).filter((mark) => mark.start <= start && start < mark.end);
        const color = props.hoveredName && props.colors?.[props.hoveredName];
        const tint =
          color && marks.some((mark) => mark.name === props.hoveredName)
            ? `color-mix(in srgb, ${color} ${marks[0].name === props.hoveredName ? 28 : 12}%, transparent)`
            : undefined;
        return (
          <span
            key={`${word.column}:${word.text}`}
            data-token
            data-region={marks.at(0)?.name}
            data-linked={tint && marks[0].name === props.hoveredName ? "" : undefined}
            style={{
              ...word.style,
              backgroundColor: tint,
              boxShadow: tint && `2px 0 0 ${tint}, -2px 0 0 ${tint}`,
            }}
            className="inline-block rounded-xs leading-[1.35] text-(--token-light) dark:text-(--token-dark)"
          >
            {word.text}
          </span>
        );
      })}
    </span>
    {props.aside}
    {props.note && (
      <span
        className={cn(
          "flex max-w-1/2 shrink-0 items-center gap-1 self-start transition-opacity duration-200 ease-out starting:opacity-0",
          props.note.tone === "danger" ? "text-destructive" : "text-faint",
        )}
      >
        {props.note.tone === "danger" && <X weight="bold" className="shrink-0" />}
        <span className="truncate">{props.note.text}</span>
      </span>
    )}
  </span>
);
