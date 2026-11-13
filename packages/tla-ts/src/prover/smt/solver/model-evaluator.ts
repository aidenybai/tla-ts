// Ported from Z3 (src/model/model_evaluator.cpp), MIT license, see z3-license.txt.
import { mkArrayApp } from "./array-decl-plugin";
import {
  FAMILY_ARITH,
  FAMILY_LABEL,
  FAMILY_ARRAY,
  FAMILY_FPA,
  FAMILY_RECFUN,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_DIV,
  OP_DIV0,
  OP_EQ,
  OP_FPA_FP,
  OP_IDIV,
  OP_IDIV0,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MOD0,
  OP_REM,
  OP_SELECT,
  OP_STORE,
  SORT_BOOL,
} from "./ast";
import type { AstManager } from "./ast";
import { isConsideredUninterpreted } from "./fpa-decl-plugin";
import { FuncInterp, getManagerSomeValue } from "./proto-model";
import type { ProtoModel } from "./proto-model";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import type { Rewrite } from "./rewriter-tpl";
import { Rational } from "./rational";
import { mkRecFunApp } from "./recfun-rewriter";
import { VarSubst } from "./var-subst";

const BY_ZERO_OPS = new Map([
  [OP_DIV, OP_DIV0],
  [OP_IDIV, OP_IDIV0],
  [OP_MOD, OP_MOD0],
  [OP_REM, OP_MOD0],
]);

export class ModelEvaluator extends RewriterTpl {
  private rewriter: Rewriter;
  private isModelCompletion = false;
  private reducedArgs: number[] = [];

  constructor(
    manager: AstManager,
    private model: ProtoModel,
  ) {
    super(manager);
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.rewriter.releaseResult = () => this.setLastResult(-1);
  }

  setModelCompletion(isModelCompletion: boolean) {
    if (this.isModelCompletion === isModelCompletion) return;
    this.reset();
    this.isModelCompletion = isModelCompletion;
  }

  mkNested() {
    const nested = new ModelEvaluator(this.manager, this.model);
    nested.isModelCompletion = this.isModelCompletion;
    return nested;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const outer = manager.beginTemporaries();
    const result = this.reduceAppCore(decl, args, sort);
    if (result !== -1) manager.incRef(typeof result === "number" ? result : result.expr);
    manager.endTemporaries(outer);
    return result;
  }

  private reduceAppCore(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    const model = this.model;
    const family = manager.funcDecls[decl].family;
    if (family === FAMILY_ARRAY && manager.funcDecls[decl].op === OP_AS_ARRAY) {
      const arrayDecl = manager.funcDecls[decl].parameters[0];
      const arrayInterp = model.funcInterps.get(arrayDecl)?.getArrayInterp(arrayDecl);
      if (arrayInterp !== undefined) return { expr: arrayInterp, depth: 1 };
    }
    if (family === FAMILY_USER) {
      if (args.length > 0) {
        const result = this.evaluate(decl, args);
        return result === undefined ? -1 : { expr: result, depth: 1 };
      }
      const value = model.constInterps.get(decl);
      if (value !== undefined)
        return this.containsRedex(value) ? { expr: value, depth: Infinity } : value;
      if (!this.isModelCompletion) return -1;
      const some = model.getSomeValue(sort);
      model.registerConst(decl, some);
      return some;
    }
    if (manager.funcDecls[decl].op === OP_EQ && manager.isArraySort(manager.sorts[args[0]])) {
      const reduced = this.mkArrayEq(args[0], args[1]);
      if (reduced !== undefined) return reduced;
    }
    if (manager.funcDecls[decl].op === OP_AND) {
      const reduced = this.mkArithAndCore(args);
      if (reduced !== undefined) return reduced;
    }
    if (family === FAMILY_LABEL && args.length === 1) return args[0];
    if (family === FAMILY_RECFUN) {
      const unfolded = mkRecFunApp(manager, decl, args, true);
      if (unfolded !== undefined) return unfolded;
      const interp = model.funcInterps.get(decl);
      if (interp === undefined) return -1;
      if (interp.isPartial()) interp.setElse(model.getSomeValue(sort));
      const result = this.substitute(interp.getInterp() as number, args);
      return manager.isGround(result) ? { expr: result, depth: Infinity } : result;
    }
    const rewritten = this.rewriter.reduceAppCore(decl, args);
    const reduced =
      rewritten !== -1
        ? rewritten
        : family === FAMILY_ARITH
          ? this.evaluatePartialTheoryFunc(decl, args, sort)
          : family === FAMILY_FPA
            ? this.evaluateUnspecifiedFpaFunc(decl, args, sort)
            : rewritten;
    if (
      family !== FAMILY_ARITH ||
      typeof reduced !== "number" ||
      reduced === -1 ||
      manager.kinds[reduced] !== KIND_APP
    )
      return reduced;
    const reducedArgs = this.reducedArgs;
    reducedArgs.length = 0;
    manager.pushArgs(reduced, reducedArgs);
    const result = this.evaluate(manager.decls[reduced], reducedArgs);
    return result === undefined ? reduced : { expr: result, depth: 1 };
  }

  private evaluate(decl: number, args: number[]) {
    const manager = this.manager;
    const interp = this.model.funcInterps.get(decl);
    if (
      interp === undefined ||
      interp.entries.length === 0 ||
      !args.every((arg) => manager.isUniqueValue(arg))
    )
      return undefined;
    return interp.getEntry(args)?.result;
  }

  private evaluatePartialTheoryFunc(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    const model = this.model;
    const op = manager.funcDecls[decl].op;
    const byZero = BY_ZERO_OPS.get(op);
    let interp = model.funcInterps.get(decl);
    if (interp === undefined && byZero !== undefined && !manager.isNumeral(args[1])) {
      const definition = model.funcInterps.get(byZero)?.getInterp();
      if (definition === undefined || definition === null) return -1;
      const result = this.substitute(definition, args);
      const zero = manager.mkNumeralOfSort(Rational.zero, manager.sorts[args[1]]);
      return manager.mkApp(
        OP_ITE,
        [manager.mkEq(zero, args[1]), result, manager.mkApp(decl, args, sort)],
        sort,
      );
    }
    if (interp === undefined) {
      const isByZero = byZero !== undefined && manager.getRationalValue(args[1]).isZero();
      if (!isByZero && op !== OP_DIV0 && op !== OP_IDIV0 && op !== OP_MOD0) return -1;
      interp = isByZero ? model.funcInterps.get(byZero) : undefined;
      if (interp === undefined) return manager.mkNumeralOfSort(Rational.zero, sort);
    }
    if (interp.isPartial()) interp.setElse(model.getSomeValue(sort));
    return { expr: this.substitute(interp.getInterp() as number, args), depth: Infinity };
  }

  // evaluate_partial_theory_func on a floating-point function: an application the standard leaves
  // open takes the function's interpretation, or some value without one.
  private evaluateUnspecifiedFpaFunc(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    if (!isConsideredUninterpreted(manager, decl, args)) return -1;
    const interp = this.model.funcInterps.get(decl);
    if (interp === undefined) return getManagerSomeValue(manager, sort);
    if (interp.isPartial()) interp.setElse(getManagerSomeValue(manager, sort));
    return { expr: this.substitute(interp.getInterp() as number, args), depth: Infinity };
  }

  // Like Z3, only the indices of the stores of a store chain decide whether they are unique.
  private extractArrayFuncInterp(inputArray: number) {
    const manager = this.manager;
    const stores: number[][] = [];
    let array = inputArray;
    let areUnique = true;
    while (manager.getFamily(array) === FAMILY_ARRAY && manager.getOp(array) === OP_STORE) {
      const store = manager.getArgs(array).slice(1);
      areUnique &&= store.slice(0, -1).every((index) => manager.isUniqueValue(index));
      stores.push(store);
      array = manager.getArg(array, 0);
    }
    if (manager.getFamily(array) === FAMILY_ARRAY && manager.getOp(array) === OP_CONST_ARRAY)
      return { stores, elseExpr: manager.getArg(array, 0), areUnique };
    if (manager.getFamily(array) !== FAMILY_ARRAY || manager.getOp(array) !== OP_AS_ARRAY)
      return undefined;
    const interp = this.model.funcInterps.get(
      manager.funcDecls[manager.decls[array]].parameters[0],
    );
    const elseExpr = interp?.elseExpr ?? null;
    if (interp === undefined || elseExpr === null) return undefined;
    let isGround = manager.isGround(elseExpr);
    for (const entry of interp.entries) {
      if (entry.result === elseExpr) continue;
      const store = [...entry.args, entry.result];
      isGround &&= store.every((arg) => manager.isGround(arg));
      stores.push(store);
    }
    return isGround ? { stores, elseExpr, areUnique } : undefined;
  }

  private mkArrayEq(first: number, second: number): number | Rewrite | undefined {
    const manager = this.manager;
    if (first === second) return manager.trueExpr;
    const firstInterp = this.extractArrayFuncInterp(first);
    const secondInterp = this.extractArrayFuncInterp(second);
    if (firstInterp === undefined || secondInterp === undefined) return undefined;
    const firstElse = firstInterp.elseExpr;
    const secondElse = secondInterp.elseExpr;
    const areUnique = firstInterp.areUnique && secondInterp.areUnique;
    const sort = manager.sorts[first];
    const domain = manager.getSortParameters(sort).slice(0, -1);
    const domainSize = domain.reduce((size, index) => {
      const indexSize = manager.getSortSize(index);
      return size < 0n || indexSize < 0n ? -1n : size * indexSize;
    }, 1n);
    const stores = [...firstInterp.stores, ...secondInterp.stores];
    const isFullyCovered =
      areUnique &&
      firstElse !== secondElse &&
      domainSize >= 0n &&
      stores.length > 0 &&
      BigInt(new Set(stores.map((store) => store.slice(0, -1).join(","))).size) >= domainSize;
    const conjuncts: number[] = [];
    const isElseInfinite = manager.getSortSize(manager.sorts[firstElse]) < 0n;
    if (firstElse !== secondElse && !isFullyCovered) {
      if (manager.areDistinct(firstElse, secondElse) && isElseInfinite) return manager.falseExpr;
      conjuncts.push(manager.mkEq(firstElse, secondElse));
    }
    if (areUnique && firstInterp.stores.length > 0)
      return this.mkArrayEqCore(
        firstInterp.stores,
        firstElse,
        secondInterp.stores,
        secondElse,
        conjuncts,
      );
    for (const store of stores) {
      const indices = store.slice(0, -1);
      conjuncts.push(
        manager.mkEq(
          mkArrayApp(manager, OP_SELECT, [first, ...indices]),
          mkArrayApp(manager, OP_SELECT, [second, ...indices]),
        ),
      );
    }
    return { expr: manager.mkAnd(conjuncts), depth: Infinity };
  }

  private mkArrayEqCore(
    firstStores: number[][],
    firstElse: number,
    secondStores: number[][],
    secondElse: number,
    conjuncts: number[],
  ): number | Rewrite {
    const manager = this.manager;
    const arity = firstStores[0].length - 1;
    const getKey = (store: number[]) => store.slice(0, arity).join(",");
    const firstTable = new Map<string, number[]>();
    // A store of a smaller index takes precedence.
    for (const store of [...firstStores].reverse()) firstTable.set(getKey(store), store);
    const secondKeys = new Set<string>();
    // A pair that is neither equal nor distinct is left as an equality.
    const isDistinct = (left: number, right: number) => {
      if (left === right) return false;
      if (manager.areDistinct(left, right)) return true;
      conjuncts.push(manager.mkEq(left, right));
      return false;
    };
    for (const store of secondStores) {
      const key = getKey(store);
      if (secondKeys.has(key)) continue;
      secondKeys.add(key);
      const value = store[arity];
      const match = firstTable.get(key);
      if (match !== undefined) firstTable.delete(key);
      const isDifferent =
        match === undefined ? isDistinct(firstElse, value) : isDistinct(value, match[arity]);
      if (isDifferent) return manager.falseExpr;
    }
    for (const store of firstTable.values())
      if (isDistinct(store[arity], secondElse)) return manager.falseExpr;
    return { expr: manager.mkAnd(conjuncts), depth: Infinity };
  }

  private substitute(expr: number, args: number[]) {
    const subst = new VarSubst(this.manager, false);
    const result = subst.apply(expr, args);
    subst.release();
    this.manager.releaseLater(result);
    return result;
  }

  private containsRedex(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_AS_ARRAY) return true;
    if (manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0) return false;
    const visited = new Set<number>();
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      const op = manager.getOp(current);
      if (op === OP_AS_ARRAY || op === OP_EQ || op === OP_FPA_FP) return true;
      if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
      else if (manager.kinds[current] === KIND_QUANTIFIER) {
        const data = manager.getQuantifier(current);
        todo.push(data.body, ...data.patterns, ...data.noPatterns);
      }
    }
    return false;
  }

  // Z3 compares each bound with the first rather than the greatest so far, where this keeps the greatest.
  private mkArithAndCore(args: number[]): Rewrite | undefined {
    const manager = this.manager;
    if (args.length <= 1 || manager.getOp(args[0]) !== OP_LE) return undefined;
    const lower = manager.getArg(args[0], 0);
    const term = manager.getArg(args[0], 1);
    if (!manager.isNumeral(lower)) return undefined;
    let bound = args[0];
    const rest: number[] = [];
    for (const arg of args.slice(1)) {
      const isBound =
        manager.getOp(arg) === OP_LE &&
        manager.getArg(arg, 1) === term &&
        manager.isNumeral(manager.getArg(arg, 0));
      if (!isBound) rest.push(arg);
      else if (
        manager
          .getRationalValue(manager.getArg(arg, 0))
          .compare(manager.getRationalValue(manager.getArg(bound, 0))) > 0
      )
        bound = arg;
    }
    if (rest.length === args.length - 1) return undefined;
    rest.push(bound);
    return { expr: manager.mkApp(OP_AND, rest, SORT_BOOL), depth: 1 };
  }

  getMacro(decl: number) {
    const manager = this.manager;
    const model = this.model;
    const info = manager.funcDecls[decl];
    const interp = model.funcInterps.get(decl);
    if (interp !== undefined) {
      if (interp.isPartial()) {
        if (!this.isModelCompletion) return -1;
        interp.setElse(model.getSomeValue(info.range));
      }
      return interp.getInterp() as number;
    }
    if (!this.isModelCompletion || info.family !== FAMILY_USER) return -1;
    const some = model.getSomeValue(info.range);
    const created = new FuncInterp(manager, info.domain.length);
    created.setElse(some);
    model.registerFunc(decl, created);
    return some;
  }

  isReducingMacro() {
    return true;
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const rewriter = new Rewriter(this.manager, TACTIC_REWRITER_OPTIONS);
    const result = rewriter.reduceQuantifier(expr, body, patterns);
    rewriter.release();
    return result;
  }

  release() {
    this.rewriter.release();
    super.release();
  }
}
