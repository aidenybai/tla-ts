import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

interface ModelResult {
  status: string;
  distinct: number;
  generated: number;
  message: string | undefined;
  trace: Record<string, string>[] | undefined;
}

// ESCore's evaluation nests deeper than a test's stack, so checks run on one worker with the
// stack that test262-engine262 gives ESCore, which prepares ESCore's runtime once for them all.
const worker = new Worker(
  `const { register } = require("node:module");
  const { parentPort, workerData } = require("node:worker_threads");
  // HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
  register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
    next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));
  const loading = Promise.all([
    import(workerData.source + "/parallel.ts"),
    import(workerData.source + "/values.ts"),
    import(workerData.source + "/typescript/spec/model.ts"),
    import(workerData.source + "/typescript/spec/prepare.ts"),
  ]).then(([parallel, values, model, prepare]) => ({
    check: parallel.check,
    formatValue: values.formatValue,
    compileModelToEscore: model.compileModelToEscore,
    runtime: prepare.prepareRuntime(workerData.directory),
  }));
  loading.then(() => parentPort.postMessage({ id: -1 }));
  parentPort.on("message", async (spec) => {
    const loaded = await loading;
    try {
      const compiled = loaded.compileModelToEscore(spec.source, spec.fileName, loaded.runtime);
      const result = await loaded.check({
        ...compiled,
        workers: 1,
        onPrint: () => {},
      });
      parentPort.postMessage({
        id: spec.id,
        status: result.status,
        distinct: result.distinctStates,
        generated: result.generatedStates,
        message: result.failure?.message,
        trace: result.violation?.trace.map((step) =>
          Object.fromEntries(Object.entries(step.state).map((entry) => [entry[0], loaded.formatValue(entry[1])])),
        ),
      });
    } catch (error) {
      parentPort.postMessage({ id: spec.id, status: "stopped", message: error.message });
    }
  });`,
  {
    eval: true,
    workerData: {
      source: pathToFileURL(join(import.meta.dirname, "../../src")).href,
      directory: join(import.meta.dirname, "../../ecmascript"),
    },
    resourceLimits: { stackSizeMb: 256 },
  },
);
worker.unref();
afterAll(() => worker.terminate());

const pending: ((result: ModelResult) => void)[] = [];
const ready = new Promise((resolve) => {
  worker.on("message", (result: ModelResult & { id: number }) =>
    result.id === -1 ? resolve(undefined) : pending[result.id](result),
  );
});
// The worker prepares the runtime before the first check, which takes longer than a check.
beforeAll(() => ready, 60_000);

// Checks a module's model on ESCore.
const checkModel = (source: string, fileName = "spec.ts") =>
  new Promise<ModelResult>((resolve) => {
    worker.postMessage({ id: pending.length, source, fileName });
    pending.push(resolve);
  });

const EXAMPLES = join(import.meta.dirname, "../fixtures/typescript/examples");

const getCounts = (result: ModelResult) => [result.status, result.distinct, result.generated];

describe("checks a module's exported functions as a model on ESCore", () => {
  describe("checks the port of DieHard.tla as TLC checks the ESCore model", () => {
    const path = join(EXAMPLES, "die-hard/die-hard.ts");
    const source = readFileSync(path, "utf8");

    it("finds TLC's counterexample, showing the script's variables", async () => {
      const result = await checkModel(source, path);
      expect(getCounts(result)).toEqual(["invariant-violation", 14, 73]);
      expect(result.trace?.map((state) => `${state.big},${state.small}`)).toEqual([
        "0,0",
        "5,0",
        "2,3",
        "2,0",
        "0,2",
        "5,2",
        "4,3",
      ]);
    });

    it("finds none where no state has 4 gallons in the big jug", async () => {
      const result = await checkModel(source.replace("big !== 4", "big !== 6"), path);
      expect(getCounts(result)).toEqual(["success", 16, 97]);
    });
  });

  describe("takes a step on each call that writes the state", () => {
    const getSource = (limit: number) => `
      let isOpen = false;
      let openings = 0;
      export const open = () => {
        if (isOpen || openings >= ${limit}) return;
        isOpen = true;
        openings++;
      };
      export const close = () => {
        if (!isOpen) return;
        isOpen = false;
      };
      export const reopen = () => {
        if (!isOpen) return;
        isOpen = true;
      };
    `;

    it("deadlocks where no call writes, and steps where one writes what it holds", async () => {
      expect(getCounts(await checkModel(getSource(2)))).toEqual(["deadlock", 5, 7]);
    });

    it("reaches more states under a higher limit", async () => {
      expect(getCounts(await checkModel(getSource(3)))).toEqual(["deadlock", 7, 10]);
    });
  });
});
