import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { simulate } from "../../src/simulate";
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
