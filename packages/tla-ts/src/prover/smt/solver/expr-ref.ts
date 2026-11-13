// Ported from Z3 (src/ast/ast.h), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";

export const assign = (manager: AstManager, old: number, value: number) => {
  if (value !== -1) manager.incRef(value);
  if (old !== -1) manager.decRef(old);
  return value;
};

export const assignOwned = (manager: AstManager, old: number, value: number) => {
  if (old !== -1) manager.decRef(old);
  return value;
};

export const release = (manager: AstManager, expr: number) => {
  if (expr !== -1) manager.decRef(expr);
};
