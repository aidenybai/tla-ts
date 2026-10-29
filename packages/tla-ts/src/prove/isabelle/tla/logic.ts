// The Isabelle/TLA+ object logic that tlapm ships, decoded from logic-data.ts: its constants, the
// theorems its theories prove, and the order of the simpset and the classical rule nets.

import { axiomThm, type Thm } from "../pure/thm";
import { mkAbs, mkApp, mkBound, mkConst, mkFree, mkTFree, mkTVar, mkType, mkVar } from "../pure/term";
import type { Term, Typ } from "../pure/term";
import { LOGIC_DATA } from "./logic-data";

type TypeNode = [0, number, ...number[]] | [1, number] | [2, number, number];
type TermNode =
  | [0, number, number]
  | [1, number, number]
  | [2, number, number, number]
  | [3, number]
  | [4, number, number, number]
  | [5, number, number];
// A rule of a claset or of the context rules, by theorem id, with its insertion tag.
type NetItem = [number, 0 | 1, number];
type ExtraNetItem = [number, number, 0 | 1, number];
type RawRule = [number, number, number[], number, number[]];

interface LogicJson {
  strings: string[];
  types: TypeNode[];
  terms: TermNode[];
  thms: number[];
  consts: ([string, number] | [string, number, number])[];
  names: [string, string][];
  facts: [string, number[]][];
  factNames: [string, string][];
  simps: number[];
  congs: [boolean, string, number][];
  weakCongs: [boolean, string][];
  simprocs: [string, number[]][];
  claset: {
    safeIs: RawRule[];
    safeEs: RawRule[];
    unsafeIs: RawRule[];
    unsafeEs: RawRule[];
    safe0: [NetItem[], NetItem[]];
    safep: [NetItem[], NetItem[]];
    unsafe: [NetItem[], NetItem[]];
    dup: [NetItem[], NetItem[]];
    extra: [ExtraNetItem[], ExtraNetItem[]];
  };
  contextRules: { bang: [ExtraNetItem[], ExtraNetItem[]]; plain: [ExtraNetItem[], ExtraNetItem[]] };
}

export interface ConstInfo {
  readonly type: Typ;
  // The right-hand side of an abbreviation, which parsing unfolds.
  readonly abbreviation: Term | undefined;
}

// A classical rule as classical.ML stores it: the theorem, the form the nets use, and the
// elimination forms of a destruction or swapped rule.
export interface RawClassicalRule {
  readonly rule: Thm;
  readonly netRule: Thm;
  readonly netRules: readonly Thm[];
  readonly elimRule: Thm;
  readonly elimRules: readonly Thm[];
}

export interface LogicNetItem {
  readonly tag: number;
  readonly isElim: boolean;
  readonly rule: Thm;
}

export interface LogicExtraNetItem extends LogicNetItem {
  readonly weight: number;
}

export interface LogicNetPair<Item> {
  readonly intro: readonly Item[];
  readonly elim: readonly Item[];
}

export interface TlaLogic {
  readonly consts: ReadonlyMap<string, ConstInfo>;
  // The constant each unqualified name stands for.
  readonly constNames: ReadonlyMap<string, string>;
  readonly facts: ReadonlyMap<string, readonly Thm[]>;
  readonly factNames: ReadonlyMap<string, string>;
  // The simpset's rewrite rules, in the order of Net.entries.
  readonly simps: readonly Thm[];
  readonly congs: readonly { readonly isConst: boolean; readonly name: string; readonly rule: Thm }[];
  readonly weakCongs: readonly { readonly isConst: boolean; readonly name: string }[];
  readonly simprocs: readonly { readonly name: string; readonly lhss: readonly Term[] }[];
  readonly claset: {
    readonly safeIs: readonly RawClassicalRule[];
    readonly safeEs: readonly RawClassicalRule[];
    readonly unsafeIs: readonly RawClassicalRule[];
    readonly unsafeEs: readonly RawClassicalRule[];
    readonly safe0: LogicNetPair<LogicNetItem>;
    readonly safep: LogicNetPair<LogicNetItem>;
    readonly unsafe: LogicNetPair<LogicNetItem>;
    readonly dup: LogicNetPair<LogicNetItem>;
    readonly extra: LogicNetPair<LogicExtraNetItem>;
  };
  readonly contextRules: {
    readonly bang: LogicNetPair<LogicExtraNetItem>;
    readonly plain: LogicNetPair<LogicExtraNetItem>;
  };
}

export const loadLogic = (): TlaLogic => {
  const data: LogicJson = JSON.parse(LOGIC_DATA);
  const types: Typ[] = [];
  const getType = (id: number): Typ => {
    const known = types[id];
    if (known !== undefined) return known;
    const node = data.types[id];
    const type =
      node[0] === 0
        ? mkType(data.strings[node[1]], node.slice(2).map(getType))
        : node[0] === 1
          ? mkTFree(data.strings[node[1]])
          : mkTVar(data.strings[node[1]], node[2]);
    types[id] = type;
    return type;
  };
  const terms: Term[] = [];
  const getTerm = (id: number): Term => {
    const known = terms[id];
    if (known !== undefined) return known;
    const node = data.terms[id];
    const term =
      node[0] === 0
        ? mkConst(data.strings[node[1]], getType(node[2]))
        : node[0] === 1
          ? mkFree(data.strings[node[1]], getType(node[2]))
          : node[0] === 2
            ? mkVar(data.strings[node[1]], node[2], getType(node[3]))
            : node[0] === 3
              ? mkBound(node[1])
              : node[0] === 4
                ? mkAbs(data.strings[node[1]], getType(node[2]), getTerm(node[3]))
                : mkApp(getTerm(node[1]), getTerm(node[2]));
    terms[id] = term;
    return term;
  };
  const thms = data.thms.map((id) => axiomThm(getTerm(id)));
  const toRule = (raw: RawRule): RawClassicalRule => ({
    rule: thms[raw[0]],
    netRule: thms[raw[1]],
    netRules: raw[2].map((id) => thms[id]),
    elimRule: thms[raw[3]],
    elimRules: raw[4].map((id) => thms[id]),
  });
  const toItems = (pair: [NetItem[], NetItem[]]): LogicNetPair<LogicNetItem> => {
    const [intro, elim] = pair.map((side) =>
      side.map((item) => ({ tag: item[0], isElim: item[1] === 1, rule: thms[item[2]] })),
    );
    return { intro, elim };
  };
  const toExtraItems = (pair: [ExtraNetItem[], ExtraNetItem[]]): LogicNetPair<LogicExtraNetItem> => {
    const [intro, elim] = pair.map((side) =>
      side.map((item) => ({ weight: item[0], tag: item[1], isElim: item[2] === 1, rule: thms[item[3]] })),
    );
    return { intro, elim };
  };
  return {
    consts: new Map(
      data.consts.map((entry) => [
        entry[0],
        { type: getType(entry[1]), abbreviation: entry.length === 3 ? getTerm(entry[2]) : undefined },
      ]),
    ),
    constNames: new Map(data.names),
    facts: new Map(data.facts.map((entry) => [entry[0], entry[1].map((id) => thms[id])])),
    factNames: new Map(data.factNames),
    simps: data.simps.map((id) => thms[id]),
    congs: data.congs.map((entry) => ({ isConst: entry[0], name: entry[1], rule: thms[entry[2]] })),
    weakCongs: data.weakCongs.map((entry) => ({ isConst: entry[0], name: entry[1] })),
    simprocs: data.simprocs.map((entry) => ({ name: entry[0], lhss: entry[1].map(getTerm) })),
    claset: {
      safeIs: data.claset.safeIs.map(toRule),
      safeEs: data.claset.safeEs.map(toRule),
      unsafeIs: data.claset.unsafeIs.map(toRule),
      unsafeEs: data.claset.unsafeEs.map(toRule),
      safe0: toItems(data.claset.safe0),
      safep: toItems(data.claset.safep),
      unsafe: toItems(data.claset.unsafe),
      dup: toItems(data.claset.dup),
      extra: toExtraItems(data.claset.extra),
    },
    contextRules: { bang: toExtraItems(data.contextRules.bang), plain: toExtraItems(data.contextRules.plain) },
  };
};
