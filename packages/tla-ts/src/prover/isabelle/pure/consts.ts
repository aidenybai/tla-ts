// Ported from Isabelle2025's Pure/consts.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import type { Typ } from "./term";

export type TypargPosition = readonly number[];

export const typargsOf = (type: Typ): TypargPosition[] => {
  const found = new Map<string, TypargPosition>();
  const visit = (current: Typ, path: readonly number[]) => {
    if (current.kind === "Type") current.args.forEach((arg, index) => visit(arg, [...path, index]));
    else if (current.kind === "TVar" && !found.has(`${current.name}.${current.index}`))
      found.set(`${current.name}.${current.index}`, path);
  };
  visit(type, []);
  return [...found.values()];
};

export const typargs = (positions: readonly TypargPosition[], type: Typ): Typ[] =>
  positions.map((path) =>
    path.reduce((current, index) => {
      if (current.kind !== "Type" || index >= current.args.length)
        throw new TlaIsabelleError("TYPE", "Consts.typargs: subscript");
      return current.args[index];
    }, type),
  );
