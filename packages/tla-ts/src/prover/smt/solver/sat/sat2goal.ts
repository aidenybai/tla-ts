// Ported from Z3 (src/sat/tactic/sat2goal.h, src/sat/tactic/sat2goal.cpp,
// src/sat/smt/atom2bool_var.cpp), MIT license, see z3-license.txt.
import { SmtCanceledError } from "../../../../errors";
import { type AstManager, SORT_BOOL } from "../ast";
import type { Definition, Goal } from "../goal";
import { NULL_LITERAL } from "./clause";
import { ModelConverter } from "./model-converter";
import type { Solver } from "./solver";

const SMALL_LBD = 3;

const mkNot = (manager: AstManager, expr: number) =>
  manager.isNot(expr) ? manager.getArg(expr, 0) : manager.mkNot(expr);

class Sat2GoalConverter {
  readonly smc = new ModelConverter();
  var2expr: number[] = [];
  readonly entries: Definition[] = [];

  constructor(private manager: AstManager) {}

  private isLiteral(expr: number) {
    const manager = this.manager;
    return (
      manager.isUninterpretedConst(expr) ||
      (manager.isNot(expr) && manager.isUninterpretedConst(manager.getArg(expr, 0)))
    );
  }

  private add(expr: number, def: number) {
    const manager = this.manager;
    manager.incRef(def);
    this.entries.push({ decl: manager.decls[expr], def });
  }

  hide(expr: number) {
    this.entries.push({ decl: this.manager.decls[expr], def: -1 });
  }

  flushSmc(solver: Solver, atoms: Map<number, number>) {
    this.smc.flush(solver.mc);
    this.var2expr.length = solver.numVars();
    this.var2expr.fill(-1);
    for (const [expr, boolVar] of atoms) this.var2expr[boolVar] = expr;
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
        if (this.isLiteral(expr)) this.add(expr, def);
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
        if (this.isLiteral(expr)) this.add(expr, this.lit2expr(root));
        index += 5;
        continue;
      }
      clause.push(lit);
    }
  }

  insert(boolVar: number, atom: number) {
    while (this.var2expr.length <= boolVar) this.var2expr.push(-1);
    this.var2expr[boolVar] = atom;
    if (this.manager.isUninterpretedConst(atom)) this.hide(atom);
  }

  private lit2expr(lit: number) {
    const manager = this.manager;
    const boolVar = lit >> 1;
    if (this.var2expr[boolVar] === -1) {
      const aux = manager.mkFreshConst(null, SORT_BOOL);
      manager.incRef(aux);
      this.var2expr[boolVar] = aux;
      this.hide(aux);
    }
    const expr = this.var2expr[boolVar];
    return (lit & 1) === 1 ? manager.mkNot(expr) : expr;
  }
}

export const sat2goal = (
  manager: AstManager,
  solver: Solver,
  atoms: Map<number, number>,
  goal: Goal,
) => {
  if (solver.atBaseLvl() && solver.isInconsistent) {
    goal.assert(manager.falseExpr);
    return;
  }
  const converter = new Sat2GoalConverter(manager);
  converter.flushSmc(solver, atoms);
  const lit2expr = new Int32Array(2 * solver.numVars()).fill(-1);
  for (const [expr, boolVar] of atoms) {
    lit2expr[2 * boolVar] = expr;
    lit2expr[2 * boolVar + 1] = mkNot(manager, expr);
    manager.incRef(lit2expr[2 * boolVar + 1]);
  }
  const getExpr = (lit: number) => {
    if (lit2expr[lit] === -1) {
      const boolVar = lit >> 1;
      let aux = converter.var2expr[boolVar] ?? -1;
      if (aux === -1) {
        aux = manager.mkFreshConst(null, SORT_BOOL);
        manager.incRef(aux);
        converter.insert(boolVar, aux);
      }
      lit2expr[2 * boolVar] = aux;
      lit2expr[2 * boolVar + 1] = mkNot(manager, aux);
      manager.incRef(lit2expr[2 * boolVar + 1]);
    }
    return lit2expr[lit];
  };
  const checkpoint = () => {
    if (!manager.limit.inc()) throw new SmtCanceledError();
  };
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
    if (arena.glue[clause] > SMALL_LBD && arena.isLearned(clause)) continue;
    goal.assert(manager.mkOr(arena.getLits(clause).map(getExpr)));
  }
  goal.addDefinitions(converter.entries);
};
