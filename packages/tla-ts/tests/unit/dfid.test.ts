import { expect, it } from "vite-plus/test";
import type { CheckProgress } from "../../src";
import { checkDepthFirst, type DepthFirstOutput } from "../../src/dfid";
import { formatProbability } from "../../src/tlc/summary";

const searchDepthFirst = (body: string, coverage?: number) => {
  const outputs: DepthFirstOutput[] = [];
  checkDepthFirst({
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\n${body}\n====`,
    config: "INIT Init\nNEXT Next",
    maxDepth: 3,
    coverage,
    onOutput: (output) => outputs.push(output),
  });
  return outputs;
};

it("generates every successor of an action past an incomplete one, as TLC's Tool does", () => {
  const body =
    "Init == x = 0 /\\ y = 0\nA == x < 2 /\\ x' = x + 1 /\\ y' = y\nB == x' \\in {1, 2, 3} /\\ IF x' = 1 THEN TRUE ELSE y' = x'\nNext == A \\/ B";
  const messages = searchDepthFirst(body).flatMap((output) =>
    output.kind === "message" ? [output.message] : [],
  );
  expect(messages.at(-1)).toBe("5 states generated, 2 distinct states found.");
  const coverage = searchDepthFirst(body, 1).flatMap((output) =>
    output.kind === "coverage" ? output.coverage.relations : [],
  );
  expect(coverage.find((relation) => relation.label.startsWith("B "))).toMatchObject({
    distinct: 0,
    generated: 3,
    expressions: [
      { location: "line 6, col 6 to line 6, col 21 of module M", depth: 0, count: 3, cost: 0 },
      { location: "line 6, col 13 to line 6, col 21 of module M", depth: 1, count: 1, cost: 4 },
      { location: "line 6, col 29 to line 6, col 34 of module M", depth: 0, count: 3, cost: 0 },
      { location: "line 6, col 41 to line 6, col 44 of module M", depth: 0, count: 1, cost: 0 },
      { location: "line 6, col 51 to line 6, col 57 of module M", depth: 0, count: 2, cost: 0 },
    ],
  });
});

it("collects the initial states in a StateVec that -maxSetSize bounds, as TLC's DFIDModelChecker does", () => {
  const outputs: DepthFirstOutput[] = [];
  const exitCode = checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in 1..3\nNext == x' = x\n====",
    config: "INIT Init\nNEXT Next",
    maxDepth: 2,
    maxSetSize: 2,
    isTool: true,
    onOutput: (output) => outputs.push(output),
  });
  const messages = outputs.flatMap((output) => (output.kind === "message" ? [output] : []));
  expect(exitCode).toBe(75);
  expect(messages.map((message) => message.code)).toEqual([1000, 2103, 2206, 2204]);
  expect(messages[0].toolMessage).toBe(
    "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nThe error occurred when TLC was computing initial states.\nThe exception was a java.lang.RuntimeException\n: @!@!@STARTMSG 2172:0 @!@!@\nToo many possible next states for the last state in the trace.\n@!@!@ENDMSG 2172 @!@!@",
  );
  expect(messages.at(-1)?.message).toBe("0 states generated, 0 distinct states found.");
});

it("starts the random generator over from the seed at each level, as TLC's new DFIDWorker does", () => {
  const prints: string[] = [];
  checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ PrintT(RandomElement(1..1000))\n====",
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    maxDepth: 3,
    seed: 4n,
    onPrint: (text) => prints.push(text),
    onOutput: () => {},
  });
  expect(prints).toEqual(["731", "731", "919"]);
});

it("replays an error with the generator that drew for the initial states, as TLC's main thread does", () => {
  const prints: string[] = [];
  checkDepthFirst({
    source:
      '---- MODULE M ----\nEXTENDS Integers, Sequences, TLC\nVARIABLE x\nInit == x = 0 /\\ PrintT(<<"init", RandomElement(1..1000000)>>)\nNext == x < 2 /\\ x\' = x + 1 /\\ PrintT(<<"next", x, RandomElement(1..1000000)>>) /\\ (x = 1 => Head(<<>>) = 1)\n====',
    config: "INIT Init\nNEXT Next",
    maxDepth: 5,
    seed: 4n,
    onPrint: (text) => prints.push(text),
    onOutput: () => {},
  });
  expect(prints).toEqual([
    '<<"init", 730610>>',
    '<<"next", 0, 730610>>',
    '<<"next", 0, 730610>>',
    '<<"next", 1, 918715>>',
    '<<"next", 1, 918715>>',
  ]);
});

// Deviation from TLC: TLC fails the assumption with 'Cannot invoke "tlc2.tool.IWorker.setLocalValue(int, tlc2.value.IValue)" because "this.workers[i]" is null'.
it("reads in Init a register that ASSUME sets, as model checking does", () => {
  const messages: string[] = [];
  checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nASSUME TLCSet(1, 5)\nInit == x = TLCGet(1) /\\ y = 0\nNext == x < 6 /\\ x' = x + 1 /\\ y' = y\n====",
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    maxDepth: 3,
    onOutput: (output) => {
      if (output.kind === "message") messages.push(output.message);
    },
  });
  expect(messages.at(-1)).toBe("3 states generated, 2 distinct states found.");
});

it("splits the next-state relation before it checks the assumptions, as TLC's Tool does", () => {
  const prints: string[] = [];
  checkDepthFirst({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == \\E i \\in (IF PrintT("split") THEN {1} ELSE {}) : x\' = (x + i) % 3\nASSUME PrintT("assume")\n====',
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    maxDepth: 3,
    onPrint: (text) => prints.push(text),
    onOutput: () => {},
  });
  expect(prints).toEqual(['"split"', '"assume"']);
});

// Deviation from TLC: past an initial state, Trace fails with 'Cannot invoke "tlc2.tool.TLCState.isInitial()" because "currentState" is null'.
it("reads Trace as the states on the path to the state, unlike TLC", () => {
  const prints: string[] = [];
  checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nInit == x = 0\nA(p) == x < 3 /\\ x' = x + 1 /\\ PrintT(p)\nNext == A(Trace)\n====",
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    maxDepth: 3,
    onPrint: (text) => prints.push(text),
    onOutput: () => {},
  });
  expect(prints).toEqual(["<<[x |-> 0]>>", "<<[x |-> 0]>>", "<<[x |-> 0], [x |-> 1]>>"]);
});

it("replays the step whose invariant fails to evaluate with the actions it counts under coverage, as TLC's DFIDModelChecker does", () => {
  const outputs: DepthFirstOutput[] = [];
  checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE v\nInit == v = 0\nNext == v' = 1 - v\nBad == PrintT(v) /\\ (v = 1 => v \\div 0 = 1)\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Bad",
    maxDepth: 3,
    coverage: 1,
    onPrint: () => {},
    onOutput: (output) => outputs.push(output),
  });
  const relations = outputs.flatMap((output) =>
    output.kind === "coverage" ? output.coverage.relations : [],
  );
  const messages = outputs.flatMap((output) => (output.kind === "message" ? [output.message] : []));
  expect([
    relations.map((relation) => [
      relation.label,
      relation.expressions.map(
        (expression) =>
          `${"|".repeat(expression.depth)}${expression.location}: ${expression.count}`,
      ),
    ]),
    messages.at(-1),
  ]).toEqual([
    [
      [
        "Init line 4, col 1 to line 4, col 4 of module M",
        ["line 4, col 9 to line 4, col 13 of module M: 1"],
      ],
      [
        "Next line 5, col 1 to line 5, col 4 of module M",
        ["line 5, col 9 to line 5, col 18 of module M: 2"],
      ],
      [
        "Bad line 6, col 1 to line 6, col 3 of module M",
        [
          "line 6, col 8 to line 6, col 43 of module M: 2",
          "|line 6, col 8 to line 6, col 16 of module M: 2",
          "|line 6, col 22 to line 6, col 42 of module M: 2",
          "||line 6, col 22 to line 6, col 26 of module M: 2",
          "||line 6, col 31 to line 6, col 42 of module M: 1",
        ],
      ],
    ],
    "3 states generated, 2 distinct states found.",
  ]);
});

const formatDepthFirst = (config: string) => {
  const messages: string[] = [];
  const states: string[] = [];
  checkDepthFirst({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES r, f, n\nTypeOK == r.a \\in Nat\nInit == r = [b |-> 0, a |-> 0] /\\ f = ("b" :> 0 @@ "a" :> 0) /\\ n = 0\nNext == n < 3 /\\ n\' = n + 1 /\\ r\' = [b |-> n, a |-> n] /\\ f\' = ("b" :> n @@ "a" :> n)\nInv == n < 2\nCons == n # 2\nPositive == n > 0\n====',
    config,
    maxDepth: 5,
    onPrint: () => {},
    onOutput: (output) => {
      if (output.kind === "message") messages.push(output.message);
      if (output.kind === "behavior") states.push(...output.states);
    },
  });
  return { messages, states };
};

it("sorts the records of an initial state it fingerprints, as TLC's TLCStateMut#fingerPrint does", () => {
  expect(formatDepthFirst("INIT Init\nNEXT Next\nINVARIANT Positive").messages).toContain(
    "Invariant Positive is violated by the initial state:\n/\\ f = [a |-> 0, b |-> 0]\n/\\ n = 0\n/\\ r = [a |-> 0, b |-> 0]\n",
  );
});

it("sorts the records of the states it fingerprints and prints a successor outside the model as written, as TLC does", () => {
  expect(formatDepthFirst("INIT Init\nNEXT Next\nINVARIANT Inv\nCONSTRAINT Cons").states).toEqual([
    "/\\ f = [a |-> 0, b |-> 0]\n/\\ n = 0\n/\\ r = [a |-> 0, b |-> 0]\n",
    "/\\ f = [a |-> 0, b |-> 0]\n/\\ n = 1\n/\\ r = [a |-> 0, b |-> 0]\n",
    "/\\ f = [b |-> 1, a |-> 1]\n/\\ n = 2\n/\\ r = [b |-> 1, a |-> 1]\n",
  ]);
});

const dumpDepthFirst = (body: string, config: string, colorize: boolean) => {
  const written = new Map<string, string>();
  checkDepthFirst({
    source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\n${body}\n====`,
    config,
    maxDepth: 4,
    dump: { path: "M.dot", dot: true, colorize, actionLabels: true },
    writeFile: (path, content) => written.set(path, String(content)),
    onOutput: () => {},
  });
  return written.get("M.dot");
};

it("dumps the state graph at each level with unlabeled edges, as TLC's DFIDModelChecker does", () => {
  expect(
    dumpDepthFirst("Init == x = 0\nNext == x' = (x + 1) % 3", "INIT Init\nNEXT Next", true),
  ).toBe(
    [
      "strict digraph DiskGraph {",
      "node [shape=box,style=rounded]",
      'edge [colorscheme="paired12"]',
      "nodesep=0.35;",
      "subgraph cluster_graph {",
      'color="white";',
      '-3406341414084290173 [label="x = 0",style = filled]',
      "-3406341414084290173 -> -686636423115914061;",
      '-686636423115914061 [label="x = 1",tooltip="x = 1"];',
      "-3406341414084290173 -> -686636423115914061;",
      "-686636423115914061 -> -7115858903467826205;",
      '-7115858903467826205 [label="x = 2",tooltip="x = 2"];',
      "-3406341414084290173 -> -686636423115914061;",
      "-686636423115914061 -> -7115858903467826205;",
      "-7115858903467826205 -> -3406341414084290173;",
      "{rank = same; -3406341414084290173;}",
      "{rank = same; -686636423115914061;}",
      "{rank = same; -7115858903467826205;}",
      "}",
      "}",
    ].join("\n"),
  );
});

// Deviation from TLC: it returns without closing the writer after an initial state fails, which leaves the header alone in the file.
it("dumps the whole graph when an initial state violates an invariant, unlike TLC", () => {
  expect(
    dumpDepthFirst(
      "Init == x = 0\nNext == x' = x\nInv == x # 0",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
      false,
    ),
  ).toBe(
    'strict digraph DiskGraph {\nnode [shape=box,style=rounded]\nnodesep=0.35;\nsubgraph cluster_graph {\ncolor="white";\n-3406341414084290173 [label="x = 0",style = filled]\n{rank = same; -3406341414084290173;}\n}\n}',
  );
});

// Deviation from TLC: DFIDModelChecker#modelCheck exits with 0, since its replay of the initial states skips the invariants of states it has seen.
it("exits with 75 after an initial state's invariant fails to evaluate, unlike TLC", () => {
  const outputs: DepthFirstOutput[] = [];
  const exitCode = checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in {0, 1, 2}\nNext == x' = x + 1\nInv == x = 1 => 1 \\div 0 = 0\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    maxDepth: 3,
    onOutput: (output) => outputs.push(output),
  });
  expect([
    exitCode,
    outputs.flatMap((output) => (output.kind === "message" ? [output.message] : [])),
  ]).toEqual([
    75,
    [
      "The second argument of \\div is 0.\nWhile working on the initial state:\nx = 1\n",
      "3 states generated, 3 distinct states found.",
    ],
  ]);
});

it("leaves the header of the liveness graph that TLC opens before it refuses to check liveness", () => {
  const written = new Map<string, string>();
  checkDepthFirst({
    source:
      "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = x\nSpec == Init /\\ [][Next]_x\nLive == <>(x = 0)\n====",
    config: "SPECIFICATION Spec\nPROPERTY Live",
    maxDepth: 4,
    dump: { path: "M.dot", dot: true },
    writeFile: (path, content) => written.set(path, String(content)),
    onOutput: () => {},
  });
  expect(written.get("M_liveness.dot")).toBe(
    'digraph DiskGraph {\nnode [shape=box,style=rounded]\nnodesep=0.35;\nsubgraph cluster_graph {\ncolor="white";\n',
  );
});

it("dumps the step again as TLC's DFIDModelChecker replays an invariant that fails to evaluate", () => {
  expect(
    dumpDepthFirst(
      "Init == x = 0\nNext == x' = 1 - x\nBad == x = 1 => x \\div 0 = 1",
      "INIT Init\nNEXT Next\nINVARIANT Bad",
      false,
    ),
  ).toBe(
    [
      "strict digraph DiskGraph {",
      "node [shape=box,style=rounded]",
      "nodesep=0.35;",
      "subgraph cluster_graph {",
      'color="white";',
      '-3406341414084290173 [label="x = 0",style = filled]',
      "-3406341414084290173 -> -686636423115914061;",
      '-686636423115914061 [label="x = 1",tooltip="x = 1"];',
      "-3406341414084290173 -> -686636423115914061;",
      "{rank = same; -3406341414084290173;}",
      "}",
      "}",
    ].join("\n"),
  );
});

it("warns about symmetry during liveness checking whenever the configuration declares it, as TLC's Tool#hasSymmetry asks", () => {
  const progress: CheckProgress[] = [];
  checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS TLC\nCONSTANTS a, b\nVARIABLE x\nInit == x \\in {a, b}\nNext == UNCHANGED x\nSym == Permutations({a})\nLive == <>(x = a)\n====",
    config: "CONSTANTS a = a\nb = b\nINIT Init\nNEXT Next\nSYMMETRY Sym\nPROPERTY Live",
    maxDepth: 3,
    onOutput: () => {},
    onProgress: (event) => {
      if (event.kind === "liveness-initializing") progress.push(event);
    },
  });
  expect(progress).toEqual([
    { kind: "liveness-initializing", isSymmetric: true, isConstrained: false },
  ]);
});

it("reports an initial conjunct it evaluates whole at the instance that holds it, as TLC's Tool does", () => {
  const outputs: DepthFirstOutput[] = [];
  checkDepthFirst({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nJ == INSTANCE N WITH k <- 0\nSpec == x = 0 /\\ y = 0 /\\ J!Bad /\\ [][UNCHANGED <<x, y>>]_<<x, y>>\n====\n",
    config: "SPECIFICATION Spec\n",
    loadModule: (name) =>
      name === "N"
        ? "---- MODULE N ----\nEXTENDS Naturals\nCONSTANT k\nVARIABLES x, y\nSum == 1 + 1\nBad == x + 1\nInit == x = k /\\ y = 0\n====\n"
        : undefined,
    maxDepth: 3,
    onOutput: (output) => outputs.push(output),
  });
  expect(outputs.find((output) => output.kind === "message" && output.isError)).toMatchObject({
    message:
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nThe error occurred when TLC was computing initial states.\nThe exception was a java.lang.RuntimeException\n: In computing initial states, TLC expected a boolean expression,\nbut instead found 1.\nline 4, col 1 to line 4, col 27 of module M",
  });
});

const getSecondInitialLines = (next: string, config: string) => {
  const lines: string[] = [];
  checkDepthFirst({
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in {0, 1}\n${next}\n====`,
    config,
    maxDepth: 3,
    onOutput: (output) => {
      if (output.kind === "message") lines.push(output.message);
      if (output.kind === "behavior") lines.push(...output.states);
    },
  });
  return lines;
};

it("prints the state that breaks an invariant from the second initial state, where TLC's DFIDWorker#printInvariantTrace prints only State 1", () => {
  expect(
    getSecondInitialLines(
      "Next == x' = x + 2\nInv == x # 3",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    ),
  ).toEqual([
    "Finished computing initial states: 2 states generated, with 2 of them distinct.",
    "Starting level 2: 2 states generated, 2 distinct states found.",
    "Invariant Inv is violated.",
    "The behavior up to this point is:",
    "x = 1\n",
    "x = 3\n",
    "4 states generated, 4 distinct states found.",
  ]);
});

it("prints a deadlocked second initial state once, where TLC's DFIDWorker#printErrorTrace prints it as State 1 and State 2", () => {
  expect(getSecondInitialLines("Next == x = 0 /\\ x' = 0", "INIT Init\nNEXT Next")).toEqual([
    "Finished computing initial states: 2 states generated, with 2 of them distinct.",
    "Starting level 2: 2 states generated, 2 distinct states found.",
    "Deadlock reached.",
    "The behavior up to this point is:",
    "x = 1\n",
    "3 states generated, 2 distinct states found.",
  ]);
});

it("checks the assumptions of a specification without variables and then completes with no initial state, as TLC's DFIDModelChecker does without an initial predicate", () => {
  const outputs: DepthFirstOutput[] = [];
  const printed: string[] = [];
  const exitCode = checkDepthFirst({
    source: "---- MODULE M ----\nEXTENDS Naturals, TLC\nCONSTANT N\nASSUME PrintT(N + 1)\n====",
    config: "CONSTANT N = 3",
    maxDepth: 3,
    onPrint: (text) => printed.push(text),
    onOutput: (output) => outputs.push(output),
  });
  expect([
    exitCode,
    printed,
    outputs.map((output) =>
      output.kind === "message"
        ? `${output.code} ${output.message}`
        : output.kind === "success"
          ? `success ${output.optimistic} ${output.actual}`
          : output.kind,
    ),
  ]).toEqual([
    0,
    ["4"],
    [
      "2208 Finished computing initial states: 0 states generated, with 0 of them distinct.",
      "success 0 0",
      "2204 0 states generated, 0 distinct states found.",
    ],
  ]);
});

const searchTwoInitialStates = (source: string) => {
  const outputs: DepthFirstOutput[] = [];
  const exitCode = checkDepthFirst({
    source,
    config: "INIT Init\nNEXT Next",
    maxDepth: 3,
    onOutput: (output) => outputs.push(output),
  });
  return [
    exitCode,
    outputs.map((output) =>
      output.kind === "message"
        ? `${output.code} ${output.message}`
        : output.kind === "success"
          ? `success ${formatProbability(output.optimistic)} ${formatProbability(output.actual)}`
          : output.kind,
    ),
  ];
};

it("reports the distance of two fingerprints that share a negative low word, which TLC's MemFPIntSet#checkFPs reads as equal before it divides by zero", () => {
  expect(
    searchTwoInitialStates(
      "---- MODULE M ----\nVARIABLES x, y\nInit == \\/ x = 0 /\\ y = 1\n        \\/ x = 27370 /\\ y = 42572\nNext == UNCHANGED <<x, y>>\n====",
    ),
  ).toEqual([
    0,
    [
      "2208 Finished computing initial states: 2 states generated, with 2 of them distinct.",
      "2205 Starting level 2: 2 states generated, 2 distinct states found.",
      "success 2.2E-19 2.2E-19",
      "2204 4 states generated, 2 distinct states found.",
    ],
  ]);
});

it("reports the distance of two fingerprints with different negative low words, which TLC's MemFPIntSet#checkFPs measures by their low words alone as 2.2E-8", () => {
  expect(
    searchTwoInitialStates(
      "---- MODULE M ----\nVARIABLES x, y\nInit == \\/ x = 0 /\\ y = 1\n        \\/ x = 0 /\\ y = 4\nNext == UNCHANGED <<x, y>>\n====",
    ),
  ).toEqual([
    0,
    [
      "2208 Finished computing initial states: 2 states generated, with 2 of them distinct.",
      "2205 Starting level 2: 2 states generated, 2 distinct states found.",
      "success 2.2E-19 1.1E-19",
      "2204 4 states generated, 2 distinct states found.",
    ],
  ]);
});

it("reports a positive probability for two fingerprints in a bucket that differ by 2^63, where TLC's MemFPIntSet#checkFPs takes Math.abs(Long.MIN_VALUE)", () => {
  expect(
    searchTwoInitialStates(
      "---- MODULE M ----\nVARIABLES x, y, z\nInit == \\/ x = 0 /\\ y = 0 /\\ z = 0\n        \\/ x = 3424530 /\\ y = 1985122 /\\ z = 1350749\nNext == UNCHANGED <<x, y, z>>\n====",
    ),
  ).toEqual([
    0,
    [
      "2208 Finished computing initial states: 2 states generated, with 2 of them distinct.",
      "2205 Starting level 2: 2 states generated, 2 distinct states found.",
      "success 2.2E-19 1.1E-19",
      "2204 4 states generated, 2 distinct states found.",
    ],
  ]);
});

const checkPostcondition = (config: string, maxDepth: number) => {
  const prints: string[] = [];
  const messages: string[] = [];
  const exitCode = checkDepthFirst({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nNever == x = 7\nPost == TLCGet("level") < 0\nStats == PrintT(<<TLCGet("level"), TLCGet("diameter"), TLCGet("stats").generated, TLCGet("stats").distinct, TLCGet("stats").queue>>)\nBad == x = 1 => CHOOSE v \\in {} : TRUE\n====',
    config: `INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\n${config}`,
    maxDepth,
    onPrint: (text) => prints.push(text),
    onOutput: (output) => {
      if (output.kind === "message") messages.push(output.message);
      if (output.kind === "success") messages.push("success");
    },
  });
  return [exitCode, prints, messages];
};

const NEVER_WITNESSED =
  "The _POSSIBLE predicate Never at line 6, col 10 to line 6, col 14 of module M was never witnessed.\nOthers may be unwitnessed too; only witnessed predicates appear with a\nnon-zero count in the record printed above.\nSee https://explain.tlapl.us/possible-conditions for additional details.";

const POST_FALSE = "Postcondition Post at line 7, col 9 to line 7, col 27 of module M is false.";

const LEVELS = [
  "Finished computing initial states: 1 states generated, with 1 of them distinct.",
  "Starting level 2: 1 states generated, 1 distinct states found.",
  "Starting level 3: 2 states generated, 2 distinct states found.",
];

const LEVEL_4 = "Starting level 4: 4 states generated, 3 distinct states found.";

it.each([
  [
    "_POSSIBLE Never",
    3,
    ["[Never |-> 0]"],
    [NEVER_WITNESSED, "4 states generated, 3 distinct states found."],
  ],
  [
    "_POSSIBLE Never",
    9,
    ["[Never |-> 0]"],
    [LEVEL_4, NEVER_WITNESSED, "6 states generated, 3 distinct states found."],
  ],
  ["POSTCONDITION Post", 3, [], [POST_FALSE, "4 states generated, 3 distinct states found."]],
  [
    "POSTCONDITION Post",
    9,
    [],
    [LEVEL_4, POST_FALSE, "6 states generated, 3 distinct states found."],
  ],
])(
  "fails %s under -dfid %i as model checking does, where TLC's DFIDModelChecker checks no postconditions",
  (config, maxDepth, prints, messages) => {
    expect(checkPostcondition(config, maxDepth)).toEqual([10, prints, [...LEVELS, ...messages]]);
  },
);

it("evaluates a postcondition under -dfid with the -1 that TLCGet reports for DFID's statistics", () => {
  expect(checkPostcondition("POSTCONDITION Stats", 9)).toEqual([
    0,
    ["<<0, -1, -1, -1, -1>>"],
    [...LEVELS, LEVEL_4, "success", "6 states generated, 3 distinct states found."],
  ]);
});

it("stops at a _POSSIBLE predicate that fails under -dfid as TLC's DFIDWorker stops at the constraint that tracks it", () => {
  expect(checkPostcondition("_POSSIBLE Bad", 9)).toEqual([
    255,
    [],
    [
      "Finished computing initial states: 1 states generated, with 1 of them distinct.",
      "Starting level 2: 1 states generated, 1 distinct states found.",
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nThe error occurred when TLC was computing the set of next states.\nThe exception was a java.lang.RuntimeException\n: Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 9, col 17 to line 9, col 38 of module M",
      "The behavior up to this point is:",
      "3 states generated, 1 distinct states found.",
    ],
  ]);
});
