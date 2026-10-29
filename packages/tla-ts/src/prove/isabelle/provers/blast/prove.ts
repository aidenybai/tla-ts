// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// The tableau prover, based on leanTaP. It works on a list of branches, each with its unexpanded
// formulae, its literals and a bound on unsafe expansions. Every inference records the tactic
// that replays it; once all branches close, the continuation reconstructs the proof. Each
// recursion level that can be backtracked to owns a token, and a choice point raises it.

import type { Seq } from "../../pure/seq";
import type { GoalTactic } from "../../pure/tactical";
import { checkInterrupt } from "../../pure/interrupt";
import type { Thm } from "../../pure/thm";
import {
  addLit,
  equalSubst,
  joinMd,
  log4,
  match,
  negOfGoal,
  negOfGoals,
  nextVars,
  prune,
  tryClose,
} from "./branch";
import { negOfGoalTac, netMkRules, type TableauRule } from "./rules";
import {
  backtrack,
  clearTo,
  isBacktrackTo,
  unify,
  type BlastState,
  type Branch,
  type Choice,
  type Formula,
  type Level,
} from "./state";
import {
  addTermVars,
  addTermsVars,
  isGoal,
  norm,
  varsInVars,
  type BlastTerm,
  type VarRef,
} from "./term";

export type Continuation = (tactics: readonly GoalTactic[], choices: readonly Choice[]) => Seq<Thm>;

// A step either finishes the search or continues the same branches without a choice point, which
// blast.ML does by a tail call. prv loops on the latter, so a long search can't exhaust the stack.
type Step =
  | { readonly kind: "done"; readonly result: Seq<Thm> }
  | {
      readonly kind: "next";
      readonly tactics: readonly GoalTactic[];
      readonly choices: readonly Choice[];
      readonly brs: readonly Branch[];
    };

const done = (result: Seq<Thm>): Step => ({ kind: "done", result });

const sameVars = (left: readonly VarRef[], right: readonly VarRef[]) =>
  left.length === right.length && left.every((ref, index) => ref === right[index]);

const addPremsVars = (prems: readonly (readonly BlastTerm[])[], vars: readonly VarRef[]) =>
  prems.reduceRight((result, prem) => addTermsVars(prem, result), vars);

export const prove = (
  state: BlastState,
  initial: readonly Branch[],
  cont: Continuation,
): Seq<Thm> => {
  const context = state.context;
  const safeList = [context.claset.safe0, context.claset.safep];
  const unsafeList = [context.claset.unsafe];

  // Applies a safe rule only, possibly allowing instantiation; defers any unsafe formulae.
  const safeStep = (
    tactics: readonly GoalTactic[],
    choices: readonly Choice[],
    brs: readonly Branch[],
  ): Step => {
    const token = {};
    const branch = brs[0];
    const rest = brs.slice(1);
    const head = branch.pairs[0];
    const md = head.safe[0].md;
    const queued: Level = { safe: head.safe.slice(1), unsafe: head.unsafe };
    const pairs = [queued, ...branch.pairs.slice(1)];
    const ntrl = state.trail.length;
    const nbrs = brs.length;
    const nxtVars = nextVars(rest);
    const formula = norm(head.safe[0].term);
    const rules = netMkRules(state, formula, branch.vars, safeList);
    // Makes the new branches, decrementing lim if instantiations occur.
    const newBr = (vars: readonly VarRef[], lim: number, prems: TableauRule["prems"]): Branch[] => [
      ...prems.map((prem): Branch => {
        const level = { safe: joinMd(md, prem), unsafe: [] };
        return prem.some(isGoal)
          ? {
              pairs: [level, ...negOfGoals(state, pairs)],
              lits: branch.lits.map((lit) => negOfGoal(state, lit)),
              vars,
              lim,
            }
          : { pairs: [level, ...pairs], lits: branch.lits, vars, lim };
      }),
      ...rest,
    ];
    // Seeks a matching rule; if unifiable, adds its premises to the branch. Undefined is
    // NEWBRANCHES.
    const deeper = (): Seq<Thm> | undefined => {
      for (let position = 0; position < rules.length; position += 1) {
        const rule = rules[position];
        if (!unify(state, addTermVars(rule.major, []), rule.major, formula)) continue;
        const isUpdated = ntrl < state.trail.length;
        // Discourages branching updates.
        const lim = isUpdated ? branch.lim - (1 + log4(rules.length)) : branch.lim;
        const vars = addPremsVars(rule.prems, varsInVars(branch.vars));
        const nextChoices = [{ ntrl, nbrs, token }, ...choices];
        const nextTactics = [rule.tactic(isUpdated, false, true), ...tactics];
        try {
          if (rule.prems.length === 0)
            return prv(nextTactics, prune(state, nbrs, nxtVars, nextChoices), rest);
          // Faster to kill all the alternatives.
          if (lim < 0) {
            clearTo(state, ntrl);
            return undefined;
          }
          return prv(nextTactics, nextChoices, newBr(vars, lim, rule.prems));
        } catch (error) {
          if (!isBacktrackTo(error, token)) throw error;
          // Backtracks at this level, resetting variables and trying another rule, or to the
          // previous level.
          if (!isUpdated) return backtrack(choices);
          clearTo(state, ntrl);
        }
      }
      return undefined;
    };
    // Tries to close the branch by unifying the formula with a literal. Undefined is CLOSEF.
    const closeF = (literals: readonly BlastTerm[]): Seq<Thm> | undefined => {
      for (const literal of literals) {
        const tactic = tryClose(state, formula, literal);
        if (tactic === undefined) continue;
        const nextChoices = prune(state, nbrs, nxtVars, [{ ntrl, nbrs, token }, ...choices]);
        try {
          return prv([tactic, ...tactics], nextChoices, rest);
        } catch (error) {
          if (!isBacktrackTo(error, token)) throw error;
          clearTo(state, ntrl);
        }
      }
      return undefined;
    };
    // Tries to unify a queued formula, safe or unsafe, with the formula.
    const closeFl = (levels: readonly Level[]): Seq<Thm> | undefined => {
      for (const level of levels) {
        const closed =
          closeF(level.safe.map((queuedFormula) => queuedFormula.term)) ??
          closeF(level.unsafe.map((queuedFormula) => queuedFormula.term));
        if (closed !== undefined) return closed;
      }
      return undefined;
    };
    if (branch.lim < 0) return backtrack(choices);
    const substituted = equalSubst(state, formula, { ...branch, pairs });
    if (substituted !== undefined)
      return {
        kind: "next",
        tactics: [context.data.hypSubstTac(context.limits), ...tactics],
        choices,
        brs: [substituted, ...rest],
      };
    const closed = closeF(branch.lits) ?? closeFl(pairs) ?? deeper();
    if (closed !== undefined) return done(closed);
    if (netMkRules(state, formula, branch.vars, unsafeList).length === 0)
      // There are no plausible unsafe rules: the formula becomes a literal.
      return {
        kind: "next",
        tactics,
        choices,
        brs: [
          { pairs, lits: addLit(state, formula, branch.lits), vars: branch.vars, lim: branch.lim },
          ...rest,
        ],
      };
    // The formula admits some unsafe rules: try them later.
    const deferred: Formula = { term: negOfGoal(state, formula), md };
    return {
      kind: "next",
      tactics: isGoal(formula) ? [negOfGoalTac(state), ...tactics] : tactics,
      choices,
      brs: [
        {
          pairs: [{ safe: queued.safe, unsafe: [...queued.unsafe, deferred] }, ...pairs.slice(1)],
          lits: branch.lits,
          vars: branch.vars,
          lim: branch.lim,
        },
        ...rest,
      ],
    };
  };

  // No safe steps are possible at any level: applies an unsafe rule.
  const unsafeStep = (
    tactics: readonly GoalTactic[],
    choices: readonly Choice[],
    brs: readonly Branch[],
  ): Step => {
    const token = {};
    const branch = brs[0];
    const rest = brs.slice(1);
    const queued = branch.pairs[0].unsafe;
    const md = queued[0].md;
    const others = queued.slice(1);
    const formula = norm(queued[0].term);
    const ntrl = state.trail.length;
    const rules = netMkRules(state, formula, branch.vars, unsafeList);
    // The new premises of unsafe rules may not be duplicated.
    const newPrem = (
      vars: readonly VarRef[],
      pattern: BlastTerm,
      isDup: boolean,
      lim: number,
      prem: readonly BlastTerm[],
    ): Branch => {
      const safe = prem.map((term) => ({ term, md: false }));
      const unsafe = isDup ? [...others, { term: negOfGoal(state, formula), md }] : others;
      return {
        // A premise recursive in the rule makes no new stack frame: its unsafe premises end up at
        // the back of the queue, preventing the exclusion of others.
        pairs: prem.some((term) => match(state, pattern, term))
          ? [{ safe, unsafe }]
          : [
              { safe, unsafe: [] },
              { safe: [], unsafe },
            ],
        lits: prem.some(isGoal) ? branch.lits.map((lit) => negOfGoal(state, lit)) : branch.lits,
        vars,
        lim,
      };
    };
    const deeper = (): Seq<Thm> | undefined => {
      for (let position = 0; position < rules.length; position += 1) {
        const rule = rules[position];
        if (!unify(state, addTermVars(rule.major, []), rule.major, formula)) continue;
        const isUpdated = ntrl < state.trail.length;
        const vars = varsInVars(branch.vars);
        const newVars = addPremsVars(rule.prems, vars);
        // Duplicates the formula if md permits.
        const isDup = md;
        // Decrements lim extra if updates occur.
        const lim = isUpdated ? branch.lim - (1 + log4(rules.length)) : branch.lim - 1;
        // Allows backtracking from a rule application if other matching rules exist, if the rule
        // updated variables, or if it introduced no new variables, so that it is not a standard
        // gamma-rule. This emulates fast_tac, which allows all unsafe steps to be undone.
        const mayUndo = position + 1 < rules.length || isUpdated || sameVars(vars, newVars);
        const tactic = rule.tactic(isUpdated, isDup, true);
        // Faster to kill all the alternatives.
        if (lim < 0 && rule.prems.length > 0) {
          clearTo(state, ntrl);
          return undefined;
        }
        try {
          return prv(
            [tactic, ...tactics],
            [{ ntrl, nbrs: brs.length, token }, ...choices],
            [...rule.prems.map((prem) => newPrem(newVars, rule.major, isDup, lim, prem)), ...rest],
          );
        } catch (error) {
          if (!isBacktrackTo(error, token)) throw error;
          if (!mayUndo) return backtrack(choices);
          clearTo(state, ntrl);
        }
      }
      return undefined;
    };
    if (branch.lim < 1) return backtrack(choices);
    const closed = deeper();
    if (closed !== undefined) return done(closed);
    // If no rule closes the branch, the formula becomes a literal.
    return {
      kind: "next",
      tactics,
      choices,
      brs: [
        {
          pairs: [{ safe: [], unsafe: others }],
          lits: [formula, ...branch.lits],
          vars: branch.vars,
          lim: branch.lim,
        },
        ...rest,
      ],
    };
  };

  const prv = (
    initialTactics: readonly GoalTactic[],
    initialChoices: readonly Choice[],
    branches: readonly Branch[],
  ): Seq<Thm> => {
    let tactics = initialTactics;
    let choices = initialChoices;
    let brs = branches;
    for (;;) {
      checkInterrupt(context.limits);
      // All branches closed.
      if (brs.length === 0) return cont(tactics, choices);
      const branch = brs[0];
      const head = branch.pairs[0];
      if (head === undefined) return backtrack(choices);
      const step =
        head.safe.length > 0
          ? safeStep(tactics, choices, brs)
          : branch.pairs.length === 1 && head.unsafe.length > 0
            ? unsafeStep(tactics, choices, brs)
            : undefined;
      if (step?.kind === "done") return step.result;
      if (step !== undefined) {
        tactics = step.tactics;
        choices = step.choices;
        brs = step.brs;
        continue;
      }
      if (branch.pairs.length > 1) {
        // No more safe formulae: transfers the unsafe ones down a level.
        const below = branch.pairs[1];
        brs = [
          {
            pairs: [
              { safe: below.safe, unsafe: [...head.unsafe, ...below.unsafe] },
              ...branch.pairs.slice(2),
            ],
            lits: branch.lits,
            vars: branch.vars,
            lim: branch.lim,
          },
          ...brs.slice(1),
        ];
        continue;
      }
      return backtrack(choices);
    }
  };

  return prv([], [{ ntrl: state.trail.length, nbrs: initial.length, token: undefined }], initial);
};
