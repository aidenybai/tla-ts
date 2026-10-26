import { Editor, type EditorFactory } from "@pierre/diffs/edit";
import { EditProvider, File, type FileOptions } from "@pierre/diffs/react";
import { Check, ChevronDown, Play, Square } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CheckRequest, CheckResponse } from "./check-worker";
import { EXAMPLES } from "./examples";

const FILE_OPTIONS: FileOptions<undefined, undefined> = {
  theme: { light: "github-light", dark: "github-dark-default" },
  themeType: "system",
  overflow: "wrap",
  disableFileHeader: true,
  unsafeCSS:
    ":host { background-color: transparent; letter-spacing: normal; --diffs-bg: transparent; --diffs-font-size: 13px; --diffs-line-height: 19px; --diffs-font-family: var(--font-mono); } [data-gutter], [data-column-number] { background: transparent; }",
};

const createEditor: EditorFactory<undefined, undefined> = (type, options, editStateKey) =>
  new Editor(type, options, editStateKey);

const STATUS_LABELS: Record<string, string> = {
  success: "No error found",
  "assumption-violation": "Assumption is false",
  "invariant-violation": "Invariant violated",
  "property-violation": "Property violated",
  "liveness-violation": "Temporal property violated",
  deadlock: "Deadlock reached",
};

const useSystemTheme = () => {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
};

interface SectionProps {
  title: string;
  count?: number;
  children: ReactNode;
}

const Section = ({ title, count, children }: SectionProps) => (
  <section className="grid gap-2">
    <header className="flex items-center gap-3">
      <h3 className="font-medium text-text-2">{title}</h3>
      <span className="h-px flex-1 bg-border" />
      {count !== undefined && count > 0 && (
        <span className="text-muted-foreground tabular-nums">{count}</span>
      )}
    </header>
    {children}
  </section>
);

interface SourceFileProps {
  name: string;
  contents: string;
  onChange: (contents: string) => void;
}

const SourceFile = ({ name, contents, onChange }: SourceFileProps) => (
  <File
    file={{ name, contents }}
    options={FILE_OPTIONS}
    edit
    editStateKey={name}
    onEditChange={(event) => onChange(event.file.contents)}
    disableWorkerPool
  />
);

const Verdict = ({ isSuccess, children }: { isSuccess: boolean; children: ReactNode }) => (
  <p
    className={cn(
      "flex flex-wrap items-center gap-2 font-medium before:size-1.5 before:rounded-full before:bg-current",
      isSuccess ? "text-success" : "text-destructive",
    )}
  >
    {children}
  </p>
);

const Result = ({ response }: { response: CheckResponse }) => {
  if (response.kind === "error") {
    return (
      <Section title="Error">
        <Verdict isSuccess={false}>{response.name}</Verdict>
        <pre className="whitespace-pre-wrap text-text-2">{response.message}</pre>
      </Section>
    );
  }
  return (
    <>
      <Section title="Result">
        <Verdict isSuccess={response.status === "success"}>
          {STATUS_LABELS[response.status] ?? response.status}
          {response.violation && response.status !== "deadlock" && (
            <code className="rounded-sm bg-muted px-1.5 text-foreground">{response.violation}</code>
          )}
        </Verdict>
      </Section>
      {response.output.length > 0 && (
        <Section title="Output" count={response.output.length}>
          <pre className="whitespace-pre-wrap text-text-2">{response.output.join("\n")}</pre>
        </Section>
      )}
      {response.trace.length > 0 && (
        <Section title="Trace" count={response.trace.length}>
          <ol className="grid gap-3">
            {response.trace.map((step, index) => (
              <li key={index} className="grid gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-muted-foreground tabular-nums">{index + 1}</span>
                  <code className="font-medium">{step.action ?? "Initial predicate"}</code>
                </div>
                <table className="w-full font-mono">
                  <tbody>
                    {step.variables.map(([name, value]) => (
                      <tr key={name} className="border-t">
                        <td className="w-2/5 py-0.5 pl-6 align-top text-muted-foreground">
                          {name}
                        </td>
                        <td className="py-0.5 align-top break-words">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </>
  );
};

const describeStatistics = (response: CheckResponse | undefined) => {
  if (!response || response.kind === "error") return "Ready";
  return `${response.generatedStates.toLocaleString()} states generated, ${response.distinctStates.toLocaleString()} distinct, depth ${response.depth}, ${Math.round(response.milliseconds).toLocaleString()} ms`;
};

export const App = () => {
  useSystemTheme();
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = EXAMPLES[exampleIndex];
  const [spec, setSpec] = useState(example.spec);
  const [config, setConfig] = useState(example.config);
  const [response, setResponse] = useState<CheckResponse | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | undefined>(undefined);

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = undefined;
    setIsRunning(false);
  };

  const run = () => {
    stop();
    const worker = new Worker(new URL("./check-worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    setIsRunning(true);
    setResponse(undefined);
    worker.onmessage = (event: MessageEvent<CheckResponse>) => {
      setResponse(event.data);
      stop();
    };
    const request: CheckRequest = { spec, config };
    worker.postMessage(request);
  };

  const selectExample = (index: number) => {
    stop();
    setExampleIndex(index);
    setSpec(EXAMPLES[index].spec);
    setConfig(EXAMPLES[index].config);
    setResponse(undefined);
  };

  return (
    <EditProvider createEditor={createEditor}>
      <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overscroll-none">
        <div className="flex h-12 items-center gap-3 border-b px-3">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 px-1 text-[15px]/[20px] font-semibold tracking-[-0.02em]">
              tla-ts
            </span>
            <span className="h-4 w-px shrink-0 bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "min-w-0 font-mono text-foreground",
                )}
              >
                <span className="truncate">{example.name}.tla</span>
                <ChevronDown className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {EXAMPLES.map((candidate, index) => (
                  <DropdownMenuItem
                    key={candidate.name}
                    className="font-mono"
                    onClick={() => selectExample(index)}
                  >
                    <span className="flex-1">{candidate.name}.tla</span>
                    {index === exampleIndex && <Check />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isRunning && (
            <Button variant="ghost" onClick={stop}>
              <Square />
              Stop
            </Button>
          )}
          <Button onClick={run} disabled={isRunning}>
            <Play />
            {isRunning ? "Checking…" : "Check"}
          </Button>
        </div>
        <div
          className="grid min-h-0 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_400px]"
          key={example.name}
        >
          <div className="min-h-0 overflow-auto overscroll-none py-2 [scrollbar-gutter:stable]">
            <SourceFile name={`${example.name}.tla`} contents={example.spec} onChange={setSpec} />
          </div>
          <aside className="grid min-h-0 content-start gap-5 overflow-auto overscroll-none border-t px-4 py-4 [scrollbar-gutter:stable] sm:px-5 md:border-t-0 md:border-l">
            <p className="text-text-2">{example.description}</p>
            <Section title="Configuration">
              <div className="-mx-2">
                <SourceFile
                  name={`${example.name}.cfg`}
                  contents={example.config}
                  onChange={setConfig}
                />
              </div>
            </Section>
            {response ? (
              <Result response={response} />
            ) : (
              !isRunning && (
                <p className="text-faint">Press Check to explore every reachable state.</p>
              )
            )}
          </aside>
        </div>
        <div className="flex h-9 items-center gap-4 border-t pr-1.5 pl-3 whitespace-nowrap text-muted-foreground tabular-nums">
          <span className="min-w-0 flex-1 truncate">
            {isRunning ? "Checking…" : describeStatistics(response)}
          </span>
          <a
            href="https://github.com/aidenybai/tla-ts"
            className={buttonVariants({ variant: "ghost" })}
          >
            GitHub
          </a>
        </div>
      </div>
    </EditProvider>
  );
};
