// Ported from Zenon's llproof.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// The low-level proofs that Zenon prints: each node's conclusions are the formulas its subproofs
// leave open, and the proof is a list of lemmas, the theorem last.

import { TlaZenonError } from "../../errors";
import { FALSE, TRUE, type Expr, type Expressions } from "./expr";

export type Connective = "and" | "or" | "imply" | "equiv";

export type LlRule =
  | { kind: "false" }
  | { kind: "nottrue" }
  | { kind: "axiom"; formula: Expr }
  | { kind: "cut"; formula: Expr }
  | { kind: "noteq"; term: Expr }
  | { kind: "eqsym"; left: Expr; right: Expr }
  | { kind: "notnot"; formula: Expr }
  | { kind: "connect" | "notconnect"; connective: Connective; left: Expr; right: Expr }
  // The quantified formula, and the witness or the term that instantiates it.
  | { kind: "ex" | "all" | "notex" | "notall"; quantified: Expr; term: Expr }
  | { kind: "pnotp"; positive: Expr; negative: Expr }
  | { kind: "notequal"; left: Expr; right: Expr }
  | { kind: "congruencelr" | "congruencerl"; context: Expr; left: Expr; right: Expr }
  | {
      kind: "definition";
      name: string;
      folded: Expr;
      unfolded: Expr;
    }
  | { kind: "extension"; name: string; args: Expr[]; conclusions: Expr[]; branches: Expr[][] }
  | { kind: "lemma"; name: string; args: Expr[] };

export interface LlProof {
  conclusions: Expr[];
  rule: LlRule;
  subproofs: LlProof[];
}

// A lemma's parameters pair each free tau or metavariable with its type.
export interface Lemma {
  name: string;
  params: [string, Expr][];
  proof: LlProof;
}

export const connect = (exprs: Expressions, connective: Connective, left: Expr, right: Expr) =>
  connective === "and"
    ? exprs.eand(left, right)
    : connective === "or"
      ? exprs.eor(left, right)
      : connective === "imply"
        ? exprs.eimply(left, right)
        : exprs.eequiv(left, right);

export const getLemma = (lemmas: Map<string, Lemma>, name: string) => {
  const lemma = lemmas.get(name);
  if (lemma === undefined) throw new TlaZenonError(`Zenon: no lemma ${name}`);
  return lemma;
};

const makeLeaf = (conclusions: Expr[], rule: LlRule): LlProof => ({
  conclusions,
  rule,
  subproofs: [],
});

// Zenon's direct_close: a node that closes the conclusions at once, if one does.
const getDirectClose = (exprs: Expressions, conclusions: Expr[]): LlProof | undefined => {
  for (const [position, formula] of conclusions.entries()) {
    const rest = conclusions.slice(position + 1);
    if (formula.kind === "false") return makeLeaf([formula], { kind: "false" });
    if (formula.kind === "not") {
      const operand = formula.args[0];
      if (operand.kind === "true") return makeLeaf([formula], { kind: "nottrue" });
      if (
        operand.kind === "app" &&
        operand.symbol === "=" &&
        operand.args.length === 2 &&
        operand.args[0] === operand.args[1]
      )
        return makeLeaf([formula], { kind: "noteq", term: operand.args[0] });
      if (rest.includes(operand))
        return makeLeaf([formula, operand], { kind: "axiom", formula: operand });
      continue;
    }
    const negation = exprs.enot(formula);
    if (rest.includes(negation)) return makeLeaf([formula, negation], { kind: "axiom", formula });
  }
  return undefined;
};

// The formulas that a rule takes from its conclusions.
const getEliminated = (exprs: Expressions, lemmas: Map<string, Lemma>, rule: LlRule): Expr[] => {
  const equal = (left: Expr, right: Expr) => exprs.eapp("=", [left, right]);
  switch (rule.kind) {
    case "false":
      return [FALSE];
    case "nottrue":
      return [exprs.enot(TRUE)];
    case "axiom":
      return [rule.formula, exprs.enot(rule.formula)];
    case "cut":
      return [];
    case "noteq":
      return [exprs.enot(equal(rule.term, rule.term))];
    case "eqsym":
      return [equal(rule.left, rule.right), exprs.enot(equal(rule.right, rule.left))];
    case "notnot":
      return [exprs.enot(exprs.enot(rule.formula))];
    case "connect":
      return [connect(exprs, rule.connective, rule.left, rule.right)];
    case "notconnect":
      return [exprs.enot(connect(exprs, rule.connective, rule.left, rule.right))];
    case "ex":
    case "all":
      return [rule.quantified];
    case "notex":
    case "notall":
      return [exprs.enot(rule.quantified)];
    case "pnotp":
      return [rule.positive, rule.negative];
    case "notequal":
      return [exprs.enot(equal(rule.left, rule.right))];
    case "congruencelr":
      return [exprs.apply(rule.context, rule.left), equal(rule.left, rule.right)];
    case "congruencerl":
      return [exprs.apply(rule.context, rule.left), equal(rule.right, rule.left)];
    case "definition":
      return [rule.folded];
    case "extension":
      return rule.conclusions;
    case "lemma":
      return getLemma(lemmas, rule.name).proof.conclusions;
  }
};

// Zenon's Llproof.optimise: drops the conclusions that no rule uses and the nodes whose subproof
// already proves their conclusions.
export const optimise = (exprs: Expressions, proof: Lemma[]): Lemma[] => {
  const lemmas = new Map<string, Lemma>();
  const optimiseTree = (tree: LlProof): LlProof => {
    const subproofs = tree.subproofs.map(optimiseTree);
    const closed = getDirectClose(exprs, tree.conclusions);
    if (closed !== undefined) return closed;
    const useful = new Set([
      ...getEliminated(exprs, lemmas, tree.rule),
      ...subproofs.flatMap((subproof) => subproof.conclusions),
    ]);
    const conclusions = tree.conclusions.filter((formula) => useful.has(formula));
    const subsuming = subproofs.find((subproof) =>
      subproof.conclusions.every((formula) => conclusions.includes(formula)),
    );
    if (subsuming !== undefined) return subsuming;
    return {
      conclusions,
      rule:
        tree.rule.kind === "lemma"
          ? {
              kind: "lemma",
              name: tree.rule.name,
              args: getLemma(lemmas, tree.rule.name).params.map((param) => param[1]),
            }
          : tree.rule,
      subproofs,
    };
  };
  return proof.map((lemma) => {
    const optimised = { ...lemma, proof: optimiseTree(lemma.proof) };
    lemmas.set(optimised.name, optimised);
    return optimised;
  });
};
