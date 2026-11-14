import { formatName, getClosing } from "./format";
import type { Axiom } from "./table";

export interface Flattened {
  symbol: string;
  kind: string;
  visit: string;
  getLines: (axioms: Set<string>) => string[];
}

interface OmittedFact {
  omitted: string;
}

export type Entry = string | Flattened | OmittedFact;

export const getDepth = (variable: string) => Number(variable.slice(variable.lastIndexOf("#") + 1));

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
  let blueprintCount = 0;
  const introduced: Flattened[] = [];

  const flatten = (
    kind: string,
    visit: string,
    site: Site,
    getAxioms: (symbol: string, axioms: Set<string>) => Axiom[],
    sorts: string[],
    name = `TLA__${kind}`,
  ) => {
    if (site.isOmitted) {
      const symbol = formatName(`${name}_omitted_${flattened.size}`);
      flattened.set(symbol, { symbol, kind, visit: removeUnprimable(visit), getLines: () => [] });
      return symbol;
    }
    const key = getFlatKey(`${name} ${visit}`, site.depth);
    // Flatten.new_bp_id counts every application, even one that reuses an earlier symbol.
    blueprintCount++;
    const known = key === undefined ? undefined : flatKeys.get(key);
    if (known) return known.symbol;
    const raw = `${name}_flatnd_${blueprintCount}`;
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
