import { check, formatValue, parseModule, TlaError, type CheckResult, type Value } from "tla-ts";
import { getErrorResult } from "./run-error";
import { getSearch, type Search } from "./search";

export interface RunRequest {
  source: string;
  config: string;
  modules?: Record<string, string>;
  isSearchShown?: boolean;
  // The TypeScript file that the spec was compiled from, which a site on ESCore checks instead.
  typescript?: { source: string; fileName: string };
}

export interface LineNote {
  line: number;
  text: string;
  tone: "neutral" | "danger";
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

// On ESCore, the worker prepares ESCore's runtime as it loads, and parses TypeScript's declaration
// files, and a run compiles its TypeScript file again, since its prepared modules don't travel
// between workers.
const escore = __TLA_TS_ESCORE__
  ? Promise.all([
      import("./escore").then((loaded) => loaded.loadEscoreRuntime()),
      import("virtual:typescript-libraries"),
      import("../../tla-ts/src/typescript/program"),
      import("../../tla-ts/src/typescript/spec/api"),
    ]).then(([runtime, libraries, program, api]) => ({
      runtime,
      library: program.createLibrary(libraries.default),
      compile: api.compileEscore,
    }))
  : undefined;

// The spec that a run checks, and the text of the module that the page shows of it, whose lines a
// result marks: on ESCore, the module of the program's code.
const getRun = async (request: RunRequest) => {
  const loaded = await escore;
  if (loaded === undefined || request.typescript === undefined) {
    return {
      spec: {
        source: request.source,
        config: request.config,
        loadModule: (name: string) => request.modules?.[name],
      },
      shown: request.source,
    };
  }
  const spec = loaded.compile(request.typescript, loaded.runtime, loaded.library);
  return { spec, shown: spec.loadModule("ProgramCode") ?? "" };
};

const getCheckResult = async (request: RunRequest): Promise<RunResult> => {
  const run = await getRun(request);
  const config = run.spec.config;
  const graphs: string[] = [];
  const result = await check({
    ...run.spec,
    dump: request.isSearchShown ? { path: "search.dot", dot: true, actionLabels: true } : undefined,
    writeFile: (_path, content) =>
      graphs.push(typeof content === "string" ? content : new TextDecoder().decode(content)),
  });
  const lastStep = result.violation?.trace.at(-1);
  const module = parseModule(run.shown);
  const getDefinitionLine = (name: string | undefined) =>
    module.definitions.find((definition) => definition.name === name)?.location.line;
  const variableLine = module.variables.at(0)?.location.line;
  const violatedLine = getDefinitionLine(
    result.status === "deadlock"
      ? (/\bNEXT\s+(\w+)/.exec(config)?.[1] ?? "Next")
      : result.violation?.name,
  );
  const actionLine = / line (\d+), col/.exec(lastStep?.label ?? "")?.[1];
  const initLine = getDefinitionLine(/\bINIT\s+(\w+)/.exec(config)?.[1] ?? "Init");
  return {
    isPassed: result.status === "success",
    title: getTitle(result),
    activeLine:
      lastStep?.label === undefined ? initLine : actionLine ? Number(actionLine) : undefined,
    search:
      graphs.length > 0
        ? getSearch(graphs[0], lastStep && getStateText(lastStep.state), (call) =>
            call === undefined ? initLine : getDefinitionLine(call.replace(/\(.*$/, "")),
          )
        : undefined,
    notes: [
      ...(lastStep === undefined || variableLine === undefined || request.isSearchShown
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
