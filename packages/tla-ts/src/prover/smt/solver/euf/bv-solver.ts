// Ported from Z3 (src/sat/smt/bv_solver.h, src/sat/smt/bv_solver.cpp), MIT license, see
// z3-license.txt.
import { OP_INT2BV, OP_UBV2INT } from "../ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import type { ProtoModel } from "../proto-model";
import { CR_DONE } from "../sat/solver";
import { type BvAtom, BvInternalize, type EqOccurs } from "./bv-internalize";
import { type Enode, getClass, type ThEq } from "./egraph";
import type { EufSolver } from "./euf-solver";

const K_EQ2BIT = 0;
const K_NE2BIT = 1;
const K_BIT2EQ = 2;
const K_BIT2NE = 3;
const K_BV2INT = 4;

interface BvJustification {
  readonly kind: number;
  readonly index: number;
  readonly v1: number;
  readonly v2: number;
  readonly consequent: number;
  readonly antecedent: number;
  readonly nodes: readonly Enode[];
}

interface PropagationItem {
  readonly thVar: number;
  readonly index: number;
  readonly atom: BvAtom | null;
}

export class BvSolver extends BvInternalize {
  private fixedVarTable = new Map<string, number>();
  private propQueue: PropagationItem[] = [];
  private propQueueLim: number[] = [];
  private propQueueHead = 0;

  constructor(ctx: EufSolver, id: number) {
    super(ctx, id);
    this.find.handler = {
      mergeEh: (r2, r1, v2, v1) => this.mergeEh(r2, r1, v2, v1),
      unmergeEh: (r2, r1) => this.unmergeEh(r2, r1),
    };
  }

  private mkJustification(
    kind: number,
    index: number,
    v1: number,
    v2: number,
    consequent: number,
    antecedent: number,
    nodes: readonly Enode[] = [],
  ) {
    const justification: BvJustification = { kind, index, v1, v2, consequent, antecedent, nodes };
    return this.ctx.mkConstraint(this, justification);
  }

  protected fixedVarEh(v1: number) {
    const value = this.getFixedValue(v1) as bigint;
    const node = this.var2enodeOf(v1);
    const size = this.bits[v1].length;
    const key = `${value}:${size}`;
    const v2 = this.fixedVarTable.get(key);
    const isCurrent =
      v2 !== undefined &&
      v2 < this.numVars &&
      this.isBv(v2) &&
      this.bits[v2].length === size &&
      this.getFixedValue(v2) === value;
    if (!isCurrent) this.fixedVarTable.set(key, v1);
    else if (node.root !== this.var2enodeOf(v2).root) {
      this.ackerman.usedEqEh(v1, v2);
      this.ctx.propagateEq(
        node,
        this.var2enodeOf(v2),
        this.mkJustification(K_BIT2EQ, -1, v1, v2, -1, -1),
      );
    }
  }

  private getFixedValue(thVar: number) {
    const trueLit = this.trueLit;
    let result = 0n;
    const bits = this.bits[thVar];
    for (let index = 0; index < bits.length; index++) {
      const bit = bits[index];
      if (bit === (trueLit ^ 1)) continue;
      if (bit === trueLit) {
        result += 1n << BigInt(index);
        continue;
      }
      const value = this.s.value(bit);
      if (value === L_UNDEF) return undefined;
      if (value === L_TRUE) result += 1n << BigInt(index);
    }
    return result;
  }

  protected findWpos(thVar: number) {
    const bits = this.bits[thVar];
    const size = bits.length;
    for (let offset = 0; offset < size; offset++) {
      const index = (offset + this.wpos[thVar]) % size;
      if (this.s.value(bits[index]) === L_UNDEF) {
        this.wpos[thVar] = index;
        return false;
      }
    }
    this.fixedVarEh(thVar);
    return true;
  }

  protected findNewDiseqAxioms(atom: BvAtom, thVar: number, index: number) {
    const lit = this.bits[thVar][index] ^ 1;
    for (let occ = atom.occs; occ !== null; occ = occ.next)
      if (
        index === occ.index &&
        this.bits[occ.thVar].length === this.bits[thVar].length &&
        this.bits[occ.thVar][occ.index] === lit
      )
        this.mkNewDiseqAxiom(thVar, occ.thVar, index);
  }

  // v1[idx] = ~v2[idx], so v1 /= v2 is a theory axiom.
  private mkNewDiseqAxiom(v1: number, v2: number, _index: number) {
    const eq = this.manager.mkEq(this.var2expr(v1), this.var2expr(v2));
    this.addUnit(this.ctx.internalize(eq, false, false) ^ 1);
  }

  override newEqEh(eq: ThEq) {
    this.forcePush();
    if (this.isBv(eq.v1)) {
      this.find.merge(eq.v1, eq.v2);
      return;
    }
    const manager = this.manager;
    const node = this.var2enodeOf(eq.v1);
    const propagateBv2int = (bv2int: Enode) => {
      const arg = bv2int.getArg(0);
      for (const parent of node.root.parents) {
        if (
          manager.getFamily(parent.owner) === this.id &&
          manager.getOp(parent.owner) === OP_INT2BV &&
          manager.sorts[parent.owner] === manager.sorts[arg.owner] &&
          parent.root !== arg.root
        ) {
          const v1 = parent.getThVar(this.id);
          const v2 = arg.getThVar(this.id);
          this.ctx.propagateEq(
            parent,
            arg,
            this.mkJustification(K_BV2INT, -1, v1, v2, -1, -1, [node, parent.getArg(0), bv2int]),
          );
          break;
        }
      }
    };
    if (this.bv2ints.length < node.classSize) {
      for (const bv2int of this.bv2ints) if (bv2int.root === node.root) propagateBv2int(bv2int);
      return;
    }
    for (const bv2int of getClass(node))
      if (manager.getFamily(bv2int.owner) === this.id && manager.getOp(bv2int.owner) === OP_UBV2INT)
        propagateBv2int(bv2int);
  }

  override useDiseqs() {
    return true;
  }

  override newDiseqEh(ne: ThEq) {
    const s = this.s;
    let v1 = ne.v1;
    let v2 = ne.v2;
    if (!this.isBv(v1) || s.isProbing) return;
    const size = this.bits[v1].length;
    if (size === 1) return;
    let numUndef = 0;
    let undefIndex = 0;
    for (let index = 0; index < size; index++) {
      const first = this.bits[v1][index];
      const second = this.bits[v2][index];
      if (first === (second ^ 1)) return;
      const firstValue = s.value(first);
      const secondValue = s.value(second);
      if (firstValue !== L_UNDEF && secondValue !== L_UNDEF && firstValue !== secondValue) return;
      if (firstValue === L_UNDEF) {
        numUndef++;
        undefIndex = index + 1;
      }
      if (secondValue === L_UNDEF) {
        numUndef++;
        undefIndex = -(index + 1);
      }
      if (numUndef > 1) return;
    }
    if (numUndef === 0) return;
    if (undefIndex < 0) {
      undefIndex = -undefIndex;
      [v1, v2] = [v2, v1];
    }
    undefIndex--;
    const bit = this.bits[v2][undefIndex];
    const consequent =
      s.value(bit) === L_TRUE ? this.bits[v1][undefIndex] ^ 1 : this.bits[v1][undefIndex];
    const antecedent = this.expr2literal(ne.child.owner) ^ 1;
    this.ctx.propagate(
      consequent,
      this.mkJustification(K_NE2BIT, undefIndex, v1, v2, consequent, antecedent),
    );
  }

  override isExternal() {
    return true;
  }

  override getAntecedents(_lit: number, data: unknown, antecedents: number[]) {
    const justification = data as BvJustification;
    const s = this.s;
    const ctx = this.ctx;
    const pushPair = (first: number, second: number) => {
      const isFalse = s.value(first) === L_FALSE;
      antecedents.push(isFalse ? first ^ 1 : first, isFalse ? second ^ 1 : second);
    };
    const kind = justification.kind;
    if (kind === K_EQ2BIT) {
      antecedents.push(justification.antecedent);
      ctx.addEqAntecedent(this.var2enodeOf(justification.v1), this.var2enodeOf(justification.v2));
    } else if (kind === K_NE2BIT || kind === K_BIT2EQ) {
      if (kind === K_NE2BIT) antecedents.push(justification.antecedent);
      const firstBits = this.bits[justification.v1];
      const secondBits = this.bits[justification.v2];
      for (let index = firstBits.length - 1; index >= 0; index--) {
        const first = firstBits[index];
        const second = secondBits[index];
        if (first === second) continue;
        if (kind === K_NE2BIT && index === justification.index)
          antecedents.push(s.value(second) === L_FALSE ? second ^ 1 : second);
        else pushPair(first, second);
      }
    } else if (kind === K_BIT2NE) {
      const node = this.expr2enode(
        this.boolVar2expr(justification.consequent >> 1) as number,
      ) as Enode;
      const first = this.bits[node.getArg(0).getThVar(this.id)][justification.index];
      const second = this.bits[node.getArg(1).getThVar(this.id)][justification.index];
      antecedents.push(
        s.value(first) === L_FALSE ? first ^ 1 : first,
        s.value(second) === L_FALSE ? second ^ 1 : second,
      );
    } else {
      const [first, second, third] = justification.nodes;
      ctx.addEqAntecedent(first, second);
      ctx.addEqAntecedent(first, third);
    }
  }

  override asserted(lit: number) {
    const atom = this.getBv2a(lit >> 1);
    if (atom === undefined) return;
    this.forcePush();
    this.propQueue.push({ thVar: 0, index: 0, atom });
  }

  override unitPropagate() {
    if (this.propQueueHead === this.propQueue.length) return false;
    this.forcePush();
    const head = this.propQueueHead;
    this.ctx.trail.push(() => {
      this.propQueueHead = head;
    });
    const s = this.s;
    for (; this.propQueueHead < this.propQueue.length && !s.isInconsistent; this.propQueueHead++) {
      const item = this.propQueue[this.propQueueHead];
      const atom = item.atom;
      if (atom === null) {
        this.propagateBits(item.thVar, item.index);
        continue;
      }
      for (let occ = atom.occs; occ !== null; occ = occ.next)
        this.propagateBits(occ.thVar, occ.index);
      for (let eq = atom.eqs; eq !== null; eq = eq.next) this.propagateEqOccurs(eq);
    }
    return true;
  }

  private propagateEqOccurs(occ: EqOccurs) {
    const s = this.s;
    const lit = occ.lit;
    if (s.value(lit) !== L_UNDEF) return false;
    const bit1 = this.bits[occ.v1][occ.index];
    const bit2 = this.bits[occ.v2][occ.index];
    const value2 = s.value(bit2);
    if (value2 === L_UNDEF) {
      this.addEqOccurs(occ.bv2, occ.bv1, occ.index, occ.v2, occ.v1, lit, occ.node);
      return false;
    }
    if (s.value(bit1) === value2) return false;
    this.ctx.propagate(lit ^ 1, this.mkJustification(K_BIT2NE, occ.index, -1, -1, lit ^ 1, -1));
    return true;
  }

  private propagateBits(v1: number, index: number) {
    const s = this.s;
    if (this.wpos[v1] === index) this.findWpos(v1);
    const value = s.value(this.bits[v1][index]);
    if (value === L_UNDEF) return false;
    const bit1 = value === L_FALSE ? this.bits[v1][index] ^ 1 : this.bits[v1][index];
    let numBits = 0;
    let numAssigned = 0;
    for (let v2 = this.find.next(v1); v2 !== v1; v2 = this.find.next(v2)) {
      const bit2 = value === L_FALSE ? this.bits[v2][index] ^ 1 : this.bits[v2][index];
      numBits++;
      if (numBits > 3 && numAssigned === 0) break;
      if (s.value(bit2) === L_TRUE) continue;
      numAssigned++;
      if (!this.assignBit(bit2, v1, v2, index, bit1, false)) break;
    }
    if (s.value(this.bits[v1][this.wpos[v1]]) !== L_UNDEF) this.findWpos(v1);
    return numAssigned > 0;
  }

  override check() {
    this.forcePush();
    return CR_DONE;
  }

  protected override pushCore() {
    super.pushCore();
    this.propQueueLim.push(this.propQueue.length);
  }

  protected override popCore(numScopes: number) {
    const size = this.propQueueLim.length - numScopes;
    this.propQueue.length = this.propQueueLim[size];
    this.propQueueLim.length = size;
    super.popCore(numScopes);
    const numVars = this.numVars;
    this.bits.length = numVars;
    this.wpos.length = numVars;
    this.zeroOneBits.length = numVars;
  }

  override simplify() {
    this.ackerman.propagate();
  }

  override flushRoots() {
    const table = new Map<string, number>();
    for (let thVar = 0; thVar < this.numVars; thVar++) {
      const bits = this.bits[thVar];
      if (bits.length === 0) continue;
      const key = bits.join(",");
      const other = table.get(key);
      if (other === undefined) table.set(key, thVar);
      else if (this.find.find(thVar) !== this.find.find(other)) this.assertAckerman(thVar, other);
    }
  }

  override addValue(node: Enode, _model: ProtoModel, values: (number | undefined)[]) {
    const manager = this.manager;
    if (manager.isBvNumeral(node.owner)) {
      values[node.root.owner] = node.owner;
      return;
    }
    const bits = this.bits[node.getThVar(this.id)];
    let value = 0n;
    for (let index = 0; index < bits.length; index++)
      if (this.s.value(bits[index]) === L_TRUE) value += 1n << BigInt(index);
    values[node.root.owner] = manager.mkBvNumeral(value, bits.length);
  }

  private mergeEh(r1: number, r2: number, v1: number, v2: number) {
    if (!this.mergeZeroOneBits(r1, r2)) return;
    const s = this.s;
    const size = this.bits[v1].length;
    if (size === 1) return;
    for (let index = 0; !s.isInconsistent && index < size; index++) {
      const bit1 = this.bits[v1][index];
      const bit2 = this.bits[v2][index];
      if (bit1 === (bit2 ^ 1)) {
        this.mkNewDiseqAxiom(v1, v2, index);
        return;
      }
      const value1 = s.value(bit1);
      const value2 = s.value(bit2);
      if (value1 === value2) continue;
      if (value1 === L_FALSE) this.assignBit(bit2 ^ 1, v1, v2, index, bit1 ^ 1, true);
      else if (value1 === L_TRUE) this.assignBit(bit2, v1, v2, index, bit1, true);
      else if (value2 === L_FALSE) this.assignBit(bit1 ^ 1, v2, v1, index, bit2 ^ 1, true);
      else if (value2 === L_TRUE) this.assignBit(bit1, v2, v1, index, bit2, true);
    }
  }

  private assignBit(
    consequent: number,
    v1: number,
    v2: number,
    index: number,
    antecedent: number,
    isPropagatingEqc: boolean,
  ) {
    const s = this.s;
    this.ctx.propagate(
      consequent,
      this.mkJustification(K_EQ2BIT, -1, v1, v2, consequent, antecedent),
    );
    if (s.value(consequent) === L_FALSE) return false;
    if (this.wpos[v2] === index) this.findWpos(v2);
    const atom = this.getBv2a(consequent >> 1);
    this.forcePush();
    if (atom !== undefined)
      for (let occ = atom.occs; occ !== null; occ = occ.next)
        if (
          isPropagatingEqc ||
          this.find.find(occ.thVar) !== this.find.find(v2) ||
          occ.index !== index
        )
          this.propQueue.push({ thVar: occ.thVar, index: occ.index, atom: null });
    return true;
  }

  private unmergeEh(v1: number, _v2: number) {
    const bits = this.zeroOneBits[v1];
    for (let index = bits.length - 1; index >= 0; index--)
      if (this.find.find(bits[index].owner) === v1) {
        bits.length = index + 1;
        return;
      }
    bits.length = 0;
  }

  private mergeZeroOneBits(r1: number, r2: number) {
    const bits2 = this.zeroOneBits[r2];
    if (bits2.length === 0) return true;
    const bits1 = this.zeroOneBits[r1];
    const owners: number[][] = [[], []];
    for (const bit of bits1) owners[bit.isTrue ? 1 : 0][bit.index] = bit.owner;
    for (const bit of bits2) {
      const v1 = owners[bit.isTrue ? 0 : 1][bit.index];
      if (v1 !== undefined) {
        this.mkNewDiseqAxiom(v1, bit.owner, bit.index);
        return false;
      }
      if (owners[bit.isTrue ? 1 : 0][bit.index] === undefined) bits1.push(bit);
    }
    return true;
  }
}
