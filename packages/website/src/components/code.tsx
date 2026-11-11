import { useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { createPartsContext } from "@/lib/utils";
import { getTokenLines, type Language } from "../highlighter";
import type { LineNote } from "../run-worker";
import { useTokenMorph } from "../use-token-morph";
import { CodeLine } from "./code-line";
import { CopyIcon } from "./copy-icon";
import { RunIcon } from "./run-icon";
import { Button } from "./ui/button";

const COPIED_MS = 1500;
const NO_HIGHLIGHTS = {};

interface CodeState {
  code: string;
  language: Language;
  isMultiline: boolean;
  activeLine: number | undefined;
  notes: LineNote[];
  highlights: Record<string, string>;
  onMorphEnd: (() => void) | undefined;
}

const codeContext = createPartsContext<CodeState>("Code.Root");

interface RootProps {
  code: string;
  language: Language;
  activeLine?: number;
  notes?: LineNote[];
  highlights?: Record<string, string>;
  onMorphEnd?: () => void;
  children: ReactNode;
}

export const CodeRoot = (props: RootProps) => {
  const isMultiline = props.code.includes("\n");
  return (
    <codeContext.PartsContext
      value={{
        code: props.code,
        language: props.language,
        isMultiline,
        activeLine: props.activeLine,
        notes: props.notes ?? [],
        highlights: props.highlights ?? NO_HIGHLIGHTS,
        onMorphEnd: props.onMorphEnd,
      }}
    >
      <div
        className={cn(
          "relative flex w-full flex-wrap gap-2 overflow-hidden rounded-xl bg-card pl-4 ring-1 ring-border",
          isMultiline ? "py-4 pr-4" : "h-11 items-center pr-1.5",
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
  useTokenMorph(contentRef, code.code, code.highlights, code.onMorphEnd);
  const lines = getTokenLines(code.code, code.language);
  if (!code.isMultiline)
    return (
      <code className="min-w-0 flex-1 truncate font-mono text-[13px]/[1.7] text-foreground">
        <CodeLine tokens={lines[0]} />
      </code>
    );
  return (
    <code
      ref={contentRef}
      className="relative w-full min-w-0 font-mono text-[13px]/[1.7] text-foreground"
    >
      {lines
        .map((tokens, index) => ({ tokens, number: index + 1 }))
        .map((line) => (
          <CodeLine
            key={line.number}
            tokens={line.tokens}
            note={code.notes.find((note) => note.line === line.number)}
            isActive={code.activeLine === line.number}
            className={cn("-mr-4 -ml-4 pr-4 pl-4", line.number === 1 && "pr-14")}
          />
        ))}
    </code>
  );
};

interface FooterProps {
  children: ReactNode;
}

export const CodeFooter = (props: FooterProps) => (
  <div className="-mr-4 -mb-4 -ml-4 flex shrink-0 basis-[calc(100%+2rem)] items-center gap-1.5 border-t py-2 pr-2.5 pl-4 text-sm">
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

export const CodeRun = (props: RunProps) => (
  <Button
    size="icon"
    aria-label={props.isRunning ? "Running" : props.isDone ? "Run again" : "Run"}
    disabled={props.isRunning}
    onClick={props.onRun}
  >
    <RunIcon isRunning={props.isRunning} isDone={props.isDone} />
  </Button>
);

export const CodeCopy = () => {
  const code = codeContext.useParts();
  const [isCopied, setIsCopied] = useState(false);
  return (
    <Button
      size="icon"
      aria-label={isCopied ? "Copied" : "Copy"}
      onClick={async () => {
        await navigator.clipboard.writeText(code.code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), COPIED_MS);
      }}
    >
      <CopyIcon isCopied={isCopied} />
    </Button>
  );
};
