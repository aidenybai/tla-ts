// Ported from Z3 (src/sat/smt/q_model_fixer.h, src/sat/smt/q_model_fixer.cpp,
// src/model/arith_value_order.h, src/ast/macros/quantifier_macro_info.cpp), MIT license, see
// z3-license.txt.
import { SmtInvariantError } from "../../../../errors";
import {
  type AstManager,
  OP_ITE,
  OP_LT,
  OP_NOT,
  OP_ULEQ,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "../ast";
import { mkBvApp } from "../bv-decl-plugin";
import { ObjHashtable } from "../hashtable";
import {
  type CondMacro,
  collectMacroCandidates,
  releaseCondMacros,
  solveMacros,
} from "../model-macro-solver";
import { FuncInterp, type ProtoModel } from "../proto-model";
import { RefVector } from "../ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "../rewriter";
import type { EufSolver } from "./euf-solver";
import type { QSolver } from "./q-solver";

// subterms::ground: the subterms of an expression, outside quantifier bodies.
export const getSubterms = (manager: AstManager, expr: number) => {
  const subterms: number[] = [];
  const stack = [expr];
  const visited = new Set<number>();
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    subterms.push(current);
    visited.add(current);
    if (manager.isApp(current)) stack.push(...manager.getArgs(current));
    while (stack.length > 0 && visited.has(stack[stack.length - 1])) stack.pop();
  }
  return subterms;
};

export const isUninterpretedApp = (manager: AstManager, expr: number) =>
  manager.isApp(expr) && manager.isUninterpreted(expr);

// The quantifier_macro_info of a flattened quantifier, with the macro candidates of its body.
interface MacroInfo {
  readonly condMacros: CondMacro[];
  readonly ngDecls: Set<number>;
  readonly isAuf: boolean;
  readonly flatQ: number;
  theOne: number | null;
}

// projection_function: the order of the values of a sort, and its strict comparison.
interface ProjectionFunction {
  readonly isLess: (first: number, second: number) => boolean;
  readonly mkLt: (first: number, second: number) => number;
}

// projection_meta_data: the sorted values an argument of a function has, and a term of each.
interface ProjectionData {
  readonly values: RefVector;
  readonly value2Term: Map<number, number>;
}

const getProjectionTerm = (data: ProjectionData, value: number) => {
  const term = data.value2Term.get(value);
  if (term === undefined) throw new SmtInvariantError("a projection value has a term");
  return term;
};

const isArithValueSupported = (manager: AstManager, expr: number) =>
  manager.isNumeral(expr) || manager.isAlgebraicNumeral(expr);

const isArithValueLess = (manager: AstManager, first: number, second: number) =>
  first !== second && manager.compareArithValues(first, second) < 0;

export class ModelFixer {
  private readonly manager: AstManager;
  private q2info = new Map<number, MacroInfo>();
  private readonly macroRewriter: Rewriter;
  private projectionData = new Map<string, ProjectionData>();

  constructor(
    private readonly ctx: EufSolver,
    private readonly qs: QSolver,
  ) {
    this.manager = ctx.manager;
    this.macroRewriter = new Rewriter(ctx.manager, TACTIC_REWRITER_OPTIONS);
  }

  // operator(): macros for the universal quantifiers, then an else for every partial function.
  fix(model: ProtoModel) {
    const manager = this.manager;
    const univ = this.qs.universal.map((lit) => this.ctx.boolVar2expr(lit >> 1) as number);
    if (univ.length === 0) return;
    this.resetProjectionData();
    const qs = solveMacros(manager, model, univ, (quantifier) => this.getInfo(quantifier));
    this.addProjectionFunctions(model, qs);
    const decls = model.getFuncDecls();
    for (let index = decls.length; index-- > 0;) {
      const decl = decls[index];
      const interp = model.funcInterps.get(decl);
      if (interp === undefined) continue;
      const maxOcc = interp.isPartial() ? interp.getMaxOccResult() : null;
      if (maxOcc !== null) interp.setElse(maxOcc);
      if (interp.isPartial()) interp.setElse(model.getSomeValue(manager.funcDecls[decl].range));
    }
  }

  private resetProjectionData() {
    for (const data of this.projectionData.values()) data.values.reset();
    this.projectionData.clear();
  }

  private getInfo(quantifier: number) {
    const existing = this.q2info.get(quantifier);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const flatQ = this.qs.flatten(quantifier);
    const info: MacroInfo = {
      condMacros: collectMacroCandidates(manager, this.macroRewriter, flatQ),
      ngDecls: new Set(),
      isAuf: true,
      flatQ,
      theOne: null,
    };
    this.q2info.set(quantifier, info);
    this.ctx.trail.push(() => {
      this.q2info.delete(quantifier);
      releaseCondMacros(manager, info.condMacros);
    });
    return info;
  }

  private addProjectionFunctions(model: ProtoModel, qs: readonly number[]) {
    const manager = this.manager;
    const decls = new ObjHashtable((decl) => manager.getDeclHash(decl));
    for (const quantifier of qs) {
      const body = manager.getQuantifier(this.getInfo(quantifier).flatQ).body;
      for (const subterm of getSubterms(manager, body))
        if (isUninterpretedApp(manager, subterm) && !manager.isGroundApp(subterm))
          decls.add(manager.decls[subterm]);
    }
    for (const decl of decls) this.addProjectionFunctionsOf(model, decl);
  }

  // f becomes f_aux(p_1(x_1), ..., p_n(x_n)), for f_aux the old interpretation of f and p_i the
  // projection of its i'th argument onto the values that argument has in the e-graph.
  private addProjectionFunctionsOf(model: ProtoModel, decl: number) {
    const manager = this.manager;
    const interp = model.funcInterps.get(decl);
    if (interp === undefined || interp.isConstant()) return;
    const info = manager.funcDecls[decl];
    const args = new RefVector(manager);
    info.domain.forEach((_sort, index) =>
      args.push(this.addProjectionFunction(model, decl, index)),
    );
    if (interp.isPartial() && interp.entries.length > 0) {
      const index = this.ctx.s.rand.next() % interp.entries.length;
      interp.setElse(interp.entries[index].result);
      interp.delEntry(index);
    }
    if (args.items.every((arg) => manager.isVar(arg))) {
      args.reset();
      return;
    }
    const auxDecl = manager.mkFreshFuncDecl(info.name, info.domain, info.range, true, "aux");
    const projected = new FuncInterp(manager, info.domain.length);
    projected.setElse(manager.mkApp(auxDecl, args.items, info.range));
    args.reset();
    model.updateFuncInterp(decl, projected);
    model.registerFunc(auxDecl, interp);
  }

  // p(x) := if x < v_2 then v_1 else if x < v_3 then v_2 ... else v_n, for the sorted values v_i
  // of the idx'th arguments of the applications of f.
  private addProjectionFunction(model: ProtoModel, decl: number, index: number) {
    const manager = this.manager;
    const sort = manager.funcDecls[decl].domain[index];
    const variable = manager.mkVar(index, sort);
    const projection = this.getProjection(sort);
    if (projection === undefined) return variable;
    const values = new RefVector(manager);
    const value2Term = new Map<number, number>();
    for (const node of this.ctx.egraph.enodesOf(decl)) {
      const term = node.getArg(index).owner;
      values.pushOwned(model.eval(term, false));
      const value = values.items[values.size - 1];
      if (!manager.isValue(value)) {
        values.reset();
        return variable;
      }
      value2Term.set(value, term);
    }
    if (values.size === 0) return variable;
    const isArith = sort === SORT_INT || sort === SORT_REAL;
    if (isArith && !values.items.every((value) => isArithValueSupported(manager, value))) {
      values.reset();
      return variable;
    }
    const sorted = values.items.toSorted((first, second) =>
      projection.isLess(first, second) ? -1 : projection.isLess(second, first) ? 1 : 0,
    );
    const unique = new RefVector(manager);
    sorted.forEach((value, position) => {
      if (position === 0 || sorted[position - 1] !== value) unique.push(value);
    });
    values.reset();
    this.projectionData.set(`${decl}:${index}`, { values: unique, value2Term });
    const bound = manager.mkVar(0, sort);
    let projected = unique.items[unique.size - 1];
    for (let position = unique.size - 1; position >= 1; position--)
      projected = manager.mkApp(
        OP_ITE,
        [projection.mkLt(bound, unique.items[position]), unique.items[position - 1], projected],
        sort,
      );
    const interp = new FuncInterp(manager, 1);
    interp.setElse(projected);
    const projectionDecl = manager.mkFreshFuncDecl(null, [sort], sort);
    model.registerFunc(projectionDecl, interp);
    return manager.mkApp(projectionDecl, [variable], sort);
  }

  private getProjection(sort: number): ProjectionFunction | undefined {
    const manager = this.manager;
    if (sort === SORT_INT || sort === SORT_REAL)
      return {
        isLess: (first, second) => isArithValueLess(manager, first, second),
        mkLt: (first, second) => manager.mkApp(OP_LT, [first, second], SORT_BOOL),
      };
    if (!manager.isBvSort(sort)) return undefined;
    return {
      isLess: (first, second) =>
        manager.isBvNumeral(first) && manager.isBvNumeral(second)
          ? manager.getBvNumeralValue(first) < manager.getBvNumeralValue(second)
          : first < second,
      mkLt: (first, second) =>
        manager.mkApp(OP_NOT, [mkBvApp(manager, OP_ULEQ, [second, first])], SORT_BOOL),
    };
  }

  // invert_app: the root of the class whose value t has.
  invertApp(value: number) {
    return this.ctx.values2root().get(value)?.owner ?? value;
  }

  // invert_arg: bounds t_j <= arg < t_{j+1} on the i'th argument of t, for the terms whose values
  // v_j <= value < v_{j+1} surround the argument's value.
  invertArg(term: number, index: number, value: number, lits: RefVector) {
    const manager = this.manager;
    const decl = manager.decls[term];
    const data = this.projectionData.get(`${decl}:${index}`);
    if (data === undefined) return;
    const sort = manager.funcDecls[decl].domain[index];
    const projection = this.getProjection(sort);
    if (projection === undefined) return;
    const values = data.values.items;
    if (values.length <= 1) return;
    const arg = manager.getArg(term, index);
    const valueSort = manager.sorts[value];
    if (
      (valueSort === SORT_INT || valueSort === SORT_REAL) &&
      !isArithValueSupported(manager, value)
    ) {
      lits.push(manager.mkEq(arg, value));
      return;
    }
    const getTerm = (position: number) => getProjectionTerm(data, values[position]);
    const mkLe = (first: number, second: number) =>
      manager.mkApp(OP_NOT, [projection.mkLt(second, first)], SORT_BOOL);
    if (projection.isLess(value, values[1])) {
      lits.push(projection.mkLt(arg, getTerm(1)));
      return;
    }
    for (let position = 2; position < values.length; position++)
      if (projection.isLess(value, values[position])) {
        lits.push(mkLe(getTerm(position - 1), arg));
        lits.push(projection.mkLt(arg, getTerm(position)));
        return;
      }
    lits.push(mkLe(getTerm(values.length - 1), arg));
  }

  // restrict_arg: the i'th argument of t is one of the terms of the ground applications of its
  // function.
  restrictArg(term: number, index: number) {
    const manager = this.manager;
    const data = this.projectionData.get(`${manager.decls[term]}:${index}`);
    if (data === undefined) return manager.trueExpr;
    const arg = manager.getArg(term, index);
    return manager.mkOr(
      data.values.items.map((value) => manager.mkEq(arg, getProjectionTerm(data, value))),
    );
  }
}
