// Ported from Isabelle2025's Pure/type_infer_context.ML, Pure/type_infer.ML (fixate) and the
// abbreviation expansion of Pure/consts.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Resolves the names of parsed propositions and infers their types together, as
// Syntax.check_props does for the statement of a lemma: a free variable has one type across all
// of them, and type parameters that stay open become the type variables 'a, 'b, and so on.

import { TlaIsabelleError } from "../../../errors";
import { bumpString } from "../pure/name";
import {
  betapplys,
  foldAtyps,
  foldTypes,
  funT,
  mkAbs,
  mkApp,
  mkBound,
  mkConst,
  mkFree,
  mkTFree,
  mkTVar,
  mkType,
  mapTypes,
  stripComb,
  type Term,
  type Typ,
} from "../pure/term";
import type { ConstInfo } from "../tla/logic";
import type { Ast } from "./inner-syntax";

// The name a type parameter carries until it is fixed, as Type_Infer.param does.
const PARAM_NAME = "?'a";

export interface NameScope {
  readonly consts: ReadonlyMap<string, ConstInfo>;
  // The constant an unqualified name stands for.
  readonly constNames: ReadonlyMap<string, string>;
}

export interface PropToCheck {
  readonly ast: Ast;
  // The variables fixed where the proposition appears.
  readonly fixed: ReadonlySet<string>;
}

interface Inference {
  readonly substitution: Map<number, Typ>;
  readonly freeTypes: Map<string, Typ>;
  nextParam: number;
}

const freshParam = (inference: Inference) => {
  const param = mkTVar(PARAM_NAME, inference.nextParam);
  inference.nextParam += 1;
  return param;
};

const isParam = (type: Typ) => type.kind === "TVar" && type.name === PARAM_NAME;

const resolve = (inference: Inference, type: Typ): Typ => {
  if (type.kind === "TVar" && isParam(type)) {
    const bound = inference.substitution.get(type.index);
    return bound === undefined ? type : resolve(inference, bound);
  }
  return type;
};

const normalize = (inference: Inference, type: Typ): Typ => {
  const resolved = resolve(inference, type);
  return resolved.kind === "Type" ? mkType(resolved.name, resolved.args.map((arg) => normalize(inference, arg))) : resolved;
};

const occurs = (inference: Inference, index: number, type: Typ): boolean => {
  const resolved = resolve(inference, type);
  if (resolved.kind === "TVar" && isParam(resolved)) return resolved.index === index;
  return resolved.kind === "Type" && resolved.args.some((arg) => occurs(inference, index, arg));
};

const unify = (inference: Inference, left: Typ, right: Typ) => {
  const resolvedLeft = resolve(inference, left);
  const resolvedRight = resolve(inference, right);
  if (resolvedLeft.kind === "TVar" && isParam(resolvedLeft)) {
    if (resolvedRight.kind === "TVar" && isParam(resolvedRight) && resolvedRight.index === resolvedLeft.index) return;
    if (occurs(inference, resolvedLeft.index, resolvedRight))
      throw new TlaIsabelleError("ERROR", "Type unification failed: occurs check");
    inference.substitution.set(resolvedLeft.index, resolvedRight);
    return;
  }
  if (resolvedRight.kind === "TVar" && isParam(resolvedRight)) {
    unify(inference, resolvedRight, resolvedLeft);
    return;
  }
  if (resolvedLeft.kind === "Type" && resolvedRight.kind === "Type" && resolvedLeft.name === resolvedRight.name) {
    resolvedLeft.args.forEach((arg, index) => unify(inference, arg, resolvedRight.args[index]));
    return;
  }
  if (resolvedLeft.kind === "TFree" && resolvedRight.kind === "TFree" && resolvedLeft.name === resolvedRight.name) return;
  throw new TlaIsabelleError("ERROR", "Type unification failed");
};

// A constant's declared type with fresh parameters for its type variables.
const instantiateScheme = (inference: Inference, type: Typ) => {
  const params = new Map<string, Typ>();
  const instantiate = (current: Typ): Typ => {
    if (current.kind === "Type") return mkType(current.name, current.args.map(instantiate));
    const key = current.kind === "TFree" ? current.name : `${current.name}.${current.index}`;
    const known = params.get(key);
    if (known !== undefined) return known;
    const param = freshParam(inference);
    params.set(key, param);
    return param;
  };
  return instantiate(type);
};

const constType = (scope: NameScope, name: string) => {
  const info = scope.consts.get(name);
  if (info === undefined) throw new TlaIsabelleError("ERROR", `Undeclared constant: ${name}`);
  return info.type;
};

// Builds the term with parameter types and infers its type, constraining the parameters.
const elaborate = (
  scope: NameScope,
  inference: Inference,
  fixed: ReadonlySet<string>,
  bound: readonly { name: string; type: Typ }[],
  ast: Ast,
): [Term, Typ] => {
  switch (ast.kind) {
    case "name": {
      const index = bound.findIndex((binder) => binder.name === ast.name);
      if (index >= 0) return [mkBound(index), bound[index].type];
      const constant = fixed.has(ast.name) ? undefined : scope.constNames.get(ast.name);
      if (constant !== undefined) {
        const type = instantiateScheme(inference, constType(scope, constant));
        return [mkConst(constant, type), type];
      }
      const known = inference.freeTypes.get(ast.name);
      const type = known ?? freshParam(inference);
      if (known === undefined) inference.freeTypes.set(ast.name, type);
      return [mkFree(ast.name, type), type];
    }
    case "const": {
      const type = instantiateScheme(inference, constType(scope, ast.name));
      return [mkConst(ast.name, type), type];
    }
    case "app": {
      const [fun, funType] = elaborate(scope, inference, fixed, bound, ast.fun);
      const [arg, argType] = elaborate(scope, inference, fixed, bound, ast.arg);
      const result = freshParam(inference);
      unify(inference, funType, funT(argType, result));
      return [mkApp(fun, arg), result];
    }
    case "abs": {
      const type = ast.type ?? freshParam(inference);
      const [body, bodyType] = elaborate(scope, inference, fixed, [{ name: ast.name, type }, ...bound], ast.body);
      return [mkAbs(ast.name, type, body), funT(type, bodyType)];
    }
    case "constrain": {
      const [term, type] = elaborate(scope, inference, fixed, bound, ast.term);
      unify(inference, type, ast.type);
      return [term, type];
    }
  }
};

const matchScheme = (pattern: Typ, object: Typ, instantiation: Map<string, Typ>) => {
  if (pattern.kind === "Type") {
    if (object.kind === "Type") pattern.args.forEach((arg, index) => matchScheme(arg, object.args[index], instantiation));
    return;
  }
  instantiation.set(pattern.kind === "TFree" ? pattern.name : `${pattern.name}.${pattern.index}`, object);
};

const instantiateMatched = (type: Typ, instantiation: ReadonlyMap<string, Typ>): Typ =>
  type.kind === "Type"
    ? mkType(type.name, type.args.map((arg) => instantiateMatched(arg, instantiation)))
    : (instantiation.get(type.kind === "TFree" ? type.name : `${type.name}.${type.index}`) ?? type);

// Consts.certify with normalize: unfolds abbreviations and applies them to their arguments.
const expandAbbreviations = (scope: NameScope, term: Term): Term => {
  const [head, args] = stripComb(term);
  const expandedArgs = args.map((arg) => expandAbbreviations(scope, arg));
  if (head.kind === "Abs") return betapplys(mkAbs(head.name, head.type, expandAbbreviations(scope, head.body)), expandedArgs);
  const info = head.kind === "Const" ? scope.consts.get(head.name) : undefined;
  if (head.kind !== "Const" || info?.abbreviation === undefined) return betapplys(head, expandedArgs);
  const instantiation = new Map<string, Typ>();
  matchScheme(info.type, head.type, instantiation);
  return betapplys(
    mapTypes((type) => instantiateMatched(type, instantiation), info.abbreviation),
    expandedArgs,
  );
};

export const checkProps = (scope: NameScope, props: readonly PropToCheck[]): Term[] => {
  const inference: Inference = { substitution: new Map(), freeTypes: new Map(), nextParam: 0 };
  const elaborated = props.map((prop) => {
    const [term, type] = elaborate(scope, inference, prop.fixed, [], prop.ast);
    unify(inference, type, mkType("prop"));
    return term;
  });
  const expanded = elaborated.map((term) =>
    expandAbbreviations(
      scope,
      mapTypes((type) => normalize(inference, type), term),
    ),
  );
  // Type_Infer.fixate: the parameters left open become type variables named in order of their
  // first appearance.
  const params = expanded.reduce(
    (result, term) =>
      foldTypes(
        (type, state: number[]) =>
          foldAtyps(
            (atom, current: number[]) =>
              atom.kind === "TVar" && isParam(atom) && !current.includes(atom.index) ? [...current, atom.index] : current,
            type,
            state,
          ),
        term,
        result,
      ),
    [] as number[],
  );
  const names = new Map<number, string>();
  params.reduce((name, param) => {
    names.set(param, name);
    return bumpString(name);
  }, "'a");
  const fixType = (type: Typ): Typ =>
    type.kind === "Type"
      ? mkType(type.name, type.args.map(fixType))
      : type.kind === "TVar" && isParam(type)
        ? mkTFree(names.get(type.index) ?? "'a")
        : type;
  return expanded.map((term) => mapTypes(fixType, term));
};
