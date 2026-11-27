import { describe, expect, it } from "vite-plus/test";
import { check, parseConfig, TlaConfigError } from "../../src";
import { checkModule } from "./check-harness";

describe("parseConfig matches TLC", () => {
  it("reads operator symbols and names that start with digits", () => {
    const config = parseConfig("CONSTANT ++ <- PlusPlus\n  Plus <- +\n  \\o <- +\nINVARIANT 1Inv");
    expect(config.substitutions).toEqual([
      { name: "++", target: "PlusPlus" },
      { name: "Plus", target: "+" },
      { name: "\\o", target: "+" },
    ]);
    expect(config.invariants).toEqual(["1Inv"]);
  });

  it("reads _POSSIBLE and POSTCONDITION names", () => {
    const config = parseConfig("SPECIFICATION Spec\n_POSSIBLE Done Started\nPOSTCONDITION Post");
    expect([config.possible, config.postconditions]).toEqual([["Done", "Started"], ["Post"]]);
  });

  it("reads _PERIODIC and _RL_REWARD names and checks their definitions", async () => {
    const config = parseConfig("INIT Init\n_PERIODIC Periodic\n_RL_REWARD Reward");
    expect([config.periodic, config.rlReward]).toEqual(["Periodic", "Reward"]);
    await expect(checkModule("Argument(n) == n", "_PERIODIC Nope")).rejects.toThrow(
      new TlaConfigError(
        "The periodic Nope specified in the configuration file\nis not defined in the specification.",
      ),
    );
    await expect(checkModule("Argument(n) == n", "_RL_REWARD Argument")).rejects.toThrow(
      new TlaConfigError(
        "TLC requires rlreward not to take any argument, but one was given: Argument",
      ),
    );
    const result = await checkModule(
      "Periodic == x < 100\nReward == 1",
      "_PERIODIC Periodic\n_RL_REWARD Reward",
    );
    expect(result.status).toBe("success");
  });

  it("rejects keywords that appear twice", () => {
    ["CHECK_DEADLOCK", "_PERIODIC", "_RL_REWARD"].forEach((keyword) =>
      expect(() => parseConfig(`${keyword} FALSE\n${keyword} TRUE`)).toThrow(
        new TlaConfigError(
          `TLC found an error in the configuration file at line 2\nThe keyword ${keyword} appeared twice.`,
        ),
      ),
    );
  });

  it("reports TLC's errors for a file it can't read", () => {
    expect(() => parseConfig("CONSTANT Humans = {%1%}")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 1\nIt was expecting }, but did not find it.",
      ),
    );
    expect(() => parseConfig("INIT Init\nNEXT Next\nSYMBOLIC_INTEGERS Int")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 3\nIt was expecting a keyword, but did not find it.",
      ),
    );
    expect(() => parseConfig('INIT Init\n"unterminated\nNEXT Next')).toThrow(
      new TlaConfigError(
        'TLC found an error in the configuration file:\nLexical error at line 2, column 14.  Encountered: "\\n" (10), after : "\\"unterminated"',
      ),
    );
  });

  it("reads a set nested 10,000 deep, as TLC does", () => {
    const depth = 10_000;
    const config = parseConfig(`CONSTANT C = ${"{".repeat(depth)}{}, {2}${"}".repeat(depth)}`);
    let value = config.constants[0].value;
    let level = 0;
    while (value.kind === "Set" && value.elements.length === 1) {
      value = value.elements[0];
      level++;
    }
    expect([level, value]).toEqual([
      depth - 1,
      {
        kind: "Set",
        elements: [
          { kind: "Set", elements: [] },
          { kind: "Set", elements: [{ kind: "Number", value: 2 }] },
        ],
      },
    ]);
  });

  it("reads values the way TLC does", () => {
    expect(parseConfig('CONSTANT S = "a b"').constants[0].value).toEqual({
      kind: "String",
      value: "a b",
    });
    expect(() => parseConfig('CONSTANT S = "a\\"b"')).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file:\nescape sequences are not supported in strings at line 1",
      ),
    );
    expect(parseConfig('CONSTANT N <- "a"').substitutions[0].target).toBe('"a"');
    ["CONSTANT N = -1", "CONSTANT S = {1,}"].forEach((source) =>
      expect(() => parseConfig(source)).toThrow(TlaConfigError),
    );
    expect(parseConfig("INVARIANT ℕ").invariants).toEqual(["ℕ"]);
  });

  it("reports a malformed configuration with TLC's messages", () => {
    const getLineError = (line: number, detail: string) =>
      `TLC found an error in the configuration file at line ${line}\n${detail}`;
    const getLexicalError = (detail: string) =>
      `TLC found an error in the configuration file:\nLexical error at ${detail}`;
    const cases = [
      ["INIT\n", getLineError(1, "The keyword INIT was not followed by an identifier.")],
      [
        "CONSTANT N = -1\nINIT Init\n",
        getLineError(2, "It was expecting = or <-, but did not find it."),
      ],
      [
        "CONSTANT N ← 1\nINIT Init\n",
        getLineError(1, "It was expecting = or <-, but did not find it."),
      ],
      [
        "CHECK_DEADLOCK 3\n",
        getLineError(1, "It was expecting TRUE or FALSE, but did not find it."),
      ],
      [
        "CONSTANT N = {1, 2\nINIT Init\n",
        getLineError(2, "It was expecting }, but did not find it."),
      ],
      ["CONSTANT N =\n", getLineError(2, "It was expecting a value, but did not find it.")],
      ["INIT Init ~\n", getLineError(1, "It was expecting a keyword, but did not find it.")],
      ["(* open\nINIT Init\n", getLexicalError('line 4, column 0.  Encountered: <EOF> after : ""')],
      ["INIT Init\n`x\n", getLexicalError('line 2, column 1.  Encountered: "`" (96), after : ""')],
      [
        'CONSTANT N = "a\nINIT Init\n',
        getLexicalError('line 1, column 16.  Encountered: "\\n" (10), after : "\\"a"'),
      ],
    ];
    for (const item of cases) {
      expect(() => parseConfig(item[0])).toThrow(new TlaConfigError(item[1]));
    }
  });

  it.each([
    [
      "a form feed",
      "INIT Init\fNEXT Next\n",
      ':\nLexical error at line 1, column 10.  Encountered: "\\f" (12), after : ""',
    ],
    [
      "a no-break space",
      "INIT Init\u00a0NEXT Next\n",
      ':\nLexical error at line 1, column 10.  Encountered: "\\u00a0" (160), after : ""',
    ],
    [
      "an escape SANY lacks",
      'CONSTANT N = "\\a"\n',
      ':\nLexical error at line 1, column 16.  Encountered: "a" (97), after : "\\"\\\\"',
    ],
    [
      "a comment and lines that end at a lone CR",
      "INIT Init\r\\* c\rNEXT Next\rINIT Init\n",
      " at line 4\nThe keyword INIT appeared twice.",
    ],
    [
      "WF_ before a name",
      "CONSTANT N = {WF_x}\n",
      " at line 1\nIt was expecting }, but did not find it.",
    ],
    [
      "underscores",
      "CONSTANT N = __\n",
      " at line 2\nIt was expecting = or <-, but did not find it.",
    ],
  ])("reads %s with SANY's token manager, as TLC does", (_name, source, message) => {
    expect(() => parseConfig(source)).toThrow(
      new TlaConfigError(`TLC found an error in the configuration file${message}`),
    );
  });
});

describe("check validates the configuration in TLC's order", () => {
  const NOT_STATE_PREDICATE =
    "The invariant BadInv is not a state predicate (one with no primes or temporal operators).\nNote that a bug can cause TLC to incorrectly report this error.\nIf you believe your TLA+ or PlusCal specification to be correct,\nplease check if this bug described in LevelNode.java starting at line 590ff affects you.";

  it.each([
    [
      "VIEW Nope\nSYMMETRY Sym",
      "The view function Nope specified in the configuration file\nis not defined in the specification.",
    ],
    [
      "SYMMETRY Nope2\nVIEW Nope",
      "The view function Nope specified in the configuration file\nis not defined in the specification.",
    ],
    [
      "VIEW Dbl\nSYMMETRY Nope",
      "TLC requires view function not to take any argument, but one was given: Dbl",
    ],
  ])("checks the VIEW before the SYMMETRY in %j", async (config, message) => {
    await expect(
      checkModule("Sym == Permutations({1, 2})\nDbl(a) == 2 * a", config),
    ).rejects.toThrow(new TlaConfigError(message));
  });

  it.each(["Nope", "Dbl"])(
    "checks an invariant's level before it looks up the invariant %s after it",
    async (name) => {
      await expect(
        checkModule("BadInv == x' = x\nDbl(a) == 2 * a", `INVARIANT BadInv ${name}`),
      ).rejects.toThrow(new TlaConfigError(NOT_STATE_PREDICATE));
    },
  );

  it("warns about no constant-level invariant after one that is not a state predicate", async () => {
    const warned: string[] = [];
    await expect(
      check({
        source:
          "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = x\nBadInv == x' = x\nConstInv == TRUE\n====",
        config: "INIT Init\nNEXT Next\nINVARIANT BadInv ConstInv",
        onProgress: (event) => {
          if (event.kind === "constant-level-invariant") warned.push(event.name);
        },
      }),
    ).rejects.toThrow(new TlaConfigError(NOT_STATE_PREDICATE));
    expect(warned).toEqual([]);
  });
});

describe("parseConfig matches TLC 1.7.4", () => {
  it("reads a keyword that TLC 1.7.4 doesn't have as a name", () => {
    expect(parseConfig("INVARIANT Inv ALIAS", "1.7.4").invariants).toEqual(["Inv", "ALIAS"]);
    expect(() => parseConfig("INIT Init\nALIAS Alias", "1.7.4")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 2\nIt was expecting a keyword, but did not find it.",
      ),
    );
  });

  it("reads a TYPE and a TYPE_CONSTRAINT, which it ignores, once each", () => {
    expect(parseConfig("INIT Init\nTYPE T\nTYPE_CONSTRAINT C", "1.7.4")).toEqual(
      parseConfig("INIT Init", "1.7.4"),
    );
    expect(() => parseConfig("TYPE T\nTYPE U", "1.7.4")).toThrow(
      new TlaConfigError(
        "TLC found an error in the configuration file at line 2\nThe keyword TYPE appeared twice.",
      ),
    );
    expect(() => parseConfig("TYPE T")).toThrow(TlaConfigError);
  });
});
