// Ported from Z3 (src/muz/fp/horn_tactic.cpp, src/muz/fp/dl_register_engine.cpp), MIT license,
// see z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_IMPLIES,
  OP_ITE,
  OP_OR,
  SORT_BOOL,
} from "../ast";
import { flattenOrVector } from "../ast-util";
import type { Goal } from "../goal";
import { L_FALSE, L_TRUE } from "../lbool";
import { RefVector } from "../ref-vector";
import type { RewriterOptions } from "../rewriter";
import { getFreeVarSorts } from "../var-subst";
import { DatalogContext, ENGINE_SPACER, FpParams } from "./dl-context";
import { mkForall } from "./dl-rule";
import { SpacerDlInterface } from "./spacer-dl-interface";

export const createDatalogContext = (
  manager: AstManager,
  parameters: ReadonlyMap<string, string>,
  rewriterOptions: RewriterOptions,
) =>
  new DatalogContext(manager, new FpParams(parameters), rewriterOptions, (context, engine) => {
    if (engine !== ENGINE_SPACER) throw new SmtUnsupportedError("the bmc engine");
    return new SpacerDlInterface(context);
  });

const UNSUPPORTED_PARAMETERS: [string, boolean][] = [
  ["datalog.generate_explanations", false],
  ["datalog.magic_sets_for_queries", false],
  ["xform.instantiate_arrays", false],
  ["xform.magic", false],
  ["xform.quantify_arrays", false],
  ["xform.scale", false],
];

const isPredicate = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_APP && manager.getFamily(expr) === FAMILY_USER;

const normalize = (manager: AstManager, formula: number) => {
  let isPositive = true;
  let current = formula;
  for (;;) {
    if (manager.kinds[current] === KIND_QUANTIFIER) {
      const quantifier = manager.getQuantifier(current);
      if (quantifier.isForall === isPositive) {
        current = quantifier.body;
        continue;
      }
    }
    if (!manager.isNot(current)) break;
    isPositive = !isPositive;
    current = manager.getArg(current, 0);
  }
  return isPositive ? current : manager.mkNot(current);
};

const isImplication = (manager: AstManager, formula: number) => {
  let current = formula;
  while (manager.kinds[current] === KIND_QUANTIFIER && manager.getQuantifier(current).isForall)
    current = manager.getQuantifier(current).body;
  while (manager.getOp(current) === OP_IMPLIES) current = manager.getArg(current, 1);
  return isPredicate(manager, current);
};

class HornTactic {
  private context: DatalogContext;

  constructor(
    private manager: AstManager,
    parameters: ReadonlyMap<string, string>,
    rewriterOptions: RewriterOptions,
  ) {
    this.context = createDatalogContext(manager, parameters, rewriterOptions);
  }

  private checkPredicate(visited: Set<number>, root: number) {
    const manager = this.manager;
    const todo = [root];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) continue;
      visited.add(expr);
      if (manager.kinds[expr] === KIND_QUANTIFIER) {
        todo.push(manager.getQuantifier(expr).body);
        continue;
      }
      const op = manager.getOp(expr);
      if (manager.isNot(expr) || op === OP_AND || op === OP_OR || op === OP_IMPLIES)
        manager.pushArgs(expr, todo);
      else if (op === OP_ITE) todo.push(manager.getArg(expr, 1), manager.getArg(expr, 2));
      else if (isPredicate(manager, expr)) this.context.registerPredicate(manager.decls[expr]);
    }
  }

  // The rule or query the formula is, or undefined when it is neither.
  private getFormulaKind(formula: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const args = new RefVector(manager);
    args.push(normalize(manager, formula));
    flattenOrVector(manager, args);
    const body: number[] = [];
    let head = -1;
    for (const arg of args.items) {
      this.checkPredicate(visited, arg);
      if (manager.isNot(arg)) body.push(manager.getArg(arg, 0));
      else if (isPredicate(manager, arg)) {
        if (head !== -1) {
          args.reset();
          return undefined;
        }
        head = arg;
      } else body.push(manager.mkNot(arg));
    }
    const conjunction = manager.mkAnd(body);
    manager.incRef(conjunction);
    args.reset();
    if (head === -1) return { isRule: false, formula: conjunction };
    if (isImplication(manager, formula)) return { isRule: true, formula };
    const rule = manager.mkApp(OP_IMPLIES, [conjunction, head], SORT_BOOL);
    manager.incRef(rule);
    return { isRule: true, formula: rule };
  }

  private bindVariables(formula: number) {
    const manager = this.manager;
    const sorts = getFreeVarSorts(manager, formula, manager.freeVarBounds[formula]).map(
      (sort) => sort ?? SORT_BOOL,
    );
    if (sorts.length === 0) return formula;
    sorts.reverse();
    const names = sorts.map((_, index) => String(sorts.length - index - 1));
    const result = mkForall(manager, sorts, names, formula);
    manager.incRef(result);
    return result;
  }

  apply(goal: Goal) {
    const manager = this.manager;
    const context = this.context;
    for (const entry of UNSUPPORTED_PARAMETERS)
      if (context.params.getBool(entry[0], entry[1]))
        throw new SmtTacticError(`unsupported parameter ${entry[0]}`);
    if (context.params.getSymbol("engine", "auto-config") === "datalog")
      throw new SmtTacticError("unsupported parameter engine=datalog");
    context.ensureOpened();
    const queries: number[] = [];
    for (const form of goal.forms.items) {
      const kind = this.getFormulaKind(form);
      if (kind === undefined) throw new SmtTacticError("formula is not in Horn fragment");
      if (kind.isRule) context.addRule(kind.formula);
      else queries.push(kind.formula);
    }
    if (queries.length !== 1) {
      const query = manager.mkFreshConst("query", SORT_BOOL);
      manager.incRef(query);
      context.registerPredicate(manager.decls[query]);
      for (const other of queries) {
        const rule = manager.mkApp(OP_IMPLIES, [other, query], SORT_BOOL);
        manager.incRef(rule);
        context.addRule(this.bindVariables(rule));
      }
      queries.length = 0;
      queries.push(query);
    }
    const reachable = context.query(queries[0]);
    goal.depth++;
    if (reachable === L_TRUE && context.isMonotone()) goal.assert(manager.falseExpr);
    if (reachable === L_FALSE) goal.reset();
    return [goal];
  }
}

export const runHorn =
  (
    manager: AstManager,
    parameters: ReadonlyMap<string, string>,
    rewriterOptions: RewriterOptions,
  ) =>
  (goal: Goal) =>
    new HornTactic(manager, parameters, rewriterOptions).apply(goal);
