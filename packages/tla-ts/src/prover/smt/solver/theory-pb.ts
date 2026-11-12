// Ported from Z3 (src/smt/theory_pb.h, src/smt/theory_pb.cpp, src/ast/rewriter/pb_rewriter_def.h),
// MIT license, see z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../errors";
import { FAMILY_PB, OP_AT_LEAST_K, OP_AT_MOST_K, OP_PB_EQ, OP_PB_GE, OP_PB_LE } from "./ast";
import { mkNot } from "./ast-util";
import { BinJustification, CLS_TH_LEMMA } from "./clause";
import type { Context } from "./context";
import {
  type Antecedents,
  Justification,
  TheoryJustification,
  UnitResolutionJustification,
} from "./enode";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import {
  type BoolVar,
  FALSE_LITERAL,
  getVar,
  isNegated,
  type Literal,
  mkLiteral,
  negate,
  TRUE_BOOL_VAR,
  TRUE_LITERAL,
} from "./literal";
import { getPbCoeff, getPbK, hasUnitCoefficients, mkPbGe } from "./pb-rewriter";
import { getGcd, Rational } from "./rational";
import { Theory } from "./theory";

interface PbArg {
  lit: Literal;
  coeff: Rational;
}

interface PbArgs {
  items: PbArg[];
  k: Rational;
}

// pb_rewriter_util over literals. Only inequalities reach it: equalities split into two at internalization.
const unique = (args: PbArgs) => {
  for (const arg of args.items)
    if (isNegated(arg.lit)) {
      arg.lit = negate(arg.lit);
      args.k = args.k.sub(arg.coeff);
      arg.coeff = arg.coeff.neg();
    }
  const kept: PbArg[] = [];
  for (const arg of args.items) {
    if (arg.lit === TRUE_LITERAL) args.k = args.k.sub(arg.coeff);
    else if (arg.lit !== FALSE_LITERAL) kept.push(arg);
  }
  kept.sort((first, second) => first.lit - second.lit);
  const merged: PbArg[] = [];
  for (const arg of kept) {
    const last = merged[merged.length - 1];
    if (last !== undefined && last.lit === arg.lit) last.coeff = last.coeff.add(arg.coeff);
    else merged.push(arg);
  }
  args.items = merged.filter((arg) => !arg.coeff.isZero());
};

const normalize = (args: PbArgs) => {
  let sum = Rational.zero;
  for (const arg of args.items) {
    const coeff = arg.coeff;
    if (coeff.isNegative()) {
      arg.coeff = coeff.neg();
      arg.lit = negate(arg.lit);
      args.k = args.k.sub(coeff);
    }
    sum = sum.add(arg.coeff);
  }
  if (args.k.compare(Rational.zero) <= 0) {
    args.items = [];
    args.k = Rational.zero;
    return L_TRUE;
  }
  if (sum.compare(args.k) < 0) {
    args.items = [];
    args.k = Rational.one;
    return L_FALSE;
  }
  if (!args.items.every((arg) => arg.coeff.isInt())) {
    let lcm = args.k.den;
    for (const arg of args.items) lcm = (lcm * arg.coeff.den) / getGcd(lcm, arg.coeff.den);
    const scale = Rational.of(lcm);
    args.k = args.k.mul(scale);
    for (const arg of args.items) arg.coeff = arg.coeff.mul(scale);
  }
  const k = args.k;
  sum = Rational.zero;
  for (const arg of args.items) {
    if (arg.coeff.compare(k) > 0) arg.coeff = k;
    sum = sum.add(arg.coeff);
  }
  if (sum.equals(k)) {
    for (const arg of args.items) arg.coeff = Rational.one;
    args.k = Rational.of(BigInt(args.items.length));
  }
  let gcd = 0n;
  for (let index = 0; gcd !== 1n && index < args.items.length; index++) {
    const coeff = args.items[index].coeff;
    if (!coeff.equals(args.k)) gcd = gcd === 0n ? coeff.num : getGcd(gcd, coeff.num);
  }
  if (gcd === 0n) {
    for (const arg of args.items) arg.coeff = Rational.one;
    args.k = Rational.one;
  } else if (gcd > 1n) {
    const bound = args.k.num;
    const newK = bound / gcd + (bound % gcd === 0n ? 0n : 1n);
    for (const arg of args.items)
      arg.coeff = Rational.of(arg.coeff.equals(args.k) ? newK : arg.coeff.num / gcd);
    args.k = Rational.of(newK);
  }
  if (!args.k.equals(Rational.one)) {
    let min = args.items[0].coeff;
    let max = min;
    for (const arg of args.items) {
      if (arg.coeff.compare(min) < 0) min = arg.coeff;
      if (arg.coeff.compare(max) > 0) max = arg.coeff;
    }
    const n0 = args.k.div(max);
    const n1 = n0.floor();
    const n2 = args.k.div(min).ceil().sub(Rational.one);
    if (n1.equals(n2) && !n0.isInt()) {
      for (const arg of args.items) arg.coeff = Rational.one;
      args.k = n1.add(Rational.one);
    }
  }
  return L_UNDEF;
};

const prune = (args: PbArgs) => {
  let nlt = Rational.zero;
  let occ = 0;
  for (let index = 0; nlt.compare(args.k) < 0 && index < args.items.length; index++) {
    const coeff = args.items[index].coeff;
    if (coeff.compare(args.k) < 0) {
      nlt = nlt.add(coeff);
      occ++;
    }
  }
  if (occ === 0 || nlt.compare(args.k) >= 0) return;
  const items = args.items;
  for (let index = 0; index < items.length; index++)
    if (items[index].coeff.compare(args.k) < 0) {
      items[index] = items[items.length - 1];
      items.pop();
      index--;
    }
  unique(args);
  normalize(args);
};

const negateArgs = (args: PbArgs) => {
  let sum = Rational.zero;
  for (const arg of args.items) {
    arg.lit = negate(arg.lit);
    sum = sum.add(arg.coeff);
  }
  args.k = sum.sub(args.k).add(Rational.one);
  if (normalize(args) !== L_UNDEF) throw new SmtInvariantError("a negated inequality is trivial");
};

class Ineq {
  args: [PbArgs, PbArgs] = [
    { items: [], k: Rational.zero },
    { items: [], k: Rational.zero },
  ];
  maxWatch = 0n;
  watchSize = 0;
  watchSum = 0n;

  constructor(public lit: Literal) {}

  getArgs() {
    return this.args[isNegated(this.lit) ? 1 : 0];
  }

  getK() {
    return this.getArgs().k.num;
  }

  getLit(index: number) {
    return this.getArgs().items[index].lit;
  }

  getCoeff(index: number) {
    return this.getArgs().items[index].coeff.num;
  }

  get size() {
    return this.getArgs().items.length;
  }

  swap(first: number, second: number) {
    const items = this.getArgs().items;
    const arg = items[first];
    items[first] = items[second];
    items[second] = arg;
  }

  findLit(boolVar: BoolVar, begin: number) {
    let index = begin;
    while (getVar(this.getLit(index)) !== boolVar) index++;
    return index;
  }

  postPrune() {
    const first = this.args[0];
    if (first.items.length === 0) return;
    negateArgs(first);
    negateArgs(first);
    this.args[1] = { items: first.items.map((arg) => ({ ...arg })), k: first.k };
    negateArgs(this.args[1]);
  }
}

class Card {
  args: Literal[] = [];

  constructor(
    public lit: Literal,
    public k: number,
    readonly isAux: boolean,
  ) {}

  get size() {
    return this.args.length;
  }

  swap(first: number, second: number) {
    const lit = this.args[first];
    this.args[first] = this.args[second];
    this.args[second] = lit;
  }

  negate() {
    this.lit = negate(this.lit);
    for (let index = 0; index < this.args.length; index++)
      this.args[index] = negate(this.args[index]);
    this.k = this.args.length - this.k + 1;
  }

  addArg(lit: Literal) {
    if (lit === FALSE_LITERAL) return;
    if (lit === TRUE_LITERAL) {
      if (this.k > 0) this.k--;
    } else this.args.push(lit);
  }
}

class CardJustification extends Justification {
  constructor(
    readonly fromTheory: number,
    readonly card: Card,
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    const card = this.card;
    antecedents.markLiteral(card.lit);
    for (let index = card.k; index < card.size; index++)
      antecedents.markLiteral(negate(card.args[index]));
  }
}

export class TheoryPb extends Theory {
  readonly name = "pb";
  private ineqs: (Ineq | undefined)[] = [];
  private cards: (Card | undefined)[] = [];
  private ineqWatches: Ineq[][] = [];
  private cardWatches: Card[][] = [];
  private ineqsTrail: BoolVar[] = [];
  private ineqsLim: number[] = [];
  private cardTrail: BoolVar[] = [];
  private cardLim: number[] = [];
  private numMarks = 0;
  private conflictLvl = 0;
  private coeffs: number[] = [];
  private activeVars: BoolVar[] = [];
  private readonly activeVarSet = new Set<BoolVar>();
  private bound = 0;
  private antecedents: Literal[] = [];

  constructor(context: Context) {
    super(context, FAMILY_PB);
  }

  internalizeTerm(): boolean {
    throw new SmtInvariantError("theory_pb has no terms");
  }

  newEqEh() {
    throw new SmtInvariantError("theory_pb has no equalities");
  }

  newDiseqEh() {}

  override useDiseqs() {
    return false;
  }

  override buildModels() {
    return false;
  }

  internalizeAtom(atom: number) {
    const context = this.context;
    const manager = this.manager;
    if (context.isBInternalized(atom)) return true;
    if (this.internalizeCard(atom)) return true;
    const boolVar = context.mkBoolVar(atom);
    context.setVarTheory(boolVar, this.id);
    const lit = mkLiteral(boolVar);
    const decl = manager.decls[atom];
    const args = manager.getArgs(atom);
    const op = manager.getOp(atom);
    if (op === OP_PB_EQ) {
      const coeffs = args.map((_, index) => getPbCoeff(manager, decl, index));
      const sum = coeffs.reduce((total, coeff) => total.add(coeff), Rational.zero);
      const k = getPbK(manager, decl);
      const le = mkPbGe(
        manager,
        coeffs,
        args.map((arg) => mkNot(manager, arg)),
        sum.sub(k),
      );
      const ge = mkPbGe(manager, coeffs, [...args], k);
      context.internalize(le, false);
      context.internalize(ge, false);
      const leLit = context.getLiteral(le);
      const geLit = context.getLiteral(ge);
      context.markLiteralAsRelevant(leLit);
      context.markLiteralAsRelevant(geLit);
      context.mkThAxiom([negate(lit), leLit]);
      context.mkThAxiom([negate(lit), geLit]);
      context.mkThAxiom([negate(leLit), negate(geLit), lit]);
      return true;
    }
    const ineq = new Ineq(lit);
    const first = ineq.args[0];
    first.k = getPbK(manager, decl);
    for (const [index, arg] of args.entries()) {
      const argLit = this.compileArg(arg);
      const coeff = getPbCoeff(manager, decl, index);
      const value = context.getAssignment(argLit);
      if (value === L_TRUE) first.k = first.k.sub(coeff);
      else if (value === L_UNDEF) first.items.push({ lit: argLit, coeff });
    }
    if (op === OP_AT_MOST_K || op === OP_PB_LE) {
      first.k = first.k.neg();
      for (const arg of first.items) {
        arg.lit = negate(arg.lit);
        first.k = first.k.add(arg.coeff);
      }
    }
    unique(first);
    const isTrue = normalize(first);
    prune(first);
    ineq.postPrune();
    if (isTrue !== L_UNDEF) {
      context.mkThAxiom([isTrue === L_FALSE ? negate(lit) : lit]);
      return true;
    }
    if (ineq.getK() === 1n) {
      const lits = [negate(lit)];
      for (let index = 0; index < ineq.size; index++) {
        lits.push(ineq.getLit(index));
        context.mkThAxiom([lit, negate(ineq.getLit(index))]);
      }
      context.mkThAxiom(lits);
      return true;
    }
    this.ineqs[boolVar] = ineq;
    this.ineqsTrail.push(boolVar);
    return true;
  }

  private compileArg(input: number) {
    const context = this.context;
    const manager = this.manager;
    let isNot = manager.isNot(input);
    const arg = isNot ? manager.getArg(input, 0) : input;
    if (!context.isBInternalized(arg)) context.internalize(arg, false);
    let boolVar = TRUE_BOOL_VAR;
    let hasBoolVar = false;
    if (context.isBInternalized(arg)) {
      boolVar = context.getBoolVar(arg);
      if (manager.isUninterpreted(arg) && context.getBoolVarTheory(boolVar) === -1)
        context.setVarTheory(boolVar, this.id);
      hasBoolVar = context.getBoolVarTheory(boolVar) === this.id;
    } else if (manager.isTrue(arg)) hasBoolVar = true;
    else if (manager.isFalse(arg)) {
      hasBoolVar = true;
      isNot = !isNot;
    }
    if (!hasBoolVar)
      throw new SmtUnsupportedError("pseudo-Boolean arguments that another theory owns");
    return mkLiteral(boolVar, isNot);
  }

  private delWatch(watch: Ineq[], index: number, ineq: Ineq, ineqIndex: number) {
    watch[index] = watch[watch.length - 1];
    watch.pop();
    let coeff = ineq.getCoeff(ineqIndex);
    if (ineqIndex + 1 < ineq.watchSize) ineq.swap(ineqIndex, ineq.watchSize - 1);
    ineq.watchSize--;
    ineq.watchSum -= coeff;
    if (coeff === ineq.maxWatch) {
      coeff = ineq.getCoeff(0);
      for (let position = 1; coeff !== ineq.maxWatch && position < ineq.watchSize; position++)
        if (coeff < ineq.getCoeff(position)) coeff = ineq.getCoeff(position);
      ineq.maxWatch = coeff;
    }
  }

  private addWatch(ineq: Ineq, index: number) {
    const lit = ineq.getLit(index);
    const coeff = ineq.getCoeff(index);
    ineq.watchSum += coeff;
    if (index > ineq.watchSize) ineq.swap(index, ineq.watchSize);
    ineq.watchSize++;
    if (coeff > ineq.maxWatch) ineq.maxWatch = coeff;
    (this.ineqWatches[lit] ??= []).push(ineq);
  }

  private unwatchIneq(lit: Literal, ineq: Ineq) {
    const watch = this.ineqWatches[lit];
    if (watch === undefined) return;
    const position = watch.indexOf(ineq);
    if (position === -1) return;
    watch[position] = watch[watch.length - 1];
    watch.pop();
  }

  private watchCard(lit: Literal, card: Card) {
    (this.cardWatches[lit] ??= []).push(card);
  }

  private unwatchCard(lit: Literal, card: Card) {
    const watch = this.cardWatches[lit];
    if (watch === undefined) return;
    const position = watch.indexOf(card);
    if (position === -1) return;
    watch[position] = watch[watch.length - 1];
    watch.pop();
  }

  private isCardinalityConstraint(atom: number) {
    const manager = this.manager;
    const op = manager.getOp(atom);
    return (
      (op === OP_PB_GE && hasUnitCoefficients(manager, manager.decls[atom])) || op === OP_AT_LEAST_K
    );
  }

  private internalizeCard(atom: number) {
    const context = this.context;
    const manager = this.manager;
    if (context.isBInternalized(atom)) return true;
    if (!this.isCardinalityConstraint(atom)) return false;
    const args = manager.getArgs(atom);
    const boolVar = context.mkBoolVar(atom);
    context.setVarTheory(boolVar, this.id);
    const bound = Number(getPbK(manager, manager.decls[atom]).num);
    const lit = mkLiteral(boolVar);
    if (bound === 0) {
      context.mkThAxiom([lit]);
      return true;
    }
    if (bound > args.length) {
      context.mkThAxiom([negate(lit)]);
      return true;
    }
    const card = new Card(lit, bound, manager.getOp(atom) === OP_AT_LEAST_K);
    for (const arg of args) card.addArg(this.compileArg(arg));
    if (bound === card.size) this.card2conjunction(card);
    else if (card.size === 1) this.card2disjunction(card);
    else {
      this.cards[boolVar] = card;
      this.cardTrail.push(boolVar);
    }
    return true;
  }

  private card2conjunction(card: Card) {
    const context = this.context;
    const lits = card.args.map((arg) => negate(arg));
    lits.push(card.lit);
    context.mkThAxiom(lits);
    for (const arg of card.args) context.mkThAxiom([negate(card.lit), arg]);
  }

  private card2disjunction(card: Card) {
    const context = this.context;
    const lits = [...card.args, negate(card.lit)];
    context.mkThAxiom(lits);
    for (const arg of card.args) context.mkThAxiom([card.lit, negate(arg)]);
  }

  private addCardClause(card: Card, lits: Literal[]) {
    if (!this.resolveConflict(card, lits)) this.context.mkClause(lits, null, CLS_TH_LEMMA);
  }

  private addCardAssign(card: Card, lit: Literal) {
    const context = this.context;
    if (context.getAssignment(lit) === L_TRUE) return;
    context.assign(lit, new CardJustification(this.id, card));
  }

  private clearCardWatch(card: Card) {
    const size = Math.min(card.k + 1, card.size);
    for (let index = 0; index < size; index++) this.unwatchCard(card.args[index], card);
  }

  private setCardConflict(card: Card, lit: Literal) {
    const lits = [negate(card.lit), lit];
    for (let index = card.k; index < card.size; index++) lits.push(card.args[index]);
    this.addCardClause(card, lits);
  }

  private assignCard(card: Card, alit: Literal) {
    const context = this.context;
    const size = card.size;
    const bound = card.k;
    let index = 0;
    for (; index <= bound; index++) if (card.args[index] === alit) break;
    if (index === bound + 1) return L_UNDEF;
    for (let position = bound + 1; position < size; position++) {
      const lit2 = card.args[position];
      if (context.getAssignment(lit2) !== L_FALSE) {
        card.swap(index, position);
        this.watchCard(lit2, card);
        return L_UNDEF;
      }
    }
    if (bound !== index && context.getAssignment(card.args[bound]) === L_FALSE) {
      this.setCardConflict(card, alit);
      return L_FALSE;
    }
    if (index !== bound) card.swap(index, bound);
    for (let position = 0; position < bound && !context.isInconsistent(); position++)
      this.addCardAssign(card, card.args[position]);
    return context.isInconsistent() ? L_FALSE : L_TRUE;
  }

  private initCardWatch(card: Card, isTrue: boolean) {
    const context = this.context;
    this.clearCardWatch(card);
    if (isNegated(card.lit) === isTrue) card.negate();
    const size = card.size;
    const bound = card.k;
    if (bound === size) {
      for (let index = 0; index < size && !context.isInconsistent(); index++)
        this.addCardAssign(card, card.args[index]);
      return;
    }
    let next = 0;
    for (let index = 0; index < size; index++)
      if (context.getAssignment(card.args[index]) !== L_FALSE) {
        if (next !== index) card.swap(index, next);
        next++;
      }
    if (next < bound) {
      let alit = card.args[next];
      // The asserting literal has the highest level, so conflict resolution can start from it.
      for (let index = bound; index < size; index++)
        if (context.getAssignLevel(alit) < context.getAssignLevel(card.args[index])) {
          card.swap(next, index);
          alit = card.args[next];
        }
      this.setCardConflict(card, alit);
    } else if (next === bound) {
      for (let index = 0; index < bound && !context.isInconsistent(); index++)
        this.addCardAssign(card, card.args[index]);
    } else for (let index = 0; index <= bound; index++) this.watchCard(card.args[index], card);
  }

  override assignEh(boolVar: BoolVar, isTrue: boolean) {
    const context = this.context;
    const falseLit = mkLiteral(boolVar, isTrue);
    const ineqs = this.ineqWatches[falseLit];
    if (ineqs !== undefined)
      for (let index = 0; index < ineqs.length; index++)
        if (this.assignWatchGe(boolVar, ineqs, index)) index--;
    const ineq = this.ineqs[boolVar];
    if (ineq !== undefined) this.assignIneq(ineq, isTrue);
    const cards = this.cardWatches[falseLit];
    if (cards !== undefined && cards.length > 0 && !context.isInconsistent()) {
      let next = 0;
      for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (context.getAssignment(card.lit) !== L_TRUE) continue;
        const result = this.assignCard(card, falseLit);
        if (result === L_FALSE) {
          for (; index < cards.length; index++, next++) cards[next] = cards[index];
          cards.length = next;
          return;
        }
        if (result === L_TRUE) cards[next++] = card;
      }
      cards.length = next;
    }
    const card = this.cards[boolVar];
    if (card !== undefined && !context.isInconsistent()) this.initCardWatch(card, isTrue);
  }

  private getUnhelpfulLiterals(ineq: Ineq, isNegating: boolean) {
    const context = this.context;
    const lits: Literal[] = [];
    for (let index = 0; index < ineq.size; index++) {
      const lit = ineq.getLit(index);
      if (context.getAssignment(lit) === L_FALSE) lits.push(isNegating ? negate(lit) : lit);
    }
    return lits;
  }

  private assignIneq(ineq: Ineq, isTrue: boolean) {
    const context = this.context;
    if (isNegated(ineq.lit) === isTrue) {
      ineq.lit = negate(ineq.lit);
      context.pushTrail(() => {
        ineq.lit = negate(ineq.lit);
      });
    }
    const size = ineq.size;
    let maxSum = 0n;
    let minInc = 0n;
    for (let index = 0; index < size; index++) {
      const value = context.getAssignment(ineq.getLit(index));
      if (value !== L_FALSE) maxSum += ineq.getCoeff(index);
      if (value === L_UNDEF && (minInc === 0n || minInc > ineq.getCoeff(index)))
        minInc = ineq.getCoeff(index);
    }
    const k = ineq.getK();
    if (maxSum < k) {
      const lits = this.getUnhelpfulLiterals(ineq, false);
      lits.push(negate(ineq.lit));
      context.mkClause(lits, null, CLS_TH_LEMMA);
    } else this.initWatchLiteral(ineq);
    if (maxSum >= k && maxSum - minInc < k) {
      const lits = this.getUnhelpfulLiterals(ineq, true);
      lits.push(ineq.lit);
      for (let index = 0; index < size; index++) {
        const lit = ineq.getLit(index);
        if (context.getAssignment(lit) === L_UNDEF) this.addIneqAssign(lits, lit);
      }
    }
  }

  private assignWatchGe(boolVar: BoolVar, watch: Ineq[], watchIndex: number) {
    const context = this.context;
    const ineq = watch[watchIndex];
    const position = ineq.findLit(boolVar, 0);
    const k = ineq.getK();
    const kCoeff = k + ineq.getCoeff(position);
    let isAddingMore = ineq.watchSum < kCoeff + ineq.maxWatch;
    for (let index = ineq.watchSize; isAddingMore && index < ineq.size; index++)
      if (context.getAssignment(ineq.getLit(index)) !== L_FALSE) {
        this.addWatch(ineq, index);
        isAddingMore = ineq.watchSum < kCoeff + ineq.maxWatch;
      }
    if (ineq.watchSum < kCoeff) {
      const lits = this.getUnhelpfulLiterals(ineq, false);
      lits.push(negate(ineq.lit));
      context.mkClause(lits, null, CLS_TH_LEMMA);
      return false;
    }
    this.delWatch(watch, watchIndex, ineq, position);
    if (ineq.watchSum < k + ineq.maxWatch) {
      const lits = this.getUnhelpfulLiterals(ineq, true);
      lits.push(ineq.lit);
      const deficit = ineq.watchSum - k;
      for (let index = 0; index < ineq.size; index++)
        if (context.getAssignment(ineq.getLit(index)) === L_UNDEF && deficit < ineq.getCoeff(index))
          this.addIneqAssign(lits, ineq.getLit(index));
    }
    return true;
  }

  private addIneqAssign(lits: Literal[], lit: Literal) {
    this.context.assign(lit, new TheoryJustification(this.id, [...lits], []));
  }

  override pushScopeEh() {
    super.pushScopeEh();
    this.ineqsLim.push(this.ineqsTrail.length);
    this.cardLim.push(this.cardTrail.length);
  }

  override popScopeEh(numScopes: number) {
    let newLim = this.ineqsLim.length - numScopes;
    let size = this.ineqsLim[newLim];
    while (this.ineqsTrail.length > size) {
      const boolVar = this.ineqsTrail.pop() as BoolVar;
      this.clearIneqWatch(this.ineqs[boolVar] as Ineq);
      this.ineqs[boolVar] = undefined;
    }
    this.ineqsLim.length = newLim;
    newLim = this.cardLim.length - numScopes;
    size = this.cardLim[newLim];
    while (this.cardTrail.length > size) {
      const boolVar = this.cardTrail.pop() as BoolVar;
      this.clearCardWatch(this.cards[boolVar] as Card);
      this.cards[boolVar] = undefined;
    }
    this.cardLim.length = newLim;
    super.popScopeEh(numScopes);
  }

  private clearIneqWatch(ineq: Ineq) {
    for (let index = 0; index < ineq.size; index++) this.unwatchIneq(ineq.getLit(index), ineq);
    ineq.watchSum = 0n;
    ineq.watchSize = 0;
    ineq.maxWatch = 0n;
  }

  private initWatchLiteral(ineq: Ineq) {
    ineq.watchSum = 0n;
    ineq.watchSize = 0;
    ineq.maxWatch = 0n;
    let isWatchingMore = true;
    for (let index = 0; isWatchingMore && index < ineq.size; index++)
      if (this.context.getAssignment(ineq.getLit(index)) !== L_FALSE) {
        this.addWatch(ineq, index);
        isWatchingMore = ineq.watchSum < ineq.getK() + ineq.maxWatch;
      }
    this.context.pushTrail(() => {
      for (let index = 0; index < ineq.watchSize; index++)
        this.unwatchIneq(ineq.getLit(index), ineq);
      ineq.watchSize = 0;
      ineq.watchSum = 0n;
      ineq.maxWatch = 0n;
    });
  }

  private getCoeffOf(boolVar: BoolVar) {
    return this.coeffs[boolVar] ?? 0;
  }

  private getAbsCoeff(boolVar: BoolVar) {
    return Math.abs(this.getCoeffOf(boolVar));
  }

  private resetCoeffs() {
    for (const boolVar of this.activeVars) this.coeffs[boolVar] = 0;
    this.activeVars = [];
  }

  private processAntecedent(lit: Literal, offset: number) {
    const context = this.context;
    const boolVar = getVar(lit);
    const level = context.getAssignLevel(lit);
    if (level > context.baseLevel && !context.isMarked(boolVar) && level === this.conflictLvl) {
      context.setMark(boolVar, true);
      this.numMarks++;
    }
    this.incCoeff(lit, offset);
  }

  private processCard(card: Card, offset: number) {
    for (let index = card.k; index < card.size; index++)
      this.processAntecedent(card.args[index], offset);
    for (let index = 0; index < card.k; index++) this.incCoeff(card.args[index], offset);
    if (this.context.getAssignLevel(card.lit) > this.context.baseLevel)
      this.antecedents.push(card.lit);
  }

  // Z3 never raises the level it compares against from 0, so this picks the last false active
  // literal, not the one with the highest level.
  private getAssertingLiteral(input: Literal) {
    const context = this.context;
    const boolVar = getVar(input);
    if (
      context.getAssignment(input) === L_FALSE &&
      this.getAbsCoeff(boolVar) !== 0 &&
      input === mkLiteral(boolVar, this.getCoeffOf(boolVar) < 0)
    )
      return input;
    let lit = input;
    for (const active of this.activeVars) {
      const candidate = mkLiteral(active, this.getCoeffOf(active) < 0);
      if (context.getAssignment(candidate) === L_FALSE && context.getAssignLevel(candidate) > 0)
        lit = candidate;
    }
    return lit;
  }

  private normalizeActiveCoeffs() {
    this.activeVarSet.clear();
    let next = 0;
    for (const boolVar of this.activeVars)
      if (!this.activeVarSet.has(boolVar) && this.getCoeffOf(boolVar) !== 0) {
        this.activeVarSet.add(boolVar);
        this.activeVars[next++] = boolVar;
      }
    this.activeVars.length = next;
  }

  private incCoeff(lit: Literal, offset: number) {
    const boolVar = getVar(lit);
    const coeff0 = this.getCoeffOf(boolVar);
    if (coeff0 === 0) this.activeVars.push(boolVar);
    const inc = isNegated(lit) ? -offset : offset;
    const coeff1 = inc + coeff0;
    this.coeffs[boolVar] = coeff1;
    if (coeff0 > 0 && inc < 0) this.bound -= coeff0 - Math.max(0, coeff1);
    else if (coeff0 < 0 && inc > 0) this.bound -= Math.min(0, coeff1) - coeff0;
  }

  private cut() {
    let gcd = 0;
    for (let index = 0; gcd !== 1 && index < this.activeVars.length; index++) {
      const boolVar = this.activeVars[index];
      let coeff = this.getAbsCoeff(boolVar);
      if (coeff === 0) continue;
      if (this.bound < coeff) {
        this.coeffs[boolVar] = this.getCoeffOf(boolVar) > 0 ? this.bound : -this.bound;
        coeff = this.bound;
      }
      gcd = gcd === 0 ? coeff : Number(getGcd(BigInt(gcd), BigInt(coeff)));
    }
    if (gcd < 2) return;
    this.normalizeActiveCoeffs();
    for (const boolVar of this.activeVars)
      this.coeffs[boolVar] = Math.trunc(this.coeffs[boolVar] / gcd);
    // The bound is added to the unsigned divisor as an unsigned number.
    this.bound = Math.floor(((this.bound + gcd - 1) >>> 0) / gcd) | 0;
  }

  private resolveConflict(card: Card, conflict: Literal[]) {
    const context = this.context;
    this.conflictLvl = 0;
    for (const lit of conflict)
      this.conflictLvl = Math.max(this.conflictLvl, context.getAssignLevel(lit));
    if (
      this.conflictLvl < context.getAssignLevel(card.lit) ||
      this.conflictLvl === context.baseLevel
    )
      return false;
    this.resetCoeffs();
    this.numMarks = 0;
    this.bound = card.k;
    this.antecedents = [];
    this.processCard(card, 1);
    const lits = context.assignedLiterals;
    let index = lits.length - 1;
    let consequent = negate(conflict[2]);
    const clearMarks = () => {
      while (this.numMarks > 0 && index > 0) {
        const boolVar = getVar(lits[index]);
        if (context.isMarked(boolVar)) context.setMark(boolVar, false);
        index--;
      }
    };
    while (this.numMarks > 0) {
      const offset = this.getAbsCoeff(getVar(consequent));
      if (offset > 1000) {
        clearMarks();
        return false;
      }
      if (offset !== 0) {
        const justification = context.justifications[getVar(consequent)];
        let bound = 1;
        if (justification instanceof Justification) {
          if (justification.fromTheory === this.id && justification instanceof CardJustification) {
            this.processCard(justification.card, offset);
            bound = justification.card.k;
          } else bound = 0;
        } else if (justification instanceof BinJustification) {
          this.incCoeff(consequent, offset);
          this.processAntecedent(negate(justification.literal), offset);
        } else if (justification === null || justification === "axiom") bound = 0;
        else {
          this.incCoeff(consequent, offset);
          const clauses = context.clauses;
          const clauseJustification = clauses.getJustification(justification);
          if (clauseJustification instanceof UnitResolutionJustification) {
            clearMarks();
            return false;
          }
          if (clauseJustification === null) {
            const numLiterals = clauses.getNumLiterals(justification);
            this.processAntecedent(
              clauses.getLiteral(
                justification,
                clauses.getLiteral(justification, 0) === consequent ? 1 : 0,
              ),
              offset,
            );
            for (let position = 2; position < numLiterals; position++)
              this.processAntecedent(clauses.getLiteral(justification, position), offset);
          }
        }
        this.bound += offset * bound;
        this.cut();
      }
      for (;;) {
        consequent = lits[index];
        if (context.isMarked(getVar(consequent))) break;
        index--;
      }
      context.setMark(getVar(consequent), false);
      index--;
      this.numMarks--;
    }
    this.normalizeActiveCoeffs();
    if (this.bound > 0 && this.activeVars.length === 0) return false;
    let slack = -this.bound;
    for (const boolVar of this.activeVars) slack += this.getAbsCoeff(boolVar);
    const alit = this.getAssertingLiteral(negate(consequent));
    slack -= this.getAbsCoeff(getVar(alit));
    for (let position = lits.length; 0 <= slack && position-- > 0;) {
      const lit = lits[position];
      const boolVar = getVar(lit);
      if (!this.activeVarSet.has(boolVar) || boolVar === getVar(alit)) continue;
      const coeff = this.getCoeffOf(boolVar);
      if (coeff < 0 && !isNegated(lit)) {
        slack += coeff;
        this.antecedents.push(lit);
      } else if (coeff > 0 && isNegated(lit)) {
        slack -= coeff;
        this.antecedents.push(lit);
      }
    }
    context.assign(alit, new TheoryJustification(this.id, [...this.antecedents], []));
    return true;
  }
}
