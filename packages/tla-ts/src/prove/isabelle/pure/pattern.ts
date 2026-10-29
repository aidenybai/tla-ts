// Ported from Isabelle2025's Pure/pattern.ML and Pure/more_pattern.ML. Copyright (c) 1986-2025
// University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Unification and matching of higher-order patterns. Isabelle signals failure with the
// exceptions Unif, Pattern and MATCH; here they stay inside this module and the exported
// functions return undefined instead.

import { TlaIsabelleError } from "../../../errors";
import {
  aeconv,
  emptyTEnv,
  genvar,
  headNorm,
  lookup,
  lookup1,
  substTerm,
  update,
  type Envir,
  type TEnv,
} from "./envir";
import { hasKey, indexnameOrd, updateTable } from "./table";
import {
  eqTyp,
  fastypeOf,
  funTs,
  isOpen,
  listComb,
  looseBnos,
  mkAbs,
  mkApp,
  mkBound,
  renameAbs,
  stripComb,
  aconv,
  type Term,
  type Typ,
  type Var,
} from "./term";
import { emptyTyEnv, matchTypes, normType, substType, unifyTypes, type TyEnv } from "./type";

class Unif {}
class NotPattern {}
class Match {}

interface Binder {
  name: string;
  type: Typ;
}

const occurs = (variable: Var, term: Term, envir: Envir): boolean => {
  const visit = (current: Term): boolean => {
    switch (current.kind) {
      case "Var": {
        const assigned = lookup(envir, current);
        return assigned === undefined
          ? current.name === variable.name && current.index === variable.index
          : visit(assigned);
      }
      case "App":
        return visit(current.fun) || visit(current.arg);
      case "Abs":
        return visit(current.body);
      default:
        return false;
    }
  };
  return visit(term);
};

const mapBound = (map: (index: number) => number, term: Term): Term => {
  const visit = (current: Term, depth: number): Term => {
    switch (current.kind) {
      case "Bound":
        return current.index < depth ? current : mkBound(map(current.index - depth) + depth);
      case "Abs":
        return mkAbs(current.name, current.type, visit(current.body, depth + 1));
      case "App":
        return mkApp(visit(current.fun, depth), visit(current.arg, depth));
      default:
        return current;
    }
  };
  return visit(term, 0);
};

const indexOf = (indexes: readonly number[], target: number) => {
  const position = indexes.indexOf(target);
  if (position === -1) throw new Unif();
  return indexes.length - 1 - position;
};

const mkAbsOver = (binders: readonly Binder[], indexes: readonly number[], body: Term): Term =>
  indexes.reduceRight((result, index) => {
    const binder = binders[index];
    return mkAbs(binder.name, binder.type, result);
  }, body);

const incr = (term: Term) => mapBound((index) => index + 1, term);

const intsOf = (terms: readonly Term[]): number[] => {
  const indexes: number[] = [];
  for (let position = terms.length - 1; position >= 0; position -= 1) {
    const term = terms[position];
    if (term.kind !== "Bound" || indexes.includes(term.index)) throw new NotPattern();
    indexes.unshift(term.index);
  }
  return indexes;
};

const intsOfEnv = (envir: Envir, terms: readonly Term[]) =>
  intsOf(terms.map((term) => headNorm(envir, term)));

const appBounds = (head: Term, indexes: readonly number[]) =>
  indexes.reduce((result, index) => mkApp(result, mkBound(index)), head);

const red = (term: Term, indexes: readonly number[], bound: readonly number[]): Term => {
  if (term.kind === "Abs" && indexes.length > 0)
    return red(term.body, indexes.slice(1), [indexes[0], ...bound]);
  if (indexes.length === 0 && bound.length === 0) return term;
  return appBounds(
    mapBound((index) => bound[index], term),
    indexes,
  );
};

const splitType = (type: Typ, count: number): [Typ[], Typ] => {
  const types: Typ[] = [];
  let current = type;
  for (let remaining = count; remaining > 0; remaining -= 1) {
    if (current.kind !== "Type" || current.name !== "fun")
      throw new TlaIsabelleError("TERM", "split_type");
    types.unshift(current.args[0]);
    current = current.args[1];
  }
  return [types, current];
};

const typeOfG = (envir: Envir, type: Typ, count: number, indexes: readonly number[]) => {
  const [types, range] = splitType(normType(envir.tyenv, type), count);
  return funTs(
    indexes.map((index) => types[index]),
    range,
  );
};

const mkHnf = (
  binders: readonly Binder[],
  indexes: readonly number[],
  head: Term,
  args: readonly number[],
) => mkAbsOver(binders, indexes, appBounds(head, args));

const mkNewHnf = (
  envir: Envir,
  binders: readonly Binder[],
  indexes: readonly number[],
  variable: Var,
  args: readonly number[],
) => {
  const [updated, fresh] = genvar(
    variable.name,
    envir,
    typeOfG(envir, variable.type, indexes.length, args),
  );
  return update(variable, mkHnf(binders, indexes, fresh, args), updated);
};

// downto0 (is, n): whether is is [n, n - 1, ..., 0].
const isDownto0 = (indexes: readonly number[], count: number) =>
  indexes.length === count + 1 && indexes.every((index, position) => index === count - position);

const mkProjList = (indexes: readonly (number | undefined)[]) =>
  indexes.flatMap((index, position) =>
    index === undefined ? [] : [indexes.length - 1 - position],
  );

const project = (
  term: Term,
  envir: Envir,
  binders: readonly Binder[],
  indexes: readonly number[],
): [Term, Envir] => {
  const translate = (depth: number, index: number) =>
    index < depth ? index : indexOf(indexes, index - depth) + depth;
  const tryTranslate = (depth: number, index: number) => {
    if (index < depth) return index;
    const position = indexes.indexOf(index - depth);
    return position === -1 ? undefined : indexes.length - 1 - position + depth;
  };
  const projectList = (
    terms: readonly Term[],
    state: Envir,
    depth: number,
    innerBinders: readonly Binder[],
  ): [Term[], Envir] => {
    const results: Term[] = [];
    let current = state;
    for (const item of terms) {
      const [projected, next] = projectTerm(item, current, depth, innerBinders);
      results.push(projected);
      current = next;
    }
    return [results, current];
  };
  const projectTerm = (
    current: Term,
    state: Envir,
    depth: number,
    innerBinders: readonly Binder[],
  ): [Term, Envir] => {
    const normal = headNorm(state, current);
    if (normal.kind === "Abs") {
      const [body, next] = projectTerm(normal.body, state, depth + 1, [
        { name: normal.name, type: normal.type },
        ...innerBinders,
      ]);
      return [mkAbs(normal.name, normal.type, body), next];
    }
    const [head, args] = stripComb(normal);
    if (head.kind === "Const" || head.kind === "Free") {
      const [projected, next] = projectList(args, state, depth, innerBinders);
      return [listComb(head, projected), next];
    }
    if (head.kind === "Bound") {
      const index = translate(depth, head.index);
      const [projected, next] = projectList(args, state, depth, innerBinders);
      return [listComb(mkBound(index), projected), next];
    }
    if (head.kind === "Var") {
      const argIndexes = intsOfEnv(state, args);
      const translated = argIndexes.map((index) => tryTranslate(depth, index));
      const kept = mkProjList(translated);
      const projectedBounds = translated.flatMap((index) => (index === undefined ? [] : [index]));
      const [updated, fresh] = genvar(
        head.name,
        state,
        typeOfG(state, head.type, argIndexes.length, kept),
      );
      const next = update(head, mkHnf(innerBinders, argIndexes, fresh, kept), updated);
      return [appBounds(fresh, projectedBounds), next];
    }
    throw new NotPattern();
  };
  if (isDownto0(indexes, binders.length - 1)) return [term, envir];
  return projectTerm(term, envir, 0, binders);
};

const mkFfList = (left: readonly number[], right: readonly number[]) => {
  if (left.length !== right.length) throw new TlaIsabelleError("TERM", "mk_ff_list");
  return left.flatMap((index, position) =>
    index === right[position] ? [left.length - 1 - position] : [],
  );
};

const flexflex1 = (
  envir: Envir,
  binders: readonly Binder[],
  variable: Var,
  left: readonly number[],
  right: readonly number[],
) =>
  left.length === right.length && left.every((index, position) => index === right[position])
    ? envir
    : mkNewHnf(envir, binders, left, variable, mkFfList(left, right));

const flexflex2 = (
  envir: Envir,
  binders: readonly Binder[],
  leftVar: Var,
  leftIndexes: readonly number[],
  rightVar: Var,
  rightIndexes: readonly number[],
) => {
  const assign = (
    first: Var,
    firstIndexes: readonly number[],
    second: Var,
    secondIndexes: readonly number[],
  ) => {
    if (secondIndexes.every((index) => firstIndexes.includes(index))) {
      const term = mkAbsOver(
        binders,
        firstIndexes,
        appBounds(
          second,
          secondIndexes.map((index) => indexOf(firstIndexes, index)),
        ),
      );
      return update(first, term, envir);
    }
    const common = firstIndexes.filter((index) => secondIndexes.includes(index));
    const [updated, fresh] = genvar(
      second.name,
      envir,
      typeOfG(
        envir,
        first.type,
        firstIndexes.length,
        common.map((index) => indexOf(firstIndexes, index)),
      ),
    );
    const lam = (indexes: readonly number[]) =>
      mkAbsOver(
        binders,
        indexes,
        appBounds(
          fresh,
          common.map((index) => indexOf(indexes, index)),
        ),
      );
    return update(second, lam(secondIndexes), update(first, lam(firstIndexes), updated));
  };
  return indexnameOrd(rightVar, leftVar) < 0
    ? assign(leftVar, leftIndexes, rightVar, rightIndexes)
    : assign(rightVar, rightIndexes, leftVar, leftIndexes);
};

// Pattern.unify_types: undefined where Isabelle raises Unif.
export const unifyTypesEnvir = (left: Typ, right: Typ, envir: Envir): Envir | undefined => {
  if (eqTyp(left, right)) return envir;
  const tyenv = unifyTypes(right, left, envir.tyenv);
  return tyenv === undefined ? undefined : { ...envir, tyenv };
};

const unifyTypesOrFail = (left: Typ, right: Typ, envir: Envir) => {
  const result = unifyTypesEnvir(left, right, envir);
  if (result === undefined) throw new Unif();
  return result;
};

const unif = (binders: readonly Binder[], left: Term, right: Term, envir: Envir): Envir => {
  const leftNorm = headNorm(envir, left);
  const rightNorm = headNorm(envir, right);
  if (leftNorm.kind === "Abs" && rightNorm.kind === "Abs") {
    const name = leftNorm.name === "" ? rightNorm.name : leftNorm.name;
    return unif(
      [{ name, type: leftNorm.type }, ...binders],
      leftNorm.body,
      rightNorm.body,
      unifyTypesOrFail(leftNorm.type, rightNorm.type, envir),
    );
  }
  if (leftNorm.kind === "Abs")
    return unif(
      [{ name: leftNorm.name, type: leftNorm.type }, ...binders],
      leftNorm.body,
      mkApp(incr(rightNorm), mkBound(0)),
      envir,
    );
  if (rightNorm.kind === "Abs")
    return unif(
      [{ name: rightNorm.name, type: rightNorm.type }, ...binders],
      mkApp(incr(leftNorm), mkBound(0)),
      rightNorm.body,
      envir,
    );
  return cases(binders, envir, leftNorm, rightNorm);
};

const unifArgs = (
  binders: readonly Binder[],
  left: readonly Term[],
  right: readonly Term[],
  envir: Envir,
) => {
  if (left.length !== right.length) throw new Unif();
  return left.reduce((state, item, index) => unif(binders, item, right[index], state), envir);
};

const cases = (binders: readonly Binder[], envir: Envir, left: Term, right: Term): Envir => {
  const [leftHead, leftArgs] = stripComb(left);
  const [rightHead, rightArgs] = stripComb(right);
  if (leftHead.kind === "Var" && rightHead.kind === "Var") {
    if (leftHead.name === rightHead.name && leftHead.index === rightHead.index)
      return flexflex1(
        envir,
        binders,
        leftHead,
        intsOfEnv(envir, leftArgs),
        intsOfEnv(envir, rightArgs),
      );
    return flexflex2(
      envir,
      binders,
      leftHead,
      intsOfEnv(envir, leftArgs),
      rightHead,
      intsOfEnv(envir, rightArgs),
    );
  }
  if (leftHead.kind === "Var")
    return flexRigid(envir, binders, leftHead, intsOfEnv(envir, leftArgs), right);
  if (rightHead.kind === "Var")
    return flexRigid(envir, binders, rightHead, intsOfEnv(envir, rightArgs), left);
  if (
    (leftHead.kind === "Const" && rightHead.kind === "Const") ||
    (leftHead.kind === "Free" && rightHead.kind === "Free")
  ) {
    if (leftHead.name !== rightHead.name) throw new Unif();
    return unifArgs(
      binders,
      leftArgs,
      rightArgs,
      unifyTypesOrFail(leftHead.type, rightHead.type, envir),
    );
  }
  if (leftHead.kind === "Bound" && rightHead.kind === "Bound") {
    if (leftHead.index !== rightHead.index) throw new Unif();
    return unifArgs(binders, leftArgs, rightArgs, envir);
  }
  if (leftHead.kind === "Abs" || rightHead.kind === "Abs") throw new NotPattern();
  throw new Unif();
};

const flexRigid = (
  envir: Envir,
  binders: readonly Binder[],
  variable: Var,
  indexes: readonly number[],
  term: Term,
) => {
  if (occurs(variable, term, envir)) throw new Unif();
  const [projected, updated] = project(term, envir, binders, indexes);
  return update(variable, mkAbsOver(binders, indexes, projected), updated);
};

export type PatternUnifyResult =
  | { kind: "unified"; envir: Envir }
  | { kind: "clash" }
  | { kind: "not a pattern" };

// Pattern.unify: distinguishes a clash (Unif) from terms outside the pattern fragment (Pattern).
export const unifyPattern = (left: Term, right: Term, envir: Envir): PatternUnifyResult => {
  try {
    return { kind: "unified", envir: unif([], left, right, envir) };
  } catch (error) {
    if (error instanceof Unif) return { kind: "clash" };
    if (error instanceof NotPattern) return { kind: "not a pattern" };
    throw error;
  }
};

export interface MatchEnv {
  readonly tyenv: TyEnv;
  readonly tenv: TEnv;
}

const typMatch = (pattern: Typ, object: Typ, tyenv: TyEnv) => {
  const result = matchTypes(pattern, object, tyenv);
  if (result === undefined) throw new Match();
  return result;
};

const updateNewTEnv = (tenv: TEnv, variable: Var, term: Term): TEnv => {
  if (hasKey(tenv, variable)) throw new TlaIsabelleError("TERM", "Vartab.update_new: duplicate");
  return updateTable(
    tenv,
    { name: variable.name, index: variable.index },
    { type: variable.type, term },
  );
};

const firstOrderMatch = (pattern: Term, object: Term, env: MatchEnv): MatchEnv => {
  const visit = (isInAbs: boolean, state: MatchEnv, pat: Term, obj: Term): MatchEnv => {
    if (pat.kind === "Var") {
      if (isInAbs && isOpen(obj)) throw new Match();
      const assigned = lookup1(state.tenv, pat);
      if (assigned === undefined)
        return {
          tyenv: typMatch(pat.type, fastypeOf(obj), state.tyenv),
          tenv: updateNewTEnv(state.tenv, pat, obj),
        };
      if (aeconv(obj, assigned)) return state;
      throw new Match();
    }
    if (
      (pat.kind === "Free" && obj.kind === "Free") ||
      (pat.kind === "Const" && obj.kind === "Const")
    ) {
      if (pat.name !== obj.name) throw new Match();
      return { tyenv: typMatch(pat.type, obj.type, state.tyenv), tenv: state.tenv };
    }
    if (pat.kind === "Bound" && obj.kind === "Bound") {
      if (pat.index !== obj.index) throw new Match();
      return state;
    }
    if (pat.kind === "Abs" && obj.kind === "Abs")
      return visit(
        true,
        { tyenv: typMatch(pat.type, obj.type, state.tyenv), tenv: state.tenv },
        pat.body,
        obj.body,
      );
    if (pat.kind === "App" && obj.kind === "App")
      return visit(isInAbs, visit(isInAbs, state, pat.fun, obj.fun), pat.arg, obj.arg);
    if (obj.kind === "Abs") return visit(true, state, mkApp(incr(pat), mkBound(0)), obj.body);
    throw new Match();
  };
  return visit(false, env, pattern, object);
};

const matchBind = (
  tenv: TEnv,
  binders: readonly Binder[],
  variable: Var,
  indexes: readonly number[],
  term: Term,
): TEnv => {
  const loose = looseBnos(term);
  if (indexes.length === 0) {
    if (loose.length === 0) return updateNewTEnv(tenv, variable, term);
    throw new Match();
  }
  if (!loose.every((index) => indexes.includes(index))) throw new Match();
  const body = isDownto0(indexes, binders.length - 1)
    ? term
    : mapBound((index) => indexOf(indexes, index), term);
  return updateNewTEnv(tenv, variable, mkAbsOver(binders, indexes, body));
};

const higherOrderMatch = (pattern: Term, object: Term, env: MatchEnv): MatchEnv => {
  const visit = (binders: readonly Binder[], pat: Term, obj: Term, state: MatchEnv): MatchEnv => {
    if (pat.kind === "Abs") {
      if (obj.kind === "Abs")
        return visit([{ name: obj.name, type: obj.type }, ...binders], pat.body, obj.body, state);
      const type = substType(state.tyenv, pat.type);
      return visit(
        [{ name: pat.name, type }, ...binders],
        pat.body,
        mkApp(incr(obj), mkBound(0)),
        state,
      );
    }
    if (obj.kind === "Abs")
      return visit(
        [{ name: obj.name, type: obj.type }, ...binders],
        mkApp(incr(pat), mkBound(0)),
        obj.body,
        state,
      );
    return matchCases(binders, state, pat, obj);
  };
  const matchCases = (
    binders: readonly Binder[],
    state: MatchEnv,
    pat: Term,
    obj: Term,
  ): MatchEnv => {
    const [patHead, patArgs] = stripComb(pat);
    const rigidArgs = (tyenv: TyEnv, objArgs: readonly Term[]) => {
      if (patArgs.length !== objArgs.length) throw new Match();
      return patArgs.reduce((result, arg, index) => visit(binders, arg, objArgs[index], result), {
        tyenv,
        tenv: state.tenv,
      });
    };
    if (patHead.kind === "Var") {
      const indexes = intsOf(patArgs);
      const assigned = lookup1(state.tenv, patHead);
      if (assigned === undefined)
        return { tyenv: state.tyenv, tenv: matchBind(state.tenv, binders, patHead, indexes, obj) };
      if (aeconv(obj, red(assigned, indexes, []))) return state;
      throw new Match();
    }
    const [objHead, objArgs] = stripComb(obj);
    if (
      (patHead.kind === "Const" && objHead.kind === "Const") ||
      (patHead.kind === "Free" && objHead.kind === "Free")
    ) {
      if (patHead.name !== objHead.name) throw new Match();
      return rigidArgs(typMatch(patHead.type, objHead.type, state.tyenv), objArgs);
    }
    if (patHead.kind === "Bound" && objHead.kind === "Bound") {
      if (patHead.index !== objHead.index) throw new Match();
      return rigidArgs(state.tyenv, objArgs);
    }
    if (patHead.kind === "Abs" || objHead.kind === "Abs") throw new NotPattern();
    throw new Match();
  };
  const initial = {
    tyenv: typMatch(fastypeOf(pattern), fastypeOf(object), env.tyenv),
    tenv: env.tenv,
  };
  try {
    return visit([], pattern, object, initial);
  } catch (error) {
    if (error instanceof NotPattern) return firstOrderMatch(pattern, object, initial);
    throw error;
  }
};

const catchMatch = (run: () => MatchEnv): MatchEnv | undefined => {
  try {
    return run();
  } catch (error) {
    if (error instanceof Match) return undefined;
    throw error;
  }
};

// Pattern.match: undefined where Isabelle raises MATCH.
export const matchPattern = (pattern: Term, object: Term, env: MatchEnv): MatchEnv | undefined =>
  catchMatch(() => higherOrderMatch(pattern, object, env));

// Pattern.first_order_match
export const firstOrderMatchPattern = (
  pattern: Term,
  object: Term,
  env: MatchEnv,
): MatchEnv | undefined => catchMatch(() => firstOrderMatch(pattern, object, env));

// Pattern.matches
export const matches = (pattern: Term, object: Term, tyenv: TyEnv, tenv: TEnv) =>
  matchPattern(pattern, object, { tyenv, tenv }) !== undefined;

// Pattern.pattern
export const isPattern = (term: Term): boolean => {
  if (term.kind === "Abs") return isPattern(term.body);
  const [head, args] = stripComb(term);
  if (head.kind === "Var")
    return (
      args.every((arg) => arg.kind === "Bound") &&
      !args.some((arg, index) => args.findIndex((other) => aconv(other, arg)) !== index)
    );
  return args.every(isPattern);
};

// Pattern.first_order
export const isFirstOrder = (term: Term): boolean => {
  if (term.kind === "Abs") return isFirstOrder(term.body);
  if (term.kind === "App")
    return term.fun.kind !== "Var" && isFirstOrder(term.fun) && isFirstOrder(term.arg);
  return true;
};

// Pattern.match_rew
export const matchRew = (term: Term, lhs: Term, rhs: Term): [Term, Term] | undefined => {
  const renamed = renameAbs(lhs, term, rhs) ?? rhs;
  const env = matchPattern(lhs, term, { tyenv: emptyTyEnv, tenv: emptyTEnv });
  return env === undefined ? undefined : [substTerm(env.tyenv, env.tenv, renamed), renamed];
};
