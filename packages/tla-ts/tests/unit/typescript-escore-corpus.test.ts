import { readFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, it } from "vite-plus/test";

// The programs of today's compiler's unit tests, each with what Node does with it, checked on
// ESCore. A script either runs as Node runs it or throws what Node throws; a model's check finds
// what today's compiler's found. A case that ESCore stops on is skipped with its stop.

interface Outcome {
  status: string;
  message: string | undefined;
  distinct: number;
  generated: number;
  trace: Record<string, string>[] | undefined;
}

// A run's program is its group's source, or that with one replacement made, or its own source.
interface Run {
  name: string;
  source?: string;
  replace?: [string, string];
  stop?: string;
  // Whether ESCore takes longer to check the run than a unit test may take.
  isSlow?: boolean;
  // Where ESCore gives another result than Node, what of ESCore is wrong, so that the run's test
  // fails until ESCore is fixed.
  wrong?: string;
}

interface ScriptRun extends Run {
  // What Node's process throws, as the check's failure shows it: an error's message, or the
  // value as a string, or the message of a promise that rejects with no handler.
  thrown?: string;
}

interface ModelRun extends Run {
  status: string;
  distinct?: number;
  generated?: number;
  trace?: Record<string, string>[];
  failure?: string[];
}

// The runs of one of today's compiler's describes, on one file of one kind.
interface Group<T extends Run> {
  name: string;
  fileName?: string;
  isModule?: boolean;
  source: string;
  runs: T[];
}

interface ExpressionCase {
  group: string;
  expression: string;
  setup: string;
  shown: string;
  stop?: string;
}

interface StatementsCase {
  group: string;
  variables: string;
  statements: string;
  setup: string;
  names: string[];
  shown: string;
  stop?: string;
}

interface Corpus {
  expressions: ExpressionCase[];
  statements: StatementsCase[];
  scripts: Group<ScriptRun>[];
  models: Group<ModelRun>[];
}

// Shows a value as text, in each script that checks an expression's or the statements' result.
const SHOWN = `const getQuoted = (text: string) =>
  JSON.stringify(text).replace(/[^ -~]/g, (unit) => \`\\\\u\${unit.charCodeAt(0).toString(16).padStart(4, "0")}\`);
const getShown = (value: unknown, seen: unknown[] = []): string => {
  if (typeof value === "string") return getQuoted(value);
  if (typeof value === "number") return Object.is(value, -0) ? "-0" : String(value);
  if (typeof value === "bigint") return \`\${value}n\`;
  if (typeof value === "function") return "function";
  if (typeof value === "symbol") return \`Symbol(\${getQuoted(value.description ?? "")})\`;
  if (typeof value !== "object" || value === null) return String(value);
  if (seen.includes(value)) return "cycle";
  const getInner = (inner: unknown) => getShown(inner, [...seen, value]);
  if (Array.isArray(value)) return \`[\${Array.from(value, getInner).join(",")}]\`;
  if (value instanceof Set) return \`Set{\${Array.from(value, getInner).join(",")}}\`;
  if (value instanceof Map) {
    return \`Map{\${Array.from(value, (entry) => \`\${getInner(entry[0])}=>\${getInner(entry[1])}\`).join(",")}}\`;
  }
  const record = value as Record<string, unknown>;
  return \`{\${Object.keys(record)
    .map((key) => \`\${getQuoted(key)}:\${getInner(record[key])}\`)
    .join(",")}}\`;
};
`;

const PACKAGE = join(import.meta.dirname, "../..");
const corpus: Corpus = JSON.parse(
  readFileSync(join(PACKAGE, "tests/fixtures/typescript/escore-corpus.json"), "utf8"),
);

// ESCore's evaluation nests deeper than a test's stack, so checks run on workers with the stack
// that test262-engine262 gives ESCore, each of which prepares ESCore's runtime once. A script's
// steps fail with what it threw: an error's message, or the value as a string.
const WORKER = String.raw`const { register } = require("node:module");
const { parentPort, workerData } = require("node:worker_threads");
// HACK: Node strips the types of tla-ts's sources, whose imports leave out the extension.
register("data:text/javascript," + encodeURIComponent("export const resolve = (specifier, context, next) => next(specifier, context).catch((error) => (specifier.startsWith('.') ? next(specifier + '.ts', context) : Promise.reject(error)));"));
const SCRIPT_STEPS = String.raw${"`"}VARIABLE programDone
ScriptCharacter == [u \in {CharacterUnits[c] : c \in DOMAIN CharacterUnits} |-> CHOOSE c \in DOMAIN CharacterUnits : CharacterUnits[c] = u]
RECURSIVE ScriptText(_)
ScriptText(units) ==
  IF units = <<>> THEN ""
  ELSE IF Head(units) \notin DOMAIN ScriptCharacter THEN Assert(FALSE, "tla-ts can't show a string of a character TLA+ strings lack")
  ELSE ScriptCharacter[Head(units)] \o ScriptText(Tail(units))
ScriptThrownText(r) ==
  LET v == r.c.value
      m == IF IsObject(v) THEN Get(r.s, v, SV("message")) ELSE Ok(r.s, Undefined)
      t == IF ~IsAbrupt(m) /\ IsString(Val(m)) THEN m ELSE ToStr(r.s, v)
  IN IF ~IsAbrupt(t) /\ IsString(Val(t)) THEN ScriptText(Val(t).value) ELSE "a value that isn't a string"
Init ==
  LET r == ApplyTo(RunProgram, InitialState) IN
  /\ CASE r.c.type # "throw" -> TRUE
       [] r.c.target # Empty /\ r.c.target.kind = "rejection" -> Assert(FALSE, "A promise rejected with no handler")
       [] OTHER -> Assert(FALSE, ScriptThrownText(r))
  /\ programDone = TRUE
Next == UNCHANGED programDone${"`"};
const loading = Promise.all([
  import(workerData.source + "/parallel.ts"),
  import(workerData.source + "/values.ts"),
  import(workerData.source + "/typescript/spec/compile.ts"),
  import(workerData.source + "/typescript/spec/model.ts"),
  import(workerData.source + "/typescript/spec/prepare.ts"),
  import(workerData.source + "/typescript/spec/library.ts"),
]).then(([parallel, values, compile, model, prepare, library]) => ({
  parallel, values, compile, model, runtime: prepare.prepareRuntime(workerData.directory),
  steps: { steps: library.foldNames(SCRIPT_STEPS), entries: [] },
}));
loading.then(() => parentPort.postMessage({ id: -1 }));
parentPort.on("message", async (spec) => {
  const loaded = await loading;
  try {
    const compiled = spec.isModel
      ? loaded.model.compileModelToEscore(spec.source, spec.fileName, loaded.runtime)
      : loaded.compile.compileToEscore(spec.source, spec.fileName, loaded.runtime, spec.isModule, loaded.steps);
    const result = await loaded.parallel.check({ ...compiled, workers: 1, onPrint: () => {} });
    parentPort.postMessage({
      id: spec.id,
      status: result.status,
      message: result.failure?.message,
      distinct: result.distinctStates,
      generated: result.generatedStates,
      trace: result.violation?.trace.map((step) =>
        Object.fromEntries(Object.entries(step.state).map((entry) => [entry[0], loaded.values.formatValue(entry[1])])),
      ),
    });
  } catch (error) {
    parentPort.postMessage({ id: spec.id, status: "stopped", message: error.message });
  }
});`;

const workers = Array.from(
  { length: Math.max(1, Math.min(4, Math.floor(availableParallelism() / 4))) },
  () =>
    new Worker(WORKER, {
      eval: true,
      workerData: {
        source: pathToFileURL(join(PACKAGE, "src")).href,
        directory: join(PACKAGE, "ecmascript"),
      },
      resourceLimits: { stackSizeMb: 256 },
    }),
);
workers.forEach((worker) => worker.unref());
afterAll(() => Promise.all(workers.map((worker) => worker.terminate())));

const pending: ((outcome: Outcome) => void)[] = [];
const idle: Worker[] = [];
const queued: ((worker: Worker) => void)[] = [];
const ready = Promise.all(
  workers.map(
    (worker) =>
      new Promise((resolve) => {
        worker.on("message", (outcome: Outcome & { id: number }) => {
          (outcome.id === -1 ? resolve : pending[outcome.id])(outcome);
          const post = queued.shift();
          return post === undefined ? idle.push(worker) : post(worker);
        });
      }),
  ),
);
// Each worker prepares the runtime before its first check, which takes longer than a check.
beforeAll(() => ready, 120_000);

interface Program {
  source: string;
  fileName?: string;
  isModule: boolean;
  isModel: boolean;
}

// Checks a program on the first worker that is free. A fixture's file name is the package's.
const checkProgram = (program: Program) =>
  new Promise<Outcome>((resolve) => {
    const id = pending.length;
    pending.push(resolve);
    const post = (worker: Worker) =>
      worker.postMessage({
        ...program,
        id,
        fileName: program.fileName === undefined ? "spec.ts" : join(PACKAGE, program.fileName),
      });
    const worker = idle.pop();
    return worker === undefined ? queued.push(post) : post(worker);
  });

const ESCAPES: Record<string, string> = {
  '"': '\\"',
  "\\": "\\\\",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
};

// The failure of a check whose script throws text, as TLC prints Assert's message.
const getFailure = (text: string) =>
  `the second argument was:\n"${text.replace(/["\\\t\n\f\r]/g, (character) => ESCAPES[character])}"`;

const SLOW = "ESCore takes longer to check it than a unit test may take";

// Whether ESCore stops on a case where the corpus records that it stops.
const isStopped = (outcomes: Outcome[], stop: string | undefined) =>
  stop !== undefined && outcomes.some((outcome) => outcome.message?.includes(stop) === true);

// The script that checks a shown result, which fails with what it shows of the value otherwise.
const getShownSource = (body: string, value: string, shown: string) =>
  `"use strict";\n${SHOWN}\n${body}\nconst shownText = getShown(${value});\nif (shownText !== ${JSON.stringify(shown)}) throw new Error(shownText);\n`;

const describeShown = (
  name: string,
  cases: { title: string; body: string; value: string; shown: string; stop?: string }[],
) =>
  describe.concurrent(name, () => {
    for (const entry of cases) {
      describe(entry.title, () => {
        it("agrees with Node", async (context) => {
          const outcome = await checkProgram({
            source: getShownSource(entry.body, entry.value, entry.shown),
            isModule: false,
            isModel: false,
          });
          if (isStopped([outcome], entry.stop)) return context.skip(entry.stop);
          context.expect(outcome.message).toBeUndefined();
        });

        it("rejects another result", async (context) => {
          const outcome = await checkProgram({
            source: getShownSource(entry.body, entry.value, `${entry.shown} `),
            isModule: false,
            isModel: false,
          });
          if (isStopped([outcome], entry.stop)) return context.skip(entry.stop);
          context.expect(outcome.message).toContain(getFailure(entry.shown));
        });
      });
    }
  });

describeShown(
  "evaluates expressions as Node does",
  corpus.expressions.map((entry) => ({
    title: `${entry.group} > ${entry.expression}`,
    body: entry.setup,
    value: entry.expression,
    shown: entry.shown,
    stop: entry.stop,
  })),
);

describeShown(
  "runs statements as Node does",
  corpus.statements.map((entry) => ({
    title: `${entry.group} > ${entry.statements}`,
    body: `${entry.setup}\nlet ${entry.variables};\nconst runStatements = () => {\n${entry.statements}\n};\nrunStatements();`,
    value: `{ ${entry.names.join(", ")} }`,
    shown: entry.shown,
    stop: entry.stop,
  })),
);

const getSource = (group: Group<Run>, run: Run) => {
  const replace = run.replace;
  return (
    run.source ??
    (replace === undefined ? group.source : group.source.replace(replace[0], () => replace[1]))
  );
};

describe.concurrent("runs today's compiler's scripts as Node does", () => {
  for (const group of corpus.scripts) {
    describe(group.name, () => {
      for (const run of group.runs) {
        (run.wrong === undefined ? it : it.fails)(run.name, async (context) => {
          if (run.isSlow === true) return context.skip(SLOW);
          const outcome = await checkProgram({
            source: getSource(group, run),
            fileName: group.fileName,
            isModule: group.isModule === true,
            isModel: false,
          });
          if (isStopped([outcome], run.stop)) return context.skip(run.stop);
          return run.thrown === undefined
            ? context.expect(outcome.message).toBeUndefined()
            : context.expect(outcome.message).toContain(getFailure(run.thrown));
        });
      }
    });
  }
});

describe.concurrent("checks today's compiler's models as it did", () => {
  for (const group of corpus.models) {
    describe(group.name, () => {
      for (const run of group.runs) {
        (run.wrong === undefined ? it : it.fails)(run.name, async (context) => {
          if (run.isSlow === true) return context.skip(SLOW);
          const outcome = await checkProgram({
            source: getSource(group, run),
            fileName: group.fileName,
            isModule: true,
            isModel: true,
          });
          if (isStopped([outcome], run.stop)) return context.skip(run.stop);
          context.expect(outcome.status).toBe(run.status);
          if (run.distinct !== undefined) context.expect(outcome.distinct).toBe(run.distinct);
          if (run.generated !== undefined) context.expect(outcome.generated).toBe(run.generated);
          if (run.trace !== undefined) context.expect(outcome.trace).toEqual(run.trace);
          run.failure?.forEach((text) => context.expect(outcome.message).toContain(text));
        });
      }
    });
  }
});
