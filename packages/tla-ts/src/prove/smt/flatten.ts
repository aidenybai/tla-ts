// encode/n_flatten.ml: each application of a second-order construct becomes a fresh first-order
// symbol, declared with its axioms before the fact that uses it.

import { declare, formatName } from "./format";
import type { Axiom } from "./table";

// A symbol that Flatten introduces, with the text tlapm's collect pass visits for its
// higher-order arguments.
export interface Flattened {
  symbol: string;
  kind: string;
  visit: string;
  getLines: (axioms: Set<string>) => string[];
}

// A fact that tlapm encodes, so its symbols bring their axioms, but leaves out of the text.
export interface OmittedFact {
  omitted: string;
}

export type Entry = string | Flattened | OmittedFact;

// A bound variable's placeholder: its name and its depth, which the printer names in scope.
export const getVariable = (name: string, depth: number) => `${name}#${depth}`;

export const getDepth = (variable: string) => Number(variable.slice(variable.lastIndexOf("#") + 1));

// The head that marks the Unprimable WITNESS wraps around its witness, which Prep never removes:
// (?unprimable term). Flatten.compare_expr tells it apart, and the printed text drops it.
export const UNPRIMABLE = "?unprimable";

const getClosing = (text: string, from: number) => {
  const state = { depth: 0 };
  for (const index of Array.from(
    { length: text.length - from },
    (_value, offset) => from + offset,
  )) {
    if (text[index] === "(") state.depth++;
    if (text[index] === ")") state.depth--;
    if (state.depth === 0) return index;
  }
  return text.length;
};

// The text with each Unprimable mark dropped.
export const removeUnprimable = (text: string): string => {
  const start = text.indexOf(`(${UNPRIMABLE} `);
  if (start === -1) return text;
  const end = getClosing(text, start);
  return (
    text.slice(0, start) +
    removeUnprimable(text.slice(start + UNPRIMABLE.length + 2, end)) +
    removeUnprimable(text.slice(end + 1))
  );
};

// Flatten.compare_expr: an application matches an earlier one with the same higher-order
// arguments, whatever the variables bound outside them. It can't compare quantifiers or
// conditionals, so an argument with one matches nothing.
const getFlatKey = (text: string, depth: number) =>
  /\((forall|exists|ite) /.test(text)
    ? undefined
    : text.replace(/[^\s()]+#(\d+)/g, (_match, found: string) =>
        Number(found) < depth ? "#" : `#${Number(found) - depth}`,
      );

// Where an application occurs: its depth of bound variables, and whether it's in a fact that
// Smtlib leaves out, which Flatten doesn't enter.
interface Site {
  depth: number;
  isOmitted?: boolean;
}

// The state of Flatten.main over one obligation: its blueprint count, which init_bp_count resets
// for each obligation, and the symbols it introduced.
export const createFlattener = () => {
  const flattened = new Map<string, Flattened>();
  const flatKeys = new Map<string, Flattened>();
  const counter = { blueprints: 0 };
  // The symbols that the fact being encoded introduces, declared before it.
  const introduced: Flattened[] = [];

  const flatten = (
    kind: string,
    visit: string,
    site: Site,
    getAxioms: (symbol: string, axioms: Set<string>) => Axiom[],
    arity: number,
    name = `TLA__${kind}`,
  ) => {
    // Flatten.find_hoapp skips a second-order ASSUME, so the application stays and only
    // N_axiomatize.collect, which runs before Flatten, visits it.
    if (site.isOmitted) {
      const symbol = formatName(`${name}_omitted_${flattened.size}`);
      flattened.set(symbol, { symbol, kind, visit: removeUnprimable(visit), getLines: () => [] });
      return symbol;
    }
    const key = getFlatKey(`${name} ${visit}`, site.depth);
    // Flatten.new_bp_id counts every application, even one that reuses an earlier symbol.
    counter.blueprints++;
    const known = key === undefined ? undefined : flatKeys.get(key);
    if (known) return known.symbol;
    const raw = `${name}_flatnd_${counter.blueprints}`;
    const symbol = formatName(raw);
    const flat: Flattened = {
      symbol,
      kind,
      visit: removeUnprimable(visit),
      getLines: (axioms) => [
        declare(symbol, arity),
        ...getAxioms(symbol, axioms).map(
          (entry) =>
            `(assert (! ${removeUnprimable(entry.formula ?? "")} :named |${entry.label} ${raw}|))`,
        ),
      ],
    };
    if (key !== undefined) flatKeys.set(key, flat);
    flattened.set(symbol, flat);
    introduced.push(flat);
    return symbol;
  };

  // The symbols introduced since the last call, in order.
  const takeIntroduced = () => introduced.splice(0);

  return { flattened, flatten, takeIntroduced };
};
