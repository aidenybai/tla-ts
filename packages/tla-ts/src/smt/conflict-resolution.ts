// Ported from Z3 (src/smt/smt_conflict_resolution.cpp), MIT license, see z3-license.txt.
// First-UIP conflict resolution with lemma minimization. Equalities in a conflict are explained
// by walking the transitivity branches of the E-graph down to literals.
import type { Clause, Context } from "./context";
import {
  EQ_CONGRUENCE,
  EQ_EQUATION,
  EQ_JUSTIFICATION,
  Enode,
  EqJustification,
  Justification,
} from "./enode";

export class ConflictResolution {
  private antecedents: number[] = [];
  private todoJustifications: Justification[] = [];
  private todoJustificationsHead = 0;
  private todoEqs: Enode[] = [];
  private processedEqs = new Set<string>();
  lemma: number[] = [];
  lemmaAtoms: number[] = [];
  private conflictLevel = 0;
  newScopeLevel = 0;
  lemmaIscopeLevel = 0;
  private unmark: number[] = [];
  private levelSet = new Set<number>();
  private minimizationStack: number[] = [];

  constructor(private context: Context) {}

  markLiteral(literal: number) {
    this.antecedents.push(literal);
  }

  markEq(first: Enode, second: Enode) {
    if (first === second) return;
    const key =
      first.owner < second.owner
        ? `${first.owner}:${second.owner}`
        : `${second.owner}:${first.owner}`;
    if (this.processedEqs.has(key)) return;
    this.processedEqs.add(key);
    this.todoEqs.push(first, second);
  }

  markJustification(justification: Justification) {
    if (justification.isMarked) return;
    justification.isMarked = true;
    this.todoJustifications.push(justification);
  }

  markJustifiedEq(first: Enode, second: Enode, justification: EqJustification) {
    this.eqJustificationToLiterals(first, second, justification);
  }

  private findCommonAncestor(first: Enode, second: Enode) {
    for (let node: Enode | null = first; node !== null; node = node.transTarget)
      node.isMarked2 = true;
    let result = second;
    while (!result.isMarked2) {
      const target = result.transTarget;
      if (target === null) break;
      result = target;
    }
    for (let node: Enode | null = first; node !== null; node = node.transTarget)
      node.isMarked2 = false;
    return result;
  }

  private eqJustificationToLiterals(lhs: Enode, rhs: Enode, justification: EqJustification) {
    if (justification.kind === EQ_EQUATION) this.antecedents.push(justification.literal);
    else if (justification.kind === EQ_JUSTIFICATION && justification.justification !== null)
      this.markJustification(justification.justification);
    else if (justification.kind === EQ_CONGRUENCE) {
      if (justification.isCommutative) {
        this.markEq(lhs.args[0], rhs.args[1]);
        this.markEq(lhs.args[1], rhs.args[0]);
      } else
        for (let index = 0; index < lhs.args.length; index++)
          this.markEq(lhs.args[index], rhs.args[index]);
    }
  }

  private eqBranchToLiterals(start: Enode, ancestor: Enode) {
    let node = start;
    while (node !== ancestor) {
      const target = node.transTarget;
      if (target === null) break;
      this.eqJustificationToLiterals(node, target, node.transJustification);
      node = target;
    }
  }

  private processJustifications() {
    for (;;) {
      while (this.todoJustificationsHead < this.todoJustifications.length) {
        const justification = this.todoJustifications[this.todoJustificationsHead];
        this.todoJustificationsHead++;
        justification.getAntecedents(this);
      }
      while (this.todoEqs.length > 0) {
        const second = this.todoEqs.pop();
        const first = this.todoEqs.pop();
        if (first === undefined || second === undefined) break;
        const ancestor = this.findCommonAncestor(first, second);
        this.eqBranchToLiterals(first, ancestor);
        this.eqBranchToLiterals(second, ancestor);
      }
      if (this.todoJustificationsHead === this.todoJustifications.length) return;
    }
  }

  private unmarkJustifications(oldHead: number) {
    for (let index = oldHead; index < this.todoJustifications.length; index++)
      this.todoJustifications[index].isMarked = false;
    this.todoJustifications.length = oldHead;
    this.todoJustificationsHead = oldHead;
    this.todoEqs.length = 0;
    this.processedEqs.clear();
  }

  private justificationToLiteralsCore(justification: Justification) {
    const saved = this.antecedents;
    this.antecedents = [];
    this.markJustification(justification);
    this.processJustifications();
    const result = this.antecedents;
    this.antecedents = saved;
    return result;
  }

  justificationToLiterals(justification: Justification) {
    const result = this.justificationToLiteralsCore(justification);
    this.unmarkJustifications(0);
    return result;
  }

  // Explains why two nodes are in one class, for theories that need the literals.
  eqToLiterals(first: Enode, second: Enode) {
    const saved = this.antecedents;
    this.antecedents = [];
    this.markEq(first, second);
    this.processJustifications();
    const result = this.antecedents;
    this.antecedents = saved;
    this.unmarkJustifications(0);
    return result;
  }

  private getJustificationMaxLevel(justification: Justification) {
    let result = 0;
    for (const literal of this.justificationToLiterals(justification))
      result = Math.max(result, this.context.getAssignLevel(literal));
    return result;
  }

  private getMaxLevel(consequent: number, justification: Clause | Justification | "axiom" | null) {
    const context = this.context;
    let result = consequent !== context.falseLiteral ? context.getAssignLevel(consequent) : 0;
    if (justification instanceof Justification)
      return Math.max(result, this.getJustificationMaxLevel(justification));
    if (justification === null || justification === "axiom") return result;
    const literals = justification.literals;
    let start = 0;
    if (consequent !== context.falseLiteral) {
      if (literals[0] === consequent) start = 1;
      else {
        result = Math.max(result, context.getAssignLevel(literals[0]));
        start = 2;
      }
    }
    for (let index = start; index < literals.length; index++)
      result = Math.max(result, context.getAssignLevel(literals[index]));
    if (justification.justification !== null)
      result = Math.max(result, this.getJustificationMaxLevel(justification.justification));
    return result;
  }

  private processAntecedent(antecedent: number, marks: { count: number }) {
    const context = this.context;
    const boolVar = antecedent >> 1;
    const level = context.levels[boolVar];
    if (context.marks[boolVar] || level <= context.baseLevel) return;
    context.marks[boolVar] = true;
    context.incBvarActivity(boolVar);
    if (level === this.conflictLevel) marks.count++;
    else {
      this.lemma.push(antecedent ^ 1);
      this.lemmaAtoms.push(context.boolVar2Expr[boolVar]);
    }
  }

  private processJustification(justification: Justification, marks: { count: number }) {
    for (const literal of this.justificationToLiteralsCore(justification))
      this.processAntecedent(literal, marks);
  }

  // Returns false when the conflict is at the search level, so the problem is unsat.
  resolve(conflict: Clause | Justification | "axiom" | null, notLiteral: number) {
    const context = this.context;
    this.lemma = [];
    this.lemmaAtoms = [];
    let justification = conflict;
    let consequent = notLiteral !== -1 ? notLiteral ^ 1 : context.falseLiteral;
    this.conflictLevel = this.getMaxLevel(consequent, justification);
    if (this.conflictLevel <= context.searchLevel) return false;
    const assigned = context.assignedLiterals;
    let index = assigned.length - 1;
    while (index > 0 && context.getAssignLevel(assigned[index]) > this.conflictLevel) index--;
    this.lemma.push(-1);
    this.lemmaAtoms.push(-1);
    const marks = { count: 0 };
    if (notLiteral !== -1) this.processAntecedent(notLiteral, marks);
    do {
      if (justification instanceof Justification) this.processJustification(justification, marks);
      else if (justification !== null && justification !== "axiom") {
        const clause = justification;
        if (clause.isLemma()) clause.activity++;
        const literals = clause.literals;
        let start = 0;
        if (consequent !== context.falseLiteral) {
          if (literals[0] === consequent) start = 1;
          else {
            this.processAntecedent(literals[0] ^ 1, marks);
            start = 2;
          }
        }
        for (let literalIndex = start; literalIndex < literals.length; literalIndex++)
          this.processAntecedent(literals[literalIndex] ^ 1, marks);
        if (clause.justification !== null) this.processJustification(clause.justification, marks);
      }
      while (!context.marks[assigned[index] >> 1]) index--;
      consequent = assigned[index];
      const consequentVar = consequent >> 1;
      justification = context.justifications[consequentVar];
      index--;
      marks.count--;
      context.marks[consequentVar] = false;
    } while (marks.count > 0);
    this.lemma[0] = consequent ^ 1;
    this.lemmaAtoms[0] = context.boolVar2Expr[consequent >> 1];
    this.finalizeResolve();
    return true;
  }

  private finalizeResolve() {
    const context = this.context;
    this.unmarkJustifications(0);
    this.minimizeLemma();
    this.newScopeLevel = context.searchLevel;
    this.lemmaIscopeLevel = context.internLevels[this.lemma[0] >> 1];
    for (let index = 1; index < this.lemma.length; index++) {
      const boolVar = this.lemma[index] >> 1;
      context.marks[boolVar] = false;
      this.newScopeLevel = Math.max(this.newScopeLevel, context.levels[boolVar]);
      this.lemmaIscopeLevel = Math.max(this.lemmaIscopeLevel, context.internLevels[boolVar]);
    }
  }

  private processAntecedentForMinimization(antecedent: number) {
    const context = this.context;
    const boolVar = antecedent >> 1;
    const level = context.levels[boolVar];
    if (context.marks[boolVar] || level <= context.baseLevel) return true;
    if (!this.levelSet.has(level)) return false;
    context.marks[boolVar] = true;
    this.unmark.push(boolVar);
    this.minimizationStack.push(boolVar);
    return true;
  }

  private processJustificationForMinimization(justification: Justification) {
    for (const literal of this.justificationToLiteralsCore(justification))
      if (!this.processAntecedentForMinimization(literal)) return false;
    return true;
  }

  private resetUnmark(oldSize: number, oldHead: number) {
    for (let index = oldSize; index < this.unmark.length; index++)
      this.context.marks[this.unmark[index]] = false;
    this.unmark.length = oldSize;
    this.unmarkJustifications(oldHead);
  }

  private isImpliedByMarked(literal: number) {
    const context = this.context;
    this.minimizationStack = [literal >> 1];
    const oldSize = this.unmark.length;
    const oldHead = this.todoJustificationsHead;
    while (this.minimizationStack.length > 0) {
      const boolVar = this.minimizationStack.pop() ?? -1;
      const justification = context.justifications[boolVar];
      let isImplied = true;
      if (justification instanceof Justification)
        isImplied = this.processJustificationForMinimization(justification);
      else if (justification === null || justification === "axiom")
        isImplied = context.levels[boolVar] <= context.baseLevel;
      else {
        const literals = justification.literals;
        const position = literals[1] >> 1 === boolVar ? 1 : 0;
        for (let index = 0; index < literals.length && isImplied; index++)
          if (index !== position)
            isImplied = this.processAntecedentForMinimization(literals[index] ^ 1);
        if (isImplied && justification.justification !== null)
          isImplied = this.processJustificationForMinimization(justification.justification);
      }
      if (!isImplied) {
        this.resetUnmark(oldSize, oldHead);
        return false;
      }
    }
    return true;
  }

  private minimizeLemma() {
    const context = this.context;
    this.unmark = [];
    this.levelSet = new Set(this.lemma.map((literal) => context.levels[literal >> 1]));
    let kept = 1;
    for (let index = 1; index < this.lemma.length; index++) {
      const literal = this.lemma[index];
      if (this.isImpliedByMarked(literal)) this.unmark.push(literal >> 1);
      else {
        this.lemma[kept] = literal;
        this.lemmaAtoms[kept] = this.lemmaAtoms[index];
        kept++;
      }
    }
    this.resetUnmark(0, 0);
    this.lemma.length = kept;
    this.lemmaAtoms.length = kept;
  }
}
