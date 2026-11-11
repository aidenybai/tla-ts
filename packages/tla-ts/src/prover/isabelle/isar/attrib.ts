// Ported from Isabelle2025's Pure/Isar/attrib.ML, Pure/Tools/rule_insts.ML and the rules they use
// from Pure/drule.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet
// Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { asmRl, compIncr, genAll, multiResolves, zeroVarIndexes } from "../pure/drule";
import { chopSeq } from "../pure/seq";
import { stripImpConcl } from "../pure/logic";
import { fastypeOf, type Term, type Var } from "../pure/term";
import { instantiate, instantiateTypes, type Thm } from "../pure/thm";
import { emptyTyEnv, matchTypes, substType, type TyEnv } from "../pure/type";
import { getFact, readTerms, type IsarContext } from "./context";
import { rewriteRule } from "./method";
import type { AttributeSource, FactReference, OuterToken } from "./theory";

const syntaxError = (token: OuterToken | undefined) =>
  new TlaIsabelleError(
    "ERROR",
    `Outer syntax error at: ${token === undefined ? "end of input" : token.text}`,
  );

const isInnerToken = (token: OuterToken | undefined) =>
  token !== undefined &&
  (token.kind === "string" || token.kind === "cartouche" || token.kind === "word");

const innerText = (token: OuterToken) =>
  token.kind === "cartouche"
    ? token.text.slice("\\<open>".length, -"\\<close>".length)
    : token.text;

export const parseFactReferences = (tokens: readonly OuterToken[]): FactReference[] => {
  const references: FactReference[] = [];
  let position = 0;
  while (position < tokens.length) {
    const token = tokens[position];
    if (token.kind !== "word") throw syntaxError(token);
    position += 1;
    const attributes: AttributeSource[] = [];
    if (tokens[position]?.kind === "symbol" && tokens[position].text === "[") {
      position += 1;
      for (;;) {
        const attribute = tokens[position];
        if (attribute?.kind !== "word") throw syntaxError(attribute);
        position += 1;
        const start = position;
        let depth = 0;
        while (
          position < tokens.length &&
          !(
            depth === 0 &&
            tokens[position].kind === "symbol" &&
            (tokens[position].text === "," || tokens[position].text === "]")
          )
        ) {
          if (tokens[position].kind === "symbol" && "([".includes(tokens[position].text))
            depth += 1;
          if (tokens[position].kind === "symbol" && ")]".includes(tokens[position].text))
            depth -= 1;
          position += 1;
        }
        attributes.push({ name: attribute.text, args: tokens.slice(start, position) });
        if (tokens[position]?.text === "]") break;
        position += 1;
      }
      position += 1;
    }
    references.push({ name: token.text, attributes });
  }
  return references;
};

// Vars.add_vars: the variables in the order they occur.
const varsOf = (terms: readonly Term[]): Var[] => {
  const found: Var[] = [];
  const visit = (term: Term) => {
    if (
      term.kind === "Var" &&
      !found.some((other) => other.name === term.name && other.index === term.index)
    )
      found.push(term);
    if (term.kind === "Abs") visit(term.body);
    if (term.kind === "App") {
      visit(term.fun);
      visit(term.arg);
    }
  };
  for (const term of terms) visit(term);
  return found;
};

const varsOfThm = (thm: Thm) => varsOf([...thm.tpairs.flat(), thm.prop]);

// Rule_Insts.where_rule: the terms are read against the variables' types, whose type variables
// they instantiate, then Drule.instantiate_normalize.
const whereRule = (
  context: IsarContext,
  insts: readonly { readonly name: string; readonly index: number; readonly text: string }[],
  thm: Thm,
): Thm => {
  const vars = varsOfThm(thm);
  const targets = insts.map((inst) => {
    const variable = vars.find((other) => other.name === inst.name && other.index === inst.index);
    if (variable === undefined)
      throw new TlaIsabelleError("ERROR", `No such variable in theorem: ?${inst.name}`);
    return variable;
  });
  const terms = readTerms(
    context,
    insts.map((inst, index) => ({ text: inst.text, type: targets[index].type })),
    "default",
  );
  const tyenv = targets.reduce<TyEnv>((env, target, index) => {
    const matched = matchTypes(target.type, fastypeOf(terms[index]), env);
    if (matched === undefined)
      throw new TlaIsabelleError("ERROR", "Type mismatch in instantiation");
    return matched;
  }, emptyTyEnv);
  const instantiated = instantiate(
    targets.map((target, index) => ({
      variable: { ...target, type: substType(tyenv, target.type) },
      term: terms[index],
    })),
    instantiateTypes(tyenv, thm),
  );
  return compIncr(instantiated, asmRl);
};

// Rule_Insts.of_rule: the terms instantiate the theorem's variables in the order they occur,
// those after concl: the conclusion's.
const ofRule = (context: IsarContext, args: readonly OuterToken[], thm: Thm): Thm => {
  const concl = args.findIndex(
    (token, index) => token.text === "concl" && args[index + 1]?.text === ":",
  );
  const [premises, conclusion] =
    concl < 0 ? [args, []] : [args.slice(0, concl), args.slice(concl + 2)];
  const zipVars = (vars: readonly Var[], tokens: readonly OuterToken[]) => {
    if (tokens.length > vars.length)
      throw new TlaIsabelleError("ERROR", "More instantiations than variables in theorem");
    return tokens.flatMap((token, index) => {
      if (!isInnerToken(token)) throw syntaxError(token);
      return token.kind === "word" && token.text === "_"
        ? []
        : [{ name: vars[index].name, index: vars[index].index, text: innerText(token) }];
    });
  };
  return whereRule(
    context,
    [
      ...zipVars(varsOfThm(thm), premises),
      ...zipVars(varsOf([stripImpConcl(thm.prop)]), conclusion),
    ],
    thm,
  );
};

const parseWhere = (args: readonly OuterToken[]) => {
  const insts: { name: string; index: number; text: string }[] = [];
  let position = 0;
  while (position < args.length) {
    if (args[position].kind === "symbol" && args[position].text === "?") position += 1;
    const variable = args[position];
    if (variable?.kind !== "word" || variable.text.startsWith("'")) throw syntaxError(variable);
    const digits = /\d*$/.exec(variable.text)?.[0] ?? "";
    if (args[position + 1]?.text !== "=" || !isInnerToken(args[position + 2]))
      throw syntaxError(args[position + 1]);
    insts.push({
      name: variable.text.slice(0, variable.text.length - digits.length),
      index: Number(digits || 0),
      text: innerText(args[position + 2]),
    });
    position += 3;
    if (position < args.length) {
      if (args[position].text !== "and") throw syntaxError(args[position]);
      position += 1;
    }
  }
  return insts;
};

// Drule.OF: the facts resolve against the rule's premises, from the first, with a unique result.
const ofFacts = (context: IsarContext, rule: Thm, facts: readonly Thm[]): Thm => {
  const [results] = chopSeq(2, multiResolves(context.tactics.limits, facts, [rule]));
  if (results.length === 0) throw new TlaIsabelleError("THM", "OF: no unifiers");
  if (results.length > 1) throw new TlaIsabelleError("THM", "OF: multiple unifiers");
  return results[0];
};

// Object_Logic.rulify: object-level rules become meta-level ones.
const rulify = (context: IsarContext, thm: Thm): Thm =>
  zeroVarIndexes(genAll(rewriteRule(context.tactics.limits, context.tactics.rulifyRules, thm)));

export const applyAttribute = (context: IsarContext, attribute: AttributeSource, thm: Thm): Thm => {
  switch (attribute.name) {
    case "of":
      return ofRule(context, attribute.args, thm);
    case "where":
      return whereRule(context, parseWhere(attribute.args), thm);
    case "rule_format":
      if (attribute.args.length > 0) throw syntaxError(attribute.args[0]);
      return rulify(context, thm);
    case "OF":
      return ofFacts(context, thm, getThms(context, parseFactReferences(attribute.args)));
    default:
      throw new TlaIsabelleError("ERROR", `Unsupported attribute: ${attribute.name}`);
  }
};

export const getThms = (context: IsarContext, references: readonly FactReference[]): Thm[] =>
  references.flatMap((reference) =>
    getFact(context, reference.name).map((thm) =>
      reference.attributes.reduce(
        (result, attribute) => applyAttribute(context, attribute, result),
        thm,
      ),
    ),
  );
