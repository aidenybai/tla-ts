import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
      const isHeap = spec.mode === "raw" || spec.mode === "compared";
      const compiled = loaded.compileModelToEscore(spec.source, spec.fileName, loaded.runtime, undefined, !isHeap);
      // spec.mutation replaces text in ESCanonicalPlain where the model compares canonical forms,
      // and in the model's code otherwise.
      const isCompared = spec.mode === "compared";
      const code = compiled
        .loadModule("ProgramCode")
        .replace(isCompared ? "" : (spec.mutation?.[0] ?? ""), isCompared ? "" : (spec.mutation?.[1] ?? ""));
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

// Checks a module's model on ESCore, with its steps' states lowered where the module lets them,
// raw, canonical where the native canonical form and ESCanonical's TLA+ compare equal, lowered
// where each lowered state materializes to the canonical state it lowers, or lowered where each
// native call gives what ESCore's gives.
const checkModel = (
  source: string,
  fileName = "spec.ts",
  mode: "canonical" | "raw" | "compared" | "lowered" | "native" = "canonical",
  mutation?: [string, string],
) =>
  new Promise<ModelResult>((resolve) => {
    worker.postMessage({ id: pending.length, source, fileName, mode, mutation });
    pending.push(resolve);
  });

const EXAMPLES = join(import.meta.dirname, "../fixtures/typescript/examples");

const getCounts = (result: ModelResult) => [result.status, result.distinct, result.generated];

describe("checks a module's exported functions as a model on ESCore", () => {
  // A model without state variables or actions has one state, which TLC checks no deadlock of.
  describe("checks the calls of a model without state", () => {
    const getSource = (expected: number) =>
      `const memo = [1, 2];\nexport const isTotal = () => memo.reduce((sum, value) => sum + value, 0) === ${expected};\n`;

    it("agrees with Node", async () => {
      expect(getCounts(await checkModel(getSource(3)))).toEqual(["success", 1, 1]);
    });

    it("rejects another result", async () => {
      expect(getCounts(await checkModel(getSource(4)))).toEqual(["invariant-violation", 1, 1]);
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
      expect(getCounts(await checkModel(getSource(2)))).toEqual(["success", 1, 1]);
    });

    it("rejects another result", async () => {
      expect((await checkModel(getSource(1))).status).toBe("assumption-violation");
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
      ).toEqual(["success", 1, 1]);
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
        expect(getCounts(await check(getBody(3)))).toEqual(["success", 1, 1]);
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
        expect(getCounts(await check(getBody("flip(value)")))).toEqual(["success", 1, 1]);
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
        expect(getCounts(await check(getBody("flip(value)")))).toEqual(["success", 1, 1]);
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
      ).toEqual(["success", 1, 1]);
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
});
