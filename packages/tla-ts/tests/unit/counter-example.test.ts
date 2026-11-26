import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { printCheckProgress, printResult, type Timing } from "../../src/cli/tlc-output";
import { simulate } from "../../src/simulate";
import { formatMessage, type MessagePrinter } from "../../src/tlc/messages";
import { checkFixture } from "./check-harness";

const checkCounterExample = async (configName: string) => {
  const printed: string[] = [];
  const result = await checkFixture("tlc-ext", "CounterExample", configName, {
    onPrint: (text) => printed.push(text),
  });
  return [result.status, ...printed, ...(result.violation?.postconditionOutput ?? [])];
};

describe("POSTCONDITION after a violation matches TLC", () => {
  it("binds CounterExample to the behavior that violates an invariant or deadlocks", async () => {
    expect(
      await Promise.all(
        ["CounterExampleInvariant", "CounterExampleDeadlock"].map(checkCounterExample),
      ),
    ).toEqual([
      [
        "invariant-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>}',
      ],
      ["deadlock", "<<[x |-> 0], [x |-> 1], [x |-> 2]>>", '{<<1, "Up", 2>>, <<2, "Up", 3>>}'],
    ]);
  });

  it("closes the lasso of a liveness violation with the step back to the loop", async () => {
    expect(
      await Promise.all(["CounterExampleCycle", "CounterExampleStutter"].map(checkCounterExample)),
    ).toEqual([
      [
        "liveness-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>, <<3, "Back", 2>>}',
      ],
      [
        "liveness-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>, <<3, "Up", 3>>}',
      ],
    ]);
  });

  it("keeps the status of the violation when the postcondition is false", async () => {
    expect((await checkCounterExample("CounterExampleFails"))[0]).toBe("invariant-violation");
  });

  it("prints a warning the postcondition raises after the behavior, as TLC evaluates it there", async () => {
    const warnings: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 1 /\\ x\' = x + 1\nPost == PrintT("post") /\\ [[a |-> 1] EXCEPT !.b = TLCGet("level")].a = 1\n====',
      config: "INIT Init\nNEXT Next\nPOSTCONDITION Post",
      onPrint: () => {},
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress.text);
      },
    });
    expect([warnings, result.violation?.postconditionOutput]).toEqual([
      [],
      [
        '"post"',
        {
          kind: "warning",
          code: 2144,
          text: "The EXCEPT was applied to non-existing fields of the value at\nline 6, col 28 to line 6, col 36 of module M",
        },
      ],
    ]);
  });
});

describe("POSTCONDITION with a dumped trace matches TLC", () => {
  const source =
    "---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nInv == x < 1\nPost == PrintT(CounterExample)\n====";
  const config = "INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post";
  const counterExample = [
    "[ state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>},",
    "  action |->",
    "      { << <<1, [x |-> 0]>>,",
    '           [ name |-> "Next",',
    "             location |->",
    "                 [ beginLine |-> 5,",
    "                   beginColumn |-> 9,",
    "                   endLine |-> 5,",
    "                   endColumn |-> 18,",
    '                   module |-> "M" ] ],',
    "           <<2, [x |-> 1]>> >> } ]",
  ].join("\n");

  it.each([
    ["_JsonTrace", "_JsonTraceFile", "t.json"],
    ["_TLCTrace", "_TLCTraceFile", "t.bin"],
  ])(
    "orders the fields of CounterExample by the strings of %s, which TLC adds to the modules the root extends",
    async (module, constant, path) => {
      const result = await check({
        source,
        config,
        moduleOperators: [
          { kind: "postcondition", module, operator: module, constants: { [constant]: path } },
        ],
        onPrint: () => {},
        writeFile: () => {},
      });
      expect(result.violation?.postconditionOutput).toEqual([
        `"CounterExample written: ${path}"`,
        counterExample,
      ]);
    },
  );

  it("writes the fields of each action of a lasso in TLC's order to JSON, though the spec's location and d sort before name and r", async () => {
    let written = "";
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE location\nSteps == {d \\in 1..1 : TRUE}\nMove(r, d) == location < 2 /\\ location' = location + d\nNext == \\E r \\in {0}, d \\in Steps : Move(r, d)\nSpec == location = 0 /\\ [][Next]_location\nLive == <>(location = 5)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE",
      moduleOperators: [
        {
          kind: "postcondition",
          module: "_JsonTrace",
          operator: "_JsonTrace",
          constants: { _JsonTraceFile: "t.json" },
        },
      ],
      onPrint: () => {},
      writeFile: (_path, content) => {
        written = typeof content === "string" ? content : new TextDecoder().decode(content);
      },
    });
    const action = (from: number, to: number) =>
      `[[${from},{"location":${from - 1}}],{"name":"Move","location":{"beginLine":5,"beginColumn":15,"endLine":5,"endColumn":54,"module":"M"},"context":{"r":0,"d":1},"parameters":["r","d"]},[${to},{"location":${to - 1}}]]`;
    expect(written).toBe(
      `{"counterexample":{"action":[${action(1, 2)},${action(2, 3)},${action(3, 3)}],"state":[[1,{"location":0}],[2,{"location":1}],[3,{"location":2}]]},"vars":["location"]}`,
    );
  });

  it("orders the fields of CounterExample by the strings of _TLCTrace, which the binary trace of the trace spec adds to the modules the root extends", async () => {
    const result = await check({
      source,
      config,
      traceSpec: { module: "M_TTrace_0", traceFile: "M_TTrace_0.bin" },
      onPrint: () => {},
      writeFile: () => {},
    });
    expect(result.violation?.postconditionOutput).toEqual([counterExample]);
  });
});

const checkAliased = async (body: string, config: string) => {
  const printed: string[] = [];
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nAlias == [a |-> x, n |-> x']\nPost == PrintT(CounterExample.state)\nInit == x = 0\n${body}\n====`,
    config: `INIT Init\nNEXT Next\n${config}\nALIAS Alias\nPOSTCONDITION Post`,
    onPrint: (text) => printed.push(text),
  });
  return [...printed, ...(result.violation?.postconditionOutput ?? [])];
};

describe("POSTCONDITION with an ALIAS matches TLC", () => {
  it("binds CounterExample to the alias of each state of a safety violation", async () => {
    expect(
      await Promise.all([
        checkAliased("Next == x' = x + 1\nInv == x < 2", "INVARIANT Inv"),
        checkAliased("Next == FALSE /\\ x' = x", ""),
      ]),
    ).toEqual([
      ["{ <<1, [a |-> 0, n |-> 1]>>,\n  <<2, [a |-> 1, n |-> 2]>>,\n  <<3, [a |-> 2, n |-> 2]>> }"],
      ["{<<1, [a |-> 0, n |-> 0]>>}"],
    ]);
  });

  it("binds CounterExample to the states of an initial state that violates an invariant", async () => {
    expect(await checkAliased("Next == x' = x + 1\nInv == x > 0", "INVARIANT Inv")).toEqual([
      "{<<1, [x |-> 0]>>}",
    ]);
  });
});

const checkFailedNext = async (next: string, config: string) => {
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nPost == PrintT(DOMAIN CounterExample)\nInit == x = 0\nNext == ${next}\n====`,
    config: `INIT Init\nNEXT Next\nPOSTCONDITION Post\n${config}`,
    onPrint: () => {},
  });
  return result.failure?.traceOutput ?? [];
};

describe("POSTCONDITION after a next-state failure matches TLC", () => {
  it("checks the postconditions only as TLC goes on to find the failed state deadlocked", async () => {
    const failing = "x' = x + 1 /\\ (x < 1 \\/ CHOOSE e \\in {} : TRUE)";
    expect(
      await Promise.all([
        checkFailedNext(failing, ""),
        checkFailedNext(failing, "CHECK_DEADLOCK FALSE"),
        checkFailedNext("x' = x + 1 \\/ (x = 1 /\\ CHOOSE e \\in {} : TRUE)", ""),
      ]),
    ).toEqual([['{"action", "state", "console"}'], [], []]);
  });
});

const printAfterLastTrace = async (
  definitions: string,
  post: string,
  config: string,
  isContinued: boolean,
) => {
  const lines: string[] = [];
  const printer: MessagePrinter = {
    isTool: false,
    isDiffTrace: false,
    version: "master",
    print: (code, level, text) => lines.push(formatMessage(false, code, level, text)),
    printOutput: (text) => lines.push(text),
  };
  const timing: Timing = {
    startTime: Date.now(),
    isParsed: true,
    livenessStartTime: undefined,
    lastProgress: undefined,
  };
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC\n${definitions}\nPost == ${post}\n====`,
    config: `${config}\nPOSTCONDITION Post`,
    isContinued,
    onPrint: printer.printOutput,
    onProgress: (progress) => {
      if (progress.kind === "violation") printCheckProgress(printer, progress, timing, ".");
    },
  });
  printResult(result, printer, timing);
  return lines.slice(lines.lastIndexOf("Error: The behavior up to this point is:") + 1);
};

describe("POSTCONDITION before what TLC prints after it matches TLC", () => {
  const callStack = (positions: string[]) =>
    `Error: The error occurred when TLC was evaluating the nested\nexpressions at the following positions:\n${positions.map((position, index) => `${index}. ${position} in M\n`).join("")}\n`;
  const failedNextPositions = [
    "Line 5, column 9 to line 5, column 46",
    "Line 5, column 9 to line 5, column 29",
    "Line 5, column 34 to line 5, column 46",
    "Line 5, column 39 to line 5, column 46",
  ];
  const step = (state: number) =>
    `State ${state}: <Next line 5, col 9 to line 5, col 52 of module M>\nx = ${state - 1}\n`;
  const statistics = (states: number) => [
    `${states} states generated, ${states} distinct states found, 0 states left on queue.`,
    `The depth of the complete state graph search is ${states}.`,
  ];

  it.each([
    [
      "prints the replay of a failed next-state relation after the postconditions",
      'VARIABLE x\nInit == x = 0\nNext == PrintT(<<"next", x>>) /\\ x\' = 1 \\div x',
      'TLCGet("distinct") < 0',
      "INIT Init\nNEXT Next",
      false,
      [
        "State 1: <Initial predicate>\nx = 0\n",
        "Error: Postcondition Post at line 6, col 9 to line 6, col 30 of module M is false.",
        '<<"next", 0>>',
        callStack(failedNextPositions),
        ...statistics(1),
      ],
    ],
    [
      "prints the replay of a failed next-state relation after a postcondition that fails to evaluate",
      'VARIABLE x\nInit == x = 0\nNext == PrintT(<<"next", x>>) /\\ x\' = 1 \\div x',
      "1 \\div 0 = 0",
      "INIT Init\nNEXT Next",
      false,
      [
        "State 1: <Initial predicate>\nx = 0\n",
        "Error: Evaluating postcondition Post at line 6, col 9 to line 6, col 20 of module M failed.\nThe second argument of \\div is 0.",
        '<<"next", 0>>',
        callStack(failedNextPositions),
        ...statistics(1),
      ],
    ],
    [
      "prints what a failed next-state relation adds to the behavior graph and replays after the postconditions",
      'VARIABLE x\nInit == x = 0\nNext == PrintT(<<"next", x>>) /\\ x\' = 1 \\div x\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == <>(x = 5)',
      'TLCGet("distinct") < 0',
      "SPECIFICATION Spec\nPROPERTY Live",
      false,
      [
        "State 1: <Initial predicate>\nx = 0\n",
        "Error: Postcondition Post at line 8, col 9 to line 8, col 30 of module M is false.",
        '<<"next", 0>>',
        '<<"next", 0>>',
        callStack(["Line 6, column 36 to line 6, column 39", ...failedNextPositions]),
        ...statistics(1),
      ],
    ],
    [
      "prints what the state before an invariant violation adds to the behavior graph after the postconditions",
      'VARIABLE x\nInit == x = 0\nNext == PrintT(<<"next", x>>) /\\ x < 3 /\\ x\' = x + 1\nInv == x < 2\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == <>(x = 5)',
      'TLCGet("distinct") < 0',
      "SPECIFICATION Spec\nINVARIANT Inv\nPROPERTY Live",
      false,
      [
        "State 1: <Initial predicate>\nx = 0\n",
        '<<"next", 0>>',
        step(2),
        '<<"next", 1>>',
        step(3),
        '<<"next", 0>>',
        '<<"next", 1>>',
        "Error: Postcondition Post at line 9, col 9 to line 9, col 30 of module M is false.",
        '<<"next", 1>>',
        '<<"next", 1>>',
        '<<"next", 1>>',
        ...statistics(3),
      ],
    ],
    [
      "prints what a deadlocked state adds to the behavior graph after the postconditions",
      'VARIABLE x\nInit == x = 0\nNext == PrintT(<<"next", x>>) /\\ x < 2 /\\ x\' = x + 1\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == <>(x = 5)',
      'TLCGet("distinct") < 0',
      "SPECIFICATION Spec\nPROPERTY Live",
      false,
      [
        "State 1: <Initial predicate>\nx = 0\n",
        step(2),
        '<<"next", 1>>',
        step(3),
        '<<"next", 0>>',
        '<<"next", 1>>',
        "Error: Postcondition Post at line 8, col 9 to line 8, col 30 of module M is false.",
        '<<"next", 2>>',
        ...statistics(3),
      ],
    ],
    [
      "prints what a deadlocked state adds to the behavior graph after the postconditions under -continue",
      'VARIABLE x\nInit == x = 0\nNext == PrintT(<<"next", x>>) /\\ x < 3 /\\ x\' = x + 1\nInv == x < 2\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == <>(x = 5)',
      'TLCGet("distinct") < 0',
      "SPECIFICATION Spec\nINVARIANT Inv\nPROPERTY Live",
      true,
      [
        "State 1: <Initial predicate>\nx = 0\n",
        step(2),
        step(3),
        '<<"next", 2>>',
        step(4),
        '<<"next", 0>>',
        '<<"next", 1>>',
        '<<"next", 2>>',
        "Error: Postcondition Post at line 9, col 9 to line 9, col 30 of module M is false.",
        '<<"next", 3>>',
        ...statistics(4),
      ],
    ],
  ])("%s", async (_title, definitions, post, config, isContinued, lines) => {
    expect(await printAfterLastTrace(definitions, post, config, isContinued)).toEqual(lines);
  });

  it("prints what an incomplete successor adds to the behavior graph and replays after the postconditions, where TLC fails before them", async () => {
    expect(
      await printAfterLastTrace(
        'VARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == PrintT(<<"next", x>>) /\\ x\' = x + 1\nSpec == Init /\\ [][Next]_<<x, y>> /\\ WF_<<x, y>>(Next)\nLive == <>(x = 5)',
        'TLCGet("distinct") < 0',
        "SPECIFICATION Spec\nPROPERTY Live",
        false,
      ),
    ).toEqual([
      "State 1: <Initial predicate>\n/\\ x = 0\n/\\ y = 0\n",
      '<<"next", 0>>',
      "State 2: <Next line 5, col 9 to line 5, col 43 of module M>\n/\\ x = 1\n/\\ y = null\n",
      "Error: Postcondition Post at line 8, col 9 to line 8, col 30 of module M is false.",
      '<<"next", 0>>',
      '<<"next", 0>>',
      callStack([
        "Line 6, column 50 to line 6, column 53",
        "Line 5, column 9 to line 5, column 43",
        "Line 5, column 9 to line 5, column 29",
        "Line 5, column 34 to line 5, column 43",
        "Line 6, column 41 to line 6, column 48",
        "Line 6, column 46 to line 6, column 46",
      ]),
      "2 states generated, 1 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 1.",
    ]);
  });
});

const checkUnassigned = async (init: string, printed: string) => {
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLES x, y\nInit == ${init}\nNext == x' = 1\nPost == PrintT(${printed}) /\\ FALSE\n====`,
    config: "INIT Init\nNEXT Next\nPOSTCONDITION Post",
    onPrint: () => {},
  });
  return [result.failure?.traceOutput, result.failure?.postcondition?.message];
};

describe("POSTCONDITION after a state that leaves a variable unassigned", () => {
  it("checks the postconditions after an illegal initial state, as TLC does", async () => {
    expect(await checkUnassigned("x = 0", 'TLCGet("stats").generated')).toEqual([
      ["1"],
      "Postcondition Post at line 6, col 9 to line 6, col 50 of module M is false.",
    ]);
  });

  it("binds CounterExample to an illegal initial state with null for the unassigned variable", async () => {
    expect(await checkUnassigned("x = 0", "CounterExample")).toEqual([
      ["[action |-> {}, state |-> {<<1, [x |-> 0, y |-> null]>>}]"],
      "Postcondition Post at line 6, col 9 to line 6, col 39 of module M is false.",
    ]);
  });

  it("binds CounterExample to an incomplete successor with null for the unassigned variable, where TLC fails before the postconditions", async () => {
    expect(await checkUnassigned("x = 0 /\\ y = 0", "CounterExample")).toEqual([
      [
        [
          "[ action |->",
          "      { << <<1, [x |-> 0, y |-> 0]>>,",
          '           [ name |-> "Next",',
          "             location |->",
          "                 [ beginLine |-> 5,",
          "                   beginColumn |-> 9,",
          "                   endLine |-> 5,",
          "                   endColumn |-> 14,",
          '                   module |-> "M" ] ],',
          "           <<2, [x |-> 1, y |-> null]>> >> },",
          "  state |-> {<<1, [x |-> 0, y |-> 0]>>, <<2, [x |-> 1, y |-> null]>>} ]",
        ].join("\n"),
      ],
      "Postcondition Post at line 6, col 9 to line 6, col 39 of module M is false.",
    ]);
  });
});

const STATE_ORDER_SOURCE =
  "---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLES x, s, r\nInit == x = 0 /\\ s = 0 /\\ r = 0\nNext == x < 2 /\\ x' = x + 1 /\\ UNCHANGED <<s, r>>\nInv == x < 2 \\/ PrintT(ToString(Trace))\nBound == x < 2\nPost == PrintT(ToString(CounterExample.state))\n====";
const STATE_ORDER_CONFIG =
  "INIT Init\nNEXT Next\nINVARIANT Inv\nINVARIANT Bound\nPOSTCONDITION Post";
const STATE_ORDER_COUNTER_EXAMPLE =
  '"{<<1, [r |-> 0, s |-> 0, x |-> 0]>>, <<2, [r |-> 0, s |-> 0, x |-> 1]>>, <<3, [r |-> 0, s |-> 0, x |-> 2]>>}"';

describe("the state records of Trace and CounterExample match TLC", () => {
  it("keeps the variables in TLC's order, which ToString and JSON show unsorted", async () => {
    const printed: string[] = [];
    const result = await check({
      source: STATE_ORDER_SOURCE,
      config: STATE_ORDER_CONFIG,
      onPrint: (text) => printed.push(text),
    });
    expect([...printed, ...(result.violation?.postconditionOutput ?? [])]).toEqual([
      '"<<[r |-> 0, s |-> 0, x |-> 0], [r |-> 0, s |-> 0, x |-> 1], [r |-> 0, s |-> 0, x |-> 2]>>"',
      STATE_ORDER_COUNTER_EXAMPLE,
    ]);
  });

  it("keeps the records PrintT sorted in the set of states for ToString and JsonSerialize", async () => {
    const printed: string[] = [];
    const written = new Map<string, string>();
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt, Json\nVARIABLES x, s, r\nInit == x = 0 /\\ s = 0 /\\ r = 0\nNext == x < 2 /\\ x\' = x + 1 /\\ UNCHANGED <<s, r>>\nInv == x < 2\nPost == PrintT(CounterExample.state) /\\ PrintT(ToString(CounterExample.state)) /\\ JsonSerialize("p.json", CounterExample)\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post",
      onPrint: (text) => printed.push(text),
      writeFile: (path, content) => written.set(path, String(content)),
    });
    expect([...printed, ...(result.violation?.postconditionOutput ?? [])]).toEqual([
      "{ <<1, [x |-> 0, s |-> 0, r |-> 0]>>,\n  <<2, [x |-> 1, s |-> 0, r |-> 0]>>,\n  <<3, [x |-> 2, s |-> 0, r |-> 0]>> }",
      '"{<<1, [x |-> 0, s |-> 0, r |-> 0]>>, <<2, [x |-> 1, s |-> 0, r |-> 0]>>, <<3, [x |-> 2, s |-> 0, r |-> 0]>>}"',
    ]);
    expect(written.get("p.json")).toBe(
      '{"action":[[[1,{"x":0,"s":0,"r":0}],{"name":"Next","location":{"beginLine":5,"beginColumn":9,"endLine":5,"endColumn":49,"module":"M"}},[2,{"x":1,"s":0,"r":0}]],[[2,{"x":1,"s":0,"r":0}],{"name":"Next","location":{"beginLine":5,"beginColumn":9,"endLine":5,"endColumn":49,"module":"M"}},[3,{"x":2,"s":0,"r":0}]]],"state":[[1,{"x":0,"s":0,"r":0}],[2,{"x":1,"s":0,"r":0}],[3,{"x":2,"s":0,"r":0}]]}',
    );
  });

  it("puts the action of a simulated state before its variables", () => {
    const printed: string[] = [];
    simulate({
      source: STATE_ORDER_SOURCE,
      config: STATE_ORDER_CONFIG,
      seed: 4n,
      traceDepth: 5,
      traceCount: 1n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onPrint: (text) => printed.push(text),
      onSimulation: () => {},
    });
    const getAction = (name: string, line: number, endColumn: number) =>
      `_action |-> [name |-> \\"${name}\\", location |-> [beginLine |-> ${line}, beginColumn |-> 9, endLine |-> ${line}, endColumn |-> ${endColumn}, module |-> \\"M\\"]]`;
    expect(printed).toEqual([
      `"<<[${getAction("Init", 4, 31)}, r |-> 0, s |-> 0, x |-> 0], [${getAction("Next", 5, 49)}, r |-> 0, s |-> 0, x |-> 1], [${getAction("Next", 5, 49)}, r |-> 0, s |-> 0, x |-> 2]>>"`,
      STATE_ORDER_COUNTER_EXAMPLE,
    ]);
  });
});
