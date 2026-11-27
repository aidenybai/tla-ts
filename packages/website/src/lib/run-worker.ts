import { check, formatValue, parseModule, TlaError, type CheckResult, type Value } from "tla-ts";
import {
  isStackOverflow,
  STACK_OVERFLOW_MESSAGE,
  TlaStackLimitError,
  TlaStackOverflowError,
} from "../../../tla-ts/src/errors";
import type { JsTlaHost } from "../../../tla-ts/src/typescript/spec/prepare";
import type { CompileRequest, CompileResponse, JsTlaRequest, JsTlaResponse } from "./js-tla-worker";
import { getErrorResult } from "./run-error";
import { getSearch, type Search } from "./search";

export interface RunRequest {
  source: string;
  config: string;
  modules?: Record<string, string>;
  isSearchShown?: boolean;
  // The TypeScript file that the spec was compiled from, which the worker checks instead.
  typescript?: CompileRequest;
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
  // Whether the program's files name process.env, which a page gives NODE_ENV=production alone, as
  // a bundler gives a program that it builds for a browser.
  isEnvironmentNamed?: boolean;
}

// A name of process.env in a file's text.
const ENVIRONMENT_NAME = /\bprocess\s*\.\s*env\b/;

// The most states whose graph a run keeps. The graph holds the text of every state it reaches, which
// for a model of a large heap runs to megabytes a state: Solid's solid.js reached 600 states and
// 2.8 GB in six minutes, and filled the worker's memory in nine. The page lists far fewer.
const MOST_GRAPH_STATES = 100;

// What stops a check whose graph passed the most states that a run keeps.
class GraphOmittedError extends Error {}

// The most characters of a program's TLA+ code that the page shows and checks. Chromium's renderer,
// which the page shares with its worker, ran out of memory to show the code of a script of 35,000
// numbers, 8.5 million characters, of which 80% is 6.8 million. The worker alone checks up to the
// CLI's bound.
const MOST_CODE_CHARACTERS = 6_500_000;

// Stops at a program whose code passes the most characters that the page shows.
const checkCodeLength = (code: string) => {
  if (code.length > MOST_CODE_CHARACTERS) {
    throw new TlaError(
      `tla-ts can't check a program whose TLA+ spec has more than ${MOST_CODE_CHARACTERS} characters on the website: this program's has ${code.length}, which the page would run out of memory to show`,
    );
  }
};

const getTitle = (result: CheckResult) => {
  const name = result.violation?.name;
  return {
    success: "No error found",
    error: result.failure?.message ?? "Error",
    // An assumption whose evaluation failed, as TLC says, with the failure's message.
    "assumption-violation":
      result.violation?.message === undefined
        ? `Assumption ${name} is false`
        : `Evaluating assumption ${name} failed.\n${result.violation.message}`,
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

// The worker compiles as well as checks: it prepares JS.tla's runtime from the host that
// the build recorded, the realm of the Node that built the site, which it fetches as it starts,
// while it loads the compiler, and parses TypeScript's declaration files, for every compile and
// run. A run compiles its TypeScript file again, which costs less than keeping the specs it
// compiled.
const host: Promise<JsTlaHost> = fetch(
  new URL(`${import.meta.env.BASE_URL}js-tla-host.json`, import.meta.url),
).then((response) => response.json());
const jsTla = Promise.all([
  import("./js-tla"),
  import("virtual:typescript-libraries"),
  import("virtual:package-files"),
  import("../../../tla-ts/src/typescript/program"),
  import("../../../tla-ts/src/typescript/spec/api"),
  import("../../../tla-ts/src/typescript/spec/prepare"),
]).then(async ([loaded, libraries, packageFiles, program, api, prepare]) => ({
  library: program.createLibrary(libraries.default),
  files: packageFiles.default,
  runtime: prepare.prepareHostRuntime(await host),
  compile: api.compileJsTla,
  getCompilation: loaded.getJsTlaCompilation,
}));

// The spec that a run checks, and the text of the module that the page shows of it, whose lines a
// result marks: on JS.tla, the module of the program's code.
const getRun = async (request: RunRequest) => {
  const loaded = await jsTla;
  if (request.typescript === undefined) {
    return {
      spec: {
        source: request.source,
        config: request.config,
        loadModule: (name: string) => request.modules?.[name],
      },
      shown: request.source,
      isEnvironmentNamed: false,
    };
  }
  const files = request.typescript.files ?? loaded.files;
  const spec = loaded.compile({ ...request.typescript, files }, loaded.runtime, loaded.library);
  const shown = spec.loadModule("ProgramCode") ?? "";
  checkCodeLength(shown);
  return {
    spec,
    shown,
    isEnvironmentNamed: [request.typescript.source, ...files.values()].some((text) =>
      ENVIRONMENT_NAME.test(text),
    ),
  };
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
  if (request.typescript !== undefined && result.failure?.message === STACK_OVERFLOW_MESSAGE) {
    throw new TlaStackLimitError(WORKER_STACK, result.depth);
  }
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
    isEnvironmentNamed: run.isEnvironmentNamed,
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

// The stack that a browser gives its worker, about half of Node's, whose size it doesn't tell.
const WORKER_STACK = "the browser worker's stack";

// The message that the page shows of an error: an overflow of the worker's stack, which for a
// TypeScript program tla-ts can't check, as the CLI says, and is TLC's verdict only on a spec of
// TLA+; a stop's, as tla-ts gives it; or another error's, which a bug throws, by its name, so that
// the page reports it rather than wait for an answer.
const getErrorMessage = (error: unknown, isTypeScript: boolean) =>
  isStackOverflow(error) || error instanceof TlaStackOverflowError
    ? isTypeScript
      ? new TlaStackLimitError(WORKER_STACK).message
      : STACK_OVERFLOW_MESSAGE
    : error instanceof TlaError
      ? error.message
      : `tla-ts failed: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`;

const getCompiled = async (request: CompileRequest): Promise<CompileResponse> => {
  const response = { source: request.source, fileName: request.fileName };
  try {
    const loaded = await jsTla;
    const compilation = loaded.getCompilation(
      request.source,
      request.fileName,
      loaded.runtime,
      request.files ?? loaded.files,
      loaded.library,
    );
    checkCodeLength(compilation.tla);
    return { ...response, compilation };
  } catch (error) {
    return { ...response, error: getErrorMessage(error, true) };
  }
};

self.onmessage = async (event: MessageEvent<JsTlaRequest>) => {
  const request = event.data;
  if ("compile" in request) {
    self.postMessage({
      compiled: await getCompiled(request.compile),
    });
    return;
  }
  try {
    self.postMessage(await getCheckResult(request));
  } catch (error) {
    self.postMessage(getErrorResult(getErrorMessage(error, request.typescript !== undefined)));
  }
};

// A promise that rejects with no handler answers nothing, so it fails what the page waits for.
self.addEventListener("unhandledrejection", (event) => {
  self.postMessage({ failed: getErrorMessage(event.reason, true) } satisfies JsTlaResponse);
});
