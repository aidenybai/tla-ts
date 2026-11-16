import { X } from "@phosphor-icons/react";
import { memo, type ReactNode } from "react";
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
  <span aria-hidden className="block min-w-[3ch] shrink-0 text-right text-faint select-none">
    {props.number}
  </span>
);

interface CodeWordsProps {
  tokens: Token[];
  marks?: Mark[];
  hoveredName?: string;
  isHighlighted?: boolean;
  colors?: Record<string, string>;
}

// Memoized so hovering a state, which re-renders every line, does not re-tokenize the code.
const CodeWords = memo((props: CodeWordsProps) => {
  const words = getWords(props.tokens).map((word) => {
    const marks = (props.marks ?? []).filter(
      (mark) => mark.start <= word.column && word.column < mark.end,
    );
    const isHovered = marks.some((mark) => mark.name === props.hoveredName);
    const name = isHovered ? props.hoveredName : props.isHighlighted && marks.at(0)?.name;
    const color = !/^\s/.test(word.text) && name && props.colors?.[name];
    const strength =
      marks.at(0)?.name === props.hoveredName
        ? 28
        : isHovered
          ? 12
          : props.hoveredName === undefined
            ? 16
            : 8;
    return {
      ...word,
      region: marks.at(0)?.name,
      tint: color ? `color-mix(in srgb, ${color} ${strength}%, transparent)` : undefined,
    };
  });
  return words.map((word, index) => {
    if (/^\s/.test(word.text)) return word.text;
    // A tint spills 2px past the word, except toward a tinted neighbor, where two would overlap.
    const edges = [
      words[index + 1]?.tint === undefined && `2px 0 0 ${word.tint}`,
      words[index - 1]?.tint === undefined && `-2px 0 0 ${word.tint}`,
    ].filter(Boolean);
    return (
      <span
        key={`${word.column}:${word.text}`}
        data-token
        data-region={word.region}
        style={{
          ...word.style,
          backgroundColor: word.tint,
          boxShadow: word.tint && edges.length > 0 ? edges.join(", ") : undefined,
        }}
        className="inline-block rounded-xs leading-[1.35] text-(--token-light) dark:text-(--token-dark)"
      >
        {word.text}
      </span>
    );
  });
});

interface CodeLineProps {
  tokens: Token[];
  number?: number;
  note?: LineNote;
  aside?: ReactNode;
  isActive?: boolean;
  isDimmed?: boolean;
  isWrapped?: boolean;
  marks?: Mark[];
  hoveredName?: string;
  isHighlighted?: boolean;
  colors?: Record<string, string>;
  className?: string;
}

export const CodeLine = (props: CodeLineProps) => (
  <span
    data-line={props.number}
    className={cn(
      "flex min-h-[1.7em] gap-x-4 max-sm:flex-wrap",
      props.isActive && "bg-muted shadow-[inset_2px_0_0_var(--foreground)]",
      props.note?.tone === "danger" &&
        "bg-destructive/10 shadow-[inset_2px_0_0_var(--destructive)]",
      props.className,
    )}
  >
    {props.number !== undefined && <LineNumber number={props.number} />}
    <span
      className={cn(
        "min-w-0 flex-1",
        props.isDimmed && "opacity-40",
        props.isWrapped === false ? "whitespace-pre" : "break-words whitespace-pre-wrap",
      )}
    >
      <CodeWords
        tokens={props.tokens}
        marks={props.marks}
        hoveredName={props.marks?.length ? props.hoveredName : undefined}
        isHighlighted={props.isHighlighted}
        colors={props.colors}
      />
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
