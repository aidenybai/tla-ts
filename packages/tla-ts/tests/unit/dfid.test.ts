import { expect, it } from "vite-plus/test";
import type { CheckProgress } from "../../src";
import { checkDepthFirst, type DepthFirstOutput } from "../../src/dfid";

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
