import { SmtTacticError } from "../../../errors";
import { type AstManager, OP_AND, OP_ARRAY_MAP, OP_DISTINCT, OP_EQ, OP_OR, SORT_BOOL } from "./ast";
import { forEachExpr, isAssociativeOp } from "./ast-util";
import { isCommutativeDecl } from "./euf/egraph";
import type { Goal } from "./goal";
import { getIdentityHash, ObjMap } from "./hashtable";
import { RewriterTpl } from "./rewriter-tpl";
import { SubstReplacer } from "./solve-eqs";

const isAcDecl = (manager: AstManager, decl: number): boolean => {
  const funcDecl = manager.funcDecls[decl];
  return funcDecl.op === OP_ARRAY_MAP
    ? isAcDecl(manager, funcDecl.parameters[0])
    : isAssociativeOp(funcDecl.op) && isCommutativeDecl(manager, decl);
};

class AcRewriter extends RewriterTpl {
  isRewritingPatterns() {
    return false;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (isAcDecl(manager, decl) || manager.funcDecls[decl].op === OP_DISTINCT) {
      const sorted = [...args].sort((first, second) => manager.ids[first] - manager.ids[second]);
      if (sorted.every((arg, index) => arg === args[index])) return -1;
      const result = manager.mkApp(decl, sorted, sort);
      manager.incRef(result);
      return result;
    }
    if (
      args.length !== 2 ||
      !isCommutativeDecl(manager, decl) ||
      manager.ids[args[0]] <= manager.ids[args[1]]
    )
      return -1;
    const result = manager.mkApp(decl, [args[1], args[0]], sort);
    manager.incRef(result);
    return result;
  }
}

const mergeColors = (colors: ObjMap<number>, merged: ObjMap<number>) => {
  const recolor = new Map<string, number>();
  for (const [term, color] of merged) {
    const pair = `${color} ${colors.get(term)}`;
    const recolored = recolor.get(pair) ?? recolor.size;
    merged.replace(term, recolored);
    recolor.set(pair, recolored);
  }
};

const computeUsedIn = (manager: AstManager, term: number, cts: number[], consts: number[]) => {
  forEachExpr(manager, term, (expr) => {
    if (consts.includes(expr) && !cts.includes(expr)) cts.push(expr);
  });
};

const computeCtsDelta = (manager: AstManager, term: number, cts: number[], consts: number[]) => {
  const size = cts.length;
  if (size === consts.length) return 0;
  computeUsedIn(manager, term, cts, consts);
  const delta = cts.length - size;
  cts.length = size;
  return delta;
};

// Z3's cleanup does nothing, so both rewriters keep their caches while the tactic lives.
class SymmetryReducer {
  private rewriter: AcRewriter;
  private substitution = new ObjMap<number>(getIdentityHash);
  private replacer: SubstReplacer;

  constructor(private manager: AstManager) {
    this.rewriter = new AcRewriter(manager);
    this.replacer = new SubstReplacer(manager, this.substitution);
  }

  run(goal: Goal) {
    const manager = this.manager;
    if (goal.isInconsistent) return;
    const formula = manager.mkApp(OP_AND, goal.forms.items, SORT_BOOL);
    manager.incRef(formula);
    let normalized = this.normalize(formula);
    const occs = this.computeOccurrences(normalized);
    for (const consts of this.findCandidatePermutations(normalized, occs)) {
      if (!this.isInvariantByPermutations(normalized, consts)) continue;
      const cts: number[] = [];
      const terms = this.selectTerms(normalized, consts);
      while (terms.length > 0 && cts.length < consts.length) {
        const term = this.selectMostPromisingTerm(terms, cts, consts, occs);
        terms.splice(terms.indexOf(term), 1);
        computeUsedIn(manager, term, cts, consts);
        const constant = consts.find((candidate) => !cts.includes(candidate));
        if (constant === undefined) break;
        cts.push(constant);
        const member = manager.mkOr(cts.map((element) => manager.mkEq(term, element)));
        manager.incRef(member);
        goal.assert(member);
        const conjunction = manager.mkApp(OP_AND, [normalized, member], SORT_BOOL);
        manager.incRef(conjunction);
        manager.decRef(normalized);
        normalized = this.normalize(conjunction);
        manager.decRef(member);
      }
    }
    manager.decRef(normalized);
  }

  release() {
    this.replacer.release();
    this.rewriter.release();
  }

  private findCandidatePermutations(formula: number, occs: ObjMap<number>) {
    const manager = this.manager;
    const coloring = this.computeSortColors(formula);
    mergeColors(occs, coloring);
    mergeColors(this.computeMaxDepth(formula), coloring);
    const invColor = new ObjMap<number[]>(getIdentityHash);
    for (const [term, color] of coloring) {
      if (!manager.isUninterpreted(term)) continue;
      const terms = invColor.get(color) ?? [];
      terms.push(term);
      invColor.set(color, terms);
    }
    const permutations: number[][] = [];
    for (const terms of invColor.values())
      if (
        terms.length >= 2 &&
        (occs.get(terms[0]) ?? 0) >= 2 &&
        terms.every((term) => manager.getNumArgs(term) === 0)
      )
        permutations.push(terms);
    return permutations;
  }

  private computeSortColors(formula: number) {
    const manager = this.manager;
    const colors = new ObjMap<number>((expr) => manager.hashes[expr]);
    const sortIds = new Map<number, number>();
    forEachExpr(manager, formula, (expr) => {
      const sort = manager.sorts[expr];
      const id = sortIds.get(sort) ?? sortIds.size;
      sortIds.set(sort, id);
      colors.set(expr, id);
    });
    return colors;
  }

  private computeMaxDepth(formula: number) {
    const manager = this.manager;
    const depths = new ObjMap<number>((expr) => manager.hashes[expr]);
    const todo = [formula];
    const todoDepths = [0];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      const depth = todoDepths.pop() ?? 0;
      const known = depths.get(expr);
      if (known !== undefined && depth <= known) continue;
      depths.set(expr, depth);
      for (const arg of manager.getArgs(expr)) {
        todo.push(arg);
        todoDepths.push(depth + 1);
      }
    }
    return depths;
  }

  private isInvariantByPermutations(formula: number, consts: number[]) {
    return this.checkSwap(formula, consts[0], consts[1]) && this.checkCycle(formula, consts);
  }

  private checkSwap(formula: number, first: number, second: number) {
    this.substitution.clear();
    this.substitution.set(first, second);
    this.substitution.set(second, first);
    this.replacer.cleanup();
    return this.checkSubstitution(formula);
  }

  private checkCycle(formula: number, consts: number[]) {
    this.substitution.clear();
    for (let index = 0; index < consts.length; index++)
      this.substitution.set(consts[index], consts[(index + 1) % consts.length]);
    this.replacer.cleanup();
    return this.checkSubstitution(formula);
  }

  private checkSubstitution(formula: number) {
    const normalized = this.normalize(this.replacer.rewrite(formula));
    this.manager.decRef(normalized);
    return normalized === formula;
  }

  private normalize(expr: number) {
    const result = this.rewriter.rewrite(expr);
    this.manager.decRef(expr);
    return result;
  }

  private selectTerms(formula: number, consts: number[]) {
    const manager = this.manager;
    const terms: number[] = [];
    const todo = [formula];
    for (let form = todo.pop(); form !== undefined; form = todo.pop()) {
      if (manager.getOp(form) === OP_AND) {
        todo.push(...manager.getArgs(form));
        continue;
      }
      const term = this.getRangeRestriction(form, consts);
      if (term !== -1) terms.push(term);
    }
    return terms;
  }

  private getRangeRestriction(form: number, consts: number[]) {
    const manager = this.manager;
    if (manager.getOp(form) !== OP_OR) return -1;
    let term = -1;
    for (const arg of manager.getArgs(form)) {
      if (manager.getOp(arg) !== OP_EQ) return -1;
      const left = manager.getArg(arg, 0);
      const right = manager.getArg(arg, 1);
      if (consts.includes(left) && (term === -1 || term === right)) term = right;
      else if (consts.includes(right) && (term === -1 || term === left)) term = left;
      else return -1;
    }
    return term;
  }

  private computeOccurrences(formula: number) {
    const manager = this.manager;
    const occs = new ObjMap<number>((expr) => manager.hashes[expr]);
    forEachExpr(manager, formula, (expr) => {
      occs.set(expr, occs.get(expr) ?? 0);
      for (const arg of manager.getArgs(expr)) occs.set(arg, (occs.get(arg) ?? 0) + 1);
    });
    return occs;
  }

  private selectMostPromisingTerm(
    terms: number[],
    cts: number[],
    consts: number[],
    occs: ObjMap<number>,
  ) {
    const manager = this.manager;
    let term = terms[0];
    let weight = occs.get(term) ?? 0;
    let ctsDelta = computeCtsDelta(manager, term, cts, consts);
    for (const other of terms.slice(1)) {
      const otherWeight = occs.get(other) ?? 0;
      const numArgs = manager.getNumArgs(term);
      const otherNumArgs = manager.getNumArgs(other);
      if (otherWeight < weight && numArgs <= otherNumArgs) continue;
      const otherCtsDelta = computeCtsDelta(manager, other, cts, consts);
      if (
        (numArgs === otherNumArgs && (otherWeight > weight || otherCtsDelta < ctsDelta)) ||
        numArgs > otherNumArgs
      ) {
        ctsDelta = otherCtsDelta;
        weight = otherWeight;
        term = other;
      }
    }
    return term;
  }
}

export const createSymmetryReduce = (manager: AstManager) => {
  const reducer = new SymmetryReducer(manager);
  return {
    run: (goal: Goal) => {
      if (goal.isProofsEnabled)
        throw new SmtTacticError("symmetry_reduce does not support proof production");
      if (goal.isCoresEnabled)
        throw new SmtTacticError("symmetry_reduce does not support unsat core production");
      if (goal.forms.items.some((form) => manager.hasQuantifierFlags[form]))
        throw new SmtTacticError("symmetry_reduce does not apply to quantified goals");
      reducer.run(goal);
      goal.depth++;
    },
    release: () => reducer.release(),
  };
};
