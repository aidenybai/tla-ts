import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import type { LineNote } from "@/lib/run-worker";
import type { Search, SearchState } from "@/lib/search";
import { getLineHoveredName } from "@/lib/line-marks";
import type { OutputRow } from "@/lib/output-rows";
import type { Mark, Source } from "@/lib/site-data";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { useTokenMorph } from "@/hooks/use-token-morph";
import { CodeComment, CodeFold, CodeLine } from "./code-line";
import { CopyButton } from "./copy-button";
import { RunIcon } from "./run-icon";
import { SearchCell } from "./search-cell";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

const NO_MARKS: Mark[] = [];
const NO_COLORS = {};
const NO_PATH: SearchState[] = [];
// Hundreds of rows added at once hold the page still for half a second.
const MORE_ROWS_PER_FRAME = 40;

interface Expanded {
  code: string;
  rowCount: number;
}

interface CodeState {
  source: Source;
  rows: OutputRow[];
  limit: number;
  rowCount: number;
  isExpanded: boolean;
  toggleExpanded: () => void;
  onToggleFold: (name: string) => void;
  lineMarks: Mark[][] | undefined;
  colors: Record<string, string>;
  isMultiline: boolean;
  activeLine: number | undefined;
  notes: LineNote[];
  search: Search | undefined;
  path: SearchState[];
  onHoverState: (stateId: string | undefined) => void;
}

const codeContext = createPartsContext<CodeState>("Code.Root");

interface RootProps {
  source: Source;
  // The rows shown of the source, where they are not its lines one by one.
  rows?: OutputRow[];
  // The most rows shown until the reader asks for the rest with Code.More.
  limit?: number;
  onToggleFold?: (name: string) => void;
  // Each line's marks, which tint on hover and flash as code comes into view.
  lineMarks?: Mark[][];
  colors?: Record<string, string>;
  activeLine?: number;
  notes?: LineNote[];
  search?: Search;
  path?: SearchState[];
  onHoverState?: (stateId: string | undefined) => void;
  children: ReactNode;
}

const CodeRoot = (props: RootProps) => {
  const code = props.source.code;
  const lines = props.source.lines;
  const rows = useMemo(
    () =>
      props.rows ??
      lines.map((tokens, index): OutputRow => ({ kind: "line", number: index + 1, tokens })),
    [props.rows, lines],
  );
  const limit = props.limit ?? rows.length;
  // Other code starts within the limit again.
  const [expanded, setExpanded] = useState<Expanded>();
  if (expanded && expanded.code !== code) setExpanded(undefined);
  const isExpanded = expanded?.code === code;
  const rowCount = isExpanded ? expanded.rowCount : limit;
  const isAllShown = rowCount >= rows.length;
  useEffect(() => {
    if (isAllShown) return;
    const frame = requestAnimationFrame(() =>
      setExpanded((current) => current && { ...current, rowCount: rowCount + MORE_ROWS_PER_FRAME }),
    );
    return () => cancelAnimationFrame(frame);
  }, [isAllShown, rowCount]);
  const isMultiline = lines.length > 1;
  return (
    <codeContext.PartsContext
      value={{
        source: props.source,
        rows,
        limit,
        rowCount,
        isExpanded,
        toggleExpanded: () =>
          setExpanded(isExpanded ? undefined : { code, rowCount: limit + MORE_ROWS_PER_FRAME }),
        onToggleFold: props.onToggleFold ?? (() => {}),
        lineMarks: props.lineMarks,
        colors: props.colors ?? NO_COLORS,
        isMultiline,
        activeLine: props.activeLine,
        notes: props.notes ?? [],
        search: props.search,
        path: props.path ?? NO_PATH,
        onHoverState: props.onHoverState ?? (() => {}),
      }}
    >
      <div
        className={cn(
          "relative flex w-full flex-wrap gap-2 overflow-hidden bg-card pl-4 shadow-raised",
          isMultiline ? "rounded-[18px] py-4 pr-4" : "h-11 items-center rounded-[14px] pr-1.5",
        )}
      >
        {props.children}
      </div>
    </codeContext.PartsContext>
  );
};

const CodeContent = () => {
  const code = codeContext.useParts();
  const contentRef = useRef<HTMLElement>(null);
  const [hoveredName, setHoveredName] = useState<string>();
  useTokenMorph(contentRef, code.source.code, code.colors);
  if (!code.isMultiline)
    return (
      <code className="min-w-0 flex-1 truncate font-mono text-[13px]/[1.7] text-foreground">
        <CodeLine tokens={code.source.lines[0]} />
      </code>
    );
  const activeLine = code.path.at(0)?.line ?? code.activeLine;
  const rows = code.rows.slice(0, code.rowCount).map((row, index) => {
    if (row.kind === "comment")
      return (
        <CodeComment
          key={`comment ${row.text}`}
          text={row.text}
          className={cn(
            "text-faint",
            index > 0 && code.rows[index - 1].kind !== "comment" && "pt-[0.85em]",
          )}
        />
      );
    if (row.kind === "fold")
      return (
        <CodeFold
          key={`fold ${row.name}`}
          lineCount={row.lineCount}
          isOpen={row.isOpen}
          onToggle={() => code.onToggleFold(row.name)}
          className="text-faint"
        />
      );
    const marks = code.lineMarks?.at(row.number - 1) ?? NO_MARKS;
    return (
      <CodeLine
        key={row.number}
        tokens={row.tokens}
        number={row.number}
        isNumberHidden
        marks={marks}
        hoveredName={getLineHoveredName(marks, hoveredName)}
        colors={code.colors}
        note={code.notes.find((note) => note.line === row.number)}
        isActive={activeLine === row.number}
        isDimmed={code.path.length > 0 && code.path.every((state) => state.line !== row.number)}
        aside={
          code.search && (
            <SearchCell
              search={code.search}
              line={row.number}
              path={code.path}
              onHover={code.onHoverState}
              className="xl:hidden"
            />
          )
        }
        className={cn("-mr-4 -ml-4 pr-4 pl-4", index < 2 && "pr-14")}
      />
    );
  });
  return (
    <code
      ref={contentRef}
      data-hovering-name={hoveredName === undefined ? undefined : ""}
      // Code that grows under a pointer at rest is not hovered until the pointer moves.
      onPointerMove={(event) => {
        if (event.movementX === 0 && event.movementY === 0) return;
        if (!(event.target instanceof HTMLElement)) return setHoveredName(undefined);
        const line = Number(event.target.closest<HTMLElement>("[data-line]")?.dataset.line);
        setHoveredName(event.target.dataset.region ?? code.lineMarks?.at(line - 1)?.at(0)?.name);
      }}
      onPointerLeave={() => setHoveredName(undefined)}
      className="@container relative w-full min-w-0 font-mono text-code/[1.7] text-foreground"
    >
      {rows.slice(0, code.limit)}
      {code.rowCount > code.limit && (
        <div data-more className="transition-opacity duration-200 ease-out starting:opacity-0">
          {rows.slice(code.limit)}
        </div>
      )}
    </code>
  );
};

const CodeMore = () => {
  const code = codeContext.useParts();
  const hiddenCount = code.rows.length - code.limit;
  return (
    hiddenCount > 0 && (
      <Button
        variant="link"
        size="inline"
        aria-expanded={code.isExpanded}
        onClick={code.toggleExpanded}
        className="text-sm text-muted-foreground"
      >
        {code.isExpanded
          ? "Show less"
          : `Show ${hiddenCount.toLocaleString("en-US")} more ${hiddenCount === 1 ? "line" : "lines"}`}
      </Button>
    )
  );
};

interface FooterProps {
  children: ReactNode;
}

const CodeFooter = (props: FooterProps) => (
  <div className="relative z-10 -mr-4 -mb-4 -ml-4 flex w-[calc(100%+2rem)] shrink-0 bg-card items-center gap-1.5 border-t py-2 pr-2.5 pl-4 text-sm">
    {props.children}
  </div>
);

interface ActionsProps {
  children: ReactNode;
}

const CodeActions = (props: ActionsProps) => {
  const code = codeContext.useParts();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5",
        code.isMultiline && "absolute top-2.5 right-2.5",
      )}
    >
      {props.children}
    </div>
  );
};

interface RunProps {
  isRunning: boolean;
  isDone: boolean;
  // Whether running is the next thing to do, which draws the eye to the button.
  isSuggested?: boolean;
  onRun: () => void;
}

const CodeRun = (props: RunProps) => {
  const isHydrated = useIsHydrated();
  const label = props.isRunning ? "Running" : props.isDone ? "Run again" : "Run";
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        closeOnClick={false}
        render={
          <Button
            variant={props.isDone || props.isRunning ? "outline" : "success"}
            size="icon"
            aria-label={label}
            disabled={!isHydrated}
            aria-disabled={props.isRunning}
            onClick={() => !props.isRunning && props.onRun()}
            className={cn(
              props.isSuggested &&
                !props.isRunning &&
                "motion-safe:animate-pulse-ring motion-reduce:ring-3 motion-reduce:ring-success/40",
            )}
          />
        }
      >
        <RunIcon isRunning={props.isRunning} isDone={props.isDone} />
      </Tooltip.Trigger>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip.Root>
  );
};

const CodeCopy = () => <CopyButton text={codeContext.useParts().source.code} />;

export const Code = {
  Root: CodeRoot,
  Content: CodeContent,
  More: CodeMore,
  Footer: CodeFooter,
  Actions: CodeActions,
  Run: CodeRun,
  Copy: CodeCopy,
};
