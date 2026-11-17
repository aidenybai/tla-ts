import { TlaIsabelleError } from "../../../errors";
import { typargsOf } from "../pure/consts";
import { zeroVarIndexes } from "../pure/drule";
import type { Limits } from "../pure/interrupt";
import { destEquals, mkEquals } from "../pure/logic";
import { seqHead } from "../pure/seq";
import { normHhfProtect } from "../pure/simplifier";
import {
  abstractOver,
  aconv,
  addFreeNames,
  existsSubterm,
  mkAbs,
  mkConst,
  stripComb,
  type Term,
  type Typ,
} from "../pure/term";
import {
  axiomThm,
  betaConversion,
  combination,
  generalize,
  reflexive,
  transitive,
  type Thm,
} from "../pure/thm";
import { getLogicFact, getProofContext } from "../tla/context";
import type { ConstInfo, TlaLogic } from "../tla/logic";
import { applyAttributes, getThms } from "./attrib";
import {
  addAssumptions,
  addFixes,
  augment,
  exportThm,
  getFact,
  putFacts,
  type IsarContext,
} from "./context";
import { parseType } from "./inner-syntax";
import { metaRewriteConv, type ProofContext } from "./method";
import {
  assume,
  chain,
  collect,
  contextOf,
  fix,
  from,
  have,
  invokeCase,
  isFinished,
  next,
  proof,
  qed,
  readStatement,
  show,
  terminalProof,
  theorem,
  unfolding,
  using,
  type State,
} from "./proof";
import type { Command, FactReference, TheoryText } from "./theory";

type Free = Extract<Term, { kind: "Free" }>;

const error = (message: string) => new TlaIsabelleError("ERROR", message);

interface Theory {
  readonly name: string;
  readonly consts: ReadonlyMap<string, ConstInfo>;
  readonly constNames: ReadonlyMap<string, string>;
  readonly facts: ReadonlyMap<string, readonly Thm[]>;
  readonly tactics: ProofContext;
}

const initContext = (logic: TlaLogic, theory: Theory): IsarContext => ({
  scope: { consts: theory.consts, constNames: theory.constNames },
  getGlobalFact: (name) => theory.facts.get(name) ?? getLogicFact(logic, name),
  tactics: theory.tactics,
  fixes: [],
  types: new Map(),
  assumptions: [],
  facts: new Map(),
  binds: new Map(),
  calculation: undefined,
  isBody: false,
  cases: new Map(),
});

const addConst = (theory: Theory, base: string, type: Typ): Theory => {
  const name = `${theory.name}.${base}`;
  const info: ConstInfo = { type, typargs: typargsOf(type), abbreviation: undefined };
  return {
    ...theory,
    consts: new Map([...theory.consts, [name, info]]),
    constNames: new Map([...theory.constNames, [base, name]]),
  };
};

interface NamedFact {
  readonly name: string;
  readonly thms: readonly Thm[];
}

const putTheoryFacts = (theory: Theory, name: string, thms: readonly Thm[]): Theory => ({
  ...theory,
  facts: new Map([...theory.facts, [name, thms]]),
});

// Primitive_Defs.dest_def: the head is new and its arguments are distinct variables, the only free
// variables of the right-hand side.
const destDef = (prop: Term): [Free, Free[], Term] => {
  const [lhs, rhs] = destEquals(prop);
  const [head, args] = stripComb(lhs);
  if (head.kind !== "Free") throw error("Bad head of lhs: existing constant");
  const frees = args.filter((arg): arg is Free => arg.kind === "Free");
  if (
    frees.length < args.length ||
    frees.some((arg, index) => frees.slice(0, index).some((other) => aconv(other, arg)))
  )
    throw error("Arguments of lhs must be distinct free variables");
  if (existsSubterm((term) => aconv(term, head), rhs))
    throw error("Entity to be defined occurs on rhs");
  if (addFreeNames(rhs, []).some((name) => !frees.some((arg) => arg.name === name)))
    throw error("Extra variables on rhs");
  return [head, frees, rhs];
};

// Specification.definition: the head becomes a constant, whose definitional axiom proves the
// equation as stated.
const define = (
  theory: Theory,
  context: IsarContext,
  command: Extract<Command, { kind: "definition" }>,
): Theory => {
  const [prop] = readStatement(
    command.name === undefined || command.type === undefined
      ? context
      : {
          ...context,
          types: new Map([...context.types, [command.name, parseType(command.type)]]),
        },
    [command.part],
    "default",
  ).props.flat();
  const [head, args, rhs] = destDef(destEquals(metaRewriteConv(theory.tactics, prop).prop)[1]);
  if (command.name !== undefined && command.name !== head.name)
    throw error(`Head of definition ${head.name} differs from declaration ${command.name}`);
  const axiom = axiomThm(
    mkEquals(
      mkConst(`${theory.name}.${head.name}`, head.type),
      args.reduceRight((body, arg) => mkAbs(arg.name, arg.type, abstractOver(arg, body)), rhs),
    ),
  );
  const applied = args.reduce((thm, arg) => {
    const combined = combination(thm, reflexive(arg));
    return transitive(combined, betaConversion(false, destEquals(combined.prop)[1]));
  }, axiom);
  const generalized = generalize(
    args.map((arg) => arg.name),
    applied.maxidx + 1,
    applied,
  );
  const [declared, thms] = applyAttributes(context, command.part.attributes, [
    zeroVarIndexes(generalized),
  ]);
  return putTheoryFacts(
    { ...addConst(theory, head.name, head.type), tactics: declared.tactics },
    command.part.name ?? `${head.name}_def`,
    thms,
  );
};

// Specification.theorems: the declarations of each fact's attributes, whose results it drops.
const declare = (context: IsarContext, references: readonly FactReference[]): ProofContext =>
  references.reduce(
    (current, reference) =>
      applyAttributes(current, reference.attributes, getFact(current, reference.name))[0],
    context,
  ).tactics;

// Specification.theorem: the statement's elements, then the goal whose results the theory keeps.
const startTheorem = (
  outer: IsarContext,
  command: Extract<Command, { kind: "theorem" }>,
  store: (tactics: ProofContext, facts: readonly NamedFact[]) => void,
): State => {
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
    const [declared, group] = applyAttributes(
      context,
      part.attributes,
      prems.slice(offset, offset + assumeProps[index].length),
    );
    offset += assumeProps[index].length;
    return part.name === undefined ? declared : putFacts(declared, part.name, group);
  }, assumed);
  const elementsContext =
    prems.length === 0 ? named : putFacts(named, command.isLong ? "assms" : "that", prems);
  const goalContext = showProps.reduce(augment, elementsContext);
  if (showProps.length !== 1) throw error("Unsupported theorem of several propositions");
  return theorem(goalContext, showProps, (resultContext, results) => {
    const normalized = results.map((result) =>
      zeroVarIndexes(
        normHhfProtect(outer.tactics.limits, exportThm(resultContext, outer, false, result)),
      ),
    );
    const part = command.shows[0];
    const [notedContext, noted] = applyAttributes(outer, part.attributes, normalized);
    const [namedContext, named] = applyAttributes(notedContext, command.attributes, noted);
    store(namedContext.tactics, [
      ...(part.name === undefined ? [] : [{ name: part.name, thms: noted }]),
      ...(command.name === undefined ? [] : [{ name: command.name, thms: named }]),
    ]);
  });
};

const proofCommand = (state: State, command: Command): State => {
  switch (command.kind) {
    case "proof": {
      const result = seqHead(proof(state, command.method));
      if (result === undefined) throw error("Failed to apply initial proof method");
      return result;
    }
    case "qed":
      return qed(state, command.method);
    case "by":
      return terminalProof(state, command.initial, command.terminal);
    case "next":
      return next(state);
    case "then":
      return chain(state);
    case "goal": {
      const chained =
        command.command === "hence" || command.command === "thus" ? chain(state) : state;
      return command.command === "have" || command.command === "hence"
        ? have(chained, command.parts)
        : show(chained, command.parts);
    }
    case "assume":
      return assume(state, command.parts);
    case "fix":
      return fix(state, command.variables);
    case "case":
      return invokeCase(state, command.binding, command.name, command.params);
    case "moreover":
    case "ultimately":
      return collect(state, command.kind === "ultimately");
    case "facts": {
      const facts = getThms(contextOf(state), command.facts);
      switch (command.command) {
        case "from":
          return from(state, facts, false);
        case "with":
          return from(state, facts, true);
        case "using":
          return using(state, facts);
        case "unfolding":
          return unfolding(state, facts);
      }
    }
    default:
      throw error(`Unsupported proof command: ${command.kind}`);
  }
};

// Thy_Info.use_thy: the theory fails at its first failing command.
export const runTheory = (logic: TlaLogic, text: TheoryText, limits: Limits) => {
  let theory: Theory = {
    name: text.name,
    consts: logic.consts,
    constNames: logic.constNames,
    facts: new Map(),
    tactics: getProofContext(logic, limits),
  };
  let state: State | undefined;
  for (const command of text.commands) {
    if (state !== undefined) {
      state = proofCommand(state, command);
      if (isFinished(state)) state = undefined;
      continue;
    }
    switch (command.kind) {
      case "consts":
        theory = command.consts.reduce(
          (current, constant) => addConst(current, constant.name, parseType(constant.type)),
          theory,
        );
        break;
      case "definition":
        theory = define(theory, initContext(logic, theory), command);
        break;
      case "declare":
        theory = { ...theory, tactics: declare(initContext(logic, theory), command.facts) };
        break;
      case "theorem":
        state = startTheorem(initContext(logic, theory), command, (tactics, facts) => {
          theory = facts.reduce((current, fact) => putTheoryFacts(current, fact.name, fact.thms), {
            ...theory,
            tactics,
          });
        });
        break;
      default:
        throw error(`Unsupported theory command: ${command.kind}`);
    }
  }
  if (state !== undefined) throw error("Unfinished proof at end of theory");
};
