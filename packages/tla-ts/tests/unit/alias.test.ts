import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig, TlaConfigError, type TraceStep } from "../../src";
import { simulate } from "../../src/simulate";
import { checkFixture } from "./check-harness";

const checkAlias = (configName: string) => checkFixture("alias", "Alias", configName);

const checkModule = (body: string, config: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\n${body}\n====`,
    config: `INIT Init\nNEXT Next\n${config}`,
  });

const getAliasRegisters = async (
  setup: string,
  invariant: string,
  config: string,
  maxSetSize: number | undefined,
) =>
  (
    await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\n${setup}\nNext == x < 3 /\\ x' = x + 1 /\\ TLCSet(1, TLCGet(1) + 1)\nInv == ${invariant}\nAlias == [x |-> x, register |-> TLCGet(1)]\n====`,
      config: `INIT Init\nNEXT Next\nALIAS Alias\n${config}`,
      maxSetSize,
    })
  ).violation?.trace.map((step) => formatValue(step.state.register));

const formatTrace = (trace: TraceStep[] | undefined) =>
  (trace ?? []).map((step) =>
    Object.entries(step.state).map(([name, value]) => `${name} = ${formatValue(value)}`),
  );

describe("ALIAS matches TLC", () => {
  it("prints the alias of each state in a safety trace", async () => {
    const result = await checkAlias("Alias");
    expect(result.status).toBe("invariant-violation");
    expect(formatTrace(result.violation?.trace)).toEqual(
      [1, 2, 3, 4].map((stateNumber) => [
        `yy = ${stateNumber % 2 === 0 ? "TRUE" : "FALSE"}`,
        `x = ${stateNumber}`,
        `a = ${stateNumber === 4 ? 0 : 1}`,
        `b = ${stateNumber === 4 ? "TRUE" : "FALSE"}`,
        `anim = "e1: ${stateNumber} e2: ${stateNumber % 2 === 0 ? "TRUE" : "FALSE"}"`,
        "te = TRUE",
        `lvl = <<${stateNumber}, ${stateNumber}>>`,
        `trc = <<${[1, 2, 3, 4]
          .slice(0, stateNumber)
          .map((step) => `[x |-> ${step}, y |-> ${step % 2 === 0 ? "TRUE" : "FALSE"}]`)
          .join(", ")}>>`,
      ]),
    );
  });

  it("evaluates the last state of a lasso against the state it loops back to", async () => {
    const result = await checkAlias("AliasLasso");
    expect([result.status, result.violation?.loopStart]).toEqual(["liveness-violation", 0]);
    expect(formatTrace(result.violation?.trace).map((step) => step.slice(2, 4))).toEqual([
      ["a = 1", "b = FALSE"],
      ["a = 1", "b = FALSE"],
      ["a = 1", "b = FALSE"],
      ["a = -3", "b = FALSE"],
    ]);
  });

  it("evaluates a stuttering state against itself", async () => {
    const result = await checkAlias("AliasStuttering");
    expect([result.status, result.violation?.loopStart]).toEqual(["liveness-violation", 0]);
    expect(formatTrace(result.violation?.trace).map((step) => step.slice(2, 4))).toEqual([
      ["a = 0", "b = TRUE"],
    ]);
  });

  it.each([
    [
      "an invariant",
      "Init == x = 0 /\\ TLCSet(1, 0)",
      "x < 3",
      "INVARIANT Inv",
      ["1", "1", "2", "3"],
    ],
    ["a deadlock", "Init == x = 0 /\\ TLCSet(1, 0)", "TRUE", "", ["2", "2", "2", "3"]],
    [
      "an initial state's successor",
      "Init == x = 0 /\\ TLCSet(1, 0)",
      "x < 1",
      "INVARIANT Inv",
      ["1", "2"],
    ],
    [
      "an invariant after ASSUME sets the register",
      "ASSUME TLCSet(1, 0)\nInit == x = 0",
      "x < 3",
      "INVARIANT Inv",
      ["4", "4", "5", "6"],
    ],
  ])(
    "aliases each state of a trace for %s as TLC's TLCTrace#printTrace rebuilds it, so the alias reads the registers set by then",
    async (_name, setup, invariant, config, registers) => {
      expect(await getAliasRegisters(setup, invariant, config, undefined)).toEqual(registers);
      expect(await getAliasRegisters(setup, invariant, config, 1_000_000)).toEqual(registers);
    },
  );

  it.each([
    ["(x + 1) % 3", 0, ["1", "2", "2"]],
    ["IF x = 3 THEN 1 ELSE x + 1", 1, ["1", "2", "3", "3"]],
  ])(
    "aliases each state of a lasso to x' = %s once it rebuilds the next, as TLC's LiveWorker#printTrace does",
    async (successor, loopStart, registers) => {
      const getLasso = async (maxSetSize: number | undefined) => {
        const result = await check({
          source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0 /\\ TLCSet(1, 0)\nNext == x' = (${successor}) /\\ TLCSet(1, TLCGet(1) + 1)\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>[](x = 0)\nAlias == [x |-> x, register |-> TLCGet(1)]\n====`,
          config: "SPECIFICATION Spec\nPROPERTY Prop\nALIAS Alias",
          maxSetSize,
        });
        return [
          result.violation?.loopStart,
          result.violation?.trace.map((step) => formatValue(step.state.register)),
        ];
      };
      expect(await getLasso(undefined)).toEqual([loopStart, registers]);
      expect(await getLasso(1_000_000)).toEqual([loopStart, registers]);
    },
  );

  it.each([
    [
      "a lasso",
      "Next == x' = (x + 1) % 3 /\\ y' = y /\\ TLCSet(1, TLCGet(1) + 1)\nSpec == Init /\\ [][Next]_<<x, y>> /\\ WF_<<x, y>>(Next)\nProp == <>[](x = 0)",
      "SPECIFICATION Spec\nPROPERTY Prop",
      ["13", "14", "14"],
    ],
    [
      "an invariant under a VIEW",
      "Next == x < 3 /\\ x' = x + 1 /\\ y' = 1 - y /\\ TLCSet(1, TLCGet(1) + 1)\nInv == x < 3\nView == x",
      "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View\nCHECK_DEADLOCK FALSE",
      ["4", "4", "5", "6"],
    ],
  ])(
    "rebuilds each state of %s once for the registers its ALIAS reads, as TLC does",
    async (_name, definitions, config, registers) => {
      const getRegisters = async (maxSetSize: number | undefined) =>
        (
          await check({
            source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nASSUME TLCSet(1, 0)\nInit == x = 0 /\\ y = 0\n${definitions}\nAlias == [x |-> x, register |-> TLCGet(1)]\n====`,
            config: `${config}\nALIAS Alias`,
            maxSetSize,
          })
        ).violation?.trace.map((step) => formatValue(step.state.register));
      expect(await getRegisters(undefined)).toEqual(registers);
      expect(await getRegisters(1_000_000)).toEqual(registers);
    },
  );

  it.each([
    [
      "a lasso",
      "Next == x' = (x + 1) % 3 /\\ y' = y /\\ Count\nSpec == Init /\\ [][Next]_<<x, y>> /\\ WF_<<x, y>>(Next)\nProp == <>[](x = 0)",
      "SPECIFICATION Spec\nPROPERTY Prop",
      [
        ["13", '"13"'],
        ["14", '"14"'],
        ["14", '"14"'],
      ],
    ],
    [
      "an invariant under a VIEW",
      "Next == x < 3 /\\ x' = x + 1 /\\ y' = 1 - y /\\ Count\nInv == x < 3\nView == x",
      "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View\nCHECK_DEADLOCK FALSE",
      [
        ["4", '"4"'],
        ["4", '"4"'],
        ["5", '"5"'],
        ["6", '"6"'],
      ],
    ],
  ])(
    "rebuilds each state of %s once for the named registers and -D properties its ALIAS reads, as TLC does",
    async (_name, definitions, config, values) => {
      const getValues = async (maxSetSize: number | undefined) =>
        (
          await check({
            source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nASSUME TLCSet("s:n", 0) /\\ TLCSet("-Dk", 0)\nCount == TLCSet("s:n", TLCGet("s:n") + 1) /\\ TLCSet("-Dk", 1 + CHOOSE n \\in 0..99 : ToString(n) = TLCGet("-Dk"))\nInit == x = 0 /\\ y = 0\n${definitions}\nAlias == [x |-> x, named |-> TLCGet("s:n"), property |-> TLCGet("-Dk")]\n====`,
            config: `${config}\nALIAS Alias`,
            maxSetSize,
          })
        ).violation?.trace.map((step) => [
          formatValue(step.state.named),
          formatValue(step.state.property),
        ]);
      expect(await getValues(undefined)).toEqual(values);
      expect(await getValues(1_000_000)).toEqual(values);
    },
  );

  it("adds _ALIASEvalError to the state when the alias fails", async () => {
    const next = "Next == x < 1 /\\ x' = x + 1\nArgument(n) == [n |-> n]\nConstant == [c |-> 1]";
    expect(
      await Promise.all(
        ["Undefined", "Argument", "Constant"].map(
          async (name) =>
            (await checkModule(next, `ALIAS ${name}`)).violation?.trace[0].state._ALIASEvalError,
        ),
      ),
    ).toEqual([
      "The alias Undefined specified in the configuration file\nis not defined in the specification.",
      "TLC requires alias not to take any argument, but one was given: Argument",
      "The alias Constant cannot be a constant.",
    ]);
    const result = await checkModule(
      "Next == x < 1 /\\ x' = x + 1\nAlias == [y |-> 1 \\div x]",
      "ALIAS Alias",
    );
    expect(Object.keys(result.violation?.trace[0].state ?? {})).toEqual(["x", "_ALIASEvalError"]);
    expect(result.violation?.trace[1].state).toEqual({ y: 1 });
  });

  it("marks the message of _ALIASEvalError as TLC does in -tool output", async () => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 1 /\\ x' = x + 1\nArgument(n) == [n |-> n]\n====`,
      config: "INIT Init\nNEXT Next\nALIAS Argument",
      isTool: true,
    });
    expect(result.violation?.trace[0].state._ALIASEvalError).toBe(
      "@!@!@STARTMSG 2228:0 @!@!@\nTLC requires alias not to take any argument, but one was given: Argument\n@!@!@ENDMSG 2228 @!@!@",
    );
  });

  it("keeps the state when the alias is not a record", async () => {
    const result = await checkModule(
      "Next == x < 1 /\\ x' = x + 1\nAlias == x + 100",
      "ALIAS Alias",
    );
    expect(result.violation?.trace.map((step) => step.state)).toEqual([{ x: 0 }, { x: 1 }]);
  });

  it("prints each alias of a trace that the VIEW fails on, where TLC fingerprints the alias and crashes", async () => {
    const result = await checkModule(
      'Next == x\' = x + 1\nInv == x < 3\nView == IF x < 11 THEN x ELSE x = "s"\nAlias == [x |-> x + 10]',
      "INVARIANT Inv\nVIEW View\nALIAS Alias",
    );
    expect([result.status, formatTrace(result.violation?.trace)]).toEqual([
      "invariant-violation",
      [["x = 10"], ["x = 11"], ["x = 12"], ["x = 13"]],
    ]);
  });

  it("rebuilds the path for an alias that reads Trace with the search's Trace, which the next-state relation reads, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Sequences, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x < 6 /\\ Len(Trace) >= 1 /\\ x' = x + 1\nInv == x < 3\nAlias == [x |-> x, t |-> Len(Trace)]\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias",
    });
    expect([
      result.status,
      formatTrace(result.violation?.trace),
      [result.generatedStates, result.distinctStates, result.depth],
    ]).toEqual([
      "invariant-violation",
      [
        ["x = 0", "t = 1"],
        ["x = 1", "t = 2"],
        ["x = 2", "t = 3"],
        ["x = 3", "t = 4"],
      ],
      [4, 4, 4],
    ]);
  });

  it("rebuilds the path for an alias that reads Trace at the level of each state it rebuilds, as TLC does", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt\nVARIABLE x\nInit == PrintT("init") /\\ x = 0\nNext == x < 6 /\\ PrintT(<<"next", x, TLCGet("level")>>) /\\ x\' = x + 1\nInv == x < 3\nAlias == [x |-> x, t |-> Len(Trace)]\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias",
      onPrint: (text) => prints.push(text),
    });
    expect([prints, result.violation?.traceOutput]).toEqual([
      ['"init"', '<<"next", 0, 1>>', '<<"next", 1, 2>>', '<<"next", 2, 3>>'],
      [
        '"init"',
        '<<"next", 0, 1>>',
        '<<"next", 1, 2>>',
        '<<"next", 2, 3>>',
        '"init"',
        '"init"',
        '<<"next", 0, 1>>',
      ],
    ]);
  });

  it("prints a deadlocked initial state without the alias, as TLC does", async () => {
    const result = await checkModule("Next == x > 0 /\\ x' = x\nAlias == [y |-> x]", "ALIAS Alias");
    expect([result.status, result.violation?.trace[0].state]).toEqual(["deadlock", { x: 0 }]);
  });

  it("prints an initial state whose successors fail without the alias, as TLC does", async () => {
    const result = await checkModule("Next == x' = 1 \\div x\nAlias == [y |-> x]", "ALIAS Alias");
    expect([result.status, result.failure?.trace.map((step) => step.state)]).toEqual([
      "error",
      [{ x: 0 }],
    ]);
  });

  it.each(["model checking", "simulation"])(
    "adds _ALIASEvalError to an incomplete successor and the state before it in %s, as TLC does",
    async (mode) => {
      const source = `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == IF x < 2 THEN x' = x + 1 /\\ y' = y ELSE x' = x + 1\nAlias == [x |-> x, lvl |-> TLCGet("level"), nx |-> x', ny |-> y']\n====`;
      const config = "INIT Init\nNEXT Next\nALIAS Alias";
      const traces: TraceStep[][] = [];
      if (mode === "simulation") {
        simulate({
          source,
          config,
          seed: 0n,
          traceDepth: 6,
          traceCount: 1n,
          aril: 0n,
          isGenerating: false,
          scheduler: "random",
          onSimulation: (output) => {
            if (output.kind === "behavior") traces.push(output.trace);
          },
        });
      } else {
        traces.push((await check({ source, config })).failure?.trace ?? []);
      }
      const message =
        '_ALIASEvalError = "In evaluation, the identifier y is either undefined or not an operator.\\nline 6, col 63 to line 6, col 63 of module M"';
      expect(traces.map(formatTrace)).toEqual([
        [
          ["x = 0", "lvl = 1", "nx = 1", "ny = 0"],
          ["x = 1", "lvl = 2", "nx = 2", "ny = 0"],
          ["x = 2", "y = 0", message],
          ["x = 3", "y = null", message],
        ],
      ]);
    },
  );

  it("prints the error state of a simulation without a depth bound without the alias, as TLC's Simulator does", () => {
    const states: TraceStep["state"][] = [];
    simulate({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nInv == x < 2\nAlias == [y |-> x]\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias",
      seed: 4n,
      traceDepth: -1,
      traceCount: 1n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onSimulation: (output) => {
        if (output.kind === "error-state") states.push(output.state);
      },
    });
    expect(states).toEqual([{ x: 2 }]);
  });

  it("rejects a second ALIAS", async () => {
    expect(() => parseConfig("ALIAS A\nALIAS B")).toThrow(TlaConfigError);
  });
});
