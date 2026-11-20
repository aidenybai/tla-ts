import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

// What a compile and a check of a file give: the check's status, the violated name, the trace's
// states and actions, and a failure's message, or the named error that either throws.
interface Outcome {
  status?: string;
  name?: string;
  trace?: Record<string, string>[];
  actions?: string[];
  message?: string;
  error?: { name: string; isTlaError: boolean; message: string };
}

// ESCore's evaluation nests deeper than a test's stack, so the API runs on a worker with the stack
// that test262-engine262 gives ESCore. A request compiles with the public compile, on today's
// compiler or with TLA_TS_ESCORE.
const worker = new Worker(
  `const { register } = require("node:module");
  const { parentPort, workerData } = require("node:worker_threads");
  // HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
  register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
    next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));
  const loading = Promise.all([
    import(workerData.source + "/compile.ts"),
    import(workerData.source + "/parallel.ts"),
    import(workerData.source + "/values.ts"),
    import(workerData.source + "/errors.ts"),
  ]);
  parentPort.on("message", async (request) => {
    const [compile, parallel, values, errors] = await loading;
    const options = { source: request.source, fileName: request.fileName };
    try {
      if (request.path === "escore") process.env.TLA_TS_ESCORE = "1";
      else delete process.env.TLA_TS_ESCORE;
      const spec = await compile.compile(options);
      const result = await parallel.check({ ...spec, onPrint: () => {} });
      parentPort.postMessage({
        id: request.id,
        outcome: {
          status: result.status,
          name: result.violation?.name,
          trace: result.violation?.trace.map((step) =>
            Object.fromEntries(Object.entries(step.state).map(([key, value]) => [key, values.formatValue(value)])),
          ),
          actions: result.violation?.trace.slice(1).map((step) => step.label?.split(" ")[0]),
          message: result.failure?.message,
        },
      });
    } catch (error) {
      parentPort.postMessage({
        id: request.id,
        outcome: { error: { name: error.constructor.name, isTlaError: error instanceof errors.TlaError, message: error.message } },
      });
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

const pending: ((outcome: Outcome) => void)[] = [];
worker.on("message", (response: { id: number; outcome: Outcome }) =>
  pending[response.id](response.outcome),
);

type Path = "today" | "escore";

const getOutcome = (path: Path, source: string, fileName: string) =>
  new Promise<Outcome>((resolve) => {
    worker.postMessage({ id: pending.length, path, source, fileName });
    pending.push(resolve);
  });

// The worker prepares ESCore's runtime before the first check, which takes longer than a check.
beforeAll(() => getOutcome("escore", "", "empty.ts"), 120_000);

// The message of a run that fails: a check's failure, or the error that its check throws as the
// spec starts, as a spec without variables fails.
const getFailure = (outcome: Outcome) => outcome.message ?? outcome.error?.message;

// What Node writes to stderr and the code it exits with as it runs a file, with others beside it.
const runNode = (files: Record<string, string>, entry: string) => {
  const directory = mkdtempSync(join(tmpdir(), "escore-api-"));
  Object.entries(files).forEach(([name, text]) => writeFileSync(join(directory, name), text));
  const result = spawnSync(process.execPath, [join(directory, entry)], { encoding: "utf8" });
  rmSync(directory, { recursive: true });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

// Each test checks a file with the public compile on today's compiler and on ESCore, and asserts
// both against Node.
const PATHS = ["today", "escore"] as const;

describe("compile and check a script on ESCore as on today's compiler", () => {
  describe("compute what Node computes", () => {
    const getSource = (expected: string) =>
      `const sorted = [3, 1, 2].sort((left, right) => left - right).map((value) => value * 2);\nif (sorted.join() !== "${expected}") throw new Error(sorted.join());\n`;

    it.each(PATHS)("agrees with Node on %s", async (path) => {
      expect(runNode({ "sorted.ts": getSource("2,4,6") }, "sorted.ts").status).toBe(0);
      expect(await getOutcome(path, getSource("2,4,6"), "sorted.ts")).toMatchObject({
        status: "success",
      });
    });

    it.each(PATHS)("rejects another result on %s", async (path) => {
      expect(runNode({ "sorted.ts": getSource("2,4,7") }, "sorted.ts").stderr).toContain(
        "Error: 2,4,6",
      );
      const outcome = await getOutcome(path, getSource("2,4,7"), "sorted.ts");
      expect(outcome.error?.isTlaError).toBe(true);
      expect(getFailure(outcome)).toContain('"2,4,6"');
    });
  });

  describe("fail with the value that a script throws", () => {
    const getSource = (factor: number) => `if (${factor} * 7 === 42) throw 42;\n`;

    it.each(PATHS)("agrees with Node on %s", async (path) => {
      expect(runNode({ "thrown.ts": getSource(6) }, "thrown.ts").stderr).toContain("42");
      expect(getFailure(await getOutcome(path, getSource(6), "thrown.ts"))).toContain('"42"');
    });

    it.each(PATHS)("rejects another result on %s", async (path) => {
      expect(runNode({ "thrown.ts": getSource(5) }, "thrown.ts").status).toBe(0);
      expect(await getOutcome(path, getSource(5), "thrown.ts")).toMatchObject({
        status: "success",
      });
    });
  });

  // Today's compiler fails with the text of the thrown expression, here "product", where Node
  // throws its value.
  describe("fail with the value that a script computes and throws on ESCore", () => {
    const getSource = (factor: number) =>
      `const product = ${factor} * 7;\nif (product === 42) throw product;\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "thrown.ts": getSource(6) }, "thrown.ts").stderr).toContain("42");
      expect(getFailure(await getOutcome("escore", getSource(6), "thrown.ts"))).toContain('"42"');
    });

    it("rejects another result", async () => {
      expect(runNode({ "thrown.ts": getSource(5) }, "thrown.ts").status).toBe(0);
      expect(await getOutcome("escore", getSource(5), "thrown.ts")).toMatchObject({
        status: "success",
      });
    });
  });

  describe("fail where a promise rejects with no handler", () => {
    const getSource = (expected: number) =>
      `Promise.resolve(1).then((value) => {\n  if (value !== ${expected}) throw new Error("unexpected");\n});\n`;

    it.each(PATHS)("agrees with Node on %s", async (path) => {
      expect(runNode({ "rejected.ts": getSource(2) }, "rejected.ts").stderr).toContain(
        "Error: unexpected",
      );
      expect(getFailure(await getOutcome(path, getSource(2), "rejected.ts"))).toContain(
        "A promise rejected with no handler",
      );
    });

    it.each(PATHS)("rejects another result on %s", async (path) => {
      expect(runNode({ "rejected.ts": getSource(1) }, "rejected.ts").status).toBe(0);
      expect(getFailure(await getOutcome(path, getSource(1), "rejected.ts"))).toBeUndefined();
    });
  });

  describe("throw TlaTypeScriptError where tla-ts can't run the program", () => {
    const getSource = (call: string) => `const value = ${call};\nif (value !== 2) throw value;\n`;

    it.each(PATHS)("agrees with Node on %s", async (path) => {
      expect(runNode({ "direct.ts": getSource("1 + 1") }, "direct.ts").status).toBe(0);
      expect(await getOutcome(path, getSource("1 + 1"), "direct.ts")).toMatchObject({
        status: "success",
      });
    });

    it.each(PATHS)("rejects another result on %s", async (path) => {
      expect(runNode({ "evaluated.ts": getSource('eval("1 + 1")') }, "evaluated.ts").status).toBe(
        0,
      );
      expect((await getOutcome(path, getSource('eval("1 + 1")'), "evaluated.ts")).error).toEqual(
        expect.objectContaining({ name: "TlaTypeScriptError", isTlaError: true }),
      );
    });
  });
});

describe("compile and check a model on ESCore as on today's compiler", () => {
  const getSource = (limit: number) =>
    `let count = 0;\n\nexport const increment = () => {\n  if (count < ${limit}) count += 1;\n};\n\nexport const reset = () => {\n  count = 0;\n};\n\nexport const bounded = () => count <= 2;\n`;
  // The invariant after each action that Node runs in turn from the module's start.
  const replay = (source: string, actions: string[]) =>
    JSON.parse(
      runNode(
        {
          "counter.ts": source,
          "replay.mts": `import * as model from "./counter.ts";\nconst held = [model.bounded()];\nfor (const action of ${JSON.stringify(actions)}) {\n  model[action]();\n  held.push(model.bounded());\n}\nconsole.log(JSON.stringify(held));\n`,
        },
        "replay.mts",
      ).stdout,
    );

  it.each(PATHS)("agrees with Node on %s", async (path) => {
    const outcome = await getOutcome(path, getSource(3), "counter.ts");
    expect(outcome).toMatchObject({
      status: "invariant-violation",
      name: "bounded",
      trace: [{ count: "0" }, { count: "1" }, { count: "2" }, { count: "3" }],
    });
    expect(replay(getSource(3), outcome.actions ?? [])).toEqual([true, true, true, false]);
  });

  it.each(PATHS)("rejects another result on %s", async (path) => {
    expect(await getOutcome(path, getSource(2), "counter.ts")).toMatchObject({
      status: "success",
    });
    expect(replay(getSource(2), ["increment", "increment", "increment"])).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});
