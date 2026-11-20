import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll } from "vite-plus/test";

// What the public compile gives for a file and what check finds of it, or the error that either
// throws.
export interface Checked {
  name?: string;
  status?: string;
  generatedStates?: number;
  distinctStates?: number;
  depth?: number;
  traceLength?: number;
  violated?: string;
  failure?: string;
  error?: string;
}

// ESCore's evaluation nests deeper than a test's stack, so the public compile runs on a worker
// with the stack that test262-engine262 gives ESCore, which prepares ESCore's runtime once.
const WORKER = `const { register } = require("node:module");
const { parentPort, workerData } = require("node:worker_threads");
// HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
  next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));
// index.ts reaches directories' modules, which the hook doesn't resolve, so compile and check load
// from their own files.
const loading = Promise.all([
  import(workerData.source + "/compile.ts"),
  import(workerData.source + "/parallel.ts"),
]).then(([compile, parallel]) => ({ compile: compile.compile, check: parallel.check }));
parentPort.on("message", async (request) => {
  const loaded = await loading;
  if (request.isExplored) {
    const search = await import(workerData.tests + "/model-bfs.ts");
    try {
      parentPort.postMessage({ id: request.id, checked: await search.exploreModel(request.source, request.fileName) });
    } catch (error) {
      parentPort.postMessage({ id: request.id, checked: { error: error.message } });
    }
    return;
  }
  try {
    const spec = await loaded.compile({ source: request.source, fileName: request.fileName, libraries: request.libraries });
    const result = await loaded.check({ ...spec, onPrint: () => {} });
    parentPort.postMessage({
      id: request.id,
      checked: {
        name: spec.name,
        status: result.status,
        generatedStates: result.generatedStates,
        distinctStates: result.distinctStates,
        depth: result.depth,
        traceLength: result.violation?.trace.length,
        violated: result.violation?.name,
        failure: result.failure?.message,
      },
    });
  } catch (error) {
    parentPort.postMessage({ id: request.id, checked: { error: error.message } });
  }
});`;

const pending: ((checked: Checked) => void)[] = [];
let worker: Worker | undefined;

const getWorker = () => {
  const started =
    worker ??
    new Worker(WORKER, {
      eval: true,
      workerData: {
        source: pathToFileURL(join(import.meta.dirname, "../../src")).href,
        tests: pathToFileURL(import.meta.dirname).href,
      },
      resourceLimits: { stackSizeMb: 256 },
    }).on("message", (response: { id: number; checked: Checked }) =>
      pending[response.id](response.checked),
    );
  if (worker === undefined) started.unref();
  worker = started;
  return started;
};

const post = (request: object) =>
  new Promise<Checked>((resolve) => {
    getWorker().postMessage({ ...request, id: pending.length });
    pending.push(resolve);
  });

// Compiles a file with the public compile, with TypeScript's declaration files where libraries
// gives them, and checks the spec.
export const compileAndCheck = (
  source: string,
  fileName: string,
  libraries?: ReadonlyMap<string, string>,
) => post({ source, fileName, libraries });

// Searches a model's states in Node, as model-bfs.ts does.
export const exploreInNode = (source: string, fileName: string) =>
  post({ source, fileName, isExplored: true });

afterAll(() => worker?.terminate());
