import { expect, it } from "vite-plus/test";
import { formatValue } from "../../src";
import { simulate, type SimulationStatistics } from "../../src/simulate";
import { MESSAGE_LEVEL } from "../../src/tlc/messages";

const SAFETY_CONFIG = "INIT Init\nNEXT Next\nINVARIANT Inv";

const getPrintedRecords = (body: string, config: string) => {
  const printed: string[][] = [];
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
      if (output.kind === "behavior") {
        printed.push(output.printedStates.map((state) => state.split("/\\ q = ")[1].trimEnd()));
      }
    },
    onProgress: (progress) => {
      if (progress.kind === "violation") {
        printed.push(progress.violation.trace.map((step) => formatValue(step.state.q)));
      }
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
        if (output.kind === "message" && output.level === MESSAGE_LEVEL.error)
          messages.push(output.message);
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

it.each([
  [
    "{n \\in Nat : n > 1}",
    "{n \\in Nat : <expression line 6, col 107 to line 6, col 111 of module M> }",
  ],
  [
    "[n \\in Nat |-> n]",
    "[n \\in Nat |-> <expression line 6, col 109 to line 6, col 109 of module M>]",
  ],
])(
  "drops a stuttering step that keeps %s, which TLC fails to compare with itself and hangs on",
  (value, printed) => {
    const body = `Init == p = 0 /\\ q = 0\nNext == IF TLCGet("level") = 2 THEN UNCHANGED <<p, q>> ELSE p' = p + 1 /\\ q' = IF p = 0 THEN ${value} ELSE q\nInv == p < 2`;
    expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([["0", printed, printed]]);
  },
);

it("reports the violation of a successor TLC fails to compare with the current state, where TLC reports that failure", () => {
  const body =
    'Init == p = 0 /\\ q = 0\nNext == p\' = 1 /\\ q\' = IF p = 0 THEN 0 ELSE "a"\nInv == TLCGet("level") < 3';
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([["0", "0", '"a"']]);
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
        if (output.kind === "message" && output.level === MESSAGE_LEVEL.error) {
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
      if (output.kind === "message" && output.level === MESSAGE_LEVEL.error) {
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

it("draws on the generator of TLC's Simulator thread as it prints a behavior and checks the postcondition", () => {
  const aliases: unknown[] = [];
  const printed: string[] = [];
  const status = simulate({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x\' = x + RandomElement(1..3)\nInv == x < 5\nAlias == [x |-> x, r |-> RandomElement(0..99)]\nPost == PrintT(<<"post", TLCGet("config").seed, RandomElement(0..99)>>)\n====',
    config: "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias\nPOSTCONDITION Post",
    seed: 4n,
    traceDepth: 5,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "behavior") aliases.push(...output.trace.map((step) => step.state.r));
    },
    onPrint: (text) => printed.push(text),
  });
  expect([status, aliases, printed]).toEqual([12, [73, 91, 91], ['<<"post", "4", 69>>']]);
});

it("rejects a constant postcondition after a violation, as TLC's Simulator does", () => {
  const getOutcome = (invariant: string) => {
    const messages: [number, string][] = [];
    const status = simulate({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nInv == ${invariant}\nPost == TRUE\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post",
      seed: 4n,
      traceDepth: 5,
      traceCount: 1n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onSimulation: (output) => {
        if (output.kind === "message" && output.level === MESSAGE_LEVEL.error) {
          messages.push([output.code, output.message]);
        }
      },
    });
    return [status, messages];
  };
  expect(() => getOutcome("x < 2")).toThrow("The post condition Post cannot be a constant.");
  expect(getOutcome("x # 0")).toEqual([
    255,
    [
      [2107, "Invariant Inv is violated by the initial state:\nx = 0\n"],
      [
        2102,
        "The post condition Post cannot be a constant.\nWhile working on the initial state:\nx = 0\n",
      ],
    ],
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

const getAliasLasso = (body: string, config: string) => {
  const lassos: [unknown[], number | undefined][] = [];
  simulate({
    source: `---- MODULE M ----\nEXTENDS Integers\n${body}\n====`,
    config: `SPECIFICATION Spec\nPROPERTY Prop\nALIAS Alias\n${config}`,
    seed: 4n,
    traceDepth: 8,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onProgress: (progress) => {
      if (progress.kind !== "violation") return;
      lassos.push([
        progress.violation.trace.map((step) => step.state),
        progress.violation.loopStart,
      ]);
    },
  });
  return lassos;
};

// Deviation from TLC: TLC throws 'Cannot invoke "tlc2.tool.TLCState.lookup(util.UniqueString)" because "s" is null'.
it("reads a primed variable in the ALIAS of a lasso as the successor's, unlike TLC", () => {
  expect(
    getAliasLasso(
      "VARIABLE x\nAlias == [x |-> x, p |-> x']\nInit == x = 0\nNext == x < 3 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nProp == <>(x = 4)",
      "CHECK_DEADLOCK FALSE",
    ),
  ).toEqual([
    [
      [
        { x: 0, p: 1 },
        { x: 1, p: 2 },
        { x: 2, p: 3 },
        { x: 3, p: 3 },
      ],
      3,
    ],
  ]);
});

// Deviation from TLC: TLC throws 'Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null'.
it("prints the cycle of a lasso with an ALIAS that leaves out a variable, unlike TLC", () => {
  expect(
    getAliasLasso(
      "VARIABLES x, y\nAlias == [x |-> x]\nInit == x = 0 /\\ y = 0\nNext == y' = 1 - y /\\ x' = x\nSpec == Init /\\ [][Next]_<<x, y>> /\\ WF_<<x, y>>(Next)\nProp == <>(x = 1)",
      "",
    ),
  ).toEqual([[[{ x: 0 }, { x: 0 }], 0]]);
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

// Deviation from TLC: TLC prints "Back to state: <Step(2) …>", the behavior's step after the lasso's third state, which goes to n = 1.
it("names the step that closes the lasso it finds in a behavior that revisits a state", () => {
  const lassos: [unknown[], string | undefined][] = [];
  simulate({
    source:
      "---- MODULE M ----\nEXTENDS Integers\nVARIABLES n, k\nvals == <<1, 2, 1, 2, 0, 1>>\nInit == n = 0 /\\ k = 0\nStep(i) == k = i /\\ k' = k + 1 /\\ n' = vals[i + 1]\nNext == \\E i \\in 0..5 : Step(i)\nSpec == Init /\\ [][Next]_<<n, k>> /\\ WF_<<n, k>>(Next)\nProp == <>[](n # 0)\nView == n\n====",
    config: "SPECIFICATION Spec\nPROPERTY Prop\nVIEW View\nCHECK_DEADLOCK FALSE",
    seed: 4n,
    traceDepth: 8,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onProgress: (progress) => {
      if (progress.kind !== "violation") return;
      lassos.push([
        progress.violation.trace.map((step) => step.state.n),
        progress.violation.loopLabel,
      ]);
    },
  });
  expect(lassos).toEqual([[[0, 1, 2], "Step(4) line 6, col 12 to line 6, col 50 of module M"]]);
});

// Deviation from TLC: TLC throws "ArrayIndexOutOfBoundsException: Index 7 out of bounds for length 7" as it looks up the behavior's eighth state.
it("names the step that closes a lasso as long as the behavior", () => {
  const lassos: [unknown[][], number | undefined, string | undefined][] = [];
  simulate({
    source:
      "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y, k\nxs == <<1, 1, 2, 0, 0, 1>>\nys == <<0, 1, 1, 1, 0, 0>>\nInit == x = 1 /\\ y = 1 /\\ k = 0\nStep(i) == k = i /\\ k' = k + 1 /\\ x' = xs[i + 1] /\\ y' = ys[i + 1]\nNext == \\E i \\in 0..5 : Step(i)\nSpec == Init /\\ [][Next]_<<x, y, k>> /\\ WF_<<x, y, k>>(Next)\nProp == <>[][y' = 1 - y /\\ x' = x]_<<x, y>>\nView == <<x, y>>\n====",
    config: "SPECIFICATION Spec\nPROPERTY Prop\nVIEW View\nCHECK_DEADLOCK FALSE",
    seed: 4n,
    traceDepth: 7,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onProgress: (progress) => {
      if (progress.kind !== "violation") return;
      lassos.push([
        progress.violation.trace.map((step) => [step.state.x, step.state.y]),
        progress.violation.loopStart,
        progress.violation.loopLabel,
      ]);
    },
  });
  expect(lassos).toEqual([
    [
      [
        [1, 1],
        [1, 0],
        [1, 1],
        [2, 1],
        [0, 1],
        [0, 0],
        [1, 0],
      ],
      0,
      "Step(1) line 7, col 12 to line 7, col 66 of module M",
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
      if (output.kind === "message" && output.level === MESSAGE_LEVEL.error)
        reported.push(output.message);
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

// Deviation from TLC: Tool#getNextStates in -generate throws an UnsupportedOperationException at a CASE.
it("takes the arm of a CASE in -generate as the model checker does", () => {
  const traces: string[][] = [];
  const status = simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == CASE x < 3 -> x' = x + 1 [] OTHER -> x' = 0\nInv == x < 3\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    seed: 4n,
    traceDepth: 5,
    traceCount: 1n,
    aril: 0n,
    isGenerating: true,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "behavior") {
        traces.push(output.trace.map((step) => formatValue(step.state.x)));
      }
    },
  });
  expect([status, traces]).toEqual([12, [["0", "1", "2", "3"]]]);
});

const getDiffTraceOutputs = (definitions: string, isDiffTrace: boolean) => {
  const outputs: string[] = [];
  const status = simulate({
    source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES y, z\nInit == y = 0 /\\ z = 0\n${definitions}\n====`,
    config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
    seed: 4n,
    traceDepth: 6,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    isDiffTrace,
    onSimulation: (output) => {
      if (
        output.kind === "message" &&
        (output.level === MESSAGE_LEVEL.error || output.code === 1000)
      ) {
        outputs.push(output.message);
      }
      if (output.kind === "behavior") {
        output.trace.forEach((step, index) =>
          outputs.push(`${output.levels[index]}: ${formatValue(step.state.y)}`),
        );
      }
    },
  });
  return [status, outputs];
};

it("drops a step under -difftrace whose VIEW keeps the same filter of Nat, where TLC's Simulator#printBehavior fingerprints the filter and crashes", () => {
  const definitions =
    "Next == y' = y + 1 /\\ z' = IF y = 0 THEN {m \\in Nat : m > 1} ELSE z\nInv == y < 3\nView == z";
  expect(getDiffTraceOutputs(definitions, true)).toEqual([
    12,
    [
      "Invariant Inv is violated.",
      "1: 0",
      "2: 1",
      "difftrace requested: Shortened behavior by omitting finite stuttering (2 states), which is an artifact of simulation mode.\n",
    ],
  ]);
});

it("drops a step under -difftrace whose VIEW repeats the last one's, as TLC's Simulator#printBehavior does", () => {
  const definitions = "Next == y' = y + 1 /\\ z' = 1 - z\nInv == y < 4\nView == y \\div 2";
  expect(getDiffTraceOutputs(definitions, true)).toEqual([
    12,
    [
      "Invariant Inv is violated.",
      "1: 0",
      "3: 2",
      "5: 4",
      "difftrace requested: Shortened behavior by omitting finite stuttering (2 states), which is an artifact of simulation mode.\n",
    ],
  ]);
});

const FAILING_VIEW =
  "Next == y' = y + 1 /\\ z' = z\nInv == y < 3\nView == IF y < 2 THEN y ELSE y = \"s\"";

it("stops at a step whose VIEW fails under -difftrace, as TLC's Simulator#printBehavior does", () => {
  expect(getDiffTraceOutputs(FAILING_VIEW, true)).toEqual([
    255,
    [
      "Invariant Inv is violated.",
      "1: 0",
      "2: 1",
      'TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to check equality of integer 2 with non-integer:\n"s"',
    ],
  ]);
});

it("prints each step whose VIEW fails without -difftrace, where TLC's StatePrinter fingerprints the step and crashes", () => {
  expect(getDiffTraceOutputs(FAILING_VIEW, false)).toEqual([
    12,
    ["Invariant Inv is violated.", "1: 0", "2: 1", "3: 2", "4: 3"],
  ]);
});

it("prints a state whose function the RL scheduler fails to fingerprint, where TLC's StatePrinter fingerprints the state and crashes", () => {
  const outputs: string[] = [];
  const status = simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, z\nRf[n \\in 0..2] == IF n = 0 THEN z ELSE Rf[n - 1] + 1\nInit == x = Rf /\\ z = 1\nNext == UNCHANGED <<x, z>>\n====",
    config: "INIT Init\nNEXT Next",
    seed: 4n,
    traceDepth: 3,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "rl",
    onSimulation: (output) => {
      if (output.kind === "message" && output.level === MESSAGE_LEVEL.error)
        outputs.push(output.message);
      if (output.kind === "behavior") {
        output.trace.forEach((step) => outputs.push(formatValue(step.state.x)));
      }
    },
  });
  expect([status, outputs]).toEqual([
    151,
    [
      "In evaluation, the identifier z is either undefined or not an operator.\nline 4, col 33 to line 4, col 33 of module M",
      "[n \\in 0..2 |-> <expression line 4, col 19 to line 4, col 52 of module M>]",
    ],
  ]);
});

it.each([false, true])(
  "reports a set beyond -maxSetSize as TLC's WrongInvocationException and prints the summary after the behavior (generating: %s)",
  (isGenerating) => {
    const outputs: string[] = [];
    const status = simulate({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == \\E k \\in {a + b : a \\in 1..4, b \\in 1..4} : x' = k\n====",
      config: "INIT Init\nNEXT Next",
      seed: 4n,
      traceDepth: 3,
      traceCount: 2n,
      aril: 0n,
      isGenerating,
      scheduler: "random",
      maxSetSize: 4,
      onSimulation: (output) => {
        if (output.kind === "message" && output.level === MESSAGE_LEVEL.error)
          outputs.push(output.message);
        if (output.kind === "behavior") outputs.push("behavior");
        if (output.kind === "summary") outputs.push("summary");
      },
    });
    expect([status, outputs]).toEqual([
      255,
      [
        "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a util.WrongInvocationException\n: Attempted to construct a set with too many elements (>4).",
        "behavior",
        "summary",
      ],
    ]);
  },
);

it("keeps the incomplete step of a successor error under -difftrace, where TLC's TLCStateMut#fingerPrint crashes", () => {
  const definitions =
    "Next == \\/ y < 2 /\\ y' = y + 1 /\\ z' = z\n        \\/ y = 2 /\\ y' = y + 1\nInv == TRUE\nView == y \\div 2";
  const outputs = getDiffTraceOutputs(definitions, true);
  expect(outputs[1]).toEqual([
    "Successor state is not completely specified by action Next of the next-state relation. The following variable is not defined: z.\n",
    "1: 0",
    "3: 2",
    "4: 3",
    "difftrace requested: Shortened behavior by omitting finite stuttering (1 states), which is an artifact of simulation mode.\n",
  ]);
});

it("reports an initial conjunct it evaluates whole at the instance that holds it, as TLC's Tool does", () => {
  const messages: string[] = [];
  simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nI(j) == INSTANCE N WITH k <- j\nSpec == I(0)!Init /\\ I(0)!Sum /\\ [][UNCHANGED <<x, y>>]_<<x, y>>\n====\n",
    config: "SPECIFICATION Spec\n",
    loadModule: (name) =>
      name === "N"
        ? "---- MODULE N ----\nEXTENDS Naturals\nCONSTANT k\nVARIABLES x, y\nSum == 1 + 1\nBad == x + 1\nInit == x = k /\\ y = 0\n====\n"
        : undefined,
    seed: 4n,
    traceDepth: 3,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "message" && output.level === MESSAGE_LEVEL.error)
        messages.push(output.message);
    },
  });
  expect(messages).toEqual([
    "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In computing initial states, TLC expected a boolean expression,\nbut instead found 2.\nline 4, col 1 to line 4, col 30 of module M",
  ]);
});

it("checks the assumptions of a specification without variables and then finds no initial state, as TLC's Simulator does without an initial predicate", () => {
  const printed: string[] = [];
  const messages: string[] = [];
  const status = simulate({
    source: "---- MODULE M ----\nEXTENDS Naturals, TLC\nCONSTANT N\nASSUME PrintT(N + 1)\n====",
    config: "CONSTANT N = 3",
    seed: 7n,
    traceDepth: 3,
    traceCount: 2n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onPrint: (text) => printed.push(text),
    onSimulation: (output) => {
      if (output.kind === "message") messages.push(`${output.code} ${output.message}`);
    },
  });
  expect([status, printed, messages]).toEqual([
    255,
    ["4"],
    [
      "2269 Computed 0 initial states...",
      "2118 There is no state satisfying the initial state predicate.",
    ],
  ]);
});

const getStopTotals = (
  source: string,
  config: string,
  traceDepth: number,
  traceCount: bigint,
  isContinued: boolean,
) => {
  let summary: SimulationStatistics | undefined;
  const status = simulate({
    source,
    config,
    seed: 4n,
    traceDepth,
    traceCount,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    isContinued,
    onSimulation: (output) => {
      if (output.kind === "summary") summary = output.statistics;
    },
  });
  return [status, summary?.generatedStates, summary?.traces];
};

it("stops simulating about 150 states after a deadlock, as TLC's worker does until its main thread stops it", () => {
  const totals = getStopTotals(
    "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == (x = 2 /\\ x' = 3) \\/ (x < 3 /\\ x' = (x + 1) % 3)\n====",
    "INIT Init\nNEXT Next",
    15,
    20000n,
    false,
  );
  expect(totals).toEqual([11, 154, 30]);
});

it("finishes every behavior when fewer than 150 states remain after a deadlock, as TLC's worker does", () => {
  const totals = getStopTotals(
    "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nNext == x < 20 /\\ x' = x + 1\nSpec == x = 0 /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>(x = 20)\n====",
    "SPECIFICATION Spec\nPROPERTY Prop",
    30,
    8n,
    false,
  );
  expect(totals).toEqual([11, 161, 8]);
});

it("reports the liveness violation of a behavior after a deadlock, which TLC's LiveCheck1 prints as the worker goes on", () => {
  const reported: string[] = [];
  const status = simulate({
    source:
      "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nA == x = 2 /\\ x' = 3\nB == x < 3 /\\ x' = (x + 1) % 3\nInit == x = 0\nNext == A \\/ B\nSpec == Init /\\ [][Next]_x /\\ WF_x(B) /\\ WF_x(A)\nProp == <>(x = 3)\n====",
    config: "SPECIFICATION Spec\nPROPERTY Prop",
    seed: 4n,
    traceDepth: 15,
    traceCount: 30n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "message" && output.level === MESSAGE_LEVEL.error)
        reported.push(output.message);
      if (output.kind === "summary") reported.push(`${output.statistics.generatedStates} states`);
    },
    onProgress: (progress) => {
      if (progress.kind === "violation")
        reported.push(
          `${progress.violation.name}: ${progress.violation.trace.map((step) => formatValue(step.state.x)).join(" ")}`,
        );
    },
  });
  expect([status, reported]).toEqual([11, ["Deadlock reached.", "88 states", "Prop: 0 1 2"]]);
});

it("stops simulating about 150 states after an error that -continue can't continue, as TLC's worker does", () => {
  const totals = getStopTotals(
    "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv == x < 2 \\/ (CHOOSE y \\in {} : TRUE)\n====",
    "INIT Init\nNEXT Next\nINVARIANT Inv",
    6,
    2000n,
    true,
  );
  expect(totals).toEqual([76, 153, 77]);
});
