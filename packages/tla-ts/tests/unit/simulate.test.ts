import { expect, it } from "vite-plus/test";
import { formatValue } from "../../src";
import type { TraceStep } from "../../src/check";
import { simulate } from "../../src/simulate";

const SAFETY_CONFIG = "INIT Init\nNEXT Next\nINVARIANT Inv";

const getPrintedRecords = (body: string, config: string) => {
  const printed: string[][] = [];
  const print = (trace: TraceStep[]) =>
    printed.push(trace.map((step) => formatValue(step.state.q)));
  simulate({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES p, q\nId(a, c) == a\n${body}\n====`,
    config,
    seed: 4n,
    traceDepth: 5,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "behavior") print(output.trace);
    },
    onProgress: (progress) => {
      if (progress.kind === "violation") print(progress.violation.trace);
    },
  });
  return printed;
};

it("sorts the records of the initial states, which TLC's simulator normalizes", () => {
  const body =
    "R == [b |-> 1, a |-> 2]\nInit == p = 0 /\\ q = [b |-> 0, a |-> 0]\nNext == p' = p + 1 /\\ q' = IF p = 0 THEN R ELSE [b |-> 5, a |-> 6]\nInv == p < 2";
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([
    ["[a |-> 0, b |-> 0]", "[a |-> 2, b |-> 1]", "[b |-> 5, a |-> 6]"],
  ]);
});

it.each(["[a : {0}, b : {1}]", '[{"a", "b"} -> {1}]'])(
  "sorts a record an invariant checks against %s, which TLC's member sorts in place",
  (set) => {
    const messages: string[] = [];
    simulate({
      source: `---- MODULE M ----\nVARIABLE q\nId(a, c) == a\nInit == q = [b |-> 1, a |-> 2]\nNext == UNCHANGED q\nInv == q \\in ${set}\n====`,
      config: SAFETY_CONFIG,
      seed: 4n,
      traceDepth: 5,
      traceCount: 1n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onSimulation: (output) => {
        if (output.kind === "message" && output.isError) messages.push(output.message);
      },
    });
    expect(messages).toEqual([
      "Invariant Inv is violated by the initial state:\nq = [a |-> 2, b |-> 1]\n",
    ]);
  },
);

it('reports a violation in the step that sets TLCSet("exit"), which TLC\'s simulator drops', () => {
  const body =
    'Init == p = 0 /\\ q = 0\nNext == TLCSet("exit", TLCGet("level") > 3) /\\ p\' = p + 1 /\\ q\' = p + 1\nInv == q < 4';
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([["0", "1", "2", "3", "4"]]);
});

it("sorts the records that TLC compares with the previous state as it drops stuttering steps", () => {
  const body =
    "Init == p = 0 /\\ q = [b |-> 0, a |-> 0]\nNext == p' = p /\\ q' = [b |-> q.b + 1, a |-> 6]\nInv == q.b < 2";
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([
    ["[a |-> 0, b |-> 0]", "[a |-> 6, b |-> 1]", "[a |-> 6, b |-> 2]"],
  ]);
});

it("keeps a step whose values TLC fails to compare as it drops stuttering steps, where TLC hangs", () => {
  const body =
    'Init == p = 0 /\\ q = 0\nNext == p\' = p /\\ q\' = [b |-> TLCGet("level"), a |-> 2]\nInv == TLCGet("level") < 3';
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([
    ["0", "[a |-> 2, b |-> 1]", "[a |-> 2, b |-> 2]"],
  ]);
});

it("sorts the records of a behavior TLC checks for liveness, as it fingerprints each state", () => {
  const body =
    "Init == p = 0 /\\ q = [b |-> 0, a |-> 0]\nNext == p < 2 /\\ p' = p + 1 /\\ q' = [b |-> 5, a |-> p]\nSpec == Init /\\ [][Next]_<<p, q>>\nLive == <>(q.a = 7)";
  expect(
    getPrintedRecords(body, "SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE"),
  ).toEqual([["[a |-> 0, b |-> 0]", "[a |-> 0, b |-> 5]", "[a |-> 1, b |-> 5]"]]);
});

it("reports a behavior that stutters at its initial state, which TLC's LiveCheck1 misses", () => {
  const violations: { states: string[]; loopStart: number | undefined }[] = [];
  const status = simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nProp == (x = 0) ~> (x = 1)\n====",
    config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
    seed: 4n,
    traceDepth: 3,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onProgress: (progress) => {
      if (progress.kind !== "violation") return;
      violations.push({
        states: progress.violation.trace.map((step) => formatValue(step.state.x)),
        loopStart: progress.violation.loopStart,
      });
    },
  });
  expect([status, violations]).toEqual([13, [{ states: ["0"], loopStart: 0 }]]);
});

it.each([
  [
    "an invariant that a later initial state violates",
    "INVARIANT Inv",
    12,
    2107,
    "Invariant Inv is violated by the initial state:\nx = 1\n",
  ],
  [
    "that the constraints keep no initial state",
    "CONSTRAINT Constraint",
    255,
    2256,
    "There is no state satisfying the initial state predicate and the state-constraint(s).",
  ],
])(
  "reports %s before an implied initial predicate, which TLC's simulator never checks",
  (_title, config, status, code, message) => {
    const messages: [number, string][] = [];
    const result = simulate({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x \\in {0, 1}\nNext == x' = x\nInv == x = 0\nConstraint == x = 2\nProp == x = 1\n====",
      config: `INIT Init\nNEXT Next\nPROPERTY Prop\n${config}`,
      seed: 4n,
      traceDepth: 2,
      traceCount: 1n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onSimulation: (output) => {
        if (output.kind === "message" && output.isError) {
          messages.push([output.code, output.message]);
        }
      },
    });
    expect([result, messages]).toEqual([status, [[code, message]]]);
  },
);

it("reports an implied initial predicate that an initial state violates, which TLC's simulator never checks", () => {
  const messages: [number, string][] = [];
  const result = simulate({
    source:
      "---- MODULE M ----\nVARIABLE x\nInit == x \\in {0, 1}\nNext == x' = x\nProp == x = 1\n====",
    config: "INIT Init\nNEXT Next\nPROPERTY Prop",
    seed: 4n,
    traceDepth: 2,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "message" && output.isError) {
        messages.push([output.code, output.message]);
      }
    },
  });
  expect([result, messages]).toEqual([
    13,
    [[2108, "Property Prop is violated by the initial state:\nx = 0\n"]],
  ]);
});

it("checks a behavior against one solution after another up to the first it violates, as TLC's LiveCheck1 does", () => {
  const printed: string[] = [];
  const status = simulate({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nA == PrintT(<<"a", x>>) /\\ x < 1 /\\ x\' = x + 1\nSpec == Init /\\ [][A]_x /\\ WF_x(A)\nProp0 == <>(x = 2)\nProp1 == <>(x = 3)\n====',
    config: "SPECIFICATION Spec\nPROPERTY Prop0\nPROPERTY Prop1\nCHECK_DEADLOCK FALSE",
    seed: 4n,
    traceDepth: 3,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onPrint: (text) => printed.push(text),
  });
  expect([status, printed]).toEqual([
    13,
    ['<<"a", 0>>', '<<"a", 1>>', '<<"a", 0>>', '<<"a", 0>>', '<<"a", 0>>', '<<"a", 1>>'],
  ]);
});

const getCounterExample = (body: string, config: string) => {
  const printed: string[] = [];
  simulate({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nPost == PrintT(<<CounterExample.state, {<<e[1][1], e[2].name, e[3][1]>> : e \\in CounterExample.action}>>)\nInit == x = 0\n${body}\n====`,
    config: `${config}\nPOSTCONDITION Post`,
    seed: 4n,
    traceDepth: 10,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onPrint: (text) => printed.push(text),
  });
  return printed;
};

it("binds CounterExample to the alias of each state of a behavior that violates an invariant", () => {
  const body = "Alias == [a |-> x, n |-> x']\nNext == x' = x + 1\nInv == x < 2";
  expect(getCounterExample(body, "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias")).toEqual([
    '<< { <<1, [a |-> 0, n |-> 1]>>,\n     <<2, [a |-> 1, n |-> 2]>>,\n     <<3, [a |-> 2, n |-> 2]>> },\n   {<<1, "Next", 2>>, <<2, "Next", 3>>} >>',
  ]);
});

it("binds CounterExample to the lasso of a behavior that violates a temporal property", () => {
  const property = "SPECIFICATION Spec\nPROPERTY Prop";
  expect([
    getCounterExample(
      "A == x < 2 /\\ x' = x + 1\nB == x = 2 /\\ x' = 0\nNext == A \\/ B\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>(x = 5)",
      property,
    ),
    getCounterExample(
      "Alias == [a |-> x, n |-> x + 1]\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nProp == <>(x = 5)",
      `${property}\nALIAS Alias`,
    ),
  ]).toEqual([
    [
      '<< {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>, <<3, [x |-> 2]>>},\n   {<<1, "A", 2>>, <<2, "A", 3>>, <<3, "B", 1>>} >>',
    ],
    ['<<{<<1, [a |-> 0, n |-> 1]>>}, {<<1, "UnnamedAction", 1>>}>>'],
  ]);
});

const getViewLassos = (values: string, property: string) => {
  const lassos: [unknown[][], number | undefined][] = [];
  simulate({
    source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES n, k\nInit == n = 0 /\\ k = 0\nNext == k < 5 /\\ k' = k + 1 /\\ n' = ${values}[k + 1]\nSpec == Init /\\ [][Next]_<<n, k>>\nProp == ${property}\nView == n\n====`,
    config: "SPECIFICATION Spec\nPROPERTY Prop\nVIEW View\nCHECK_DEADLOCK FALSE",
    seed: 4n,
    traceDepth: 6,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onProgress: (progress) => {
      if (progress.kind !== "violation") return;
      lassos.push([
        progress.violation.trace.map((step) => [step.state.n, step.state.k]),
        progress.violation.loopStart,
      ]);
    },
  });
  return lassos;
};

it("reports the lasso TLC's LiveCheck1 finds in a behavior that revisits a state", () => {
  expect(getViewLassos("<<1, 2, 3, 2, 4>>", "[]((n /= 9 => n /= 9) => [](n = 3))")).toEqual([
    [
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      2,
    ],
  ]);
});

// Deviation from TLC: TLC shows the first four states of the behavior, then a step from the fourth back to itself.
it("shows the states of the lasso it finds past a revisited state", () => {
  expect(getViewLassos("<<1, 0, 2, 3, 4>>", "<>[](n = 1)")).toEqual([
    [
      [
        [0, 0],
        [1, 1],
        [0, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ],
      5,
    ],
  ]);
});

// Deviation from TLC: TLC's LiveCheck1 goes on from no node that a revisited state reaches, so it reports no violation.
it("finds a violation past a revisited state, which TLC's LiveCheck1 misses", () => {
  expect(getViewLassos("<<1, 0, 2, 3, 4>>", "[](n = 2 => [](n = 2))")).toEqual([
    [
      [
        [0, 0],
        [1, 1],
        [0, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ],
      5,
    ],
  ]);
});

it("reports each property it fails to evaluate on the lasso before the properties the lasso violates, as TLC's Liveness does", () => {
  const reported: string[] = [];
  simulate({
    source:
      '---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x\' = (x + 1) % 3\nSpec == Init /\\ [][Next]_x\nProp0 == <>(x = 5)\nProp1 == <>(x = "a")\n====',
    config: "SPECIFICATION Spec\nPROPERTY Prop0\nPROPERTY Prop1",
    seed: 4n,
    traceDepth: 5,
    traceCount: 2n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "message" && output.isError) reported.push(output.message);
    },
    onProgress: (progress) => {
      if (progress.kind === "violation") reported.push(...(progress.violation.properties ?? []));
    },
  });
  expect(reported).toEqual([
    'TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to check equality of integer 0 with non-integer:\n"a"',
    "Prop0",
  ]);
});

it("draws another element when a constraint drops the successor it drew, as TLC's Tool#getNextStates checks the states its INextStateFunctor keeps", () => {
  const traces: string[][] = [];
  const status = simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, n\nInit == x = 0 /\\ n = 0\nNext == n' = n + 1 /\\ x' \\in 1..6\nCon == x % 2 = 0\nInv == n < 5\n====",
    config: "INIT Init\nNEXT Next\nCONSTRAINT Con\nINVARIANT Inv",
    seed: 4n,
    traceDepth: 8,
    traceCount: 4n,
    aril: 0n,
    isGenerating: true,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "behavior")
        traces.push(output.trace.map((step) => formatValue(step.state.x)));
    },
  });
  expect([status, traces]).toEqual([12, [["0", "4", "6", "6", "6", "5"]]]);
});

it("counts the expressions of an action in -generate, as TLC's Tool#getNextStates charges its cost models as it draws", () => {
  const reports: string[][] = [];
  simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, n\nInit == x = 0 /\\ n = 0\nNext == n < 4 /\\ n' = n + 1 /\\ (x' \\in {x, x + 1} \\/ \\E e \\in 1..3 : x' = x * e)\n====",
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    seed: 4n,
    traceDepth: 5,
    traceCount: 3n,
    aril: 0n,
    isGenerating: true,
    scheduler: "random",
    coverage: 1,
    onSimulation: (output) => {
      if (output.kind !== "coverage") return;
      reports.push(
        output.coverage.relations
          .filter((relation) => relation.label.startsWith("Next "))
          .flatMap((relation) =>
            relation.expressions.map(
              (expression) =>
                `${"|".repeat(expression.depth)}${expression.location}: ${expression.count}`,
            ),
          ),
      );
    },
  });
  expect(reports[0]).toEqual([
    "line 5, col 9 to line 5, col 13 of module M: 12",
    "|line 5, col 9 to line 5, col 9 of module M: 15",
    "line 5, col 18 to line 5, col 27 of module M: 12",
    "line 5, col 33 to line 5, col 49 of module M: 4",
    "line 5, col 54 to line 5, col 79 of module M: 8",
  ]);
});
