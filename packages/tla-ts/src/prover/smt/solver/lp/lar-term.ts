// Ported from Z3 (src/math/lp/lar_term.h), MIT license, see z3-license.txt.
// It is kept in a u_map so that its iteration order is Z3's.
import { getIdentityHash, ObjMap } from "../hashtable";
import { Rational } from "../rational";
import { Impq } from "./numeric-pair";

export class LarTerm {
  readonly coeffs = new ObjMap<Rational>(getIdentityHash);
  column = -1;

  constructor(entries: Iterable<[number, Rational]> = []) {
    for (const entry of entries) this.addMonomial(entry[1], entry[0]);
  }

  get size() {
    return this.coeffs.size;
  }

  clear() {
    this.coeffs.clear();
  }

  addMonomial(coeff: Rational, column: number) {
    if (coeff.isZero()) return;
    const existing = this.coeffs.get(column);
    if (existing === undefined) {
      this.coeffs.set(column, coeff);
      return;
    }
    const sum = existing.add(coeff);
    if (sum.isZero()) this.coeffs.delete(column);
    else this.coeffs.replace(column, sum);
  }

  apply(values: Impq[]) {
    let value = Impq.zero;
    for (const entry of this.coeffs) value = value.add(values[entry[0]].mul(entry[1]));
    return value;
  }

  substByTerm(term: LarTerm, termColumn: number) {
    const coeff = this.coeffs.get(termColumn);
    if (coeff === undefined) return;
    this.coeffs.delete(termColumn);
    for (const entry of term.coeffs) this.addMonomial(coeff.mul(entry[1]), entry[0]);
  }

  getNormalized() {
    const entries = [...this.coeffs];
    if (entries.length === 0) return { term: this, coeff: Rational.one };
    const coeff = entries[0][1];
    if (coeff.equals(Rational.one)) return { term: this, coeff };
    const term = new LarTerm();
    term.addMonomial(Rational.one, entries[0][0]);
    for (let index = 1; index < entries.length; index++)
      term.addMonomial(entries[index][1].div(coeff), entries[index][0]);
    return { term, coeff };
  }
}
