// encode/n_axiomatize.ml: the symbols and axioms an encoding needs.

import { compareStrings } from "../ocaml";
import { getSymbolSpec, type CollectState, type SymbolSpec } from "./data";
import type { Entry, Flattened } from "./flatten";
import { getTlaName } from "./format";
import { getAxiomKey, type Axiom } from "./table";

// N_axiomatize.collect: each symbol the obligation uses, in the order tlapm visits them, brings
// the symbols and axioms it depends on, smallest name first.
export const collectSymbols = (
  entries: Entry[],
  flattened: Map<string, Flattened>,
  anonymous: Map<string, number>,
  recordFields: Map<string, string[]>,
) => {
  const state: CollectState = {
    recordFields,
    strings: [],
    isFunConstr: false,
    isFunSet: false,
    isExcept: false,
    tuples: [],
    records: [],
    anonymous,
  };
  const symbols = new Map<string, SymbolSpec>();
  const axioms = new Map<string, Axiom>();
  const add = (name: string) => {
    const work = new Set([name]);
    while (work.size > 0) {
      const next = [...work].toSorted(compareStrings)[0];
      work.delete(next);
      if (symbols.has(next)) continue;
      const spec = getSymbolSpec(next, state);
      symbols.set(next, spec);
      spec.deps.forEach((dep) => work.add(dep));
      spec.axioms.forEach((entry) => axioms.set(getAxiomKey(entry), entry));
    }
  };
  // A flattened symbol stands for a builtin applied to its first-order arguments and then its
  // higher-order ones, so its higher-order text is visited after its arguments.
  const visit = (text: string) => {
    const tokens = text.match(/[()]|[^\s()]+/g) ?? [];
    const pending: { depth: number; text: string }[] = [];
    tokens.reduce((depth, token, index) => {
      if (token === "(") return depth + 1;
      if (token === ")") {
        if (pending.at(-1)?.depth === depth) visit(pending.pop()?.text ?? "");
        return depth - 1;
      }
      const flat = flattened.get(token);
      if (!flat) {
        const builtin = getTlaName(token);
        if (builtin !== undefined) add(builtin);
        return depth;
      }
      if (flat.kind !== "") add(flat.kind);
      if (tokens[index - 1] === "(") pending.push({ depth, text: flat.visit });
      else visit(flat.visit);
      return depth;
    }, 0);
  };
  entries.forEach((entry) => {
    if (typeof entry === "string") visit(entry);
    else if ("omitted" in entry) visit(entry.omitted);
  });
  return { symbols, axioms };
};
