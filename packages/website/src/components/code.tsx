import { useEffect, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import type { LineNote } from "@/lib/run-worker";
import type { Search, SearchState } from "@/lib/search";
import { getLineHoveredName } from "@/lib/line-marks";
import type { OutputRow } from "@/lib/output-rows";
import type { Mark, Source } from "@/lib/site-data";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { CodeComment, CodeFold, CodeLine } from "./code-line";
import { CopyButton } from "./copy-button";
import { RunIcon } from "./run-icon";
import { SearchCell } from "./search-cell";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

const NO_MARKS: Mark[] = [];
const NO_PATH: SearchState[] = [];
// The lines past the limit are added a few to a frame. Adding hundreds at once holds the page still
// for half a second.
const MORE_LINES_PER_FRAME = 40;

interface Expanded {
  code: string;
  lineCount: number;
}

interface CodeState {
  source: Source;
  rows: OutputRow[];
  onToggleFold: (name: string) => void;
  lineMarks: Mark[][] | undefined;
  colors: Record<string, string> | undefined;
  isMultiline: boolean;
  activeLine: number | undefined;
  notes: LineNote[];
  search: Search | undefined;
  path: SearchState[];
  onHoverState: (stateId: string | undefined) => void;
  hoveredName: string | undefined;
  isHighlighted: boolean;
}

const codeContext = createPartsContext<CodeState>("Code.Root");

interface RootProps {
  source: Source;
  // The rows shown of the source, where they are not its lines one by one.
  rows?: OutputRow[];
  onToggleFold?: (name: string) => void;
  // Each line's marks, which tint the line's words in the color of the mark's name.
  lineMarks?: Mark[][];
  colors?: Record<string, string>;
  activeLine?: number;
  notes?: LineNote[];
  search?: Search;
  path?: SearchState[];
  onHoverState?: (stateId: string | undefined) => void;
  // The name whose marks are tinted.
  hoveredName?: string;
  // Whether every mark is tinted, not only the hovered name's.
  isHighlighted?: boolean;
  children: ReactNode;
}

// The code that the parts inside it show, for code that sits in a frame of its own making.
const CodeProvider = (props: RootProps) => (
  <codeContext.PartsContext
    value={{
      source: props.source,
      rows:
        props.rows ??
        props.source.lines.map((tokens, index) => ({ kind: "line", number: index + 1, tokens })),
      onToggleFold: props.onToggleFold ?? (() => {}),
      lineMarks: props.lineMarks,
      colors: props.colors,
      isMultiline: props.source.lines.length > 1,
      activeLine: props.activeLine,
      notes: props.notes ?? [],
      search: props.search,
      path: props.path ?? NO_PATH,
      onHoverState: props.onHoverState ?? (() => {}),
      hoveredName: props.hoveredName,
      isHighlighted: props.isHighlighted ?? false,
    }}
  >
    {props.children}
  </codeContext.PartsContext>
);

interface FrameProps {
  className?: string;
  children: ReactNode;
}

const CodeFrame = (props: FrameProps) => {
  const code = codeContext.useParts();
  return (
    <div
      className={cn(
        "relative flex w-full flex-wrap gap-2 overflow-hidden bg-card pl-4 shadow-raised",
        code.isMultiline ? "rounded-2xl py-4 pr-4" : "h-11 items-center rounded-xl pr-1.5",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};

interface CodeRootProps extends RootProps {
  className?: string;
}

const CodeRoot = (props: CodeRootProps) => (
  <CodeProvider {...props}>
    <CodeFrame className={props.className}>{props.children}</CodeFrame>
  </CodeProvider>
);

interface ContentProps {
  // The most lines shown until the reader asks for the rest.
  limit?: number;
}

const CodeContent = (props: ContentProps) => {
  const code = codeContext.useParts();
  // The code that the reader opened in full, so other code starts within the limit again.
  const [expanded, setExpanded] = useState<Expanded>();
  if (expanded && expanded.code !== code.source.code) setExpanded(undefined);
  const isExpanded = expanded?.code === code.source.code;
  const limit = props.limit ?? code.rows.length;
  const lineCount = isExpanded ? expanded.lineCount : limit;
  const hiddenCount = Math.max(0, code.rows.length - limit);
  const isAllShown = lineCount >= code.rows.length;
  useEffect(() => {
    if (isAllShown) return;
    const frame = requestAnimationFrame(() =>
      setExpanded(
        (current) => current && { ...current, lineCount: lineCount + MORE_LINES_PER_FRAME },
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, [isAllShown, lineCount]);
  const activeLine = code.path.at(0)?.line ?? code.activeLine;
  if (!code.isMultiline)
    return (
      <code className="min-w-0 flex-1 truncate font-mono text-[13px]/[1.7] text-foreground">
        <CodeLine tokens={code.source.lines[0]} />
      </code>
    );
  const lines = code.rows.slice(0, lineCount).map((row, index) => {
    if (row.kind === "comment")
      return (
        <CodeComment
          key={`comment ${row.text}`}
          text={row.text}
          className={cn("text-faint", index > 0 && "pt-[0.85em]")}
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
    return (
      <CodeLine
        key={row.number}
        tokens={row.tokens}
        number={row.number}
        isNumberHidden
        marks={code.lineMarks?.at(row.number - 1)}
        hoveredName={getLineHoveredName(
          code.lineMarks?.at(row.number - 1) ?? NO_MARKS,
          code.hoveredName,
        )}
        isHighlighted={code.isHighlighted}
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
              className="min-[94rem]:hidden"
            />
          )
        }
        className={cn("-mr-4 -ml-4 pr-4 pl-4", index < 2 && "pr-14")}
      />
    );
  });
  return (
    <>
      <code className="@container relative w-full min-w-0 font-mono text-code/[1.7] text-foreground">
        {lines.slice(0, limit)}
        {lineCount > limit && (
          <div data-more className="transition-opacity duration-200 ease-out starting:opacity-0">
            {lines.slice(limit)}
          </div>
        )}
      </code>
      {hiddenCount > 0 && (
        <Button
          variant="link"
          size="inline"
          aria-expanded={isExpanded}
          onClick={() =>
            setExpanded(
              isExpanded
                ? undefined
                : { code: code.source.code, lineCount: limit + MORE_LINES_PER_FRAME },
            )
          }
          className="text-sm text-muted-foreground"
        >
          {isExpanded ? "Show less" : `Show ${hiddenCount.toLocaleString("en-US")} more lines`}
        </Button>
      )}
    </>
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
  Provider: CodeProvider,
  Content: CodeContent,
  Footer: CodeFooter,
  Actions: CodeActions,
  Run: CodeRun,
  Copy: CodeCopy,
};
