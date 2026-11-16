// Ported from Z3 (src/muz/spacer/spacer_ind_lemma_generalizer.cpp,
// src/muz/spacer/spacer_generalizers.cpp, src/muz/spacer/spacer_util.cpp), MIT license, see
// z3-license.txt.
import { MBQI_MAX_ITERATIONS } from "../context";
import { SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  FAMILY_ARRAY,
  FAMILY_DATATYPE,
  FAMILY_USER,
  isArithSort,
  KIND_APP,
  OP_EQ,
  OP_GE,
  OP_LE,
  OP_MOD,
  SORT_BOOL,
} from "../ast";
import { L_FALSE } from "../lbool";
import { SmtKernel } from "../smt-kernel";
import type { Lemma, SpacerContext } from "./spacer-context";
import { mkAndOf, pin } from "./spacer-util";

export type LemmaGeneralizer = (lemma: Lemma) => void;

const getSortFamilyOf = (manager: AstManager, expr: number) =>
  manager.getSortFamily(manager.sorts[expr]);

const expandLiterals = (manager: AstManager, conjs: number[]) => {
  for (let index = 0; index < conjs.length; index++) {
    const expr = conjs[index];
    if (manager.getOp(expr) !== OP_EQ) continue;
    const left = manager.getArg(expr, 0);
    const right = manager.getArg(expr, 1);
    if (
      isArithSort(manager.sorts[left]) &&
      manager.getOp(left) !== OP_MOD &&
      manager.getOp(right) !== OP_MOD
    ) {
      conjs[index] = pin(manager, manager.mkApp(OP_LE, [left, right], SORT_BOOL));
      const ge = pin(manager, manager.mkApp(OP_GE, [left, right], SORT_BOOL));
      if (index + 1 === conjs.length) conjs.push(ge);
      else {
        conjs.push(conjs[index + 1]);
        conjs[index + 1] = ge;
      }
      index++;
    } else if (
      getSortFamilyOf(manager, left) === FAMILY_DATATYPE ||
      manager.isBvSort(manager.sorts[left])
    )
      throw new SmtUnsupportedError("weakening datatype and bit-vector literals of spacer lemmas");
  }
};

const mkInductiveGeneralizer = (context: SpacerContext): LemmaGeneralizer => {
  const manager = context.manager;
  const trueExpr = manager.trueExpr;
  return (lemma) => {
    if (lemma.getCube().length === 0) return;
    const pt = (lemma.pob as NonNullable<Lemma["pob"]>).pt;
    let level = lemma.level;
    const cube = [...lemma.getCube()];
    let core: number[] = [];

    const loadCubeToCore = () => {
      core = cube.filter((lit) => lit !== trueExpr);
    };

    const isCubeInductive = () => {
      loadCubeToCore();
      if (core.length === 0) return false;
      const usedLevel = pt.checkInductive(level, core);
      if (usedLevel === undefined) return false;
      level = Math.max(level, usedLevel);
      return true;
    };

    const updateCubeByCore = (from: number) => {
      const marked = new Set(core);
      let success = 0;
      for (let index = from; index < cube.length; index++) {
        if (cube[index] === trueExpr || marked.has(cube[index])) continue;
        cube[index] = trueExpr;
        success++;
      }
      return success;
    };

    const generalizeCore = (from: number) => {
      if (core.length === 0) return 0;
      const usedLevel = pt.checkInductive(level, core);
      if (usedLevel === undefined) return 0;
      const success = updateCubeByCore(from);
      level = Math.max(level, usedLevel);
      return success;
    };

    const generalize1 = (litIndex: number) => {
      core = cube.filter((lit, index) => lit !== trueExpr && index !== litIndex);
      return generalizeCore(litIndex);
    };

    const generalizeRange = (from: number, to: number) => {
      let success = 0;
      for (let index = from; index < to; index++) success += generalize1(index);
      return success;
    };

    const weaken1 = (litIndex: number) => {
      if (cube[litIndex] === trueExpr) return 0;
      let success = 0;
      const cubeSize = cube.length;
      const saved = cube[litIndex];
      cube[litIndex] = trueExpr;
      const weakening = [saved];
      expandLiterals(manager, weakening);
      if (weakening[0] !== saved) {
        cube.push(...weakening);
        success +=
          cube.length - cubeSize >= 2
            ? generalizeRange(cubeSize, cube.length)
            : isCubeInductive()
              ? 1
              : 0;
      }
      if (success === 0) {
        cube[litIndex] = saved;
        cube.length = cubeSize;
      }
      return success;
    };

    const weakenRange = (from: number, to: number) => {
      let success = 0;
      for (let index = from; index < to; index++) success += weaken1(index);
      return success;
    };

    let numGens = generalizeRange(0, cube.length);
    const cubeSize = cube.length;
    numGens += weakenRange(0, cubeSize);
    if (cubeSize < cube.length) numGens += weakenRange(cubeSize, cube.length);
    if (numGens === 0) return;
    lemma.updateCube(
      lemma.pob,
      cube.filter((lit) => lit !== trueExpr),
    );
    lemma.setLevel(level);
  };
};

const isArrayEq = (manager: AstManager, expr: number) =>
  manager.getOp(expr) === OP_EQ &&
  manager
    .getArgs(expr)
    .every(
      (arg) =>
        manager.kinds[arg] === KIND_APP &&
        manager.getFamily(arg) === FAMILY_USER &&
        manager.getNumArgs(arg) === 0 &&
        getSortFamilyOf(manager, arg) === FAMILY_ARRAY,
    );

const collectArraySymbols = (manager: AstManager, root: number) => {
  const symbols = new Set<number>();
  let arraySort = -1;
  const visited = new Set<number>();
  const todo = [root];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr) || manager.kinds[expr] !== KIND_APP) continue;
    visited.add(expr);
    manager.pushArgs(expr, todo);
    if (manager.getFamily(expr) !== FAMILY_USER || getSortFamilyOf(manager, expr) !== FAMILY_ARRAY)
      continue;
    if (arraySort !== -1 && arraySort !== manager.sorts[expr]) continue;
    arraySort = manager.sorts[expr];
    symbols.add(manager.decls[expr]);
  }
  return symbols;
};

const mkArrayEqGeneralizer =
  (context: SpacerContext): LemmaGeneralizer =>
  (lemma) => {
    const manager = context.manager;
    const core = [...lemma.getCube()];
    const symbols = [...collectArraySymbols(manager, mkAndOf(manager, core))];
    if (symbols.length <= 1 || symbols.length > 8) return;
    const eqs: number[] = [];
    for (let first = 0; first < symbols.length; first++)
      for (let second = first + 1; second < symbols.length; second++) {
        const mkConst = (decl: number) => manager.mkApp(decl, [], manager.funcDecls[decl].range);
        eqs.push(pin(manager, manager.mkEq(mkConst(symbols[first]), mkConst(symbols[second]))));
      }
    const solver = new SmtKernel(manager, {
      isMbqi: true,
      isFindingMacros: false,
      mbqiMaxIterations: MBQI_MAX_ITERATIONS,
    });
    const lits = [...core];
    let isDirty = false;
    for (let index = 0; index < core.length; index++) {
      if (manager.isNot(lits[index]) && isArrayEq(manager, manager.getArg(lits[index], 0)))
        continue;
      solver.push();
      solver.assertExpr(lits[index]);
      for (const eq of eqs) {
        solver.push();
        solver.assertExpr(eq);
        const result = solver.check([]);
        solver.pop(1);
        if (result === L_FALSE) {
          lits[index] = pin(manager, manager.mkNot(eq));
          isDirty = true;
          break;
        }
      }
      solver.pop(1);
    }
    if (!isDirty) return;
    const pob = lemma.pob as NonNullable<Lemma["pob"]>;
    const usedLevel = pob.pt.checkInductive(lemma.level, lits);
    if (usedLevel === undefined) return;
    lemma.updateCube(pob, lits);
    lemma.setLevel(usedLevel);
  };

export const mkLemmaGeneralizers = (context: SpacerContext) => {
  const params = context.params;
  if (
    params.getBool("spacer.use_euf_gen", false) ||
    params.getBool("spacer.use_lim_num_gen", false)
  )
    throw new SmtUnsupportedError("the euf and limit-number spacer generalizers");
  if (params.getBool("spacer.expand_bnd", false) || params.getBool("spacer.validate_lemmas", false))
    throw new SmtUnsupportedError("spacer.expand_bnd and spacer.validate_lemmas");
  const generalizers: LemmaGeneralizer[] = [];
  if (params.getBool("spacer.use_inductive_generalizer", true))
    generalizers.push(mkInductiveGeneralizer(context));
  if (params.getBool("spacer.use_array_eq_generalizer", true))
    generalizers.push(mkArrayEqGeneralizer(context));
  return generalizers;
};
