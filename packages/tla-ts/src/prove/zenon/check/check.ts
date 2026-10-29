// An independent check of the proofs that the Zenon port finds. It shares no code with the search:
// formulas compare by their own alpha-equivalence, substitution and unfolding are rebuilt here, and
// each rule's branches come from the lemma that justifies the rule in tlapm's Zenon.thy rather than
// from the prover. The check walks the proof bottom up and computes the formulas each subproof
// needs. A proof is valid when every rule is one of the lemmas and the root needs only hypotheses.

import type { PlainRuleName, Proof, RuleArgs } from "../proof";
import { getDefinitionSpec } from "./definitions";
import { EQUALITY_RULES, getRelationRuleSpec } from "./equality";
import { FUNCTION_RULES } from "./functions";
import { createKeys } from "./keys";
import { PROPOSITIONAL_RULES } from "./propositional";
import { RECORD_RULES } from "./records";
import { createRelationProperties } from "./relations";
import { REWRITE_RULES } from "./rewrites";
import { SET_RULES } from "./sets";
import { TLA_RULES } from "./tla";
import {
  ensure,
  UncheckedError,
  type CheckContext,
  type Checker,
  type RuleSpec,
  type SpecTable,
  type Term,
} from "./terms";

const PLAIN_RULES: SpecTable<PlainRuleName> = {
  ...PROPOSITIONAL_RULES,
  ...EQUALITY_RULES,
  ...SET_RULES,
  ...FUNCTION_RULES,
  ...RECORD_RULES,
  ...REWRITE_RULES,
  ...TLA_RULES,
};

const getPlainRuleSpec = <Name extends PlainRuleName>(
  rule: { name: Name; args: RuleArgs<Name, Term> },
  checker: Checker,
  uses: Term[],
) => PLAIN_RULES[rule.name](rule.args, checker, uses);

const getRuleSpec = (proof: Proof<Term>, checker: Checker): RuleSpec => {
  const rule = proof.rule;
  switch (rule.name) {
    case "definition":
      return getDefinitionSpec(rule.definition, rule.args, checker);
    case "close_refl":
    case "close_sym":
    case "refl":
    case "p_not_p_sym":
      return getRelationRuleSpec(rule, checker);
    default:
      return getPlainRuleSpec(rule, checker, proof.uses);
  }
};

// True when the proof refutes the hypotheses.
export const checkProof = (root: Proof<Term>, context: CheckContext) => {
  const keys = createKeys();
  const hasRelation = createRelationProperties(context);
  const checker: Checker = {
    ...keys,
    context,
    ensureRelation: (symbol, properties) => ensure(hasRelation(symbol, properties)),
  };
  const needed = new Map<Proof<Term>, Set<string>>();
  const getNeeded = (proof: Proof<Term>) => {
    const spec = getRuleSpec(proof, checker);
    ensure(spec.branches.length === proof.subproofs.length);
    const result = new Set(spec.premises.map(keys.getTopKey));
    proof.subproofs.forEach((subproof, index) => {
      const branch = new Set(spec.branches[index].map(keys.getTopKey));
      for (const key of needed.get(subproof) ?? []) if (!branch.has(key)) result.add(key);
    });
    return result;
  };
  try {
    // Subproofs before their parents, without recursion: proofs can be deep.
    const stack: [Proof<Term>, boolean][] = [[root, false]];
    while (stack.length > 0) {
      const top = stack.pop();
      if (top === undefined) break;
      const proof = top[0];
      if (needed.has(proof)) continue;
      if (top[1]) {
        needed.set(proof, getNeeded(proof));
        continue;
      }
      stack.push([proof, true]);
      for (const subproof of proof.subproofs)
        if (!needed.has(subproof)) stack.push([subproof, false]);
    }
    const hypotheses = new Set(context.hypotheses.map(keys.getTopKey));
    const missing = [...(needed.get(root) ?? [])].filter((key) => !hypotheses.has(key));
    return missing.length === 0;
  } catch (error) {
    if (error instanceof UncheckedError) return false;
    throw error;
  }
};
