// Ported from Z3 (src/qe/lite/qel.cpp), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";
import { flattenAndVector } from "./ast-util";
import { TermGraph } from "./mbp/mbp-term-graph";
import { RefVector } from "./ref-vector";

// Light-weight quantifier elimination on the term graph: eliminates from the formula the variables
// that have a ground representative, and keeps in vars the others. The result comes with a
// reference.
export const applyQel = (manager: AstManager, vars: RefVector, formula: number) => {
  if (vars.size === 0) {
    manager.incRef(formula);
    return formula;
  }
  const termGraph = new TermGraph(manager);
  termGraph.setVars(vars.items);
  const lits = new RefVector(manager);
  lits.push(formula);
  flattenAndVector(manager, lits);
  termGraph.addLits(lits.items);
  const result = termGraph.qel(vars);
  manager.incRef(result);
  lits.reset();
  termGraph.release();
  return result;
};
