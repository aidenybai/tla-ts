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
      const result = await loaded.check({
        ...compiled,
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
// where each lowered state materializes to the canonical state it lowers and each lowered
// converter gives what lowering its converter's objects gives, lowered where each native call
// gives what ESCore's gives, or with the assumptions operators, which read ESNative's operators
// and their TLA+ as PlainX.
const checkModel = (
  source: string,
  fileName = "spec.ts",
  mode: "canonical" | "raw" | "compared" | "lowered" | "native" | "operators" = "canonical",
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
ASSUME \A r \in PoolResults : LValue(r) = PlainLValue(r)
ASSUME \A list \in PoolLists : LArray(list) = PlainLArray(list)`;

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
  });
});
