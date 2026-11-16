// Ported from Z3 (src/solver/mus.cpp), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";
import { mkNot } from "./ast-util";
import { L_TRUE, L_UNDEF } from "./lbool";
import type { MaxsatSolver } from "./maxsmt-base";
import { RefVector } from "./ref-vector";

export class Mus {
  private lit2expr: RefVector;
  private trail: RefVector;

  constructor(
    private manager: AstManager,
    private solver: MaxsatSolver,
  ) {
    this.lit2expr = new RefVector(manager);
    this.trail = new RefVector(manager);
  }

  reset() {
    this.lit2expr.reset();
    this.trail.reset();
  }

  addSoft(literal: number) {
    this.lit2expr.push(literal);
  }

  getMus(mus: RefVector) {
    mus.reset();
    const literals = this.lit2expr.items;
    if (literals.length === 1) {
      mus.push(literals[0]);
      return L_TRUE;
    }
    let unknown = [...literals];
    while (unknown.length > 0) {
      const literal = unknown.pop() as number;
      const notLiteral = mkNot(this.manager, literal);
      this.trail.push(notLiteral);
      const status = this.solver.checkSat([...mus.items, ...unknown, notLiteral]);
      if (status === L_UNDEF) return status;
      if (status === L_TRUE) {
        mus.push(literal);
        continue;
      }
      const core = this.solver.getUnsatCore();
      if (!core.includes(notLiteral)) unknown = core.filter((expr) => !mus.items.includes(expr));
    }
    return L_TRUE;
  }
}
