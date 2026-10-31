// Regenerates src/prove/isabelle/tla/logic-data.ts from the Isabelle/TLA+ heap that tlapm ships.
// It runs scripts/isabelle/export.ML in that heap, checks that every exported net key matches
// the keys tla-ts computes, and writes the theorems and nets in a compact form.
//
// Usage: pnpm tsx scripts/isabelle-logic.ts <tlapm>/lib/tlapm/backends/Isabelle-install

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { keyOfTerm } from "../src/prove/isabelle/pure/net";
import { etaContract } from "../src/prove/isabelle/pure/envir";
import {
  destEquals,
  stripAssumsConcl,
  stripImpConcl,
  stripImpPrems,
} from "../src/prove/isabelle/pure/logic";
import {
  mkAbs,
  mkApp,
  mkBound,
  mkConst,
  mkFree,
  mkTFree,
  mkTVar,
  mkType,
  mkVar,
} from "../src/prove/isabelle/pure/term";
import type { Term, Typ } from "../src/prove/isabelle/pure/term";

type RawType = ["T", string, number[]] | ["F", string, string[]] | ["V", string, number, string[]];
type RawTerm =
  | ["C", string, number]
  | ["F", string, number]
  | ["V", string, number, number]
  | ["B", number]
  | ["A", string, number, RawTerm]
  | ["$", RawTerm, RawTerm];
type RawItem = [number, boolean, number, string];
type RawExtraItem = [number, number, boolean, number, string];
type RawRule = [number, number, number[], number, number[]];

interface RawLogic {
  types: RawType[];
  consts: [string, number, RawTerm?][];
  names: [string, string][];
  facts: [string, number[]][];
  factNames: [string, string][];
  simps: [[string, number], number, string][];
  congs: [boolean, string, number][];
  weakCongs: [boolean, string][];
  simprocs: [string, RawTerm[]][];
  loopers: string[];
  unsafeSolvers: string[];
  safeSolvers: string[];
  claset: {
    safeIs: RawRule[];
    safeEs: RawRule[];
    unsafeIs: RawRule[];
    unsafeEs: RawRule[];
    swrappers: string[];
    uwrappers: string[];
    safe0: [RawItem[], RawItem[]];
    safep: [RawItem[], RawItem[]];
    unsafe: [RawItem[], RawItem[]];
    dup: [RawItem[], RawItem[]];
    extra: [RawExtraItem[], RawExtraItem[]];
  };
  contextRules: { bang: [RawExtraItem[], RawExtraItem[]]; plain: [RawExtraItem[], RawExtraItem[]] };
  thms: RawTerm[];
}

const install = process.argv[2];
if (install === undefined)
  throw new Error("Usage: pnpm tsx scripts/isabelle-logic.ts <Isabelle-install>");

const work = mkdtempSync(join(tmpdir(), "isabelle-logic-"));
copyFileSync(new URL("isabelle/Export.thy", import.meta.url), join(work, "Export.thy"));
copyFileSync(new URL("isabelle/export.ML", import.meta.url), join(work, "export.ML"));
const output = join(work, "logic.json");
const heaps = ["Pure", "TLA+", "Options"].map((heap) =>
  JSON.stringify(join(install, "heaps", heap)),
);
const result = spawnSync(
  join(install, "poly", "poly"),
  [
    "--eval",
    `PolyML.SaveState.loadHierarchy [${heaps.join(", ")}]`,
    "--eval",
    `use_thy ${JSON.stringify(join(work, "Export"))}`,
  ],
  {
    env: {
      ...process.env,
      ISABELLE_HOME: install,
      ML_HOME: join(install, "poly"),
      ISABELLE_LOGIC_OUT: output,
    },
    stdio: ["ignore", "inherit", "inherit"],
  },
);
if (result.status !== 0) throw new Error(`Isabelle exited with ${result.status}`);
const raw: RawLogic = JSON.parse(readFileSync(output, "utf8"));
rmSync(work, { recursive: true });

const strings: string[] = [];
const stringIds = new Map<string, number>();
const internString = (text: string) => {
  const known = stringIds.get(text);
  if (known !== undefined) return known;
  stringIds.set(text, strings.length);
  strings.push(text);
  return strings.length - 1;
};

const types = raw.types.map((type): number[] =>
  type[0] === "T"
    ? [0, internString(type[1]), ...type[2]]
    : type[0] === "F"
      ? [1, internString(type[1])]
      : [2, internString(type[1]), type[2]],
);

const terms: number[][] = [];
const termIds = new Map<string, number>();
const internTerm = (term: RawTerm): number => {
  const node =
    term[0] === "C"
      ? [0, internString(term[1]), term[2]]
      : term[0] === "F"
        ? [1, internString(term[1]), term[2]]
        : term[0] === "V"
          ? [2, internString(term[1]), term[2], term[3]]
          : term[0] === "B"
            ? [3, term[1]]
            : term[0] === "A"
              ? [4, internString(term[1]), term[2], internTerm(term[3])]
              : [5, internTerm(term[1]), internTerm(term[2])];
  const key = node.join(",");
  const known = termIds.get(key);
  if (known !== undefined) return known;
  termIds.set(key, terms.length);
  terms.push(node);
  return terms.length - 1;
};

const thms = raw.thms.map(internTerm);

const toTyp = (id: number): Typ => {
  const type = raw.types[id];
  return type[0] === "T"
    ? mkType(type[1], type[2].map(toTyp))
    : type[0] === "F"
      ? mkTFree(type[1])
      : mkTVar(type[1], type[2]);
};

const toTerm = (term: RawTerm): Term =>
  term[0] === "C"
    ? mkConst(term[1], toTyp(term[2]))
    : term[0] === "F"
      ? mkFree(term[1], toTyp(term[2]))
      : term[0] === "V"
        ? mkVar(term[1], term[2], toTyp(term[3]))
        : term[0] === "B"
          ? mkBound(term[1])
          : term[0] === "A"
            ? mkAbs(term[1], toTyp(term[2]), toTerm(term[3]))
            : mkApp(toTerm(term[1]), toTerm(term[2]));

const keyText = (term: Term) =>
  keyOfTerm(term)
    .map((key) => (key.kind === "Comb" ? "$" : key.kind === "Var" ? "?" : key.name))
    .join(" ");

const checkKey = (expected: string, term: Term, what: string) => {
  const actual = keyText(term);
  if (actual !== expected) throw new Error(`Net key of ${what} differs: ${actual} vs ${expected}`);
};

for (const [name, thm, key] of raw.simps)
  checkKey(
    key,
    etaContract(destEquals(stripImpConcl(toTerm(raw.thms[thm])))[0]),
    `simp ${name[0]}`,
  );

const brlKey = (isElim: boolean, thm: number) => {
  const prop = toTerm(raw.thms[thm]);
  return isElim ? stripAssumsConcl(stripImpPrems(prop)[0]) : stripImpConcl(prop);
};

const items = (pair: [RawItem[], RawItem[]]) =>
  pair.map((side) =>
    side.map((item) => {
      checkKey(item[3], brlKey(item[1], item[2]), `claset rule ${item[2]}`);
      return [item[0], item[1] ? 1 : 0, item[2]];
    }),
  );

const extraItems = (pair: [RawExtraItem[], RawExtraItem[]]) =>
  pair.map((side) =>
    side.map((item) => {
      checkKey(item[4], brlKey(item[2], item[3]), `context rule ${item[3]}`);
      return [item[0], item[1], item[2] ? 1 : 0, item[3]];
    }),
  );

const data = {
  strings,
  types,
  terms,
  thms,
  consts: raw.consts.map((entry) =>
    entry[2] === undefined ? [entry[0], entry[1]] : [entry[0], entry[1], internTerm(entry[2])],
  ),
  names: raw.names.filter((entry) => raw.consts.some((constant) => constant[0] === entry[1])),
  facts: raw.facts,
  factNames: raw.factNames.filter(
    (entry) => entry[0] !== entry[1] && raw.facts.some((fact) => fact[0] === entry[1]),
  ),
  simps: raw.simps.map((entry) => entry[1]),
  congs: raw.congs,
  weakCongs: raw.weakCongs,
  simprocs: raw.simprocs.map((entry) => [entry[0], entry[1].map(internTerm)]),
  loopers: raw.loopers,
  unsafeSolvers: raw.unsafeSolvers,
  safeSolvers: raw.safeSolvers,
  claset: {
    safeIs: raw.claset.safeIs,
    safeEs: raw.claset.safeEs,
    unsafeIs: raw.claset.unsafeIs,
    unsafeEs: raw.claset.unsafeEs,
    swrappers: raw.claset.swrappers,
    uwrappers: raw.claset.uwrappers,
    safe0: items(raw.claset.safe0),
    safep: items(raw.claset.safep),
    unsafe: items(raw.claset.unsafe),
    dup: items(raw.claset.dup),
    extra: extraItems(raw.claset.extra),
  },
  contextRules: {
    bang: extraItems(raw.contextRules.bang),
    plain: extraItems(raw.contextRules.plain),
  },
};

writeFileSync(
  new URL("../src/prove/isabelle/tla/logic-data.ts", import.meta.url),
  `// Generated by scripts/isabelle-logic.ts from the Isabelle/TLA+ heap that tlapm ships. Do not edit.\n// The theorems come from tlapm's Isabelle/TLA+ theories, BSD licensed, see LICENSE.\n\nexport const LOGIC_DATA = ${JSON.stringify(JSON.stringify(data))};\n`,
);
console.log(`${thms.length} theorems, ${terms.length} term nodes, ${strings.length} strings`);
