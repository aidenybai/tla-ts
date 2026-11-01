// Standardize.set_extensionality_visitor: an equality of sets where it may need proving triggers
// the set extensionality axiom, through TrigEq.

import { CAP, CUP, FUN_SET, INT_RANGE, SEQ, SET_MINUS, SUBSET, TRIG_EQ, UNION } from "./format";

export type Polarity = "Positive" | "Negative" | "Neither";

// The head of a set equality whose polarity keeps it from triggering set extensionality unless a
// cast encloses it: (?trigger triggered kept).
const UNRESOLVED_TRIGGER = "?trigger";

const SET_HEADS = new Set([UNION, SUBSET, CUP, CAP, SET_MINUS, INT_RANGE, FUN_SET, SEQ]);

// Standardize.is_set: the applications of constructors whose values are sets. Standardize leaves
// BOOLEAN, STRING, Int, and Nat as bare symbols, which is_set doesn't match.
const isSetTerm = (text: string) => {
  const head = /^\(?([^\s()]+)/.exec(text)?.[1] ?? "";
  return (
    SET_HEADS.has(head) ||
    /^smt__TLA____(SetEnum__\d+|SetSt__flatnd__\d+|SetOf__\d+__flatnd__\d+|Product__\d+|RecordSet__)/.test(
      head,
    )
  );
};

// Picks the triggered or the kept form of each unresolved set equality in text.
export const resolveTriggers = (text: string, isTriggered: boolean): string => {
  const start = text.indexOf(`(${UNRESOLVED_TRIGGER} `);
  if (start === -1) return text;
  const getEnd = (from: number) => {
    const end = { depth: 0, index: from };
    for (; end.index < text.length; end.index++) {
      if (text[end.index] === "(") end.depth++;
      if (text[end.index] === ")") end.depth--;
      if (end.depth === 0) return end.index + 1;
    }
    return text.length;
  };
  const triggeredStart = start + UNRESOLVED_TRIGGER.length + 2;
  const triggeredEnd = getEnd(triggeredStart);
  const keptEnd = getEnd(triggeredEnd + 1);
  const chosen = isTriggered
    ? text.slice(triggeredStart, triggeredEnd)
    : text.slice(triggeredEnd + 1, keptEnd);
  return text.slice(0, start) + chosen + resolveTriggers(text.slice(keptEnd + 1), isTriggered);
};

// The equality, or disequality, of two Idv terms at a polarity.
export const getEquality = (
  left: string,
  right: string,
  polarity: Polarity,
  isNegated: boolean,
) => {
  const triggered = `(${TRIG_EQ} ${left} ${right})`;
  const kept = isNegated ? `(distinct ${left} ${right})` : `(= ${left} ${right})`;
  if (!isSetTerm(left) && !isSetTerm(right)) return kept;
  const text = isNegated ? `(not ${triggered})` : triggered;
  // A cast around the equality may still trigger it, so both forms wait for resolveTriggers.
  return polarity === (isNegated ? "Positive" : "Negative")
    ? `(${UNRESOLVED_TRIGGER} ${text} ${kept})`
    : text;
};
