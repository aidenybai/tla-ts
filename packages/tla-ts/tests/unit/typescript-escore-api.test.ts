import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import ts from "@typescript/typescript6";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { createLibrary, readEscoreFiles } from "../../src/typescript/spec/library";
import { recordHostRealm } from "../../src/typescript/spec/realm";

// What a compile and a check of a file give: the check's status, the violated name, the trace's
// states and actions, and a failure's message, or the named error that either throws.
interface Outcome {
  status?: string;
  name?: string;
  trace?: Record<string, string>[];
  actions?: string[];
  message?: string;
  regions?: { name: string; start: number; end: number; definitions: string[] }[];
  error?: { name: string; isTlaError: boolean; message: string };
}

// The texts of TypeScript's declaration files that a file's, by name, references, with its own, as
// the website bundles them.
const getLibraries = (fileName: string, libraries: Map<string, string>) => {
  if (libraries.has(fileName)) return libraries;
  const text = readFileSync(join(dirname(ts.getDefaultLibFilePath({})), fileName), "utf8");
  libraries.set(fileName, text);
  for (const match of text.matchAll(/<reference lib="([^"]+)"/g)) {
    getLibraries(`lib.${match[1]}.d.ts`, libraries);
  }
  return libraries;
};

// ESCore's evaluation nests deeper than a test's stack, so the API runs on a worker with a 256 MB
// stack, or with 8 MB, as the CLI's thread has. A request compiles with the public compile, or on
// ESCore from a realm that Node recorded and that went through JSON, as a browser reads it, and, as
// in a browser, without Node's built-in modules, which a browser's process, where it has one, lacks.
// On a browser's worker, TypeScript also has no system to read files through.
const createApi = (stackSizeMb: number, isBrowser = false) => {
  const worker = new Worker(
    `const { register } = require("node:module");
  const { parentPort, workerData } = require("node:worker_threads");
  // HACK: TypeScript leaves out ts.sys where process.browser is set, as in a browser's bundle.
  if (workerData.isBrowser) process.browser = true;
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
    import(workerData.source + "/typescript/program.ts"),
  ]);
  let recorded;
  let browserLibrary;
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
    const [compile, parallel, values, errors, api, , , , program] = modules;
    const options = { source: request.source, fileName: request.fileName };
    const getBuiltinModule = process.getBuiltinModule;
    try {
      // HACK: a browser has no Node to parse a file for its early errors, which tla-ts reaches
      // through process.getBuiltinModule.
      const runtime = request.isRecorded ? getRecorded(modules) : undefined;
      if (request.isRecorded) process.getBuiltinModule = undefined;
      // A browser has no file system to read TypeScript's declaration files from, so the website
      // passes their texts.
      if (workerData.isBrowser && browserLibrary === undefined) {
        browserLibrary = program.createLibrary(new Map(workerData.libraries));
      }
      const spec = request.isRecorded
        ? api.compileEscore(options, runtime, browserLibrary)
        : await compile.compile(options);
      process.getBuiltinModule = getBuiltinModule;
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
          regions: spec.regions,
        },
      });
    } catch (error) {
      process.getBuiltinModule = getBuiltinModule;
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
        isBrowser,
        libraries: isBrowser ? [...getLibraries("lib.esnext.d.ts", new Map())] : [],
      },
      resourceLimits: { stackSizeMb },
    },
  );
  worker.unref();
  afterAll(() => worker.terminate());
  const pending: ((outcome: Outcome) => void)[] = [];
  worker.on("message", (response: { id: number; outcome: Outcome }) =>
    pending[response.id](response.outcome),
  );
  return (source: string, fileName: string, isRecorded = false) =>
    new Promise<Outcome>((resolve) => {
      worker.postMessage({ id: pending.length, source, fileName, isRecorded });
      pending.push(resolve);
    });
};

const getOutcome = createApi(256);

const getCliStackOutcome = createApi(8);

const getBrowserOutcome = createApi(256, true);

// The worker prepares ESCore's runtime before the first check, which takes longer than a check.
beforeAll(
  () =>
    Promise.all([
      getOutcome("", "empty.ts"),
      getOutcome("", "empty.ts", true),
      getBrowserOutcome("", "empty.ts", true),
    ]),
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

    it("agrees with Node on a browser's worker", async () => {
      expect(await getBrowserOutcome(getSource("2,4,6"), "sorted.ts", true)).toMatchObject({
        status: "success",
      });
    });

    it("rejects another result on a browser's worker", async () => {
      expect(getFailure(await getBrowserOutcome(getSource("2,4,7"), "sorted.ts", true))).toContain(
        '"2,4,6"',
      );
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

  // The website compiles on a browser's worker, where TypeScript has no system.
  it("agrees with Node on a browser's worker", async () => {
    const outcome = await getBrowserOutcome(getSource(3), "counter.ts", true);
    expect(outcome).toEqual(await getOutcome(getSource(3), "counter.ts"));
    expect(replay(getSource(3), outcome.actions ?? [])).toEqual([true, true, true, false]);
  });

  it("rejects another result on a browser's worker", async () => {
    expect(await getBrowserOutcome(getSource(2), "counter.ts", true)).toMatchObject({
      status: "success",
    });
  });
});

// A browser prepares ESCore's runtime from a realm that Node recorded, which holds no functions of
// the host, so the spec is Node's but where the program asks the host about a locale tag.
describe("map a file's declarations to the program's code", () => {
  it("gives each top-level declaration its text and the definitions it compiles to", async () => {
    const source =
      "let likes = 0;\n\nexport const like = () => {\n  if (likes < 2) likes += 1;\n};\n\nexport function reset() {\n  likes = 0;\n}\n\nexport const neverNegative = () => likes >= 0;\n";
    const regions = (await getOutcome(source, "likes.ts", true)).regions ?? [];
    expect(
      Object.fromEntries(
        regions.map((region) => [region.name, source.slice(region.start, region.end)]),
      ),
    ).toEqual({
      likes: "let likes = 0;",
      like: "export const like = () => {\n  if (likes < 2) likes += 1;\n};",
      reset: "export function reset() {\n  likes = 0;\n}",
      neverNegative: "export const neverNegative = () => likes >= 0;",
    });
    expect(regions.every((region) => region.definitions.length > 0)).toBe(true);
    const names = regions.flatMap((region) => region.definitions);
    expect(new Set(names).size).toBe(names.length);
  });
});

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

  // Without a Node to parse a file, as in a browser, TypeScript's checks find its early errors,
  // whose inference of a long chain of JSDoc types, as a large program's code makes, can run out
  // of stack, where only V8 could tell.
  describe("check a file's early errors without a Node to parse it", () => {
    const getSource = (expected: number) =>
      `const kind = [0].length - 1;\nif (kind !== ${expected}) throw new RangeError("kind " + kind);\n`;

    it("agrees with Node", async () => {
      expect(runNode({ "kinds.js": getSource(0) }, "kinds.js").status).toBe(0);
      expect(await getOutcome(getSource(0), "kinds.js", true)).toMatchObject({
        status: "success",
      });
    });

    it("rejects another result", async () => {
      expect(runNode({ "kinds.js": getSource(1) }, "kinds.js").stderr).toContain(
        "RangeError: kind 0",
      );
      expect(getFailure(await getOutcome(getSource(1), "kinds.js", true))).toContain('"kind 0"');
    });

    // On the CLI's stack, TypeScript's checker runs out of stack on a chain of ten thousand types.
    it("stops where TypeScript's checks run out of stack", async () => {
      const source = `${Array.from({ length: 10000 }, (_, index) => `/** @typedef {Kind${index + 1} | ${index}} Kind${index} */`).join("\n")}\n/** @typedef {10000} Kind10000 */\n/** @type {Kind0} */\nconst kind = [0].length - 1;\n`;
      expect(getFailure(await getCliStackOutcome(source, "kinds.js", true))).toContain(
        "tla-ts can't tell whether Node rejects a file's syntax without a Node to parse it",
      );
    }, 120_000);
  });

  // Under Bun, which records no host, the API compiles with a realm that Node recorded and that
  // went through JSON, and with no Node to resolve a specifier, as on the website: a relative
  // import that names its file loads it, as Node does, and any other stops, where Node may load
  // another file or none, as for an extensionless name or a .js name of a TypeScript file.
  describe("resolve an import under Bun, without Node's resolution, as Node would or stop", () => {
    const directory = mkdtempSync(join(tmpdir(), "escore-api-bun-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    const files = {
      "two.mjs": "export const two = 2;\n",
      "three.ts": "export const three = 3;\n",
      "named.mjs":
        'import { two } from "./two.mjs";\nif (two !== 2) throw new RangeError("two " + two);\n',
      "wrong.mjs":
        'import { two } from "./two.mjs";\nif (two !== 3) throw new RangeError("two " + two);\n',
      "extensionless.mjs":
        'import { three } from "./three";\nif (three !== 3) throw new Error("three");\n',
      "typescript.mjs":
        'import { three } from "./three.js";\nif (three !== 3) throw new Error("three");\n',
    };
    const source = pathToFileURL(join(import.meta.dirname, "../../src")).href;
    // The outcome of each program, compiled and checked under Bun, by its file's name.
    const outcomes: Record<string, { status: string; message?: string }> = {};
    beforeAll(() => {
      Object.entries(files).forEach((entry) => writeFileSync(join(directory, entry[0]), entry[1]));
      const escoreFiles = readEscoreFiles(join(import.meta.dirname, "../../ecmascript"));
      writeFileSync(
        join(directory, "host.json"),
        JSON.stringify({ files: escoreFiles, realm: recordHostRealm(createLibrary(escoreFiles)) }),
      );
      writeFileSync(
        join(directory, "run.ts"),
        `import { readFileSync } from "node:fs";
import { compileEscore } from "${source}/typescript/spec/api.ts";
import { prepareHostRuntime } from "${source}/typescript/spec/prepare.ts";
import { check } from "${source}/parallel.ts";
const runtime = prepareHostRuntime(JSON.parse(readFileSync(process.argv[2], "utf8")));
const outcomes = {};
for (const fileName of process.argv.slice(3)) {
  try {
    const spec = compileEscore({ source: readFileSync(fileName, "utf8"), fileName }, runtime);
    const result = await check({ ...spec, workers: 1, onPrint: () => {} });
    outcomes[fileName] = { status: result.status, message: result.failure?.message };
  } catch (error) {
    outcomes[fileName] = { status: "stopped", message: String(error?.message ?? error) };
  }
}
console.log(JSON.stringify(outcomes));
`,
      );
      const names = ["named.mjs", "wrong.mjs", "extensionless.mjs", "typescript.mjs"];
      const run = spawnSync(
        "bun",
        [
          join(directory, "run.ts"),
          join(directory, "host.json"),
          ...names.map((name) => join(directory, name)),
        ],
        { encoding: "utf8" },
      );
      Object.entries(JSON.parse(run.stdout) as typeof outcomes).forEach((entry) => {
        outcomes[entry[0].slice(directory.length + 1)] = entry[1];
      });
    }, 300_000);
    const runFile = (name: string) =>
      spawnSync(process.execPath, [join(directory, name)], { encoding: "utf8" });

    it("agrees with Node where the import names its file", () => {
      expect(runFile("named.mjs").status).toBe(0);
      expect(outcomes["named.mjs"]).toMatchObject({ status: "success" });
    });

    it("rejects another result", () => {
      expect(runFile("wrong.mjs").stderr).toContain("RangeError: two 2");
      expect(outcomes["wrong.mjs"].message).toContain('"two 2"');
    });

    it.each(["extensionless.mjs", "typescript.mjs"])(
      "stops at the import of %s, whose file Node doesn't find",
      (name) => {
        expect(runFile(name).stderr).toContain("ERR_MODULE_NOT_FOUND");
        expect(outcomes[name].message).toContain("tla-ts can't load the module ./three");
      },
    );
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
