import { createContext, use, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CodePaneState {
  isWrapped: boolean;
}

interface GutterStyle extends CSSProperties {
  "--gutter": string;
}

const CodePaneContext = createContext<CodePaneState>({ isWrapped: false });

const getTextClassName = (isWrapped: boolean) =>
  isWrapped ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre";

interface RootProps extends ComponentProps<"div"> {
  lineCount: number;
  isWrapped: boolean;
}

const Root = ({ lineCount, isWrapped, className, style, ...props }: RootProps) => {
  const gutterStyle: GutterStyle = { "--gutter": `${String(lineCount).length + 3}ch`, ...style };
  return (
    <CodePaneContext value={{ isWrapped }}>
      <div
        data-slot="code-pane"
        className={cn(
          "relative py-2 font-mono text-[13px]/5 text-ink",
          isWrapped ? "min-w-full" : "w-max min-w-full",
          className,
        )}
        style={gutterStyle}
        {...props}
      />
    </CodePaneContext>
  );
};

interface LineProps {
  number: number;
  isMarked?: boolean;
  children: ReactNode;
}

const Line = ({ number, isMarked = false, children }: LineProps) => {
  const isWrapped = use(CodePaneContext).isWrapped;
  return (
    <div data-slot="code-pane-line" className="grid grid-cols-[var(--gutter)_1fr]">
      <span
        aria-hidden
        className={cn(
          "pr-4 text-right text-faint tabular-nums select-none",
          isMarked && "text-alarm",
        )}
      >
        {number}
      </span>
      <span className={cn("pr-4", getTextClassName(isWrapped))}>{children}</span>
    </div>
  );
};

// A textarea over the lines, which draw its text with highlighting while its own text is invisible.
const Input = ({ className, ...props }: ComponentProps<"textarea">) => {
  const isWrapped = use(CodePaneContext).isWrapped;
  return (
    <textarea
      data-slot="code-pane-input"
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      wrap={isWrapped ? "soft" : "off"}
      className={cn(
        "absolute inset-y-0 right-0 left-(--gutter) resize-none overflow-hidden bg-transparent py-2 pr-4 text-transparent caret-ink outline-none [-webkit-text-fill-color:transparent] selection:bg-blue-500/25",
        getTextClassName(isWrapped),
        className,
      )}
      {...props}
    />
  );
};

export const CodePane = Object.assign(Root, { Line, Input });
