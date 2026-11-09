// Ported from Z3 (src/opt/opt_pareto.cpp, src/opt/opt_pareto_solver.cpp), MIT license, see
// z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  OP_ADD,
  OP_ALGEBRAIC_NUM,
  OP_AND,
  OP_DIV,
  OP_GE,
  OP_GT,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NOT,
  OP_NUM,
  OP_OR,
  OP_POWER,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_REAL,
} from "./ast";
import { Goal } from "./goal";
import { goal2nlsat } from "./goal2nlsat";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { NlsatSolver } from "./nlsat/solver";
import { ProtoModel } from "./proto-model";
import { RefVector } from "./ref-vector";
import { compileInternalTactic, type TacticEnvironment } from "./tactic";

const SIMPLIFY = "(using-params simplify :elim_and true :blast_distinct true :expand_power true)";

const PREPROCESSOR =
  `(and-then ${SIMPLIFY} (using-params purify-arith :complete false) elim-term-ite ` +
  `(using-params purify-arith :complete false) ${SIMPLIFY} tseitin-cnf-core ${SIMPLIFY})`;

const REUSABLE_OPS = new Set([
  OP_NUM,
  OP_ALGEBRAIC_NUM,
  OP_LE,
  OP_GE,
  OP_LT,
  OP_GT,
  OP_ADD,
  OP_SUB,
  OP_UMINUS,
  OP_MUL,
]);

export interface ParetoObjective {
  term: number;
  isMax: boolean;
}

export const canReuseNlsatSolver = (manager: AstManager, terms: readonly number[]) => {
  const seen = new Set<number>();
  const todo = [...terms];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (seen.has(expr)) continue;
    seen.add(expr);
    if (manager.kinds[expr] !== KIND_APP) return false;
    manager.pushArgs(expr, todo);
    const sort = manager.sorts[expr];
    if (sort !== SORT_BOOL && sort !== SORT_REAL && !manager.isNumeral(expr)) return false;
    if (manager.isUninterpretedConst(expr) || manager.getFamily(expr) === FAMILY_BASIC) continue;
    if (manager.getFamily(expr) !== FAMILY_ARITH) return false;
    const op = manager.getOp(expr);
    if (REUSABLE_OPS.has(op)) continue;
    if (op !== OP_DIV && op !== OP_POWER) return false;
    const second = manager.getArg(expr, 1);
    if (!manager.isNumeral(second)) return false;
    const value = manager.getRationalValue(second);
    if (value.isZero()) return false;
    if (op === OP_POWER && (!value.isInt() || value.num < 0n || value.num > 0xffffffffn))
      return false;
  }
  return true;
};

export class ParetoNlsatSolver {
  private assertions: RefVector;
  private pinned: RefVector;
  private tags: (number | null)[] = [];
  private scopeTags: number[] = [];
  private limits: number[] = [];
  private head = 0;
  private nextTag = 0;
  private nlsat: NlsatSolver;
  private t2x = new Map<number, number>();
  private a2b = new Map<number, number>();
  private preprocessor: (goal: Goal) => Goal[];
  model: ProtoModel | null = null;
  reasonUnknown = "";

  constructor(
    private manager: AstManager,
    environment: TacticEnvironment,
    private maxLemmas: number,
  ) {
    this.assertions = new RefVector(manager);
    this.pinned = new RefVector(manager);
    this.nlsat = new NlsatSolver(manager.limit);
    this.nlsat.isReordering = false;
    this.preprocessor = compileInternalTactic(environment, PREPROCESSOR);
  }

  private setModel(model: ProtoModel | null) {
    model?.incRef();
    this.model?.decRef();
    this.model = model;
  }

  private internalize() {
    const manager = this.manager;
    while (this.head < this.assertions.size) {
      const tag = this.tags[this.head];
      let end = this.head + 1;
      while (end < this.assertions.size && this.tags[end] === tag) end++;
      const goal = new Goal(manager);
      for (let index = this.head; index < end; index++) goal.assert(this.assertions.items[index]);
      const goals = this.preprocessor(goal);
      if (goals.length !== 1)
        throw new SmtTacticError("Pareto nlsat preprocessing requires a single goal");
      if (goals[0].isInconsistent) this.nlsat.mkExternalClause([], tag);
      else {
        const termCount = this.t2x.size;
        const atomCount = this.a2b.size;
        goal2nlsat(manager, goals[0].forms.items, this.nlsat, this.t2x, this.a2b, tag);
        for (const term of [...this.t2x.keys()].slice(termCount)) this.pinned.push(term);
        for (const atom of [...this.a2b.keys()].slice(atomCount)) this.pinned.push(atom);
      }
      goals[0].forms.reset();
      this.head = end;
    }
  }

  private extractModel() {
    const manager = this.manager;
    const model = new ProtoModel(manager);
    const seen = new Set<number>();
    const todo = this.assertions.items.toReversed();
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (seen.has(expr)) continue;
      seen.add(expr);
      todo.push(...manager.getArgs(expr).toReversed());
      if (!manager.isUninterpretedConst(expr)) continue;
      const variable = this.t2x.get(expr);
      const boolVar = this.a2b.get(expr);
      if (variable !== undefined)
        model.registerConst(
          manager.decls[expr],
          manager.mkAlgebraicNumeral(this.nlsat.getValue(variable)),
        );
      else if (boolVar !== undefined && this.nlsat.getBoolValue(boolVar) !== L_UNDEF)
        model.registerConst(
          manager.decls[expr],
          this.nlsat.getBoolValue(boolVar) === L_TRUE ? manager.trueExpr : manager.falseExpr,
        );
    }
    this.setModel(model);
  }

  check() {
    this.setModel(null);
    this.reasonUnknown = "";
    try {
      this.internalize();
      const status = this.nlsat.check();
      if (status === L_TRUE) this.extractModel();
      if (status === L_UNDEF) this.reasonUnknown = "incomplete nlsat search";
      return status;
    } catch (error) {
      if (!(error instanceof SmtTacticError)) throw error;
      this.reasonUnknown = error.message;
      return L_UNDEF;
    }
  }

  assert(expr: number) {
    this.assertions.push(expr);
    this.tags.push(this.scopeTags.at(-1) ?? null);
    this.setModel(null);
  }

  push() {
    this.limits.push(this.assertions.size);
    this.scopeTags.push(++this.nextTag);
    this.setModel(null);
  }

  pop() {
    const limit = this.limits.pop();
    const tag = this.scopeTags.pop();
    if (limit === undefined || tag === undefined) return;
    this.nlsat.retract(tag, this.maxLemmas);
    while (this.assertions.size > limit) this.assertions.pop();
    this.tags.length = limit;
    this.head = Math.min(this.head, limit);
    this.setModel(null);
  }

  release() {
    this.setModel(null);
    this.assertions.reset();
    this.pinned.reset();
  }
}

export const giaPareto = (
  manager: AstManager,
  solver: ParetoNlsatSolver,
  objectives: readonly ParetoObjective[],
) => {
  const pinned = new RefVector(manager);
  const pin = (expr: number) => {
    pinned.push(expr);
    return expr;
  };
  const mkCmp = (isGe: boolean, model: ProtoModel, objective: ParetoObjective) => {
    const isGreater = objective.isMax ? isGe : !isGe;
    const value = model.eval(objective.term, true);
    pin(value);
    manager.decRef(value);
    const isComparable = manager.isAlgebraicNumeral(value) || manager.isNumeral(value);
    const pair = isGreater ? [objective.term, value] : [value, objective.term];
    return isComparable ? pin(manager.mkApp(OP_GE, pair, SORT_BOOL)) : manager.trueExpr;
  };
  const mkAnd = (args: number[]) =>
    args.length === 1 ? args[0] : pin(manager.mkApp(OP_AND, args, SORT_BOOL));
  const mkOr = (args: number[]) =>
    args.length === 1 ? args[0] : pin(manager.mkApp(OP_OR, args, SORT_BOOL));
  const mkNot = (expr: number) =>
    manager.isNot(expr) ? manager.getArg(expr, 0) : pin(manager.mkNot(expr));
  let status = solver.check();
  if (status !== L_TRUE) return { status, model: null };
  let model = solver.model;
  model?.incRef();
  solver.push();
  while (status === L_TRUE && model !== null && manager.limit.inc()) {
    const current = model;
    const dominating = objectives.map((objective) => mkCmp(true, current, objective));
    const improving = objectives.map((objective) => mkNot(mkCmp(false, current, objective)));
    solver.assert(mkAnd([...dominating, mkOr(improving)]));
    status = solver.check();
    if (status !== L_TRUE) break;
    current.decRef();
    model = solver.model;
    model?.incRef();
  }
  solver.pop();
  const dominant = model;
  if (status !== L_FALSE || dominant === null) {
    dominant?.decRef();
    pinned.reset();
    return { status: L_UNDEF, model: null };
  }
  const bounded = objectives.map((objective) => mkCmp(false, dominant, objective));
  solver.assert(pin(manager.mkApp(OP_NOT, [mkAnd(bounded)], SORT_BOOL)));
  pinned.reset();
  return { status: L_TRUE, model: dominant };
};
