import { X } from "@phosphor-icons/react";
import { memo, type ReactNode } from "react";
import { cn } from "cn";
import type { Mark, Token } from "@/lib/site-data";
import type { LineNote } from "@/lib/run-worker";

const WORDS = /\s+|[A-Za-z_]\w*|\d+|[^\sA-Za-z_\d]+/g;
// Each word is its own box, and a line may break between two boxes. Words with no space between
// them stay together up to this length, so that a wrapped line breaks at its spaces.
const MAX_JOINED_LENGTH = 32;

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

export const LineNumber = memo((props: LineNumberProps) => (
  <span aria-hidden className="block min-w-[3ch] shrink-0 text-right text-faint select-none">
    {props.number}
  </span>
));

interface CodeWordsProps {
  tokens: Token[];
  marks?: Mark[];
  hoveredName?: string;
  isHighlighted?: boolean;
  isJoined?: boolean;
  colors?: Record<string, string>;
}

const CodeWords = memo((props: CodeWordsProps) => {
  const words = getWords(props.tokens).map((word) => {
    const marks = (props.marks ?? []).filter(
      (mark) => mark.start <= word.column && word.column < mark.end,
    );
    const isHovered = marks.some((mark) => mark.name === props.hoveredName);
    const name = isHovered ? props.hoveredName : props.isHighlighted && marks.at(0)?.name;
    const color = !/^\s/.test(word.text) && name && props.colors?.[name];
    // A hovered name sets its own strength. Other names take theirs from a rule that their
    // pane switches, so hovering a name re-renders only the lines that hold it.
    const strength = marks.at(0)?.name === props.hoveredName ? 28 : 12;
    const tint: Record<string, string> = isHovered
      ? { "--tint-fill": `color-mix(in srgb, ${color} ${strength}%, transparent)` }
      : { "--tint": `${color}` };
    return { ...word, region: marks.at(0)?.name, tint: color ? tint : undefined };
  });
  const spans = words.map((word, index) => {
    if (/^\s/.test(word.text)) return word.text;
    // A tint spills 2px past the word, except toward a tinted neighbor, where two would overlap.
    const edges = [
      words[index + 1]?.tint === undefined && "2px 0 0 var(--tint-fill)",
      words[index - 1]?.tint === undefined && "-2px 0 0 var(--tint-fill)",
    ].filter(Boolean);
    return (
      <span
        key={`${word.column}:${word.text}`}
        data-token
        data-region={word.region}
        data-tint={word.tint && ""}
        style={{
          ...word.style,
          ...word.tint,
          boxShadow: word.tint && edges.length > 0 ? edges.join(", ") : undefined,
        }}
        className="inline-block rounded-xs leading-[1.35] text-(--token-light) dark:text-(--token-dark)"
      >
        {word.text}
      </span>
    );
  });
  if (!props.isJoined) return spans;
  return words
    .reduce<number[][]>((runs, word, index) => {
      const run = runs.at(-1);
      if (run && !/^\s/.test(word.text) && !/^\s/.test(words[run[0]].text)) run.push(index);
      else runs.push([index]);
      return runs;
    }, [])
    .map((run) => {
      const length = run.reduce((sum, index) => sum + words[index].text.length, 0);
      return run.length > 1 && length <= MAX_JOINED_LENGTH ? (
        <span key={words[run[0]].column} className="whitespace-nowrap">
          {run.map((index) => spans[index])}
        </span>
      ) : (
        run.map((index) => spans[index])
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

// Memoized so hovering a state or a name re-renders only the lines whose look changes.
export const CodeLine = memo((props: CodeLineProps) => (
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
        props.isWrapped === false
          ? "whitespace-pre"
          : "pl-[2ch] -indent-[2ch] break-words whitespace-pre-wrap *:indent-0",
      )}
    >
      <CodeWords
        tokens={props.tokens}
        marks={props.marks}
        hoveredName={props.hoveredName}
        isHighlighted={props.isHighlighted}
        isJoined={props.isWrapped !== false}
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
));
