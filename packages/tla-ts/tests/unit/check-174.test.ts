import { describe, expect, it } from "vite-plus/test";
import { check, TlaConfigError, TlaEvaluationError } from "../../src";
import { getUnexpectedException, TlaStackOverflowError } from "../../src/errors";
import { getExitCode } from "../../src/exit-codes";
import type { TlcVersion } from "../../src/tlc/version";

describe("check matches TLC 1.7.4", () => {
  const check174 = (definitions: string, config = "INIT Init\nNEXT Next") =>
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${definitions}\n====`,
      config,
      version: "1.7.4",
    });

  it("keeps the outdegree of the states it expanded before a violation, a deadlocked state among them", async () => {
    const invariant = await check174(
      "Init == x = 0\nNext == x' = x + 1\nInv == x < 2",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(invariant.violationOutDegrees?.slice(0, 3)).toEqual([0, 1, 0]);
    const deadlock = await check174("Init == x = 0\nNext == x < 2 /\\ x' = x + 1");
    expect(deadlock.violationOutDegrees?.slice(0, 3)).toEqual([1, 2, 0]);
  });

  it("leaves out the outdegree of the state whose invariant it failed to evaluate", async () => {
    const source =
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == \\E n \\in {1, 2} : x' = x + n\nInv == x # 3 \\/ CHOOSE n \\in {} : TRUE\n====";
    const getOutDegrees = async (version: TlcVersion) => {
      const result = await check({
        source,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        version,
      });
      return result.outDegrees?.slice(0, 3);
    };
    expect(await getOutDegrees("1.7.4")).toEqual([0, 0, 1]);
    expect(await getOutDegrees("master")).toEqual([0, 1, 1]);
  });

  it("words a missing tuple index or record field as TLC 1.7.4 does", async () => {
    const tuple = await check174(
      'Init == x = 0\nNext == x\' = x + 1\nName == <<"zero", "one">>\nInv == Name[x + 1] # "none"',
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(tuple.failure?.message).toContain(
      'Attempted to apply tuple\n<<"zero", "one">>\nto integer 3 which is out of domain.',
    );
    const record = await check174(
      'Init == x = 0\nNext == x\' = x + 1\nR == [a |-> 1]\nInv == R[IF x = 0 THEN "a" ELSE "b"] = 1',
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(record.failure?.message).toContain(
      "Attempted to apply the record\n[a |-> 1]\nto nonexistent record field b.",
    );
  });

  it("reports an error in adding a state to the behavior graph as TLC 1.7.4's worker does", async () => {
    const result = await check174(
      "Init == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nProp == []<>(1 \\div x = 1)",
      "SPECIFICATION Spec\nPROPERTY Prop",
    );
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a tlc2.tool.EvalException\n: The second argument of \\div is 0.",
    );
    expect([result.failure?.trace, result.failure?.callStack, result.failure?.exitCode]).toEqual([
      [],
      undefined,
      255,
    ]);
  });

  const checkProperty = (property: string, version?: "1.7.4") =>
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, b\nInit == x = 0 /\\ b = FALSE\nNext == x' = x /\\ b' = ~b\nSpec == Init /\\ [][Next]_<<x, b>>\n${property}\n====`,
      config: "SPECIFICATION Spec\nPROPERTY P",
      version,
    });

  it.each([
    [undefined, "P == []b", "b"],
    [undefined, "P == []FALSE", "FALSE"],
    [undefined, "P == [](x # 0) /\\ TRUE", "line 7, col 6 to line 7, col 14 of module M"],
    [undefined, "P == x # 0 /\\ TRUE", "line 7, col 6 to line 7, col 10 of module M"],
    [undefined, "Q == [][b' = b]_b\nP == Q /\\ TRUE", "Q"],
    [undefined, "P == \\A c \\in {0, 1} : x # c", "line 7, col 24 to line 7, col 28 of module M"],
    ["1.7.4" as const, "P == \\A c \\in {0, 1} : x # c", "P"],
  ])(
    "names the violated part of a property as TLC %s does: %s",
    async (version, property, name) => {
      expect((await checkProperty(property, version)).violation?.name).toBe(name);
    },
  );

  it.each([undefined, "1.7.4" as const])(
    "reports a property that quantifies over the empty set as a tautology (TLC %s)",
    async (version) => {
      await expect(checkProperty("P == \\A c \\in {} : []b", version)).rejects.toThrow(
        "Temporal formula is a tautology (its negation is unsatisfiable).",
      );
    },
  );

  it.each([
    [
      "<>(1 \\notin SUBSET 1)",
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to check if the non-enumerable value\n1\nis element of\nSUBSET 1",
    ],
    [
      "<>(1 + 1)",
      "TLC expected a boolean value, but did not find one. line 6, col 9 to line 6, col 13 of module M",
    ],
    ["<>(\\b101 /\\ TRUE)", "TLC expected a boolean value, but did not find one. \\b101"],
  ])(
    "reports an error in the constant part of the property %s as TLC does",
    async (property, message) => {
      await expect(
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nSpec == Init /\\ [][x' = x]_x\nP == ${property}\n====`,
          config: "SPECIFICATION Spec\nPROPERTY P",
        }),
      ).rejects.toMatchObject({ message });
    },
  );

  it("exits successfully after an error in adding an initial state to the behavior graph, as TLC 1.7.4 does", async () => {
    const result = await check174(
      "Init == x = 0\nNext == (x = 0 /\\ x' = 1) \\/ UNCHANGED x\nSpec == Init /\\ [][Next]_x\nProp == <>~ENABLED (x' > x)",
      "SPECIFICATION Spec\nPROPERTY Prop",
    );
    expect(result.failure?.exitCode).toBe(0);
  });

  it("says which variables a successor leaves unassigned as TLC 1.7.4 does", async () => {
    const result = await check174("Init == x = 0\nNext == UNCHANGED <<>>");
    expect(result.failure?.message).toBe(
      "Successor state is not completely specified by the next-state action. The following variable is not assigned: x.\n",
    );
  });

  it("reports an error in adding a successor without the trace, as TLC 1.7.4's worker does", async () => {
    const result = await check174("Init == x = 0\nNext == x' = {x + 1} \\cup x");
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: util.Assert$TLCRuntimeException: Attempted to enumerate S \\cup T when S:\n{1}\nand T:\n0\nare not both enumerable",
    );
    expect(result.failure?.trace).toEqual([]);
  });

  it("reads only the keys TLC 1.7.4's TLCGet has", async () => {
    const getRevision = async (version: TlcVersion) => {
      const result = await check({
        source:
          '---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = TLCGet("revision").tag\nNext == UNCHANGED x\n====',
        config: "INIT Init\nNEXT Next",
        version,
      });
      return result.failure?.message ?? result.status;
    };
    expect(await getRevision("master")).toBe("success");
    expect(await getRevision("1.7.4")).toBe("TLCGet(revision) was undefined.");
  });

  it("sizes every component of a set of functions as TLC 1.7.4 does", async () => {
    const getCardinality = async (version: TlcVersion) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == x = Cardinality([Nat -> {}])\nNext == UNCHANGED x\n====",
        config: "INIT Init\nNEXT Next",
        version,
      });
      return result.failure?.message ?? result.status;
    };
    expect(await getCardinality("master")).toBe("success");
    expect(await getCardinality("1.7.4")).toMatch(
      /but it produced the following error:\nAttempted to compute the number of elements in the overridden value Nat\.$/,
    );
  });

  it("doesn't explain a set it can't enumerate", async () => {
    const result = await check174("Init == x = 0\nNext == \\E n \\in Nat : x' = n");
    expect(result.failure?.message).toContain(
      ": TLC encountered a non-enumerable quantifier bound\nNat.\nline 5, col 18 to line 5, col 20 of module M",
    );
    expect(result.failure?.message).not.toContain("infinitely many elements");
  });

  it("refuses action composition without the Java property that enables it", async () => {
    const result = await check174("Init == x = 0\nNext == (x' = x) \\cdot (x' = x)");
    expect(result.failure?.message).toMatch(
      /: The current version of TLC does not support action composition\.$/,
    );
  });

  it("blames a parameterized INSTANCE for a missing initial predicate as well", async () => {
    await expect(check174("Next == x' = x", "NEXT Next")).rejects.toThrow(
      new TlaConfigError(
        "The configuration file did not specify the initial state predicate.\nCan also be caused by trying to run TLC on a specification from\na module imported with a parameterized INSTANCE statement.",
      ),
    );
  });

  it("doesn't rebuild the trace, so it prints nothing of the states again", async () => {
    const getTraceOutput = async (version: TlcVersion) => {
      const result = await check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0 /\\ PrintT("init")\nNext == x = 5 /\\ x\' = x\n====',
        config: "INIT Init\nNEXT Next",
        version,
      });
      return result.violation?.traceOutput;
    };
    expect(await getTraceOutput("master")).toEqual(['"init"']);
    expect(await getTraceOutput("1.7.4")).toEqual([]);
  });

  it("doesn't expand a specification that applies an operator to arguments", async () => {
    const getStatus = (version: TlcVersion) =>
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nS(v) == v = 0 /\\ [][v' = v]_v\nSpec == S(x)\n====",
        config: "SPECIFICATION Spec",
        version,
      }).then((result) => result.status);
    expect(await getStatus("master")).toBe("success");
    await expect(getStatus("1.7.4")).rejects.toThrow(
      "The configuration file did not specify the initial state predicate.",
    );
  });

  it("reads the level of the state it explores in a constraint", async () => {
    const getDistinctStates = async (version: TlcVersion) => {
      const result = await check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x\' = x + 1\nC == TLCGet("level") < 3\n====',
        config: "INIT Init\nNEXT Next\nCONSTRAINT C\nCHECK_DEADLOCK FALSE",
        version,
      });
      return result.distinctStates;
    };
    expect(await getDistinctStates("master")).toBe(2);
    expect(await getDistinctStates("1.7.4")).toBe(3);
  });

  it("evaluates TLCGet in a temporal property before it starts the model checker", async () => {
    const checkVersion = (version: TlcVersion) =>
      check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x\' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == <>[](x = 1 /\\ TLCGet("diameter") > 0)\n====',
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      }).then((result) => result.status);
    expect(await checkVersion("master")).toBe("liveness-violation");
    await expect(checkVersion("1.7.4")).rejects.toThrow(
      new TlaEvaluationError(
        `${getUnexpectedException("tlc2.tool.EvalException")}TLCGet(diameter) was undefined.`,
      ),
    );
  });

  it("evaluates the arguments of a recursive temporal operator it expands", async () => {
    const getPropertyStatus = (property: string, version: TlcVersion) =>
      check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nRECURSIVE R(_)\nR(n) == IF n = 0 THEN <>(x = 1) ELSE R(n - 1)\nP == ${property}\n====`,
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      }).then((result) => result.status);
    const stackOverflow = new TlaStackOverflowError();
    expect(await getPropertyStatus("R(2)", "master")).toBe("liveness-violation");
    await expect(getPropertyStatus("R(2)", "1.7.4")).rejects.toThrow(stackOverflow);
    await expect(getPropertyStatus("R(x)", "master")).rejects.toThrow(stackOverflow);
    await expect(getPropertyStatus("R(x)", "1.7.4")).rejects.toThrow(
      "TLC cannot handle the temporal formula line 9, col 6 to line 9, col 9 of module M",
    );
  });

  it("doesn't expect an EvalException in the values a property quantifies over", async () => {
    const error = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == \\A k \\in {1 \\div 0} : <>(x = k)\n====",
      config: "SPECIFICATION Spec\nPROPERTY P",
    }).catch((caught: unknown) => caught);
    expect(error).toEqual(
      new TlaEvaluationError(
        `${getUnexpectedException("tlc2.tool.EvalException")}The second argument of \\div is 0.`,
      ),
    );
    expect(error instanceof Error && getExitCode(error)).toBe(255);
  });

  it.each(["1.7.4" as const, "master" as const])(
    "reports a property quantified over no values as a tautology in TLC %s",
    async (version) => {
      const result = check({
        source:
          "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == \\A k \\in {} : <>TRUE\n====",
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      });
      await expect(result).rejects.toThrow(
        new TlaEvaluationError("Temporal formula is a tautology (its negation is unsatisfiable)."),
      );
    },
  );

  it.each([
    [
      "1.7.4" as const,
      "\\A k \\in 0..1 : <>(2 \\in 1)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 32 of module M:\nAttempted to check if the value:\n2\nis an element of the integer 1",
    ],
    [
      "1.7.4" as const,
      "\\A k \\in 0..1 : <>(1 \\div 0 = k)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 37 of module M",
    ],
    [
      "master" as const,
      "\\E k \\in 0..1 : <>(2 \\in 1)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 32 of module M",
    ],
    [
      "master" as const,
      "\\A k \\in 1 : <>(x = k)",
      "TLC cannot handle the temporal formula line 7, col 6 to line 7, col 27 of module M:\nTLC encountered a non-enumerable quantifier bound\n1.\n1",
    ],
  ])(
    "fails a quantified formula whose body fails in TLC %s as one it can't handle",
    async (version, property, message) => {
      const result = check({
        source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nP == ${property}\n====`,
        config: "SPECIFICATION Spec\nPROPERTY P",
        version,
      });
      await expect(result).rejects.toThrow(new TlaEvaluationError(message));
    },
  );
});
