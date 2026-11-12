// Ported from Z3 (src/qe/nlqsat.cpp), MIT license, see z3-license.txt. Z3 registers only the
// satisfiability mode as a tactic, so the elimination mode of mk_nlqe_tactic is not ported.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_DIV,
  OP_DIV0,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_OR,
  OP_PATTERN,
  OP_POWER,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_REAL,
} from "./ast";
import { Goal } from "./goal";
import { goal2nlsat } from "./goal2nlsat";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { Anum } from "./nlsat/algebraic";
import { ScopedLiterals, TRUE_LITERAL } from "./nlsat/atoms";
import { NlsatSolver } from "./nlsat/solver";
import { ProtoModel } from "./proto-model";
import { getFreeVars, getMaxLevel, type MaxLevel, mergeLevel, mkLevel, NO_LEVEL } from "./qsat";
import { QuantifierHoister } from "./quant-hoist";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";
import type { Tactic } from "./tactic";

interface Div {
  num: number;
  den: number;
  name: number;
}

const isExists = (level: number) => level % 2 === 0;

const isUnsignedPositive = (value: Rational) =>
  value.isInt() && value.num > 0n && value.num < 2n ** 32n;

class DivRewriter extends RewriterTpl {
  readonly divs: Div[] = [];

  constructor(
    manager: AstManager,
    private trail: RefVector,
  ) {
    super(manager);
  }

  reduceApp(decl: number, args: number[]) {
    const manager = this.manager;
    if (decl !== OP_DIV || args.length !== 2) return -1;
    const [num, den] = args;
    if (
      manager.isNumeral(num) &&
      manager.isNumeral(den) &&
      !manager.getRationalValue(den).isZero()
    ) {
      const result = manager.mkRealNumeral(
        manager.getRationalValue(num).div(manager.getRationalValue(den)),
      );
      manager.incRef(result);
      return result;
    }
    if (!manager.isGround(num) || !manager.isGround(den)) return -1;
    const name = manager.mkFreshConst("div", SORT_REAL);
    this.trail.push(name);
    this.trail.push(num);
    this.trail.push(den);
    this.divs.push({ num, den, name });
    manager.incRef(name);
    return name;
  }
}

class Nlqsat {
  private solver: NlsatSolver;
  private isTrue = TRUE_LITERAL;
  private rmodel: (Anum | undefined)[] = [];
  private bmodel: number[] = [];
  private rmodel0: (Anum | undefined)[] = [];
  private bmodel0: number[] = [];
  private isValidModel = false;
  private boundRvars: number[][] = [];
  private boundBvars: number[][] = [];
  private preds: ScopedLiterals[] = [];
  private rvar2level: MaxLevel[] = [];
  private bvar2level = new Map<number, MaxLevel>();
  private a2b = new Map<number, number>();
  private t2x = new Map<number, number>();
  private b2a = new Map<number, number>();
  private asms: number[] = [];
  private cachedAsms: number[] = [];
  private cachedAsmsLim: number[] = [];
  private freeVars = new Set<number>();
  private divs: Div[] = [];
  private trail: RefVector;
  private goals: Goal[] = [];

  constructor(
    private manager: AstManager,
    seed: number,
    private cnf: Tactic,
  ) {
    this.solver = new NlsatSolver(manager.limit);
    this.solver.updtParams(seed, false);
    this.trail = new RefVector(manager);
  }

  private pin(expr: number) {
    this.trail.push(expr);
    return expr;
  }

  private pinOwned(expr: number) {
    this.trail.pushOwned(expr);
    return expr;
  }

  private get level() {
    return this.cachedAsmsLim.length;
  }

  private checkSat() {
    for (;;) {
      this.initAssumptions();
      const result = this.solver.checkAssumptions(this.asms);
      if (result === L_TRUE) {
        this.saveModel(isExists(this.level));
        this.push();
      } else if (result === L_FALSE) {
        if (this.level === 0) return L_FALSE;
        if (this.level === 1) return L_TRUE;
        this.project();
      } else return result;
    }
  }

  private initAssumptions() {
    const level = this.level;
    this.asms = [isExists(level) ? this.isTrue : this.isTrue ^ 1];
    if (!this.isValidModel) {
      this.asms.push(...this.cachedAsms);
      return;
    }
    this.unsaveModel();
    if (level === 0) return;
    if (level <= this.preds.length)
      for (const literal of this.preds[level - 1].literals)
        this.addLiteral(this.cachedAsms, literal);
    this.asms.push(...this.cachedAsms);
    for (let index = level + 1; index < this.preds.length; index += 2)
      for (const literal of this.preds[index].literals) {
        const predLevel = this.bvar2level.get(literal >> 1) as MaxLevel;
        const isUsed =
          (predLevel.fa === index && (predLevel.ex === NO_LEVEL || predLevel.ex < level)) ||
          (predLevel.ex === index && (predLevel.fa === NO_LEVEL || predLevel.fa < level));
        if (isUsed) this.addLiteral(this.asms, literal);
      }
    this.saveModel(isExists(level));
  }

  private addLiteral(literals: number[], literal: number) {
    literals.push(this.solver.value(literal) === L_FALSE ? literal ^ 1 : literal);
  }

  private saveModel(isExistential: boolean) {
    this.rmodel = this.solver.getRvalues();
    this.bmodel = this.solver.getBvalues(this.bvar2level.keys());
    this.isValidModel = true;
    if (!isExistential) return;
    this.rmodel0 = this.rmodel;
    this.bmodel0 = [...this.bmodel];
  }

  private unsaveModel() {
    this.solver.setRvalues(this.rmodel);
    this.solver.setBvalues(this.bmodel);
  }

  private clearModel() {
    this.isValidModel = false;
    this.rmodel = [];
    this.bmodel = [];
    this.solver.setRvalues(this.rmodel);
  }

  private mbp(level: number, result: ScopedLiterals) {
    const vars: number[] = [];
    const fvars = new Set<number>();
    for (let index = 0; index < this.boundRvars.length; index++) {
      if (index < level) for (const boolVar of this.boundBvars[index]) fvars.add(boolVar);
      else vars.push(...this.boundRvars[index]);
    }
    this.unsaveModel();
    const projected = new ScopedLiterals(this.solver.atoms);
    result.reset();
    for (const literal of this.asms)
      if (!this.b2a.has(literal >> 1) || fvars.has(literal >> 1)) result.push(literal);
    for (let index = vars.length - 1; index >= 0; index--) {
      this.solver.explain.projectVariable(vars[index], result.literals, projected);
      result.reset();
      result.literals = projected.literals;
      projected.literals = [];
    }
    for (let index = 0; index < result.size; index++) result.set(index, result.literals[index] ^ 1);
  }

  private getClauseLevel(clause: readonly number[]) {
    const level = mkLevel();
    for (const literal of clause) mergeLevel(level, this.getLevel(literal));
    return level;
  }

  private getLevel(literal: number) {
    const known = this.bvar2level.get(literal >> 1);
    if (known !== undefined) return known;
    const level = mkLevel();
    for (const variable of this.solver.vars(literal))
      mergeLevel(level, this.rvar2level[variable] ?? mkLevel());
    if (level.ex === NO_LEVEL && level.fa === NO_LEVEL)
      throw new SmtTacticError("level not in NRA");
    this.setLevel(literal >> 1, level);
    return level;
  }

  private setLevel(boolVar: number, level: MaxLevel) {
    const max = getMaxLevel(level);
    while (this.preds.length <= max) this.preds.push(new ScopedLiterals(this.solver.atoms));
    this.preds[max].push(2 * boolVar);
    this.solver.atoms.incRef(2 * boolVar);
    this.bvar2level.set(boolVar, level);
  }

  private project() {
    if (!this.isValidModel) {
      this.pop(1);
      return;
    }
    const clause = new ScopedLiterals(this.solver.atoms);
    this.mbp(this.level - 1, clause);
    const clauseLevel = getMaxLevel(this.getClauseLevel(clause.literals));
    clause.push(isExists(this.level) ? this.isTrue ^ 1 : this.isTrue);
    this.solver.mkExternalClause(clause.literals, null);
    clause.reset();
    // Past the last case, the projection has auxiliary variables from root objects.
    this.pop(
      clauseLevel === NO_LEVEL
        ? 2 * Math.floor(this.level / 2)
        : clauseLevel + 2 <= this.level
          ? this.level - clauseLevel
          : 2,
    );
  }

  private push() {
    this.cachedAsmsLim.push(this.cachedAsms.length);
  }

  private pop(numScopes: number) {
    this.clearModel();
    const level = this.level - numScopes;
    this.cachedAsms.length = this.cachedAsmsLim[level];
    this.cachedAsmsLim.length = level;
  }

  private checkPure(formula: number) {
    const manager = this.manager;
    let hasDivs = false;
    const visited = new Set<number>();
    const todo = [formula];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      const kind = manager.kinds[current];
      if (kind === KIND_VAR) {
        if (!manager.isReal(current) && !manager.isBool(current))
          throw new SmtTacticError("not NRA");
        continue;
      }
      if (kind === KIND_QUANTIFIER) {
        const data = manager.getQuantifier(current);
        todo.push(data.body, ...data.patterns, ...data.noPatterns);
        continue;
      }
      manager.pushArgs(current, todo);
      const op = manager.getOp(current);
      if (manager.getFamily(current) === FAMILY_BASIC && op !== OP_PATTERN) continue;
      if (
        manager.isUninterpretedConst(current) &&
        (manager.isReal(current) || manager.isBool(current))
      )
        continue;
      if (manager.getFamily(current) === FAMILY_ARITH) {
        if ([OP_MUL, OP_ADD, OP_SUB, OP_UMINUS, OP_LE, OP_GE, OP_LT, OP_GT].includes(op)) continue;
        if (manager.isNumeral(current)) continue;
        const exponent = op === OP_POWER ? manager.getArg(current, 1) : -1;
        if (
          exponent !== -1 &&
          manager.isNumeral(exponent) &&
          isUnsignedPositive(manager.getRationalValue(exponent))
        )
          continue;
        if (op === OP_DIV && manager.isGround(current)) {
          hasDivs = true;
          continue;
        }
      }
      throw new SmtTacticError("not NRA");
    }
    return hasDivs;
  }

  private ackermanizeDiv(formula: number, paxioms: RefVector) {
    const manager = this.manager;
    if (!this.checkPure(formula)) return formula;
    const rewriter = new DivRewriter(manager, this.trail);
    const rewritten = this.pinOwned(rewriter.rewrite(formula));
    rewriter.release();
    this.divs = rewriter.divs;
    const zero = this.pin(manager.mkRealNumeral(Rational.zero));
    const mk = (op: number, args: number[], sort = SORT_BOOL) =>
      this.pin(manager.mkApp(op, args, sort));
    for (const [index, div] of this.divs.entries()) {
      const isDenZero = mk(OP_EQ, [div.den, zero]);
      paxioms.push(
        mk(OP_OR, [isDenZero, mk(OP_EQ, [div.num, mk(OP_MUL, [div.den, div.name], SORT_REAL)])]),
      );
      for (const other of this.divs.slice(index + 1)) {
        const isDiffDen = this.pin(manager.mkNot(mk(OP_EQ, [div.den, other.den])));
        const isDiffNum = this.pin(manager.mkNot(mk(OP_EQ, [div.num, other.num])));
        paxioms.push(mk(OP_OR, [isDiffDen, isDiffNum, mk(OP_EQ, [div.name, other.name])]));
      }
    }
    return rewritten;
  }

  private getDiv0Body() {
    const manager = this.manager;
    const first = this.pin(manager.mkVar(0, SORT_REAL));
    const second = this.pin(manager.mkVar(1, SORT_REAL));
    return this.divs.reduce(
      (body, div) => {
        const isSameNum = this.pin(manager.mkApp(OP_EQ, [first, div.num], SORT_BOOL));
        const isSameDen = this.pin(manager.mkApp(OP_EQ, [second, div.den], SORT_BOOL));
        const isSame = this.pin(manager.mkApp(OP_AND, [isSameNum, isSameDen], SORT_BOOL));
        return this.pin(manager.mkApp(OP_ITE, [isSame, div.name, body], SORT_REAL));
      },
      this.pin(manager.mkRealNumeral(Rational.zero)),
    );
  }

  private hoist(input: number) {
    const manager = this.manager;
    const paxioms = new RefVector(manager);
    let formula = this.ackermanizeDiv(input, paxioms);
    const hoister = new QuantifierHoister(manager);
    const qvars: RefVector[] = [];
    const freeVars = new RefVector(manager);
    getFreeVars(
      manager,
      this.pin(manager.mkAnd([formula, this.pin(manager.mkAnd(paxioms.items))])),
      freeVars,
    );
    for (const freeVar of freeVars.items) this.freeVars.add(freeVar);
    qvars.push(freeVars);
    let isForall = false;
    formula = this.pinOwned(hoister.pullQuantifier(isForall, formula, freeVars));
    for (;;) {
      isForall = !isForall;
      const vars = new RefVector(manager);
      formula = this.pinOwned(hoister.pullQuantifier(isForall, formula, vars));
      qvars.push(vars);
      if (vars.size === 0) break;
    }
    hoister.release();
    for (const vars of qvars)
      for (const variable of vars.items) {
        this.pin(variable);
        if (manager.isBool(variable)) this.a2b.set(variable, this.solver.mkBoolVar());
        else this.t2x.set(variable, this.solver.mkVar(false));
      }
    const isTrue = this.pin(manager.mkFreshConst("is_true", SORT_BOOL));
    const goal = new Goal(manager);
    goal.assert(this.pin(manager.mkEq(isTrue, formula)));
    for (const paxiom of paxioms.items) goal.assert(paxiom);
    paxioms.reset();
    const [cnfGoal] = this.cnf(goal);
    this.goals.push(goal, cnfGoal);
    goal2nlsat(manager, cnfGoal.forms.items, this.solver, this.t2x, this.a2b, null);
    for (const [index, vars] of qvars.entries()) {
      const boundBvars: number[] = [];
      const boundRvars: number[] = [];
      this.boundBvars.push(boundBvars);
      this.boundRvars.push(boundRvars);
      for (const variable of vars.items) {
        const level = isExists(index) ? { ex: index, fa: NO_LEVEL } : { ex: NO_LEVEL, fa: index };
        const boolVar = this.a2b.get(variable);
        const realVar = this.t2x.get(variable);
        if (boolVar !== undefined) {
          boundBvars.push(boolVar);
          this.setLevel(boolVar, level);
        } else if (realVar !== undefined) {
          boundRvars.push(realVar);
          this.rvar2level[realVar] = level;
        }
      }
      vars.reset();
    }
    for (const [term, boolVar] of this.a2b) this.b2a.set(boolVar, term);
    this.isTrue = 2 * (this.a2b.get(isTrue) as number);
    for (const [boolVar, atom] of this.solver.atoms.atoms.entries())
      if (atom !== null) this.getLevel(2 * boolVar);
  }

  private mkModel() {
    const manager = this.manager;
    const model = new ProtoModel(manager);
    for (const [term, variable] of this.t2x) {
      if (!manager.isUninterpretedConst(term) || !this.freeVars.has(term)) continue;
      const value = this.rmodel0[variable] ?? new Anum(Rational.zero);
      model.registerConst(manager.decls[term], manager.mkAlgebraicNumeral(value, SORT_REAL));
    }
    for (const [atom, boolVar] of this.a2b) {
      if (
        !manager.isUninterpretedConst(atom) ||
        boolVar === this.isTrue >> 1 ||
        !this.freeVars.has(atom)
      )
        continue;
      const value = this.bmodel0[boolVar] ?? L_UNDEF;
      if (value === L_UNDEF) continue;
      model.registerConst(
        manager.decls[atom],
        value === L_TRUE ? manager.trueExpr : manager.falseExpr,
      );
    }
    return model;
  }

  apply(goal: Goal) {
    const manager = this.manager;
    this.hoist(this.pin(manager.mkAnd(goal.forms.items)));
    const result = this.checkSat();
    if (result === L_UNDEF) throw new SmtTacticError("search failed");
    goal.reset();
    goal.depth++;
    if (result === L_FALSE) {
      goal.assert(manager.falseExpr);
      return [goal];
    }
    goal.model = this.mkModel();
    if (this.divs.length > 0) goal.addDefinitions([{ decl: OP_DIV0, def: this.getDiv0Body() }]);
    return [goal];
  }

  release() {
    for (const goal of this.goals) goal.reset();
    this.trail.reset();
  }
}

export const runNlqsat = (manager: AstManager, seed: number, cnf: Tactic) => (goal: Goal) => {
  const nlqsat = new Nlqsat(manager, seed, cnf);
  try {
    return nlqsat.apply(goal);
  } finally {
    nlqsat.release();
  }
};
