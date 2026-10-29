// Decides a theory tlapm writes for Isabelle, as tlapm's Isabelle backend runs it: use_thy on the
// heap of Isabelle/TLA+ succeeds or fails.

import { TlaIsabelleError } from "../../errors";
import type { DecideOptions, Verdict } from "../verdict";
import { parseProofText, terminalProof } from "./isar/method";
import { getFacts, initGoal } from "./isar/proof";
import { readStatement } from "./isar/statement";
import { parseTheory } from "./isar/theory";
import { protect } from "./pure/logic";
import { seqHead } from "./pure/seq";
import { aconv } from "./pure/term";
import { getProofContext } from "./tla/context";
import { loadLogic } from "./tla/logic";

export const decideIsabelle = (text: string, options: DecideOptions): Exclude<Verdict, "sat"> => {
  const limits = { deadline: Date.now() + options.timeLimitMs, signal: options.signal };
  try {
    const theory = parseTheory(text);
    const logic = loadLogic();
    const statement = readStatement(logic, theory);
    const facts = theory.isUsingAssms ? getFacts(limits, statement) : [];
    const result = seqHead(
      terminalProof(
        getProofContext(logic, limits),
        parseProofText(theory.method),
        facts,
        initGoal(statement),
      ),
    );
    // Proof.conclude_goal: the theorem must be the statement, from its assumptions only.
    return result !== undefined &&
      result.tpairs.length === 0 &&
      aconv(result.prop, protect(statement.conclusion)) &&
      result.hyps.every((hyp) => statement.assumptions.some((assumption) => aconv(hyp, assumption)))
      ? "unsat"
      : "unknown";
  } catch (error) {
    // Isabelle reports an error, or runs out of time, where this port runs out of stack.
    if (error instanceof TlaIsabelleError || error instanceof RangeError) return "unknown";
    throw error;
  }
};
