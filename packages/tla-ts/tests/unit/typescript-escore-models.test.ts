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
      const code = compiled.loadModule("ProgramCode");
      // A raw model's steps end in the state they leave, and a compared model's compute the
      // canonical form both natively and with ESCanonical's TLA+, as the module ESCanonicalPlain
      // whose definitions take other names, which tla-ts runs as written, with spec.mutation
      // replaced in it.
      const canonical = compiled.loadModule("ESCanonical");
      const names = [...canonical.matchAll(/^([A-Z]\\w*)(?:\\(.*\\))? ==/gm)].map((match) => match[1]);
      const plain = canonical
        .replace("MODULE ESCanonical", "MODULE ESCanonicalPlain")
        .replace(new RegExp("\\\\b(" + names.join("|") + ")\\\\b", "g"), "Plain$1")
        .replace(spec.mutation?.[0] ?? "", spec.mutation?.[1] ?? "");
      const changed = code.replace(/^StepEnd\\(s\\) == CanonicalState\\((.*)\\)$/m, (line, state) =>
        spec.mode === "raw"
          ? "StepEnd(s) == " + state
          : spec.mode === "compared"
            ? "StepEnd(s) == LET native == CanonicalState(" + state + ") written == PlainCanonicalStateOf(" + state + ", InitialState) IN IF native = written THEN native ELSE Assert(FALSE, \\"the native canonical form differs\\")"
            : line,
      ).replace("\\nEXTENDS ESRuntime, ESCanonical\\n", spec.mode === "compared" ? "\\nEXTENDS ESRuntime, ESCanonical, ESCanonicalPlain\\n" : "\\nEXTENDS ESRuntime, ESCanonical\\n");
      const result = await loaded.check({
        ...compiled,
        loadModule: (name) =>
          name === "ProgramCode" ? changed : name === "ESCanonicalPlain" ? plain : compiled.loadModule(name),
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

// Checks a module's model on ESCore, with its steps' states canonical, raw, or canonical where the
// native canonical form and ESCanonical's TLA+ compare equal.
const checkModel = (
  source: string,
  fileName = "spec.ts",
  mode: "canonical" | "raw" | "compared" = "canonical",
  mutation?: [string, string],
) =>
  new Promise<ModelResult>((resolve) => {
    worker.postMessage({ id: pending.length, source, fileName, mode, mutation });
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

  describe("drops what a step leaves behind and numbers the rest as the heap's graph does", () => {
    const getSource = (bound: number) => `
      /** @noDeadlock */
      let items: number[] = [];
      let steps = 0;
      export const add = (item: 1 | 2) => {
        if (steps >= 2) return;
        items = [...items, item].slice(-1);
        steps++;
      };
      export const isBounded = () => steps <= ${bound};
    `;

    it("merges the states that differ only in the objects a step left behind", async () => {
      expect(getCounts(await checkModel(getSource(2)))).toEqual(["success", 5, 7]);
      expect(getCounts(await checkModel(getSource(2), "spec.ts", "raw"))).toEqual([
        "success",
        7,
        7,
      ]);
    });

    it("shows the arrays of a counterexample as sequences", async () => {
      const result = await checkModel(getSource(1));
      expect(getCounts(result)).toEqual(["invariant-violation", 4, 4]);
      expect(result.trace).toEqual([
        { items: "<<>>", steps: "0" },
        { items: "<<1>>", steps: "1" },
        { items: "<<1>>", steps: "2" },
      ]);
    });
  });

  describe("computes natively the canonical form that ESCanonical's TLA+ defines", () => {
    const source = `
      type Key = "a" | "b";
      let owners = new Map<Key, number[]>();
      let log: { key: Key }[] = [];
      export const own = (key: Key) => {
        if (log.length >= 2) return;
        owners.set(key, [...(owners.get(key) ?? []), log.length]);
        log = [...log, { key }];
      };
      export const drop = (key: Key) => {
        if (!owners.has(key)) return;
        owners.delete(key);
      };
      export const isShort = () => log.length <= LIMIT;
    `;

    it("agrees with the TLA+ in every step", async () => {
      expect(
        getCounts(await checkModel(source.replace("LIMIT", "2"), "spec.ts", "compared")),
      ).toEqual(getCounts(await checkModel(source.replace("LIMIT", "2"))));
    });

    it("tells a TLA+ that numbers the objects otherwise", async () => {
      const result = await checkModel(source.replace("LIMIT", "2"), "spec.ts", "compared", [
        "r.objects + walk.objects + 1",
        "r.objects + walk.objects + 2",
      ]);
      expect(result.message).toContain("the native canonical form differs");
    });
  });
});
