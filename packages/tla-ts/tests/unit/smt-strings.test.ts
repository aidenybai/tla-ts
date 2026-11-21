import { describe, expect, it } from "vite-plus/test";
import { AstManager } from "../../src/prover/smt/solver/ast";
import { L_TRUE } from "../../src/prover/smt/solver/lbool";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { SmtKernel } from "../../src/prover/smt/solver/smt-kernel";
import { parseSmtlib } from "../../src/prover/smt/solver/smtlib-parser";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output;
};

describe("simplify over strings and regular expressions", () => {
  it("evaluates the string operators on literals", () => {
    expect(
      run([
        '(simplify (str.++ "ab" "cd"))',
        '(simplify (str.len "hello"))',
        '(simplify (str.at "hello" 1))',
        '(simplify (str.substr "hello" 1 3))',
        '(simplify (str.indexof "hello" "l" 0))',
        '(simplify (str.replace "hello" "l" "L"))',
        '(simplify (str.replace_all "hello" "l" "L"))',
        '(simplify (str.prefixof "he" "hello"))',
        '(simplify (str.suffixof "lo" "hello"))',
        '(simplify (str.contains "hello" "ell"))',
        '(simplify (str.to_int "42"))',
        '(simplify (str.to_int "4a"))',
        "(simplify (str.from_int 42))",
        "(simplify (str.from_int (- 1)))",
        '(simplify (str.< "a" "b"))',
        '(simplify (str.<= "b" "a"))',
        '(simplify (str.to_code "a"))',
        "(simplify (str.from_code 98))",
        '(simplify (str.is_digit "7"))',
      ]).join("\n"),
    ).toBe(
      [
        '"abcd"',
        "5",
        '"e"',
        '"ell"',
        "2",
        '"heLlo"',
        '"heLLo"',
        "true",
        "true",
        "true",
        "42",
        "(- 1)",
        '"42"',
        '""',
        "true",
        "false",
        "97",
        '"b"',
        "true",
      ].join("\n"),
    );
  });

  it("rewrites the string operators on variables", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        '(simplify (str.++ x "" y))',
        '(simplify (str.len (str.++ x "ab" y)))',
        '(simplify (str.++ "a" (str.++ "b" x)))',
        '(simplify (str.contains (str.++ x "abc" y) "b"))',
        '(simplify (str.prefixof "" x))',
        "(simplify (str.at x (- 1)))",
        "(simplify (str.substr x 0 (str.len x)))",
        '(simplify (= (str.++ "a" x) (str.++ "b" y)))',
        '(simplify (= (str.++ x "a") (str.++ y "a")))',
        '(simplify (str.indexof x "" 0))',
        '(simplify (str.replace x "" "a"))',
      ]).join("\n"),
    ).toBe(
      [
        "(str.++ x y)",
        "(+ 2 (str.len x) (str.len y))",
        '(str.++ "ab" x)',
        "true",
        "true",
        '""',
        "x",
        "false",
        "(= x y)",
        "0",
        '(str.++ "a" x)',
      ].join("\n"),
    );
  });

  it("decides membership of a literal and rewrites the regex operators", () => {
    expect(
      run([
        "(declare-const x String)",
        '(simplify (str.in_re "abab" (re.* (str.to_re "ab"))))',
        '(simplify (str.in_re "aba" (re.* (str.to_re "ab"))))',
        '(simplify (str.in_re "b" (re.range "a" "c")))',
        '(simplify (str.in_re "ab" (re.++ (str.to_re "a") re.allchar)))',
        '(simplify (str.in_re "" (re.+ (str.to_re "a"))))',
        '(simplify (str.in_re "aaa" ((_ re.loop 2 3) (str.to_re "a"))))',
        '(simplify (str.in_re "aaaa" ((_ re.^ 3) (str.to_re "a"))))',
        "(simplify (str.in_re x re.none))",
        "(simplify (str.in_re x re.all))",
        '(simplify (re.union re.none (str.to_re "a")))',
        '(simplify (re.inter re.all (str.to_re "a")))',
        '(simplify (re.++ (str.to_re "a") (str.to_re "b")))',
        '(simplify (re.* (re.* (str.to_re "a"))))',
        '(simplify (re.comp (re.comp (str.to_re "a"))))',
        '(simplify (re.opt (str.to_re "")))',
        '(simplify (re.diff (str.to_re "a") re.all))',
      ]).join("\n"),
    ).toBe(
      [
        "true",
        "false",
        "true",
        "true",
        "false",
        "true",
        "false",
        "false",
        "true",
        '(str.to_re "a")',
        '(str.to_re "a")',
        '(str.to_re "ab")',
        '(re.* (str.to_re "a"))',
        '(str.to_re "a")',
        '(str.to_re "")',
        "re.none",
      ].join("\n"),
    );
  });

  it("reads unicode escapes and doubled quotes", () => {
    expect(
      run([
        '(simplify (str.len "\\u{48}\\u{49}"))',
        '(simplify (str.++ "\\u{48}" "i"))',
        '(simplify (str.to_code "\\u{1F600}"))',
        "(simplify (str.from_code 955))",
        '(simplify (str.len "a""b"))',
      ]).join("\n"),
    ).toBe(["2", '"Hi"', "128512", '"\\u{3bb}"', "3"].join("\n"));
  });

  it("compares the string literals of an if-then-else as values", () => {
    expect(
      run([
        "(declare-const s0 String)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        '(simplify (= "" (ite b "11" s0)))',
        '(simplify (= (ite b "11" s0) "11"))',
        '(simplify (= (ite b "11" (ite c "" "a")) "11"))',
        '(simplify (= (ite b "a" "b") (ite c "a" "c")))',
        '(simplify (= (ite b "a" (ite c "b" "c")) "d"))',
      ]),
    ).toEqual([
      '(and (= "" s0) (not b))',
      '(or b (= s0 "11"))',
      "b",
      "(and (or b c) (or c (not b)) (or b (not c)))",
      "false",
    ]);
  });
});

describe("the theory of sequences", () => {
  it("splits a literal between two variables by a length", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        '(assert (= (str.++ x y) "abc"))',
        "(assert (= (str.len x) 1))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x () String",
        '    "a")',
        "  (define-fun y () String",
        '    "bc")',
        ")",
      ].join("\n"),
    );
  });

  it("refutes a concatenation whose last characters differ", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (= (str.++ x "a") "bcd"))',
        "(check-sat)",
        "(declare-const y String)",
        "(assert (> (str.len y) 2))",
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["unsat", "unsat"].join("\n"));
  });

  it("refutes lengths that do not add up", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        "(assert (= (str.len x) 2))",
        "(assert (= (str.len y) 3))",
        "(assert (= (str.len (str.++ x y)) 6))",
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["unsat"].join("\n"));
  });

  it("finds a string from str.contains and str.prefixof", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        '(assert (str.contains x "ab"))',
        '(assert (str.prefixof "c" x))',
        "(assert (= (str.len x) 3))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x () String",
        '    "cab")',
        "  (define-fun y () String",
        '    "")',
        ")",
      ].join("\n"),
    );
  });

  it("refutes str.contains of a longer literal", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (str.contains x "abc"))',
        "(assert (< (str.len x) 3))",
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["unsat"].join("\n"));
  });

  it("finds a string from str.indexof", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const i Int)",
        '(assert (= i (str.indexof x "b" 0)))',
        "(assert (= (str.len x) 2))",
        "(assert (= i 1))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x () String",
        '    "Ab")',
        "  (define-fun i () Int",
        "    1)",
        ")",
      ].join("\n"),
    );
  });

  it("finds the digits of str.to_int", () => {
    expect(
      run([
        "(declare-const x String)",
        "(assert (= (str.to_int x) 12))",
        "(assert (= (str.len x) 2))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(["sat", "(", "  (define-fun x () String", '    "12")', ")"].join("\n"));
  });

  it("finds the integer of str.from_int", () => {
    expect(
      run([
        "(declare-const n Int)",
        '(assert (= (str.from_int n) "105"))',
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(["sat", "(", "  (define-fun n () Int", "    105)", ")"].join("\n"));
  });

  it("finds the argument of str.replace", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (= (str.replace x "a" "b") "bb"))',
        '(assert (str.contains x "a"))',
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(["sat", "(", "  (define-fun x () String", '    "ab")', ")"].join("\n"));
  });

  it("finds a string from str.substr and str.at", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (= (str.substr x 1 2) "bc"))',
        '(assert (= (str.at x 0) "a"))',
        "(assert (= (str.len x) 3))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(["sat", "(", "  (define-fun x () String", '    "abc")', ")"].join("\n"));
  });

  it("decides the lexicographic orders", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        "(assert (str.< x y))",
        "(assert (str.< y x))",
        "(check-sat)",
        "(pop 0)",
        "(declare-const z String)",
        '(assert (str.<= z "b"))',
        '(assert (str.< "a" z))',
        "(assert (= (str.len z) 1))",
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["unsat", "unsat"].join("\n"));
  });

  it("refutes a word equation under lengths", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        '(assert (= (str.++ x "ab" y) (str.++ y "ba" x)))',
        "(assert (= (str.len x) 1))",
        "(assert (= (str.len y) 0))",
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["sat"].join("\n"));
  });

  it("solves a word equation", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        '(assert (= (str.++ "a" x) (str.++ y "b")))',
        "(assert (= (str.len x) 2))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun x () String",
        '    "Ab")',
        "  (define-fun y () String",
        '    "aA")',
        ")",
      ].join("\n"),
    );
  });

  it("splits a sequence of integers", () => {
    expect(
      run([
        "(declare-const s (Seq Int))",
        "(declare-const t (Seq Int))",
        "(assert (= (seq.++ s t) (seq.++ (seq.unit 1) (seq.unit 2) (seq.unit 3))))",
        "(assert (= (seq.len s) 2))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun t () (Seq Int)",
        "    (seq.unit 3))",
        "  (define-fun s () (Seq Int)",
        "    (seq.++ (seq.unit 1) (seq.unit 2)))",
        ")",
      ].join("\n"),
    );
  });

  it("finds a sequence from seq.nth and seq.contains", () => {
    expect(
      run([
        "(declare-const s (Seq Int))",
        "(assert (= (seq.len s) 2))",
        "(assert (= (seq.nth s 0) 5))",
        "(assert (> (seq.nth s 1) (seq.nth s 0)))",
        "(assert (seq.contains s (seq.unit 7)))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(",
        "  (define-fun s () (Seq Int)",
        "    (seq.++ (seq.unit 5) (seq.unit 7)))",
        ")",
      ].join("\n"),
    );
  });

  it("decides disequalities of strings", () => {
    expect(
      run([
        "(declare-const x String)",
        "(declare-const y String)",
        "(assert (not (= x y)))",
        "(assert (= (str.len x) 0))",
        "(assert (= (str.len y) 0))",
        "(check-sat)",
        "(push)",
        "(pop)",
        "(declare-const z String)",
        '(assert (not (= z "")))',
        '(assert (str.in_re z (re.opt (str.to_re "q"))))',
        "(check-sat)",
        "(get-value (z))",
      ]).join("\n"),
    ).toBe(["unsat", "unsat", '(error "line 13 column 14: model is not available")'].join("\n"));
  });

  it("restores the string state on pop", () => {
    expect(
      run([
        "(declare-const x String)",
        "(push)",
        '(assert (= x "abc"))',
        '(assert (str.suffixof "d" x))',
        "(check-sat)",
        "(pop)",
        '(assert (str.suffixof "d" x))',
        "(assert (= (str.len x) 1))",
        "(check-sat)",
        "(get-value (x (str.++ x x)))",
      ]).join("\n"),
    ).toBe(["unsat", "sat", '((x "d")', ' ((str.++ x x) "dd"))'].join("\n"));
  });

  it("finds a digit above a code point", () => {
    expect(
      run([
        "(declare-const x String)",
        "(assert (str.is_digit x))",
        "(assert (> (str.to_code x) 56))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(["sat", "(", "  (define-fun x () String", '    "9")', ")"].join("\n"));
  });
});

describe("regular expression membership", () => {
  it("finds a member of a union under a length", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (str.in_re x (re.+ (re.union (str.to_re "ab") (str.to_re "c")))))',
        "(assert (= (str.len x) 3))",
        "(check-sat)",
        "(get-model)",
      ]).join("\n"),
    ).toBe(["sat", "(", "  (define-fun x () String", '    "ccc")', ")"].join("\n"));
  });

  it("refutes a member of odd length", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (str.in_re x (re.* (str.to_re "ab"))))',
        "(assert (= (str.len x) 3))",
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["unsat"].join("\n"));
  });

  it("refutes an intersection with a complement", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (str.in_re x (re.inter (re.* (re.range "a" "b")) (re.comp (re.++ re.all (str.to_re "aa") re.all)))))',
        '(assert (str.in_re x (re.++ re.all (str.to_re "aa") re.all)))',
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["unsat"].join("\n"));
  });

  it("enumerates the members of a loop", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (str.in_re x ((_ re.loop 2 4) (str.to_re "ab"))))',
        "(assert (> (str.len x) 6))",
        "(check-sat)",
        "(get-model)",
        '(assert (not (= x "abababab")))',
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["sat", "(", "  (define-fun x () String", '    "abababab")', ")", "unsat"].join("\n"));
  });

  it("proves two regexes equivalent", () => {
    expect(
      run([
        "(declare-const x String)",
        '(assert (not (= (str.in_re x (re.* (re.union (str.to_re "a") (str.to_re "b")))) (str.in_re x (re.* (re.++ (re.* (str.to_re "a")) (re.* (str.to_re "b"))))))))',
        "(check-sat)",
      ]).join("\n"),
    ).toBe(["unsat"].join("\n"));
  });
});

class ReleaseCountingManager extends AstManager {
  numDeadReleases = 0;

  override decRef(expr: number) {
    if (this.ids[expr] === -1) this.numDeadReleases++;
    super.decRef(expr);
  }
}

describe("the terms the theory of sequences internalizes", () => {
  it("are not released while their enodes hold them", () => {
    const manager = new ReleaseCountingManager(new ResourceLimit(Infinity));
    const problem = parseSmtlib(
      [
        "(declare-const x String)",
        "(declare-const y String)",
        "(declare-const z String)",
        '(assert (str.suffixof (str.++ x "a") (str.++ y z)))',
      ].join("\n"),
      manager,
      () => {},
      (error) => {
        throw error;
      },
    );
    const kernel = new SmtKernel(manager, {
      isMbqi: true,
      mbqiMaxIterations: 1000,
      isFindingMacros: false,
    });
    kernel.push();
    for (const assertion of problem.assertions) kernel.assertExpr(assertion);
    expect(kernel.check()).toBe(L_TRUE);
    kernel.pop(1);
    expect(manager.numDeadReleases).toBe(0);
  });
});
