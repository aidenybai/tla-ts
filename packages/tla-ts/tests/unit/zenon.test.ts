import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { checkProof } from "../../src/zenon/check";
import { eand, enot, evar, type Expr } from "../../src/zenon/expr";
import { makeRule, type Proof } from "../../src/zenon/node";
import { proveZenon, runZenon } from "../../src/zenon/zenon";

const FIXTURES = join(import.meta.dirname, "../fixtures/zenon");

// Real .znn files that tlapm wrote, with what tlapm's Zenon reports for them under -stats.
const statistics: Record<string, { nodesSearched: number; proofNodes: number }> = JSON.parse(
  readFileSync(join(FIXTURES, "statistics.json"), "utf8"),
);
const fixtures = Object.entries(statistics).map((entry) => ({
  path: entry[0],
  expected: entry[1],
  text: readFileSync(join(FIXTURES, entry[0]), "utf8"),
}));

// tlapm gives Zenon 10 s. The fixtures take a fraction of that, so a slow machine doesn't change
// their verdicts.
const TIME_LIMIT_MS = 60_000;

describe("Zenon agrees with tlapm's Zenon", () => {
  it.each(fixtures)("searches $path the same way", (fixture) => {
    const run = runZenon(fixture.text, { timeLimitMs: TIME_LIMIT_MS });
    expect({ nodesSearched: run.nodesSearched, proofNodes: run.proofNodes }).toEqual(
      fixture.expected,
    );
    expect(proveZenon(fixture.text, { timeLimitMs: TIME_LIMIT_MS })).toBe(
      fixture.path.startsWith("proved/") ? "proved" : "unknown",
    );
  });
});

// Each goal is false, next to a true one, so no sound search proves it.
const FALSE_GOALS = {
  "a disjunction implies its first disjunct": "$goal (=> (\\/ p q) p)",
  "an existential gives a universal": '$hyp "h" (E. ((x) (P x)))\n$goal (A. ((x) (P x)))',
  "equality relates any two terms": '$hyp "h" (= a b)\n$goal (= a c)',
  "a member of a union is in its first set":
    '$hyp "h" (TLA.in a (TLA.cup b c))\n$goal (TLA.in a b)',
  "a bounded universal holds outside its bound": '$hyp "h" (TLA.bAll s ((x) (P x)))\n$goal (P a)',
  "a function applies outside its domain": "$goal (= (TLA.fapply (TLA.Fcn s ((x) x)) a) a)",
  "tuples with different components are equal": "$goal (= (TLA.tuple a b) (TLA.tuple a c))",
  "distinct strings are equal": '$goal (= "a" "b")',
  "IF p THEN a ELSE b is a": "$goal (= (TLA.cond p a b) a)",
  "CHOOSE satisfies an unsatisfiable predicate": "$goal (P (TLA.bChoice s ((x) (P x))))",
  "a member of {b, c} is b": '$hyp "h" (TLA.in a (TLA.set b c))\n$goal (= a b)',
  "a member of b is in b \\ c": '$hyp "h" (TLA.in a b)\n$goal (TLA.in a (TLA.setminus b c))',
  "EXCEPT changes every argument": "$goal (= (TLA.fapply (TLA.except f a b) c) b)",
  "every set is a subset": "$goal (TLA.in a (TLA.SUBSET b))",
  "subset is symmetric": '$hyp "h" (TLA.subseteq a b)\n$goal (TLA.subseteq b a)',
  "records with different fields are equal": '$goal (= (TLA.record "a" x) (TLA.record "a" y))',
};

describe("Zenon finds no proof of a false goal", () => {
  it.each(Object.entries(FALSE_GOALS))("%s", (_, text) => {
    expect(proveZenon(text, { timeLimitMs: 1000 })).toBe("unknown");
  });

  it("rejects the proof that Zenon's not_subseteq_cap rule gives", () => {
    // tlapm's Zenon proves this. Its rule for ~(a \subseteq b \cap c) opens two branches, both
    // ~(a \subseteq c), where Zenon.thy's lemma has ~(a \subseteq b) and ~(a \subseteq c).
    const text = '$hyp "h" (TLA.subseteq a c)\n$goal (TLA.subseteq a (TLA.cap b c))';
    const run = runZenon(text, { timeLimitMs: TIME_LIMIT_MS });
    expect(run.proof).toBeDefined();
    expect(run.isChecked).toBe(false);
    expect(proveZenon(text, { timeLimitMs: TIME_LIMIT_MS })).toBe("unknown");
  });
});

describe("the proof checker", () => {
  const first = evar("p");
  const second = evar("q");
  const getClosure = (formula: Expr): Proof => ({
    conclusions: [],
    rule: makeRule("close", [formula]),
    uses: [],
    subproofs: [],
  });
  const conjunction = eand(first, second);
  const getSplit = (name: string): Proof => ({
    conclusions: [],
    rule: makeRule(name, [first, second]),
    uses: [],
    subproofs: [getClosure(first)],
  });

  it("accepts a closure on a formula and its negation", () => {
    const hypotheses = [first, enot(first)];
    expect(checkProof(getClosure(first), { hypotheses, definitions: [] })).toBe(true);
  });

  it("rejects a closure without the negation", () => {
    expect(checkProof(getClosure(first), { hypotheses: [first], definitions: [] })).toBe(false);
  });

  it("accepts a conjunction split into its conjuncts", () => {
    const hypotheses = [conjunction, enot(first)];
    expect(checkProof(getSplit("and"), { hypotheses, definitions: [] })).toBe(true);
  });

  it("rejects a rule whose premise isn't a hypothesis", () => {
    const hypotheses = [eand(second, first), enot(first)];
    expect(checkProof(getSplit("and"), { hypotheses, definitions: [] })).toBe(false);
  });

  it("rejects a disjunction rule on a conjunction", () => {
    const hypotheses = [conjunction, enot(first)];
    expect(checkProof(getSplit("or"), { hypotheses, definitions: [] })).toBe(false);
  });
});
