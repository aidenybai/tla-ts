import { SmtCanceledError } from "../../../../errors";
import { type AstManager, SORT_BOOL } from "../ast";
import type { Definition, Goal } from "../goal";
import { RefVector } from "../ref-vector";
import { NULL_LITERAL } from "./clause";
import { ModelConverter } from "./model-converter";
import type { Solver } from "./solver";

const mkNot = (manager: AstManager, expr: number) =>
  manager.isNot(expr) ? manager.getArg(expr, 0) : manager.mkNot(expr);

export const isLiteral = (manager: AstManager, expr: number) =>
  manager.isUninterpretedConst(expr) ||
  (manager.isNot(expr) && manager.isUninterpretedConst(manager.getArg(expr, 0)));

export class Sat2GoalConverter {
  readonly smc = new ModelConverter();
  readonly var2expr: RefVector;
  entries: Definition[] = [];

  constructor(private manager: AstManager) {
    this.var2expr = new RefVector(manager);
  }

  private add(expr: number, def: number) {
    const manager = this.manager;
    manager.incRef(def);
    manager.incDeclRef(manager.decls[expr]);
    this.entries.push({ decl: manager.decls[expr], def });
  }

  hide(expr: number) {
    const manager = this.manager;
    manager.incDeclRef(manager.decls[expr]);
    this.entries.push({ decl: manager.decls[expr], def: -1 });
  }

  flushSmc(solver: Solver, atoms: Map<number, number>) {
    this.smc.flush(solver.mc);
    this.var2expr.resize(solver.numVars());
    for (const [expr, boolVar] of atoms) this.var2expr.set(boolVar, expr);
    this.flushGmc();
  }

  private flushGmc() {
    const manager = this.manager;
    const updates: number[] = [];
    this.smc.expand(updates);
    const clause: number[] = [];
    for (let index = 0; index < updates.length; index++) {
      const lit = updates[index];
      if (lit === NULL_LITERAL) {
        let first = clause[0];
        const tail = clause.slice(1).map((other) => this.lit2expr(other ^ 1));
        const head = this.lit2expr(first);
        let def = manager.mkOr([head, manager.mkAnd(tail)]);
        if ((first & 1) === 1) {
          first ^= 1;
          def = manager.mkNot(def);
        }
        const expr = this.lit2expr(first);
        if (isLiteral(manager, expr)) this.add(expr, def);
        clause.length = 0;
        continue;
      }
      if (
        clause.length === 0 &&
        index + 5 < updates.length &&
        updates[index] === (updates[index + 3] ^ 1) &&
        updates[index + 1] === (updates[index + 4] ^ 1) &&
        updates[index + 2] === NULL_LITERAL &&
        updates[index + 5] === NULL_LITERAL
      ) {
        let first = lit;
        let root = updates[index + 1] ^ 1;
        if ((first & 1) === 1) {
          first ^= 1;
          root ^= 1;
        }
        const expr = this.lit2expr(first);
        if (isLiteral(manager, expr)) this.add(expr, this.lit2expr(root));
        index += 5;
        continue;
      }
      clause.push(lit);
    }
  }

  insert(boolVar: number, atom: number) {
    if (this.var2expr.size <= boolVar) this.var2expr.resize(boolVar + 1);
    this.var2expr.set(boolVar, atom);
    if (this.manager.isUninterpretedConst(atom)) this.hide(atom);
  }

  copyEntries() {
    const manager = this.manager;
    for (const entry of this.entries) {
      manager.incDeclRef(entry.decl);
      if (entry.def !== -1) manager.incRef(entry.def);
    }
    return [...this.entries];
  }

  release() {
    const manager = this.manager;
    this.var2expr.reset();
    for (const entry of this.entries) {
      if (entry.def !== -1) manager.decRef(entry.def);
      manager.decDeclRef(entry.decl);
    }
    this.entries = [];
  }

  private lit2expr(lit: number) {
    const manager = this.manager;
    const boolVar = lit >> 1;
    if (this.var2expr.items[boolVar] === -1) {
      const aux = manager.mkFreshConst(null, SORT_BOOL);
      this.var2expr.set(boolVar, aux);
      this.hide(aux);
    }
    const expr = this.var2expr.items[boolVar];
    return (lit & 1) === 1 ? manager.mkNot(expr) : expr;
  }
}

export const sat2goal = (
  manager: AstManager,
  solver: Solver,
  atoms: Map<number, number>,
  goal: Goal,
  converter: Sat2GoalConverter,
) => {
  if (solver.atBaseLvl() && solver.isInconsistent) {
    goal.assert(manager.falseExpr);
    return;
  }
  converter.flushSmc(solver, atoms);
  const lit2expr = new RefVector(manager);
  lit2expr.resize(2 * solver.numVars());
  for (const [expr, boolVar] of atoms) {
    lit2expr.set(2 * boolVar, expr);
    lit2expr.set(2 * boolVar + 1, mkNot(manager, expr));
  }
  const getExpr = (lit: number) => {
    if (lit2expr.items[lit] === -1) {
      const boolVar = lit >> 1;
      let aux = converter.var2expr.items[boolVar] ?? -1;
      if (aux === -1) {
        aux = manager.mkFreshConst(null, SORT_BOOL);
        converter.insert(boolVar, aux);
      }
      lit2expr.set(2 * boolVar, aux);
      lit2expr.set(2 * boolVar + 1, mkNot(manager, aux));
    }
    return lit2expr.items[lit];
  };
  const checkpoint = () => {
    if (!manager.limit.inc()) throw new SmtCanceledError();
  };
  try {
    const trailSize = solver.initTrailSize();
    for (let index = 0; index < trailSize; index++) {
      checkpoint();
      goal.assert(getExpr(solver.trail[index]));
    }
    for (let index = 0; index < solver.watches.length; index++) {
      const first = index ^ 1;
      const wlist = solver.watches[index];
      for (let position = 0; position < wlist.size; position++) {
        if (!wlist.isBinary(position) || wlist.isLearned(position)) continue;
        const second = wlist.getLiteral(position);
        if (first > second) continue;
        checkpoint();
        goal.assert(manager.mkOr([getExpr(first), getExpr(second)]));
      }
    }
    const arena = solver.arena;
    for (const clause of solver.clauses) {
      checkpoint();
      goal.assert(manager.mkOr(arena.getLits(clause).map(getExpr)));
    }
    const formulas: number[] = [];
    solver.ext?.toFormulas(getExpr, formulas);
    for (const formula of formulas) goal.assert(formula);
  } finally {
    lit2expr.reset();
  }
};
