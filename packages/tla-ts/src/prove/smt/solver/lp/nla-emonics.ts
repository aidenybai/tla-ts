// Ported from Z3 (src/math/lp/monic.h, src/math/lp/emonics.h, src/math/lp/emonics.cpp), MIT
// license, see z3-license.txt. The monomials v := v1 * ... * vn of nla, canonized over the
// variable equivalences, with the cyclic use lists of their variables and the congruence classes
// of monomials equal up to sign.
import { getSignedVarVar, isSignedVarNegated, negateSignedVar, VarEqs } from "./nla-var-eqs";
import { TrailStack, UnionFind } from "./union-find";

const compareNumbers = (first: number, second: number) => first - second;

export class Monic {
  readonly vars: number[];
  // The roots of the variables, sorted, and the parity of their signs.
  rvars: number[] = [];
  rsign = false;
  visited = 0;
  isPropagated = false;
  isBoundPropagated = false;

  constructor(
    readonly variable: number,
    vars: number[],
  ) {
    this.vars = [...vars].sort(compareNumbers);
  }

  get size() {
    return this.vars.length;
  }

  containsVar(lpVar: number) {
    return this.vars.includes(lpVar);
  }
}

// A cell of a cyclic use list: the index of a monic, and the next cell.
class Cell {
  next: Cell = this;

  constructor(readonly index: number) {}
}

interface HeadTail {
  head: Cell | null;
  tail: Cell | null;
}

const getKey = (vars: number[]) => vars.join(",");

export class Emonics {
  readonly trail = new TrailStack();
  private unionFind = new UnionFind(this.trail);
  readonly monics: Monic[] = [];
  private var2index: number[] = [];
  private visitedStamp = 0;
  private useLists: HeadTail[] = [];
  // The congruence table: the monics of each rooted variable list, the first its representative.
  private cgTable = new Map<string, number[]>();

  constructor(private varEqs: VarEqs) {
    varEqs.setMergeHandler(this.varEqsHandler);
  }

  // The handlers of var_eqs' union-find, over signed variables.
  readonly varEqsHandler = {
    afterMergeEh: (r2: number, r1: number) => {
      if (
        getSignedVarVar(r1) !== getSignedVarVar(r2) &&
        this.varEqs.find(negateSignedVar(r1)) !== this.varEqs.find(negateSignedVar(r2))
      )
        return;
      this.reserveUseLists(Math.max(getSignedVarVar(r2), getSignedVarVar(r1)) + 1);
      this.rehashCg(getSignedVarVar(r1));
      this.mergeCells(this.useLists[getSignedVarVar(r2)], this.useLists[getSignedVarVar(r1)]);
    },
    unmergeEh: (r2: number, r1: number) => {
      if (
        getSignedVarVar(r1) !== getSignedVarVar(r2) &&
        this.varEqs.find(negateSignedVar(r1)) === this.varEqs.find(negateSignedVar(r2))
      )
        return;
      this.unmergeCells(this.useLists[getSignedVarVar(r2)], this.useLists[getSignedVarVar(r1)]);
      this.rehashCg(getSignedVarVar(r1));
    },
  };

  get numMonics() {
    return this.monics.length;
  }

  get(lpVar: number) {
    return this.monics[this.var2index[lpVar]];
  }

  isMonicVar(lpVar: number) {
    const index = this.var2index[lpVar];
    return index !== undefined && index !== -1;
  }

  isUsedInMonic(lpVar: number) {
    return lpVar < this.useLists.length && this.useLists[lpVar].head !== null;
  }

  push() {
    this.trail.pushScope();
    this.varEqs.push();
  }

  pop(count: number) {
    for (let index = 0; index < count; index++) {
      this.varEqs.pop(1);
      this.trail.popScope(1);
    }
  }

  add(lpVar: number, vars: number[]) {
    this.varEqs.push();
    const index = this.monics.length;
    const monic = new Monic(lpVar, vars);
    this.monics.push(monic);
    this.doCanonize(monic);
    this.trail.push(() => this.popMonic());
    let lastVar = -1;
    for (const rvar of monic.rvars) {
      if (rvar === lastVar) continue;
      this.reserveUseLists(rvar + 1);
      this.insertCell(this.useLists[rvar], index);
      lastVar = rvar;
    }
    while (this.var2index.length < lpVar) this.var2index.push(-1);
    this.var2index[lpVar] = index;
    this.insertCgMon(monic);
    this.varEqs.push();
  }

  private popMonic() {
    this.varEqs.pop(1);
    const monic = this.monics[this.monics.length - 1];
    this.removeCgMon(monic);
    this.var2index[monic.variable] = -1;
    this.doCanonize(monic);
    let lastVar = -1;
    for (const rvar of monic.rvars) {
      if (rvar === lastVar) continue;
      this.removeCell(this.useLists[rvar]);
      lastVar = rvar;
    }
    this.varEqs.pop(1);
    this.monics.pop();
  }

  setPropagated(monic: Monic) {
    const target = this.get(monic.variable);
    target.isPropagated = true;
    this.trail.push(() => {
      target.isPropagated = false;
    });
  }

  setBoundPropagated(monic: Monic) {
    const target = this.get(monic.variable);
    target.isBoundPropagated = true;
    this.trail.push(() => {
      target.isBoundPropagated = false;
    });
  }

  private reserveUseLists(size: number) {
    while (this.useLists.length < size) this.useLists.push({ head: null, tail: null });
  }

  private incVisited() {
    this.visitedStamp++;
  }

  private setVisited(monic: Monic) {
    this.get(monic.variable).visited = this.visitedStamp;
  }

  private isVisited(monic: Monic) {
    return this.get(monic.variable).visited === this.visitedStamp;
  }

  private removeCell(list: HeadTail) {
    const head = list.head;
    const tail = list.tail;
    if (head === null || tail === null) return;
    const oldHead = head.next;
    if (oldHead === head) {
      list.head = null;
      list.tail = null;
      return;
    }
    list.head = oldHead;
    tail.next = oldHead;
  }

  private insertCell(list: HeadTail, index: number) {
    const cell = new Cell(index);
    if (list.head !== null) cell.next = list.head;
    list.head = cell;
    list.tail ??= cell;
    list.tail.next = cell;
  }

  private mergeCells(root: HeadTail, other: HeadTail) {
    if (root === other) return;
    if (root.head === null) {
      root.head = other.head;
      root.tail = other.tail;
      return;
    }
    if (other.head === null || other.tail === null || root.tail === null) return;
    root.tail.next = other.head;
    other.tail.next = root.head;
    root.head = other.head;
  }

  private unmergeCells(root: HeadTail, other: HeadTail) {
    if (root === other || other.head === null || other.tail === null) return;
    if (root.tail === other.tail) {
      root.head = null;
      root.tail = null;
      return;
    }
    if (root.tail === null) return;
    root.head = other.tail.next;
    root.tail.next = root.head;
    other.tail.next = other.head;
  }

  private getHead(lpVar: number) {
    const root = getSignedVarVar(this.varEqs.findVar(lpVar));
    this.reserveUseLists(root + 1);
    return this.useLists[root].head;
  }

  // The monics in the use list of a variable's root, around the cycle from its head.
  *getUseList(lpVar: number) {
    const head = this.getHead(lpVar);
    if (head === null) return;
    let cell = head;
    do {
      yield this.monics[cell.index];
      cell = cell.next;
    } while (cell !== head);
  }

  findCanonical(vars: number[]) {
    const table = this.cgTable.get(getKey([...vars].sort(compareNumbers)));
    return table === undefined || table.length === 0 ? undefined : this.get(table[0]);
  }

  isCanonicalMonic(lpVar: number) {
    const index = this.var2index[lpVar];
    return index >= this.unionFind.numVars || this.unionFind.find(index) === index;
  }

  // The representative of a monic's congruence class.
  getRep(monic: Monic) {
    return this.get((this.cgTable.get(getKey(monic.rvars)) ?? [monic.variable])[0]);
  }

  private removeCg(lpVar: number) {
    const first = this.useLists[lpVar].head;
    if (first === null) return;
    this.incVisited();
    let cell = first;
    do {
      const monic = this.monics[cell.index];
      cell = cell.next;
      if (this.isVisited(monic)) continue;
      this.setVisited(monic);
      this.removeCgMon(monic);
    } while (cell !== first);
  }

  private removeCgMon(monic: Monic) {
    const key = getKey(monic.rvars);
    const table = this.cgTable.get(key);
    if (table === undefined) return;
    if (table.length === 1) {
      this.cgTable.delete(key);
      return;
    }
    table.splice(table.indexOf(monic.variable), 1);
  }

  private insertCg(lpVar: number) {
    const first = this.useLists[lpVar].head;
    if (first === null) return;
    this.incVisited();
    let cell = first;
    do {
      const monic = this.monics[cell.index];
      cell = cell.next;
      if (this.isVisited(monic)) continue;
      this.setVisited(monic);
      this.insertCgMon(monic);
    } while (cell !== first);
  }

  private insertCgMon(monic: Monic) {
    this.doCanonize(monic);
    const key = getKey(monic.rvars);
    const table = this.cgTable.get(key);
    if (table === undefined) {
      this.cgTable.set(key, [monic.variable]);
      return;
    }
    if (table.includes(monic.variable)) return;
    const representative = table[0];
    table.push(monic.variable);
    const monicIndex = this.var2index[monic.variable];
    const representativeIndex = this.var2index[representative];
    const maxIndex = Math.max(monicIndex, representativeIndex);
    while (this.unionFind.numVars <= maxIndex) this.unionFind.mkVar();
    this.unionFind.merge(monicIndex, representativeIndex);
  }

  private rehashCg(lpVar: number) {
    this.removeCg(lpVar);
    this.insertCg(lpVar);
  }

  private doCanonize(monic: Monic) {
    monic.rsign = false;
    monic.rvars = [];
    for (const lpVar of monic.vars) {
      const root = this.varEqs.findVar(lpVar);
      monic.rsign = monic.rsign !== isSignedVarNegated(root);
      monic.rvars.push(getSignedVarVar(root));
    }
    monic.rvars.sort(compareNumbers);
  }

  ensureCanonized() {
    for (const monic of this.monics) this.doCanonize(monic);
  }

  // canonize_divides: whether the rooted variables of the first are a sub-multiset of the second's.
  canonizeDivides(divisor: Monic, product: Monic) {
    if (divisor.size > product.size) return false;
    let divisorIndex = 0;
    let productIndex = 0;
    for (;;) {
      if (divisorIndex === divisor.size) return true;
      if (productIndex === product.size) return false;
      const divisorVar = divisor.rvars[divisorIndex];
      const productVar = product.rvars[productIndex];
      if (divisorVar === productVar) {
        divisorIndex++;
        productIndex++;
      } else if (divisorVar < productVar) return false;
      else productIndex++;
    }
  }

  // get_products_of: the monics, other than the given one, that it divides, or every monic using
  // the variable, each once.
  *getProductsOf(factor: Monic | number) {
    this.incVisited();
    const isMonic = factor instanceof Monic;
    for (const monic of this.getUseList(isMonic ? factor.vars[0] : factor)) {
      if (isMonic && (factor.variable === monic.variable || !this.canonizeDivides(factor, monic)))
        continue;
      if (this.isVisited(monic)) continue;
      this.setVisited(monic);
      yield monic;
    }
  }

  // enum_sign_equiv_monics: the monics equal to this one up to sign, around its class's cycle.
  *getSignEquivMonics(monic: Monic) {
    const start = this.var2index[monic.variable];
    let index = start;
    do {
      yield this.monics[index];
      if (index >= this.unionFind.numVars) return;
      index = this.unionFind.next(index);
    } while (index !== start);
  }
}
