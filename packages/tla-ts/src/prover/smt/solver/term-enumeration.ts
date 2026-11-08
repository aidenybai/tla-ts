// Ported from Z3 (src/ast/rewriter/term_enumeration.cpp), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";

const STATE_LEAVES = 0;
const STATE_OPERATORS = 1;
const STATE_DONE = 2;

interface CostTerm {
  term: number;
  cost: number;
}

class TermBank {
  private terms: Map<number, number[]>[] = [];

  constructor(private manager: AstManager) {}

  add(term: number, cost: number) {
    while (this.terms.length <= cost) this.terms.push(new Map());
    const sort = this.manager.sorts[term];
    const bucket = this.terms[cost];
    const existing = bucket.get(sort);
    if (existing === undefined) bucket.set(sort, [term]);
    else existing.push(term);
  }

  getBySort(sort: number, maxCost: number) {
    const result: CostTerm[] = [];
    for (let cost = 0; cost <= maxCost && cost < this.terms.length; cost++)
      for (const term of this.terms[cost].get(sort) ?? []) result.push({ term, cost });
    return result;
  }

  getByCostAndSort(cost: number, sort: number) {
    return cost < this.terms.length ? (this.terms[cost].get(sort) ?? []) : [];
  }

  isProductive(cost: number, sorts: ReadonlySet<number>) {
    for (let index = cost; index < this.terms.length; index++)
      for (const sort of this.terms[index].keys()) if (!sorts.has(sort)) return true;
    return false;
  }
}

class ChildrenIterator {
  private candidates: CostTerm[][] = [];
  private indices: number[] = [];
  private isDone = false;

  constructor(domain: readonly number[], bank: TermBank, currentCost: number) {
    if (domain.length === 0) {
      this.isDone = true;
      return;
    }
    for (const sort of domain) {
      const candidates = bank.getBySort(sort, currentCost - 1);
      this.candidates.push(candidates);
      if (candidates.length === 0) {
        this.isDone = true;
        return;
      }
    }
    this.indices = domain.map(() => 0);
  }

  hasNext(cost: number) {
    while (!this.isDone) {
      if (
        this.candidates.some(
          (candidates, index) => candidates[this.indices[index]].cost + 1 === cost,
        )
      )
        return true;
      this.advance();
    }
    return false;
  }

  next() {
    const children = this.candidates.map((candidates, index) => candidates[this.indices[index]]);
    this.advance();
    return {
      children: children.map((child) => child.term),
      cost: children.reduce((sum, child) => sum + child.cost, 1),
    };
  }

  private advance() {
    for (let index = this.indices.length - 1; index >= 0; index--) {
      this.indices[index]++;
      if (this.indices[index] < this.candidates[index].length) return;
      this.indices[index] = 0;
    }
    this.isDone = true;
  }
}

export class TermEnumeration {
  private bank: TermBank;
  private seen = new Set<number>();
  private seeded = new Set<number>();
  private leaves: number[];
  private operators: number[];
  private state = STATE_LEAVES;
  private cost = 0;
  private leafIndex = 0;
  private operatorIndex = 0;
  private bankIndex = 0;
  private bankSize = 0;
  private isProgress = false;
  private sortsProduced = new Set<number>();
  private children: ChildrenIterator | null = null;
  current: number | null;

  constructor(
    private manager: AstManager,
    decls: readonly number[],
    private target: number,
    private getExternal: (sort: number) => number,
    private pin: (term: number) => void,
  ) {
    this.bank = new TermBank(manager);
    this.leaves = decls.filter((decl) => manager.funcDecls[decl].domain.length === 0);
    this.operators = decls.filter((decl) => manager.funcDecls[decl].domain.length > 0);
    this.current = this.findNext();
  }

  advance() {
    if (this.current !== null) this.current = this.findNext();
  }

  private addTerm(term: number, cost: number) {
    if (this.seen.has(term)) return null;
    this.seen.add(term);
    this.pin(term);
    this.bank.add(term, cost);
    return term;
  }

  private mkTerm(decl: number, args: number[]) {
    return this.manager.mkApp(decl, args, this.manager.funcDecls[decl].range);
  }

  private seedExternal(sort: number) {
    if (this.seeded.has(sort)) return;
    this.seeded.add(sort);
    this.addTerm(this.getExternal(sort), 0);
  }

  private findNext(): number | null {
    for (;;) {
      if (this.state === STATE_DONE) return null;
      if (this.state === STATE_LEAVES) {
        while (this.leafIndex < this.leaves.length) {
          const term = this.addTerm(this.mkTerm(this.leaves[this.leafIndex++], []), 0);
          if (term !== null && this.manager.sorts[term] === this.target) return term;
        }
        this.state = STATE_OPERATORS;
        this.cost = 1;
        this.startCost();
        continue;
      }
      const result = this.enumerateOperators();
      if (result !== null) return result;
      this.cost++;
      this.startCost();
      if (!this.isProgress && !this.bank.isProductive(this.cost - 1, this.sortsProduced)) {
        this.state = STATE_DONE;
        return null;
      }
      if (this.sortsProduced.has(this.target)) this.sortsProduced.clear();
      this.isProgress = false;
    }
  }

  private startCost() {
    this.operatorIndex = 0;
    this.bankIndex = 0;
    this.bankSize = this.bank.getByCostAndSort(this.cost, this.target).length;
    this.children = null;
  }

  private enumerateOperators(): number | null {
    for (;;) {
      if (this.bankIndex < this.bankSize)
        return this.bank.getByCostAndSort(this.cost, this.target)[this.bankIndex++];
      if (this.children !== null && this.children.hasNext(this.cost)) {
        const next = this.children.next();
        const term = this.addTerm(
          this.mkTerm(this.operators[this.operatorIndex - 1], next.children),
          next.cost,
        );
        if (term === null) continue;
        const sort = this.manager.sorts[term];
        if (!this.sortsProduced.has(sort)) this.isProgress = true;
        this.sortsProduced.add(sort);
        if (sort === this.target && next.cost === this.cost) return term;
        continue;
      }
      if (this.operatorIndex >= this.operators.length) return null;
      const domain = this.manager.funcDecls[this.operators[this.operatorIndex++]].domain;
      for (const sort of domain) this.seedExternal(sort);
      this.children = new ChildrenIterator(domain, this.bank, this.cost);
    }
  }
}
