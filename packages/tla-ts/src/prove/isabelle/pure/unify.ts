// Ported from Isabelle2025's Pure/unify.ML, Huet's higher-order unification with the search
// bound of 60. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen,
// and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import {
  envBinderTypes,
  envBodyType,
  fastype,
  genvar,
  genvars,
  headNorm,
  lookup,
  normTerm,
  update,
  vupdate,
  type Envir,
} from "./envir";
import { combound, rlistAbs, type Binder } from "./logic";
import { unifyPattern, unifyTypesEnvir } from "./pattern";
import {
  consSeq,
  emptySeq,
  itRightSeq,
  makeSeq,
  mapSeq,
  mapsSeq,
  singleSeq,
  type Seq,
} from "./seq";
import { indexnameOrd } from "./table";
import { lookupTyEnv } from "./type";
import {
  aconv,
  eqTyp,
  funTs,
  headOf,
  incrBoundvars,
  listComb,
  looseBnos,
  mkAbs,
  mkApp,
  mkBound,
  stripAbsBody,
  stripComb,
  type Term,
  type Typ,
  type Var,
} from "./term";

const SEARCH_BOUND = 60;

interface Dpair {
  readonly binders: readonly Binder[];
  readonly left: Term;
  readonly right: Term;
}

export type Tpair = readonly [Term, Term];

class CantUnify extends Error {}
class ChangeFail extends Error {}

const binderTypes = (binders: readonly Binder[]) => binders.map((binder) => binder.type);

const fastypeIn = (envir: Envir, binders: readonly Binder[], term: Term) =>
  fastype(envir, binderTypes(binders), term);

const etaNorm = (envir: Envir, binders: readonly Binder[], term: Term): Term => {
  const etif = (type: Typ, current: Term): Term => {
    if (type.kind === "Type" && type.name === "fun")
      return mkAbs(
        "",
        type.args[0],
        etif(type.args[1], mkApp(incrBoundvars(1, current), mkBound(0))),
      );
    if (type.kind === "TVar") {
      const assigned = lookupTyEnv(envir.tyenv, type);
      return assigned === undefined ? current : etif(assigned, current);
    }
    return current;
  };
  const etaNm = (scope: readonly Binder[], current: Term): Term =>
    current.kind === "Abs"
      ? mkAbs(
          current.name,
          current.type,
          etaNm([{ name: current.name, type: current.type }, ...scope], current.body),
        )
      : etif(fastypeIn(envir, scope, current), current);
  return etaNm(binders, term);
};

const sameIndexname = (
  left: { name: string; index: number },
  right: { name: string; index: number },
) => left.name === right.name && left.index === right.index;

const occursTerms = (seen: Var[], envir: Envir, variable: Var, terms: readonly Term[]): boolean => {
  const occur = (term: Term): boolean => {
    switch (term.kind) {
      case "Const":
      case "Bound":
      case "Free":
        return false;
      case "Var": {
        if (seen.some((other) => sameIndexname(other, term))) return false;
        if (sameIndexname(variable, term)) return true;
        seen.push(term);
        const assigned = lookup(envir, term);
        return assigned !== undefined && occur(assigned);
      }
      case "Abs":
        return occur(term.body);
      case "App":
        return occur(term.arg) || occur(term.fun);
    }
  };
  return terms.some(occur);
};

const headOfIn = (envir: Envir, term: Term): Term => {
  if (term.kind === "App") return headOfIn(envir, term.fun);
  if (term.kind === "Var") {
    const assigned = lookup(envir, term);
    return assigned === undefined ? term : headOfIn(envir, assigned);
  }
  return term;
};

type Occurrence = "none" | "nonrigid" | "rigid";

const rigidOccursTerm = (seen: Var[], envir: Envir, variable: Var, term: Term): Occurrence => {
  const nonrigid = (current: Term): Occurrence =>
    occursTerms(seen, envir, variable, [current]) ? "nonrigid" : "none";
  const occomb = (current: Term): Occurrence => {
    if (current.kind !== "App") return occur(current);
    const argument = occur(current.arg);
    if (argument === "rigid") return "rigid";
    const rest = occomb(current.fun);
    return rest === "none" ? argument : rest;
  };
  const occur = (current: Term): Occurrence => {
    switch (current.kind) {
      case "Const":
      case "Bound":
      case "Free":
        return "none";
      case "Var": {
        if (seen.some((other) => sameIndexname(other, current))) return "none";
        if (sameIndexname(variable, current)) return "rigid";
        seen.push(current);
        const assigned = lookup(envir, current);
        return assigned === undefined ? "none" : occur(assigned);
      }
      case "Abs":
        return occur(current.body);
      case "App": {
        const head = headOfIn(envir, current.fun);
        if (head.kind === "Var") return sameIndexname(variable, head) ? "rigid" : nonrigid(current);
        if (head.kind === "Abs") return nonrigid(current);
        return occomb(current);
      }
    }
  };
  return occur(term);
};

const unifyTypes = (left: Typ, right: Typ, envir: Envir) => {
  const result = unifyTypesEnvir(left, right, envir);
  if (result === undefined) throw new CantUnify();
  return result;
};

// get_eta_var: the variable a term eta-contracts to over the binders, or undefined for ASSIGN.
const getEtaVar = (binders: readonly Binder[], level: number, term: Term): Var | undefined => {
  if (binders.length === 0) return term.kind === "Var" ? term : undefined;
  if (term.kind === "App" && term.arg.kind === "Bound" && term.arg.index === level)
    return getEtaVar(binders.slice(1), level + 1, term.fun);
  return undefined;
};

// assignment: undefined where Isabelle raises ASSIGN.
const assignment = (
  binders: readonly Binder[],
  left: Term,
  right: Term,
  envir: Envir,
): Envir | undefined => {
  const variable = getEtaVar(binders, 0, left);
  if (variable === undefined) return undefined;
  const occurrence = rigidOccursTerm([], envir, variable, right);
  if (occurrence === "nonrigid") return undefined;
  if (occurrence === "rigid") throw new CantUnify();
  const unified = unifyTypes(
    envBodyType(envir, variable.type),
    fastypeIn(envir, binders, right),
    envir,
  );
  return update(variable, rlistAbs(binders, right), unified);
};

const newDpair = (
  binders: readonly Binder[],
  left: Term,
  right: Term,
  envir: Envir,
): [Dpair, Envir] => {
  if (left.kind === "Abs" && right.kind === "Abs") {
    const unified = unifyTypes(left.type, right.type, envir);
    const name = left.name === "" ? right.name : left.name;
    return newDpair([{ name, type: left.type }, ...binders], left.body, right.body, unified);
  }
  if (left.kind === "Abs" || right.kind === "Abs") throw new TlaIsabelleError("TERM", "new_dpair");
  return [{ binders, left, right }, envir];
};

const headNormDpair = (envir: Envir, dpair: Dpair) =>
  newDpair(
    dpair.binders,
    etaNorm(envir, dpair.binders, headNorm(envir, dpair.left)),
    etaNorm(envir, dpair.binders, headNorm(envir, dpair.right)),
    envir,
  );

interface Simplified {
  readonly envir: Envir;
  readonly flexflex: Dpair[];
  readonly flexrigid: Dpair[];
}

const simpl0 = (start: Dpair, state: Simplified): Simplified => {
  const [dpair, envir] = headNormDpair(state.envir, start);
  const simRands = (left: Term, right: Term, current: Simplified): Simplified => {
    if (left.kind === "App" && right.kind === "App")
      return simpl0(
        { binders: dpair.binders, left: left.arg, right: right.arg },
        simRands(left.fun, right.fun, current),
      );
    if (left.kind === "App" || right.kind === "App")
      throw new TlaIsabelleError("TERM", "SIMPL: operands mismatch");
    return current;
  };
  const leftHead = headOf(dpair.left);
  const rightHead = headOf(dpair.right);
  const rest = { flexflex: state.flexflex, flexrigid: state.flexrigid };
  if (leftHead.kind === "Var" && rightHead.kind === "Var") {
    const unified = unifyTypes(
      envBodyType(envir, leftHead.type),
      envBodyType(envir, rightHead.type),
      envir,
    );
    return { envir: unified, flexflex: [dpair, ...state.flexflex], flexrigid: state.flexrigid };
  }
  if (leftHead.kind === "Var") {
    const assigned = assignment(dpair.binders, dpair.left, dpair.right, envir);
    return assigned === undefined
      ? { envir, flexflex: state.flexflex, flexrigid: [dpair, ...state.flexrigid] }
      : { envir: assigned, ...rest };
  }
  if (rightHead.kind === "Var") {
    const assigned = assignment(dpair.binders, dpair.right, dpair.left, envir);
    return assigned === undefined
      ? {
          envir,
          flexflex: state.flexflex,
          flexrigid: [
            { binders: dpair.binders, left: dpair.right, right: dpair.left },
            ...state.flexrigid,
          ],
        }
      : { envir: assigned, ...rest };
  }
  if (
    (leftHead.kind === "Const" && rightHead.kind === "Const") ||
    (leftHead.kind === "Free" && rightHead.kind === "Free")
  ) {
    if (leftHead.name !== rightHead.name) throw new CantUnify();
    return simRands(dpair.left, dpair.right, {
      envir: unifyTypes(leftHead.type, rightHead.type, envir),
      ...rest,
    });
  }
  if (leftHead.kind === "Bound" && rightHead.kind === "Bound") {
    if (leftHead.index !== rightHead.index) throw new CantUnify();
    return simRands(dpair.left, dpair.right, { envir, ...rest });
  }
  throw new CantUnify();
};

const isChanged = (envir: Envir, term: Term): boolean => {
  if (term.kind === "App") return isChanged(envir, term.fun);
  return term.kind === "Var" && lookup(envir, term) !== undefined;
};

const simpl = (envir: Envir, dpairs: readonly Dpair[]): Simplified => {
  const all = dpairs.reduceRight<Simplified>((state, dpair) => simpl0(dpair, state), {
    envir,
    flexflex: [],
    flexrigid: [],
  });
  const remaining = [...all.flexrigid, ...all.flexflex];
  return remaining.some(
    (dpair) => isChanged(all.envir, dpair.left) || isChanged(all.envir, dpair.right),
  )
    ? simpl(all.envir, remaining)
    : all;
};

const makeArgs = (
  name: string,
  binder: readonly Typ[],
  envir: Envir,
  types: readonly Typ[],
): [Envir, Term[]] => {
  if (types.length === 0) return [envir, []];
  const [updated, vars] = genvars(
    name,
    envir,
    types.map((type) => funTs(binder, type)),
  );
  return [updated, vars.map((variable) => combound(variable, 0, binder.length))];
};

const typesAbs = (types: readonly Typ[], body: Term) =>
  types.reduceRight((result, type) => mkAbs("", type, result), body);

const stripType = (envir: Envir, type: Typ): [Typ[], Typ] => [
  envBinderTypes(envir, type),
  envBodyType(envir, type),
];

interface Copy {
  readonly term: Term;
  readonly envir: Envir;
  readonly dpairs: readonly Dpair[];
}

const matchcopy = (name: string) => {
  const copy = (
    binders: readonly Binder[],
    targs: readonly Term[],
    target: Term,
    envir: Envir,
    dpairs: readonly Dpair[],
  ): Seq<Copy> => {
    const copycons = (
      uarg: Term,
      prefix: { args: Term[]; envir: Envir; dpairs: readonly Dpair[] },
    ) =>
      mapSeq(
        (result: Copy) => ({
          args: [result.term, ...prefix.args],
          envir: result.envir,
          dpairs: result.dpairs,
        }),
        copy(
          binders,
          targs,
          etaNorm(prefix.envir, binders, headNorm(prefix.envir, uarg)),
          prefix.envir,
          prefix.dpairs,
        ),
      );
    const copyargs = (
      uargs: readonly Term[],
    ): Seq<{ args: Term[]; envir: Envir; dpairs: readonly Dpair[] }> =>
      uargs.length === 0
        ? consSeq({ args: [], envir, dpairs }, emptySeq)
        : mapsSeq((prefix) => copycons(uargs[0], prefix), copyargs(uargs.slice(1)));
    const [uhead, uargs] = stripComb(target);
    const base = envBodyType(envir, fastypeIn(envir, binders, uhead));
    const types = targs.map((targ) => fastypeIn(envir, binders, targ));
    const projenv = (
      head: Term,
      argTypes: Typ[],
      bodyType: Typ,
      targ: Term,
      tail: Seq<Copy>,
    ): Seq<Copy> => {
      const unified = unifyTypesEnvir(base, bodyType, envir);
      if (unified === undefined) return tail;
      return makeSeq(() => {
        try {
          const [withArgs, args] = makeArgs(name, types, unified, argTypes);
          const plugin = (arg: Term) => listComb(headOf(arg), targs);
          const dpair = { binders, left: listComb(targ, args.map(plugin)), right: target };
          const simplified = simpl(withArgs, [dpair, ...dpairs]);
          return [
            {
              term: listComb(head, args),
              envir: simplified.envir,
              dpairs: [...simplified.flexrigid, ...simplified.flexflex],
            },
            tail,
          ];
        } catch (error) {
          if (error instanceof CantUnify) return tail.pull();
          throw error;
        }
      });
    };
    const joinargs = (result: { args: Term[]; envir: Envir; dpairs: readonly Dpair[] }): Copy => ({
      term: listComb(uhead, result.args),
      envir: result.envir,
      dpairs: result.dpairs,
    });
    const matchfun = (projections: readonly [Term, Typ, Term][]): Seq<Copy> => {
      if (projections.length > 0) {
        const [bvar, type, targ] = projections[0];
        const [argTypes, bodyType] = stripType(envir, type);
        return projenv(bvar, argTypes, bodyType, targ, matchfun(projections.slice(1)));
      }
      return uhead.kind === "Const" || uhead.kind === "Free"
        ? mapSeq(joinargs, copyargs(uargs))
        : emptySeq;
    };
    if (uhead.kind === "Abs")
      return mapSeq(
        (result: Copy) => ({ ...result, term: mkAbs(uhead.name, uhead.type, result.term) }),
        copy(
          [{ name: uhead.name, type: uhead.type }, ...binders],
          [...targs.map((targ) => incrBoundvars(1, targ)), mkBound(0)],
          uhead.body,
          envir,
          dpairs,
        ),
      );
    if (uhead.kind === "Var") {
      const [updated, head] = genvar(uhead.name, envir, funTs(types, base));
      return singleSeq({
        term: combound(head, 0, types.length),
        envir: updated,
        dpairs: [{ binders, left: listComb(head, targs), right: target }, ...dpairs],
      });
    }
    const projections = types.map((type, index): [Term, Typ, Term] => [
      mkBound(types.length - 1 - index),
      type,
      targs[index],
    ]);
    return matchfun(projections.reverse());
  };
  return copy;
};

const match = (
  envir: Envir,
  dpair: Dpair,
  dpairs: readonly Dpair[],
): Seq<[Envir, readonly Dpair[]]> => {
  const [head, targs] = stripComb(dpair.left);
  if (head.kind !== "Var") throw new TlaIsabelleError("TERM", "MATCH");
  const types = envBinderTypes(envir, head.type);
  return mapSeq(
    (result: Copy): [Envir, readonly Dpair[]] => {
      const assigned = lookup(result.envir, head);
      return assigned === undefined
        ? [update(head, typesAbs(types, result.term), result.envir), result.dpairs]
        : [
            result.envir,
            [
              { binders: [], left: assigned, right: typesAbs(types, result.term) },
              ...result.dpairs,
            ],
          ];
    },
    matchcopy(head.name)(dpair.binders, targs, dpair.right, envir, dpairs),
  );
};

// ff_assign: undefined where Isabelle raises ASSIGN.
const ffAssign = (
  envir: Envir,
  binders: readonly Binder[],
  left: Term,
  right: Term,
): Envir | undefined => {
  const variable = getEtaVar(binders, 0, left);
  if (variable === undefined) return undefined;
  if (occursTerms([], envir, variable, [right])) return undefined;
  const unified = unifyTypes(
    envBodyType(envir, variable.type),
    fastypeIn(envir, binders, right),
    envir,
  );
  return vupdate(variable, rlistAbs(binders, right), unified);
};

interface Flarg {
  readonly index: number;
  readonly term: Term;
  readonly type: Typ;
}

const rigidBound = (level: number, banned: readonly number[], term: Term): boolean => {
  const [head, args] = stripComb(term);
  if (head.kind === "Bound")
    return (
      banned.includes(head.index - level) || args.some((arg) => rigidBound(level, banned, arg))
    );
  if (head.kind === "Var") return false;
  if (head.kind === "Abs")
    return (
      rigidBound(level + 1, banned, head.body) || args.some((arg) => rigidBound(level, banned, arg))
    );
  return args.some((arg) => rigidBound(level, banned, arg));
};

const changeBnos = (banned: readonly number[], term: Term) => {
  const change = (level: number, current: Term): Term => {
    if (current.kind === "Bound") {
      if (current.index < level) return current;
      if (banned.includes(current.index - level)) throw new ChangeFail();
      return mkBound(
        current.index - banned.filter((index) => index < current.index - level).length,
      );
    }
    if (current.kind === "Abs")
      return mkAbs(current.name, current.type, change(level + 1, current.body));
    if (current.kind === "App")
      return mkApp(change(level, current.fun), change(level, current.arg));
    return current;
  };
  return change(0, term);
};

const sortArgs = (args: readonly Flarg[]): Flarg[] => {
  const lessArg = (left: Flarg, right: Flarg) =>
    left.term.kind === "Bound" && right.term.kind === "Bound" && right.term.index < left.term.index;
  const insert = (item: Flarg, sorted: readonly Flarg[]): Flarg[] => {
    if (sorted.length === 0) return [item];
    return lessArg(sorted[0], item)
      ? [sorted[0], ...insert(item, sorted.slice(1))]
      : [item, ...sorted];
  };
  return args.length === 0 ? [] : insert(args[0], sortArgs(args.slice(1)));
};

const isDecreasing = (count: number, args: readonly Flarg[]): boolean =>
  args.length === 0
    ? count === 0
    : args[0].index === count - 1 && isDecreasing(count - 1, args.slice(1));

const cleanTerm = (banned: readonly number[], envir: Envir, term: Term): [Envir, Term] => {
  const [head, terms] = stripComb(term);
  if (head.kind !== "Var") throw new TlaIsabelleError("TERM", "clean_term");
  const [types, bodyType] = stripType(envir, head.type);
  if (terms.length !== types.length) throw new ChangeFail();
  const flexargs = terms.map((arg, position): Flarg => ({
    index: terms.length - 1 - position,
    term: arg,
    type: types[position],
  }));
  const changed = flexargs.reduceRight<Flarg[]>(
    (result, arg) =>
      rigidBound(0, banned, arg.term)
        ? result
        : [{ ...arg, term: changeBnos(banned, arg.term) }, ...result],
    [],
  );
  const args = sortArgs(changed);
  if (isDecreasing(types.length, args))
    return [
      envir,
      listComb(
        head,
        args.map((arg) => arg.term),
      ),
    ];
  const [withVar, fresh] = genvar(
    head.name,
    envir,
    funTs(
      args.map((arg) => arg.type),
      bodyType,
    ),
  );
  const body = listComb(
    fresh,
    args.map((arg) => mkBound(arg.index)),
  );
  const updated = vupdate(head, typesAbs(types, body), withVar);
  return [
    updated,
    normTerm(
      updated,
      listComb(
        fresh,
        args.map((arg) => arg.term),
      ),
    ),
  ];
};

const addTpair = (
  binders: readonly Binder[],
  left: Term,
  right: Term,
  tpairs: readonly Tpair[],
): Tpair[] => {
  if (aconv(left, right)) return [...tpairs];
  const leftAbs = rlistAbs(binders, left);
  const rightAbs = rlistAbs(binders, right);
  return tpairs.some((pair) => aconv(leftAbs, pair[0]) && aconv(rightAbs, pair[1]))
    ? [...tpairs]
    : [[leftAbs, rightAbs], ...tpairs];
};

const cleanFfpair = (dpair: Dpair, envir: Envir, tpairs: readonly Tpair[]): [Envir, Tpair[]] => {
  try {
    const leftLoose = looseBnos(dpair.left);
    const rightLoose = looseBnos(dpair.right);
    const banned: number[] = [];
    const kept: Binder[] = [];
    for (let index = dpair.binders.length - 1; index >= 0; index -= 1) {
      if (leftLoose.includes(index) && rightLoose.includes(index))
        kept.unshift(dpair.binders[index]);
      else banned.unshift(index);
    }
    const [leftEnvir, left] = cleanTerm(banned, envir, dpair.left);
    const [rightEnvir, right] = cleanTerm(banned, leftEnvir, dpair.right);
    const assigned =
      ffAssign(rightEnvir, kept, left, right) ?? ffAssign(rightEnvir, kept, right, left);
    return assigned === undefined
      ? [rightEnvir, addTpair(kept, left, right, tpairs)]
      : [assigned, [...tpairs]];
  } catch (error) {
    if (error instanceof ChangeFail)
      return [envir, addTpair(dpair.binders, dpair.left, dpair.right, tpairs)];
    throw error;
  }
};

const addFfpair = (dpair: Dpair, envir: Envir, tpairs: readonly Tpair[]): [Envir, Tpair[]] => {
  const left = normTerm(envir, dpair.left);
  const right = normTerm(envir, dpair.right);
  const leftHead = headOf(left);
  const rightHead = headOf(right);
  if (leftHead.kind !== "Var" || rightHead.kind !== "Var")
    throw new TlaIsabelleError("TERM", "add_ffpair: Vars expected");
  if (sameIndexname(leftHead, rightHead)) {
    if (!eqTyp(leftHead.type, rightHead.type))
      throw new TlaIsabelleError("TERM", "add_ffpair: Var name confusion");
    return [envir, addTpair(dpair.binders, left, right, tpairs)];
  }
  return indexnameOrd(leftHead, rightHead) < 0
    ? cleanFfpair({ binders: dpair.binders, left: right, right: left }, envir, tpairs)
    : cleanFfpair({ binders: dpair.binders, left, right }, envir, tpairs);
};

export interface Unifier {
  readonly envir: Envir;
  readonly tpairs: readonly Tpair[];
}

const hounifiers = (
  binders: readonly Binder[],
  envir: Envir,
  pairs: readonly Tpair[],
): Seq<Unifier> => {
  const addUnify = (
    depth: number,
    envirIn: Envir,
    dpairs: readonly Dpair[],
    rest: Seq<Unifier>,
  ): Seq<Unifier> =>
    makeSeq(() => {
      try {
        const simplified = simpl(envirIn, dpairs);
        if (simplified.flexrigid.length === 0) {
          const result = simplified.flexflex.reduceRight<[Envir, Tpair[]]>(
            (state, dpair) => addFfpair(dpair, state[0], state[1]),
            [simplified.envir, []],
          );
          return [{ envir: result[0], tpairs: result[1] }, rest];
        }
        if (depth > SEARCH_BOUND) return rest.pull();
        const [first, ...others] = simplified.flexrigid;
        return itRightSeq(
          (item: [Envir, readonly Dpair[]], tail: Seq<Unifier>) =>
            addUnify(depth + 1, item[0], item[1], tail),
          match(simplified.envir, first, [...others, ...simplified.flexflex]),
          rest,
        ).pull();
      } catch (error) {
        if (error instanceof CantUnify) return rest.pull();
        throw error;
      }
    });
  return addUnify(
    1,
    envir,
    pairs.map((pair) => ({ binders, left: pair[0], right: pair[1] })),
    emptySeq,
  );
};

// Unify.unifiers: pattern unification first, Huet's procedure outside the pattern fragment.
export const unifiers = (envir: Envir, pairs: readonly Tpair[]): Seq<Unifier> => {
  let current = envir;
  for (const pair of pairs) {
    const result = unifyPattern(pair[0], pair[1], current);
    if (result.kind === "clash") return emptySeq;
    if (result.kind === "not a pattern") return hounifiers([], envir, pairs);
    current = result.envir;
  }
  return singleSeq({ envir: current, tpairs: [] });
};

const varHeadOf = (envir: Envir, term: Term): Var => {
  const head = headOf(stripAbsBody(normTerm(envir, term)));
  if (head.kind !== "Var") throw new TlaIsabelleError("ERROR", "CANTUNIFY");
  return head;
};

const typeAbs = (envir: Envir, type: Typ, term: Term) =>
  typesAbs(envBinderTypes(envir, type), term);

const smashFlexflex1 = (pair: Tpair, envir: Envir): Envir => {
  const left = varHeadOf(envir, pair[0]);
  const right = varHeadOf(envir, pair[1]);
  const [withVar, fresh] = genvar(left.name, envir, envBodyType(envir, left.type));
  const updated = vupdate(right, typeAbs(withVar, right.type, fresh), withVar);
  return sameIndexname(left, right) && eqTyp(left.type, right.type)
    ? updated
    : vupdate(left, typeAbs(withVar, left.type, fresh), updated);
};

// Unify.smash_unifiers: unifiers with no remaining flex-flex pairs. A pair whose side is not
// flexible stops the sequence, as CANTUNIFY escapes Seq.map in Isabelle.
export const smashUnifiers = (pairs: readonly Tpair[], envir: Envir): Seq<Envir> =>
  mapSeq(
    (unifier: Unifier) =>
      unifier.tpairs.reduceRight((state, pair) => smashFlexflex1(pair, state), unifier.envir),
    unifiers(envir, pairs),
  );
