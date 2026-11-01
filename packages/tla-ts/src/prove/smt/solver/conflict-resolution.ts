// Ported from Z3 (src/smt/smt_conflict_resolution.cpp), MIT license, see z3-license.txt.
// First-UIP conflict resolution with lemma minimization. Equalities in a conflict are explained
// by walking the transitivity branches of the E-graph down to literals.
import { BinJustification, type BJustification } from "./clause";
import type { Context } from "./context";
import { Enode, EqJustification, Justification } from "./enode";
import { BoolVar, getVar, Literal, negate } from "./literal";
import { RefVector } from "./ref-vector";
import { shrink } from "./array";

export class ConflictResolution {
  private antecedents: Literal[] = [];
  private todoJustifications: Justification[] = [];
  private todoJustificationsHead = 0;
  private todoEqs: Enode[] = [];
  private processedEqs = new Set<string>();
  lemma: Literal[] = [];
  // m_lemma_atoms: the atoms of the lemma, which it holds until the lemma is a clause.
  readonly lemmaAtoms: RefVector;
  private conflictLevel = 0;
  newScopeLevel = 0;
  lemmaIscopeLevel = 0;
  private unmark: BoolVar[] = [];
  // m_lvl_set: a level_approx_set, whose bit level mod 32 stands for each level of the lemma, so
  // other levels can pass for them.
  private levelSet = 0;
  private minimizationStack: BoolVar[] = [];

  constructor(private context: Context) {
    this.lemmaAtoms = new RefVector(context.manager);
  }

  markLiteral(literal: Literal) {
    this.antecedents.push(literal);
  }

  // mark_eq: the pair starts with the node whose owner has the smaller id, which fixes the order in
  // which eq2literals walks the two branches.
  markEq(first: Enode, second: Enode) {
    if (first === second) return;
    const ids = this.context.manager.ids;
    const isSwapped = ids[first.owner] > ids[second.owner];
    const lower = isSwapped ? second : first;
    const upper = isSwapped ? first : second;
    const key = `${lower.owner}:${upper.owner}`;
    if (this.processedEqs.has(key)) return;
    this.processedEqs.add(key);
    this.todoEqs.push(lower, upper);
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
    if (justification.kind === "equation") this.antecedents.push(justification.literal);
    else if (justification.kind === "justification")
      this.markJustification(justification.justification);
    else if (justification.kind === "congruence") {
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
    shrink(this.todoJustifications, oldHead);
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

  private getJustificationMaxLevel(justification: Justification) {
    let result = 0;
    for (const literal of this.justificationToLiterals(justification))
      result = Math.max(result, this.context.getAssignLevel(literal));
    return result;
  }

  private getMaxLevel(consequent: Literal, justification: BJustification) {
    const context = this.context;
    let result = consequent !== context.falseLiteral ? context.getAssignLevel(consequent) : 0;
    if (justification instanceof Justification)
      return Math.max(result, this.getJustificationMaxLevel(justification));
    if (justification instanceof BinJustification)
      return Math.max(result, context.getAssignLevel(justification.literal));
    if (justification === null || justification === "axiom") return result;
    const clauses = context.clauses;
    const numLiterals = clauses.getNumLiterals(justification);
    let start = 0;
    if (consequent !== context.falseLiteral) {
      if (clauses.getLiteral(justification, 0) === consequent) start = 1;
      else {
        result = Math.max(result, context.getAssignLevel(clauses.getLiteral(justification, 0)));
        start = 2;
      }
    }
    for (let index = start; index < numLiterals; index++)
      result = Math.max(result, context.getAssignLevel(clauses.getLiteral(justification, index)));
    const clauseJustification = clauses.getJustification(justification);
    if (clauseJustification !== null)
      result = Math.max(result, this.getJustificationMaxLevel(clauseJustification));
    return result;
  }

  private processAntecedent(antecedent: Literal, marks: { count: number }) {
    const context = this.context;
    const boolVar = getVar(antecedent);
    const level = context.getLevel(boolVar);
    if (context.isMarked(boolVar) || level <= context.baseLevel) return;
    context.setMark(boolVar, true);
    context.incBvarActivity(boolVar);
    if (level === this.conflictLevel) marks.count++;
    else {
      this.lemma.push(negate(antecedent));
      this.lemmaAtoms.push(context.boolVar2Expr[boolVar]);
    }
  }

  private processJustification(justification: Justification, marks: { count: number }) {
    for (const literal of this.justificationToLiteralsCore(justification))
      this.processAntecedent(literal, marks);
  }

  // Returns false when the conflict is at the search level, so the problem is unsat.
  resolve(conflict: BJustification, notLiteral: Literal | null) {
    const context = this.context;
    this.lemma = [];
    this.lemmaAtoms.reset();
    let justification = conflict;
    let consequent = notLiteral !== null ? negate(notLiteral) : context.falseLiteral;
    this.conflictLevel = this.getMaxLevel(consequent, justification);
    if (this.conflictLevel <= context.searchLevel) return false;
    const assigned = context.assignedLiterals;
    let index = assigned.length - 1;
    while (index > 0 && context.getAssignLevel(assigned[index]) > this.conflictLevel) index--;
    // The first slot holds the negated first unique implication point, found below.
    this.lemma.push(context.falseLiteral);
    this.lemmaAtoms.push(-1);
    const marks = { count: 0 };
    if (notLiteral !== null) this.processAntecedent(notLiteral, marks);
    do {
      if (justification instanceof Justification) this.processJustification(justification, marks);
      else if (justification instanceof BinJustification)
        this.processAntecedent(justification.literal, marks);
      else if (justification !== null && justification !== "axiom") {
        const clause = justification;
        const clauses = context.clauses;
        if (clauses.isLemma(clause)) clauses.incActivity(clause);
        const numLiterals = clauses.getNumLiterals(clause);
        let start = 0;
        if (consequent !== context.falseLiteral) {
          if (clauses.getLiteral(clause, 0) === consequent) start = 1;
          else {
            this.processAntecedent(negate(clauses.getLiteral(clause, 0)), marks);
            start = 2;
          }
        }
        for (let literalIndex = start; literalIndex < numLiterals; literalIndex++)
          this.processAntecedent(negate(clauses.getLiteral(clause, literalIndex)), marks);
        const clauseJustification = clauses.getJustification(clause);
        if (clauseJustification !== null) this.processJustification(clauseJustification, marks);
      }
      while (!context.isMarked(getVar(assigned[index]))) index--;
      consequent = assigned[index];
      const consequentVar = getVar(consequent);
      justification = context.justifications[consequentVar];
      index--;
      marks.count--;
      context.setMark(consequentVar, false);
    } while (marks.count > 0);
    this.lemma[0] = negate(consequent);
    this.lemmaAtoms.set(0, context.boolVar2Expr[getVar(consequent)]);
    this.finalizeResolve();
    return true;
  }

  private finalizeResolve() {
    const context = this.context;
    this.unmarkJustifications(0);
    this.minimizeLemma();
    this.newScopeLevel = context.searchLevel;
    this.lemmaIscopeLevel = context.getInternLevel(getVar(this.lemma[0]));
    for (let index = 1; index < this.lemma.length; index++) {
      const boolVar = getVar(this.lemma[index]);
      context.setMark(boolVar, false);
      this.newScopeLevel = Math.max(this.newScopeLevel, context.getLevel(boolVar));
      this.lemmaIscopeLevel = Math.max(this.lemmaIscopeLevel, context.getInternLevel(boolVar));
    }
  }

  private processAntecedentForMinimization(antecedent: Literal) {
    const context = this.context;
    const boolVar = getVar(antecedent);
    const level = context.getLevel(boolVar);
    if (context.isMarked(boolVar) || level <= context.baseLevel) return true;
    if ((this.levelSet & (1 << (level & 31))) === 0) return false;
    context.setMark(boolVar, true);
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
      this.context.setMark(this.unmark[index], false);
    shrink(this.unmark, oldSize);
    this.unmarkJustifications(oldHead);
  }

  private isImpliedByMarked(literal: Literal) {
    const context = this.context;
    this.minimizationStack = [getVar(literal)];
    const oldSize = this.unmark.length;
    const oldHead = this.todoJustificationsHead;
    while (this.minimizationStack.length > 0) {
      const boolVar = this.minimizationStack.pop() ?? -1;
      const justification = context.justifications[boolVar];
      let isImplied = true;
      if (justification instanceof Justification)
        isImplied = this.processJustificationForMinimization(justification);
      else if (justification instanceof BinJustification)
        isImplied = this.processAntecedentForMinimization(justification.literal);
      else if (justification === null || justification === "axiom")
        isImplied = context.getLevel(boolVar) <= context.baseLevel;
      else {
        const clauses = context.clauses;
        const numLiterals = clauses.getNumLiterals(justification);
        const position = getVar(clauses.getLiteral(justification, 1)) === boolVar ? 1 : 0;
        for (let index = 0; index < numLiterals && isImplied; index++)
          if (index !== position)
            isImplied = this.processAntecedentForMinimization(
              negate(clauses.getLiteral(justification, index)),
            );
        const clauseJustification = clauses.getJustification(justification);
        if (isImplied && clauseJustification !== null)
          isImplied = this.processJustificationForMinimization(clauseJustification);
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
    this.levelSet = 0;
    for (const literal of this.lemma)
      this.levelSet |= 1 << (context.getLevel(getVar(literal)) & 31);
    let kept = 1;
    for (let index = 1; index < this.lemma.length; index++) {
      const literal = this.lemma[index];
      if (this.isImpliedByMarked(literal)) this.unmark.push(getVar(literal));
      else {
        this.lemma[kept] = literal;
        if (kept !== index) this.lemmaAtoms.set(kept, this.lemmaAtoms.items[index]);
        kept++;
      }
    }
    this.resetUnmark(0, 0);
    shrink(this.lemma, kept);
    this.lemmaAtoms.shrink(kept);
  }
}
