import { check, formatValue, parseModule, TlaError, type CheckResult, type Value } from "tla-ts";
import type { EscoreHost } from "../../../tla-ts/src/typescript/spec/prepare";
import type { CompileResponse, EscoreRequest, EscoreResponse } from "./escore-worker";
import { getErrorResult } from "./run-error";
import { getSearch, type Search } from "./search";

export interface RunRequest {
  source: string;
  config: string;
  modules?: Record<string, string>;
  isSearchShown?: boolean;
  // The TypeScript file that the spec was compiled from, which the worker checks instead.
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
  // The most states of a search that the run kept no graph of, as it passed them.
  graphOmittedPast?: number;
}

// The most states whose graph a run keeps. The graph holds the text of every state it reaches, which
// for a model of a large heap runs to megabytes a state: Solid's solid.js reached 600 states and
// 2.8 GB in six minutes, and filled the worker's memory in nine. The page lists far fewer.
const MOST_GRAPH_STATES = 100;

// What stops a check whose graph passed the most states that a run keeps.
class GraphOmittedError extends Error {}

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

// The worker compiles as well as checks: it prepares ESCore's runtime from the host that
// the build recorded, the realm of the Node that built the site, which it fetches as it starts,
// while it loads the compiler, and parses TypeScript's declaration files, for every compile and
// run. A run compiles its TypeScript file again, which costs less than keeping the specs it
// compiled.
const host: Promise<EscoreHost> = fetch(
  new URL(`${import.meta.env.BASE_URL}escore-host.json`, import.meta.url),
).then((response) => response.json());
const escore = Promise.all([
  import("./escore"),
  import("virtual:typescript-libraries"),
  import("../../../tla-ts/src/typescript/program"),
  import("../../../tla-ts/src/typescript/spec/api"),
  import("../../../tla-ts/src/typescript/spec/prepare"),
]).then(async ([loaded, libraries, program, api, prepare]) => ({
  library: program.createLibrary(libraries.default),
  runtime: prepare.prepareHostRuntime(await host),
  compile: api.compileEscore,
  getCompilation: loaded.getEscoreCompilation,
}));

// The spec that a run checks, and the text of the module that the page shows of it, whose lines a
// result marks: on ESCore, the module of the program's code.
const getRun = async (request: RunRequest) => {
  const loaded = await escore;
  if (request.typescript === undefined) {
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

// A check of the spec, with the graph of its search where it's shown, which the check stops keeping
// past the most states, as its progress, once a minute, tells.
const checkRun = async (
  spec: Awaited<ReturnType<typeof getRun>>["spec"],
  isSearchShown: boolean,
) => {
  const graphs: string[] = [];
  const result = await check({
    ...spec,
    dump: isSearchShown ? { path: "search.dot", dot: true, actionLabels: true } : undefined,
    writeFile: (_path, content) =>
      graphs.push(typeof content === "string" ? content : new TextDecoder().decode(content)),
    onProgress: (progress) => {
      if (
        isSearchShown &&
        progress.kind === "progress" &&
        progress.statistics.distinctStates > MOST_GRAPH_STATES
      ) {
        throw new GraphOmittedError();
      }
    },
  });
  const isGraphOmitted = isSearchShown && result.distinctStates > MOST_GRAPH_STATES;
  return { result, graphs: isGraphOmitted ? [] : graphs, isGraphOmitted };
};

const getCheckResult = async (request: RunRequest): Promise<RunResult> => {
  const run = await getRun(request);
  const config = run.spec.config;
  // A search that passes the most states checks again without its graph.
  const checked = await checkRun(run.spec, request.isSearchShown === true).catch(
    (error: unknown) => {
      if (!(error instanceof GraphOmittedError)) throw error;
      return checkRun(run.spec, false).then((rerun) => ({ ...rerun, isGraphOmitted: true }));
    },
  );
  const result = checked.result;
  const graphs = checked.graphs;
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
    graphOmittedPast: checked.isGraphOmitted ? MOST_GRAPH_STATES : undefined,
    notes: [
      ...(lastStep === undefined ||
      variableLine === undefined ||
      (request.isSearchShown && !checked.isGraphOmitted)
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

// The message that the page shows of an error: a stop's, as tla-ts gives it, or another error's,
// which a bug throws, by its name, so that the page reports it rather than wait for an answer.
const getErrorMessage = (error: unknown) =>
  error instanceof TlaError
    ? error.message
    : `tla-ts failed: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`;

const getCompiled = async (source: string, fileName: string): Promise<CompileResponse> => {
  try {
    const loaded = await escore;
    return {
      source,
      fileName,
      compilation: loaded.getCompilation(source, fileName, loaded.runtime, loaded.library),
    };
  } catch (error) {
    return { source, fileName, error: getErrorMessage(error) };
  }
};

self.onmessage = async (event: MessageEvent<EscoreRequest>) => {
  const request = event.data;
  if ("compile" in request) {
    self.postMessage({
      compiled: await getCompiled(request.compile.source, request.compile.fileName),
    });
    return;
  }
  try {
    self.postMessage(await getCheckResult(request));
  } catch (error) {
    self.postMessage(getErrorResult(getErrorMessage(error)));
  }
};

// A promise that rejects with no handler answers nothing, so it fails what the page waits for.
self.addEventListener("unhandledrejection", (event) => {
  self.postMessage({ failed: getErrorMessage(event.reason) } satisfies EscoreResponse);
});
