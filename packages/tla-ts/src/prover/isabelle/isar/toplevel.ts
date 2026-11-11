// Runs a theory's commands one after the other, as Isabelle's Pure/Isar/toplevel.ML does, with the
// theory commands of Pure/Isar/specification.ML and Pure/Isar/expression.ML. Copyright (c)
// 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see
// LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { typargsOf } from "../pure/consts";
import { zeroVarIndexes } from "../pure/drule";
import type { Limits } from "../pure/interrupt";
import { seqHead } from "../pure/seq";
import { normHhfProtect } from "../pure/simplifier";
import type { Thm } from "../pure/thm";
import { getLogicFact, getProofContext } from "../tla/context";
import type { ConstInfo, TlaLogic } from "../tla/logic";
import { getThms } from "./attrib";
import {
  addAssumptions,
  addFixes,
  augment,
  exportThm,
  putFacts,
  type IsarContext,
} from "./context";
import { parseType } from "./inner-syntax";
import {
  assume,
  chain,
  contextOf,
  from,
  have,
  isFinished,
  next,
  proof,
  qed,
  readStatement,
  show,
  terminalProof,
  theorem,
  using,
  type Runtime,
  type State,
} from "./proof";
import type { Command, StatementPart, TheoryText } from "./theory";

const error = (message: string) => new TlaIsabelleError("ERROR", message);

interface Theory {
  readonly name: string;
  readonly consts: ReadonlyMap<string, ConstInfo>;
  readonly constNames: ReadonlyMap<string, string>;
  readonly facts: ReadonlyMap<string, readonly Thm[]>;
}

const initContext = (logic: TlaLogic, theory: Theory, limits: Limits): IsarContext => ({
  scope: { consts: theory.consts, constNames: theory.constNames },
  getGlobalFact: (name) => theory.facts.get(name) ?? getLogicFact(logic, name),
  limits,
  fixes: [],
  types: new Map(),
  assumptions: [],
  facts: new Map(),
  binds: new Map(),
  isBody: false,
});

const addConsts = (theory: Theory, consts: readonly { name: string; type: string }[]): Theory => {
  const declared = consts.map((constant) => {
    const type = parseType(constant.type);
    return {
      base: constant.name,
      name: `${theory.name}.${constant.name}`,
      info: { type, typargs: typargsOf(type), abbreviation: undefined },
    };
  });
  return {
    ...theory,
    consts: new Map([
      ...theory.consts,
      ...declared.map((constant) => [constant.name, constant.info] as const),
    ]),
    constNames: new Map([
      ...theory.constNames,
      ...declared.map((constant) => [constant.base, constant.name] as const),
    ]),
  };
};

const statementProps = (parts: readonly StatementPart[]) => parts.flatMap((part) => part.props);

// Specification.theorem: the statement's elements, then the goal whose results the theory keeps.
const startTheorem = (
  logic: TlaLogic,
  theory: Theory,
  limits: Limits,
  command: Extract<Command, { kind: "theorem" }>,
  store: (name: string, thms: readonly Thm[]) => void,
): State => {
  const outer = initContext(logic, theory, limits);
  const fixed = command.elements.reduce((context, element) => {
    if (element.kind !== "fixes") return context;
    const types = new Map(context.types);
    for (const variable of element.variables)
      if (variable.type !== undefined) types.set(variable.name, parseType(variable.type));
    return addFixes(
      { ...context, types },
      element.variables.map((variable) => variable.name),
    );
  }, outer);
  const assumes = command.elements.flatMap((element) =>
    element.kind === "assumes" ? element.parts : [],
  );
  const statement = readStatement(fixed, [...assumes, ...command.shows], "schematic");
  const assumeProps = statement.props.slice(0, assumes.length);
  const showProps = statement.props.slice(assumes.length).flat();
  const [prems, assumed] = addAssumptions(
    assumeProps.flat().reduce(augment, statement.context),
    false,
    assumeProps.flat(),
  );
  let offset = 0;
  const named = assumes.reduce((context, part, index) => {
    const group = prems.slice(offset, offset + assumeProps[index].length);
    offset += assumeProps[index].length;
    return part.name === undefined ? context : putFacts(context, part.name, group);
  }, assumed);
  const elementsContext =
    prems.length === 0 ? named : putFacts(named, command.isLong ? "assms" : "that", prems);
  const goalContext = showProps.reduce(augment, elementsContext);
  if (statementProps(command.shows).length !== 1)
    throw error("Unsupported theorem of several propositions");
  return theorem(goalContext, showProps, (resultContext, results) => {
    const normalized = results.map((result) =>
      zeroVarIndexes(normHhfProtect(limits, exportThm(resultContext, outer, false, result))),
    );
    for (const part of command.shows) if (part.name !== undefined) store(part.name, normalized);
    if (command.name !== undefined) store(command.name, normalized);
  });
};

const proofCommand = (runtime: Runtime, state: State, command: Command): State => {
  switch (command.kind) {
    case "proof": {
      const result = seqHead(proof(runtime, state, command.method));
      if (result === undefined) throw error("Failed to apply initial proof method");
      return result;
    }
    case "qed":
      return qed(runtime, state, command.method);
    case "by":
      return terminalProof(runtime, state, command.initial, command.terminal);
    case "next":
      return next(state);
    case "then":
      return chain(state);
    case "goal": {
      const chained =
        command.command === "hence" || command.command === "thus" ? chain(state) : state;
      return command.command === "have" || command.command === "hence"
        ? have(chained, command.parts)
        : show(runtime, chained, command.parts);
    }
    case "assume":
      return assume(state, command.parts);
    case "facts": {
      const facts = getThms(contextOf(state), command.facts);
      switch (command.command) {
        case "from":
          return from(state, facts, false);
        case "with":
          return from(state, facts, true);
        case "using":
          return using(state, facts);
        default:
          throw error(`Unsupported proof command: ${command.command}`);
      }
    }
    default:
      throw error(`Unsupported proof command: ${command.kind}`);
  }
};

// Thy_Info.use_thy: the theory fails at its first failing command.
export const runTheory = (logic: TlaLogic, text: TheoryText, limits: Limits) => {
  const facts = new Map<string, readonly Thm[]>();
  let theory: Theory = {
    name: text.name,
    consts: logic.consts,
    constNames: logic.constNames,
    facts,
  };
  const runtime: Runtime = { tactics: getProofContext(logic, limits) };
  let state: State | undefined;
  for (const command of text.commands) {
    if (state !== undefined) {
      state = proofCommand(runtime, state, command);
      if (isFinished(state)) state = undefined;
      continue;
    }
    switch (command.kind) {
      case "consts":
        theory = addConsts(theory, command.consts);
        break;
      case "theorem":
        state = startTheorem(logic, theory, limits, command, (name, thms) => {
          facts.set(name, thms);
        });
        break;
      default:
        throw error(`Unsupported theory command: ${command.kind}`);
    }
  }
  if (state !== undefined) throw error("Unfinished proof at end of theory");
};
