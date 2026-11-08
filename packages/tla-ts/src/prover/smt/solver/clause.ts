// Ported from Z3 (src/smt/smt_clause.h, src/smt/smt_b_justification.h,
// src/util/small_object_allocator.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import type { Justification } from "./enode";
import type { Literal } from "./literal";
import { setAt } from "./array";

export const CLS_AUX = 0;
export const CLS_LEARNED = 1;
export const CLS_TH_AXIOM = 2;
export const CLS_TH_LEMMA = 3;

export class BinJustification {
  constructor(readonly literal: Literal) {}
}

export type BJustification = number | BinJustification | Justification | "axiom" | null;

// The second header word packs Z3's bit fields: m_capacity:24, m_kind:2, m_reinit,
// m_reinternalize_atoms, m_has_atoms, m_has_del_eh, m_has_justification and m_deleted.
const CAPACITY_MASK = 0xffffff;
const KIND_SHIFT = 24;
const IS_REINIT = 1 << 26;
const IS_REINTERNALIZE_ATOMS = 1 << 27;
const HAS_ATOMS = 1 << 28;
const HAS_DEL_EH = 1 << 29;
const HAS_JUSTIFICATION = 1 << 30;
const IS_DELETED = 1 << 31;
export const HEADER_SIZE = 2;
const NO_ATOM = -1;

// A clause is the offset of its block in one Int32Array, as it is an address in Z3. A block holds
// the header, the literals, then a lemma's activity, the deletion handler and justification slots,
// and the atoms with their signs, each present only when used. A freed block goes on the free list
// of its size, keeping the next free block in its first word and 0 in its second, which no clause
// has.
export class ClauseStore {
  // Literal i of clause c is data[c + 2 + i]. Making a clause can replace the array, so a loop that
  // makes clauses reads it again.
  data = new Int32Array(1 << 16);
  private top = 0;
  private freeLists: (number | undefined)[] = [];
  private delEhs: ((() => void) | null)[] = [];
  private freeDelEhSlots: number[] = [];
  private justifications: (Justification | null)[] = [];
  private freeJustificationSlots: number[] = [];

  private getSize(flags: number) {
    const capacity = flags & CAPACITY_MASK;
    return (
      HEADER_SIZE +
      capacity +
      (isLemmaKind((flags >>> KIND_SHIFT) & 3) ? 1 : 0) +
      (flags & HAS_DEL_EH ? 1 : 0) +
      (flags & HAS_JUSTIFICATION ? 1 : 0) +
      (flags & HAS_ATOMS ? capacity : 0)
    );
  }

  private allocate(size: number) {
    const head = this.freeLists[size];
    if (head !== undefined && head !== -1) {
      this.freeLists[size] = this.data[head];
      return head;
    }
    const block = this.top;
    this.top += size;
    if (this.top > this.data.length) {
      const grown = new Int32Array(Math.max(2 * this.data.length, this.top));
      grown.set(this.data);
      this.data = grown;
    }
    return block;
  }

  mk(
    literals: Literal[],
    kind: number,
    justification: Justification | null,
    delEh: (() => void) | null,
    atoms: number[] | null,
  ) {
    const numLiterals = literals.length;
    const flags =
      numLiterals |
      (kind << KIND_SHIFT) |
      (atoms !== null ? HAS_ATOMS : 0) |
      (delEh !== null ? HAS_DEL_EH : 0) |
      (justification !== null ? HAS_JUSTIFICATION : 0);
    const clause = this.allocate(this.getSize(flags));
    const data = this.data;
    data[clause] = numLiterals;
    data[clause + 1] = flags;
    for (let index = 0; index < numLiterals; index++)
      data[clause + HEADER_SIZE + index] = literals[index];
    let extra = clause + HEADER_SIZE + numLiterals;
    if (isLemmaKind(kind)) data[extra++] = 1;
    if (delEh !== null) data[extra++] = this.mkSlot(this.delEhs, this.freeDelEhSlots, delEh);
    if (justification !== null)
      data[extra++] = this.mkSlot(this.justifications, this.freeJustificationSlots, justification);
    if (atoms !== null)
      for (let index = 0; index < numLiterals; index++)
        data[extra + index] = 2 * atoms[index] + (literals[index] & 1);
    return clause;
  }

  private mkSlot<T>(values: (T | null)[], freeSlots: number[], value: T) {
    const slot = freeSlots.pop() ?? values.length;
    setAt(values, slot, value);
    return slot;
  }

  // The atoms must be released first.
  free(clause: Clause) {
    const data = this.data;
    const flags = data[clause + 1];
    if (flags & HAS_DEL_EH) {
      const slot = data[this.getSlotAddress(clause, HAS_DEL_EH)];
      this.delEhs[slot] = null;
      this.freeDelEhSlots.push(slot);
    }
    if (flags & HAS_JUSTIFICATION) {
      const slot = data[this.getSlotAddress(clause, HAS_JUSTIFICATION)];
      this.justifications[slot] = null;
      this.freeJustificationSlots.push(slot);
    }
    const size = this.getSize(flags);
    const head = this.freeLists[size];
    data[clause] = head ?? -1;
    data[clause + 1] = 0;
    setAt(this.freeLists, size, clause);
  }

  private getExtra(clause: Clause) {
    return clause + HEADER_SIZE + (this.data[clause + 1] & CAPACITY_MASK);
  }

  checkLive(clause: Clause) {
    if ((this.data[clause + 1] & CAPACITY_MASK) === 0)
      throw new SmtInvariantError("the clause was freed");
  }

  getNumLiterals(clause: Clause) {
    return this.data[clause];
  }

  getLiteral(clause: Clause, index: number) {
    return this.data[clause + HEADER_SIZE + index] as Literal;
  }

  setLiteral(clause: Clause, index: number, literal: Literal) {
    this.data[clause + HEADER_SIZE + index] = literal;
  }

  getLiterals(clause: Clause) {
    const literals: Literal[] = [];
    for (let index = 0; index < this.data[clause]; index++)
      literals.push(this.getLiteral(clause, index));
    return literals;
  }

  swapLiterals(clause: Clause, first: number, second: number) {
    const data = this.data;
    const saved = data[clause + HEADER_SIZE + first];
    data[clause + HEADER_SIZE + first] = data[clause + HEADER_SIZE + second];
    data[clause + HEADER_SIZE + second] = saved;
  }

  getKind(clause: Clause) {
    return (this.data[clause + 1] >>> KIND_SHIFT) & 3;
  }

  isLemma(clause: Clause) {
    return isLemmaKind(this.getKind(clause));
  }

  private setFlag(clause: Clause, flag: number, value: boolean) {
    this.data[clause + 1] = value ? this.data[clause + 1] | flag : this.data[clause + 1] & ~flag;
  }

  isDeleted(clause: Clause) {
    return (this.data[clause + 1] & IS_DELETED) !== 0;
  }

  markAsDeleted(clause: Clause) {
    this.setFlag(clause, IS_DELETED, true);
  }

  isReinit(clause: Clause) {
    return (this.data[clause + 1] & IS_REINIT) !== 0;
  }

  setReinit(clause: Clause, value: boolean) {
    this.setFlag(clause, IS_REINIT, value);
  }

  isReinternalizeAtoms(clause: Clause) {
    return (this.data[clause + 1] & IS_REINTERNALIZE_ATOMS) !== 0;
  }

  setReinternalizeAtoms(clause: Clause, value: boolean) {
    this.setFlag(clause, IS_REINTERNALIZE_ATOMS, value);
  }

  getActivity(clause: Clause) {
    return this.data[this.getExtra(clause)];
  }

  incActivity(clause: Clause) {
    this.data[this.getExtra(clause)]++;
  }

  private getSlotAddress(clause: Clause, flag: number) {
    const flags = this.data[clause + 1];
    return (
      this.getExtra(clause) +
      (isLemmaKind((flags >>> KIND_SHIFT) & 3) ? 1 : 0) +
      (flag === HAS_JUSTIFICATION && flags & HAS_DEL_EH ? 1 : 0)
    );
  }

  getDelEh(clause: Clause) {
    if ((this.data[clause + 1] & HAS_DEL_EH) === 0) return null;
    return this.delEhs[this.data[this.getSlotAddress(clause, HAS_DEL_EH)]];
  }

  getJustification(clause: Clause) {
    if ((this.data[clause + 1] & HAS_JUSTIFICATION) === 0) return null;
    return this.justifications[this.data[this.getSlotAddress(clause, HAS_JUSTIFICATION)]];
  }

  private getAtomsAddress(clause: Clause) {
    const flags = this.data[clause + 1];
    if ((flags & HAS_ATOMS) === 0) return -1;
    return this.getSlotAddress(clause, HAS_JUSTIFICATION) + (flags & HAS_JUSTIFICATION ? 1 : 0);
  }

  getAtoms(clause: Clause) {
    const address = this.getAtomsAddress(clause);
    if (address === -1 || this.data[address] === NO_ATOM) return [];
    const atoms: number[] = [];
    for (let index = 0; index < this.data[clause]; index++)
      atoms.push(this.data[address + index] >> 1);
    return atoms;
  }

  getAtomSign(clause: Clause, index: number) {
    return (this.data[this.getAtomsAddress(clause) + index] & 1) === 1;
  }

  clearAtoms(clause: Clause) {
    const address = this.getAtomsAddress(clause);
    if (address === -1) return;
    for (let index = 0; index < (this.data[clause + 1] & CAPACITY_MASK); index++)
      this.data[address + index] = NO_ATOM;
  }
}

export type Clause = number;

const isLemmaKind = (kind: number) => kind === CLS_LEARNED || kind === CLS_TH_LEMMA;
