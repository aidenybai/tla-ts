// Ported from Isabelle2025's Pure/consts.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// A constant's type arguments: the instances of the type variables of its declared type, which
// Consts.declare locates once so that Consts.typargs only has to look them up.

import { TlaIsabelleError } from "../../../errors";
import type { Typ } from "./term";

export type TypargPosition = readonly number[];

// Consts.typargs_of: the path to the first occurrence of each type variable.
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

// Consts.typargs: the type arguments of a constant at an instance of its declared type.
export const typargs = (positions: readonly TypargPosition[], type: Typ): Typ[] =>
  positions.map((path) =>
    path.reduce((current, index) => {
      if (current.kind !== "Type" || index >= current.args.length)
        throw new TlaIsabelleError("TYPE", "Consts.typargs: subscript");
      return current.args[index];
    }, type),
  );
