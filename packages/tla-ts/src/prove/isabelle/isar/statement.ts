// Ported from the statement handling of Isabelle2025's Pure/Isar/expression.ML
// (prep_full_context_statement). Copyright (c) 1986-2025 University of Cambridge, Technische
// Universitaet Muenchen, and contributors, see LICENSE.
//
// Reads a lemma's fixes, assumes and shows: each proposition is parsed with the variables fixed
// before it, and all of them are type checked together.

import type { Term } from "../pure/term";
import type { TlaLogic } from "../tla/logic";
import { parseProp, parseType } from "./inner-syntax";
import type { TheoryText } from "./theory";
import { checkProps, type PropToCheck } from "./type-check";

export interface Statement {
  readonly assumptions: readonly Term[];
  readonly conclusion: Term;
}

export const readStatement = (logic: TlaLogic, theory: TheoryText): Statement => {
  const theoryConsts = theory.consts.map((constant) => ({
    base: constant.name,
    name: `${theory.name}.${constant.name}`,
    type: parseType(constant.type),
  }));
  const scope = {
    consts: new Map([
      ...logic.consts,
      ...theoryConsts.map(
        (constant) => [constant.name, { type: constant.type, abbreviation: undefined }] as const,
      ),
    ]),
    constNames: new Map([
      ...logic.constNames,
      ...theoryConsts.map((constant) => [constant.base, constant.name] as const),
    ]),
  };
  const props = theory.elements.reduce<{ fixed: ReadonlySet<string>; props: PropToCheck[] }>(
    (state, element) =>
      element.kind === "fixes"
        ? { fixed: new Set([...state.fixed, ...element.names]), props: state.props }
        : {
            fixed: state.fixed,
            props: [...state.props, { ast: parseProp(element.prop), fixed: state.fixed }],
          },
    { fixed: new Set(), props: [] },
  );
  const checked = checkProps(scope, [
    ...props.props,
    { ast: parseProp(theory.shows), fixed: props.fixed },
  ]);
  return { assumptions: checked.slice(0, -1), conclusion: checked[checked.length - 1] };
};
