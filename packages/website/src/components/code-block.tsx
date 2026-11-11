import { Check, Copy, Play } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RunRequest } from "../run-worker";
import { useRun } from "../use-run";
import { RunDrawer, RunProgress, RunStatus } from "./run-result";

const COPIED_MS = 1500;

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
  const rest = code.slice(highlighted.end);
  return [
    ...highlighted.tokens,
    { text: rest, className: language === "shell" ? STRING : undefined },
  ];
};

interface CodeBlockProps {
  code: string;
  language: Language;
  run?: RunRequest;
}

const BUTTON_CLASS_NAME =
  "group flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg outline-none hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500/40 enabled:active:scale-[0.94] disabled:cursor-default disabled:hover:bg-transparent";
const ICON_CLASS_NAME = "size-4.5 text-gray-1000 group-hover:text-gray-1200";

export const CodeBlock = (props: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const runner = useRun();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMultiline = props.code.includes("\n");
  const run = props.run;

  const copy = async () => {
    await navigator.clipboard.writeText(props.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), COPIED_MS);
  };

  return (
    <div
      className={cn(
        "relative flex w-full gap-2 overflow-hidden rounded-xl bg-surface pl-4 shadow-custom",
        isMultiline ? "py-3 pr-4" : "h-11 items-center pr-1",
      )}
    >
      <code
        className={cn(
          "flex-1 font-mono text-sm",
          isMultiline ? "overflow-x-auto whitespace-pre" : "truncate",
        )}
      >
        {getTokens(props.code, props.language).map((token, index) => (
          <span key={index} className={token.className}>
            {token.text}
          </span>
        ))}
      </code>
      <div className={cn("flex shrink-0 items-center", isMultiline && "absolute top-1 right-1")}>
        {runner.isRunning && <RunProgress />}
        {runner.result && !runner.isRunning && !isDrawerOpen && (
          <RunStatus result={runner.result} onOpen={() => setIsDrawerOpen(true)} />
        )}
        {run && (
          <button
            type="button"
            aria-label="Run"
            disabled={runner.isRunning}
            onClick={() => {
              setIsDrawerOpen(true);
              runner.run(run);
            }}
            className={BUTTON_CLASS_NAME}
          >
            <Play className={ICON_CLASS_NAME} />
          </button>
        )}
        <button
          type="button"
          aria-label={isCopied ? "Copied" : "Copy"}
          onClick={copy}
          className={BUTTON_CLASS_NAME}
        >
          {isCopied ? (
            <Check className="size-4.5 text-gray-1200" />
          ) : (
            <Copy className={ICON_CLASS_NAME} />
          )}
        </button>
      </div>
      <RunDrawer
        key={runner.runCount}
        result={runner.result}
        isOpen={isDrawerOpen && !runner.isRunning}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
