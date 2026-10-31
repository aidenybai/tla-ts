// Ported from Z3 (src/ast/ast.h), MIT license, see z3-license.txt. The assignments of expr_ref, for
// code that keeps Z3's reference counts by hand so that expressions are created and deleted in Z3's
// order. -1 stands for a null expression.
import type { AstManager } from "./ast";

// expr_ref's assignment: the new value gains a reference before the old one loses its own.
export const assign = (manager: AstManager, old: number, value: number) => {
  if (value !== -1) manager.incRef(value);
  if (old !== -1) manager.decRef(old);
  return value;
};

// expr_ref's move assignment of a value the caller owns.
export const assignOwned = (manager: AstManager, old: number, value: number) => {
  if (old !== -1) manager.decRef(old);
  return value;
};

export const release = (manager: AstManager, expr: number) => {
  if (expr !== -1) manager.decRef(expr);
};
