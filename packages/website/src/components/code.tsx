import { useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import type { LineNote } from "@/lib/run-worker";
import type { Search, SearchState } from "@/lib/search";
import type { Source } from "@/lib/site-data";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { useTokenMorph } from "@/hooks/use-token-morph";
import { CodeLine } from "./code-line";
import { CopyButton } from "./copy-button";
import { RunIcon } from "./run-icon";
import { SearchCell } from "./search-cell";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

const NO_HIGHLIGHTS = {};
const NO_PATH: SearchState[] = [];

interface CodeState {
  source: Source;
  isMultiline: boolean;
  activeLine: number | undefined;
  notes: LineNote[];
  search: Search | undefined;
  path: SearchState[];
  onHoverState: (stateId: string | undefined) => void;
  highlights: Record<string, string>;
  onMorphEnd: (() => void) | undefined;
}

const codeContext = createPartsContext<CodeState>("Code.Root");

interface RootProps {
  source: Source;
  activeLine?: number;
  notes?: LineNote[];
  search?: Search;
  path?: SearchState[];
  onHoverState?: (stateId: string | undefined) => void;
  highlights?: Record<string, string>;
  onMorphEnd?: () => void;
  children: ReactNode;
}

const CodeRoot = (props: RootProps) => {
  const isMultiline = props.source.lines.length > 1;
  return (
    <codeContext.PartsContext
      value={{
        source: props.source,
        isMultiline,
        activeLine: props.activeLine,
        notes: props.notes ?? [],
        search: props.search,
        path: props.path ?? NO_PATH,
        onHoverState: props.onHoverState ?? (() => {}),
        highlights: props.highlights ?? NO_HIGHLIGHTS,
        onMorphEnd: props.onMorphEnd,
      }}
    >
      <div
        className={cn(
          "relative flex w-full flex-wrap gap-2 overflow-hidden bg-card pl-4 shadow-raised",
          isMultiline ? "rounded-2xl py-4 pr-4" : "h-11 items-center rounded-xl pr-1.5",
        )}
      >
        {props.children}
      </div>
    </codeContext.PartsContext>
  );
};

interface ContentProps {
  // The most lines shown until the reader asks for the rest.
  limit?: number;
}

const CodeContent = (props: ContentProps) => {
  const code = codeContext.useParts();
  const contentRef = useRef<HTMLElement>(null);
  // The code that the reader opened in full, so other code starts within the limit again.
  const [expandedCode, setExpandedCode] = useState<string>();
  const isExpanded = expandedCode === code.source.code;
  const hiddenCount = Math.max(0, code.source.lines.length - (props.limit ?? Infinity));
  const activeLine = code.path.at(0)?.line ?? code.activeLine;
  useTokenMorph(contentRef, code.source.code, code.highlights, code.onMorphEnd);
  if (!code.isMultiline)
    return (
      <code className="min-w-0 flex-1 truncate font-mono text-[13px]/[1.7] text-foreground">
        <CodeLine tokens={code.source.lines[0]} />
      </code>
    );
  return (
    <>
      <code
        ref={contentRef}
        className="@container relative w-full min-w-0 font-mono text-code/[1.7] text-foreground"
      >
        {code.source.lines
          .slice(0, isExpanded ? undefined : props.limit)
          .map((tokens, index) => ({ tokens, number: index + 1 }))
          .map((line) => (
            <CodeLine
              key={line.number}
              tokens={line.tokens}
              note={code.notes.find((note) => note.line === line.number)}
              isActive={activeLine === line.number}
              isDimmed={
                code.path.length > 0 && code.path.every((state) => state.line !== line.number)
              }
              aside={
                code.search && (
                  <SearchCell
                    search={code.search}
                    line={line.number}
                    path={code.path}
                    onHover={code.onHoverState}
                    className="xl:hidden"
                  />
                )
              }
              className={cn("-mr-4 -ml-4 pr-4 pl-4", line.number <= 2 && "pr-14")}
            />
          ))}
      </code>
      {hiddenCount > 0 && (
        <Button
          variant="link"
          size="inline"
          aria-expanded={isExpanded}
          onClick={() => setExpandedCode(isExpanded ? undefined : code.source.code)}
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
  Content: CodeContent,
  Footer: CodeFooter,
  Actions: CodeActions,
  Run: CodeRun,
  Copy: CodeCopy,
};
