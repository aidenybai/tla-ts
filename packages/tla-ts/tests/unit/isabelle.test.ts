import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { decideIsabelle } from "../../src/prover/isabelle/decide";

// Theories tlapm wrote for Isabelle, named after their module and obligation, with Isabelle's verdict
// on each from the conformance recording.
const DIRECTORY = join(import.meta.dirname, "../fixtures/isabelle");

const readTheory = (name: string) => readFileSync(join(DIRECTORY, `${name}.thy`), "utf8");

const decide = (text: string) => decideIsabelle(text, { timeLimitMs: 30_000 });

describe("decideIsabelle gives Isabelle's verdict on tlapm's theories", () => {
  it.each([
    ["AllocatorImplementation_proof-33", "auto", "unsat"],
    ["AllocatorImplementation_proof-127", "iprover", "unsat"],
    ["FiniteSetTheorems_proofs-453", "blast", "unsat"],
    ["Sets-183", "force", "unsat"],
    ["TLAPS-2", "(auto intro: inIrrefl)", "unsat"],
    ["NaturalsInduction_proofs-1", "(intro natInduct, auto)", "unsat"],
    ["AtomicBakeryWithoutSMT-6", "(auto dest: int_leq_less_trans)", "unsat"],
    ["AtomicBakeryWithoutSMT-465", "clarsimp auto?", "unsat"],
    ["plus_zero-1", "simp", "unsat"],
    ["fast_forall_instance-1", "fast", "unsat"],
    ["choose_witness_rule-1", "(rule chooseI)", "unsat"],
    ["function_except_tuple_soundness_gh201_test-1", "auto", "unknown"],
    ["constantfcn_test-1", "auto", "unknown"],
  ])("%s by %s: %s", (name, method, verdict) => {
    const text = readTheory(name);
    expect(text).toContain(`by ${method}\n`);
    expect(decide(text)).toBe(verdict);
  });

  // tlapm's isabelle/examples/Allocator.thy.
  it("checks the definitions and structured proofs of Allocator", () => {
    expect(decide(readTheory("Allocator"))).toBe("unsat");
  }, 30_000);

  it("answers unknown for a theory tlapm stopped writing partway", () => {
    expect(decide(readTheory("Level_test-1"))).toBe("unknown");
  });

  // tla-ts's encoder wrote this one, since tlapm proved the obligation with SMT. The simplifier
  // keeps growing the goal, and Isabelle breaks down after two minutes.
  it("answers unknown when the simplifier runs out of stack", () => {
    expect(decide(readTheory("Paxos-109"))).toBe("unknown");
  }, 30_000);
});

// Isabelle fails on each of these too.
describe("decideIsabelle doesn't prove what doesn't follow", () => {
  it.each([
    "AllocatorImplementation_proof-33",
    "AllocatorImplementation_proof-127",
    "FiniteSetTheorems_proofs-453",
    "Sets-183",
    "choose_witness_rule-1",
  ])("%s without its assumptions", (name) => {
    const text = readTheory(name);
    expect(text).toContain("using assms by");
    expect(decide(text.replace("using assms by", "by"))).toBe("unknown");
  });

  it.each([
    [
      "InitMutex from the type invariant",
      'InitMutex: "Init(unsat,alloc)',
      'InitMutex: "TypeInvariant(unsat,alloc)',
    ],
    [
      "ReturnMutex assuming the old allocation",
      `rc': "r \\<in> alloc'[c']"`,
      `rc': "r \\<in> alloc[c']"`,
    ],
  ])("Allocator's %s", (_name, text, replacement) => {
    const theory = readTheory("Allocator");
    expect(theory).toContain(text);
    expect(decide(theory.replace(text, replacement))).toBe("unknown");
  });

  it("Allocator's AllocateMutex with its cases swapped", () => {
    const theory = readTheory("Allocator");
    const simpleCase = "case False \\<comment> \\<open> the simple case first";
    const otherCase = "case True \\<comment> \\<open> one of";
    expect(theory).toContain(simpleCase);
    expect(theory).toContain(otherCase);
    const swapped = theory
      .replace(simpleCase, simpleCase.replace("False", "True"))
      .replace(otherCase, otherCase.replace("True", "False"));
    expect(decide(swapped)).toBe("unknown");
  }, 30_000);

  const falseGoal = readTheory("function_except_tuple_soundness_gh201_test-1").replace(
    /^assumes .*\n/m,
    "",
  );

  it.each(["auto", "blast", "iprover", "force", "clarsimp auto?"])("FALSE by %s", (method) => {
    expect(falseGoal).toContain('shows "(FALSE)"');
    expect(decide(falseGoal.replace("using assms by auto", `by ${method}`))).toBe("unknown");
  });
});
