import {
  type AstManager,
  FAMILY_ARITH,
  KIND_APP,
  OP_ADD,
  OP_MUL,
  OP_NUM,
  OP_POWER,
  OP_SUB,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import {
  type Polynomial,
  type PolynomialManager,
  PolynomialRef,
  PolynomialRefVector,
} from "./nlsat/polynomial";
import { getLcm, Rational } from "./rational";
import { RefVector } from "./ref-vector";

interface Frame {
  term: number;
  index: number;
}

export class Expr2Polynomial {
  private cache = new Map<number, number>();
  private cachedDomain: RefVector;
  private cachedPolynomials: PolynomialRefVector;
  private cachedDenominators: bigint[] = [];
  private frames: Frame[] = [];
  private presult: PolynomialRefVector;
  private dresult: bigint[] = [];
  private var2expr: RefVector;

  constructor(
    private manager: AstManager,
    readonly pm: PolynomialManager,
    private t2x: Map<number, number>,
    private mkVar: (isInt: boolean) => number,
  ) {
    this.cachedDomain = new RefVector(manager);
    this.cachedPolynomials = new PolynomialRefVector(pm);
    this.presult = new PolynomialRefVector(pm);
    this.var2expr = new RefVector(manager);
  }

  private reset() {
    this.frames.length = 0;
    this.presult.reset();
    this.dresult.length = 0;
  }

  private cacheResult(term: number) {
    if (this.manager.getRefCount(term) <= 1) return;
    this.cache.set(term, this.cachedPolynomials.size);
    this.cachedDomain.push(term);
    this.cachedPolynomials.push(this.presult.get(this.presult.size - 1));
    this.cachedDenominators.push(this.dresult[this.dresult.length - 1]);
  }

  private storeResult(term: number, polynomial: Polynomial, denominator: bigint) {
    this.presult.push(polynomial);
    this.dresult.push(denominator);
    this.cacheResult(term);
  }

  private storeVarPoly(term: number) {
    let variable = this.t2x.get(term);
    if (variable === undefined) {
      variable = this.mkVar(this.manager.sorts[term] === SORT_INT);
      this.t2x.set(term, variable);
      if (variable >= this.var2expr.size) this.var2expr.resize(variable + 1);
      this.var2expr.set(variable, term);
    }
    this.storeResult(term, this.pm.mkVar(variable), 1n);
  }

  private visitArithApp(term: number) {
    const manager = this.manager;
    switch (manager.getOp(term)) {
      case OP_NUM: {
        const value = manager.getRationalValue(term);
        this.storeResult(term, this.pm.mkConst(value.num), value.den);
        return true;
      }
      case OP_ADD:
      case OP_SUB:
      case OP_MUL:
      case OP_UMINUS:
      case OP_TO_REAL:
        this.frames.push({ term, index: 0 });
        return false;
      case OP_POWER: {
        const exponent = manager.getArg(term, 1);
        const value = manager.isNumeral(exponent) ? manager.getRationalValue(exponent) : undefined;
        if (value === undefined || !value.isInt() || value.num <= 0n || value.num > 0xffffffffn) {
          this.storeVarPoly(term);
          return true;
        }
        this.frames.push({ term, index: 0 });
        return false;
      }
      default:
        this.storeVarPoly(term);
        return true;
    }
  }

  private visit(term: number) {
    const manager = this.manager;
    const cached = manager.getRefCount(term) > 1 ? this.cache.get(term) : undefined;
    if (cached !== undefined) {
      this.presult.push(this.cachedPolynomials.get(cached));
      this.dresult.push(this.cachedDenominators[cached]);
      return true;
    }
    if (manager.kinds[term] !== KIND_APP || manager.getFamily(term) !== FAMILY_ARITH) {
      this.storeVarPoly(term);
      return true;
    }
    return this.visitArithApp(term);
  }

  private pop(numArgs: number) {
    this.presult.shrink(this.presult.size - numArgs);
    this.dresult.length -= numArgs;
  }

  private processAddSub(term: number, numArgs: number, isAdd: boolean) {
    const pm = this.pm;
    const first = this.presult.size - numArgs;
    const p = new PolynomialRef(pm);
    const pAux = new PolynomialRef(pm);
    let denominator = 1n;
    for (let index = 0; index < numArgs; index++)
      denominator = getLcm(denominator, this.dresult[first + index]);
    p.set(pm.zero);
    for (let index = 0; index < numArgs; index++) {
      pAux.set(
        pm.mulConst(denominator / this.dresult[first + index], this.presult.get(first + index)),
      );
      if (index === 0) p.copy(pAux);
      else p.set(isAdd ? pm.add(p.get(), pAux.get()) : pm.sub(p.get(), pAux.get()));
    }
    this.pop(numArgs);
    this.storeResult(term, p.get(), denominator);
    pAux.reset();
    p.reset();
  }

  private processMul(term: number, numArgs: number) {
    const first = this.presult.size - numArgs;
    const p = new PolynomialRef(this.pm);
    let denominator = 1n;
    p.set(this.pm.one);
    for (let index = 0; index < numArgs; index++) {
      p.set(this.pm.mul(p.get(), this.presult.get(first + index)));
      denominator *= this.dresult[first + index];
    }
    this.pop(numArgs);
    this.storeResult(term, p.get(), denominator);
    p.reset();
  }

  private processUminus(term: number) {
    const negP = new PolynomialRef(this.pm);
    negP.set(this.pm.neg(this.presult.get(this.presult.size - 1)));
    this.presult.shrink(this.presult.size - 1);
    this.presult.push(negP.get());
    this.cacheResult(term);
    negP.reset();
  }

  private processPower(term: number, numArgs: number) {
    const first = this.presult.size - numArgs;
    const k = Number(this.manager.getRationalValue(this.manager.getArg(term, 1)).num);
    const p = new PolynomialRef(this.pm);
    this.pm.pw(this.presult.get(first), k, p);
    const denominator = this.dresult[first] ** BigInt(k);
    this.pop(numArgs);
    this.storeResult(term, p.get(), denominator);
    p.reset();
  }

  private processApp(term: number) {
    const numArgs = this.manager.getNumArgs(term);
    switch (this.manager.getOp(term)) {
      case OP_ADD:
        return this.processAddSub(term, numArgs, true);
      case OP_SUB:
        return this.processAddSub(term, numArgs, false);
      case OP_MUL:
        return this.processMul(term, numArgs);
      case OP_POWER:
        return this.processPower(term, numArgs);
      case OP_UMINUS:
        return this.processUminus(term);
      default:
        return this.cacheResult(term);
    }
  }

  toPolynomial(term: number, p: PolynomialRef) {
    this.reset();
    if (!this.visit(term)) {
      const frames = this.frames;
      while (frames.length > 0) {
        const frame = frames[frames.length - 1];
        const numArgs = this.manager.getNumArgs(frame.term);
        let isPushed = false;
        while (frame.index < numArgs) {
          const arg = this.manager.getArg(frame.term, frame.index);
          frame.index++;
          if (!this.visit(arg)) {
            isPushed = true;
            break;
          }
        }
        if (isPushed) continue;
        this.processApp(frame.term);
        frames.pop();
      }
    }
    p.set(this.presult.get(this.presult.size - 1));
    const denominator = this.dresult[this.dresult.length - 1];
    this.reset();
    return denominator;
  }

  private isIntVar(variable: number) {
    return this.manager.sorts[this.var2expr.items[variable]] === SORT_INT;
  }

  toExpr(polynomial: Polynomial, isUsingPower: boolean) {
    const manager = this.manager;
    const isInt = polynomial.ms.every((monomial) =>
      monomial.vars.every((variable) => this.isIntVar(variable)),
    );
    const sort = isInt ? SORT_INT : SORT_REAL;
    const mkNumeral = (value: bigint) => manager.mkNumeralOfSort(Rational.of(value), sort);
    const args = polynomial.ms.map((monomial, index) => {
      const factors: number[] = [];
      const coeff = polynomial.as[index];
      if (coeff !== 1n) factors.push(mkNumeral(coeff));
      for (const [position, variable] of monomial.vars.entries()) {
        const term = this.var2expr.items[variable];
        const base =
          this.isIntVar(variable) && !isInt ? manager.mkApp(OP_TO_REAL, [term], SORT_REAL) : term;
        const degree = monomial.degrees[position];
        if (isUsingPower && degree > 1)
          factors.push(manager.mkApp(OP_POWER, [base, mkNumeral(BigInt(degree))], SORT_REAL));
        else for (let count = 0; count < degree; count++) factors.push(base);
      }
      if (factors.length === 0) return mkNumeral(1n);
      return factors.length === 1 ? factors[0] : manager.mkApp(OP_MUL, factors, sort);
    });
    if (args.length === 0) return mkNumeral(0n);
    return args.length === 1 ? args[0] : manager.mkApp(OP_ADD, args, sort);
  }

  release() {
    this.presult.reset();
    this.cachedPolynomials.reset();
    this.cachedDomain.reset();
    this.var2expr.reset();
  }
}
