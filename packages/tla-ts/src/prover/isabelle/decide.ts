import { isStackOverflow, TlaIsabelleError } from "../../errors";
import type { DecideOptions, Verdict } from "../verdict";
import { parseTheory } from "./isar/theory";
import { runTheory } from "./isar/toplevel";
import { loadLogic } from "./tla/logic";

export const decideIsabelle = (text: string, options: DecideOptions): Exclude<Verdict, "sat"> => {
  const limits = { deadline: Date.now() + options.timeLimitMs, signal: options.signal };
  try {
    runTheory(loadLogic(), parseTheory(text), limits);
    return "unsat";
  } catch (error) {
    if (error instanceof TlaIsabelleError || isStackOverflow(error)) return "unknown";
    throw error;
  }
};
