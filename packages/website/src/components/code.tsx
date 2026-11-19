import { useRef, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import type { LineNote } from "../run-worker";
import type { Search, SearchState } from "../search";
import type { Source } from "../site-data";
import { useCopy } from "../use-copy";
import { useIsHydrated } from "../use-is-hydrated";
import { useTokenMorph } from "../use-token-morph";
import { CodeLine } from "./code-line";
import { CopyIcon } from "./copy-icon";
import { RunIcon } from "./run-icon";
import { SearchCell } from "./search-cell";
import { Button } from "./ui/button";

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

export const CodeRoot = (props: RootProps) => {
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

export const CodeContent = () => {
  const code = codeContext.useParts();
  const contentRef = useRef<HTMLElement>(null);
  const activeLine = code.path.at(0)?.line ?? code.activeLine;
  useTokenMorph(contentRef, code.source.code, code.highlights, code.onMorphEnd);
  if (!code.isMultiline)
    return (
      <code className="min-w-0 flex-1 truncate font-mono text-[13px]/[1.7] text-foreground">
        <CodeLine tokens={code.source.lines[0]} />
      </code>
    );
  return (
    <code
      ref={contentRef}
      className="@container relative w-full min-w-0 font-mono text-code/[1.7] text-foreground"
    >
      {code.source.lines
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
  );
};

interface FooterProps {
  children: ReactNode;
}

export const CodeFooter = (props: FooterProps) => (
  <div className="relative z-10 -mr-4 -mb-4 -ml-4 flex w-[calc(100%+2rem)] shrink-0 bg-card items-center gap-1.5 border-t py-2 pr-2.5 pl-4 text-sm">
    {props.children}
  </div>
);

interface ActionsProps {
  children: ReactNode;
}

export const CodeActions = (props: ActionsProps) => {
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

export const CodeRun = (props: RunProps) => {
  const isHydrated = useIsHydrated();
  return (
    <Button
      variant={props.isDone || props.isRunning ? "outline" : "success"}
      size="icon"
      aria-label={props.isRunning ? "Running" : props.isDone ? "Run again" : "Run"}
      disabled={!isHydrated}
      aria-disabled={props.isRunning}
      onClick={() => !props.isRunning && props.onRun()}
    >
      <RunIcon isRunning={props.isRunning} isDone={props.isDone} />
    </Button>
  );
};

export const CodeCopy = () => {
  const copy = useCopy(codeContext.useParts().source.code);
  return (
    <Button size="icon" aria-label={copy.isCopied ? "Copied" : "Copy"} onClick={copy.copy}>
      <CopyIcon isCopied={copy.isCopied} />
    </Button>
  );
};
