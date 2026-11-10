// Ported from Z3 (src/sat/sat_model_converter.h, src/sat/sat_model_converter.cpp), MIT license,
// see z3-license.txt.
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { NULL_BOOL_VAR, NULL_LITERAL } from "./clause";

export const MC_ELIM_VAR = 0;
export const MC_BCE = 1;
export const MC_CCE = 2;
export const MC_ACCE = 3;
export const MC_ABCE = 4;
export const MC_ATE = 5;

export interface McEntry {
  boolVar: number;
  kind: number;
  clauses: number[];
  clause: number[];
  elimStacks: (number[] | undefined)[];
}

const getLitValue = (lit: number, model: Int8Array) => {
  const value = model[lit >> 1];
  return (lit & 1) === 1 ? -value : value;
};

export class ModelConverter {
  entries: McEntry[] = [];
  exposedLim = 0;
  private mark: boolean[] = [];
  elimStack: number[] = [];

  private processStack(model: Int8Array, clause: number[], stack: number[]) {
    for (let index = stack.length; (index -= 2) >= 0;) {
      const size = stack[index];
      const lit = stack[index + 1];
      let isSat = false;
      for (let position = 0; !isSat && position < size; position++)
        isSat = getLitValue(clause[position], model) === L_TRUE;
      if (!isSat) model[lit >> 1] = (lit & 1) === 1 ? L_FALSE : L_TRUE;
    }
  }

  apply(model: Int8Array) {
    const clause: number[] = [];
    for (let entryIndex = this.entries.length; entryIndex-- > this.exposedLim;) {
      const entry = this.entries[entryIndex];
      const firstVar = entry.boolVar;
      let isSat = false;
      let isVarNegated = false;
      let index = 0;
      clause.length = 0;
      for (const lit of entry.clauses) {
        if (lit === NULL_LITERAL) {
          if (!isSat && entry.kind !== MC_ATE && firstVar !== NULL_BOOL_VAR)
            model[firstVar] = isVarNegated ? L_FALSE : L_TRUE;
          const stack = entry.elimStacks[index];
          if (stack !== undefined) this.processStack(model, clause, stack);
          isSat = false;
          index++;
          clause.length = 0;
          continue;
        }
        clause.push(lit);
        if (isSat) continue;
        const boolVar = lit >> 1;
        if (boolVar === firstVar) isVarNegated = (lit & 1) === 1;
        if (getLitValue(lit, model) === L_TRUE) isSat = true;
        else if (boolVar !== firstVar && model[boolVar] === L_UNDEF) {
          model[boolVar] = (lit & 1) === 1 ? L_FALSE : L_TRUE;
          isSat = true;
        }
      }
    }
  }

  mk(kind: number, boolVar: number) {
    const entry: McEntry = { boolVar, kind, clauses: [], clause: [], elimStacks: [] };
    this.entries.push(entry);
    return entry;
  }

  addAte(lits: number[]) {
    if (this.elimStack.length === 0) return;
    this.insert(this.mk(MC_ATE, NULL_BOOL_VAR), lits);
  }

  private addElimStack(entry: McEntry) {
    entry.elimStacks.push(this.elimStack.length === 0 ? undefined : this.elimStack);
    this.elimStack = [];
  }

  setClause(entry: McEntry, lits: number[]) {
    entry.clause.push(...lits);
  }

  insert(entry: McEntry, lits: number[]) {
    entry.clauses.push(...lits, NULL_LITERAL);
    this.addElimStack(entry);
  }

  isEmpty() {
    return this.entries.length === 0;
  }

  flush(source: ModelConverter) {
    this.entries.push(...source.entries);
    this.exposedLim += source.exposedLim;
    source.entries = [];
    source.exposedLim = 0;
  }

  addClause(lits: number[]) {
    if (this.entries.length === 0) return;
    for (const lit of lits) {
      while (this.mark.length <= lit >> 1) this.mark.push(false);
      this.mark[lit >> 1] = true;
    }
  }

  private swap(boolVar: number, size: number, clause: number[]) {
    for (let index = 0; index < size; index++)
      if (clause[index] >> 1 === boolVar) {
        [clause[0], clause[index]] = [clause[index], clause[0]];
        return;
      }
  }

  expand(updateStack: number[]) {
    const clause: number[] = [];
    for (let entryIndex = this.exposedLim; entryIndex < this.entries.length; entryIndex++) {
      const entry = this.entries[entryIndex];
      let index = 0;
      clause.length = 0;
      for (const lit of entry.clauses) {
        if (lit !== NULL_LITERAL) {
          clause.push(lit);
          continue;
        }
        const stack = entry.elimStacks[index];
        if (stack !== undefined)
          for (let position = 0; position < stack.length; position += 2) {
            const size = stack[position];
            this.swap(stack[position + 1] >> 1, size, clause);
            updateStack.push(...clause.slice(0, size), NULL_LITERAL);
          }
        if (entry.boolVar !== NULL_BOOL_VAR) {
          this.swap(entry.boolVar, clause.length, clause);
          updateStack.push(...clause, NULL_LITERAL);
        }
        clause.length = 0;
        index++;
      }
    }
    this.exposedLim = this.entries.length;
  }
}
