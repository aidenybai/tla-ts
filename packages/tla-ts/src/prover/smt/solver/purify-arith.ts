// Ported from Z3 (src/tactic/arith/purify_arith_tactic.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ACOS,
  OP_ADD,
  OP_AND,
  OP_ASIN,
  OP_ATAN,
  OP_COS,
  OP_DIV,
  OP_DIV0,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IDIV0,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MOD0,
  OP_MUL,
  OP_NEG_ROOT,
  OP_NOT,
  OP_OR,
  OP_POWER,
  OP_POWER0,
  OP_SIN,
  OP_TAN,
  OP_TO_INT,
  OP_TO_REAL,
  OP_U_ACOS,
  OP_U_ASIN,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import type { Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

interface BinDef {
  x: number;
  y: number;
  d: number;
}

interface PurifyOptions {
  isElimRootObjects: boolean;
  isElimInverses: boolean;
  isComplete: boolean;
}

class PurifyState {
  readonly pinned: RefVector;
  readonly unsafe = new Set<number>();
  isUnsafeFound = false;
  readonly sinCos: ObjMap<[number, number]>;
  readonly cannotPurify = new Set<number>();
  readonly appToFresh: ObjMap<number>;
  readonly newConstraints: number[] = [];
  readonly divs: BinDef[] = [];
  readonly idivs: BinDef[] = [];
  readonly mods: BinDef[] = [];
  ipower0 = -1;
  rpower0 = -1;

  constructor(
    readonly manager: AstManager,
    readonly goal: Goal,
    readonly options: PurifyOptions,
  ) {
    this.pinned = new RefVector(manager);
    this.sinCos = new ObjMap((expr) => manager.hashes[expr]);
    this.appToFresh = new ObjMap((expr) => manager.hashes[expr]);
    this.initCannotPurify();
  }

  pin(expr: number) {
    this.pinned.push(expr);
    return expr;
  }

  private forEachApp(visit: (expr: number) => void) {
    const manager = this.manager;
    const seen = new Set<number>();
    for (const form of this.goal.forms.items) {
      const todo = [form];
      for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
        if (seen.has(expr)) continue;
        seen.add(expr);
        if (manager.kinds[expr] === KIND_QUANTIFIER) {
          todo.push(manager.getQuantifier(expr).body);
          continue;
        }
        if (manager.kinds[expr] !== KIND_APP) continue;
        visit(expr);
        manager.pushArgs(expr, todo);
      }
    }
  }

  private initCannotPurify() {
    const manager = this.manager;
    this.forEachApp((expr) => {
      if (manager.getArgs(expr).some((arg) => !manager.isGround(arg)))
        this.cannotPurify.add(manager.decls[expr]);
    });
  }

  private findUnsafe() {
    if (this.isUnsafeFound) return;
    const manager = this.manager;
    this.forEachApp((expr) => {
      const op = manager.getFamily(expr) === FAMILY_ARITH ? manager.getOp(expr) : -1;
      if (op === OP_SIN || op === OP_COS) return;
      for (const arg of manager.getArgs(expr)) this.unsafe.add(arg);
    });
    this.isUnsafeFound = true;
  }

  convertBasis(theta: number): [number, number] | undefined {
    const manager = this.manager;
    if (manager.kinds[theta] !== KIND_APP || !manager.isUninterpretedConst(theta)) return undefined;
    this.findUnsafe();
    if (this.unsafe.has(theta)) return undefined;
    const existing = this.sinCos.get(theta);
    if (existing !== undefined) return existing;
    const pair: [number, number] = [
      this.pin(manager.mkFreshConst(null, SORT_REAL)),
      this.pin(manager.mkFreshConst(null, SORT_REAL)),
    ];
    this.sinCos.set(theta, pair);
    this.pin(theta);
    return pair;
  }
}

class PurifyRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private state: PurifyState,
  ) {
    super(manager);
  }

  private mk(op: number, args: number[], sort = SORT_BOOL) {
    return this.state.pin(this.manager.mkApp(op, args, sort));
  }

  private mkNumeral(value: Rational, isInt: boolean) {
    return this.state.pin(this.manager.mkNumeralOfSort(value, isInt ? SORT_INT : SORT_REAL));
  }

  private mkFreshVar(isInt: boolean) {
    return this.state.pin(this.manager.mkFreshConst(null, isInt ? SORT_INT : SORT_REAL));
  }

  private cacheResult(expr: number, result: number) {
    this.state.appToFresh.set(this.state.pin(expr), this.state.pin(result));
  }

  private pushConstraint(constraint: number) {
    this.state.newConstraints.push(constraint);
  }

  private processDiv(decl: number, args: number[]) {
    const state = this.state;
    const expr = this.mk(decl, args, SORT_REAL);
    const processed = state.appToFresh.get(expr);
    if (processed !== undefined) return processed;
    const fresh = this.mkFreshVar(false);
    this.cacheResult(expr, fresh);
    const [x, y] = args;
    const yIsZero = this.mk(OP_EQ, [y, this.mkNumeral(Rational.zero, false)]);
    this.pushConstraint(
      this.mk(OP_OR, [yIsZero, this.mk(OP_EQ, [this.mk(OP_MUL, [y, fresh], SORT_REAL), x])]),
    );
    if (state.options.isComplete)
      this.pushConstraint(
        this.mk(OP_OR, [
          this.mk(OP_NOT, [yIsZero]),
          this.mk(OP_EQ, [
            fresh,
            this.mk(OP_DIV, [x, this.mkNumeral(Rational.zero, false)], SORT_REAL),
          ]),
        ]),
      );
    state.divs.push({ x, y, d: fresh });
    return fresh;
  }

  private processIdiv(decl: number, args: number[]) {
    const manager = this.manager;
    const state = this.state;
    const divApp = this.mk(decl, args, SORT_INT);
    const processed = state.appToFresh.get(divApp);
    if (processed !== undefined) return processed;
    const quotient = this.mkFreshVar(true);
    this.cacheResult(divApp, quotient);
    const remainder = this.mkFreshVar(true);
    const [x, y] = args;
    const modApp = this.mk(OP_MOD, [x, y], SORT_INT);
    this.cacheResult(modApp, remainder);
    state.mods.push({ x, y, d: remainder });
    const zero = this.mkNumeral(Rational.zero, true);
    const yIsZero = this.mk(OP_EQ, [y, zero]);
    const product = this.mk(OP_MUL, [quotient, y], SORT_INT);
    this.pushConstraint(
      this.mk(OP_OR, [
        yIsZero,
        this.mk(OP_EQ, [x, this.mk(OP_ADD, [product, remainder], SORT_INT)]),
      ]),
    );
    this.pushConstraint(this.mk(OP_OR, [yIsZero, this.mk(OP_LE, [zero, remainder])]));
    this.pushConstraint(
      this.mk(OP_OR, [this.mk(OP_LE, [y, zero]), this.mk(OP_LT, [remainder, y])]),
    );
    const negated = this.mk(OP_MUL, [this.mkNumeral(Rational.minusOne, true), y], SORT_INT);
    this.pushConstraint(
      this.mk(OP_OR, [this.mk(OP_GE, [y, zero]), this.mk(OP_LT, [remainder, negated])]),
    );
    if (
      state.options.isComplete &&
      (!manager.isNumeral(y) || manager.getRationalValue(y).isZero())
    ) {
      const yIsNonzero = this.mk(OP_NOT, [yIsZero]);
      this.pushConstraint(
        this.mk(OP_OR, [
          yIsNonzero,
          this.mk(OP_EQ, [quotient, this.mk(OP_IDIV, [x, zero], SORT_INT)]),
        ]),
      );
      this.pushConstraint(
        this.mk(OP_OR, [
          yIsNonzero,
          this.mk(OP_EQ, [remainder, this.mk(OP_MOD, [x, zero], SORT_INT)]),
        ]),
      );
    }
    state.idivs.push({ x, y, d: quotient });
    return quotient;
  }

  private processMod(decl: number, args: number[]) {
    const expr = this.mk(decl, args, SORT_INT);
    const processed = this.state.appToFresh.get(expr);
    if (processed !== undefined) return processed;
    this.processIdiv(OP_IDIV, args);
    return this.state.appToFresh.get(expr) as number;
  }

  private processToInt(decl: number, args: number[]) {
    const expr = this.mk(decl, args, SORT_INT);
    const processed = this.state.appToFresh.get(expr);
    if (processed !== undefined) return processed;
    const fresh = this.mkFreshVar(true);
    this.cacheResult(expr, fresh);
    const minusOne = this.mkNumeral(Rational.minusOne, false);
    const realFresh = this.mk(OP_TO_REAL, [fresh], SORT_REAL);
    const diff = this.mk(
      OP_ADD,
      [args[0], this.mk(OP_MUL, [minusOne, realFresh], SORT_REAL)],
      SORT_REAL,
    );
    this.pushConstraint(this.mk(OP_GE, [diff, this.mkNumeral(Rational.zero, false)]));
    this.pushConstraint(
      this.mk(OP_NOT, [this.mk(OP_GE, [diff, this.mkNumeral(Rational.one, false)])]),
    );
    return fresh;
  }

  private processPower(decl: number, args: number[]) {
    const manager = this.manager;
    const state = this.state;
    if (!manager.isNumeral(args[1])) return -1;
    const exponent = manager.getRationalValue(args[1]);
    if (exponent.isInt() && !exponent.isZero()) return -1;
    const expr = this.mk(decl, args, SORT_REAL);
    const processed = state.appToFresh.get(expr);
    if (processed !== undefined) return processed;
    const x = args[0];
    const isInt = manager.sorts[x] === SORT_INT;
    const fresh = this.mkFreshVar(false);
    this.cacheResult(expr, fresh);
    const zero = this.mkNumeral(Rational.zero, isInt);
    const one = this.mkNumeral(Rational.one, isInt);
    if (exponent.isZero()) {
      if (isInt && state.ipower0 === -1) state.ipower0 = this.mkFreshVar(false);
      if (!isInt && state.rpower0 === -1) state.rpower0 = this.mkFreshVar(false);
      const power0 = isInt ? state.ipower0 : state.rpower0;
      const xIsZero = this.mk(OP_EQ, [x, zero]);
      this.pushConstraint(this.mk(OP_OR, [xIsZero, this.mk(OP_EQ, [fresh, one])]));
      this.pushConstraint(
        this.mk(OP_OR, [this.mk(OP_NOT, [xIsZero]), this.mk(OP_EQ, [fresh, power0])]),
      );
      return fresh;
    }
    // Z3 leaves a root of an integer, though it keeps the fresh constant it cached for it.
    if (isInt) return -1;
    const degree = this.mkNumeral(Rational.of(exponent.den), false);
    const rootEq = this.mk(OP_EQ, [x, this.mk(OP_POWER, [fresh, degree], SORT_REAL)]);
    if (exponent.den % 2n !== 0n) {
      this.pushConstraint(rootEq);
      return fresh;
    }
    const xGeZero = this.mk(OP_GE, [x, zero]);
    this.pushConstraint(
      this.mk(OP_OR, [
        this.mk(OP_NOT, [xGeZero]),
        this.mk(OP_AND, [rootEq, this.mk(OP_GE, [fresh, zero])]),
      ]),
    );
    this.pushConstraint(
      this.mk(OP_OR, [
        xGeZero,
        this.mk(OP_EQ, [fresh, this.mk(OP_NEG_ROOT, [x, degree], SORT_REAL)]),
      ]),
    );
    return fresh;
  }

  private processIrrational(expr: number) {
    const manager = this.manager;
    const state = this.state;
    const processed = state.appToFresh.get(expr);
    if (processed !== undefined) return processed;
    const fresh = this.mkFreshVar(false);
    this.cacheResult(expr, fresh);
    const am = manager.am;
    const value = manager.getAlgebraicValue(expr);
    const terms = am.getPolynomial(value).flatMap((coeff, degree) => {
      if (coeff === 0n) return [];
      const numeral = this.mkNumeral(Rational.of(coeff), false);
      if (degree === 0) return [numeral];
      const power =
        degree === 1
          ? fresh
          : this.mk(
              OP_POWER,
              [fresh, this.mkNumeral(Rational.of(BigInt(degree)), false)],
              SORT_REAL,
            );
      return [this.mk(OP_MUL, [numeral, power], SORT_REAL)];
    });
    const interval = am.getIsolatingInterval(value);
    this.pushConstraint(
      this.mk(OP_EQ, [this.mk(OP_ADD, terms, SORT_REAL), this.mkNumeral(Rational.zero, false)]),
    );
    this.pushConstraint(this.mk(OP_LT, [this.mkNumeral(interval[0], false), fresh]));
    this.pushConstraint(this.mk(OP_LT, [fresh, this.mkNumeral(interval[1], false)]));
    return fresh;
  }

  private processSinCos(isSin: boolean, decl: number, theta: number) {
    const pair = this.state.convertBasis(theta);
    const one = this.mkNumeral(Rational.one, false);
    if (pair !== undefined) {
      const result = isSin ? pair[0] : pair[1];
      this.cacheResult(this.mk(decl, [theta], SORT_REAL), result);
      const squares = pair.map((value) => this.mk(OP_MUL, [value, value], SORT_REAL));
      this.pushConstraint(this.mk(OP_EQ, [one, this.mk(OP_ADD, squares, SORT_REAL)]));
      return result;
    }
    const squares = [OP_SIN, OP_COS].map((op) => {
      const value = this.mk(op, [theta], SORT_REAL);
      return this.mk(OP_MUL, [value, value], SORT_REAL);
    });
    this.pushConstraint(this.mk(OP_EQ, [one, this.mk(OP_ADD, squares, SORT_REAL)]));
    return -1;
  }

  // Inside [-1, 1], k is asin or acos on its principal range. Outside it, k is asin-u or acos-u
  // when the purification is complete.
  private processInverse(decl: number, x: number) {
    const state = this.state;
    if (!state.options.isElimInverses) return -1;
    const expr = this.mk(decl, [x], SORT_REAL);
    const processed = state.appToFresh.get(expr);
    if (processed !== undefined) return processed;
    const fresh = this.mkFreshVar(false);
    this.cacheResult(expr, fresh);
    const isAsin = decl === OP_ASIN;
    const one = this.mkNumeral(Rational.one, false);
    const minusOne = this.mkNumeral(Rational.minusOne, false);
    const upper = isAsin ? this.mkHalfPi(1n) : this.manager.piExpr;
    const lower = isAsin ? this.mkHalfPi(-1n) : this.mkNumeral(Rational.zero, false);
    const xGeMinusOne = this.mk(OP_GE, [x, minusOne]);
    const xLeOne = this.mk(OP_LE, [x, one]);
    const outside = this.mk(OP_OR, [this.mk(OP_NOT, [xGeMinusOne]), this.mk(OP_NOT, [xLeOne])]);
    const inverseEq = this.mk(OP_EQ, [x, this.mk(isAsin ? OP_SIN : OP_COS, [fresh], SORT_REAL)]);
    const freshGeLower = this.mk(OP_GE, [fresh, lower]);
    this.pushConstraint(
      this.mk(OP_OR, [
        outside,
        this.mk(OP_AND, [
          inverseEq,
          this.mk(OP_AND, [freshGeLower, this.mk(OP_LE, [fresh, upper])]),
        ]),
      ]),
    );
    if (state.options.isComplete) {
      const unspecified = this.mk(isAsin ? OP_U_ASIN : OP_U_ACOS, [x], SORT_REAL);
      this.pushConstraint(this.mk(OP_OR, [xGeMinusOne, this.mk(OP_EQ, [fresh, unspecified])]));
      this.pushConstraint(this.mk(OP_OR, [xLeOne, this.mk(OP_EQ, [fresh, unspecified])]));
    }
    return fresh;
  }

  private mkHalfPi(sign: bigint) {
    return this.mk(
      OP_MUL,
      [this.mkNumeral(Rational.of(sign, 2n), false), this.manager.piExpr],
      SORT_REAL,
    );
  }

  private processAtan(decl: number, x: number) {
    const state = this.state;
    if (!state.options.isElimInverses) return -1;
    const expr = this.mk(decl, [x], SORT_REAL);
    const processed = state.appToFresh.get(expr);
    if (processed !== undefined) return processed;
    const fresh = this.mkFreshVar(false);
    this.cacheResult(expr, fresh);
    const halfPi = this.mkHalfPi(1n);
    const minusHalfPi = this.mkHalfPi(-1n);
    const tanEq = this.mk(OP_EQ, [x, this.mk(OP_TAN, [fresh], SORT_REAL)]);
    this.pushConstraint(
      this.mk(OP_AND, [
        tanEq,
        this.mk(OP_AND, [this.mk(OP_GT, [fresh, minusHalfPi]), this.mk(OP_LT, [fresh, halfPi])]),
      ]),
    );
    return fresh;
  }

  private reduce(decl: number, args: number[]) {
    const manager = this.manager;
    const state = this.state;
    const funcDecl = manager.funcDecls[decl];
    if (funcDecl.family !== FAMILY_ARITH || state.cannotPurify.has(decl)) return -1;
    switch (funcDecl.op) {
      case OP_DIV:
        return this.processDiv(decl, args);
      case OP_IDIV:
        return state.cannotPurify.size > 0 ? -1 : this.processIdiv(decl, args);
      case OP_MOD:
        return state.cannotPurify.size > 0 ? -1 : this.processMod(decl, args);
      case OP_TO_INT:
        return this.processToInt(decl, args);
      case OP_POWER:
        return this.processPower(decl, args);
      case OP_ASIN:
      case OP_ACOS:
        return this.processInverse(decl, args[0]);
      case OP_SIN:
        return this.processSinCos(true, decl, args[0]);
      case OP_COS:
        return this.processSinCos(false, decl, args[0]);
      case OP_ATAN:
        return this.processAtan(decl, args[0]);
      default:
        return -1;
    }
  }

  reduceApp(decl: number, args: number[]) {
    const result = this.reduce(decl, args);
    if (result !== -1) this.manager.incRef(result);
    return result;
  }

  getSubst(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] === KIND_QUANTIFIER) {
      const nested = new PurifyRewriter(manager, this.state);
      const data = manager.getQuantifier(expr);
      const body = nested.engine.rewrite(data.body);
      nested.release();
      const result = this.state.pin(manager.mkQuantifier({ ...data, body }));
      manager.decRef(body);
      return result;
    }
    if (manager.isAlgebraicNumeral(expr) && this.state.options.isElimRootObjects)
      return this.processIrrational(expr);
    return undefined;
  }
}

const mkCongruence = (state: PurifyState, defs: BinDef[], goal: Goal) => {
  const manager = state.manager;
  for (const [index, first] of defs.entries())
    for (const second of defs.slice(index + 1)) {
      const sameX = state.pin(manager.mkApp(OP_EQ, [first.x, second.x], SORT_BOOL));
      const sameY = state.pin(manager.mkApp(OP_EQ, [first.y, second.y], SORT_BOOL));
      const sameArgs = state.pin(manager.mkApp(OP_AND, [sameX, sameY], SORT_BOOL));
      const sameD = state.pin(manager.mkApp(OP_EQ, [first.d, second.d], SORT_BOOL));
      goal.assert(state.pin(manager.mkApp(OP_IMPLIES, [sameArgs, sameD], SORT_BOOL)));
    }
};

// The interpretation of an unspecified operator that maps the arguments of each purified
// application to its fresh constant.
const mkTable = (state: PurifyState, defs: BinDef[], sort: number) => {
  const manager = state.manager;
  const pin = (expr: number) => state.pin(expr);
  const first = pin(manager.mkVar(0, sort));
  const second = pin(manager.mkVar(1, sort));
  return defs.reduce(
    (body, def) => {
      const sameX = pin(manager.mkApp(OP_EQ, [first, def.x], SORT_BOOL));
      const sameArgs = pin(
        manager.mkApp(
          OP_AND,
          [sameX, pin(manager.mkApp(OP_EQ, [second, def.y], SORT_BOOL))],
          SORT_BOOL,
        ),
      );
      return pin(manager.mkApp(OP_ITE, [sameArgs, def.d, body], sort));
    },
    pin(manager.mkNumeralOfSort(Rational.zero, sort)),
  );
};

export const purifyArith = (manager: AstManager, goal: Goal, options: PurifyOptions) => {
  const state = new PurifyState(manager, goal, options);
  const rewriter = new PurifyRewriter(manager, state);
  const pin = (expr: number) => state.pin(expr);
  for (let index = 0; !goal.isInconsistent && index < goal.forms.size; index++) {
    const rewritten = rewriter.engine.rewrite(goal.forms.items[index]);
    goal.update(index, rewritten);
    manager.decRef(rewritten);
  }
  rewriter.release();
  for (const constraint of state.newConstraints) goal.assert(constraint);
  mkCongruence(state, state.divs, goal);
  mkCongruence(state, state.mods, goal);
  mkCongruence(state, state.idivs, goal);
  const definitions: Definition[] = [...state.appToFresh.entries()].map((entry) => ({
    decl: manager.decls[entry[1]],
    def: -1,
  }));
  if (state.divs.length > 0)
    definitions.push({ decl: OP_DIV0, def: mkTable(state, state.divs, SORT_REAL) });
  if (state.mods.length > 0) {
    const body = mkTable(state, state.mods, SORT_INT);
    definitions.push({ decl: OP_MOD0, def: body });
    const isNonneg = pin(
      manager.mkApp(
        OP_GE,
        [pin(manager.mkVar(1, SORT_INT)), pin(manager.mkNumeralOfSort(Rational.zero, SORT_INT))],
        SORT_BOOL,
      ),
    );
    const negated = pin(manager.mkApp(OP_UMINUS, [body], SORT_INT));
    definitions.push({
      decl: OP_MOD0,
      def: pin(manager.mkApp(OP_ITE, [isNonneg, body, negated], SORT_INT)),
    });
  }
  if (state.idivs.length > 0)
    definitions.push({ decl: OP_IDIV0, def: mkTable(state, state.idivs, SORT_INT) });
  if (state.ipower0 !== -1) definitions.push({ decl: OP_POWER0, def: state.ipower0 });
  if (state.rpower0 !== -1) definitions.push({ decl: OP_POWER0, def: state.rpower0 });
  goal.addDefinitions(definitions);
  if (state.sinCos.size > 0) {
    const zero = pin(manager.mkRealNumeral(Rational.zero));
    goal.addDefinitions(
      [...state.sinCos.entries()].map((entry) => {
        const [sin, cos] = entry[1];
        const isNonneg = pin(manager.mkApp(OP_GE, [sin, zero], SORT_BOOL));
        const acos = pin(manager.mkApp(OP_ACOS, [cos], SORT_REAL));
        const negated = pin(manager.mkApp(OP_UMINUS, [cos], SORT_REAL));
        const shifted = pin(
          manager.mkApp(
            OP_ADD,
            [pin(manager.mkApp(OP_ACOS, [negated], SORT_REAL)), manager.piExpr],
            SORT_REAL,
          ),
        );
        return {
          decl: manager.decls[entry[0]],
          def: pin(manager.mkApp(OP_ITE, [isNonneg, acos, shifted], SORT_REAL)),
        };
      }),
    );
  }
  goal.depth++;
  state.pinned.reset();
};
