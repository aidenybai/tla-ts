// Ported from Isabelle2025's Pure/Isar/expression.ML. Copyright (c) 1986-2025 University of
// Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { typargsOf } from "../pure/consts";
import type { Term } from "../pure/term";
import type { TlaLogic } from "../tla/logic";
import { parseProp, parseType } from "./inner-syntax";
import type { LemmaText, TheoryText } from "./theory";
import { checkProps, type PropToCheck } from "./type-check";

export interface Statement {
  readonly assumptions: readonly Term[];
  readonly conclusion: Term;
}

export const readStatement = (logic: TlaLogic, theory: TheoryText, lemma: LemmaText): Statement => {
  const theoryConsts = theory.consts.map((constant) => ({
    base: constant.name,
    name: `${theory.name}.${constant.name}`,
    type: parseType(constant.type),
  }));
  const scope = {
    consts: new Map([
      ...logic.consts,
      ...theoryConsts.map(
        (constant) =>
          [
            constant.name,
            { type: constant.type, typargs: typargsOf(constant.type), abbreviation: undefined },
          ] as const,
      ),
    ]),
    constNames: new Map([
      ...logic.constNames,
      ...theoryConsts.map((constant) => [constant.base, constant.name] as const),
    ]),
  };
  const props = lemma.elements.reduce<{ fixed: ReadonlySet<string>; props: PropToCheck[] }>(
    (state, element) =>
      element.kind === "fixes"
        ? {
            fixed: new Set([...state.fixed, ...element.variables.map((variable) => variable.name)]),
            props: state.props,
          }
        : {
            fixed: state.fixed,
            props: [
              ...state.props,
              ...element.props.map((prop) => ({ ast: parseProp(prop), fixed: state.fixed })),
            ],
          },
    { fixed: new Set(), props: [] },
  );
  const fixedTypes = new Map(
    lemma.elements.flatMap((element) =>
      element.kind === "fixes"
        ? element.variables.flatMap((variable) =>
            variable.type === undefined ? [] : [[variable.name, parseType(variable.type)] as const],
          )
        : [],
    ),
  );
  const checked = checkProps(
    scope,
    [...props.props, { ast: parseProp(lemma.shows), fixed: props.fixed }],
    fixedTypes,
  );
  return { assumptions: checked.slice(0, -1), conclusion: checked[checked.length - 1] };
};
