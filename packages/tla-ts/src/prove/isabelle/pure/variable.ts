// Ported from Isabelle2025's Pure/variable.ML, the import and export of schematic variables.
// Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and
// contributors, see LICENSE.

import { variantList } from "./name";
import { addFreeNames, addVars, mkFree, type Var } from "./term";
import { generalize, instantiate, type Thm } from "./thm";

// Variable.trade with import true: fixes the schematic variables of a theorem as fresh free ones,
// derives theorems from it, and makes those variables schematic again.
export const trade = (derive: (thm: Thm) => readonly Thm[], thm: Thm): Thm[] => {
  const vars = addVars(thm.prop, [] as Var[]);
  const names = variantList(
    thm.hyps.reduce((used, hyp) => addFreeNames(hyp, used), addFreeNames(thm.prop, [])),
    vars.map((variable) => variable.name),
  );
  const derived = derive(
    instantiate(
      vars.map((variable, index) => ({ variable, term: mkFree(names[index], variable.type) })),
      thm,
    ),
  );
  const index = derived.reduce((maxidx, result) => Math.max(maxidx, result.maxidx), thm.maxidx) + 1;
  return derived.map((result) => generalize(names, index, result));
};
