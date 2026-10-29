// Ported from Zenon's prove.ml, as shipped in tlapm. Copyright 2002 INRIA, see LICENSE.
//
// The tableau search. Each formula added to a branch suggests nodes, which wait in the queue by
// priority. The search takes the next node, and refutes each of its branches in turn. A branch is
// closed when it holds a formula and its negation. Zenon's mutually recursive search functions are
// one loop here, with an explicit stack of frames.

import { TlaZenonError } from "../../errors";
import { difference, isApp, isDisjoint, isMeta, union, type Expr } from "./expr";
import { EMPTY_QUEUE, getQueueHead, removeNode, type Node, type Queue } from "./node";
import { stableSort } from "./ocaml";
import type { Definition } from "./parse";
import type { Hypothesis } from "./phrase";
import type { Proof, Rule } from "./proof";
import { addNodes, type SearchContext } from "./rules";

const isTrivial = (context: SearchContext, formula: Expr) =>
  formula.kind === "true" ||
  (formula.kind === "not" && formula.args[0].kind === "false") ||
  (formula.kind === "app" &&
    formula.args.length === 2 &&
    formula.args[0] === formula.args[1] &&
    context.relations.isReflexive(formula.symbol));

// Zenon's reduce_list: drops the formulas a branch already has, and reverses the rest.
const reduceBranch = (context: SearchContext, branch: Expr[]) => {
  const exprs = context.exprs;
  const index = context.index;
  const relations = context.relations;
  const kept: Expr[] = [];
  const isKnown = (formula: Expr) => index.isMember(formula) || kept.includes(formula);
  for (const formula of branch) {
    if (
      formula.kind === "true" ||
      (formula.kind === "not" && formula.args[0].kind === "false") ||
      (formula.kind === "not" &&
        isApp(formula.args[0], "TLA.in", 2) &&
        formula.args[0].args[1].kind === "var" &&
        formula.args[0].args[1].symbol === "TLA.emptyset")
    )
      continue;
    const atom = formula.kind === "not" ? formula.args[0] : formula;
    const isRelation = atom.kind === "app" && atom.args.length === 2;
    if (
      formula.kind === "app" &&
      isRelation &&
      formula.args[0] === formula.args[1] &&
      relations.isReflexive(formula.symbol)
    )
      continue;
    if (isRelation && relations.isSymmetric(atom.symbol)) {
      const swapped = exprs.eapp(atom.symbol, [atom.args[1], atom.args[0]]);
      const reversed = formula.kind === "not" ? exprs.enot(swapped) : swapped;
      if (!isKnown(formula) && !isKnown(reversed)) kept.unshift(formula);
      continue;
    }
    if (!isKnown(formula)) kept.unshift(formula);
  }
  return kept;
};

const isNotMetaEquality = (formula: Expr): boolean => {
  if (formula.kind === "app" && formula.args.length === 2 && formula.symbol === "=")
    return !isMeta(formula.args[0]) && !isMeta(formula.args[1]);
  if (formula.kind === "app" && formula.args.length === 3 && formula.args[0].kind === "var")
    return !(formula.args[0].symbol === "_" && isMeta(formula.args[1]));
  if (formula.kind === "app" && formula.args.length === 2) return !isMeta(formula.args[1]);
  if (formula.kind === "and" || formula.kind === "or")
    return isNotMetaEquality(formula.args[0]) || isNotMetaEquality(formula.args[1]);
  return true;
};

const isNotTrivial = (formula: Expr): boolean => {
  if (formula.kind === "not" && isApp(formula.args[0], "=", 2)) {
    const atom = formula.args[0];
    return !isMeta(atom.args[0]) && !isMeta(atom.args[1]);
  }
  if (formula.kind === "not" && isApp(formula.args[0], "TLA.in", 2)) {
    const atom = formula.args[0];
    if (isMeta(atom.args[0]) && atom.args[1].kind === "var")
      return atom.args[1].symbol === "TLA.emptyset";
    return true;
  }
  if (formula.kind === "and" || formula.kind === "or")
    return isNotTrivial(formula.args[0]) || isNotTrivial(formula.args[1]);
  return true;
};

const countMetas = (formulas: Expr[]) => {
  const metas = new Set(formulas.filter(isNotMetaEquality).flatMap((formula) => formula.metas));
  return [...metas].filter((meta) => meta.metas.length === 0).length;
};

type BranchState = "open" | Proof;

const findOpenBranch = (searchNode: Node, states: BranchState[]) => {
  const last = states.length - 1;
  if (last < 0) return undefined;
  if (states[last] === "open" && searchNode.branches[last].some(isNotMetaEquality)) return last;
  const open: number[] = [];
  for (let index = 0; index <= last; index++) if (states[index] === "open") open.push(index);
  if (open.length <= 1) return open[0];
  const scores = open
    .map((index) => {
      const formulas = searchNode.branches[index];
      return {
        index,
        nontrivial: formulas.filter(isNotTrivial).length,
        metas: countMetas(formulas),
        size: formulas.reduce((total, formula) => total + formula.size, 0),
      };
    })
    .reverse();
  const sorted = stableSort(scores, (left, right) => {
    if (left.nontrivial === 0) return 1;
    if (right.nontrivial === 0) return -1;
    if (left.metas !== right.metas) return right.metas - left.metas;
    return left.size - right.size;
  });
  return sorted[0].index;
};

const isGoodLemma = (rule: Rule) =>
  rule.name !== "close" &&
  rule.name !== "close_refl" &&
  rule.name !== "close_sym" &&
  rule.name !== "false" &&
  rule.name !== "not_true";

interface Frame {
  node: Node;
  queue: Queue;
  states: BranchState[];
  current: number;
}

export interface SearchStatistics {
  inferences: number;
  proofNodes: number;
  // The proofs that closed another branch from the lemma cache. Zenon counts the uses in mlrefc and
  // prints each of these proofs once, as a lemma.
  reusedProofs: Set<Proof>;
}

export type SearchFailure = "exhausted" | "time limit" | "memory limit" | "aborted";

// When the search gives up: past the deadline, a time from Date.now(), or once the signal aborts.
// The search checks them before each formula it adds and each node it takes, so it stops within a
// step of the deadline, where tlapm kills Zenon at once.
export interface SearchLimits {
  deadline: number;
  signal: AbortSignal | undefined;
}

// Why the limits stop Zenon now, if they do. The printer checks them too, as tlapm's clock runs
// while Zenon prints the proof.
export const getLimitFailure = (limits: SearchLimits) =>
  Date.now() > limits.deadline
    ? "time limit"
    : limits.signal?.aborted === true
      ? "aborted"
      : undefined;

// Zenon gives up once its heap passes 1 GB. The port bounds the nodes that the queues of the
// current branch hold instead. On the corpus files where Zenon runs out of memory, its heap passes
// 1 GB with 1.9 to 5.5 million of them, and no proof that Zenon finds needs more than 1.3 million.
const MAX_QUEUED_NODES = 1_900_000;

// The proof of the hypotheses' inconsistency, or why the search gave up.
export const search = (
  context: SearchContext,
  definitions: Definition[],
  hypotheses: Hypothesis[],
  limits: SearchLimits,
  statistics: SearchStatistics,
): Proof | SearchFailure => {
  const index = context.index;
  definitions.forEach(index.addDefinition);
  const initial: [Expr, number][] = [];
  for (const hypothesis of hypotheses)
    if (!initial.some((entry) => entry[0] === hypothesis.formula))
      initial.unshift([hypothesis.formula, hypothesis.goalness]);

  const stack: Frame[] = [];
  let forms = initial;
  let formIndex = 0;
  let queue = EMPTY_QUEUE;

  const makeResult = (searchNode: Node, states: BranchState[]): Proof => {
    let conclusions: Expr[] = [];
    const subproofs: Proof[] = [];
    states.forEach((state, branchIndex) => {
      if (state === "open") throw new TlaZenonError("Zenon: an open branch in a closed node");
      subproofs.push(state);
      conclusions = union(
        difference(state.conclusions, searchNode.branches[branchIndex]),
        conclusions,
      );
    });
    statistics.proofNodes++;
    const proof: Proof = {
      conclusions: union(searchNode.conclusions, conclusions),
      rule: searchNode.rule,
      uses: searchNode.conclusions,
      subproofs,
    };
    if (isGoodLemma(searchNode.rule)) index.addLemma(proof);
    return proof;
  };

  // Zenon's next_branch and unwind: descend into the next open branch of a node, or close the node
  // and pop frames until one has an open branch left.
  const advance = (
    searchNode: Node,
    nodeQueue: Queue,
    states: BranchState[],
  ): Proof | undefined => {
    let currentNode = searchNode;
    let currentQueue = nodeQueue;
    let currentStates = states;
    for (;;) {
      const open = findOpenBranch(currentNode, currentStates);
      if (open !== undefined) {
        stack.push({
          node: currentNode,
          queue: currentQueue,
          states: currentStates,
          current: open,
        });
        forms = currentNode.branches[open].map((formula) => [formula, currentNode.goalness]);
        formIndex = 0;
        queue = currentQueue;
        return undefined;
      }
      const result = makeResult(currentNode, currentStates);
      const closed = unwind(result);
      if (closed !== undefined) return closed;
      const frame = stack[stack.length - 1];
      currentNode = frame.node;
      currentQueue = frame.queue;
      currentStates = frame.states;
      stack.pop();
    }
  };

  // Pops the frames that the proof closes. Returns the proof when it closes the root, and leaves the
  // frame to continue on top of the stack otherwise, with the proof recorded.
  const unwind = (proof: Proof): Proof | undefined => {
    for (;;) {
      const frame = stack.pop();
      if (frame === undefined) return proof;
      const branch = frame.node.branches[frame.current];
      for (let position = branch.length - 1; position >= 0; position--)
        if (index.isMember(branch[position])) index.remove(branch[position]);
      if (isDisjoint(branch, proof.conclusions)) continue;
      frame.states[frame.current] = proof;
      stack.push(frame);
      return undefined;
    }
  };

  for (;;) {
    const limitFailure = getLimitFailure(limits);
    if (limitFailure !== undefined) return limitFailure;
    if (queue.insertedCount > MAX_QUEUED_NODES) return "memory limit";
    if (formIndex < forms.length) {
      const entry = forms[formIndex++];
      const formula = entry[0];
      if (isTrivial(context, formula)) continue;
      index.add(formula, entry[1]);
      queue = addNodes(context, queue, formula, entry[1]);
      continue;
    }
    const head = getQueueHead(queue);
    const lemma = head === undefined || isGoodLemma(head.rule) ? index.searchLemma() : undefined;
    if (lemma !== undefined) {
      statistics.reusedProofs.add(lemma);
      const closed = unwind(lemma);
      if (closed !== undefined) return closed;
      const frame = stack[stack.length - 1];
      stack.pop();
      const result = advance(frame.node, frame.queue, frame.states);
      if (result !== undefined) return result;
      continue;
    }
    // Zenon's next_node: the next node whose branches all add something new.
    for (;;) {
      statistics.inferences++;
      const removed = removeNode(queue);
      if (removed === undefined) return "exhausted";
      queue = removed[1];
      const reduced = removed[0].branches.map((branch) => reduceBranch(context, branch));
      if (reduced.some((branch) => branch.length === 0)) continue;
      const searchNode = { ...removed[0], branches: reduced };
      const result = advance(
        searchNode,
        queue,
        reduced.map((): BranchState => "open"),
      );
      if (result !== undefined) return result;
      break;
    }
  }
};
