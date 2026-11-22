import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

// What a compile and a check of a file on ESCore give: the program's code and config, the check's
// status and trace, and a failure's message, or the error that either throws.
interface Outcome {
  code?: string;
  config?: string;
  status?: string;
  trace?: Record<string, string>[];
  message?: string;
}

// HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
const REGISTER = `const { register } = require("node:module");
  register("data:text/javascript," + encodeURIComponent(\`export const resolve = (specifier, context, next) =>
    next(specifier, context).catch((error) => (specifier.startsWith(".") ? next(specifier + ".ts", context) : Promise.reject(error)));\`));`;

// A worker that compiles and checks a request's file on ESCore with the runtime that prepare gives
// from its modules, and posts the outcome.
const getChecker = (prepare: string) => `${REGISTER}
  const { parentPort, workerData } = require("node:worker_threads");
  const loading = Promise.all([
    import(workerData.source + "/parallel.ts"),
    import(workerData.source + "/values.ts"),
    import(workerData.source + "/typescript/spec/compile.ts"),
    import(workerData.source + "/typescript/spec/model.ts"),
    import(workerData.source + "/typescript/spec/prepare.ts"),
  ]).then(([parallel, values, compile, model, prepare]) => ({
    parallel, values, compile, model, runtime: (${prepare})(prepare),
  }));
  parentPort.on("message", async (request) => {
    const loaded = await loading;
    try {
      const spec = request.isModel
        ? loaded.model.compileModelToEscore(request.source, request.fileName, loaded.runtime)
        : loaded.compile.compileToEscore(request.source, request.fileName, loaded.runtime);
      const result = await loaded.parallel.check({ ...spec, onPrint: () => {} });
      parentPort.postMessage({ id: request.id, outcome: {
        code: spec.loadModule("ProgramCode"),
        config: spec.config,
        status: result.status,
        trace: result.violation?.trace.map((step) =>
          Object.fromEntries(Object.entries(step.state).map(([key, value]) => [key, loaded.values.formatValue(value)]))),
        message: result.failure?.message,
      } });
    } catch (error) {
      parentPort.postMessage({ id: request.id, outcome: { message: error.message } });
    }
  });`;

const source = pathToFileURL(join(import.meta.dirname, "../../src")).href;
const directory = join(import.meta.dirname, "../../ecmascript");

// Node records the host that a browser prepares ESCore's runtime from, with the runtime's graph, on
// a worker with the stack that test262-engine262 gives ESCore, which starting ESCore's realm needs.
const recordHost = () =>
  new Promise<string>((resolve, reject) => {
    const recorder = new Worker(
      `${REGISTER}
      const { parentPort, workerData } = require("node:worker_threads");
      import(workerData.source + "/typescript/spec/prepare.ts").then((prepare) =>
        parentPort.postMessage(JSON.stringify(prepare.recordEscoreHost(workerData.directory))));`,
      { eval: true, workerData: { source, directory }, resourceLimits: { stackSizeMb: 256 } },
    );
    recorder.once("message", (host: string) => {
      void recorder.terminate();
      resolve(host);
    });
    recorder.once("error", reject);
  });

const createChecker = (prepare: string, stackSizeMb: number, host?: string) => {
  const pending: ((outcome: Outcome) => void)[] = [];
  const checker = new Worker(getChecker(prepare), {
    eval: true,
    workerData: { source, directory, host },
    resourceLimits: { stackSizeMb },
  });
  checker.unref();
  checker.on("message", (response: { id: number; outcome: Outcome }) =>
    pending[response.id](response.outcome),
  );
  return {
    checker,
    getOutcome: (text: string, fileName: string, isModel = false) =>
      new Promise<Outcome>((resolve) => {
        checker.postMessage({ id: pending.length, source: text, fileName, isModel });
        pending.push(resolve);
      }),
  };
};

// The live realm, Node's own, which a worker with ESCore's deep stack prepares.
const live = createChecker("(prepare) => prepare.prepareRuntime(workerData.directory)", 256);
// The recorded host, read from JSON on a worker with the stack of a browser's worker, half a
// megabyte, which only the graph's started realm fits in.
let recorded: ReturnType<typeof createChecker> | undefined;
// The same host in New York's time zone and a German locale, whose runtime the graph still gives.
let zoned: ReturnType<typeof createChecker> | undefined;
beforeAll(async () => {
  const host = await recordHost();
  recorded = createChecker(
    "(prepare) => prepare.prepareHostRuntime(JSON.parse(workerData.host))",
    0.5,
    host,
  );
  const parsed = JSON.parse(host);
  zoned = createChecker(
    "(prepare) => prepare.prepareHostRuntime(JSON.parse(workerData.host))",
    0.5,
    JSON.stringify({
      ...parsed,
      realm: {
        ...parsed.realm,
        locale: "de-DE",
        timeZone: "America/New_York",
        zoneName: " (Nordamerikanische Ostküsten-Normalzeit)",
      },
    }),
  );
  await Promise.all([live.getOutcome("", "empty.ts"), recorded.getOutcome("", "empty.ts")]);
}, 300_000);
afterAll(() =>
  Promise.all([
    live.checker.terminate(),
    recorded?.checker.terminate(),
    zoned?.checker.terminate(),
  ]),
);

const getRecorded = (text: string, fileName: string, isModel = false) =>
  recorded?.getOutcome(text, fileName, isModel) ?? Promise.reject(new Error("no recorded host"));

// What Node writes to stderr and the code it exits with as it runs a file.
const runNode = (text: string, fileName: string) => {
  const path = join(mkdtempSync(join(tmpdir(), "escore-realm-")), fileName);
  writeFileSync(path, text);
  const result = spawnSync(process.execPath, [path], { encoding: "utf8" });
  rmSync(join(path, ".."), { recursive: true });
  return { status: result.status, stderr: result.stderr };
};

describe("prepare ESCore's runtime from a recorded host as from Node's realm", () => {
  describe("give a script the spec and the result that Node's realm gives", () => {
    const getSource = (expected: string) =>
      `const entries = Object.entries({ b: 2, a: 1 }).map(([key, value]) => key + value);\nconst text = JSON.stringify([...new Set(entries)]);\nif (text !== '${expected}') throw new Error(text);\n`;

    it("agrees with Node", async () => {
      const text = getSource('["b2","a1"]');
      expect(runNode(text, "entries.ts").status).toBe(0);
      const outcome = await getRecorded(text, "entries.ts");
      expect(outcome).toEqual(await live.getOutcome(text, "entries.ts"));
      expect(outcome.status).toBe("success");
    });

    it("rejects another result", async () => {
      const text = getSource('["a1","b2"]');
      expect(runNode(text, "entries.ts").stderr).toContain('Error: ["b2","a1"]');
      const outcome = await getRecorded(text, "entries.ts");
      expect(outcome).toEqual(await live.getOutcome(text, "entries.ts"));
      expect(outcome.message).toContain("the script threw an exception");
    });
  });

  describe("give a model the trace that Node's realm gives", () => {
    const getSource = (limit: number) =>
      `let count = 0;\n\nexport const increment = () => {\n  if (count < ${limit}) count += 1;\n};\n\nexport const reset = () => {\n  count = 0;\n};\n\nexport const bounded = () => count <= 2;\n`;

    it("agrees with Node", async () => {
      const outcome = await getRecorded(getSource(2), "counter.ts", true);
      expect(outcome).toEqual(await live.getOutcome(getSource(2), "counter.ts", true));
      expect(outcome.status).toBe("success");
    });

    it("rejects another result", async () => {
      const outcome = await getRecorded(getSource(3), "counter.ts", true);
      expect(outcome).toEqual(await live.getOutcome(getSource(3), "counter.ts", true));
      expect(outcome).toMatchObject({
        status: "invariant-violation",
        trace: [{ count: "0" }, { count: "1" }, { count: "2" }, { count: "3" }],
      });
    });
  });

  // A recorded realm holds no functions of the host, but the answers of the tags it recorded
  // (RECORDED_LOCALE_TAGS), so a program that asks the host about another tag stops where Node's
  // realm answers.
  const getLocaleSource = (tag: string, expected: number) =>
    `const supported = Intl.Collator.supportedLocalesOf(["${tag}"]);\nif (supported.length !== ${expected}) throw new Error(String(supported));\n`;

  // A program that names an Intl service, such as Collator, has Node's realm answer what the
  // service resolves of its literals (HostIntl), which a recorded realm leaves out, so only a
  // program that names none compiles to the same spec on both.
  const getCanonicalSource = (tag: string, expected: number) =>
    `const canonical = Intl.getCanonicalLocales(["${tag}"]);\nif (canonical.length !== ${expected}) throw new Error(String(canonical));\n`;

  describe("answer a locale tag that the realm recorded", () => {
    it("agrees with Node", async () => {
      const text = getCanonicalSource("en-US", 1);
      expect(runNode(text, "locale.ts").status).toBe(0);
      const outcome = await getRecorded(text, "locale.ts");
      expect(outcome).toEqual(await live.getOutcome(text, "locale.ts"));
      expect(outcome.status).toBe("success");
      const supported = getLocaleSource("en-US", 1);
      expect(runNode(supported, "locale.ts").status).toBe(0);
      const recorded = await getRecorded(supported, "locale.ts");
      const answered = await live.getOutcome(supported, "locale.ts");
      expect([recorded.status, recorded.message]).toEqual([answered.status, answered.message]);
      expect(recorded.status).toBe("success");
    });

    it("rejects another result", async () => {
      const text = getCanonicalSource("en-US", 0);
      expect(runNode(text, "locale.ts").stderr).toContain("Error: en-US");
      const outcome = await getRecorded(text, "locale.ts");
      expect(outcome).toEqual(await live.getOutcome(text, "locale.ts"));
      expect(outcome.message).toContain("the script threw an exception");
      const supported = getLocaleSource("en-US", 0);
      expect(runNode(supported, "locale.ts").stderr).toContain("Error: en-US");
      const recorded = await getRecorded(supported, "locale.ts");
      const answered = await live.getOutcome(supported, "locale.ts");
      expect([recorded.status, recorded.message]).toEqual([answered.status, answered.message]);
      expect(recorded.message).toContain("the script threw an exception");
    });
  });

  describe("stop at a locale tag that the realm didn't record", () => {
    it("agrees with Node", async () => {
      const text = getLocaleSource("fy-NL", 1);
      expect(runNode(text, "locale.ts").status).toBe(0);
      expect((await live.getOutcome(text, "locale.ts")).status).toBe("success");
      expect((await getRecorded(text, "locale.ts")).message).toContain("tla-ts can't");
    });

    it("rejects another result", async () => {
      const text = getLocaleSource("fy-NL", 0);
      expect(runNode(text, "locale.ts").stderr).toContain("Error: fy-NL");
      expect((await live.getOutcome(text, "locale.ts")).message).toContain(
        "the script threw an exception",
      );
      expect((await getRecorded(text, "locale.ts")).message).toContain("tla-ts can't");
    });
  });

  // Nor does it answer what the host's Intl formats of the program's literals, or how its
  // Date.parse reads a date string outside ECMA-262's formats.
  describe("stop where the program formats through the host's Intl", () => {
    const getSource = (expected: string) =>
      `const formatted = new Intl.NumberFormat("en-US").format(1234.5);\nif (formatted !== "${expected}") throw new Error(formatted);\n`;

    it("agrees with Node", async () => {
      expect(runNode(getSource("1,234.5"), "intl.ts").status).toBe(0);
      expect((await live.getOutcome(getSource("1,234.5"), "intl.ts")).status).toBe("success");
      expect((await getRecorded(getSource("1,234.5"), "intl.ts")).message).toContain(
        "tla-ts can't",
      );
    });

    it("rejects another result", async () => {
      expect(runNode(getSource("1234.5"), "intl.ts").stderr).toContain("Error: 1,234.5");
      expect((await live.getOutcome(getSource("1234.5"), "intl.ts")).message).toContain(
        "the script threw an exception",
      );
      expect((await getRecorded(getSource("1234.5"), "intl.ts")).message).toContain("tla-ts can't");
    });
  });

  describe("stop where the program parses a date string as the host does", () => {
    const getSource = (expected: number) =>
      `const parsed = Date.parse("1970/01/01 00:00:01");\nif (parsed !== ${expected}) throw new Error(String(parsed));\n`;

    it("agrees with Node", async () => {
      expect(runNode(getSource(1000), "date.ts").status).toBe(0);
      expect((await live.getOutcome(getSource(1000), "date.ts")).status).toBe("success");
      expect((await getRecorded(getSource(1000), "date.ts")).message).toContain("tla-ts can't");
    });

    it("rejects another result", async () => {
      expect(runNode(getSource(0), "date.ts").stderr).toContain("Error: 1000");
      expect((await live.getOutcome(getSource(0), "date.ts")).message).toContain(
        "the script threw an exception",
      );
      expect((await getRecorded(getSource(0), "date.ts")).message).toContain("tla-ts can't");
    });
  });

  // The runtime reads the host's time zone and locale from each program's code, so the graph that
  // a build prepared starts the realm on a small stack wherever the host's time zone or locale
  // differs from the build's.
  describe("start the realm that the graph gives in another time zone and locale", () => {
    const getSource = (expected: number) =>
      `const total = [1, 2].length;\nif (total !== ${expected}) throw new Error("total " + total);\n`;
    const getZoned = (text: string, fileName: string) =>
      zoned?.getOutcome(text, fileName) ?? Promise.reject(new Error("no zoned host"));

    it("agrees with Node", async () => {
      expect(runNode(getSource(2), "total.ts").status).toBe(0);
      expect((await getZoned(getSource(2), "total.ts")).status).toBe("success");
    });

    it("rejects another result", async () => {
      expect(runNode(getSource(3), "total.ts").stderr).toContain("Error: total 2");
      expect((await getZoned(getSource(3), "total.ts")).message).toContain(
        "the script threw an exception",
      );
    });

    it("stops where the program reads the local time, as the time zone isn't UTC", async () => {
      expect(
        (await getZoned("const hours = new Date(0).getHours();\n", "hours.ts")).message,
      ).toContain("tla-ts can't tell the host's local time, whose time zone isn't UTC");
    });
  });

  // Node warns where code reads localStorage without --localstorage-file, as it does in every run
  // of the CLI that records Node's realm by reading each global, so tla-ts reads only its
  // descriptor, and a program that reads it stops.
  describe("record Node's realm without reading localStorage", () => {
    it("prints no warning", () => {
      const result = spawnSync(
        process.execPath,
        [
          "-e",
          `${REGISTER}
          Promise.all([import(${JSON.stringify(`${source}/typescript/spec/library.ts`)}), import(${JSON.stringify(`${source}/typescript/spec/realm.ts`)})])
            .then(([library, realm]) => realm.recordHostRealm(library.createLibrary(library.readEscoreFiles(${JSON.stringify(directory)}))))
            .then(() => console.log("recorded"));`,
        ],
        { encoding: "utf8" },
      );
      expect(result.stdout).toBe("recorded\n");
      expect(result.stderr).not.toContain("localStorage");
    });

    it("stops where a program reads it", async () => {
      const text = "const storage = typeof localStorage;\nexport {};\n";
      expect(runNode(text, "storage.mts").stderr).toContain("ExperimentalWarning: localStorage");
      expect((await live.getOutcome(text, "storage.mts")).message).toContain("tla-ts can't");
    });
  });
});

// The recorded graph defers each definition's body until a read of it, which then gives what the
// live runtime parsed, for every definition of the runtime and its extensions.
describe("reads each body of the recorded graph as the live runtime parsed it", () => {
  it("gives every body alike, and the views the live runtime gives", async () => {
    const host = await recordHost();
    const comparer = new Worker(
      `${REGISTER}
      const { parentPort, workerData } = require("node:worker_threads");
      const { isDeepStrictEqual } = require("node:util");
      import(workerData.source + "/typescript/spec/prepare.ts").then((prepare) => {
        const getModules = (runtime) => [
          ...runtime.modules,
          runtime.getView([...runtime.names].join("\\n"), []),
          runtime.getExtension("ESCanonical"),
          runtime.getExtension("ESNative"),
        ].map((prepared) => prepared.module);
        const liveRuntime = prepare.prepareRuntime(workerData.directory);
        const readRuntime = prepare.prepareHostRuntime(JSON.parse(workerData.host));
        const live = getModules(liveRuntime);
        const read = getModules(readRuntime);
        // A view that the recorded tables give is the one the live runtime's text gives.
        const getViewShape = (runtime) => {
          const view = runtime.getView("ToString(x) Completed(x) HeapGet(h, i)", []);
          return [view.text, view.tokens.map((token) => [token.kind, token.text, token.line, token.column]), view.texts];
        };
        const pairs = live.flatMap((module, index) =>
          module.definitions.map((definition, position) => [definition, read[index].definitions[position]]));
        parentPort.postMessage({
          isViewAlike: isDeepStrictEqual(getViewShape(liveRuntime), getViewShape(readRuntime)),
          count: pairs.length,
          different: pairs.filter((pair) => !isDeepStrictEqual(pair[0].body, pair[1]?.body)).map((pair) => pair[0].name),
        });
      });`,
      { eval: true, workerData: { source, directory, host }, resourceLimits: { stackSizeMb: 256 } },
    );
    const compared = await new Promise<{
      isViewAlike: boolean;
      count: number;
      different: string[];
    }>((resolve, reject) => {
      comparer.once("message", resolve);
      comparer.once("error", reject);
    });
    await comparer.terminate();
    expect(compared.different).toEqual([]);
    expect(compared.isViewAlike).toBe(true);
    expect(compared.count).toBeGreaterThan(2500);
  }, 600_000);
});
