// Ported from Z3 (src/tactic/core/reduce_args_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AS_ARRAY,
  OP_BADD,
  OP_BV_NUM,
  OP_ITE,
} from "./ast";
import type { Definition, Goal } from "./goal";
import { combineHash, hashU } from "./hash";
import { ObjMap } from "./hashtable";
import { RewriterTpl } from "./rewriter-tpl";

const GOLDEN_RATIO = 0x9e3779b9;

interface ArgFuncs {
  byKey: Map<string, number>;
  funcs: ObjMap<number>;
}

const forEachSubterm = (manager: AstManager, goal: Goal, visit: (expr: number) => void) => {
  const visited = new Set<number>();
  for (const form of goal.forms.items) {
    manager.limit.checkpoint();
    const todo = [form];
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      if (visited.has(expr)) {
        todo.pop();
        continue;
      }
      const children =
        manager.kinds[expr] === KIND_QUANTIFIER
          ? [
              manager.getQuantifier(expr).body,
              ...manager.getQuantifier(expr).patterns,
              ...manager.getQuantifier(expr).noPatterns,
            ]
          : manager.kinds[expr] === KIND_APP
            ? manager.getArgs(expr)
            : [];
      const pending = children.filter((child) => !visited.has(child));
      if (pending.length > 0) {
        todo.push(...pending.toReversed());
        continue;
      }
      todo.pop();
      visited.add(expr);
      visit(expr);
    }
  }
};

// may_be_unique: the base of a bit-vector offset, or the term itself, is null for a unique value.
const getUniqueBase = (manager: AstManager, expr: number) => {
  if (manager.isUniqueValue(expr)) return null;
  const isOffset =
    manager.getOp(expr) === OP_BADD &&
    manager.getNumArgs(expr) === 2 &&
    manager.getOp(manager.getArg(expr, 0)) === OP_BV_NUM;
  const base = isOffset ? manager.getArg(expr, 1) : expr;
  return manager.isGround(base) ? base : undefined;
};

const isUserApp = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_APP &&
  manager.getNumArgs(expr) > 0 &&
  manager.funcDecls[manager.decls[expr]].family === FAMILY_USER;

const getArgsHash = (manager: AstManager, app: number, bits: boolean[]) => {
  let hash = GOLDEN_RATIO;
  for (const [index, arg] of manager.getArgs(app).entries())
    if (bits[index]) hash = combineHash(hashU(hash), hashU(manager.ids[arg]));
  return hash;
};

class ReduceArgsRewriter extends RewriterTpl {
  readonly declToArgFuncs: ObjMap<ArgFuncs>;

  constructor(
    manager: AstManager,
    private declToArgs: Map<number, boolean[]>,
  ) {
    super(manager);
    this.declToArgFuncs = new ObjMap((decl) => manager.getDeclHash(decl));
  }

  checkMaxSteps() {
    this.manager.limit.checkpoint();
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    if (funcDecl.domain.length === 0 || funcDecl.family !== FAMILY_USER) return -1;
    const bits = this.declToArgs.get(decl);
    if (bits === undefined) return -1;
    let argFuncs = this.declToArgFuncs.get(decl);
    if (argFuncs === undefined) {
      argFuncs = {
        byKey: new Map(),
        funcs: new ObjMap((app) => getArgsHash(manager, app, bits)),
      };
      this.declToArgFuncs.set(decl, argFuncs);
    }
    const app = manager.mkApp(decl, args, sort);
    manager.incRef(app);
    const key = args.filter((_arg, index) => bits[index]).join(",");
    const representative = argFuncs.byKey.get(key);
    const newDecl =
      representative === undefined
        ? manager.mkFreshFuncDecl(
            funcDecl.name,
            funcDecl.domain.filter((_sort, index) => !bits[index]),
            funcDecl.range,
          )
        : (argFuncs.funcs.get(representative) as number);
    if (representative === undefined) {
      argFuncs.byKey.set(key, app);
      argFuncs.funcs.set(app, newDecl);
      manager.incRef(app);
      manager.incDeclRef(newDecl);
    }
    const result = manager.mkApp(
      newDecl,
      args.filter((_arg, index) => !bits[index]),
      sort,
    );
    manager.incRef(result);
    manager.decRef(app);
    return result;
  }
}

const getDefinitions = (
  manager: AstManager,
  declToArgs: Map<number, boolean[]>,
  declToArgFuncs: ObjMap<ArgFuncs>,
) => {
  const definitions: Definition[] = [];
  for (const argFuncs of declToArgFuncs.entries())
    for (const newDecl of argFuncs[1].funcs.entries())
      definitions.push({ decl: newDecl[1], def: -1 });
  for (const [decl, argFuncs] of declToArgFuncs.entries()) {
    const funcDecl = manager.funcDecls[decl];
    const bits = declToArgs.get(decl) as boolean[];
    const vars = funcDecl.domain.map((sort, index) => manager.mkVar(index, sort));
    const newArgs = vars.filter((_var, index) => !bits[index]);
    let def = -1;
    for (const [app, newDecl] of argFuncs.funcs.entries()) {
      const newApp = manager.mkApp(newDecl, newArgs, funcDecl.range);
      if (def === -1) {
        def = newApp;
        continue;
      }
      const eqs = vars.flatMap((variable, index) =>
        bits[index] ? [manager.mkEq(variable, manager.getArg(app, index))] : [],
      );
      def = manager.mkApp(OP_ITE, [manager.mkAnd(eqs), newApp, def], funcDecl.range);
    }
    definitions.push({ decl, def });
  }
  return definitions;
};

const reduce = (manager: AstManager, goal: Goal) => {
  if (goal.isInconsistent) return;
  const nonCandidates = new Set<number>();
  forEachSubterm(manager, goal, (expr) => {
    if (manager.kinds[expr] !== KIND_APP) return;
    if (manager.getOp(expr) === OP_AS_ARRAY) {
      nonCandidates.add(manager.funcDecls[manager.decls[expr]].parameters[0]);
      return;
    }
    if (!isUserApp(manager, expr) || nonCandidates.has(manager.decls[expr])) return;
    if (manager.getArgs(expr).some((arg) => getUniqueBase(manager, arg) !== undefined)) return;
    nonCandidates.add(manager.decls[expr]);
  });
  const declToArgs = new Map<number, boolean[]>();
  const declToBases = new Map<number, (number | null | undefined)[]>();
  forEachSubterm(manager, goal, (expr) => {
    if (!isUserApp(manager, expr) || nonCandidates.has(manager.decls[expr])) return;
    const decl = manager.decls[expr];
    const bases = manager.getArgs(expr).map((arg) => getUniqueBase(manager, arg));
    const bits = declToArgs.get(decl);
    if (bits === undefined) {
      declToArgs.set(
        decl,
        bases.map((base) => base !== undefined),
      );
      declToBases.set(decl, bases);
      return;
    }
    const firstBases = declToBases.get(decl) as (number | null | undefined)[];
    for (const [index, base] of bases.entries())
      bits[index] = bits[index] && base !== undefined && firstBases[index] === base;
  });
  for (const [decl, bits] of declToArgs) if (!bits.includes(true)) declToArgs.delete(decl);
  if (declToArgs.size === 0) return;
  const rewriter = new ReduceArgsRewriter(manager, declToArgs);
  const end = goal.forms.size;
  for (let index = 0; index < end && !goal.isInconsistent; index++) {
    const rewritten = rewriter.rewrite(goal.forms.items[index]);
    goal.update(index, rewritten);
    manager.decRef(rewritten);
  }
  const definitions = getDefinitions(manager, declToArgs, rewriter.declToArgFuncs);
  goal.addDefinitions(definitions);
  rewriter.release();
  for (const argFuncs of rewriter.declToArgFuncs.entries())
    for (const [app, newDecl] of argFuncs[1].funcs.entries()) {
      manager.decRef(app);
      manager.decDeclRef(newDecl);
    }
};

export const reduceArgs = (manager: AstManager, goal: Goal) => {
  if (goal.isCoresEnabled)
    throw new SmtTacticError("reduce-args does not support unsat core production");
  if (!goal.isProofsEnabled) reduce(manager, goal);
  goal.depth++;
};
