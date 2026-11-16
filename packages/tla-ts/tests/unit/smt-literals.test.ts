import { describe, expect, it } from "vite-plus/test";
import { getObligations } from "../../src/obligations";
import { proveObligations } from "../../src/prover/prove";
import { TLAPM_LIBRARY } from "../../src/prover/tlapm-library";

// tlapm --debug disable_arithmetic, where a number is a constant of sort Idv.
const encodeUntyped = async (theorem: string) => {
  const scripts: string[] = [];
  const reports = await proveObligations(
    getObligations(
      [
        {
          file: "M.tla",
          source: `---- MODULE M ----\nEXTENDS Integers, TLAPS\nTHEOREM ${theorem}\n  BY SMT\n====\n`,
        },
      ],
      (moduleName) => {
        const source = TLAPM_LIBRARY.get(moduleName);
        return source === undefined ? undefined : { file: `${moduleName}.tla`, source };
      },
    ).flatMap((result) => result.obligations),
    {
      smtLogic: "UF",
      smtEncoding: { isArithmetic: false, rewriteLevel: 0, isSetExtensional: true, isTyped: false },
      onInput: (_file, text) => scripts.push(text),
    },
  );
  return { status: reports[0].obligation.status, script: scripts[0] };
};

const getLiteralAxioms = (script: string) =>
  script
    .split("\n")
    .filter((line) => line.startsWith(";; Axiom: IntLit"))
    .map((line) => line.slice(";; Axiom: ".length));

describe("the SMT encoding names an integer literal by its digits, as tlapm does", () => {
  it("tells the two largest OCaml integers apart", async () => {
    const result = await encodeUntyped("4611686018427387903 # 4611686018427387902");
    expect(getLiteralAxioms(result.script)).toEqual([
      "IntLitIsint 0",
      "IntLitIsint 1",
      "IntLitIsint 4611686018427387902",
      "IntLitIsint 4611686018427387903",
      "IntLitDistinct 0 1",
      "IntLitDistinct 0 4611686018427387902",
      "IntLitDistinct 1 4611686018427387902",
      "IntLitDistinct 4611686018427387903 0",
      "IntLitDistinct 4611686018427387903 1",
      "IntLitDistinct 4611686018427387903 4611686018427387902",
      "IntLitZeroCmp 0",
      "IntLitZeroCmp 1",
      "IntLitZeroCmp 4611686018427387902",
      "IntLitZeroCmp 4611686018427387903",
    ]);
    expect(result.script).toContain(
      "      (distinct smt__TLA____IntLit__4611686018427387903\n        smt__TLA____IntLit__4611686018427387902)) :named |Goal|))",
    );
    expect(result.status).toBe("proved");
  });

  it("tells 2^53 + 1 from 2^53", async () => {
    const result = await encodeUntyped("9007199254740993 # 9007199254740992");
    expect(result.script).toContain(
      "(declare-fun smt__TLA____IntLit__9007199254740992 () Idv)\n\n(declare-fun smt__TLA____IntLit__9007199254740993 () Idv)",
    );
    expect(result.script).toContain(
      "    (distinct smt__TLA____IntLit__9007199254740993\n      smt__TLA____IntLit__9007199254740992)\n    :named |IntLitDistinct 9007199254740993 9007199254740992|))",
    );
  });

  it("orders the axioms of literals by value", async () => {
    const result = await encodeUntyped("10 # 9");
    expect(getLiteralAxioms(result.script).slice(0, 4)).toEqual([
      "IntLitIsint 0",
      "IntLitIsint 1",
      "IntLitIsint 9",
      "IntLitIsint 10",
    ]);
  });

  // tlapm reads a literal with int_of_string, which fails beyond 2^62 - 1.
  it("keeps every digit of a literal beyond OCaml's integers", async () => {
    const result = await encodeUntyped("1000000000000000000000001 # 1000000000000000000000000");
    expect(getLiteralAxioms(result.script)).toContain(
      "IntLitDistinct 1000000000000000000000001 1000000000000000000000000",
    );
    expect(result.script).not.toContain("e+");
  });
});
