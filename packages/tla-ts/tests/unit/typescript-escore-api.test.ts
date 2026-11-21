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

// ESCore's evaluation nests deeper than a test's stack, so the API runs on a worker with a 256 MB
// stack. A request compiles with the public compile, or on ESCore
// from a realm that Node recorded and that went through JSON, as a browser reads it.
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
    import(workerData.source + "/typescript/spec/api.ts"),
    import(workerData.source + "/typescript/spec/library.ts"),
    import(workerData.source + "/typescript/spec/prepare.ts"),
    import(workerData.source + "/typescript/spec/realm.ts"),
  ]);
  let recorded;
  const getRecorded = (modules) => {
    const [, , , , , library, prepare, realm] = modules;
    if (recorded === undefined) {
      const files = library.readEscoreFiles(workerData.directory);
      const host = { files, realm: realm.recordHostRealm(library.createLibrary(files)) };
      recorded = prepare.prepareHostRuntime(JSON.parse(JSON.stringify(host)));
    }
    return recorded;
  };
  parentPort.on("message", async (request) => {
    const modules = await loading;
    const [compile, parallel, values, errors, api] = modules;
    const options = { source: request.source, fileName: request.fileName };
    try {
      const spec = request.isRecorded
        ? api.compileEscore(options, getRecorded(modules))
        : await compile.compile(options);
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

const getOutcome = (source: string, fileName: string, isRecorded = false) =>
  new Promise<Outcome>((resolve) => {
    worker.postMessage({ id: pending.length, source, fileName, isRecorded });
    pending.push(resolve);
  });

// The worker prepares ESCore's runtime before the first check, which takes longer than a check.
beforeAll(
  () => Promise.all([getOutcome("", "empty.ts"), getOutcome("", "empty.ts", true)]),
  120_000,
);

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

describe("compile and check a script as Node runs it", () => {
  describe("compute what Node computes", () => {
    const getSource = (expected: string) =>
      `const sorted = [3, 1, 2].sort((left, right) => left - right).map((value) => value * 2);\nif (sorted.join() !== "${expected}") throw new Error(sorted.join());\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "sorted.ts": getSource("2,4,6") }, "sorted.ts").status).toBe(0);
      expect(await getOutcome(getSource("2,4,6"), "sorted.ts")).toMatchObject({
        status: "success",
      });
    });

    it("rejects another result", async () => {
      expect(runNode({ "sorted.ts": getSource("2,4,7") }, "sorted.ts").stderr).toContain(
        "Error: 2,4,6",
      );
      const outcome = await getOutcome(getSource("2,4,7"), "sorted.ts");
      expect(outcome.error?.isTlaError).toBe(true);
      expect(getFailure(outcome)).toContain('"2,4,6"');
    });
  });

  describe("fail with the value that a script throws", () => {
    const getSource = (factor: number) => `if (${factor} * 7 === 42) throw 42;\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "thrown.ts": getSource(6) }, "thrown.ts").stderr).toContain("42");
      expect(getFailure(await getOutcome(getSource(6), "thrown.ts"))).toContain('"42"');
    });

    it("rejects another result", async () => {
      expect(runNode({ "thrown.ts": getSource(5) }, "thrown.ts").status).toBe(0);
      expect(await getOutcome(getSource(5), "thrown.ts")).toMatchObject({
        status: "success",
      });
    });
  });

  describe("fail with the value that a script computes and throws", () => {
    const getSource = (factor: number) =>
      `const product = ${factor} * 7;\nif (product === 42) throw product;\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "thrown.ts": getSource(6) }, "thrown.ts").stderr).toContain("42");
      expect(getFailure(await getOutcome(getSource(6), "thrown.ts"))).toContain('"42"');
    });

    it("rejects another result", async () => {
      expect(runNode({ "thrown.ts": getSource(5) }, "thrown.ts").status).toBe(0);
      expect(await getOutcome(getSource(5), "thrown.ts")).toMatchObject({
        status: "success",
      });
    });
  });

  describe("fail where a promise rejects with no handler", () => {
    const getSource = (expected: number) =>
      `Promise.resolve(1).then((value) => {\n  if (value !== ${expected}) throw new Error("unexpected");\n});\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "rejected.ts": getSource(2) }, "rejected.ts").stderr).toContain(
        "Error: unexpected",
      );
      expect(getFailure(await getOutcome(getSource(2), "rejected.ts"))).toContain(
        "A promise rejected with no handler",
      );
    });

    it("rejects another result", async () => {
      expect(runNode({ "rejected.ts": getSource(1) }, "rejected.ts").status).toBe(0);
      expect(getFailure(await getOutcome(getSource(1), "rejected.ts"))).toBeUndefined();
    });
  });

  describe("throw TlaTypeScriptError where tla-ts can't run the program", () => {
    const getSource = (call: string) => `const value = ${call};\nif (value !== 2) throw value;\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "direct.ts": getSource("1 + 1") }, "direct.ts").status).toBe(0);
      expect(await getOutcome(getSource("1 + 1"), "direct.ts")).toMatchObject({
        status: "success",
      });
    });

    it("rejects another result", async () => {
      expect(runNode({ "evaluated.ts": getSource('eval("1 + 1")') }, "evaluated.ts").status).toBe(
        0,
      );
      expect((await getOutcome(getSource('eval("1 + 1")'), "evaluated.ts")).error).toEqual(
        expect.objectContaining({ name: "TlaTypeScriptError", isTlaError: true }),
      );
    });
  });
});

describe("compile and check a model whose actions Node runs", () => {
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

  it("agrees with Node", async () => {
    const outcome = await getOutcome(getSource(3), "counter.ts");
    expect(outcome).toMatchObject({
      status: "invariant-violation",
      name: "bounded",
      trace: [{ count: "0" }, { count: "1" }, { count: "2" }, { count: "3" }],
    });
    expect(replay(getSource(3), outcome.actions ?? [])).toEqual([true, true, true, false]);
  });

  it("rejects another result", async () => {
    expect(await getOutcome(getSource(2), "counter.ts")).toMatchObject({
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

// A browser prepares ESCore's runtime from a realm that Node recorded, which holds no functions of
// the host, so the spec is Node's but where the program asks the host about a locale tag.
describe("compile on ESCore from a recorded realm as from Node's", () => {
  describe("give the spec and the result that Node's realm gives", () => {
    const getSource = (expected: string) =>
      `const entries = Object.entries({ b: 2, a: 1 }).map(([key, value]) => key + value);\nconst text = JSON.stringify(entries);\nif (text !== '${expected}') throw new Error(text);\n`;

    it("agrees with Node", async () => {
      const source = getSource('["b2","a1"]');
      expect(runNode({ "entries.ts": source }, "entries.ts").status).toBe(0);
      const recorded = await getOutcome(source, "entries.ts", true);
      expect(recorded).toEqual(await getOutcome(source, "entries.ts"));
      expect(recorded).toMatchObject({ status: "success" });
    });

    it("rejects another result", async () => {
      const source = getSource('["a1","b2"]');
      expect(runNode({ "entries.ts": source }, "entries.ts").stderr).toContain(
        'Error: ["b2","a1"]',
      );
      const recorded = await getOutcome(source, "entries.ts", true);
      expect(recorded).toEqual(await getOutcome(source, "entries.ts"));
      expect(getFailure(recorded)).toContain('[\\"b2\\",\\"a1\\"]');
    });
  });

  describe("answer a locale tag that the realm recorded, and stop at another", () => {
    const getSource = (tag: string, expected: number) =>
      `const supported = Intl.Collator.supportedLocalesOf(["${tag}"]);\nif (supported.length !== ${expected}) throw new Error(String(supported));\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "locale.ts": getSource("en-US", 1) }, "locale.ts").status).toBe(0);
      expect(await getOutcome(getSource("en-US", 1), "locale.ts", true)).toMatchObject({
        status: "success",
      });
      expect(runNode({ "locale.ts": getSource("fy-NL", 1) }, "locale.ts").status).toBe(0);
      expect(await getOutcome(getSource("fy-NL", 1), "locale.ts")).toMatchObject({
        status: "success",
      });
      expect(getFailure(await getOutcome(getSource("fy-NL", 1), "locale.ts", true))).toContain(
        "tla-ts can't",
      );
    });

    it("rejects another result", async () => {
      expect(runNode({ "locale.ts": getSource("en-US", 0) }, "locale.ts").stderr).toContain(
        "Error: en-US",
      );
      expect(getFailure(await getOutcome(getSource("en-US", 0), "locale.ts", true))).toContain(
        '"en-US"',
      );
      expect(getFailure(await getOutcome(getSource("fy-NL", 0), "locale.ts", true))).toContain(
        "tla-ts can't",
      );
    });
  });
});
