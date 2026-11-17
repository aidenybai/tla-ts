import { TlaIsabelleError } from "../../../errors";
import { addUnsafeDest, addUnsafeElim, addUnsafeIntro, withClaset } from "../provers/classical";
import { asmRl, compIncr, genAll, multiResolves, zeroVarIndexes } from "../pure/drule";
import { addSimps } from "../pure/raw-simplifier";
import { chopSeq } from "../pure/seq";
import { stripImpConcl } from "../pure/logic";
import { fastypeOf, type Var } from "../pure/term";
import { instantiate, instantiateTypes, type Thm } from "../pure/thm";
import { emptyTyEnv, matchTypes, substType, type TyEnv } from "../pure/type";
import { getFact, readTerms, varsOf, type IsarContext } from "./context";
import { rewriteRule, type ProofContext } from "./method";
import {
  innerText,
  syntaxError,
  type AttributeSource,
  type FactReference,
  type OuterToken,
} from "./theory";

const isInnerToken = (token: OuterToken | undefined) =>
  token !== undefined &&
  (token.kind === "string" ||
    token.kind === "cartouche" ||
    token.kind === "word" ||
    token.kind === "var");

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
      throw new TlaIsabelleError(
        "ERROR",
        `No such variable in theorem: "?${inst.name}${inst.index === 0 ? "" : inst.index}"`,
      );
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
    const variable = args[position];
    if ((variable.kind !== "word" && variable.kind !== "var") || variable.text.startsWith("'"))
      throw syntaxError(variable);
    const digits = /\d*$/.exec(variable.text)?.[0] ?? "";
    if (args[position + 1]?.text !== "=" || !isInnerToken(args[position + 2]))
      throw syntaxError(args[position + 1]);
    insts.push({
      name: variable.text.slice(
        variable.kind === "var" ? 1 : 0,
        variable.text.length - digits.length,
      ),
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

// Simplifier.simp_add and Classical's unsafe_intro, unsafe_elim and unsafe_dest: the declarations
// that add the theorem to a set the methods read.
const declareRule = (tactics: ProofContext, name: string, thm: Thm): ProofContext => {
  if (name === "simp")
    return {
      ...tactics,
      simpset: addSimps({ limits: tactics.limits, simpset: tactics.simpset, bounds: 0 }, [thm]),
    };
  const classical = tactics.classical;
  const add = name === "intro" ? addUnsafeIntro : name === "elim" ? addUnsafeElim : addUnsafeDest;
  return {
    ...tactics,
    classical: withClaset(classical, add(classical, thm, tactics.atomizeRules)),
  };
};

// Thm.apply_attribute: a rule attribute changes the theorem, a declaration the context.
const applyAttribute = (
  context: IsarContext,
  attribute: AttributeSource,
  thm: Thm,
): [IsarContext, Thm] => {
  switch (attribute.name) {
    case "of":
      return [context, ofRule(context, attribute.args, thm)];
    case "where":
      return [context, whereRule(context, parseWhere(attribute.args), thm)];
    case "rule_format":
      if (attribute.args.length > 0) throw syntaxError(attribute.args[0]);
      return [context, rulify(context, thm)];
    case "OF":
      return [
        context,
        ofFacts(context, thm, getThms(context, parseFactReferences(attribute.args))),
      ];
    case "simp":
    case "intro":
    case "elim":
    case "dest":
      if (attribute.args.length > 0)
        throw new TlaIsabelleError("ERROR", `Unsupported ${attribute.name} attribute arguments`);
      return [{ ...context, tactics: declareRule(context.tactics, attribute.name, thm) }, thm];
    default:
      throw new TlaIsabelleError("ERROR", `Unsupported attribute: ${attribute.name}`);
  }
};

// Thm.proof_attributes over a fact's theorems: each attribute sees what those before it declared.
export const applyAttributes = (
  context: IsarContext,
  attributes: readonly AttributeSource[],
  thms: readonly Thm[],
): [IsarContext, Thm[]] =>
  thms.reduce<[IsarContext, Thm[]]>(
    ([current, results], thm) => {
      const [declared, result] = attributes.reduce<[IsarContext, Thm]>(
        ([inner, changed], attribute) => applyAttribute(inner, attribute, changed),
        [current, thm],
      );
      return [declared, [...results, result]];
    },
    [context, []],
  );

// The facts a command or a method cites, where the port keeps no declaration.
export const getThms = (context: IsarContext, references: readonly FactReference[]): Thm[] =>
  references.flatMap((reference) => {
    const [declared, thms] = applyAttributes(
      context,
      reference.attributes,
      getFact(context, reference.name),
    );
    if (declared !== context)
      throw new TlaIsabelleError("ERROR", "Unsupported declaration in a fact reference");
    return thms;
  });
