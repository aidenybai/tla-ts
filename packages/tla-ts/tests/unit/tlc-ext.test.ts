import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { checkFixture, formatCallStackLines } from "./check-harness";

const printTrace = async (definitions: string, config = "") => {
  const prints: string[] = [];
  await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt, Randomization\nVARIABLE x\n${definitions}\n====`,
    config: `INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\n${config}`,
    seed: 4n,
    onPrint: (text) => prints.push(text),
  });
  return prints;
};

const checkLive = async (init: string, next: string, live: string) => {
  const prints: string[] = [];
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == ${init}\nNext == ${next}\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nLive == ${live}\n====`,
    config: "SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE",
    onPrint: (text) => prints.push(text),
  });
  return { ...result, prints };
};

describe("TLCExt matches TLC", () => {
  it("checks TLC's TLCExtTrace model with Trace in an invariant and a constraint", async () => {
    const result = await checkFixture("tlc-ext", "TLCExtTrace");
    expect(result.status).toBe("deadlock");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([10, 10, 10]);
  });

  it("checks TLC's TLCExtTrace model with an alias", async () => {
    const result = await checkFixture("tlc-ext", "TLCExtTrace", "TLCExtTraceAlias");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(7);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([7, 7, 7]);
  });

  it("ends Trace in the state that the next-state relation extends", async () => {
    const result = await checkFixture("tlc-ext", "TraceNext");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 5, 5]);
  });

  it("reads Trace in an invariant 20,001 states deep without overflowing the stack, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x < 20000 /\\ x' = x + 1\nInv == x = 20000 => Len(Trace) = x + 1\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
    });
    expect([result.status, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      "success",
      20001,
      20001,
      20001,
    ]);
  });

  it("rebuilds and ends Trace through the expanded state for a successor that liveness checking meets again, as TLCExt#getTrace does", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == PrintT("init") /\\ x = 0\nNext == x\' = 1 - x\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nXs == [i \\in 1..Len(Trace) |-> Trace[i].x]\nLive == <>(x = 0 => PrintT(<<"live", x, Xs>>))\n====',
      config: "SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual([
      "success",
      [
        '"init"',
        '<<"live", 0, <<0>>>>',
        '<<"live", 0, <<0>>>>',
        '"init"',
        '"init"',
        '"init"',
        '"init"',
        '<<"live", 0, <<0, 1, 0>>>>',
      ],
    ]);
  });

  it("rebuilds the path to a new successor for each Trace that liveness checking reads in it, as TLCExt#getTrace does", async () => {
    const result = await checkLive(
      'PrintT("init") /\\ x = 0',
      "x' = 1 - x",
      '<>(PrintT(<<"live", x, Len(Trace)>>) /\\ x = 1)',
    );
    expect([result.status, result.prints]).toEqual([
      "success",
      [
        '"init"',
        '<<"live", 0, 1>>',
        '"init"',
        '<<"live", 1, 2>>',
        '<<"live", 0, 1>>',
        '"init"',
        '<<"live", 0, 3>>',
        '"init"',
        '<<"live", 1, 2>>',
      ],
    ]);
  });

  it('reads Trace and TLCGet("level") in liveness checking of a step back to the expanded state as one step further, as TLC\'s Worker does', async () => {
    const result = await checkLive(
      "x = 0",
      "x' = 1 - x \\/ x' = x",
      '<>(PrintT(<<"live", x, Len(Trace), TLCGet("level")>>) /\\ x = 1)',
    );
    expect([result.status, result.prints]).toEqual([
      "success",
      [
        '<<"live", 0, 1, 1>>',
        '<<"live", 1, 2, 2>>',
        '<<"live", 0, 2, 2>>',
        '<<"live", 0, 3, 3>>',
        '<<"live", 1, 3, 3>>',
      ],
    ]);
  });

  it('reads Trace and TLCGet("level") in the properties of a lasso as its path after rebuilding it, as Liveness#findViolatedProperties does', async () => {
    const result = await checkLive(
      'PrintT("init") /\\ x = 0',
      "x' = 1 - x",
      '<>(PrintT(<<"live", x, Len(Trace), TLCGet("level")>>) /\\ x = 5)',
    );
    expect([result.violation?.properties, result.violation?.trace[0].output]).toEqual([
      ["Live"],
      ['"init"', '<<"live", 0, 1, 1>>', '<<"live", 1, 2, 2>>'],
    ]);
  });

  // Deviation from TLC: it fails with 'Cannot invoke "tlc2.tool.TLCState.isInitial()" because "currentState" is null' after stuttering and "Index 32767 out of bounds for length 1" past depth 2.
  it.each([
    [
      "that ends in stuttering",
      "x < 1 /\\ x' = x + 1",
      ['<<"live", 0, 1, 1>>', '<<"live", 1, 2, 2>>'],
    ],
    [
      "past depth 2",
      "x' = (x + 1) % 3",
      ['<<"live", 0, 1, 1>>', '<<"live", 1, 2, 2>>', '<<"live", 2, 3, 3>>'],
    ],
  ])(
    "reads Trace in the properties of a lasso %s as its path, unlike TLC",
    async (_shape, next, output) => {
      const result = await checkLive(
        "x = 0",
        next,
        '<>(PrintT(<<"live", x, Len(Trace), TLCGet("level")>>) /\\ x = 5)',
      );
      expect([result.violation?.properties, result.violation?.trace[0].output]).toEqual([
        ["Live"],
        output,
      ]);
    },
  );

  it.each([
    [
      "the next-state relation",
      "Init == x = 0\nA(p) == x < 3 /\\ x' = x + 1 /\\ PrintT(p)\nNext == A(Trace)",
      "",
      [
        "<<[x |-> 0]>>",
        "<<[x |-> 0], [x |-> 1]>>",
        "<<[x |-> 0]>>",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
      ],
    ],
    [
      "an invariant and a constraint",
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1 /\\ PrintT(x)\nInv == Len(Trace) > 0\nConstr == Len(Trace) > 0",
      "INVARIANT Inv\nCONSTRAINT Constr",
      ["0", "1", "0", "2", "0", "0", "1"],
    ],
    [
      "an invariant over register writes",
      "ASSUME TLCSet(1, 0)\nInit == x = 0\nNext == x < 4 /\\ x' = x + 1 /\\ TLCSet(1, TLCGet(1) + 1) /\\ PrintT(<<x, TLCGet(1)>>)\nInv == Len(Trace) < 10",
      "INVARIANT Inv",
      [
        "<<0, 1>>",
        "<<1, 2>>",
        "<<0, 3>>",
        "<<2, 4>>",
        "<<0, 5>>",
        "<<1, 6>>",
        "<<3, 7>>",
        "<<0, 8>>",
        "<<1, 9>>",
        "<<2, 10>>",
      ],
    ],
  ])(
    "evaluates the steps to the state again as TLCTrace rebuilds them for Trace in %s",
    async (_place, definitions, config, prints) => {
      expect(await printTrace(definitions, config)).toEqual(prints);
    },
  );

  it("counts the steps that TLCTrace rebuilds for Trace in an invariant under coverage", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x < 3 /\\ x' = x + 1\nInv == Len(Trace) > 0\n====",
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\nINVARIANT Inv",
      coverage: 1,
    });
    expect(
      result.coverage?.relations.map(
        (relation) =>
          `${relation.distinct}:${relation.generated} ${relation.expressions.map((expression) => expression.count).join(" ")}`,
      ),
    ).toEqual(["4:4 4", "3:6 6 7 6", "0:0 4"]);
  });

  it("reads Trace of a state that a VIEW rebuilds as the path to it", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == x = 0 /\\ PrintT("init")\nNext == x < 4 /\\ x\' = x + 1 /\\ PrintT(Len(Trace))\nInv == x < 3\nView == x\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
      onPrint: (text) => prints.push(text),
    });
    expect([
      prints,
      result.violation?.trace.map((step) => step.output),
      result.violation?.traceOutput,
    ]).toEqual([
      ['"init"', "1", '"init"', "2", '"init"', "1", "3"],
      [['"init"', "1"], [], ['"init"', "2"], ['"init"', "1", "3"]],
      ['"init"', "1", '"init"', "2", '"init"', "1", "3"],
    ]);
  });

  it.each([
    ["a VIEW", "Init == x = 0 /\\ y = 0", "y' = 1 - y", "View == x", "VIEW View"],
    [
      "a SYMMETRY",
      "Init == x = 0 /\\ y \\in {{p} : p \\in P}",
      "\\E p \\in P : y' = y \\cup {p}",
      "Sym == Permutations(P)",
      "SYMMETRY Sym",
    ],
  ])(
    "rebuilds the trace through %s past steps whose action reads Trace, as TLC's ConcurrentTLCTrace does",
    async (_reduction, init, step, reduction, config) => {
      const getTrace = async (bound: number) => {
        const result = await check({
          source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nCONSTANT P\nVARIABLES x, y\n${init}\nNext == x < ${bound} /\\ Len(Trace) = TLCGet("level") /\\ x' = x + 1 /\\ ${step}\nInv == x < ${bound}\n${reduction}\n====`,
          config: `CONSTANT P = {p1, p2}\nINIT Init\nNEXT Next\nINVARIANT Inv\n${config}`,
        });
        return [result.status, result.violation?.trace.map((innerStep) => innerStep.state.x)];
      };
      expect([await getTrace(2), await getTrace(3)]).toEqual([
        ["invariant-violation", [0, 1, 2]],
        ["invariant-violation", [0, 1, 2, 3]],
      ]);
    },
  );

  it("goes on past a violation it rebuilds through a VIEW with the path of the state it expands, as TLC does under -continue", async () => {
    const traces: unknown[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x < 4 /\\ Len(Trace) = TLCGet(\"level\") /\\ x' = x + 1 /\\ y' = 1 - y\nInv == x # 2 /\\ x # 3\nView == x\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
      isContinued: true,
      onProgress: (progress) => {
        if (progress.kind === "violation") {
          traces.push(progress.violation.trace.map((step) => step.state.x));
        }
      },
    });
    expect([result.status, traces, result.generatedStates, result.distinctStates]).toEqual([
      "deadlock",
      [
        [0, 1, 2],
        [0, 1, 2, 3],
      ],
      5,
      5,
    ]);
  });

  it("reads Trace of the next successor of a state as its path after it rebuilds a violation through a VIEW under -continue, as TLC does", async () => {
    const prints: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ x' = x + 1 /\\ y' \\in {0, 1}\nInv == x # 2\nConstr == PrintT(<<x, y, Len(Trace)>>)\nView == <<x, y>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCONSTRAINT Constr\nVIEW View",
      isContinued: true,
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual([
      "<<0, 0, 1>>",
      "<<1, 0, 2>>",
      "<<1, 1, 2>>",
      "<<2, 0, 3>>",
      "<<2, 1, 3>>",
      "<<2, 0, 3>>",
      "<<2, 1, 3>>",
    ]);
  });

  it("reads Trace in the initial predicate as the initial state alone as TLCTrace rebuilds the counterexample", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nInit == x \\in {0, 1} /\\ PrintT(Trace)\nNext == x < 3 /\\ x' = x + 1\nInv == x < 2\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect([prints, result.violation?.traceOutput]).toEqual([
      ["<<[x |-> 0]>>", "<<[x |-> 1]>>"],
      ["<<[x |-> 0]>>", "<<[x |-> 1]>>"],
    ]);
  });

  // Deviation from TLC: it prints 773, 484, 773, 773, 773, 484, 484.
  it("draws after Trace as for the state the search expands, unlike TLC", async () => {
    expect(
      await printTrace(
        "Init == x = 0\nNext == x < 4 /\\ Len(Trace) > 0 /\\ x' = x + 1 /\\ PrintT(RandomElement(1..1000))",
      ),
    ).toEqual(["773", "484", "773", "203", "773", "484", "921"]);
  });

  // Deviation from TLC: it prints 1, 2, 3, 2.
  it("reads the path to a successor after the action reads Trace, unlike TLC", async () => {
    expect(
      await printTrace(
        "Init == x = 0\nNext == x < 3 /\\ Len(Trace) > 0 /\\ x' = x + 1\nConstr == PrintT(Len(Trace))",
        "CONSTRAINT Constr",
      ),
    ).toEqual(["1", "2", "3", "4"]);
  });

  // Deviation from TLC: TLC throws 'Cannot read field "state" because "sinfo" is null'.
  it("reads Trace past a random initial state, unlike TLC", async () => {
    expect(
      await printTrace(
        "Init == x = RandomElement(1..1000)\nNext == Len(Trace) < 3 /\\ x' = x + 1 /\\ PrintT(x)",
      ),
    ).toEqual(["731", "732", "731"]);
  });

  // Deviation from TLC: it prints n = 0 for both states.
  it("reads Trace in an ALIAS of an initial state and its successor as the path to each, unlike TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nAlias == [x |-> x, n |-> Len(Trace)]\nInv == x < 1\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias",
    });
    expect(result.violation?.trace.map((step) => step.state.n)).toEqual([1, 2]);
  });

  // Deviation from TLC: it prints n = 0, 1, 2, 4.
  it("reads Trace in an ALIAS of a liveness counterexample as the path to each state, unlike TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nAlias == [x |-> x, n |-> Len(Trace)]\nInit == x = 0\nNext == x < 3 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nProp == <>(x = 4)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop\nALIAS Alias\nCHECK_DEADLOCK FALSE",
    });
    expect(result.violation?.trace.map((step) => step.state.n)).toEqual([1, 2, 3, 4]);
  });

  it.each([
    [
      "a successor it has written",
      "Inv == x < 4",
      "",
      [
        '"init"',
        '<<"next", 0>>',
        '<<"next", 1>>',
        '<<"next", 2>>',
        '<<"next", 3>>',
        '"init"',
        '"init"',
        '<<"next", 0>>',
        '"init"',
        '<<"next", 0>>',
        '<<"next", 1>>',
      ],
    ],
    [
      "a successor a constraint excludes",
      "Inv == x < 3\nConstr == x < 3",
      "CONSTRAINT Constr",
      ['"init"', '<<"next", 0>>', '<<"next", 1>>', '<<"next", 2>>', '"init"'],
    ],
  ])(
    "rebuilds the path for Trace in the ALIAS that Worker#doPostCondition evaluates after an invariant fails at %s",
    async (_successor, invariant, config, traceOutput) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == x = 0 /\\ PrintT("init")\nNext == x' = x + 1 /\\ PrintT(<<"next", x>>)\n${invariant}\nAlias == [x |-> x, n |-> Len(Trace)]\n====`,
        config: `INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias\n${config}`,
      });
      expect(result.violation?.traceOutput).toEqual(traceOutput);
    },
  );

  it("gives the postcondition the alias of the last state, which reads Trace, unlike TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nInv == x < 2\nAlias == [x |-> x, n |-> Len(Trace)]\nPost == PrintT(CounterExample.state)\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias\nPOSTCONDITION Post",
    });
    expect(result.violation?.postconditionOutput).toEqual([
      "{ <<1, [x |-> 0, n |-> 1]>>,\n  <<2, [x |-> 1, n |-> 2]>>,\n  <<3, [x |-> 2, n |-> 3]>> }",
    ]);
  });

  it("reads Trace in the next-state relation as a liveness counterexample rebuilds its steps, unlike TLC", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ PrintT(<<x, Len(Trace)>>)\nSpec == Init /\\ [][Next]_x\nLive == <>(x > 2)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect([
      result.status,
      result.violation?.trace.map((step) => [step.state.x, step.output]),
      prints,
    ]).toEqual([
      "liveness-violation",
      [
        [0, ["<<0, 1>>", "<<1, 2>>"]],
        [1, []],
        [2, []],
      ],
      ["<<0, 1>>", "<<1, 2>>"],
    ]);
  });

  // Deviation from TLC: it fails with "Index 32767 out of bounds for length 1".
  it.each([
    ["", "", ""],
    [" through a VIEW", "\nView == x", "\nVIEW View"],
  ])(
    "rebuilds a liveness counterexample%s past steps whose action reads Trace, unlike TLC",
    async (_reduction, view, config) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x < 2 /\\ Len(Trace) = TLCGet("level") /\\ x' = x + 1 /\\ y' = 1 - y\nSpec == Init /\\ [][Next]_<<x, y>>\nLive == <>(x > 2)${view}\n====`,
        config: `SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE${config}`,
      });
      expect([result.status, result.violation?.trace.map((step) => step.state.x)]).toEqual([
        "liveness-violation",
        [0, 1, 2],
      ]);
    },
  );

  // Deviation from TLC: it reports 8:11-24, 8:11-20 and 8:15-19 in Constr and exits with 75.
  it("replays a failed step with a constraint that reads Trace, unlike TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == x = 0\nA == x' = x + 1\nB == x' = Len(x)\nNext == A \\/ B\nConstr == Len(Trace) < 3\n====",
      config: "INIT Init\nNEXT Next\nCONSTRAINT Constr",
    });
    expect([result.failure?.exitCode, formatCallStackLines(result)]).toEqual([
      255,
      ["Line 6, column 6 to line 6, column 16 in M", "Line 6, column 11 to line 6, column 16 in M"],
    ]);
  });
});
