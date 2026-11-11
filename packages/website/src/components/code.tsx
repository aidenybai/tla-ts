import { Check, Copy, Play } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn, createPartsContext } from "@/lib/utils";
import type { RunRequest } from "../run-worker";
import { useRun } from "../use-run";

const COPIED_MS = 1500;
const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const SPINNER_INTERVAL_MS = 80;

const KEYWORD = "text-code-keyword";
const STRING = "text-code-string";
const COMMENT = "text-gray-1000";

const PATTERNS = {
  shell: /^\S+/g,
  typescript: /(?<comment>\/\/.*)|(?<string>"[^"]*")|\b(?:import|from|const|await)\b/g,
  tla: /(?<comment>\\\*.*|-{4,}|={4,})|(?<string>"[^"]*")|\\[AE]\b|\\(?:in|cap)\b|<\d+>\d*\.?|\b(?:MODULE|EXTENDS|VARIABLES?|THEOREM|BY|DEF|IF|THEN|ELSE|QED)\b/g,
};

type Language = keyof typeof PATTERNS;

interface Token {
  text: string;
  className?: string;
}

const BUTTON_CLASS_NAME =
  "group flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg outline-none hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500/40 enabled:active:scale-[0.94] disabled:cursor-default disabled:hover:bg-transparent";
const ICON_CLASS_NAME = "size-4.5 text-gray-1000 group-hover:text-gray-1200";

interface CodeState {
  code: string;
  language: Language;
  isMultiline: boolean;
  runner: ReturnType<typeof useRun>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isDrawerOpen: boolean) => void;
}

const codeContext = createPartsContext<CodeState>("Code.Root");

export const useCode = codeContext.useParts;

const getTokens = (code: string, language: Language) => {
  const highlighted = [...code.matchAll(PATTERNS[language])].reduce<{
    tokens: Token[];
    end: number;
  }>(
    (state, match) => ({
      tokens: [
        ...state.tokens,
        { text: code.slice(state.end, match.index) },
        {
          text: match[0],
          className: match.groups?.comment ? COMMENT : match.groups?.string ? STRING : KEYWORD,
        },
      ],
      end: match.index + match[0].length,
    }),
    { tokens: [], end: 0 },
  );
  return [
    ...highlighted.tokens,
    {
      text: code.slice(highlighted.end),
      className: language === "shell" ? STRING : undefined,
    },
  ];
};

interface RootProps {
  code: string;
  language: Language;
  children: ReactNode;
}

export const CodeRoot = (props: RootProps) => {
  const runner = useRun();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMultiline = props.code.includes("\n");
  return (
    <codeContext.PartsContext
      value={{
        code: props.code,
        language: props.language,
        isMultiline,
        runner,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      <div
        className={cn(
          "relative flex w-full gap-2 overflow-hidden rounded-xl bg-surface pl-4 shadow-custom",
          isMultiline ? "py-3 pr-4" : "h-11 items-center pr-1",
        )}
      >
        {props.children}
      </div>
    </codeContext.PartsContext>
  );
};

export const CodeContent = () => {
  const code = useCode();
  return (
    <code
      className={cn(
        "flex-1 font-mono text-sm",
        code.isMultiline ? "overflow-x-auto whitespace-pre" : "truncate",
      )}
    >
      {getTokens(code.code, code.language).map((token, index) => (
        <span key={index} className={token.className}>
          {token.text}
        </span>
      ))}
    </code>
  );
};

interface ActionsProps {
  children: ReactNode;
}

export const CodeActions = (props: ActionsProps) => {
  const code = useCode();
  return (
    <div className={cn("flex shrink-0 items-center", code.isMultiline && "absolute top-1 right-1")}>
      {props.children}
    </div>
  );
};

const Progress = () => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const interval = setInterval(
      () => setElapsedMs(performance.now() - startedAt),
      SPINNER_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="px-2 text-sm text-gray-1000 tabular-nums">
      {SPINNER[Math.floor(elapsedMs / SPINNER_INTERVAL_MS) % SPINNER.length]}{" "}
      {(elapsedMs / 1000).toFixed(1)} s
    </span>
  );
};

export const CodeStatus = () => {
  const code = useCode();
  const result = code.runner.result;
  if (code.runner.isRunning) return <Progress />;
  if (result === undefined || code.isDrawerOpen) return null;
  return (
    <button
      type="button"
      onClick={() => code.setIsDrawerOpen(true)}
      className={cn(
        "mr-1 flex h-8 min-w-0 items-center gap-1.5 self-center rounded-full px-3 text-sm",
        result.isPassed
          ? "bg-success-soft text-success hover:bg-success-tint"
          : "bg-danger-soft text-danger hover:bg-danger-tint",
      )}
    >
      <span aria-hidden>{result.isPassed ? "✓" : "✕"}</span>
      <span className="truncate max-[400px]:sr-only">
        {result.isPassed ? "Passed" : (result.name ?? result.title)}
      </span>
    </button>
  );
};

interface RunProps {
  request: RunRequest;
}

export const CodeRun = (props: RunProps) => {
  const code = useCode();
  return (
    <button
      type="button"
      aria-label="Run"
      disabled={code.runner.isRunning}
      onClick={() => {
        code.setIsDrawerOpen(true);
        code.runner.run(props.request);
      }}
      className={BUTTON_CLASS_NAME}
    >
      <Play className={ICON_CLASS_NAME} />
    </button>
  );
};

export const CodeCopy = () => {
  const code = useCode();
  const [isCopied, setIsCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={isCopied ? "Copied" : "Copy"}
      onClick={async () => {
        await navigator.clipboard.writeText(code.code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), COPIED_MS);
      }}
      className={BUTTON_CLASS_NAME}
    >
      {isCopied ? (
        <Check className="size-4.5 text-gray-1200" />
      ) : (
        <Copy className={ICON_CLASS_NAME} />
      )}
    </button>
  );
};
