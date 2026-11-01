// Ported from Z3 (src/model/model_macro_solver.cpp, src/ast/macros/macro_util.cpp,
// src/ast/func_decl_dependencies.cpp), MIT license, see z3-license.txt. Collects the conditional
// macros of a quantifier, f(x) = def when cond, and satisfies quantifiers by taking such a def as the
// else case of the interpretation of f.
import {
  FAMILY_BASIC,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_NOT,
  OP_OR,
  SORT_BOOL,
  type AstManager,
} from "./ast";
import { FuncInterp, type ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import type { Rewriter } from "./rewriter";
import { replaceFreeVars } from "./var-subst";

// cond_macro: f(x_0, ..., x_n) = def whenever cond holds. A hint has no condition.
export interface CondMacro {
  decl: number;
  def: number;
  cond: number | null;
  isIneq: boolean;
  isSatisfyAtom: boolean;
  isHint: boolean;
  weight: number;
}

export interface QuantifierMacroInfo {
  readonly condMacros: CondMacro[];
  readonly ngDecls: Set<number>;
  readonly isAuf: boolean;
  theOne: number | null;
}

type GetInfo = (quantifier: number) => QuantifierMacroInfo;

const isUserApp = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_APP && manager.funcDecls[manager.decls[expr]].family === FAMILY_USER;

const isAtom = (manager: AstManager, expr: number) => {
  if (manager.kinds[expr] === KIND_QUANTIFIER || manager.sorts[expr] !== SORT_BOOL) return false;
  if (
    manager.kinds[expr] === KIND_VAR ||
    manager.funcDecls[manager.decls[expr]].family !== FAMILY_BASIC
  )
    return true;
  return (
    (manager.getOp(expr) === OP_EQ && !manager.isBool(manager.getArg(expr, 0))) ||
    manager.isTrue(expr) ||
    manager.isFalse(expr)
  );
};

const isLiteral = (manager: AstManager, expr: number) =>
  isAtom(manager, expr) || (manager.isNot(expr) && isAtom(manager, manager.getArg(expr, 0)));

const getPolyArgs = (manager: AstManager, expr: number) =>
  manager.getOp(expr) === OP_ADD ? manager.getArgs(expr) : [expr];

const isMacroHead = (manager: AstManager, expr: number, numDecls: number) => {
  if (!isUserApp(manager, expr) || manager.getNumArgs(expr) !== numDecls) return false;
  const seen = new Set<number>();
  for (let argIndex = 0; argIndex < manager.getNumArgs(expr); argIndex++) {
    const arg = manager.getArg(expr, argIndex);
    if (manager.kinds[arg] !== KIND_VAR) return false;
    const index = manager.values[arg];
    if (index >= numDecls || seen.has(index)) return false;
    seen.add(index);
  }
  return true;
};

const isQuasiMacroHead = (manager: AstManager, expr: number, numDecls: number) => {
  if (!isUserApp(manager, expr) || manager.getNumArgs(expr) < numDecls) return false;
  const found = new Set<number>();
  for (let argIndex = 0; argIndex < manager.getNumArgs(expr); argIndex++) {
    const arg = manager.getArg(expr, argIndex);
    if (manager.kinds[arg] === KIND_VAR) {
      const index = manager.values[arg];
      if (index >= numDecls) return false;
      found.add(index);
    } else if (manager.isOccurring(manager.decls[expr], arg)) return false;
  }
  return found.size === numDecls;
};

const getHintHeadVars = (manager: AstManager, expr: number) => {
  const vars: number[] = [];
  if (!isUserApp(manager, expr)) return vars;
  for (let index = 0; index < manager.getNumArgs(expr); index++) {
    const arg = manager.getArg(expr, index);
    if (manager.kinds[arg] === KIND_VAR) vars.push(arg);
  }
  return vars;
};

const isVarsOfSubset = (manager: AstManager, expr: number, vars: number[]) => {
  const visited = new Set<number>();
  const visit = (current: number): boolean => {
    if (manager.isGround(current) || visited.has(current)) return true;
    visited.add(current);
    const kind = manager.kinds[current];
    if (kind === KIND_VAR) return vars.includes(current);
    if (kind === KIND_QUANTIFIER) return false;
    return manager.everyArg(current, (arg) => visit(arg));
  };
  return visit(expr);
};

const isHintAtom = (manager: AstManager, lhs: number, rhs: number) => {
  const vars = getHintHeadVars(manager, lhs);
  return (
    vars.length > 0 &&
    !manager.isOccurring(manager.decls[lhs], rhs) &&
    isVarsOfSubset(manager, rhs, vars)
  );
};

const isPolyHint = (manager: AstManager, poly: number, head: number, exception: number | null) => {
  const vars = getHintHeadVars(manager, head);
  if (vars.length === 0) return false;
  const decl = manager.decls[head];
  return getPolyArgs(manager, poly).every(
    (arg) =>
      arg === exception || (!manager.isOccurring(decl, arg) && isVarsOfSubset(manager, arg, vars)),
  );
};

// quantifier_macro_info::collect_macro_candidates, with an empty forbidden set. Each candidate holds
// a reference to its definition and condition, which releaseCondMacros releases. Like macro_util,
// the expressions of each step live until the step returns. The rewriter does macro_util's Boolean
// and arithmetic rewriting, which keeps nothing between calls.
export const collectMacroCandidates = (
  manager: AstManager,
  rewriter: Rewriter,
  quantifier: number,
) => {
  const data = manager.getQuantifier(quantifier);
  // qa: an existential quantifier becomes a universal one of the negated body until the candidates
  // are collected.
  const qa = data.isForall
    ? quantifier
    : manager.withTemporaries(() =>
        manager.mkQuantifier({ ...data, isForall: true, body: manager.mkNot(data.body) }),
      );
  const candidates = manager.hasQuantifierFlags[manager.getQuantifier(qa).body]
    ? []
    : collectCandidates(manager, rewriter, qa);
  if (qa !== quantifier) manager.decRef(qa);
  return candidates;
};

// ~cond_macro, for each candidate in order.
export const releaseCondMacros = (manager: AstManager, candidates: CondMacro[]) => {
  for (const candidate of candidates) {
    if (candidate.cond !== null) manager.decRef(candidate.cond);
    manager.decRef(candidate.def);
  }
};

// macro_util::collect_macro_candidates.
const collectCandidates = (manager: AstManager, rewriter: Rewriter, quantifier: number) => {
  const data = manager.getQuantifier(quantifier);
  const body = data.body;
  const candidates: CondMacro[] = [];
  // The expressions of a step without a reference live until the step returns.
  const scope = (step: () => void) => manager.withTemporaries(step, () => []);
  const mkNot = (expr: number) => rewriter.mkAppCore(OP_NOT, [expr], SORT_BOOL);
  const mkAnd = (args: number[]) =>
    args.length === 0
      ? manager.trueExpr
      : args.length === 1
        ? args[0]
        : rewriter.mkAppCore(OP_AND, args, SORT_BOOL);
  const mkSub = (first: number, second: number) => rewriter.mkSub(first, second);
  const mkAdd = (args: number[], sort: number) =>
    args.length === 0
      ? manager.mkNumeralOfSort(Rational.zero, sort)
      : args.length === 1
        ? args[0]
        : manager.mkApp(OP_ADD, args, sort);
  const isClause =
    isLiteral(manager, body) ||
    (manager.getOp(body) === OP_OR && manager.everyArg(body, (arg) => isLiteral(manager, arg)));
  const clause = isClause ? (manager.getOp(body) === OP_OR ? manager.getArgs(body) : [body]) : null;

  const isRestContainingDecl = (decl: number, exceptLiteral: number) =>
    clause !== null &&
    clause.some((literal) => literal !== exceptLiteral && manager.isOccurring(decl, literal));

  // get_rest_clause_as_cond: the condition comes with a reference, which the caller releases.
  const getRestClauseAsCond = (exceptLiteral: number) =>
    clause === null
      ? null
      : manager.withTemporaries(
          () => {
            const negated = clause
              .filter((literal) => literal !== exceptLiteral)
              .map((literal) => mkNot(literal));
            return negated.length === 0 ? null : mkAnd(negated);
          },
          (cond) => (cond === null ? [] : [cond]),
        );

  // A step with the rest of the clause as its condition, which it holds until it returns.
  const withRestClauseAsCond = (exceptLiteral: number, step: (cond: number | null) => void) => {
    const cond = getRestClauseAsCond(exceptLiteral);
    step(cond);
    if (cond !== null) manager.decRef(cond);
  };

  // normalize_expr: the variables of the head become (:var 0) ... (:var n-1) in order.
  const normalize = (head: number, expr: number) => {
    const mapping = new Map<number, number>();
    for (let index = 0; index < manager.getNumArgs(head); index++)
      mapping.set(manager.values[manager.getArg(head, index)], index);
    return [...mapping].every((entry) => entry[0] === entry[1])
      ? expr
      : replaceFreeVars(manager, expr, (variable, index, shift) => {
          const target = mapping.get(index);
          return target === undefined
            ? variable
            : manager.mkVar(target + shift, manager.sorts[variable]);
        });
  };

  // insert_macro: the candidate holds references to the normalized definition and condition.
  const insertMacro = (
    head: number,
    def: number,
    cond: number | null,
    isIneq: boolean,
    isHint: boolean,
  ) =>
    scope(() => {
      const normDef = normalize(head, def);
      const normCond = cond !== null ? normalize(head, cond) : isHint ? null : manager.trueExpr;
      manager.incRef(normDef);
      if (normCond !== null) manager.incRef(normCond);
      candidates.push({
        decl: manager.decls[head],
        def: normDef,
        cond: normCond,
        isIneq,
        isSatisfyAtom: true,
        isHint,
        weight: data.weight,
      });
    });

  // insert_quasi_macro: a head whose arguments are not distinct variables gets fresh variables,
  // and for a macro the equalities between them and the arguments join the condition. new_head,
  // extra_cond and new_cond hold references until it returns, and are released in the reverse
  // order of their declarations.
  const insertQuasiMacro = (
    head: number,
    numDecls: number,
    def: number,
    cond: number | null,
    isIneq: boolean,
    isHint: boolean,
  ) => {
    if (isMacroHead(manager, head, manager.getNumArgs(head))) {
      insertMacro(head, def, cond, isIneq, isHint);
      return;
    }
    // quasi_macro_head_to_macro_head and hint_to_macro_head: the condition comes before the head.
    const converted = manager.withTemporaries(
      () => {
        const seen = new Set<number>();
        const newArgs: number[] = [];
        const newConds: number[] = [];
        let nextVarIndex = numDecls;
        for (let index = 0; index < manager.getNumArgs(head); index++) {
          const arg = manager.getArg(head, index);
          if (manager.kinds[arg] === KIND_VAR && !seen.has(manager.values[arg])) {
            seen.add(manager.values[arg]);
            newArgs.push(arg);
            continue;
          }
          const newVar = manager.mkVar(nextVarIndex, manager.sorts[arg]);
          nextVarIndex++;
          newArgs.push(newVar);
          if (!isHint) newConds.push(manager.mkEq(newVar, arg));
        }
        const extraCond = isHint ? null : mkAnd(newConds);
        return {
          extraCond,
          newHead: manager.mkApp(manager.decls[head], newArgs, manager.sorts[head]),
        };
      },
      (result) =>
        result.extraCond === null ? [result.newHead] : [result.extraCond, result.newHead],
    );
    const extraCond = converted.extraCond;
    const newCond =
      extraCond === null
        ? null
        : cond === null
          ? extraCond
          : manager.withTemporaries(() => mkAnd([cond, extraCond]));
    if (newCond === extraCond && extraCond !== null) manager.incRef(extraCond);
    insertMacro(converted.newHead, def, newCond, isIneq, isHint);
    if (newCond !== null) manager.decRef(newCond);
    if (extraCond !== null) manager.decRef(extraCond);
    manager.decRef(converted.newHead);
  };

  const collectArith = (
    lhs: number,
    rhs: number,
    atom: number,
    numDecls: number,
    isIneq: boolean,
  ) => {
    if (manager.getOp(lhs) !== OP_ADD && manager.getOp(atom) === OP_EQ) return;
    const lhsArgs = getPolyArgs(manager, lhs);
    const tryHead = (head: number, monomial: number, isNegated: boolean) => {
      const decl = manager.decls[head];
      const isArithMacro =
        isQuasiMacroHead(manager, head, numDecls) &&
        !lhsArgs.some((arg) => arg !== monomial && manager.isOccurring(decl, arg)) &&
        !manager.isOccurring(decl, rhs) &&
        !isRestContainingDecl(decl, atom);
      const isHint = !isArithMacro && isPolyHint(manager, lhs, head, monomial);
      if (!isArithMacro && !isHint) return false;
      scope(() => {
        const rest = mkAdd(
          lhsArgs.filter((arg) => arg !== monomial),
          manager.sorts[lhs],
        );
        const def = isNegated ? mkSub(rest, rhs) : mkSub(rhs, rest);
        // A hint's right-hand side may contain variables that are not arguments of the head.
        if (isHint && !isPolyHint(manager, def, head, null)) return;
        // add_arith_macro_candidate.
        if (isHint) insertQuasiMacro(head, numDecls, def, null, isIneq, true);
        else
          withRestClauseAsCond(atom, (cond) =>
            insertQuasiMacro(head, numDecls, def, cond, isIneq, false),
          );
      });
      return true;
    };
    for (const arg of lhsArgs) {
      if (manager.kinds[arg] !== KIND_APP) continue;
      if (tryHead(arg, arg, false)) continue;
      const negated = manager.getTimesMinusOneArg(arg);
      if (negated !== undefined && manager.kinds[negated] === KIND_APP) tryHead(negated, arg, true);
    }
  };

  const collectCore = (atom: number, numDecls: number) => {
    const insertQuasi = (lhs: number, rhs: number) => {
      if (
        !isQuasiMacroHead(manager, lhs, numDecls) ||
        manager.isOccurring(manager.decls[lhs], rhs) ||
        isRestContainingDecl(manager.decls[lhs], atom)
      )
        return false;
      withRestClauseAsCond(atom, (cond) =>
        insertQuasiMacro(lhs, numDecls, rhs, cond, false, false),
      );
      return true;
    };
    const insertHint = (lhs: number, rhs: number) => {
      if (isHintAtom(manager, lhs, rhs)) insertQuasiMacro(lhs, numDecls, rhs, null, false, true);
    };
    const op = manager.getOp(atom);
    if (op === OP_EQ) {
      const lhs = manager.getArg(atom, 0);
      const rhs = manager.getArg(atom, 1);
      if (!insertQuasi(lhs, rhs)) insertHint(lhs, rhs);
      if (!insertQuasi(rhs, lhs)) insertHint(rhs, lhs);
    }
    if (op === OP_NOT) {
      const inner = manager.getArg(atom, 0);
      if (manager.getOp(inner) === OP_EQ && manager.isBool(manager.getArg(inner, 0)))
        scope(() => {
          const lhs = manager.getArg(inner, 0);
          const rhs = manager.getArg(inner, 1);
          const negatedLhs = manager.mkNot(lhs);
          const negatedRhs = manager.mkNot(rhs);
          if (!insertQuasi(lhs, negatedRhs)) insertHint(lhs, negatedRhs);
          if (!insertQuasi(rhs, negatedLhs)) insertHint(rhs, negatedLhs);
        });
    }
    if (op === OP_EQ || op === OP_LE || op === OP_GE) {
      const lhs = manager.getArg(atom, 0);
      const rhs = manager.getArg(atom, 1);
      collectArith(lhs, rhs, atom, numDecls, op !== OP_EQ);
      collectArith(rhs, lhs, atom, numDecls, op !== OP_EQ);
    }
  };

  for (const literal of clause ?? [body]) scope(() => collectCore(literal, data.sorts.length));
  return candidates;
};

const setElseInterp = (manager: AstManager, model: ProtoModel, decl: number, elseExpr: number) => {
  let interp = model.funcInterps.get(decl);
  if (interp === undefined) {
    interp = new FuncInterp(manager, manager.funcDecls[decl].domain.length);
    model.registerFunc(decl, interp);
  }
  interp.setElse(elseExpr);
};

type Process = (qs: number[], newQs: number[], residue: number[]) => boolean;

// base_macro_solver::operator(): runs the solver until it removes no more quantifiers, and leaves
// in qs the quantifiers of its last round.
const runMacroSolver = (qs: number[], residue: number[], process: Process) => {
  let current = qs;
  let next: number[] = [];
  while (process(current, next, residue)) {
    current = next;
    next = [];
  }
  return next;
};

// simple_macro_solver: a macro for f satisfies its quantifier when no other quantifier uses f.
const simpleMacroSolver =
  (manager: AstManager, model: ProtoModel, getInfo: GetInfo): Process =>
  (qs, newQs) => {
    let isRemoved = false;
    for (const quantifier of qs) {
      const info = getInfo(quantifier);
      const macro = info.condMacros.find(
        (candidate) =>
          candidate.isSatisfyAtom &&
          !qs.some((other) => other !== quantifier && getInfo(other).ngDecls.has(candidate.decl)),
      );
      if (macro === undefined) {
        newQs.push(quantifier);
        continue;
      }
      // The conditions of the macro can be ignored: the partial interpretation of f satisfies the
      // ground part, and MBQI adds instances when it does not satisfy the quantifier.
      info.theOne = macro.decl;
      setElseInterp(manager, model, macro.decl, macro.def);
      isRemoved = true;
    }
    return isRemoved;
  };

const GREEDY_MAX_DEPTH = 10;

// hint_macro_solver: searches greedily for a set of hints and macros, one per function symbol,
// that satisfies a set of quantifiers without cyclic definitions.
const hintMacroSolver =
  (manager: AstManager, model: ProtoModel, getInfo: GetInfo): Process =>
  (qs, newQs) => {
    const forbidden = new Set<number>();
    const isCandidate = (quantifier: number) =>
      getInfo(quantifier).condMacros.some(
        (macro) => macro.isSatisfyAtom && !forbidden.has(macro.decl),
      );
    let current = qs;
    let qcandidates: number[] = [];
    for (;;) {
      for (const quantifier of current) {
        if (isCandidate(quantifier)) qcandidates.push(quantifier);
        else {
          for (const decl of getInfo(quantifier).ngDecls) forbidden.add(decl);
          newQs.push(quantifier);
        }
      }
      if (current.length === qcandidates.length) break;
      current = qcandidates;
      qcandidates = [];
    }
    if (qcandidates.length === 0) return false;
    const qF = new Map<number, Set<number>>();
    const qFDef = new Map<number, Map<number, Set<number>>>();
    const candidateDecls = new Set<number>();
    for (const quantifier of qcandidates) {
      const info = getInfo(quantifier);
      for (const decl of info.ngDecls) {
        if (forbidden.has(decl)) continue;
        const set = qF.get(decl) ?? new Set<number>();
        qF.set(decl, set);
        set.add(quantifier);
      }
      for (const macro of info.condMacros) {
        if (!macro.isSatisfyAtom || forbidden.has(macro.decl)) continue;
        const defs = qFDef.get(macro.decl) ?? new Map<number, Set<number>>();
        qFDef.set(macro.decl, defs);
        const set = defs.get(macro.def) ?? new Set<number>();
        defs.set(macro.def, set);
        set.add(quantifier);
        candidateDecls.add(macro.decl);
      }
    }
    const satisfied = new Set<number>();
    const residue = new Set<number>();
    const fs = new Map<number, number>();

    const isCyclic = () => {
      const acyclic = new Set<number>();
      const isAcyclic = (def: number) => {
        const visited = new Set<number>();
        const visit = (current: number): boolean => {
          if (visited.has(current)) return true;
          visited.add(current);
          const kind = manager.kinds[current];
          if (kind === KIND_VAR) return true;
          if (kind === KIND_QUANTIFIER) return visit(manager.getQuantifier(current).body);
          const decl = manager.decls[current];
          if (fs.has(decl) && !acyclic.has(decl)) return false;
          return manager.everyArg(current, (arg) => visit(arg));
        };
        return visit(def);
      };
      for (;;) {
        const size = acyclic.size;
        if (size === fs.size) return false;
        for (const entry of fs)
          if (!acyclic.has(entry[0]) && isAcyclic(entry[1])) acyclic.add(entry[0]);
        if (size === acyclic.size) return true;
      }
    };

    const greedy = (depth: number): boolean => {
      if (residue.size === 0) return !isCyclic();
      const candidates = new Set<number>();
      for (const quantifier of residue)
        for (const macro of getInfo(quantifier).condMacros)
          if (macro.isSatisfyAtom && !forbidden.has(macro.decl) && !fs.has(macro.decl))
            candidates.add(macro.decl);
      for (const decl of candidates) if (greedyOn(decl, depth)) return true;
      return false;
    };

    const greedyOn = (decl: number, depth: number): boolean => {
      if (depth >= GREEDY_MAX_DEPTH) return false;
      for (const entry of qFDef.get(decl) ?? []) {
        const savedSatisfied = [...satisfied];
        const savedResidue = [...residue];
        fs.set(decl, entry[0]);
        // update_satisfied_residue.
        let isUseful = false;
        for (const quantifier of entry[1]) {
          if (satisfied.has(quantifier)) continue;
          isUseful = true;
          residue.delete(quantifier);
          satisfied.add(quantifier);
          getInfo(quantifier).theOne = decl;
        }
        if (isUseful) {
          for (const quantifier of qF.get(decl) ?? [])
            if (!satisfied.has(quantifier)) residue.add(quantifier);
          if (greedy(depth + 1)) return true;
        }
        for (const quantifier of satisfied)
          if (!savedSatisfied.includes(quantifier)) getInfo(quantifier).theOne = null;
        satisfied.clear();
        for (const quantifier of savedSatisfied) satisfied.add(quantifier);
        residue.clear();
        for (const quantifier of savedResidue) residue.add(quantifier);
        fs.delete(decl);
      }
      return false;
    };

    for (const decl of candidateDecls) {
      if (!greedyOn(decl, 0)) continue;
      for (const entry of fs) setElseInterp(manager, model, entry[0], entry[1]);
      for (const quantifier of qcandidates) if (!satisfied.has(quantifier)) newQs.push(quantifier);
      return true;
    }
    newQs.push(...qcandidates);
    return false;
  };

// collect_func_decls with ng_only: the uninterpreted functions applied in non-ground terms.
const collectNgFuncDecls = (manager: AstManager, expr: number) => {
  const decls = new Set<number>();
  const visited = new Set<number>();
  const visit = (current: number) => {
    if (visited.has(current)) return;
    visited.add(current);
    const kind = manager.kinds[current];
    if (kind === KIND_VAR) return;
    if (kind === KIND_QUANTIFIER) return;
    for (let index = 0; index < manager.getNumArgs(current); index++) {
      const arg = manager.getArg(current, index);
      visit(arg);
    }
    if (
      manager.getNumArgs(current) > 0 &&
      !manager.isGround(current) &&
      isUserApp(manager, current)
    )
      decls.add(manager.decls[current]);
  };
  visit(expr);
  return decls;
};

// non_auf_macro_solver: satisfies quantifiers outside the AUF fragment with their macros, even when
// other quantifiers use the defined symbol.
const nonAufMacroSolver =
  (
    manager: AstManager,
    model: ProtoModel,
    getInfo: GetInfo,
    dependencies: Map<number, Set<number>>,
    forceTemplate: number,
  ): Process =>
  (qs, newQs, residue) => {
    // func_decl_dependencies::insert: fails when f has a definition or the new one is cyclic.
    const addMacro = (decl: number, elseExpr: number) => {
      if (dependencies.has(decl)) return false;
      dependencies.set(decl, collectNgFuncDecls(manager, elseExpr));
      const colors = new Map<number, "progress" | "closed">();
      const isCycle = (current: number): boolean => {
        const color = colors.get(current);
        if (color === "closed") return false;
        if (color === "progress") return true;
        colors.set(current, "progress");
        for (const child of dependencies.get(current) ?? []) if (isCycle(child)) return true;
        colors.set(current, "closed");
        return false;
      };
      if (isCycle(decl)) {
        dependencies.delete(decl);
        return false;
      }
      setElseInterp(manager, model, decl, elseExpr);
      return true;
    };
    const isBetterMacro = (first: CondMacro, second: CondMacro | null) => {
      if (second === null || !first.isHint) return true;
      if (!second.isHint) return false;
      return manager.isGround(first.def) && !manager.isGround(second.def);
    };
    const getMacroFor = (decl: number, quantifier: number) => {
      let result: CondMacro | null = null;
      for (const macro of getInfo(quantifier).condMacros)
        if (macro.decl === decl && !macro.isHint && isBetterMacro(macro, result)) result = macro;
      return result;
    };
    const isUnconditional = (macro: CondMacro) => macro.cond === null || manager.isTrue(macro.cond);

    const fullMacros = new Map<number, { macro: CondMacro; quantifier: number }>();
    const condMacros = new Set<number>();
    for (const quantifier of qs) {
      const info = getInfo(quantifier);
      for (const macro of info.condMacros) {
        if (macro.isHint) continue;
        if (isUnconditional(macro) && (!info.isAuf || macro.weight >= forceTemplate)) {
          fullMacros.set(macro.decl, { macro, quantifier });
          condMacros.delete(macro.decl);
        } else if (!fullMacros.has(macro.decl) && !info.isAuf) condMacros.add(macro.decl);
      }
    }
    const removed = new Set<number>();
    for (const entry of fullMacros)
      if (addMacro(entry[0], entry[1].macro.def)) {
        getInfo(entry[1].quantifier).theOne = entry[0];
        removed.add(entry[1].quantifier);
      }
    for (const decl of condMacros) {
      let elseExpr: number | null = null;
      const toRemove: number[] = [];
      let isFullMacro = false;
      for (const quantifier of qs) {
        if (removed.has(quantifier)) continue;
        const macro = getMacroFor(decl, quantifier);
        if (macro === null) continue;
        if (isUnconditional(macro)) {
          isFullMacro = true;
          break;
        }
        toRemove.push(quantifier);
        elseExpr =
          elseExpr === null
            ? macro.def
            : manager.mkApp(
                OP_ITE,
                [macro.cond ?? manager.trueExpr, macro.def, elseExpr],
                manager.sorts[elseExpr],
              );
      }
      if (isFullMacro || elseExpr === null || !addMacro(decl, elseExpr)) continue;
      for (const quantifier of toRemove) {
        getInfo(quantifier).theOne = decl;
        removed.add(quantifier);
      }
    }
    for (const quantifier of qs) {
      if (removed.has(quantifier)) continue;
      newQs.push(quantifier);
      residue.push(quantifier);
    }
    return removed.size > 0;
  };

// The macro part of model_finder::fix_model: returns the quantifiers left for the AUF solver.
export const solveMacros = (
  manager: AstManager,
  model: ProtoModel,
  qs: number[],
  getInfo: GetInfo,
  forceTemplate: number,
) => {
  const residue: number[] = [];
  const afterSimple = runMacroSolver(qs, residue, simpleMacroSolver(manager, model, getInfo));
  const afterHint = runMacroSolver(afterSimple, residue, hintMacroSolver(manager, model, getInfo));
  const dependencies = new Map<number, Set<number>>();
  const afterNonAuf = runMacroSolver(
    afterHint,
    residue,
    nonAufMacroSolver(manager, model, getInfo, dependencies, forceTemplate),
  );
  return [...afterNonAuf, ...residue];
};
