import { check, formatValue, parseModule, TlaError, type CheckResult, type Value } from "tla-ts";
import { getErrorResult } from "./run-error";
import { getSearch, type Search } from "./search";

export interface RunRequest {
  source: string;
  config: string;
  modules?: Record<string, string>;
  isSearchShown?: boolean;
}

export interface LineNote {
  line: number;
  text: string;
  tone: "neutral" | "danger" | "hint";
}

export interface RunResult {
  isPassed: boolean;
  title: string;
  activeLine: number | undefined;
  notes: LineNote[];
  search?: Search;
}

const getTitle = (result: CheckResult) => {
  const name = result.violation?.name;
  return {
    success: "No error found",
    error: result.failure?.message ?? "Error",
    "assumption-violation": `Assumption ${name} is false`,
    "invariant-violation": `Invariant ${name} violated`,
    "property-violation": `Property ${name} violated`,
    "liveness-violation": `Property ${name} violated`,
    "postcondition-violation": `Postcondition ${name} is false`,
    deadlock: "Deadlock reached",
  }[result.status];
};

const getNote = (line: number, text: string, tone: LineNote["tone"]): LineNote => ({
  line,
  text,
  tone,
});

const getStateText = (state: Record<string, Value>) =>
  Object.entries(state)
    .map(([name, value]) => `${name} = ${formatValue(value)}`)
    .join(", ");

const getCheckResult = async (request: RunRequest): Promise<RunResult> => {
  const source = request.source;
  const config = request.config;
  const graphs: string[] = [];
  const result = await check({
    source,
    config,
    loadModule: (name) => request.modules?.[name],
    dump: request.isSearchShown ? { path: "search.dot", dot: true, actionLabels: true } : undefined,
    writeFile: (_path, content) => graphs.push(content),
  });
  const lastStep = result.violation?.trace.at(-1);
  const module = parseModule(source);
  const getDefinitionLine = (name: string | undefined) =>
    module.definitions.find((definition) => definition.name === name)?.location.line;
  const variableLine = module.variables.at(0)?.location.line;
  const violatedLine = getDefinitionLine(
    result.status === "deadlock"
      ? (/\bNEXT\s+(\w+)/.exec(config)?.[1] ?? "Next")
      : result.violation?.name,
  );
  const actionLine = / line (\d+), col/.exec(lastStep?.label ?? "")?.[1];
  return {
    isPassed: result.status === "success",
    title: getTitle(result),
    activeLine:
      lastStep?.label === undefined
        ? getDefinitionLine(/\bINIT\s+(\w+)/.exec(config)?.[1] ?? "Init")
        : actionLine
          ? Number(actionLine)
          : undefined,
    search:
      graphs.length > 0
        ? getSearch(graphs[0], lastStep && getStateText(lastStep.state))
        : undefined,
    notes: [
      ...(lastStep === undefined || variableLine === undefined
        ? []
        : [getNote(variableLine, getStateText(lastStep.state), "neutral")]),
      ...(lastStep === undefined || violatedLine === undefined
        ? []
        : [
            getNote(violatedLine, result.status === "deadlock" ? "deadlock" : "violated", "danger"),
          ]),
    ],
  };
};

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    self.postMessage(await getCheckResult(event.data));
  } catch (error) {
    if (!(error instanceof TlaError)) throw error;
    self.postMessage(getErrorResult(error.message));
  }
};
