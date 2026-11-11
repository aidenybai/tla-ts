import {
  CAP,
  CUP,
  FUN_SET,
  getClosing,
  INT_RANGE,
  SEQ,
  SET_MINUS,
  SUBSET,
  TRIG_EQ,
  UNION,
} from "./format";

export type Polarity = "Positive" | "Negative" | "Neither";

const UNRESOLVED_TRIGGER = "?trigger";

const SET_HEADS = new Set([UNION, SUBSET, CUP, CAP, SET_MINUS, INT_RANGE, FUN_SET, SEQ]);

const isSetTerm = (text: string) => {
  const head = /^\(?([^\s()]+)/.exec(text)?.[1] ?? "";
  return (
    SET_HEADS.has(head) ||
    /^smt__TLA____(SetEnum__\d+|SetSt__flatnd__\d+|SetOf__\d+__flatnd__\d+|Product__\d+|RecordSet__)/.test(
      head,
    )
  );
};

export const resolveTriggers = (text: string, isTriggered: boolean): string => {
  const start = text.indexOf(`(${UNRESOLVED_TRIGGER} `);
  if (start === -1) return text;
  const triggeredStart = start + UNRESOLVED_TRIGGER.length + 2;
  const triggeredEnd = getClosing(text, triggeredStart) + 1;
  const keptEnd = getClosing(text, triggeredEnd + 1) + 1;
  const chosen = isTriggered
    ? text.slice(triggeredStart, triggeredEnd)
    : text.slice(triggeredEnd + 1, keptEnd);
  return text.slice(0, start) + chosen + resolveTriggers(text.slice(keptEnd + 1), isTriggered);
};

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
  return polarity === (isNegated ? "Positive" : "Negative")
    ? `(${UNRESOLVED_TRIGGER} ${text} ${kept})`
    : text;
};
