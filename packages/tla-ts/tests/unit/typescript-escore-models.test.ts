import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { exploreInNode } from "./compile-worker";

interface ModelResult {
  status: string;
  distinct: number;
  generated: number;
  message: string | undefined;
  trace: Record<string, string>[] | undefined;
}

// ESCore's evaluation nests deeper than a test's stack, so checks run on one worker with a
// 256 MB stack, which prepares ESCore's runtime once for them all.
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
      const isHeap = spec.mode === "raw" || spec.mode === "compared";
      const compiled = loaded.compileModelToEscore(spec.source, spec.fileName, loaded.runtime, undefined, !isHeap);
      // spec.mutation replaces text in ESCanonicalPlain where the model compares canonical forms,
      // and in the model's code otherwise.
      const isCompared = spec.mode === "compared";
      const isOperators = spec.mode === "operators";
      const mutate = (text, isMutated) =>
        isMutated ? text.replace(spec.mutation?.[0] ?? "", spec.mutation?.[1] ?? "") : text;
      // A mutation runs ESNative's TLA+, which tla-ts otherwise runs natively where it can, as the
      // module ESNativeTla.
      const nativeName = spec.mutation !== undefined && !isCompared && !isOperators ? "ESNativeTla" : "ESNative";
      const code = mutate(compiled.loadModule("ProgramCode"), !isCompared && !isOperators).replace(
        /^(EXTENDS .*)ESNative$/m,
        "$1" + nativeName,
      );
      const native = compiled.loadModule("ESNative") ?? "";
      const nativeTla = mutate(native.replace("MODULE ESNative", "MODULE " + nativeName), !isCompared && !isOperators);
      // The operators mode compares ESNative's operators with their TLA+, as the module
      // ESNativePlain whose definitions take other names, on every argument of a pool.
      const nativeNames = [...native.matchAll(/^([A-Z]\\w*)(?:\\(.*\\))? ==/gm)].map((match) => match[1]);
      const nativePlain = mutate(
        native
          .replace("MODULE ESNative", "MODULE ESNativePlain")
          .replace(new RegExp("\\\\b(" + nativeNames.join("|") + ")\\\\b", "g"), "Plain$1"),
        isOperators,
      );
      // A raw model's steps end in the state they leave, and a compared model's compute the
      // canonical form both natively and with ESCanonical's TLA+, as the module ESCanonicalPlain
      // whose definitions take other names, which tla-ts runs as written, with spec.mutation
      // replaced in it.
      const canonical = compiled.loadModule("ESCanonical");
      const names = [...canonical.matchAll(/^([A-Z]\\w*)(?:\\(.*\\))? ==/gm)].map((match) => match[1]);
      const plain = canonical
        .replace("MODULE ESCanonical", "MODULE ESCanonicalPlain")
        .replace(new RegExp("\\\\b(" + names.join("|") + ")\\\\b", "g"), "Plain$1")
        .replace(isCompared ? (spec.mutation?.[0] ?? "") : "", isCompared ? (spec.mutation?.[1] ?? "") : "");
      const changed = code.replace(/^StepEnd\\(s\\) == CanonicalState\\((.*)\\)$/m, (line, state) =>
        spec.mode === "raw"
          ? "StepEnd(s) == " + state
          : spec.mode === "compared"
            ? "StepEnd(s) == LET native == CanonicalState(" + state + ") written == PlainCanonicalStateOf(" + state + ", InitialState) IN IF native = written THEN native ELSE Assert(FALSE, \\"the native canonical form differs\\")"
            : line,
      // A lowered model's steps run on ESCore and check that each state they lower materializes
      // to the canonical state it lowers, and a native one's that each native call that doesn't
      // bail gives what ESCore's gives.
      ).replace(/^StepEnd\\(s\\) == LowerModel\\(s\\)$/m, (line) =>
        spec.mode === "lowered"
          ? "StepEnd(s) == LET m == LowerModel(s) IN IF CanonicalState(ModelState(m)) = CanonicalState([s EXCEPT !.written = FALSE, !.writeMark = [objects |-> 0, environments |-> 0]]) THEN m ELSE Assert(FALSE, \\"the lowered state materializes to another state\\")"
          : line,
      ).replace(/IF n\\.type = "bail" THEN (\\w+)\\(a\\) ELSE (IF n\\.w THEN \\{n\\.m\\} ELSE \\{\\}|n\\.v = True|TRUE)$/gm, (line, escore, native) =>
        spec.mode === "native"
          ? "LET e == " + escore + "(a) IN IF n.type = \\"bail\\" THEN e ELSE IF e = (" + native + ") THEN e ELSE Assert(FALSE, \\"the native call differs from ESCore's\\")"
          : spec.mode === "lowered"
            ? escore + "(a)"
            : line,
      // A native guard's domain is ESCore's, and in the lowered mode the domain is ESCore's alone.
      ).replace(/^  IF n\\.type # "bail" (.*) THEN (\\{.*\\}) ELSE (\\w+)\\(a\\)$/gm, (line, test, native, escore) =>
        spec.mode === "native"
          ? "  LET domain == " + escore + "(a) IN IF n.type # \\"bail\\" " + test + " THEN IF domain = " + native + " THEN domain ELSE Assert(FALSE, \\"the native call differs from ESCore's\\") ELSE domain"
          : spec.mode === "lowered"
            ? "  " + escore + "(a)"
            : line,
      // A lowered model's lowered converters check that each gives what lowering the objects of
      // its converter gives.
      ).replace(/^LowerConvert(\\d+)\\(x\\) == (.*)$/gm, (line, number, body) =>
        spec.mode === "lowered"
          ? "LowerConvert" + number + "(x) == LET d == (" + body + ") IN LET c == Convert" + number + "(ModelBase, x) IN IF d = LowerValue(c.s, c.v, 0).v THEN d ELSE Assert(FALSE, \\"the lowered converter differs\\")"
          : line,
      ).replace("\\nEXTENDS ESRuntime, ESCanonical", spec.mode === "compared" ? "\\nEXTENDS ESRuntime, ESCanonical, ESCanonicalPlain" : "\\nEXTENDS ESRuntime, ESCanonical")
        .replace(/^(EXTENDS .*)$/m, (line) => (isOperators ? line + ", ESNativePlain" : line))
        .replace(/\\n====\\n$/, isOperators ? "\\n" + spec.operators + "\\n====\\n" : "\\n====\\n");
      // The unprepared mode reads ESCanonical and ESNative as the spec's texts rather than as the
      // runtime prepared them.
      const preparedModules = spec.mode === "unprepared"
        ? compiled.preparedModules.filter((prepared) => prepared.name !== "ESCanonical" && prepared.name !== "ESNative")
        : compiled.preparedModules;
      const result = await loaded.check({
        ...compiled,
        preparedModules,
        loadModule: (name) =>
          name === "ProgramCode"
            ? changed
            : name === "ESCanonicalPlain"
              ? plain
              : name === nativeName
                ? nativeTla
                : name === "ESNativePlain"
                  ? nativePlain
                  : compiled.loadModule(name),
        workers: 1,
        onPrint: () => {},
      });
      parentPort.postMessage({
        id: spec.id,
        status: result.status,
        distinct: result.distinctStates,
        generated: result.generatedStates,
        message: result.failure?.message ?? result.violation?.message,
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

// Checks a module's model on ESCore, with its steps' states lowered where the module lets them,
// raw, canonical where the native canonical form and ESCanonical's TLA+ compare equal, lowered
// where each lowered state materializes to the canonical state it lowers and each lowered
// converter gives what lowering its converter's objects gives, lowered where each native call
// gives what ESCore's gives, or with the assumptions operators, which read ESNative's operators
// and their TLA+ as PlainX.
const checkModel = (
  source: string,
  fileName = "spec.ts",
  mode:
    | "canonical"
    | "raw"
    | "compared"
    | "lowered"
    | "native"
    | "operators"
    | "unprepared" = "canonical",
  mutation?: [string, string],
  operators?: string,
) =>
  new Promise<ModelResult>((resolve) => {
    worker.postMessage({ id: pending.length, source, fileName, mode, mutation, operators });
    pending.push(resolve);
  });

const EXAMPLES = join(import.meta.dirname, "../fixtures/typescript/examples");

const getCounts = (result: ModelResult) => [result.status, result.distinct, result.generated];

describe("checks a module's exported functions as a model on ESCore", () => {
  // A model without state variables or actions has no state, whose invariants TLC checks once, as
  // it checks a spec without variables.
  describe("checks the calls of a model without state", () => {
    const getSource = (expected: number) =>
      `const memo = [1, 2];\nexport const isTotal = () => memo.reduce((sum, value) => sum + value, 0) === ${expected};\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource(3)))).toEqual(["success", 0, 0]);
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource(4))).message).toContain(
        "The invariant of isTotal is equal to FALSE",
      );
    });
  });

  // Each function that a check only calls returns, whatever today's spec names its result.
  describe("checks each call of functions that only return", () => {
    const getSource = (thrown: number) =>
      `export const twice = (n: 0 | 1) => n * 2;\nexport const thrice = (n: 0 | 1) => {\n  if ((n as number) === ${thrown}) throw new Error("thrown");\n  return n * 3;\n};\n`;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(2))).status).toBe("success");
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource(1))).status).toBe("assumption-violation");
    });
  });

  // A parameter whose type has more values than TLC puts in a set, as the compiled glob that
  // Effect's internal glob module matches, takes values tla-ts can't list, and the rest still run.
  describe("calls no function whose parameter has more values than TLC lists", () => {
    const getSource = (thrown: number) =>
      `export const isCode = (codes: [number, number, number, number, number, number, number, number]) => codes.length === 8;\nexport const twice = (n: 0 | 1) => {\n  if ((n as number) === ${thrown}) throw new Error("thrown");\n  return n * 2;\n};\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource(2)))).toEqual(["success", 0, 0]);
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource(1))).status).toBe("assumption-violation");
    });
  });

  // An object's optional field may be missing or held, which the in operator tells apart: the
  // check calls a function with each record of the fields it may hold, where a held field takes
  // undefined too unless the program's options make optional fields exact, as TypeScript reads
  // them, so that a call with { size: undefined } is one Node may make.
  describe("calls a function with each set of an object's optional fields", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-escore-optional-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    // A call that throws is one Node's call would throw too, which the check finds.
    const getSource = (most: number) =>
      `export const hold = (options: { size?: 1 | 2; label?: "a" }) => {\n  if (Object.keys(options).length > ${most}) throw new Error("held");\n  return options.label ?? "none";\n};\nexport const size = (options: { size?: 1 | 2 }) => {\n  if ("size" in options && options.size === undefined) throw new Error("undefined");\n  return "size" in options;\n};\n`;
    const check = (most: number, isExact: boolean) => {
      const project = join(directory, isExact ? "exact" : "loose");
      mkdirSync(project, { recursive: true });
      writeFileSync(
        join(project, "tsconfig.json"),
        JSON.stringify({ compilerOptions: { strict: true, exactOptionalPropertyTypes: isExact } }),
      );
      const path = join(project, `options-${most}.ts`);
      const source = getSource(most);
      writeFileSync(path, source);
      return checkModel(source, path);
    };

    it("agrees with Node where optional fields are exact", async () => {
      expect(getCounts(await check(2, true))).toEqual(["success", 0, 0]);
    });

    it("rejects another result", async () => {
      expect((await check(1, true)).status).toBe("assumption-violation");
    });

    it("calls the function with a field held as undefined where they aren't exact", async () => {
      const result = await check(2, false);
      expect(result.status).toBe("assumption-violation");
      expect(result.message).toContain('"undefined"');
    });
  });

  // A BigInt parameter or state variable takes each BigInt from -3n to 3n, none of which is a
  // number, so a check tells 1n from 1. A parameter of BigInts and numbers mixes values that TLC
  // can't compare, so the check calls no function that takes one, and checks the rest.
  describe("calls a function with each BigInt from -3n to 3n", () => {
    const STATE = `let count!: bigint;\nexport const bump = () => {\n  if (count >= 3n) return;\n  count = count + 1n;\n};\nexport const isSmall = () => typeof count === "bigint" && count <= 3n;\n`;
    const getSource = (thrown: string) =>
      `export const half = (n: bigint) => {\n  if ((n as unknown) === 1 || typeof n !== "bigint" || n === ${thrown}) throw new Error("thrown");\n  return n / 2n;\n};\nexport const either = (n: bigint | number) => {\n  throw new Error("called");\n};\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("4n")))).toEqual(["success", 0, 0]);
    });

    it("keeps a BigInt in the state, lowered or not", async () => {
      expect(getCounts(await checkModel(STATE))).toEqual(["deadlock", 7, 10]);
      expect(getCounts(await checkModel(STATE, "spec.ts", "lowered"))).toEqual(["deadlock", 7, 10]);
    });

    it("tells a lowered converter that flips a BigInt", async () => {
      const result = await checkModel(STATE, "spec.ts", "lowered", [
        "(x) == BigInt(BigIntFromInt(x.bigint))",
        "(x) == BigInt(BigIntFromInt(-x.bigint))",
      ]);
      expect(result.message).toContain("the lowered converter differs");
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource("-3n"))).status).toBe("assumption-violation");
    });

    it("rejects a number in a BigInt's place", async () => {
      const result = await checkModel(getSource("4n"), "spec.ts", "canonical", [
        "BigInt(BigIntFromInt(x.bigint))",
        "IntV(x.bigint)",
      ]);
      expect(result.status).toBe("assumption-violation");
    });
  });

  // A WeakMap in the state keeps the entries whose keys a step can still read, and drops the rest,
  // as the host's collector may, so a step that adds an entry no code can read leaves the state as
  // it was, as bippy's cache of component frames does.
  describe("keeps the entries of a WeakMap that a step can read", () => {
    const getSource = (operator: string) =>
      `const keys = [{}, {}];\nconst cache = new WeakMap<object, number>();\nlet count = 0;\nexport const tick = () => {\n  cache.set({}, count);\n  if (count < 2) {\n    cache.set(keys[count], count);\n    count += 1;\n  }\n};\nexport const isCached = () =>\n  count ${operator} 2 && keys.slice(0, count).every((key, index) => cache.get(key) === index);\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("<=")))).toEqual(["success", 3, 4]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("<")))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await checkModel(getSource("<="), "spec.ts", "compared"))).toEqual([
        "success",
        3,
        4,
      ]);
    });
  });

  // A WeakRef in the state keeps its target where a step can still reach it, and a
  // FinalizationRegistry its callback, as bippy's registry of fibers does. A target that nothing
  // else reaches the host may collect at any time after the step, which a check can't tell, so it
  // stops, as it does where a program registers a target.
  describe("keeps the WeakRefs whose targets a step reaches, and a FinalizationRegistry", () => {
    const getSource = (operator: string, target = "fibers[count]") =>
      `const fibers = [{ id: 1 }, { id: 2 }];\nconst registry = new FinalizationRegistry<number>(() => {});\nconst refs: WeakRef<object>[] = [];\nlet count = 0;\nexport const tick = () => {\n  if (count < 2) {\n    refs.push(new WeakRef(${target}));\n    count += 1;\n  }\n};\nexport const isHeld = () =>\n  count ${operator} 2 &&\n  registry instanceof FinalizationRegistry &&\n  refs.every((ref, index) => ref.deref() === fibers[index]);\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("<=")))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("<")))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await checkModel(getSource("<="), "spec.ts", "compared"))).toEqual([
        "deadlock",
        3,
        3,
      ]);
    });

    it("stops where a WeakRef's target is an object nothing else reaches", async () => {
      expect((await checkModel(getSource("<=", "{}"))).message).toContain(
        "tla-ts can't keep a WeakRef whose target nothing else reaches",
      );
    });
  });

  // A RegExp in the state keeps its pattern, and its lastIndex as a step leaves it, as a module's
  // constant pattern does.
  describe("keeps a RegExp that a step uses", () => {
    const getSource = (operator: string) =>
      `const pattern = /a/g;\nlet count = 0;\nexport const tick = () => {\n  if (count < 2 && pattern.test("aa")) count += 1;\n};\nexport const isSmall = () => count ${operator} 2 && pattern.lastIndex === count;\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("<=")))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("<")))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await checkModel(getSource("<="), "spec.ts", "compared"))).toEqual([
        "deadlock",
        3,
        3,
      ]);
    });
  });

  // A typed array in the state keeps the ArrayBuffer it views, as a module's constant bytes do.
  describe("keeps a typed array that a step writes", () => {
    const getSource = (operator: string) =>
      `const bytes = new Uint8Array(2);\nlet count = 0;\nexport const tick = () => {\n  if (count < 2) {\n    bytes[count] = 1;\n    count += 1;\n  }\n};\nexport const isSmall = () => count ${operator} 2 && bytes[0] + bytes[1] === count;\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("<=")))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("<")))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await checkModel(getSource("<="), "spec.ts", "compared"))).toEqual([
        "deadlock",
        3,
        3,
      ]);
    });
  });

  // A function that ESCore's runtime names an operator after, as Effect's SchemaGetter exports
  // BigInt, gets a name of its own in the spec, which still calls it.
  describe("checks a function named as one of the runtime's operators", () => {
    const getSource = (thrown: number) =>
      `export function BigInt(n: 0 | 1) {\n  if ((n as number) === ${thrown}) throw new Error("thrown");\n  return n;\n}\n`;

    it("agrees with Node", async () => {
      expect((await checkModel(getSource(2))).status).toBe("success");
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource(1))).status).toBe("assumption-violation");
    });
  });

  // A model with state and no action takes no step, so TLC checks no deadlock of it, as a deadlock
  // there tells nothing, as of a library module whose functions tla-ts calls none of as actions.
  describe("checks no deadlock of a model with state and no action", () => {
    const getSource = (operator: string) =>
      `let count = 0;\nexport const isSmall = () => count ${operator} 0;\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("<=")))).toEqual(["success", 1, 1]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("<")))).toEqual(["invariant-violation", 1, 1]);
    });
  });

  // A model with an action keeps the check, even where no call of it ever writes, as a deadlock
  // there is a finding: no step can run.
  describe("checks the deadlock of a model whose action never writes", () => {
    const getSource = (bound: number) =>
      `let count = 0;\nexport const tick = (n: 0 | 1) => {\n  if (n > ${bound} && count < 1) count += 1;\n};\nexport const isSmall = () => count <= 1;\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource(1)))).toEqual(["deadlock", 1, 1]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource(0)))).toEqual(["deadlock", 2, 2]);
    });
  });

  // A variable without an initializer whose type has values TLC can't list, as Solid's
  // SuspenseContext, starts at undefined, as Node starts it.
  describe("starts a variable of a type it can't list at undefined", () => {
    const getSource = (operator: string) =>
      `let handler: (() => number) | undefined;\nlet count = 0;\nexport const tick = () => {\n  if (count < 2) count += handler === undefined ? 1 : handler();\n};\nexport const isSmall = () => count ${operator} 2;\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("<=")))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("<")))).toEqual(["invariant-violation", 3, 3]);
    });
  });

  // A step runs the jobs of a program that names then but not Promise, as Solid's server build
  // does, with the promises' operators that run them.
  describe("settles a step of a program that names then but not Promise", () => {
    const getSource = (limit: number) =>
      `const box = { then: 1 };\nlet count = 0;\nexport const tick = () => {\n  if (count < 2) count += box.then;\n};\nexport const isSmall = () => count < ${limit};\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource(3)))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource(2)))).toEqual(["invariant-violation", 3, 3]);
    });
  });

  // An ES module that reads a host's global that a script's realm lacks, as Solid's build reads
  // queueMicrotask and console, runs as the module it is, where the host's globals are.
  describe("checks an ES module that reads the host's console", () => {
    const getSource = (operator: string) =>
      `let count = 0;\nexport const tick = () => {\n  if (count < 2 && typeof console.warn === "function") count += 1;\n};\nexport const isSmall = () => count ${operator} 2;\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("<="), "spec.mts"))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("<"), "spec.mts"))).toEqual([
        "invariant-violation",
        3,
        3,
      ]);
    });
  });

  // A CommonJS module's functions that its exports name, as exports.tick = tick does, as Solid's
  // CommonJS build exports them, are the model's, which the steps call in Node's wrapper.
  describe("checks the functions that a CommonJS module exports by name", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-escore-commonjs-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    const check = (operator: string, mode?: "compared") => {
      const source = `let count = 0;\nfunction tick() {\n  if (count < 2) count += 1;\n}\nfunction isSmall() {\n  return count ${operator} 2;\n}\nexports.tick = tick;\nexports.isSmall = isSmall;\n`;
      const path = join(directory, `${mode ?? "spec"}-${operator === "<" ? "less" : "most"}.cjs`);
      writeFileSync(path, source);
      return checkModel(source, path, mode);
    };

    it("agrees with Node", async () => {
      expect(getCounts(await check("<="))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await check("<"))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await check("<=", "compared"))).toEqual(["deadlock", 3, 3]);
    });
  });

  // A model whose actions count on without end, and that checks an invariant, checks the states
  // within its bound of steps, so a violation there is the violation, and stops where none is.
  describe("checks a model whose actions count without end within its bound", () => {
    const getSource = (check: string) =>
      `let count = 0;\nexport const tick = () => {\n  count += 1;\n};\nexport const isSmall = () => ${check};\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("count < 3")))).toEqual([
        "invariant-violation",
        4,
        4,
      ]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource("count < 2")))).toEqual([
        "invariant-violation",
        3,
        3,
      ]);
    });

    it("stops where the invariant holds within the bound, never reporting success", async () => {
      const result = await checkModel(getSource("count >= 0"));
      expect(result.status).not.toBe("success");
      expect(result.message).toContain(
        "tla-ts can't check a model whose states never end: an action counts count on at each step",
      );
    });
  });

  // A CommonJS module's require, which a function of it closes over, is in the state, as in Solid's
  // CommonJS build, which refers to nothing but the module's file.
  describe("keeps a CommonJS module's require in the state", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-escore-require-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    const check = (operator: string, mode?: "compared") => {
      const source = `let count = 0;\nfunction tick() {\n  if (count < 2 && typeof require === "function") count += 1;\n}\nfunction isSmall() {\n  return count ${operator} 2;\n}\nexports.tick = tick;\nexports.isSmall = isSmall;\n`;
      const path = join(directory, `${mode ?? "spec"}-${operator === "<" ? "less" : "most"}.cjs`);
      writeFileSync(path, source);
      return checkModel(source, path, mode);
    };

    it("agrees with Node", async () => {
      expect(getCounts(await check("<="))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await check("<"))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await check("<=", "compared"))).toEqual(["deadlock", 3, 3]);
    });
  });

  // Node's util, which a CommonJS module's function closes over, as React's server builds do, is in
  // the state, under a number of no file.
  describe("keeps Node's util in the state", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-escore-util-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    const check = (operator: string, mode?: "compared") => {
      const source = `const util = require("util");\nlet count = 0;\nfunction tick() {\n  if (count < 2 && util.TextEncoder === TextEncoder) count += 1;\n}\nfunction isSmall() {\n  return count ${operator} 2;\n}\nexports.tick = tick;\nexports.isSmall = isSmall;\n`;
      const path = join(directory, `${mode ?? "spec"}-${operator === "<" ? "less" : "most"}.cjs`);
      writeFileSync(path, source);
      return checkModel(source, path, mode);
    };

    it("agrees with Node", async () => {
      expect(getCounts(await check("<="))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await check("<"))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await check("<=", "compared"))).toEqual(["deadlock", 3, 3]);
    });
  });

  // An AsyncLocalStorage that a CommonJS module makes as it loads, as React's server builds do, is
  // in the state.
  describe("keeps an AsyncLocalStorage in the state", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-escore-storage-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    const check = (operator: string, mode?: "compared") => {
      const source = `const storage = new (require("async_hooks").AsyncLocalStorage)();\nlet count = 0;\nfunction tick() {\n  if (count < 2 && typeof storage === "object") count += 1;\n}\nfunction isSmall() {\n  return count ${operator} 2;\n}\nexports.tick = tick;\nexports.isSmall = isSmall;\n`;
      const path = join(directory, `${mode ?? "spec"}-${operator === "<" ? "less" : "most"}.cjs`);
      writeFileSync(path, source);
      return checkModel(source, path, mode);
    };

    it("agrees with Node", async () => {
      expect(getCounts(await check("<="))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await check("<"))).toEqual(["invariant-violation", 3, 3]);
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await check("<=", "compared"))).toEqual(["deadlock", 3, 3]);
    });
  });

  // The handler of the host's proxies keeps its number in a step's state, so a host object that a
  // step makes, such as a TextDecoder, stops where its code uses it, rather than using a program's
  // object that took the handler's number, such as one with a method named get.
  describe("keeps the handler of the host's objects in the state", () => {
    const getSource = (check: string) =>
      `Function.prototype.box = { get: () => "wrong" };\nlet count = 0;\nexport const tick = () => {\n  if (count < 2) count += 1;\n};\nexport const isDecoder = () => ${check};\n`;

    it("agrees with Node", async () => {
      expect(
        getCounts(await checkModel(getSource('typeof new TextDecoder() === "object"'), "spec.mjs")),
      ).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(
        getCounts(
          await checkModel(getSource('typeof new TextDecoder() === "function"'), "spec.mjs"),
        ),
      ).toEqual(["invariant-violation", 1, 1]);
    });

    it("stops where a step reads the TextDecoder that it makes", async () => {
      const result = await checkModel(
        getSource('new TextDecoder().encoding !== "wrong"'),
        "spec.mjs",
      );
      expect(result.status).not.toBe("invariant-violation");
      expect(result.message).toContain("tla-ts can't run the host's TextDecoder");
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(
        getCounts(
          await checkModel(
            getSource('typeof new TextDecoder() === "object"'),
            "spec.mjs",
            "compared",
          ),
        ),
      ).toEqual(["deadlock", 3, 3]);
    });
  });

  // A step that asks whether an object is an AsyncResource, which Node answers, stops rather than
  // catching a throw that Node doesn't make.
  describe("stops where a step uses AsyncResource other than to make its objects", () => {
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-escore-resource-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    const check = (check: string, mode?: "compared") => {
      const source = `const { AsyncResource } = require("async_hooks");\nlet count = 0;\nfunction tick() {\n  if (count < 2) count += 1;\n}\nfunction isPlain() {\n  try {\n    return ${check};\n  } catch {\n    return false;\n  }\n}\nexports.tick = tick;\nexports.isPlain = isPlain;\n`;
      const path = join(directory, `${mode ?? "spec"}-${check.length}.cjs`);
      writeFileSync(path, source);
      return checkModel(source, path, mode);
    };

    it("agrees with Node", async () => {
      expect(getCounts(await check('typeof AsyncResource === "function"'))).toEqual([
        "deadlock",
        3,
        3,
      ]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await check('typeof AsyncResource === "object"'))).toEqual([
        "invariant-violation",
        1,
        1,
      ]);
    });

    it("stops at an instanceof", async () => {
      const result = await check("!(({}) instanceof AsyncResource)");
      expect(result.status).not.toBe("invariant-violation");
      expect(result.message).toContain("tla-ts can't run the host's AsyncResource");
    });

    it("numbers the state natively as ESCanonical does", async () => {
      expect(getCounts(await check('typeof AsyncResource === "function"', "compared"))).toEqual([
        "deadlock",
        3,
        3,
      ]);
    });
  });

  // A step settles the jobs that its program queues, which a program that names then only in a
  // comment queues none of.
  describe("settles a step of a program that queues no jobs", () => {
    const getSource = (limit: number) =>
      `// Each step then counts one more.\nlet count = 0;\nexport const step = () => {\n  if (count < 2) count++;\n};\nexport const isSmall = () => count < ${limit};\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource(3)))).toEqual(["deadlock", 3, 3]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource(2)))).toEqual(["invariant-violation", 3, 3]);
    });
  });

  // A model that imports a file runs as an ES module, with the module it imports beside it. A
  // model without state checks only that its functions' calls return, as today's spec does, which
  // fails as an assumption where one throws.
  describe("checks the exported functions of a model that imports a file", () => {
    const STOPPED_ASSUMPTION = ["assumption-violation", 0, 0];
    const directory = mkdtempSync(join(tmpdir(), "tla-ts-escore-plan-"));
    afterAll(() => rmSync(directory, { recursive: true, force: true }));
    writeFileSync(
      join(directory, "flip.ts"),
      "export const flip = (value: 0 | 1) => (value === 0 ? 1 : 0);\n",
    );
    const check = (body: string) => {
      const source = `import { flip } from "./flip.ts";\n${body}`;
      writeFileSync(join(directory, "model.ts"), source);
      return checkModel(source, join(directory, "model.ts"));
    };

    it("agrees with Node", async () => {
      expect(
        getCounts(
          await check(
            'export const undo = (value: 0 | 1) => {\n  if (flip(flip(value)) !== value) throw new Error("undone");\n  return value;\n};\n',
          ),
        ),
      ).toEqual(["success", 0, 0]);
    });

    it("rejects another result", async () => {
      expect(
        getCounts(
          await check(
            'export const undo = (value: 0 | 1) => {\n  if (flip(value) !== value) throw new Error("undone");\n  return value;\n};\n',
          ),
        ),
      ).toEqual(STOPPED_ASSUMPTION);
    });

    it("fails where a call that only returns throws for a value it takes", async () => {
      const result = await check(
        'export const twice = (value: 0 | 1 | 2) => {\n  if (value === 2) throw new RangeError("two");\n  return flip(flip(value));\n};\n',
      );
      expect(getCounts(result)).toEqual(STOPPED_ASSUMPTION);
    });

    // The module records and the module's environment stay in the state, which the canonical
    // form numbers both natively and in TLA+ alike.
    describe("keeps the state of a module whose step writes it", () => {
      const getBody = (operator: string) =>
        `let count = 0;\nexport const tick = () => {\n  count = count === flip(0) + 1 ? 0 : count + 1;\n};\nexport const isBounded = () => count ${operator} 2;\n`;

      it("agrees with Node", async () => {
        expect(getCounts(await check(getBody("<=")))).toEqual(["success", 3, 4]);
      });

      it("rejects another result", async () => {
        expect(getCounts(await check(getBody("<")))).toEqual(["invariant-violation", 3, 3]);
      });

      it("numbers the state natively as ESCanonical does", async () => {
        const source = `import { flip } from "./flip.ts";\n${getBody("<=")}`;
        writeFileSync(join(directory, "compared.ts"), source);
        expect(
          getCounts(await checkModel(source, join(directory, "compared.ts"), "compared")),
        ).toEqual(["success", 3, 4]);
      });
    });

    // A parameter of a literal's type or undefined takes each value of its set, by the set it's in.
    describe("passes a value of a union with undefined", () => {
      const getBody = (bound: number) =>
        `export const short = (text: "a" | "bb" | undefined) => {\n  if (flip(0) !== 1 || (text !== undefined && text.length >= ${bound})) throw new Error("long");\n  return text;\n};\n`;

      it("agrees with Node", async () => {
        expect(getCounts(await check(getBody(3)))).toEqual(["success", 0, 0]);
      });

      it("rejects another result", async () => {
        expect(getCounts(await check(getBody(2)))).toEqual(STOPPED_ASSUMPTION);
      });
    });

    // A function whose name a definition of the spec may take, as ESCore's do, gets one of its own.
    describe("calls a function whose name TLA+ takes another for", () => {
      const getBody = (operator: string) =>
        `export const Undone = (value: 0 | 1) => {\n  if (flip(${operator}) !== value) throw new Error("undone");\n  return value;\n};\nexport const heap = () => flip(1);\n`;

      it("agrees with Node", async () => {
        expect(getCounts(await check(getBody("flip(value)")))).toEqual(["success", 0, 0]);
      });

      it("rejects another result", async () => {
        expect(getCounts(await check(getBody("value")))).toEqual(STOPPED_ASSUMPTION);
      });
    });

    // A global of the host that ESCore lacks is a built-in that stops where a program calls it,
    // which the state keeps, as it refers to nothing.
    describe("keeps the host's globals that stop where a program calls them", () => {
      const getBody = (operator: string) =>
        `let count = 0;\nconst later = typeof setImmediate;\nexport const tick = () => {\n  if (count < 2 && later === "function") count += flip(0);\n};\nexport const isSmall = () => count ${operator} 2;\n`;

      it("agrees with Node", async () => {
        expect(getCounts(await check(getBody("<=")))).toEqual(["deadlock", 3, 3]);
      });

      it("rejects another result", async () => {
        expect(getCounts(await check(getBody("<")))).toEqual(["invariant-violation", 3, 3]);
      });

      it("numbers the state natively as ESCanonical does", async () => {
        const source = `import { flip } from "./flip.ts";\n${getBody("<=")}`;
        writeFileSync(join(directory, "host.ts"), source);
        expect(getCounts(await checkModel(source, join(directory, "host.ts"), "compared"))).toEqual(
          ["deadlock", 3, 3],
        );
      });
    });

    // The host's console and process, which a module reads, hold built-ins whose data is a value,
    // such as console.createTask's function that runs a task, as bippy's core module reads them.
    describe("keeps the host's console and process", () => {
      const getBody = (operator: string) =>
        `let count = 0;\nconst host = [console, process];\nexport const tick = () => {\n  if (count < 2 && typeof host[0].log === "function") count += flip(0);\n};\nexport const isSmall = () => count ${operator} 2;\n`;

      it("agrees with Node", async () => {
        expect(getCounts(await check(getBody("<=")))).toEqual(["deadlock", 3, 3]);
      });

      it("rejects another result", async () => {
        expect(getCounts(await check(getBody("<")))).toEqual(["invariant-violation", 3, 3]);
      });

      it("numbers the state natively as ESCanonical does", async () => {
        const source = `import { flip } from "./flip.ts";\n${getBody("<=")}`;
        writeFileSync(join(directory, "console.ts"), source);
        expect(
          getCounts(await checkModel(source, join(directory, "console.ts"), "compared")),
        ).toEqual(["deadlock", 3, 3]);
      });
    });

    // A class without a constructor of its own has a built-in one, which holds the class's
    // fields, and which the canonical form numbers natively and in TLA+ alike.
    describe("keeps a class whose constructor is the default one", () => {
      writeFileSync(join(directory, "box.ts"), "export class Box {\n  size = 1;\n}\n");
      const getSource = (operator: string) =>
        `import { Box } from "./box.ts";\nlet made = 0;\nlet last: Box | undefined = undefined;\nexport const make = () => {\n  if (made < 2) {\n    last = new Box();\n    made += last.size;\n  }\n};\nexport const isSmall = () => made ${operator} 2;\n`;
      const checkBox = (operator: string, mode: "canonical" | "compared" = "canonical") => {
        const source = getSource(operator);
        writeFileSync(join(directory, "boxes.ts"), source);
        return checkModel(source, join(directory, "boxes.ts"), mode);
      };

      it("agrees with Node", async () => {
        expect(getCounts(await checkBox("<="))).toEqual(["deadlock", 3, 3]);
      });

      it("rejects another result", async () => {
        expect(getCounts(await checkBox("<"))).toEqual(["invariant-violation", 3, 3]);
      });

      it("numbers the state natively as ESCanonical does", async () => {
        expect(getCounts(await checkBox("<=", "compared"))).toEqual(["deadlock", 3, 3]);
      });
    });

    // A function that a cast gives, and one that a list of the module's names exports.
    describe("calls a function that a cast gives or a list exports", () => {
      const getBody = (operator: string) =>
        `const Undone = ((value: 0 | 1) => {\n  if (flip(${operator}) !== value) throw new Error("undone");\n  return value;\n}) as (value: 0 | 1) => number;\nexport { Undone };\n`;

      it("agrees with Node", async () => {
        expect(getCounts(await check(getBody("flip(value)")))).toEqual(["success", 0, 0]);
      });

      it("rejects another result", async () => {
        expect(getCounts(await check(getBody("value")))).toEqual(STOPPED_ASSUMPTION);
      });
    });

    it("calls none of the functions whose parameters take values it can't list", async () => {
      expect(
        getCounts(
          await check(
            "export const isSame = (get: () => 0 | 1) => flip(get()) === get();\nexport const isFlipped = () => flip(0) === 1;\n",
          ),
        ),
      ).toEqual(["success", 0, 0]);
    });
  });

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

  describe("checks an assumption that reads the state in the initial states only", () => {
    const getSource = (length: number) => `
      interface Box {
        items: number[];
      }
      let state: Box = { items: [] };
      export const add = (value: 0 | 1) => {
        const list = state.items;
        if (list.length < 2) list.push(value);
      };
      /** @assume */
      export const isFresh = () => state.items.length === ${length};
    `;

    it("holds where the initial state satisfies it", async () => {
      expect(getCounts(await checkModel(getSource(0)))).toEqual(["deadlock", 7, 7]);
    });

    it("fails where the initial state doesn't", async () => {
      expect(getCounts(await checkModel(getSource(1)))).toEqual(["invariant-violation", 1, 1]);
    });
  });

  describe("stops where an action counts on forever and the model checks nothing", () => {
    const ENDLESS = "tla-ts can't check a model whose states never end";

    it.each([
      [
        "in a for-in over an object literal with a key",
        "() => { for (const key in { a: 1 }) count++; }",
      ],
      ["by a defaulted parameter of literals", "(amount: 1 | 2 = 1) => { count += amount; }"],
    ])("counting %s", async (_title, action) => {
      const result = await checkModel(`let count = 0;\nexport const step = ${action};\n`);
      expect([result.status, result.message]).toEqual([
        "stopped",
        expect.stringContaining(ENDLESS),
      ]);
    });

    it.each([
      [
        "a for-in over an object literal without a key",
        "() => { for (const key in {}) count++; }",
        1,
      ],
      [
        "a guard that bounds a for-in",
        "() => { if (count < 2) for (const key in { a: 1 }) count++; }",
        3,
      ],
      [
        "a guard that bounds a parameter's count",
        "(amount: 1 | 2 = 1) => { if (count < 4) count += amount; }",
        6,
      ],
    ])("checks the model where %s", async (_title, action, distinct) => {
      const result = await checkModel(`let count = 0;\nexport const step = ${action};\n`);
      expect([result.status, result.distinct]).toEqual(["deadlock", distinct]);
    });
  });

  describe("runs a step that reads a binding of the module's declarations", () => {
    const getSource = (declaration: string) => `
      ${declaration}
      let seen = new Set<number>();
      export const take = () => {
        if (seen.size > 0) return;
        pending.add(1);
        seen = new Set(pending);
      };
    `;

    it("throws where a declare binds nothing, as Node does", async () => {
      const result = await checkModel(getSource("declare const pending: Set<number>;"));
      expect([result.status, result.distinct]).toEqual(["error", 1]);
      expect(result.message).toContain('"pending is not defined"');
    });

    it("takes the step where the module binds it", async () => {
      const result = await checkModel(getSource("const pending = new Set<number>();"));
      expect([result.status, result.distinct]).toEqual(["deadlock", 2]);
    });
  });

  describe("keeps one state for errors that differ only in the calls that made them", () => {
    const getSource = (message: string, isRead = false) => `
      let last: Error | undefined = undefined;
      let text = "";
      let steps = 0;
      export const fail = (n: 1 | 2) => {
        if (steps >= 1) return;
        last = new Error(${message});
        steps++;
      };
      ${isRead ? 'export const read = () => { if (last !== undefined && text === "") text = last.stack ?? ""; };' : ""}
    `;

    it("merges errors made by calls with other arguments", async () => {
      expect(getCounts(await checkModel(getSource('"x"'), "spec.ts", "compared"))).toEqual([
        "deadlock",
        2,
        3,
      ]);
    });

    it("tells apart errors whose messages differ", async () => {
      expect(getCounts(await checkModel(getSource('"x" + n'), "spec.ts", "compared"))).toEqual([
        "deadlock",
        3,
        3,
      ]);
    });

    it("stops where a later step reads such an error's stack", async () => {
      const result = await checkModel(getSource('"x"', true));
      expect(result.message).toContain(
        "tla-ts can't read the stack of an error that a model's earlier step made",
      );
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

  describe("tells no array that a step emptied from one never filled", () => {
    const getSource = (pops: string) => `
      /** @noDeadlock */
      let q: number[] = [];
      export const push = () => {
        if (q.length > 0) return;
        q.push(1);
      };
      export const pop = () => {
        if (q.length === 0) return;
        ${pops};
      };
    `;

    it("merges the state after a shift with the initial one", async () => {
      expect(getCounts(await checkModel(getSource("q.shift()"), "spec.ts", "compared"))).toEqual([
        "success",
        2,
        3,
      ]);
    });

    it("tells a TLA+ that keeps the emptied bucket", async () => {
      const result = await checkModel(getSource("q.shift()"), "spec.ts", "compared", [
        "{c \\in DOMAIN @ : DOMAIN @[c] # {}}",
        "DOMAIN @",
      ]);
      expect(result.message).toContain("the native canonical form differs");
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

  describe("lowers the state out of ESCore's heap, one to one with the canonical heap", () => {
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
      export const isShort = () => log.length <= 2;
    `;

    it("materializes each lowered state to the canonical state it lowers, as TLC counts", async () => {
      const counts = ["deadlock", 17, 19];
      expect(getCounts(await checkModel(source, "spec.ts", "lowered"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a lowering that loses an array's numbers", async () => {
      const result = await checkModel(source, "spec.ts", "lowered", [
        "MaterializeList(s, v.elems) IN NewArray(e.s, e.args)",
        'MaterializeList(s, v.elems) IN NewArray(e.s, SelectSeq(e.args, LAMBDA x : x.type # "number"))',
      ]);
      expect(result.message).toContain("the lowered state materializes to another state");
    });
  });

  describe("lowers the values an initial state chooses without making them on the heap", () => {
    const source = `
      type Key = "a" | "b";
      let slot!: { owner: Key | null; count: 0 | 1 };
      let pair!: [Key, boolean];
      let seen!: Set<Key>;
      let totals!: Map<Key, 0 | 1>;
      export const bump = () => {
        if (slot.count === 1) return;
        slot.count = 1;
      };
      export const isPaired = () => pair.length === 2 && slot.count <= 1;
    `;

    it("gives what lowering the converted objects gives, as TLC counts", async () => {
      const counts = ["deadlock", 864, 891];
      expect(getCounts(await checkModel(source, "spec.ts", "lowered"))).toEqual(counts);
      expect(getCounts(await checkModel(source))).toEqual(counts);
    });

    it("tells a lowered converter that flips a number", async () => {
      const result = await checkModel(source, "spec.ts", "lowered", [
        "(x) == IntV(x)",
        "(x) == IntV(1 - x)",
      ]);
      expect(result.message).toContain("the lowered converter differs");
    });
  });

  describe("checks an invariant's level through the runtime's prepared levels", () => {
    const source = `
      let count = 0;
      export const step = () => {
        if (count < 2) count += 1;
      };
      export const isSmall = () => count <= 2;
    `;

    it("checks a state predicate, as TLC counts", async () => {
      expect(getCounts(await checkModel(source))).toEqual(["deadlock", 3, 3]);
    });

    it("tells an invariant that reads the next state", async () => {
      const result = await checkModel(source, "spec.ts", "canonical", [
        "isSmall == ApplyTo(",
        "isSmall == model' = model /\\ ApplyTo(",
      ]);
      expect(result.message).toContain("The invariant isSmall is not a state predicate");
    });
  });

  describe("computes a model's initial states once, as a constant", () => {
    const source = `
      /** @noDeadlock */
      let count!: 0 | 1 | 2;
      /** @initially */
      export const isSmall = () => count <= 1;
      export const step = () => {
        if (count === 0) return;
        count -= 1;
      };
    `;

    it("starts from each initial state, as TLC counts", async () => {
      expect(getCounts(await checkModel(source))).toEqual(["success", 2, 3]);
    });

    it("tells a constant that drops an initial state", async () => {
      const result = await checkModel(source, "spec.ts", "canonical", [
        "InitialSet == ApplyTo(InitialStates, InitialState)",
        "InitialSet == LET all == ApplyTo(InitialStates, InitialState) IN all \\ {CHOOSE m \\in all : TRUE}",
      ]);
      expect(getCounts(result)).toEqual(["success", 2, 2]);
    });

    it("keeps the initial states that hold each @initially check", async () => {
      const result = await checkModel(source, "spec.ts", "canonical", [
        "InitialHolds(m) ==\n  ",
        "InitialHolds(m) ==\n  TRUE \\/ ",
      ]);
      expect(getCounts(result)).toEqual(["success", 3, 5]);
    });
  });

  describe("runs a lowered model's functions natively, as ESCore runs them", () => {
    const source = `
      type Key = "a" | "b";
      interface Slot {
        owner: Key | null;
        count: number;
      }
      let slot: Slot = { owner: null, count: 0 };
      let queue: Key[] = [];
      let seen = new Set<Key>();
      let totals = new Map<Key, number>();
      const isFree = () => slot.owner === null;
      export const request = (key: Key) => {
        if (queue.length >= 2 || queue.includes(key)) return;
        queue.push(key);
        seen.add(key);
      };
      export const grant = () => {
        if (!isFree() || queue.length === 0 || slot.count >= 3) return;
        slot = { ...slot, owner: queue[0], count: slot.count + 1 };
        queue.shift();
      };
      export const release = () => {
        if (isFree()) return;
        const owner = slot.owner;
        totals.set(owner!, (totals.get(owner!) ?? 0) + 1);
        slot.owner = null;
        seen.delete(owner!);
      };
      export const isBounded = () => slot.count <= 3;
    `;

    it("gives what ESCore gives in every call, as TLC counts", async () => {
      const counts = ["deadlock", 225, 317];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a native shift that drops the last element", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "[c |-> [c EXCEPT !.elems = Tail(@)], v |-> Head(c.elems)]",
        "[c |-> [c EXCEPT !.elems = SubSeq(@, 1, Len(@) - 1)], v |-> Head(c.elems)]",
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });
  });

  describe("drops a native call's writes where it bails, and runs the call on ESCore", () => {
    // The step bails where it adds a number to a string, after it writes count.
    const source = `
      let count = 0;
      let label = "";
      export const step = () => {
        if (count >= 2) return;
        count += 1;
        label = label + count;
      };
      export const isShort = () => label.length < 2;
    `;

    it("agrees with Node", async () => {
      const result = await checkModel(source);
      expect(getCounts(result)).toEqual(["invariant-violation", 3, 3]);
      expect(result.trace?.map((state) => `${state.count},${state.label}`)).toEqual([
        '0,""',
        '1,"1"',
        '2,"12"',
      ]);
    });

    it("rejects another result", async () => {
      const result = await checkModel(source, "spec.ts", "canonical", [
        'ELSE IF op = "+" /\\ a.type = "string" /\\ b.type = "string" THEN Str(a.value \\o b.value)',
        'ELSE IF op = "+" /\\ a.type = "string" THEN Str(a.value \\o <<49>>)',
      ]);
      expect(result.trace?.map((state) => `${state.count},${state.label}`)).toEqual([
        '0,""',
        '1,"1"',
        '2,"11"',
      ]);
    });
  });

  // A function's result that its body just made, which a step stores in the state, a Map's value,
  // or a Set's element, and then changes there, natively. A function that returns its parameter
  // gives the caller the object it was passed, which the state would then hold in two places, as
  // Node holds it, where the check stops rather than keep a copy.
  describe("owns a function's fresh result, and keeps no copy of a returned parameter", () => {
    const source = `
      let current = [0];
      let groups = new Map<number, number[]>();
      let bags = new Set<number[]>();
      const make = (n: number) => [n, n + 1];
      export const reset = (n: 0 | 1) => {
        if (current.length > 2) return;
        current = make(n);
      };
      export const bump = () => {
        if (current.length >= 3) return;
        current.push(7);
      };
      export const group = (key: 0 | 1) => {
        if (groups.has(key)) return;
        groups.set(key, make(key));
      };
      export const bag = () => {
        if (bags.size >= 2) return;
        bags.add([1]);
      };
      export const isBounded = () => current.length <= 3 && bags.size <= 2;
    `;
    const aliased = `
      let current = [0];
      let shadow: number[] = [];
      const identity = (list: number[]) => list;
      export const alias = () => {
        if (shadow.length > 0) return;
        shadow = identity(current);
      };
      export const bump = () => {
        if (current.length >= 3) return;
        current.push(7);
      };
      export const isBounded = () => current.length <= 3;
    `;
    const SHARED =
      "tla-ts can't keep an object that two places hold in a model's lowered state yet";

    it("gives what ESCore gives in every call, with Node's states", async () => {
      const explored = await exploreInNode(source, "spec.ts");
      expect(explored.error).toBeUndefined();
      const counts = [explored.status, explored.distinctStates, explored.generatedStates];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a native Set that merges two arrays made apart", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        'm = "addOwned" -> [c |-> [c EXCEPT !.elems = Append(@, a)], v |-> c]',
        'm = "addOwned" -> [c |-> IF KeyIndex(c.elems, a) # 0 THEN c ELSE [c EXCEPT !.elems = Append(@, a)], v |-> c]',
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });

    it("stops where the state would hold a returned parameter twice", async () => {
      expect((await checkModel(aliased, "spec.ts")).message).toContain(SHARED);
    });

    it("tells a native step that copies the returned parameter", async () => {
      const result = await checkModel(aliased, "spec.ts", "canonical", [
        "LOwn(LValue(",
        "(LValue(",
      ]);
      expect(result.message ?? "").not.toContain(SHARED);
    });
  });

  // Array.prototype.sort of an array the step just made, which tla-ts runs natively as LSort by
  // a - b, b - a, or no comparator: the one result of a stable sort, as ESCore and Node give it,
  // with -0 before or after 0 as they came, and NaN, where a - b isn't consistent, on ESCore.
  describe("sorts a fresh array natively, stably, as ESCore and Node sort it", () => {
    const source = `
      let values: number[] = [];
      let words: string[] = [];
      export const add = (at: 0 | 1 | 2 | 3 | 4) => {
        if (values.length >= 2) return;
        values = [...values, [0, -0, 2, -1.5, 1073741824][at]].sort((left, right) => left - right);
      };
      export const addDown = (at: 0 | 1 | 2) => {
        if (values.length >= 2) return;
        values = [...values, [-0, 0, 1073741823][at]].sort((left, right) => right - left);
      };
      export const say = (word: "b" | "a" | "ab") => {
        if (words.length >= 1) return;
        words = [...words, word].sort();
      };
      export const isShort = () => values.length <= 2 && words.length <= 1;
    `;

    it("gives what ESCore gives in every call, with Node's states", async () => {
      const explored = await exploreInNode(source, "spec.ts");
      expect(explored.error).toBeUndefined();
      const counts = [explored.status, explored.distinctStates, explored.generatedStates];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a native sort that puts equal values in the other order", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "(j < i /\\ ~LSortLess(order, e[i], e[j]))",
        "(j > i /\\ ~LSortLess(order, e[i], e[j]))",
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });

    it("runs a sort of NaN on ESCore, as Node sorts it", async () => {
      const withNaN = `
        let values: number[] = [];
        export const add = (value: 0 | 1 | 2) => {
          if (values.length >= 3) return;
          values = [...values, value === 2 ? NaN : value].sort((left, right) => left - right);
        };
        export const isShort = () => values.length <= 3;
      `;
      const explored = await exploreInNode(withNaN, "spec.ts");
      const counts = [explored.status, explored.distinctStates, explored.generatedStates];
      expect(getCounts(await checkModel(withNaN, "spec.ts", "native"))).toEqual(counts);
    });
  });

  // An object literal of the state's arrays, which a function that only reads its parameter
  // borrows rather than owns, so the call runs natively, and one that a function returns a part
  // of, which it owns, so the call runs on ESCore. Comparing the borrowed array with the state's
  // own, as Node finds them the same object, still bails and runs on ESCore.
  describe("borrows the state's arrays into a literal that a function only reads", () => {
    const source = `
      let cells = [false, false, false];
      let count = 0;
      const isMarked = (box: { cells: boolean[]; count: number }, at: number) =>
        box.cells[at] === true && box.count > 0;
      const isSameList = (box: { cells: boolean[] }, list: boolean[]) => box.cells === list;
      const keep = (box: { cells: boolean[] }) => box.cells;
      export const mark = (at: 0 | 1 | 2) => {
        if (count >= 2) return;
        cells = cells.with(at, true);
        count += 1;
      };
      export const isCounted = () => !isMarked({ cells, count }, 0) || count > 0;
      export const isSame = () => isSameList({ cells }, cells);
      export const isKept = () => keep({ cells }).length === 3;
    `;

    it("gives what ESCore gives in every call, with Node's states", async () => {
      const explored = await exploreInNode(source, "spec.ts");
      expect(explored.error).toBeUndefined();
      const counts = [explored.status, explored.distinctStates, explored.generatedStates];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a native strict equality that calls two arrays different", async () => {
      const result = await checkModel(source, "spec.ts", "canonical", [
        "ELSE IF (LIsPrimitive(a) /\\ IsLComposite(b)) \\/ (IsLComposite(a) /\\ LIsPrimitive(b)) THEN False\n  ELSE LBail",
        "ELSE IF (LIsPrimitive(a) /\\ IsLComposite(b)) \\/ (IsLComposite(a) /\\ LIsPrimitive(b)) THEN False\n  ELSE False",
      ]);
      expect(result.status).toBe("invariant-violation");
    });
  });

  // Array.prototype.with, which tla-ts runs natively as LWith on an index within the array, and on
  // ESCore where with throws a RangeError, at an index past the end, where the check stops as Node
  // throws.
  describe("runs an array's with natively, and on ESCore where it throws, as Node runs it", () => {
    const source = `
      let cells = [false, false, false];
      export const toggle = (index: -1 | 0 | 2) => {
        cells = cells.with(index, !cells[index < 0 ? index + 3 : index]);
      };
      export const isWhole = () => cells.length === 3;
    `;
    const outside = source
      .replace("-1 | 0 | 2", "-1 | 0 | 3")
      .replace("!cells[index < 0 ? index + 3 : index]", "true");

    it("gives what ESCore gives in every call, with Node's states", async () => {
      const explored = await exploreInNode(source, "spec.ts");
      expect(explored.error).toBeUndefined();
      const counts = [explored.status, explored.distinctStates, explored.generatedStates];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    // The runtime prepares ESCanonical and ESNative once, which a check reads as it would parse
    // them, with the same states.
    it("checks alike with ESCanonical and ESNative prepared and parsed", async () => {
      expect(getCounts(await checkModel(source, "spec.ts"))).toEqual(
        getCounts(await checkModel(source, "spec.ts", "unprepared")),
      );
    });

    it("stops where with throws past the end, as Node throws", async () => {
      expect((await exploreInNode(outside, "spec.ts")).status).toBe("error");
      expect((await checkModel(outside, "spec.ts")).message).toContain(
        "tla-ts can't read the message that Node writes for an error it throws",
      );
    });

    it("tells a native with that counts a negative index from the wrong end", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "k == IF i.value.i < 0 THEN n + i.value.i ELSE i.value.i",
        "k == IF i.value.i < 0 THEN n + i.value.i - 1 ELSE i.value.i",
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });

    it("tells a native with that writes past the end instead of throwing", async () => {
      const result = await checkModel(outside, "spec.ts", "canonical", [
        "IN IF k < 0 \\/ k >= n THEN LBail ELSE LArray([c.elems EXCEPT ![k + 1] = v])",
        "IN IF k < 0 THEN LBail ELSE LArray(IF k >= n THEN Append(c.elems, v) ELSE [c.elems EXCEPT ![k + 1] = v])",
      ]);
      expect(result.status).toBe("invariant-violation");
    });
  });

  describe("runs an array's methods with an arrow function natively, as ESCore runs them", () => {
    const source = `
      let cells = [false, false, false];
      let steps = 0;
      export const flip = (index: 0 | 1 | 2) => {
        if (steps >= 3) return;
        cells = cells.map((cell, at) => (at === index ? !cell : cell));
        steps += 1;
      };
      export const isBalanced = () =>
        Array.from({ length: 3 }, (_, at) => at).some((at) =>
          cells.slice(0, at).every((cell) => !cell),
        ) && cells.filter((cell) => cell).length <= steps;
    `;

    it("gives what ESCore gives in every call, as TLC counts", async () => {
      const counts = ["deadlock", 12, 25];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a native filter that keeps what fails", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "LAMBDA i : LTruthy(rs[i])",
        "LAMBDA i : ~LTruthy(rs[i])",
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });
  });

  describe("runs a Map's keys and values, and a function passed by name, natively, as ESCore does", () => {
    const source = `
      type Slot = 1 | 2 | 3;
      const slots = new Set<Slot>([1, 2, 3]);
      let held = new Map<Slot, number>([[1, 0], [2, 0]]);

      const isFull = (count: number) => count >= 2;
      const isLaterFull = (count: number, index: number) => index > 0 && count >= 2;

      export const fill = (slot: Slot) => {
        const count = held.get(slot);
        if (count === undefined) {
          held.set(slot, 0);
          return;
        }
        if (count >= 2) return;
        held.set(slot, count + 1);
      };

      export const drop = (slot: Slot) => {
        if (slot === 1 || !held.has(slot)) return;
        held.delete(slot);
      };

      export const isTyped = () =>
        new Set(held.keys()).isSubsetOf(slots) &&
        held.values().every((count) => count >= 0 && count <= 2) &&
        held.keys().find(() => true) === 1;

      /** @always */
      export const isOrdered = () =>
        held.values().some(isLaterFull) === (held.get(2) === 2 || held.get(3) === 2) &&
        held.values().some(isFull) === [1, 2, 3].some((slot) => held.get(slot as Slot) === 2);
    `;

    it("gives what ESCore gives in every call, as TLC counts", async () => {
      // Slot 1's count, and slots 2 and 3 each absent or at a count, in the order they were added.
      const counts = ["success", 75, 285];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a native values() of a Map that gives its keys", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        '[] v.type = "lmap" -> [type |-> "larray", elems |-> v.vals]',
        '[] v.type = "lmap" -> [type |-> "larray", elems |-> v.keys]',
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });

    it("tells a native keys() of a Map that gives its values", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        '[] v.type = "lmap" -> [type |-> "larray", elems |-> v.keys]',
        '[] v.type = "lmap" -> [type |-> "larray", elems |-> v.vals]',
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });

    it("tells a callback that a native call passes the wrong index", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "F(elems[i], IntV(i - 1))",
        "F(elems[i], IntV(i))",
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });
  });

  // TypeScript's type of a parameter gives the values that a step passes it, as docs/typescript.md
  // lists them. A step keeps the key of the value it was passed, so the model has one state for
  // each value besides the initial one, and an invariant holds where each key is one that the
  // list gives.
  describe("passes a parameter every value of its type", () => {
    const key = (value: unknown) =>
      JSON.stringify(value, (_, inner) =>
        inner instanceof Set
          ? ["set", ...[...inner].sort()]
          : inner instanceof Map
            ? ["map", ...[...inner].sort()]
            : inner,
      );
    const getSource = (type: string, values: unknown[]) => `
      const key = ${key.toString()};
      const listed = new Set<string>(${JSON.stringify(values.map(key))});
      let last = "";
      export const see = (value: ${type}) => {
        last = key(value);
      };
      export const isListed = () => last === "" || listed.has(last);
    `;
    const TYPES: [string, unknown[]][] = [
      ["boolean", [false, true]],
      ['"a" | "b" | null', ["a", "b", null]],
      ["number", [-3, -2, -1, 0, 1, 2, 3]],
      ["string", ["", "a", "b"]],
      [
        "[0 | 1, boolean]",
        [
          [0, false],
          [0, true],
          [1, false],
          [1, true],
        ],
      ],
      [
        "{ a: 0 | 1; b: true }",
        [
          { a: 0, b: true },
          { a: 1, b: true },
        ],
      ],
      ["true[]", [[], [true], [true, true], [true, true, true]]],
      ["Set<0 | 1>", [new Set(), new Set([0]), new Set([1]), new Set([0, 1])]],
      ['Map<"a", 0 | 1>', [new Map(), new Map([["a", 0]]), new Map([["a", 1]])]],
    ];

    it.each(TYPES)("passes each value of %s", async (type, values) => {
      const result = await checkModel(getSource(type, values));
      expect(result.status).not.toBe("invariant-violation");
      expect(result.distinct).toBe(values.length + 1);
    });

    it.each(TYPES)(
      "rejects a list of the values of %s that leaves one out",
      async (type, values) => {
        expect((await checkModel(getSource(type, values.slice(1)))).status).toBe(
          "invariant-violation",
        );
      },
    );

    it("checks the other functions where a parameter's type has values it can't list", async () => {
      const result = await checkModel(`
        let count = 0;
        export const run = (step: () => void) => { step(); count++; };
        export const increment = () => { if (count < 2) count++; };
        export const isBounded = () => count <= 2;
      `);
      expect(result.status).not.toBe("stopped");
      expect(result.status).not.toBe("invariant-violation");
    });
  });

  describe("spreads an array or a Set into an array literal natively, as ESCore does", () => {
    const source = `
      type Key = "a" | "b" | "c";
      let seen = new Set<Key>();
      let order: Key[] = [];
      export const add = (key: Key) => {
        if (order.length >= 2 || seen.has(key)) return;
        seen.add(key);
        order = [...order, key];
      };
      export const isOrdered = () =>
        [...seen].every((key) => order.includes(key)) &&
        [...seen].filter((key) => key !== "a").length <= 2 &&
        [0, ...order, 1].length === order.length + 2 &&
        [...order, ...order].slice(order.length).every((key) => seen.has(key));
    `;

    it("gives what ESCore gives in every call, as TLC counts", async () => {
      const counts = ["deadlock", 10, 10];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a spread that drops the last element", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "THEN v.elems\n",
        "THEN SubSeq(v.elems, 1, Len(v.elems) - 1)\n",
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });
  });

  describe("runs a Set's methods of another Set, new Set and iterators natively, as ESCore does", () => {
    const source = `
      type Key = "a" | "b";
      const keys = new Set<Key>(["a", "b"]);
      let seen = new Set<Key>();
      let queue: [Key, number][] = [];
      let counts: Record<Key, number> = { a: 0, b: 0 };

      const total = (rest: Set<Key>): number => {
        const first = rest.values().find(() => true);
        return first === undefined ? 0 : counts[first] + total(rest.difference(new Set([first])));
      };

      export const take = (key: Key) => {
        if (!keys.difference(seen).has(key)) return;
        const next = seen.union(new Set([key]));
        seen = next;
        queue.push([key, counts[key]]);
      };

      export const serve = () => {
        if (queue.length === 0 || counts[queue[0][0]] >= 1) return;
        const head = queue[0];
        queue.shift();
        counts[head[0]] += 1;
        seen = seen.difference(new Set([head[0]]));
      };

      export const isBounded = () =>
        total(keys) <= 2 &&
        Object.values(counts).every((count) => count <= 1) &&
        new Set(keys.values().filter((key) => seen.has(key))).size === seen.intersection(keys).size &&
        seen.isSubsetOf(keys) &&
        keys.isSupersetOf(seen) &&
        (seen.size === 0 || !seen.isDisjointFrom(keys)) &&
        seen.symmetricDifference(keys).size + seen.size === 2;

      /** @always */
      export const isShort = () => queue.length <= 2;
    `;

    it("gives what ESCore gives in every call and every guard, as TLC counts", async () => {
      const counts = ["deadlock", 18, 22];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a union that puts the other Set's elements first", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        'm = "union" -> LSet(a \\o SelectSeq(b, LAMBDA e : ~LHas(a, e)))',
        'm = "union" -> LSet(SelectSeq(b, LAMBDA e : ~LHas(a, e)) \\o a)',
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    }, 120_000);

    it("tells a subset test that leaves out a Set of the same size", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        '[] m = "isSubsetOf" -> Bool(Len(a) <= Len(b)',
        '[] m = "isSubsetOf" -> Bool(Len(a) < Len(b)',
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    }, 120_000);
  });

  describe("takes a parameter's computed domain from its guard, natively, as ESCore does", () => {
    // Today's domain of step is its TLA+ of choices, which reads its TLA+ of bits; the guard's
    // Set is the module's own code.
    const source = `
      const bits = (x: number, bit: number): number =>
        x === 0 ? 0 : 2 ** bit * (x % 2) + bits(Math.floor(x / 2), bit + 1);
      const choices = () => new Set([1, 2, 3].filter((value) => bits(value, 0) === value));
      let total = 0;
      export const add = (step: number) => {
        if (!choices().has(step)) return;
        if (total >= 4) return;
        total += step;
      };
      export const isSmall = () => total <= 6;
    `;

    it("gives what ESCore gives in every call and every guard, as TLC counts", async () => {
      const counts = ["deadlock", 7, 13];
      expect(getCounts(await checkModel(source, "spec.ts", "native"))).toEqual(counts);
      expect(getCounts(await checkModel(source, "spec.ts", "compared"))).toEqual(counts);
    });

    it("tells a floor that gives 0 of an integer", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "THEN Num(MathOf(m, a.value))",
        'THEN Num(IF m = "floor" /\\ a.value.k = "int" THEN NumFromInt(0) ELSE MathOf(m, a.value))',
      ]);
      expect(result.message).toContain("the native call differs from ESCore's");
    });
  });

  describe("takes no step on a call that writes nothing, as today's compiler and Node's runs do", () => {
    const fairness = (tag: string) => `
      /** @noDeadlock */
      let x: 0 | 1 = 0;
      let y: 0 | 1 = 0;
      ${tag}
      export const work = () => {
        if (x === 1) y = 1;
      };
      /** @fair */
      export const spin = () => {
        x = x === 0 ? 1 : 0;
      };
      /** @eventually */
      export const isWorked = () => y === 1;
    `;

    it("deadlocks where the only call writes nothing, and steps where it writes what it holds", async () => {
      const written = (body: string) => `
        let x = 0;
        export const step = () => {
          ${body}
        };
        export const isSmall = () => x <= 2;
      `;
      expect(getCounts(await checkModel(written("if (x < 2) x += 1;")))).toEqual([
        "deadlock",
        3,
        3,
      ]);
      expect(getCounts(await checkModel(written("if (x < 2) x += 1; else x = x;")))).toEqual([
        "success",
        3,
        4,
      ]);
    });

    it("needs strong fairness for a call that writes in every other state", async () => {
      expect(getCounts(await checkModel(fairness("/** @fair */")))).toEqual([
        "liveness-violation",
        4,
        7,
      ]);
      expect(getCounts(await checkModel(fairness("/** @strongFair */")))).toEqual([
        "success",
        4,
        7,
      ]);
    });

    it("tells a step that a call writing nothing takes", async () => {
      const source = `
        let x = 0;
        export const step = () => {
          if (x < 2) x += 1;
        };
        export const isSmall = () => x <= 2;
      `;
      const result = await checkModel(source, "spec.ts", "canonical", [
        "IF n.w THEN {n.m} ELSE {}",
        "IF n.w THEN {n.m} ELSE {a[1]}",
      ]);
      expect(getCounts(result)).toEqual(["success", 3, 4]);
    });
  });

  describe("checks a model without state natively, in the state its top level leaves", () => {
    // A port of Stones.tla with 2 stones of a weight of 4.
    const source = `
      const w = 4;
      const n = 2;
      const getRange = (low: number, high: number) =>
        Array.from({ length: high - low + 1 }, (_, index) => low + index);
      const weighs = (seq: number[], wt: number): boolean =>
        seq.length === 0 ? wt === 0 : [-1, 0, 1].some((coef) => weighs(seq.slice(1), wt - coef * seq[0]));
      const hasSolution = (seq: number[], wt: number): boolean => {
        if (seq.length === n) return getRange(1, w).every((weight) => weighs(seq, weight));
        const r = n - seq.length;
        const max = seq.length === 0 ? wt : seq[0];
        return getRange(1, max).some(
          (x) => r - 1 <= wt - x && wt <= x * r && hasSolution([x, ...seq], wt - x),
        );
      };
      /** @assume */
      export const isSolvable = () => hasSolution([], w);
    `;
    it("gives what ESCore gives in every call, as TLC does", async () => {
      for (const mode of ["native", "lowered", "raw"] as const) {
        expect(getCounts(await checkModel(source, "spec.ts", mode))).toEqual(["success", 0, 0]);
      }
    });

    it("tells an every that fails where each element passes", async () => {
      const result = await checkModel(source, "spec.ts", "native", [
        "IN IF i = 0 THEN True ELSE IF rs[i].type",
        "IN IF i = 0 THEN False ELSE IF rs[i].type",
      ]);
      // An assumption reports no message of the Assert that its comparison fails.
      expect(result.status).toBe("assumption-violation");
    });
  });

  describe("runs ESNative's operators natively, as their TLA+ runs them", () => {
    // A model that lowers its state, whose module ESNative the checks read.
    const source = `
      let count = 0;
      export const step = () => {
        if (count < 1) count += 1;
      };
    `;
    // Every operator that tla-ts runs natively, on every argument of a pool of lowered values:
    // integers at ESNumber's limits, the other kinds of Number, strings, objects, arrays, Sets,
    // Maps, a BigInt, and LBail.
    const operators = String.raw`
PoolNumber(k, neg, i, m, e) == [type |-> "number", value |-> [k |-> k, neg |-> neg, i |-> i, m |-> m, e |-> e]]
PoolInt(i) == PoolNumber("int", i < 0, i, <<>>, 0)
PoolInts == {PoolInt(i) : i \in {0, 1, -1, 2, -2, 7, -7, 32767, -32767, 32768, -32768, 65535, 1073741823, -1073741823}}
PoolNumbers == PoolInts \cup {PoolNumber("nzero", TRUE, 0, <<>>, 0), PoolNumber("nan", FALSE, 0, <<>>, 0),
  PoolNumber("inf", FALSE, 0, <<>>, 0), PoolNumber("inf", TRUE, 0, <<>>, 0), PoolNumber("fin", FALSE, 0, <<1>>, -1)}
PoolStrings == {[type |-> "string", value |-> u] : u \in {<<>>, <<97>>, <<98>>, <<48>>, <<108, 101, 110, 103, 116, 104>>, <<115, 105, 122, 101>>}}
PoolPrimitives == PoolNumbers \cup PoolStrings \cup {[type |-> "undefined"], [type |-> "null"],
  [type |-> "boolean", value |-> TRUE], [type |-> "boolean", value |-> FALSE],
  [type |-> "bigint", value |-> [neg |-> FALSE, mag |-> <<>>]], [type |-> "bigint", value |-> [neg |-> FALSE, mag |-> <<3>>]]}
PoolComposites == {[type |-> "lobject", keys |-> <<>>, vals |-> <<>>],
  [type |-> "lobject", keys |-> <<<<97>>>>, vals |-> <<97>> :> PoolInt(1)],
  [type |-> "lobject", keys |-> <<<<97>>, <<98>>>>, vals |-> (<<97>> :> PoolInt(1)) @@ (<<98>> :> [type |-> "lobject", keys |-> <<>>, vals |-> <<>>])],
  [type |-> "larray", elems |-> <<>>], [type |-> "larray", elems |-> <<PoolInt(1), PoolInt(0)>>],
  [type |-> "larray", elems |-> <<[type |-> "string", value |-> <<97>>], [type |-> "null"], PoolInt(2)>>],
  [type |-> "lset", elems |-> <<PoolInt(1)>>], [type |-> "lmap", keys |-> <<PoolInt(1)>>, vals |-> <<PoolInt(2)>>]}
PoolBail == [type |-> "bail"]
Pool == PoolPrimitives \cup PoolComposites \cup {PoolBail}
PoolKeys == {<<97>>, <<98>>, <<99>>, <<108, 101, 110, 103, 116, 104>>, <<115, 105, 122, 101>>}
PoolArithmetic == {"+", "-", "*", "/", "%", "**"}
PoolRelations == {"<", ">", "<=", ">="}
PoolResults == {PoolBail, [type |-> "ok", m |-> 0, w |-> FALSE, v |-> PoolInt(1)]}
PoolIndices == {[type |-> "undefined"], PoolInt(-5), PoolInt(-1), PoolInt(0), PoolInt(1), PoolInt(5),
  PoolNumber("nan", FALSE, 0, <<>>, 0), PoolNumber("fin", FALSE, 0, <<1>>, -1), [type |-> "string", value |-> <<48>>]}
PoolLists == {<<>>, <<PoolInt(1)>>, <<PoolBail>>, <<PoolInt(1), PoolBail>>, <<[type |-> "null"], PoolInt(3)>>}
PoolSets == {[type |-> "lset", elems |-> <<>>], [type |-> "lset", elems |-> <<PoolInt(1)>>],
  [type |-> "lset", elems |-> <<PoolInt(2), PoolInt(1)>>],
  [type |-> "lset", elems |-> <<[type |-> "string", value |-> <<97>>], PoolInt(1), [type |-> "null"]>>],
  [type |-> "lset", elems |-> <<PoolNumber("nan", FALSE, 0, <<>>, 0), PoolInt(0)>>],
  [type |-> "lset", elems |-> <<PoolNumber("nzero", TRUE, 0, <<>>, 0)>>],
  [type |-> "lset", elems |-> <<[type |-> "larray", elems |-> <<>>]>>], [type |-> "larray", elems |-> <<>>]}
PoolSetMethods == {"union", "intersection", "difference", "symmetricDifference", "isSubsetOf",
  "isSupersetOf", "isDisjointFrom", "has"}
PoolCallbacks(c, F(_, _)) ==
  /\ c.type = "larray" => LResults(c.elems, F) = PlainLResults(c.elems, F)
  /\ LEvery(c, F) = PlainLEvery(c, F)
  /\ LSome(c, F) = PlainLSome(c, F)
  /\ LMap(c, F) = PlainLMap(c, F)
  /\ LFilter(c, F) = PlainLFilter(c, F)
ASSUME \A v \in Pool :
  /\ IsLComposite(v) = PlainIsLComposite(v)
  /\ LIsPrimitive(v) = PlainLIsPrimitive(v)
  /\ LNumber(v) = PlainLNumber(v)
  /\ LOwn(v) = PlainLOwn(v)
  /\ LTruthy(v) = PlainLTruthy(v)
  /\ LNot(v) = PlainLNot(v)
  /\ \A k \in PoolKeys : LGet(v, k) = PlainLGet(v, k)
  /\ \A i \in Pool, n \in 0..3 : LIsIndex(v, i, n) = PlainLIsIndex(v, i, n)
  /\ \A i \in Pool : LIndex(v, i) = PlainLIndex(v, i)
  /\ \A b \in Pool, op \in PoolArithmetic : LArith(op, v, b) = PlainLArith(op, v, b)
  /\ \A b \in Pool, op \in PoolRelations : LRelation(op, v, b) = PlainLRelation(op, v, b)
  /\ \A b \in Pool : LStrict(v, b) = PlainLStrict(v, b)
  /\ \A o \in Pool, k \in PoolKeys : LPut(o, k, v) = PlainLPut(o, k, v)
  /\ \A c \in Pool, k \in Pool : LAssign(c, k, v) = PlainLAssign(c, k, v)
  /\ \A s \in PoolIndices, e \in PoolIndices : LSlice(v, s, e) = PlainLSlice(v, s, e)
  /\ PoolCallbacks(v, LAMBDA x, i : x)
  /\ PoolCallbacks(v, LAMBDA x, i : i)
  /\ PoolCallbacks(v, LAMBDA x, i : PoolBail)
  /\ PoolCallbacks(v, LAMBDA x, i : IF i = PoolInt(1) THEN PoolBail ELSE [type |-> "boolean", value |-> i = PoolInt(0)])
ASSUME \A c \in PoolSets, o \in PoolSets, m \in PoolSetMethods : LSetMethod(c, m, o) = PlainLSetMethod(c, m, o)
ASSUME \A r \in PoolResults : LValue(r) = PlainLValue(r)
ASSUME \A list \in PoolLists : LArray(list) = PlainLArray(list)
RECURSIVE PlainSetToSeq(_)
PlainSetToSeq(set) == IF set = {} THEN <<>> ELSE LET x == CHOOSE x \in set : TRUE IN <<x>> \o PlainSetToSeq(set \ {x})
ASSUME \A t \in {"", "a", "ab\n", "Z~ \t", "\\\""} : StringUnits(t) = [i \in 1..Len(t) |-> CharacterUnits[SubSeq(t, i, i)]]
ASSUME \A x \in SUBSET {"m1", "c1", "b"} : SetToSeq(x) = PlainSetToSeq(x)
ASSUME \A x \in {{3, 1, -2}, 1..4} : SetToSeq(x) = PlainSetToSeq(x)
ASSUME SetToSeq({{2}, {}, {1, 0}}) = PlainSetToSeq({{2}, {}, {1, 0}})
ASSUME SetToSeq({<<1>>, <<>>, <<0, 1>>}) = PlainSetToSeq({<<1>>, <<>>, <<0, 1>>})`;

    it("agrees with the TLA+ on every argument of the pool", async () => {
      const result = await checkModel(source, "spec.ts", "operators", undefined, operators);
      expect(result.message).toBeUndefined();
      expect(getCounts(result)).toEqual(["deadlock", 2, 2]);
    });

    it("tells a TLA+ that gives another result", async () => {
      const result = await checkModel(
        source,
        "spec.ts",
        "operators",
        ["[] OTHER -> PlainLBail\nPlainLIsIndex", '[] OTHER -> [type |-> "other"]\nPlainLIsIndex'],
        operators,
      );
      expect(result.status).toBe("assumption-violation");
    });

    it("tells a Set method whose TLA+ gives another result", async () => {
      const result = await checkModel(
        source,
        "spec.ts",
        "operators",
        ['[] m = "isDisjointFrom" -> Bool(~\\E', '[] m = "isDisjointFrom" -> Bool(\\E'],
        operators,
      );
      expect(result.status).toBe("assumption-violation");
    });
  });

  describe("checks an assumption of a lowered model in its lowered start state", () => {
    const getSource = (floor: number) => `
      let count = 0;
      export const step = () => {
        count = 1 - count;
      };
      /** @assume */
      export const isLikeJavaScript = () =>
        Math.trunc(-7 / 2) === -3 && Math.floor(-7 / 2) === ${floor} && \`\${"a"}-\${1}\` === "a-1";
    `;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource(-4)))).toEqual(["success", 2, 3]);
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource(-3))).status).toBe("assumption-violation");
    });
  });

  describe("calls a check that today's compiler names apart from a result in its body", () => {
    const getSource = (expected: string) => `
      const flip = function (body: (a: number, b: number) => number) {
        const held = body;
        return (a: number, b: number) => held(b, a);
      };
      export const minus = flip((self: number, that: number) => self - that);
      export const run = (value: 1 | 2) => {
        const result = minus(value, 10);
        if (result !== ${expected}) throw new Error("result " + result);
        return result;
      };
    `;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource("10 - value")))).toEqual(["success", 0, 0]);
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource("value - 10"))).message).toContain('"result 9"');
    });
  });

  describe("checks the port of SimpleAllocator.tla under its symmetry as tla-ts checks the original", () => {
    const directory = join(import.meta.dirname, "../fixtures/typescript/simple-allocator");
    const path = join(directory, "simple-allocator.ts");
    const source = readFileSync(path, "utf8");

    it("finds the original's states, one for each permutation of clients and resources", async () => {
      const original = await check({
        source: readFileSync(join(directory, "SimpleAllocator.tla"), "utf8"),
        config: readFileSync(join(directory, "SimpleAllocator.cfg"), "utf8"),
      });
      expect([original.status, original.distinctStates, original.generatedStates]).toEqual([
        "success",
        50,
        226,
      ]);
      expect(getCounts(await checkModel(source, path))).toEqual(["success", 50, 226]);
    });

    it("finds the violation of ResourceMutex where a client takes a resource another holds", async () => {
      const result = await checkModel(source.replace(" || !given.isDisjointFrom(taken)", ""), path);
      expect(result.message).toContain('"two clients hold a resource"');
    });

    it.each([
      [
        "names a value",
        "if (unsat[c].size",
        'if (c === "c1" || unsat[c].size',
        'names the value "c1"',
      ],
      [
        "reads a value's text",
        "if (unsat[c].size",
        "if (c.length > 2 || unsat[c].size",
        "reads a property",
      ],
      [
        "iterates a Set",
        "  taken = taken.union(given);",
        "  for (const r of given) taken.add(r);",
        "iterates",
      ],
      ["destructures a Set", "  taken = taken.union(given);", "  const [r] = given;", "iterates"],
      [
        "calls a function that reads text",
        "if (unsat[c].size",
        "if (Number(c) === 0 || unsat[c].size",
        "calls a function",
      ],
    ])("stops where the program %s, which tells the values apart", async (_, from, to, reason) => {
      const result = await checkModel(source.replace(from, to), path);
      expect(result.status).toBe("stopped");
      expect(result.message).toContain(`tla-ts can't check a symmetric model that ${reason}`);
    });
  });
});
