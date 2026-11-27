import { spawnSync } from "node:child_process";
import {
  globSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import ts from "@typescript/typescript6";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { createLibrary, readJsTlaFiles } from "../../src/typescript/spec/library";
import { recordHostRealm } from "../../src/typescript/spec/realm";

// What a compile and a check of a file give: the check's status, the violated name, the trace's
// states and actions, a failure's message, and how many states the check found, or the named error
// that either throws.
interface Outcome {
  status?: string;
  distinctStates?: number;
  name?: string;
  trace?: Record<string, string>[];
  actions?: string[];
  message?: string;
  regions?: { name: string; start: number; end: number; definitions: string[] }[];
  error?: { name: string; isTlaError: boolean; message: string };
}

// The texts of TypeScript's declaration files, by name, every one of them, as the website bundles
// them.
const getLibraries = () => {
  const directory = dirname(ts.getDefaultLibFilePath({}));
  return readdirSync(directory)
    .filter((fileName) => /^lib\..*\.d\.ts$/.test(fileName))
    .map((fileName) => [fileName, readFileSync(join(directory, fileName), "utf8")] as const);
};

// JS.tla's evaluation nests deeper than a test's stack, so the API runs on a worker with a 256 MB
// stack, or with 8 MB, as the CLI's thread has. A request compiles with the public compile, or on
// JS.tla from a realm that Node recorded and that went through JSON, as a browser reads it, and, as
// in a browser, without Node's built-in modules, which a browser's process, where it has one, lacks.
// On a browser's worker, TypeScript also has no system to read files through, and the compile has
// none of Node's own globals: its process, Buffer, global, and setImmediate.
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
      const files = library.readJsTlaFiles(workerData.directory);
      const host = { files, realm: realm.recordHostRealm(library.createLibrary(files)) };
      recorded = prepare.prepareHostRuntime(JSON.parse(JSON.stringify(host)));
    }
    return recorded;
  };
  parentPort.on("message", async (request) => {
    const modules = await loading;
    const [compile, parallel, values, errors, api, , , , program] = modules;
    const options = { source: request.source, fileName: request.fileName, files: request.files && new Map(request.files) };
    const getBuiltinModule = process.getBuiltinModule;
    const nodeGlobals = Object.fromEntries(["process", "Buffer", "global", "setImmediate", "clearImmediate"].map((name) => [name, globalThis[name]]));
    const setNodeGlobals = (values) => Object.entries(values).forEach(([name, value]) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }));
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
      if (workerData.isBrowser) setNodeGlobals(Object.fromEntries(Object.keys(nodeGlobals).map((name) => [name, undefined])));
      const spec = request.isRecorded
        ? api.compileJsTla(options, runtime, request.isLibraryPassed ? browserLibrary : undefined)
        : await compile.compile(options);
      setNodeGlobals(nodeGlobals);
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
          distinctStates: result.distinctStates,
          regions: spec.regions,
        },
      });
    } catch (error) {
      setNodeGlobals(nodeGlobals);
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
        libraries: isBrowser ? getLibraries() : [],
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
  return (
    source: string,
    fileName: string,
    isRecorded = false,
    isLibraryPassed = true,
    // The files that the compile runs the program on, by absolute path, in place of the host's.
    files?: Record<string, string>,
  ) =>
    new Promise<Outcome>((resolve) => {
      worker.postMessage({
        id: pending.length,
        source,
        fileName,
        isRecorded,
        isLibraryPassed,
        files: files && Object.entries(files),
      });
      pending.push(resolve);
    });
};

const getOutcome = createApi(256);

const getCliStackOutcome = createApi(8);

const getBrowserOutcome = createApi(256, true);

// The worker prepares JS.tla's runtime before the first check, which takes longer than a check.
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

// What Node writes to stderr and the code it exits with as it runs a file, with others beside it,
// in an environment of the variables given.
const runNode = (files: Record<string, string>, entry: string, env = process.env) => {
  const directory = mkdtempSync(join(tmpdir(), "js-tla-api-"));
  Object.entries(files).forEach(([name, text]) => {
    mkdirSync(dirname(join(directory, name)), { recursive: true });
    writeFileSync(join(directory, name), text);
  });
  const result = spawnSync(process.execPath, [join(directory, entry)], { encoding: "utf8", env });
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
      expect(outcome).toMatchObject({ status: "error", distinctStates: 0 });
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

// A browser has no file system, so TypeScript reads a JavaScript model's types, and a module's
// imports resolve, from the one file the page has.
describe("compile a program on a browser's worker, which has no files", () => {
  const getSource = (limit: string) =>
    `${limit}\n\nlet count = 0;\n\nexport const increment = () => {\n  if (count < limit) count += 1;\n};\n\nexport const reset = () => {\n  count = 0;\n};\n\nexport const bounded = () => count <= 2;\n`;

  it("checks a JavaScript model as Node runs it", async () => {
    const source = getSource("const limit = 3;");
    const outcome = await getBrowserOutcome(source, "counter.js", true);
    expect(outcome).toMatchObject({
      status: "invariant-violation",
      name: "bounded",
      trace: [{ count: "0" }, { count: "1" }, { count: "2" }, { count: "3" }],
    });
    const replay = `import * as model from "./counter.js";\nconst held = [model.bounded()];\nfor (const action of ${JSON.stringify(outcome.actions)}) {\n  model[action]();\n  held.push(model.bounded());\n}\nconsole.log(JSON.stringify(held));\n`;
    expect(
      JSON.parse(runNode({ "counter.js": source, "replay.mjs": replay }, "replay.mjs").stdout),
    ).toEqual([true, true, true, false]);
  });

  it("rejects another result of a JavaScript model", async () => {
    expect(
      await getBrowserOutcome(getSource("const limit = 2;"), "counter.js", true),
    ).toMatchObject({ status: "success" });
  });

  // Node fails to load a module whose import names a file it lacks, and tla-ts stops there.
  it("stops at an import of a file it lacks, as Node fails to load it", async () => {
    const source = getSource('import { limit } from "./limit.ts";');
    expect(runNode({ "counter.ts": source }, "counter.ts").stderr).toContain(
      "ERR_MODULE_NOT_FOUND",
    );
    expect(
      runNode({ "counter.ts": source, "limit.ts": "export const limit = 3;\n" }, "counter.ts")
        .status,
    ).toBe(0);
    expect((await getBrowserOutcome(source, "counter.ts", true)).error).toEqual({
      name: "TlaTypeScriptError",
      isTlaError: true,
      message: "counter.ts:1:1 tla-ts can't load the module ./limit.ts",
    });
  });

  it("stops at a require of a file it lacks, as Node fails to load it", async () => {
    const source =
      'const { limit } = require("./limit.cjs");\nif (limit !== 3) throw new Error("limit");\n';
    expect(runNode({ "main.cjs": source }, "main.cjs").stderr).toContain("MODULE_NOT_FOUND");
    expect(
      runNode({ "main.cjs": source, "limit.cjs": "exports.limit = 3;\n" }, "main.cjs").status,
    ).toBe(0);
    expect((await getBrowserOutcome(source, "main.cjs", true)).error).toEqual({
      name: "TlaTypeScriptError",
      isTlaError: true,
      message: "main.cjs:1:27 tla-ts can't load the module ./limit.cjs",
    });
  });

  // TypeScript reads its declaration files through its file system, so a host without one passes
  // their texts.
  it("stops at a model's types without TypeScript's declaration files", async () => {
    const source = getSource("const limit = 3;");
    expect((await getBrowserOutcome(source, "counter.ts", true, false)).error).toEqual({
      name: "TlaTypeScriptError",
      isTlaError: true,
      message:
        "tla-ts can't read TypeScript's declaration files without a file system, so a host without one passes their texts",
    });
    expect(await getBrowserOutcome(source, "counter.ts", true)).toMatchObject({
      status: "invariant-violation",
    });
  });

  it("stops at the import that JSX's calls make", async () => {
    expect(
      (await getBrowserOutcome("export const view = () => <p>hi</p>;\n", "view.tsx", true)).error,
    ).toEqual({
      name: "TlaTypeScriptError",
      isTlaError: true,
      message: "view.tsx:1:1 tla-ts can't load the module react/jsx-runtime",
    });
  });
});

// A browser has no file system, so it passes the files of the packages that a program imports, on
// which the program runs as Node runs it from / in an environment of NODE_ENV=production alone.
describe("run a program on the files that a host passes, as Node runs it on them", () => {
  // The files of a package in a node_modules directory, by their path from the root.
  const getPackageFiles = (name: string, directory: string) =>
    Object.fromEntries(
      globSync("**/*", { cwd: directory, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => {
          const path = join(entry.parentPath, entry.name);
          return [
            `node_modules/${name}/${path.slice(directory.length + 1)}`,
            readFileSync(path, "utf8"),
          ];
        }),
    );
  // The files from the root, at their absolute paths, as a host passes them.
  const getHostFiles = (files: Record<string, string>) =>
    Object.fromEntries(Object.entries(files).map(([name, text]) => [`/${name}`, text]));

  describe("check a React component's model on React's files", () => {
    const REACT = getPackageFiles(
      "react",
      join(import.meta.dirname, "../../../website/node_modules/react"),
    );
    // The view leaves out React's count of the elements that its development build makes, which
    // grows with each render.
    const getSource = (shown: string) =>
      `type Query = "t" | "tl";\nlet query: Query | "" = "";\nlet results: Query | "" = "";\nconst sent = new Set<Query>();\nexport const SearchBox = () => (\n  <label>\n    Search <input value={query} onChange={(event) => type(event.target.value as Query)} />\n    <output>{results}</output>\n  </label>\n);\nexport const type = (text: Query) => {\n  query = text;\n  sent.add(text);\n};\nexport const respond = (text: Query) => {\n  if (!sent.has(text)) return;\n  sent.delete(text);\n  ${shown}\n};\nexport const showsLatest = () => sent.size > 0 || results === query;\n/** @view */\nexport const shown = () => [query, results, [...sent]];\n`;
    // The invariant after each action that Node runs in turn, on the JavaScript that TypeScript
    // writes for the file's JSX, in the environment that a page gives, which loads React's
    // production build.
    const replay = (source: string, actions: string[]) =>
      JSON.parse(
        runNode(
          {
            ...REACT,
            "search-box.mjs": ts.transpileModule(source, {
              fileName: "search-box.tsx",
              compilerOptions: { jsx: ts.JsxEmit.ReactJSX },
            }).outputText,
            "replay.mjs": `import * as model from "./search-box.mjs";\nconst held = [model.showsLatest()];\nfor (const action of ${JSON.stringify(actions)}) {\n  const call = /^(\\w+)\\((.*)\\)$/.exec(action);\n  model[call[1]](...JSON.parse("[" + call[2] + "]"));\n  held.push(model.showsLatest());\n}\nconsole.log(JSON.stringify(held));\n`,
          },
          "replay.mjs",
          { NODE_ENV: "production" },
        ).stdout,
      );

    it("agrees with Node", async () => {
      const source = getSource("results = text;");
      const outcome = await getBrowserOutcome(
        source,
        "search-box.tsx",
        true,
        true,
        getHostFiles(REACT),
      );
      expect(outcome).toMatchObject({
        status: "invariant-violation",
        name: "showsLatest",
        actions: ['type("t")', 'type("tl")', 'respond("tl")', 'respond("t")'],
      });
      expect(replay(source, outcome.actions ?? [])).toEqual([true, true, true, true, false]);
    }, 120_000);

    it("rejects another result", async () => {
      const source = getSource("if (text === query) results = text;");
      expect(
        await getBrowserOutcome(source, "search-box.tsx", true, true, getHostFiles(REACT)),
      ).toMatchObject({ status: "success" });
      expect(replay(source, ['type("t")', 'type("tl")', 'respond("tl")', 'respond("t")'])).toEqual([
        true,
        true,
        true,
        true,
        true,
      ]);
    }, 120_000);
  });

  // A package's exports name a file for each set of conditions, of which Node 26 matches node,
  // import or require, module-sync, node-addons, and default.
  describe("load the file that a package's exports name for Node's conditions", () => {
    const PACKAGE = {
      "node_modules/pick/package.json": JSON.stringify({
        name: "pick",
        exports: {
          ".": { import: "./import.mjs", require: "./require.cjs" },
          "./sub": { browser: "./browser.cjs", node: "./node.cjs", default: "./default.cjs" },
        },
      }),
      "node_modules/pick/import.mjs": 'export const kind = "import";\n',
      "node_modules/pick/require.cjs": 'exports.kind = "require";\n',
      "node_modules/pick/browser.cjs": 'module.exports = "browser";\n',
      "node_modules/pick/node.cjs": 'module.exports = "node";\n',
      "node_modules/pick/default.cjs": 'module.exports = "default";\n',
    };
    const SOURCES: Record<string, (expected: string) => string> = {
      "main.mjs": (expected) =>
        `import { kind } from "pick";\nimport sub from "pick/sub";\nconst seen = kind + " " + sub;\nif (seen !== "${expected}") throw new Error(seen);\n`,
      "main.cjs": (expected) =>
        `const seen = require("pick").kind + " " + require("pick/sub");\nif (seen !== "${expected}") throw new Error(seen);\n`,
    };

    it.each([
      ["main.mjs", "import node"],
      ["main.cjs", "require node"],
    ])("loads the files of %s as Node does", async (entry, expected) => {
      const source = SOURCES[entry](expected);
      expect(runNode({ ...PACKAGE, [entry]: source }, entry, {}).status).toBe(0);
      expect(
        await getBrowserOutcome(source, entry, true, true, getHostFiles(PACKAGE)),
      ).toMatchObject({ status: "success" });
    });

    it.each([
      ["main.mjs", "import default", "import node"],
      ["main.cjs", "require browser", "require node"],
    ])("rejects another file of %s", async (entry, expected, seen) => {
      const source = SOURCES[entry](expected);
      expect(runNode({ ...PACKAGE, [entry]: source }, entry, {}).stderr).toContain(
        `Error: ${seen}`,
      );
      expect(
        getFailure(await getBrowserOutcome(source, entry, true, true, getHostFiles(PACKAGE))),
      ).toContain(seen);
    });
  });

  // Node reads a subpath's own key of a package's exports before any pattern, as Solid's exports
  // give the package's index beside patterns of its files.
  describe("load the file of a package's export beside its patterns", () => {
    const PACKAGE = {
      "node_modules/patterned/package.json": JSON.stringify({
        name: "patterned",
        exports: { ".": "./index.js", "./dist/*": "./dist/*" },
      }),
      "node_modules/patterned/index.js": 'export const kind = "index";\n',
      "node_modules/patterned/dist/part.js": 'export const kind = "part";\n',
    };
    const getSource = (specifier: string, expected: string) =>
      `import { kind } from "${specifier}";\nif (kind !== "${expected}") throw new Error(kind);\n`;

    it("agrees with Node", async () => {
      const source = getSource("patterned", "index");
      expect(runNode({ ...PACKAGE, "main.mjs": source }, "main.mjs", {}).status).toBe(0);
      expect(
        await getBrowserOutcome(source, "main.mjs", true, true, getHostFiles(PACKAGE)),
      ).toMatchObject({ status: "success" });
    });

    it("rejects another result", async () => {
      const source = getSource("patterned", "part");
      expect(runNode({ ...PACKAGE, "main.mjs": source }, "main.mjs", {}).stderr).toContain(
        "Error: index",
      );
      expect(
        getFailure(await getBrowserOutcome(source, "main.mjs", true, true, getHostFiles(PACKAGE))),
      ).toContain("index");
    });

    it("stops at a subpath that only a pattern matches", async () => {
      const source = getSource("patterned/dist/part.js", "part");
      expect(runNode({ ...PACKAGE, "main.mjs": source }, "main.mjs", {}).status).toBe(0);
      expect(
        (await getBrowserOutcome(source, "main.mjs", true, true, getHostFiles(PACKAGE))).error,
      ).toEqual({
        name: "TlaTypeScriptError",
        isTlaError: true,
        message:
          "main.mjs:1:22 tla-ts can't resolve patterned/dist/part.js without Node, as /node_modules/patterned/package.json exports patterns, which Node matches the subpath against",
      });
    });
  });

  // The program's process.env holds NODE_ENV=production alone, as a bundler gives a program that
  // it builds for a browser, though the process that compiles it has NODE_ENV=test, which vitest
  // sets, and HOME. A package's index then requires its production build, as React's does.
  describe("read process.env as Node does in a bundler's environment", () => {
    const PACKAGE = {
      "node_modules/build/package.json": JSON.stringify({ name: "build", exports: "./index.js" }),
      "node_modules/build/index.js":
        'module.exports = process.env.NODE_ENV === "production" ? require("./production.js") : require("./development.js");\n',
      "node_modules/build/production.js": 'module.exports = "production";\n',
      "node_modules/build/development.js": 'module.exports = "development";\n',
    };
    const getSource = (expected: string) =>
      `import build from "build";\nconst seen = [process.env.NODE_ENV, process.env.HOME, build].join();\nif (seen !== ${JSON.stringify(expected)}) throw new Error(seen);\n`;
    const ENVIRONMENT = { NODE_ENV: "production" };

    it("agrees with Node", async () => {
      const source = getSource("production,,production");
      expect(runNode({ ...PACKAGE, "env.mjs": source }, "env.mjs", ENVIRONMENT).status).toBe(0);
      expect(await getOutcome(source, "env.mjs", false, true, getHostFiles(PACKAGE))).toMatchObject(
        { status: "success" },
      );
      expect(
        await getBrowserOutcome(source, "env.mjs", true, true, getHostFiles(PACKAGE)),
      ).toMatchObject({ status: "success" });
    });

    it("rejects another result", async () => {
      const source = getSource(",,development");
      expect(runNode({ ...PACKAGE, "env.mjs": source }, "env.mjs", ENVIRONMENT).stderr).toContain(
        "Error: production,,production",
      );
      expect(
        getFailure(await getOutcome(source, "env.mjs", false, true, getHostFiles(PACKAGE))),
      ).toContain("production,,production");
      expect(
        getFailure(await getBrowserOutcome(source, "env.mjs", true, true, getHostFiles(PACKAGE))),
      ).toContain("production,,production");
    });
  });

  // Node loads only the build that a package's index requires for the program's NODE_ENV, as
  // React's index does, so a program runs where the other build requires a file that isn't there.
  describe("load only the build that a package's index requires for NODE_ENV", () => {
    const PACKAGE = {
      "node_modules/build/package.json": JSON.stringify({ name: "build", exports: "./index.js" }),
      "node_modules/build/index.js":
        'if (process.env.NODE_ENV === "production") {\n  module.exports = require("./production.js");\n} else {\n  module.exports = require("./development.js");\n}\n',
      "node_modules/build/production.js": 'module.exports = "production";\n',
      "node_modules/build/development.js":
        'require("./checks.js");\nmodule.exports = "development";\n',
    };
    const getSource = (expected: string) =>
      `const build = require("build");\nif (build !== ${JSON.stringify(expected)}) throw new Error(build);\n`;
    const ENVIRONMENT = { NODE_ENV: "production" };

    it("agrees with Node", async () => {
      const source = getSource("production");
      expect(runNode({ ...PACKAGE, "main.cjs": source }, "main.cjs", ENVIRONMENT).status).toBe(0);
      expect(
        await getBrowserOutcome(source, "main.cjs", true, true, getHostFiles(PACKAGE)),
      ).toMatchObject({ status: "success" });
    });

    it("rejects another result", async () => {
      const source = getSource("development");
      expect(runNode({ ...PACKAGE, "main.cjs": source }, "main.cjs", ENVIRONMENT).stderr).toContain(
        "Error: production",
      );
      expect(
        getFailure(await getBrowserOutcome(source, "main.cjs", true, true, getHostFiles(PACKAGE))),
      ).toContain("production");
    });

    // A file that declares process reads its own, so the program's code reads process.env as it
    // runs, and loads both builds.
    it("stops where a file declares process", async () => {
      const source = `const process = {};\n${getSource("production")}`;
      expect(runNode({ ...PACKAGE, "main.cjs": source }, "main.cjs", ENVIRONMENT).status).toBe(0);
      expect(
        getFailure(await getBrowserOutcome(source, "main.cjs", true, true, getHostFiles(PACKAGE))),
      ).toContain("tla-ts can't load the module ./checks.js");
    });
  });

  // Node reads a package without exports by its main field, which tla-ts doesn't port.
  it("stops at a package that Node reads by its main field", async () => {
    const files = {
      "node_modules/legacy/package.json": JSON.stringify({ name: "legacy", main: "./lib.js" }),
      "node_modules/legacy/lib.js": "module.exports = 1;\n",
    };
    const source = 'import one from "legacy";\nif (one !== 1) throw new Error(String(one));\n';
    expect(runNode({ ...files, "main.mjs": source }, "main.mjs", {}).status).toBe(0);
    expect(
      (await getBrowserOutcome(source, "main.mjs", true, true, getHostFiles(files))).error,
    ).toEqual({
      name: "TlaTypeScriptError",
      isTlaError: true,
      message:
        "main.mjs:1:17 tla-ts can't resolve legacy without Node, as /node_modules/legacy has no exports",
    });
  });

  // TypeScript's program reads the types of the files that a model imports among those that the
  // host passes, as a package's that Node loads.
  describe("check a model whose file imports a package that the host passes", () => {
    const SOURCE = `import { limit } from "limit";\n\nlet count = 0;\n\nexport const increment = () => {\n  if (count < limit) count += 1;\n};\n\nexport const reset = () => {\n  count = 0;\n};\n\nexport const bounded = () => count <= 2;\n`;
    const getFiles = (limit: number) => ({
      "node_modules/limit/package.json": JSON.stringify({ name: "limit", exports: "./limit.js" }),
      "node_modules/limit/limit.js": `export const limit = ${limit};\n`,
    });
    // The invariant after each increment that Node runs in turn from the module's start.
    const replay = (limit: number, increments: number) =>
      JSON.parse(
        runNode(
          {
            ...getFiles(limit),
            "counter.ts": SOURCE,
            "replay.mts": `import * as model from "./counter.ts";\nconst held = [model.bounded()];\nfor (let index = 0; index < ${increments}; index += 1) {\n  model.increment();\n  held.push(model.bounded());\n}\nconsole.log(JSON.stringify(held));\n`,
          },
          "replay.mts",
          {},
        ).stdout,
      );

    it("agrees with Node", async () => {
      const outcome = await getBrowserOutcome(
        SOURCE,
        "counter.ts",
        true,
        true,
        getHostFiles(getFiles(3)),
      );
      expect(outcome).toMatchObject({
        status: "invariant-violation",
        name: "bounded",
        trace: [{ count: "0" }, { count: "1" }, { count: "2" }, { count: "3" }],
      });
      expect(replay(3, (outcome.actions ?? []).length)).toEqual([true, true, true, false]);
    });

    it("rejects another result", async () => {
      expect(
        await getBrowserOutcome(SOURCE, "counter.ts", true, true, getHostFiles(getFiles(2))),
      ).toMatchObject({ status: "success" });
      expect(replay(2, 3)).toEqual([true, true, true, true]);
    });
  });

  // The project of a tsconfig.json among the files that the host passes compiles a file's JSX by
  // its options, as TypeScript writes the JavaScript that Node runs.
  describe("compile a file by the project that the host passes", () => {
    const TSCONFIG = JSON.stringify({
      compilerOptions: { jsx: "react", jsxFactory: "tag", lib: ["ESNext"] },
    });
    const getSource = (expected: string) =>
      `const tag = (name: string) => name;\nconst element = <p />;\nif (element !== "${expected}") throw new Error(String(element));\nexport {};\n`;
    const runTranspiled = (source: string) =>
      runNode(
        {
          "element.mjs": ts.transpileModule(source, {
            fileName: "element.tsx",
            compilerOptions: ts.convertCompilerOptionsFromJson(
              JSON.parse(TSCONFIG).compilerOptions,
              "/",
            ).options,
          }).outputText,
        },
        "element.mjs",
        {},
      );

    it("agrees with Node", async () => {
      expect(runTranspiled(getSource("p")).status).toBe(0);
      expect(
        await getBrowserOutcome(
          getSource("p"),
          "element.tsx",
          true,
          true,
          getHostFiles({ "tsconfig.json": TSCONFIG }),
        ),
      ).toMatchObject({ status: "success" });
    });

    it("rejects another result", async () => {
      expect(runTranspiled(getSource("q")).stderr).toContain("Error: p");
      expect(
        getFailure(
          await getBrowserOutcome(
            getSource("q"),
            "element.tsx",
            true,
            true,
            getHostFiles({ "tsconfig.json": TSCONFIG }),
          ),
        ),
      ).toContain('"p"');
    });
  });

  // A project's options name the declaration files that give the globals of its files, as Set,
  // which the host passes the texts of, as the website bundles every one of them (see
  // typescript-libraries.test.ts for a host that passes too few).
  describe("read a project's declaration files from the texts that the host passes", () => {
    const SOURCE = `const seen = new Set<number>();\n\nexport const add = () => {\n  if (seen.size < 3) seen.add(seen.size);\n};\n\nexport const reset = () => {\n  seen.clear();\n};\n\nexport const small = () => seen.size <= 2;\n`;
    const getTsconfig = (options: string) => `{ "compilerOptions": ${options} }\n`;

    it.each([
      ["the default library of its target", '{ "target": "ES2022" }'],
      ["the libraries that it names", '{ "target": "ES2022", "lib": ["ESNext"] }'],
    ])("agrees with Node on %s", async (_, options) => {
      const node = await getOutcome(SOURCE, "seen.ts");
      expect(node).toMatchObject({ status: "invariant-violation", name: "small" });
      const outcome = await getBrowserOutcome(
        SOURCE,
        "seen.ts",
        true,
        true,
        getHostFiles({ "tsconfig.json": getTsconfig(options) }),
      );
      expect(outcome).toMatchObject({ status: "invariant-violation", name: "small" });
      expect(outcome.trace).toEqual(node.trace);
    });
  });
});

// A browser has no package.json to name a file's type, so a file loads as Node loads one without:
// a .mjs file as an ES module, a .cjs file as CommonJS, and another by its syntax.
describe("load a file on a browser's worker as Node does without a package.json", () => {
  const COMMON_JS =
    'if (typeof module === "undefined" || this !== module.exports) throw new Error("not CommonJS");\n';
  const MODULE = 'if (this !== undefined) throw new Error("not a module");\n';

  it.each([
    ["format.cjs", COMMON_JS],
    ["format.js", COMMON_JS],
    ["format.ts", COMMON_JS],
    ["format.mjs", MODULE],
    ["format.js", `${MODULE}export {};\n`],
  ])("loads %s as Node does", async (fileName, source) => {
    expect(runNode({ [fileName]: source }, fileName).status).toBe(0);
    expect(await getBrowserOutcome(source, fileName, true)).toMatchObject({ status: "success" });
  });

  it.each([
    ["format.mjs", COMMON_JS, "not CommonJS"],
    ["format.js", MODULE, "not a module"],
  ])("rejects another format of %s", async (fileName, source, message) => {
    expect(runNode({ [fileName]: source }, fileName).stderr).toContain(`Error: ${message}`);
    expect(getFailure(await getBrowserOutcome(source, fileName, true))).toContain(message);
  });
});

// A browser prepares JS.tla's runtime from a realm that Node recorded, which holds no functions of
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

describe("compile on JS.tla from a recorded realm as from Node's", () => {
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

  // A script's spec keeps the state that the script ends in, as the CLI's does, so a check finds
  // one state rather than none.
  describe("count the state that a script ends in, as the CLI does", () => {
    const getSource = (expected: number) =>
      `const kind = [0].length - 1;\nif (kind !== ${expected}) throw new RangeError("kind " + kind);\n`;

    it("agrees with the CLI's compile", async () => {
      const outcome = await getOutcome(getSource(0), "ends.js", true);
      expect(outcome).toMatchObject({ status: "success", distinctStates: 1 });
      expect(outcome.distinctStates).toBe(
        (await getOutcome(getSource(0), "ends.js")).distinctStates,
      );
    });

    it("finds no state in a script that throws", async () => {
      expect(runNode({ "ends.js": getSource(1) }, "ends.js").stderr).toContain(
        "RangeError: kind 0",
      );
      expect(await getOutcome(getSource(1), "ends.js", true)).toMatchObject({ distinctStates: 0 });
    });
  });

  // Without a Node to parse a file, as in a browser, tla-ts's port of V8's parser finds its early
  // errors, where TypeScript's checker, which tla-ts ran before, inferred a long chain of JSDoc
  // types past any stack.
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

    it("rejects an early error with V8's message", async () => {
      const source = "let kind = 0;\nlet kind = 1;\n";
      expect(runNode({ "kinds.js": source }, "kinds.js").stderr).toContain(
        "SyntaxError: Identifier 'kind' has already been declared",
      );
      expect(getFailure(await getOutcome(source, "kinds.js", true))).toContain(
        "kinds.js:2:1 SyntaxError: Identifier 'kind' has already been declared",
      );
    });

    // On the CLI's stack, TypeScript's checker ran out of stack on a chain of ten thousand types,
    // which V8's parse reads as comments.
    it("agrees with Node on a chain of ten thousand JSDoc types", async () => {
      const source = `${Array.from({ length: 10000 }, (_, index) => `/** @typedef {Kind${index + 1} | ${index}} Kind${index} */`).join("\n")}\n/** @typedef {10000} Kind10000 */\n/** @type {Kind0} */\nconst kind = [0].length - 1;\n`;
      expect(runNode({ "kinds.js": source }, "kinds.js").status).toBe(0);
      expect(await getCliStackOutcome(source, "kinds.js", true)).toMatchObject({
        status: "success",
      });
    }, 120_000);
  });

  // Under Bun, which records no host, the API compiles with a realm that Node recorded and that
  // went through JSON, and with no Node to resolve a specifier, as on the website: a relative
  // import that names its file loads it, as Node does, and any other stops, where Node may load
  // another file or none, as for an extensionless name or a .js name of a TypeScript file.
  describe("resolve an import under Bun, without Node's resolution, as Node would or stop", () => {
    const directory = mkdtempSync(join(tmpdir(), "js-tla-api-bun-"));
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
      const jsTlaFiles = readJsTlaFiles(join(import.meta.dirname, "../../ecmascript"));
      writeFileSync(
        join(directory, "host.json"),
        JSON.stringify({ files: jsTlaFiles, realm: recordHostRealm(createLibrary(jsTlaFiles)) }),
      );
      writeFileSync(
        join(directory, "run.ts"),
        `import { readFileSync } from "node:fs";
import { compileJsTla } from "${source}/typescript/spec/api.ts";
import { prepareHostRuntime } from "${source}/typescript/spec/prepare.ts";
import { check } from "${source}/parallel.ts";
const runtime = prepareHostRuntime(JSON.parse(readFileSync(process.argv[2], "utf8")));
const outcomes = {};
for (const fileName of process.argv.slice(3)) {
  try {
    const spec = compileJsTla({ source: readFileSync(fileName, "utf8"), fileName }, runtime);
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
