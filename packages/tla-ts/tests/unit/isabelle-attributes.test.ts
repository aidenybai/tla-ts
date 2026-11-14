import { describe, expect, it } from "vite-plus/test";
import { decideIsabelle } from "../../src/prover/isabelle/decide";
import { parseTheory } from "../../src/prover/isabelle/isar/theory";
import { runTheory } from "../../src/prover/isabelle/isar/toplevel";
import { loadLogic } from "../../src/prover/isabelle/tla/logic";

const wrap = (body: string) => `theory T imports Constant begin\n${body}\nend\n`;

const decide = (body: string) => decideIsabelle(wrap(body), { timeLimitMs: 30_000 });

const run = (body: string) =>
  runTheory(loadLogic(), parseTheory(wrap(body)), {
    deadline: Date.now() + 30_000,
    signal: undefined,
  });

const FORALL = "\\<forall>x : x = x";
const USE = 'lemma b: fixes y shows "y = y" by (rule a)';

describe("the where attribute names its variables as Args.var reads them", () => {
  it.each(["?a", "a"])("instantiates %s", (variable) => {
    expect(decide(`lemma fixes x shows "x = x" by (rule refl[where ${variable} = "x"])`)).toBe(
      "unsat",
    );
  });

  it("reports a variable the theorem lacks", () => {
    expect(() => run('lemma fixes x shows "x = x" by (rule refl[where ?zz = "x"])')).toThrow(
      'No such variable in theorem: "?zz"',
    );
  });
});

describe("a fact keeps the attributes of its name", () => {
  it.each([
    ["a lemma", `lemma a [rule_format]: "${FORALL}" by simp\n${USE}`],
    ["a lemma's statement", `lemma shows a [rule_format]: "${FORALL}" by simp\n${USE}`],
    [
      "a lemma's assumption",
      'lemma fixes y assumes a [rule_format]: "\\<forall>x : x = y" shows "y = y" by (rule a)',
    ],
    [
      "have",
      `lemma fixes y shows "y = y"\nproof -\nhave a [rule_format]: "${FORALL}" by simp\nshow "y = y" by (rule a)\nqed`,
    ],
    [
      "assume",
      'lemma fixes y shows "(\\<forall>x : x = y) \\<Longrightarrow> y = y"\nproof -\nassume a [rule_format]: "\\<forall>x : x = y"\nshow "y = y" by (rule a)\nqed',
    ],
  ])("of %s", (_name, body) => {
    expect(decide(body)).toBe("unsat");
    expect(decide(body.replace(" [rule_format]", ""))).toBe("unknown");
  });

  it("applies a statement's attributes before the lemma's", () => {
    const lemma = `lemma c [of "{}"]: shows a [rule_format]: "${FORALL}" by simp`;
    expect(decide(`${lemma}\n${USE}\nlemma "{} = {}" by (rule c)`)).toBe("unsat");
    expect(decide(`${lemma}\nlemma fixes y shows "y = y" by (rule c)`)).toBe("unknown");
  });

  it.each([
    ["a lemma", `lemma a [iff]: "${FORALL}" by simp`],
    ["a definition", 'definition foo where foo_def [iff]: "foo \\<equiv> {}"'],
  ])("rejects an attribute of %s that it cannot apply", (_name, body) => {
    expect(() => run(body)).toThrow("Unsupported attribute: iff");
    expect(decide(body)).toBe("unknown");
  });
});

describe("a definition checks its equation against the declared type", () => {
  it("accepts the type of the right-hand side", () => {
    expect(
      decide(
        'definition foo :: "c" where "foo \\<equiv> {}"\nlemma "foo = {}" unfolding foo_def by simp',
      ),
    ).toBe("unsat");
  });

  it("rejects another type", () => {
    const body = 'definition foo :: "c \\<Rightarrow> c" where "foo \\<equiv> {}"';
    expect(() => run(body)).toThrow("Type unification failed");
    expect(decide(body)).toBe("unknown");
  });
});

describe("the method combinators the port lacks fail when the theory is read", () => {
  it.each([
    [";", "(rule refl; simp)"],
    ["[", "((rule refl)[1])"],
  ])("%s", (combinator, method) => {
    expect(() => parseTheory(wrap(`lemma fixes x shows "x = x" by ${method}`))).toThrow(
      `Unsupported method combinator: ${combinator}`,
    );
  });
});
