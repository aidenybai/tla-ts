// Ported from Z3 (src/muz/transforms/dl_mk_slice.cpp), MIT license, see z3-license.txt.
import { getSymbolName, KIND_VAR, OP_EQ, OP_ITE, SORT_BOOL } from "../ast";
import { flattenAndVector } from "../ast-util";
import { RefVector } from "../ref-vector";
import { getFreeVarSorts } from "../var-subst";
import type { DatalogContext } from "./dl-context";
import type { Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import type { RuleTransformerPlugin } from "./dl-rule-transformer";

export class MkSlice implements RuleTransformerPlugin {
  readonly priority = 1;
  private sliceable = new Map<number, boolean[]>();
  private input: boolean[] = [];
  private output: boolean[] = [];
  private isVarSliceable: boolean[] = [];
  private solvedVars: number[] = [];
  readonly predicates = new Map<number, number>();

  constructor(private context: DatalogContext) {}

  private getPredicateSlice(predicate: number) {
    const existing = this.sliceable.get(predicate);
    if (existing !== undefined) return existing;
    const slice = Array.from(
      { length: this.context.manager.funcDecls[predicate].domain.length },
      () => true,
    );
    this.sliceable.set(predicate, slice);
    return slice;
  }

  private addVar(index: number) {
    while (this.input.length <= index) {
      this.input.push(false);
      this.output.push(false);
      this.isVarSliceable.push(true);
      this.solvedVars.push(-1);
    }
  }

  private initVarsOf(atom: number, isOutput: boolean, isNegTail: boolean) {
    const manager = this.context.manager;
    const slice = this.getPredicateSlice(manager.decls[atom]);
    manager.getArgs(atom).forEach((arg, index) => {
      if (isNegTail) slice[index] = false;
      if (manager.kinds[arg] !== KIND_VAR) {
        slice[index] = false;
        return;
      }
      const varIndex = manager.values[arg];
      this.addVar(varIndex);
      if (isOutput) this.output[varIndex] = true;
      else this.input[varIndex] = true;
      this.isVarSliceable[varIndex] = this.isVarSliceable[varIndex] && slice[index];
    });
  }

  private initVars(rule: Rule) {
    this.input = [];
    this.output = [];
    this.isVarSliceable = [];
    this.solvedVars = [];
    this.initVarsOf(rule.head, true, false);
    for (let index = 0; index < rule.uninterpretedSize; index++)
      this.initVarsOf(rule.tail[index], false, rule.isNegated[index]);
  }

  private getTailConjs(rule: Rule) {
    const conjs = new RefVector(this.context.manager);
    for (let index = rule.uninterpretedSize; index < rule.tail.length; index++)
      conjs.push(rule.tail[index]);
    flattenAndVector(this.context.manager, conjs);
    return conjs;
  }

  private isOutputVar(index: number) {
    return index < this.output.length && this.output[index] && !this.input[index];
  }

  private getEq(expr: number): { index: number; value: number } | undefined {
    const manager = this.context.manager;
    if (manager.getOp(expr) === OP_ITE) {
      const thenEq = this.getEq(manager.getArg(expr, 1));
      const elseEq = this.getEq(manager.getArg(expr, 2));
      if (thenEq !== undefined && elseEq !== undefined && thenEq.index === elseEq.index)
        return {
          index: thenEq.index,
          value: manager.mkApp(
            OP_ITE,
            [manager.getArg(expr, 0), thenEq.value, elseEq.value],
            manager.sorts[thenEq.value],
          ),
        };
    }
    if (manager.kinds[expr] === KIND_VAR)
      return { index: manager.values[expr], value: manager.trueExpr };
    if (manager.isNot(expr) && manager.kinds[manager.getArg(expr, 0)] === KIND_VAR)
      return { index: manager.values[manager.getArg(expr, 0)], value: manager.falseExpr };
    if (manager.getOp(expr) !== OP_EQ) return undefined;
    const left = manager.getArg(expr, 0);
    const right = manager.getArg(expr, 1);
    if (manager.kinds[left] === KIND_VAR) return { index: manager.values[left], value: right };
    if (manager.kinds[right] === KIND_VAR) return { index: manager.values[right], value: left };
    return undefined;
  }

  private addFreeVars(result: Set<number>, expr: number) {
    const manager = this.context.manager;
    getFreeVarSorts(manager, expr, manager.freeVarBounds[expr]).forEach((sort, index) => {
      if (sort !== undefined) result.add(index);
    });
  }

  private filterUniqueVars(rule: Rule) {
    const manager = this.context.manager;
    const used = new Set<number>();
    for (let index = 0; index < rule.uninterpretedSize; index++)
      for (const arg of manager.getArgs(rule.tail[index])) {
        if (manager.kinds[arg] !== KIND_VAR) continue;
        const varIndex = manager.values[arg];
        this.addVar(varIndex);
        if (used.has(varIndex)) this.isVarSliceable[varIndex] = false;
        else used.add(varIndex);
      }
  }

  private solveVars(rule: Rule, used: Set<number>, parameters: Set<number>) {
    const conjs = this.getTailConjs(rule);
    for (const conj of conjs.items) {
      const eq = this.getEq(conj);
      if (eq === undefined || !this.isOutputVar(eq.index) || !this.isVarSliceable[eq.index]) {
        this.addFreeVars(used, conj);
        continue;
      }
      this.addVar(eq.index);
      if (this.solvedVars[eq.index] === -1) {
        this.addFreeVars(parameters, eq.value);
        this.context.manager.incRef(eq.value);
        this.solvedVars[eq.index] = eq.value;
      } else {
        this.addFreeVars(used, conj);
        this.addFreeVars(used, this.solvedVars[eq.index]);
        used.add(eq.index);
      }
    }
    conjs.reset();
  }

  private finalizeVars(atom: number) {
    const manager = this.context.manager;
    let isChanged = false;
    const slice = this.getPredicateSlice(manager.decls[atom]);
    manager.getArgs(atom).forEach((arg, index) => {
      if (
        manager.kinds[arg] !== KIND_VAR ||
        this.isVarSliceable[manager.values[arg]] ||
        !slice[index]
      )
        return;
      slice[index] = false;
      isChanged = true;
    });
    return isChanged;
  }

  private pruneRule(rule: Rule) {
    const manager = this.context.manager;
    let isChanged = false;
    this.initVars(rule);
    for (let index = 0; index < rule.uninterpretedSize; index++) {
      const atom = rule.tail[index];
      const slice = this.getPredicateSlice(manager.decls[atom]);
      manager.getArgs(atom).forEach((arg, argIndex) => {
        if (manager.kinds[arg] === KIND_VAR || !slice[argIndex]) return;
        slice[argIndex] = false;
        isChanged = true;
      });
    }
    this.filterUniqueVars(rule);
    const used = new Set<number>();
    const parameters = new Set<number>();
    this.solveVars(rule, used, parameters);
    for (const index of used)
      if (index < this.isVarSliceable.length) this.isVarSliceable[index] = false;
    for (let index = 0; index < this.input.length; index++) {
      if (!this.isVarSliceable[index]) continue;
      const isInput = this.input[index];
      const isOutput = this.output[index];
      const solved = this.solvedVars[index];
      if (isInput && isOutput) {
        if (solved !== -1 || parameters.has(index)) this.isVarSliceable[index] = false;
      } else if (isOutput) {
        if (parameters.has(index) || (solved !== -1 && manager.kinds[solved] !== KIND_VAR))
          this.isVarSliceable[index] = false;
      }
    }
    if (this.finalizeVars(rule.head)) isChanged = true;
    for (let index = 0; index < rule.uninterpretedSize; index++)
      if (this.finalizeVars(rule.tail[index])) isChanged = true;
    return isChanged;
  }

  private declarePredicates(source: RuleSet, target: RuleSet) {
    const manager = this.context.manager;
    let hasOutput = false;
    for (const [predicate, slice] of this.sliceable) {
      const domain = manager.funcDecls[predicate].domain.filter((_, index) => !slice[index]);
      if (domain.length < slice.length) {
        const sliced = this.context.mkFreshHeadPredicate(
          getSymbolName(manager.funcDecls[predicate].name),
          "slice",
          domain,
        );
        this.predicates.set(predicate, sliced);
        target.inheritPredicate(source, predicate, sliced);
      } else if (source.isOutputPredicate(predicate)) {
        target.setOutputPredicate(predicate);
        hasOutput = true;
      }
    }
    if (!hasOutput) this.predicates.clear();
  }

  private updatePredicate(atom: number) {
    const manager = this.context.manager;
    const sliced = this.predicates.get(manager.decls[atom]);
    if (sliced === undefined) return atom;
    const slice = this.getPredicateSlice(manager.decls[atom]);
    return manager.mkApp(
      sliced,
      manager.getArgs(atom).filter((_, index) => !slice[index]),
      SORT_BOOL,
    );
  }

  private updateRule(rule: Rule, target: RuleSet) {
    const manager = this.context.manager;
    const isUpdated =
      this.predicates.has(rule.getDecl(manager)) ||
      rule.tail
        .slice(0, rule.uninterpretedSize)
        .some((atom) => this.predicates.has(manager.decls[atom]));
    if (!isUpdated) {
      target.addRule(rule);
      return;
    }
    this.initVars(rule);
    const tail = rule.tail
      .slice(0, rule.uninterpretedSize)
      .map((atom) => this.updatePredicate(atom));
    const conjs = this.getTailConjs(rule);
    tail.push(...conjs.items);
    const ruleManager = this.context.ruleManager;
    const updated = ruleManager.fixUnboundVars(
      ruleManager.mk(this.updatePredicate(rule.head), tail, [], rule.name),
      false,
    );
    conjs.reset();
    target.addRule(updated);
  }

  apply(source: RuleSet) {
    if (source.rules.some((rule) => this.context.ruleManager.hasQuantifiers(rule)))
      return undefined;
    this.predicates.clear();
    let isChanged = true;
    while (isChanged) {
      isChanged = false;
      for (const rule of source.rules) if (this.pruneRule(rule)) isChanged = true;
    }
    const result = new RuleSet(this.context);
    this.declarePredicates(source, result);
    if (this.predicates.size === 0) return undefined;
    for (const rule of source.rules) this.updateRule(rule, result);
    return result;
  }
}
