// Ported from Z3 (src/smt/theory_bv.h, src/smt/theory_bv.cpp, src/util/union_find.h), MIT license,
// see z3-license.txt. The theory of bit-vectors, which blasts each term into a literal per bit and
// keeps the bits of equal terms equal. It has the parameters of setup_unknown: bv_reflect on, no
// congruence closure on its terms, the definitions of le atoms asserted eagerly, no watched
// disequalities, and no bound on the size it blasts.
import { SmtInvariantError, SmtUnsupportedError } from "../../../errors";
import {
  FAMILY_BV,
  type FuncDecl,
  OP_BADD,
  OP_BAND,
  OP_BASHR,
  OP_BCOMP,
  OP_BIT2BOOL,
  OP_BLSHR,
  OP_BMUL,
  OP_BNAND,
  OP_BNEG,
  OP_BNOR,
  OP_BNOT,
  OP_BOR,
  OP_BREDAND,
  OP_BREDOR,
  OP_BSDIV0,
  OP_BSDIV_I,
  OP_BSHL,
  OP_BSMOD,
  OP_BSMOD0,
  OP_BSMOD_I,
  OP_BSMUL_NO_OVFL,
  OP_BSMUL_NO_UDFL,
  OP_BSREM,
  OP_BSREM0,
  OP_BSREM_I,
  OP_BSUB,
  OP_BUDIV0,
  OP_BUDIV_I,
  OP_BUMUL_NO_OVFL,
  OP_BUREM,
  OP_BUREM0,
  OP_BUREM_I,
  OP_BV_NUM,
  OP_BXNOR,
  OP_BXOR,
  OP_CONCAT,
  OP_EXT_ROTATE_LEFT,
  OP_EXT_ROTATE_RIGHT,
  OP_EXTRACT,
  OP_ITE,
  OP_MKBV,
  OP_ROTATE_LEFT,
  OP_ROTATE_RIGHT,
  OP_SIGN_EXT,
  OP_SLEQ,
  OP_ULEQ,
  OP_ZERO_EXT,
} from "./ast";
import { BitBlaster } from "./bit-blaster";
import { mkBvApp } from "./bv-decl-plugin";
import type { Context } from "./context";
import { type Antecedents, Enode, Justification } from "./enode";
import { combineHash, hashU } from "./hash";
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
import { Theory } from "./theory";

const NULL_THEORY_ID = -1;

// var_pos_occ: a variable and the position of a bit in it, on the list of the bit's atom.
interface VarPosOcc {
  readonly thVar: number;
  readonly index: number;
  readonly next: VarPosOcc | null;
}

interface BitAtom {
  readonly isBit: true;
  occs: VarPosOcc | null;
}

// le_atom: an atom and the literal of its circuit, which the overflow predicates also use.
interface LeAtom {
  readonly isBit: false;
  readonly literal: Literal;
  readonly def: Literal;
}

// zero_one_bit: a bit of the class that is the true or the false literal, and its variable.
interface ZeroOneBit {
  readonly owner: number;
  readonly index: number;
  readonly isTrue: boolean;
}

interface BvDiseq {
  readonly first: number;
  readonly second: number;
  readonly index: number;
}

// The operators blasted bit by bit from the bits of their arguments.
type Blast = (blaster: BitBlaster, bits: number[][], parameter: number, out: number[]) => void;

const UNARY_BLASTS = new Map<number, Blast>([
  [OP_BNEG, (blaster, bits, _parameter, out) => blaster.mkNeg(bits[0], out)],
  [OP_BNOT, (blaster, bits, _parameter, out) => blaster.mkNotBits(bits[0], out)],
  [OP_BREDAND, (blaster, bits, _parameter, out) => blaster.mkRedand(bits[0], out)],
  [OP_BREDOR, (blaster, bits, _parameter, out) => blaster.mkRedor(bits[0], out)],
  [OP_SIGN_EXT, (blaster, bits, parameter, out) => blaster.mkSignExtend(bits[0], parameter, out)],
  [OP_ZERO_EXT, (blaster, bits, parameter, out) => blaster.mkZeroExtend(bits[0], parameter, out)],
  [
    OP_ROTATE_LEFT,
    (blaster, bits, parameter, out) => blaster.mkRotateLeft(bits[0], parameter, out),
  ],
  [
    OP_ROTATE_RIGHT,
    (blaster, bits, parameter, out) => blaster.mkRotateRight(bits[0], parameter, out),
  ],
]);

const BINARY_BLASTS = new Map<number, Blast>([
  [OP_BUDIV_I, (blaster, bits, _parameter, out) => blaster.mkUdiv(bits[0], bits[1], out)],
  [OP_BSDIV_I, (blaster, bits, _parameter, out) => blaster.mkSdiv(bits[0], bits[1], out)],
  [OP_BUREM_I, (blaster, bits, _parameter, out) => blaster.mkUrem(bits[0], bits[1], out)],
  [OP_BSREM_I, (blaster, bits, _parameter, out) => blaster.mkSrem(bits[0], bits[1], out)],
  [OP_BSMOD_I, (blaster, bits, _parameter, out) => blaster.mkSmod(bits[0], bits[1], out)],
  [OP_BSHL, (blaster, bits, _parameter, out) => blaster.mkShl(bits[0], bits[1], out)],
  [OP_BLSHR, (blaster, bits, _parameter, out) => blaster.mkLshr(bits[0], bits[1], out)],
  [OP_BASHR, (blaster, bits, _parameter, out) => blaster.mkAshr(bits[0], bits[1], out)],
  [
    OP_EXT_ROTATE_LEFT,
    (blaster, bits, _parameter, out) => blaster.mkExtRotateLeft(bits[0], bits[1], out),
  ],
  [
    OP_EXT_ROTATE_RIGHT,
    (blaster, bits, _parameter, out) => blaster.mkExtRotateRight(bits[0], bits[1], out),
  ],
  [OP_BCOMP, (blaster, bits, _parameter, out) => blaster.mkComp(bits[0], bits[1], out)],
]);

// MK_AC_BINARY: folded from the last argument to the first.
const AC_BLASTS = new Map<number, Blast>([
  [OP_BADD, (blaster, bits, _parameter, out) => blaster.mkAdder(bits[0], bits[1], out)],
  [OP_BMUL, (blaster, bits, _parameter, out) => blaster.mkMultiplier(bits[0], bits[1], out)],
  [OP_BAND, (blaster, bits, _parameter, out) => blaster.mkAndBits(bits[0], bits[1], out)],
  [OP_BOR, (blaster, bits, _parameter, out) => blaster.mkOrBits(bits[0], bits[1], out)],
  [OP_BXOR, (blaster, bits, _parameter, out) => blaster.mkXorBits(bits[0], bits[1], out)],
  [OP_BNAND, (blaster, bits, _parameter, out) => blaster.mkNandBits(bits[0], bits[1], out)],
  [OP_BNOR, (blaster, bits, _parameter, out) => blaster.mkNorBits(bits[0], bits[1], out)],
  [OP_BXNOR, (blaster, bits, _parameter, out) => blaster.mkXnorBits(bits[0], bits[1], out)],
]);

const DIVREM_OPS: ReadonlySet<number> = new Set([
  OP_BUREM,
  OP_BUREM_I,
  OP_BSREM,
  OP_BSREM_I,
  OP_BSMOD,
  OP_BSMOD_I,
  OP_BUDIV_I,
  OP_BSDIV_I,
]);

// The division by zero, which the model interprets, and the divisions that hi_div0 rewrote.
const UNINTERPRETED_OPS: ReadonlySet<number> = new Set([
  OP_BSDIV0,
  OP_BUDIV0,
  OP_BSREM0,
  OP_BUREM0,
  OP_BSMOD0,
  OP_BSREM,
  OP_BUREM,
  OP_BSMOD,
]);

const DIV0_OPS: ReadonlySet<number> = new Set([
  OP_BSDIV0,
  OP_BUDIV0,
  OP_BSREM0,
  OP_BUREM0,
  OP_BSMOD0,
]);

// bit_eq_justification: a bit takes the value of the bit at its position in an equal variable.
class BitEqJustification extends Justification {
  constructor(
    readonly fromTheory: number,
    private first: Enode,
    private second: Enode,
    private antecedent: Literal,
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    antecedents.markEq(this.first, this.second);
    if (getVar(this.antecedent) !== TRUE_BOOL_VAR) antecedents.markLiteral(this.antecedent);
  }
}

// fixed_eq_justification: two variables are equal since their bits have the same values.
class FixedEqJustification extends Justification {
  constructor(
    readonly fromTheory: number,
    private context: Context,
    private firstBits: readonly Literal[],
    private secondBits: readonly Literal[],
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    for (const bits of [this.firstBits, this.secondBits])
      for (const bit of bits)
        if (getVar(bit) !== TRUE_BOOL_VAR)
          antecedents.markLiteral(this.context.getAssignment(bit) === L_TRUE ? bit : negate(bit));
  }
}

export class TheoryBv extends Theory {
  private blaster: BitBlaster;
  // m_trail_stack: the theory's own trail, with the scopes of the context.
  private trail: (() => void)[] = [];
  private trailLimits: number[] = [];
  // m_find: the union-find over the variables.
  private finds: number[] = [];
  private sizes: number[] = [];
  private nexts: number[] = [];
  private bits: Literal[][] = [];
  private wpos: number[] = [];
  private zeroOneBits: ZeroOneBit[][] = [];
  private atoms: (BitAtom | LeAtom | undefined)[] = [];
  private fixedVars = new Map<string, number>();
  private eqActivity = new Uint8Array(256);
  private propDiseqs: BvDiseq[] = [];
  private propDiseqsHead = 0;
  private propQueue: number[] = [];
  private mergeAux: [number[], number[]] = [[], []];

  constructor(context: Context) {
    super(context, FAMILY_BV);
    this.blaster = new BitBlaster(context.manager);
  }

  private getBvSize(thVar: number) {
    const manager = this.manager;
    return manager.getBvSize(manager.sorts[this.getExpr(thVar)]);
  }

  private find(thVar: number) {
    let current = thVar;
    while (this.finds[current] !== current) current = this.finds[current];
    return current;
  }

  // union_find::merge: the smaller class joins the larger one.
  private merge(inputFirst: number, inputSecond: number) {
    const firstRoot = this.find(inputFirst);
    const secondRoot = this.find(inputSecond);
    if (firstRoot === secondRoot) return;
    const isSwapped = this.sizes[firstRoot] > this.sizes[secondRoot];
    const joining = isSwapped ? secondRoot : firstRoot;
    const root = isSwapped ? firstRoot : secondRoot;
    this.mergeEh(
      root,
      joining,
      isSwapped ? inputFirst : inputSecond,
      isSwapped ? inputSecond : inputFirst,
    );
    this.finds[joining] = root;
    this.sizes[root] += this.sizes[joining];
    const next = this.nexts[joining];
    this.nexts[joining] = this.nexts[root];
    this.nexts[root] = next;
    this.trail.push(() => {
      this.sizes[root] -= this.sizes[joining];
      this.finds[joining] = joining;
      const restored = this.nexts[joining];
      this.nexts[joining] = this.nexts[root];
      this.nexts[root] = restored;
      this.unmergeEh(root);
    });
  }

  private mkVar(node: Enode) {
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    this.finds.push(thVar);
    this.sizes.push(1);
    this.nexts.push(thVar);
    this.trail.push(() => {
      this.finds.pop();
      this.sizes.pop();
      this.nexts.pop();
    });
    this.bits.push([]);
    this.wpos.push(0);
    this.zeroOneBits.push([]);
    this.context.attachThVar(node, this, thVar);
    return thVar;
  }

  private insertAtom(boolVar: BoolVar, atom: BitAtom | LeAtom) {
    this.atoms[boolVar] = atom;
    this.trail.push(() => {
      this.atoms[boolVar] = undefined;
    });
  }

  private mkBits(thVar: number) {
    const context = this.context;
    const owner = this.getExpr(thVar);
    const isRelevant = context.isRelevant(owner);
    const bits = this.bits[thVar];
    bits.length = 0;
    const bitExprs = Array.from({ length: this.getBvSize(thVar) }, (_, index) =>
      mkBvApp(this.manager, OP_BIT2BOOL, [owner], [index]),
    );
    context.internalizeAll(bitExprs, true);
    for (const bitExpr of bitExprs) {
      bits.push(mkLiteral(context.getBoolVar(bitExpr)));
      if (isRelevant && !context.isRelevant(bitExpr)) context.markAsRelevant(bitExpr);
    }
  }

  private mkBit2Bool(atom: number) {
    const context = this.context;
    const manager = this.manager;
    const arg = manager.getArg(atom, 0);
    if (!context.isEInternalized(arg)) {
      context.internalize(arg, false);
      this.getVar(this.getInternalizedEnode(arg));
    }
    const argVar = this.getInternalizedEnode(arg).getThVar(this.id);
    const index = this.getParameter(atom, 0);
    if (argVar < 0) this.getVar(this.getInternalizedEnode(arg));
    else if (!context.isBInternalized(atom)) {
      const boolVar = context.mkBoolVar(atom);
      context.setVarTheory(boolVar, this.id);
      this.insertAtom(boolVar, { isBit: true, occs: { thVar: argVar, index, next: null } });
      const bit = this.bits[argVar][index];
      if (bit !== undefined) {
        context.mkThAxiom([bit, mkLiteral(boolVar, true)]);
        context.mkThAxiom([negate(bit), mkLiteral(boolVar)]);
      }
    }
    if (!manager.isBvNumeral(arg)) return;
    const isOne = ((manager.getBvNumeralValue(arg) >> BigInt(index)) & 1n) === 1n;
    const literal = context.getLiteral(atom);
    context.markLiteralAsRelevant(literal);
    context.mkThAxiom([isOne ? literal : negate(literal)]);
  }

  private getParameter(expr: number, index: number) {
    const manager = this.manager;
    return manager.funcDecls[manager.decls[expr]].parameters[index];
  }

  private getInternalizedEnode(expr: number) {
    const node = this.context.getEnode(expr);
    if (node === undefined) throw new SmtInvariantError("the term was not internalized");
    return node;
  }

  private mkEnode(term: number) {
    const context = this.context;
    if (context.isEInternalized(term)) return this.getInternalizedEnode(term);
    const node = context.mkEnode(term, false, false, false);
    this.mkVar(node);
    return node;
  }

  private getVar(node: Enode) {
    const thVar = node.getThVar(this.id);
    if (thVar >= 0) return thVar;
    const created = this.mkVar(node);
    this.mkBits(created);
    return created;
  }

  // literal2expr: the expression of a literal, which the caller releases.
  private literalToExpr(literal: Literal) {
    const manager = this.manager;
    const atom = this.context.boolVar2Expr[getVar(literal)];
    const expr =
      literal === TRUE_LITERAL
        ? manager.trueExpr
        : literal === FALSE_LITERAL
          ? manager.falseExpr
          : isNegated(literal)
            ? manager.mkNot(atom)
            : atom;
    manager.incRef(expr);
    return expr;
  }

  // get_bits: the expressions of the bits, which the caller releases.
  private getBits(thVar: number) {
    return this.bits[thVar].map((bit) => this.literalToExpr(bit));
  }

  private dropAll(exprs: number[]) {
    for (const expr of exprs) this.manager.decRef(expr);
  }

  private addNewDiseqAxiom(first: number, second: number, index: number) {
    this.propDiseqs.push({ first, second, index });
    this.context.pushTrail(() => {
      this.propDiseqs.pop();
    });
  }

  private assertNewDiseqAxiom(first: number, second: number) {
    const context = this.context;
    const manager = this.manager;
    const firstExpr = this.getExpr(first);
    const secondExpr = this.getExpr(second);
    const eq = manager.mkEq(firstExpr, secondExpr);
    manager.incRef(eq);
    context.mkThAxiom([negate(this.mkLiteral(eq))]);
    const relevancy = context.relevancy;
    if (relevancy.isEnabled) {
      const handler = () => {
        if (relevancy.isRelevant(firstExpr) && relevancy.isRelevant(secondExpr))
          relevancy.markAsRelevant(eq);
      };
      relevancy.addHandler(firstExpr, handler);
      relevancy.addHandler(secondExpr, handler);
    }
    manager.decRef(eq);
  }

  private registerTrueFalseBit(thVar: number, index: number) {
    this.zeroOneBits[thVar].push({
      owner: thVar,
      index,
      isTrue: this.bits[thVar][index] === TRUE_LITERAL,
    });
  }

  private addBit(thVar: number, literal: Literal) {
    const context = this.context;
    const bits = this.bits[thVar];
    const index = bits.length;
    bits.push(literal);
    const boolVar = getVar(literal);
    if (boolVar === TRUE_BOOL_VAR) {
      this.registerTrueFalseBit(thVar, index);
      return;
    }
    const thId = context.getBoolVarTheory(boolVar);
    if (thId === this.id) {
      const atom = this.atoms[boolVar];
      if (atom === undefined || !atom.isBit) return;
      const negated = negate(literal);
      const size = this.getBvSize(thVar);
      for (let occ = atom.occs; occ !== null; occ = occ.next)
        if (
          occ.index === index &&
          this.bits[occ.thVar][occ.index] === negated &&
          this.getBvSize(occ.thVar) === size
        )
          this.addNewDiseqAxiom(thVar, occ.thVar, index);
      const previous = atom.occs;
      this.trail.push(() => {
        atom.occs = previous;
      });
      atom.occs = { thVar, index, next: previous };
    } else if (thId === NULL_THEORY_ID) {
      context.setVarTheory(boolVar, this.id);
      this.insertAtom(boolVar, { isBit: true, occs: { thVar, index, next: null } });
    }
  }

  private initBits(node: Enode, bitExprs: number[]) {
    const context = this.context;
    const thVar = node.getThVar(this.id);
    this.bits[thVar].length = 0;
    context.internalizeAll(bitExprs, true);
    for (const bitExpr of bitExprs) this.addBit(thVar, context.getLiteral(bitExpr));
    this.findWpos(thVar);
  }

  // find_wpos: an unassigned bit to watch, from the watched one around, or else the value is fixed.
  private findWpos(thVar: number) {
    const context = this.context;
    const bits = this.bits[thVar];
    const start = this.wpos[thVar];
    for (let offset = 0; offset < bits.length; offset++) {
      const position = (start + offset) % bits.length;
      if (context.getAssignment(bits[position]) === L_UNDEF) {
        this.wpos[thVar] = position;
        return;
      }
    }
    this.fixedVarEh(thVar);
  }

  private addFixedEq(inputFirst: number, inputSecond: number) {
    const first = Math.min(inputFirst, inputSecond);
    const second = Math.max(inputFirst, inputSecond);
    const slot = combineHash(hashU(first), hashU(second)) & 0xff;
    const activity = this.eqActivity[slot]++;
    if (activity !== 0xff) return;
    const context = this.context;
    const manager = this.manager;
    const firstExpr = this.getExpr(first);
    const secondExpr = this.getExpr(second);
    const classEq = this.mkEq(firstExpr, secondExpr, true);
    context.markLiteralAsRelevant(classEq);
    const literals: Literal[] = [];
    for (let index = 0; index < this.getBvSize(first); index++) {
      const firstBit = this.bits[first][index];
      const secondBit = this.bits[second][index];
      const firstBitExpr = mkBvApp(manager, OP_BIT2BOOL, [firstExpr], [index]);
      manager.incRef(firstBitExpr);
      const secondBitExpr = mkBvApp(manager, OP_BIT2BOOL, [secondExpr], [index]);
      manager.incRef(secondBitExpr);
      const eq = this.mkEq(firstBitExpr, secondBitExpr, true);
      context.mkThAxiom([firstBit, negate(secondBit), negate(eq)]);
      context.mkThAxiom([negate(firstBit), secondBit, negate(eq)]);
      context.mkThAxiom([firstBit, secondBit, eq]);
      context.mkThAxiom([negate(firstBit), negate(secondBit), eq]);
      context.mkThAxiom([eq, negate(classEq)]);
      literals.push(negate(eq));
      manager.decRef(secondBitExpr);
      manager.decRef(firstBitExpr);
    }
    literals.push(classEq);
    context.mkThAxiom(literals);
  }

  // get_fixed_value: the value of the bits up to the first that is unassigned, and whether all are.
  private getFixedValue(thVar: number) {
    const context = this.context;
    let value = 0n;
    let isFixed = true;
    const bits = this.bits[thVar];
    for (let index = 0; index < bits.length; index++) {
      const assignment = context.getAssignment(bits[index]);
      if (assignment === L_UNDEF) {
        isFixed = false;
        break;
      }
      if (assignment === L_TRUE) value += 1n << BigInt(index);
    }
    return { value, isFixed };
  }

  // fixed_var_eh: a variable whose bits are all assigned equals the last one with the same value.
  private fixedVarEh(thVar: number) {
    const value = this.getFixedValue(thVar).value;
    const size = this.getBvSize(thVar);
    const key = `${size}:${value}`;
    const other = this.fixedVars.get(key);
    if (other === undefined) {
      this.fixedVars.set(key, thVar);
      return;
    }
    const otherValue = other < this.getNumVars() ? this.getFixedValue(other) : undefined;
    if (
      otherValue === undefined ||
      this.getBvSize(other) !== size ||
      !otherValue.isFixed ||
      otherValue.value !== value
    ) {
      this.fixedVars.delete(key);
      this.fixedVars.set(key, thVar);
      return;
    }
    const node = this.getEnode(thVar);
    const otherNode = this.getEnode(other);
    if (node.root === otherNode.root) return;
    this.addFixedEq(thVar, other);
    const justification = new FixedEqJustification(
      this.id,
      this.context,
      this.bits[thVar],
      this.bits[other],
    );
    this.context.pushEq(node, otherNode, { kind: "justification", justification });
    this.fixedVars.set(key, other);
  }

  private internalizeNum(term: number) {
    const manager = this.manager;
    const value = manager.getBvNumeralValue(term);
    const size = manager.getBvSize(manager.sorts[term]);
    const thVar = this.mkEnode(term).getThVar(this.id);
    const bits = this.bits[thVar];
    for (let index = 0; index < size; index++) {
      bits.push(((value >> BigInt(index)) & 1n) === 1n ? TRUE_LITERAL : FALSE_LITERAL);
      this.registerTrueFalseBit(thVar, index);
    }
    this.fixedVarEh(thVar);
  }

  private processArgs(term: number) {
    const manager = this.manager;
    this.context.internalizeAll(manager.getArgs(term), false);
  }

  private getArgBits(node: Enode, index: number) {
    return this.getBits(this.getVar(node.getArg(index)));
  }

  private internalizeBlast(term: number, blast: Blast, isAssociative: boolean) {
    this.processArgs(term);
    const node = this.mkEnode(term);
    const numArgs = node.numArgs;
    const parameters = this.manager.funcDecls[this.manager.decls[term]].parameters;
    if (!isAssociative) {
      const args = Array.from({ length: numArgs }, (_, index) => this.getArgBits(node, index));
      const bits: number[] = [];
      blast(this.blaster, args, parameters[0], bits);
      this.initBits(node, bits);
      this.dropAll(bits);
      for (let index = args.length - 1; index >= 0; index--) this.dropAll(args[index]);
      return;
    }
    let argBits: number[] = [];
    let bits = this.getArgBits(node, numArgs - 1);
    let newBits: number[] = [];
    for (let index = numArgs - 2; index >= 0; index--) {
      this.dropAll(argBits);
      argBits = this.getArgBits(node, index);
      this.dropAll(newBits);
      newBits = [];
      blast(this.blaster, [argBits, bits], 0, newBits);
      const swapped = bits;
      bits = newBits;
      newBits = swapped;
    }
    this.initBits(node, bits);
    this.dropAll(newBits);
    this.dropAll(bits);
    this.dropAll(argBits);
  }

  private internalizeSub(term: number) {
    this.processArgs(term);
    const node = this.mkEnode(term);
    const first = this.getArgBits(node, 0);
    const second = this.getArgBits(node, 1);
    const bits: number[] = [];
    const carry = this.blaster.mkSubtracter(first, second, bits);
    this.initBits(node, bits);
    this.manager.decRef(carry);
    this.dropAll(bits);
    this.dropAll(second);
    this.dropAll(first);
  }

  private internalizeConcat(term: number) {
    this.processArgs(term);
    const node = this.mkEnode(term);
    const thVar = node.getThVar(this.id);
    this.bits[thVar].length = 0;
    for (let index = node.numArgs - 1; index >= 0; index--)
      for (const bit of this.bits[this.getVar(node.getArg(index))]) this.addBit(thVar, bit);
    this.findWpos(thVar);
  }

  private internalizeExtract(term: number) {
    this.processArgs(term);
    const node = this.mkEnode(term);
    const thVar = node.getThVar(this.id);
    const argBits = this.bits[this.getVar(node.getArg(0))];
    this.bits[thVar].length = 0;
    for (let index = this.getParameter(term, 1); index <= this.getParameter(term, 0); index++)
      this.addBit(thVar, argBits[index]);
    this.findWpos(thVar);
  }

  private internalizeMkbv(term: number) {
    const manager = this.manager;
    this.processArgs(term);
    const node = this.mkEnode(term);
    const bits = manager.getArgs(term);
    for (const bit of bits) manager.incRef(bit);
    this.initBits(node, bits);
    this.dropAll(bits);
  }

  internalizeTerm(term: number) {
    const manager = this.manager;
    const op = manager.getOp(term);
    if (UNINTERPRETED_OPS.has(op)) return false;
    // scoped_suspend_rlimit: the circuits count their steps but are never canceled.
    const limit = manager.limit;
    const wasSuspended = limit.isSuspended;
    limit.isSuspended = true;
    try {
      this.internalizeTermCore(term, op);
      if (DIVREM_OPS.has(op) && !this.context.relevancy.isEnabled)
        this.assertDivremBoundAxiom(term);
    } finally {
      limit.isSuspended = wasSuspended;
    }
    return true;
  }

  private internalizeTermCore(term: number, op: number) {
    if (op === OP_BV_NUM) this.internalizeNum(term);
    else if (op === OP_BSUB) this.internalizeSub(term);
    else if (op === OP_CONCAT) this.internalizeConcat(term);
    else if (op === OP_EXTRACT) this.internalizeExtract(term);
    else if (op === OP_MKBV) this.internalizeMkbv(term);
    else {
      const acBlast = AC_BLASTS.get(op);
      const blast = acBlast ?? UNARY_BLASTS.get(op) ?? BINARY_BLASTS.get(op);
      if (blast === undefined)
        throw new SmtUnsupportedError(
          `the bit-vector operator ${this.manager.funcDecls[this.manager.decls[term]].name}`,
        );
      this.internalizeBlast(term, blast, acBlast !== undefined);
    }
  }

  internalizeAtom(atom: number) {
    const op = this.manager.getOp(atom);
    if (op === OP_BIT2BOOL) this.mkBit2Bool(atom);
    else if (op === OP_ULEQ || op === OP_SLEQ) this.internalizeLe(atom, op === OP_SLEQ);
    else if (op === OP_BUMUL_NO_OVFL || op === OP_BSMUL_NO_OVFL || op === OP_BSMUL_NO_UDFL)
      this.internalizeNoOverflow(atom, op);
    else
      throw new SmtUnsupportedError(
        `the bit-vector predicate ${this.manager.funcDecls[this.manager.decls[atom]].name}`,
      );
    return true;
  }

  private getAppArgBits(term: number, index: number) {
    return this.getBits(this.getVar(this.getInternalizedEnode(this.manager.getArg(term, index))));
  }

  // The atom and the literal of its circuit, equivalent by two axioms.
  private mkDefinedAtom(atom: number, circuit: number) {
    const context = this.context;
    this.manager.incRef(circuit);
    context.internalize(circuit, true);
    const def = context.getLiteral(circuit);
    const literal = mkLiteral(context.mkBoolVar(atom));
    context.setVarTheory(getVar(literal), this.id);
    this.insertAtom(getVar(literal), { isBit: false, literal, def });
    context.mkThAxiom([literal, negate(def)]);
    context.mkThAxiom([negate(literal), def]);
    this.manager.decRef(circuit);
  }

  private internalizeNoOverflow(atom: number, op: number) {
    this.processArgs(atom);
    const first = this.getAppArgBits(atom, 0);
    const second = this.getAppArgBits(atom, 1);
    const blaster = this.blaster;
    const circuit =
      op === OP_BUMUL_NO_OVFL
        ? blaster.mkUmulNoOverflow(first, second)
        : op === OP_BSMUL_NO_OVFL
          ? blaster.mkSmulNoOverflow(first, second)
          : blaster.mkSmulNoUnderflow(first, second);
    this.mkDefinedAtom(atom, circuit);
    this.manager.decRef(circuit);
    this.dropAll(second);
    this.dropAll(first);
  }

  private internalizeLe(atom: number, isSigned: boolean) {
    this.processArgs(atom);
    const first = this.getAppArgBits(atom, 0);
    const second = this.getAppArgBits(atom, 1);
    if (!this.context.isBInternalized(atom)) {
      const circuit = isSigned
        ? this.blaster.mkSle(first, second)
        : this.blaster.mkUle(first, second);
      this.mkDefinedAtom(atom, circuit);
      this.manager.decRef(circuit);
    }
    this.dropAll(second);
    this.dropAll(first);
  }

  applySortCnstr(node: Enode) {
    if (this.isAttachedToVar(node)) return;
    this.mkBits(this.mkVar(node));
    if (this.context.isRelevant(node.owner)) this.relevantEh(node.owner);
  }

  newEqEh(first: number, second: number) {
    this.merge(first, second);
  }

  newDiseqEh(first: number, second: number) {
    const manager = this.manager;
    if (manager.isBvSort(manager.sorts[this.getExpr(first)])) this.expandDiseq(first, second);
  }

  // expand_diseq: two variables differ in a bit, unless they already do.
  private expandDiseq(inputFirst: number, inputSecond: number) {
    const context = this.context;
    const manager = this.manager;
    const first = Math.min(inputFirst, inputSecond);
    const second = Math.max(inputFirst, inputSecond);
    const firstBits = this.bits[first];
    const secondBits = this.bits[second];
    for (let index = 0; index < firstBits.length; index++) {
      if (firstBits[index] === negate(secondBits[index])) return;
      const firstValue = context.getAssignment(firstBits[index]);
      const secondValue = context.getAssignment(secondBits[index]);
      if (firstValue !== L_UNDEF && secondValue !== L_UNDEF && firstValue !== secondValue) return;
    }
    const literals = [this.mkEq(this.getExpr(first), this.getExpr(second), true)];
    for (let index = 0; index < firstBits.length; index++) {
      const firstExpr = this.literalToExpr(firstBits[index]);
      const secondExpr = this.literalToExpr(secondBits[index]);
      const difference = this.blaster.mkXor(firstExpr, secondExpr);
      context.internalize(difference, true);
      literals.push(context.getLiteral(difference));
      manager.decRef(difference);
      manager.decRef(secondExpr);
      manager.decRef(firstExpr);
    }
    context.mkThAxiom(literals);
  }

  assignEh(boolVar: BoolVar) {
    const atom = this.atoms[boolVar];
    if (atom === undefined || !atom.isBit) return;
    const queue = this.propQueue;
    queue.length = 0;
    for (let occ = atom.occs; occ !== null; occ = occ.next) queue.push(occ.thVar, occ.index);
    this.propagateBits();
  }

  // propagate_bits: the value of each queued bit goes to the bits at its position in its class.
  private propagateBits() {
    const context = this.context;
    const queue = this.propQueue;
    for (let entry = 0; entry < queue.length; entry += 2) {
      const thVar = queue[entry];
      const index = queue[entry + 1];
      if (this.wpos[thVar] === index) this.findWpos(thVar);
      const bit = this.bits[thVar][index];
      const value = context.getAssignment(bit);
      if (value === L_UNDEF) continue;
      const antecedent = value === L_FALSE ? negate(bit) : bit;
      for (let other = this.nexts[thVar]; other !== thVar; other = this.nexts[other]) {
        const otherBit = this.bits[other][index];
        if (bit === negate(otherBit)) {
          this.addNewDiseqAxiom(thVar, other, index);
          return;
        }
        if (value === context.getAssignment(otherBit)) continue;
        this.assignBit(
          value === L_FALSE ? negate(otherBit) : otherBit,
          thVar,
          other,
          index,
          antecedent,
          false,
        );
        if (context.isInconsistent()) {
          queue.length = 0;
          return;
        }
      }
    }
    queue.length = 0;
  }

  private assignBit(
    consequent: Literal,
    first: number,
    second: number,
    index: number,
    antecedent: Literal,
    isPropagatingClass: boolean,
  ) {
    const context = this.context;
    const justification = new BitEqJustification(
      this.id,
      this.getEnode(first),
      this.getEnode(second),
      antecedent,
    );
    if (consequent === FALSE_LITERAL) {
      context.setConflict(justification, null);
      return;
    }
    context.assign(consequent, justification);
    const eq = this.mkEq(this.getExpr(first), this.getExpr(second), false);
    const literals = [negate(consequent), antecedent, negate(eq)];
    for (const literal of literals) context.markLiteralAsRelevant(literal);
    context.mkThAxiom(literals);
    if (this.wpos[second] === index) this.findWpos(second);
    const atom = this.atoms[getVar(consequent)];
    if (atom === undefined || !atom.isBit) return;
    const root = this.find(second);
    for (let occ = atom.occs; occ !== null; occ = occ.next)
      if (isPropagatingClass || this.find(occ.thVar) !== root || occ.index !== index)
        this.propQueue.push(occ.thVar, occ.index);
  }

  relevantEh(expr: number) {
    const context = this.context;
    const manager = this.manager;
    if (context.relevancy.isEnabled && DIVREM_OPS.has(manager.getOp(expr))) {
      context.markAsRelevant(manager.getArg(expr, 0));
      context.markAsRelevant(manager.getArg(expr, 1));
      this.assertDivremBoundAxiom(expr);
    }
    if (manager.isBool(expr)) {
      if (!context.isBInternalized(expr)) return;
      const atom = this.atoms[context.getBoolVar(expr)];
      if (atom !== undefined && !atom.isBit) context.markLiteralAsRelevant(atom.def);
      return;
    }
    if (!context.isEInternalized(expr)) return;
    const thVar = this.getInternalizedEnode(expr).getThVar(this.id);
    if (thVar < 0) return;
    for (const bit of this.bits[thVar]) context.markLiteralAsRelevant(bit);
  }

  pushScopeEh() {
    super.pushScopeEh();
    this.trailLimits.push(this.trail.length);
  }

  popScopeEh(numScopes: number) {
    const newLevel = this.trailLimits.length - numScopes;
    const limit = this.trailLimits[newLevel];
    for (let index = this.trail.length - 1; index >= limit; index--) this.trail[index]();
    this.trail.length = limit;
    this.trailLimits.length = newLevel;
    const numOldVars = this.getOldNumVars(numScopes);
    this.bits.length = numOldVars;
    this.wpos.length = numOldVars;
    this.zeroOneBits.length = numOldVars;
    super.popScopeEh(numScopes);
  }

  includeFuncInterp(decl: FuncDecl) {
    return DIV0_OPS.has(decl.op);
  }

  // merge_eh: the bits of the two classes take each other's values, unless they conflict.
  private mergeEh(firstRoot: number, secondRoot: number, first: number, second: number) {
    if (!this.mergeZeroOneBits(firstRoot, secondRoot)) return;
    const context = this.context;
    this.propQueue.length = 0;
    const size = this.bits[first].length;
    let isChanged = true;
    while (isChanged) {
      isChanged = false;
      for (let index = 0; index < size; index++) {
        const firstBit = this.bits[first][index];
        const secondBit = this.bits[second][index];
        if (firstBit === negate(secondBit)) {
          this.addNewDiseqAxiom(first, second, index);
          return;
        }
        const firstValue = context.getAssignment(firstBit);
        const secondValue = context.getAssignment(secondBit);
        if (firstValue === L_UNDEF && !context.isRelevant(context.boolVar2Expr[getVar(firstBit)]))
          context.markLiteralAsRelevant(firstBit);
        if (secondValue === L_UNDEF && !context.isRelevant(context.boolVar2Expr[getVar(secondBit)]))
          context.markLiteralAsRelevant(secondBit);
        if (firstValue === secondValue) continue;
        isChanged = true;
        if (firstValue !== L_UNDEF && secondBit !== FALSE_LITERAL && secondBit !== TRUE_LITERAL)
          this.assignBit(
            firstValue === L_FALSE ? negate(secondBit) : secondBit,
            first,
            second,
            index,
            firstValue === L_FALSE ? negate(firstBit) : firstBit,
            true,
          );
        else if (secondValue !== L_UNDEF)
          this.assignBit(
            secondValue === L_FALSE ? negate(firstBit) : firstBit,
            second,
            first,
            index,
            secondValue === L_FALSE ? negate(secondBit) : secondBit,
            true,
          );
        if (context.isInconsistent()) return;
      }
    }
    this.propagateBits();
  }

  // merge_zero_one_bits: the constant bits of the second class join the first's, unless a position
  // holds true in one and false in the other.
  private mergeZeroOneBits(firstRoot: number, secondRoot: number) {
    const secondBits = this.zeroOneBits[secondRoot];
    if (secondBits.length === 0) return true;
    const firstBits = this.zeroOneBits[firstRoot];
    const aux = this.mergeAux;
    const resetAux = () => {
      for (const bit of firstBits) aux[bit.isTrue ? 1 : 0][bit.index] = -1;
    };
    for (const bit of firstBits) aux[bit.isTrue ? 1 : 0][bit.index] = bit.owner;
    for (const bit of secondBits) {
      const conflicting = aux[bit.isTrue ? 0 : 1][bit.index] ?? -1;
      if (conflicting !== -1) {
        this.addNewDiseqAxiom(conflicting, bit.owner, bit.index);
        resetAux();
        return false;
      }
      if ((aux[bit.isTrue ? 1 : 0][bit.index] ?? -1) === -1) firstBits.push(bit);
    }
    resetAux();
    return true;
  }

  // unmerge_eh: the constant bits of the root keep those of its own class.
  private unmergeEh(root: number) {
    const bits = this.zeroOneBits[root];
    for (let index = bits.length - 1; index >= 0; index--)
      if (this.find(bits[index].owner) === root) {
        bits.length = index + 1;
        return;
      }
    bits.length = 0;
  }

  canPropagate() {
    return this.propDiseqsHead < this.propDiseqs.length;
  }

  propagate() {
    if (!this.canPropagate()) return;
    const context = this.context;
    const head = this.propDiseqsHead;
    context.pushTrail(() => {
      this.propDiseqsHead = head;
    });
    for (
      ;
      this.propDiseqsHead < this.propDiseqs.length && !context.isInconsistent();
      this.propDiseqsHead++
    ) {
      const diseq = this.propDiseqs[this.propDiseqsHead];
      this.assertNewDiseqAxiom(diseq.first, diseq.second);
    }
  }

  // mk_literal: the literal of an expression, which becomes relevant.
  private mkLiteral(expr: number) {
    const context = this.context;
    const manager = this.manager;
    manager.incRef(expr);
    const isNot = manager.isNot(expr);
    const atom = isNot ? manager.getArg(expr, 0) : expr;
    if (!context.isEInternalized(atom)) context.internalize(atom, false);
    const literal = context.getLiteral(atom);
    context.markLiteralAsRelevant(literal);
    manager.decRef(expr);
    return isNot ? negate(literal) : literal;
  }

  // theory::mk_eq: the literal of the equality, true for the same terms and false for distinct
  // values.
  private mkEq(first: number, second: number, isGateContext: boolean) {
    const context = this.context;
    const manager = this.manager;
    if (first === second) return TRUE_LITERAL;
    if (manager.areDistinct(first, second)) return FALSE_LITERAL;
    const eq = context.mkEqAtom(first, second);
    manager.incRef(eq);
    context.internalize(eq, isGateContext);
    const literal = context.getLiteral(eq);
    manager.decRef(eq);
    return literal;
  }

  // mk_bv_divrem_bound: the divisor is zero, or the quotient or remainder is bounded by the
  // dividend or the divisor.
  private assertDivremBoundAxiom(term: number) {
    const manager = this.manager;
    const op = manager.getOp(term);
    const dividend = manager.getArg(term, 0);
    const divisor = manager.getArg(term, 1);
    if (manager.isBvNumeral(divisor)) return;
    const sort = manager.sorts[term];
    const mkZero = () => manager.mkBvNumeral(0n, manager.getBvSize(sort));
    const mkAbs = (arg: number) => {
      const isNonNegative = mkBvApp(manager, OP_SLEQ, [mkZero(), arg]);
      manager.incRef(isNonNegative);
      const negation = mkBvApp(manager, OP_BNEG, [arg]);
      manager.incRef(negation);
      const result = manager.mkApp(OP_ITE, [isNonNegative, arg, negation], sort);
      manager.decRef(negation);
      manager.decRef(isNonNegative);
      return result;
    };
    const bound =
      op === OP_BUREM || op === OP_BUREM_I
        ? manager.mkNot(mkBvApp(manager, OP_ULEQ, [divisor, term]))
        : op === OP_BUDIV_I
          ? mkBvApp(manager, OP_ULEQ, [term, dividend])
          : op === OP_BSDIV_I
            ? mkBvApp(manager, OP_ULEQ, [mkAbs(term), mkAbs(dividend)])
            : manager.mkNot(mkBvApp(manager, OP_ULEQ, [mkAbs(divisor), mkAbs(term)]));
    const clause = [manager.mkEq(divisor, mkZero()), bound];
    for (const expr of clause) manager.incRef(expr);
    const literals = clause.map((expr) => this.mkLiteral(expr));
    this.context.mkThAxiom(literals);
    this.dropAll(clause);
  }

  mkValue(node: Enode) {
    const thVar = this.getThVar(node);
    return this.manager.mkBvNumeral(this.getFixedValue(thVar).value, this.getBvSize(thVar));
  }
}
