// encode/n_flatten.ml: each application of a second-order construct becomes a fresh first-order
// symbol, declared with its axioms before the fact that uses it.

import { formatName, getClosing } from "./format";
import type { Axiom } from "./table";

export interface Flattened {
  symbol: string;
  kind: string;
  visit: string;
  getLines: (axioms: Set<string>) => string[];
}

// A fact that tlapm encodes, so its symbols bring their axioms, but leaves out of the text.
interface OmittedFact {
  omitted: string;
}

export type Entry = string | Flattened | OmittedFact;

export const getDepth = (variable: string) => Number(variable.slice(variable.lastIndexOf("#") + 1));

// Marks the Unprimable WITNESS, which Prep never removes; Flatten.compare_expr tells it apart and
// printing drops it.
export const UNPRIMABLE = "?unprimable";

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

// Flatten.compare_expr ignores outer bound variables and can't compare quantifiers, conditionals or
// LETs, so those match nothing.
const getFlatKey = (text: string, depth: number) =>
  /\((forall|exists|ite|let) /.test(text)
    ? undefined
    : text.replace(/[^\s()]+#(\d+)/g, (_match, found: string) =>
        Number(found) < depth ? "#" : `#${Number(found) - depth}`,
      );

interface Site {
  depth: number;
  isOmitted: boolean;
}

export const createFlattener = () => {
  const flattened = new Map<string, Flattened>();
  const flatKeys = new Map<string, Flattened>();
  const counter = { blueprints: 0 };
  const introduced: Flattened[] = [];

  const flatten = (
    kind: string,
    visit: string,
    site: Site,
    getAxioms: (symbol: string, axioms: Set<string>) => Axiom[],
    sorts: string[],
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
        `(declare-fun ${symbol} (${sorts.join(" ")}) Idv)`,
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

  const takeIntroduced = () => introduced.splice(0);

  return { flattened, flatten, takeIntroduced };
};
