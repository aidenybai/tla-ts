// Ported from Z3 (src/nlsat/nlsat_evaluator.cpp), MIT license, see z3-license.txt. Evaluates atoms
// at the assignment, and computes the intervals of the maximal variable of an atom that falsify a
// literal at the values of the variables below it. The assignment is the solver's, shared and
// refined in place.
import type { Anum, AlgebraicManager } from "./algebraic";
import { type IntervalSet, IntervalSetManager } from "./interval-set";
import type { Polynomial, PolynomialManager } from "./polynomial";
import { type Atom, type Clause, type IneqAtom, type RootAtom, isIneqAtom } from "./types";

// Z3's LINEAR_SEARCH_THRESHOLD.
const LINEAR_SEARCH_THRESHOLD = 8;

interface Section {
  root: Anum;
  position: number;
}

interface PolynomialInfo {
  rootCount: number;
  firstSection: number;
  firstSign: number;
}

// sign_table: the roots of the factors of an atom merged into one sorted list of sections. Cell 2i
// is the sector below sorted section i, cell 2i + 1 the section itself.
class SignTable {
  private sections: Section[] = [];
  private sortedSections: number[] = [];
  private polynomialSections: number[] = [];
  private polynomialSigns: number[] = [];
  private infos: PolynomialInfo[] = [];

  constructor(private am: AlgebraicManager) {}

  private mkSection(root: Anum, position: number) {
    this.sections.push({ root: this.am.copy(root), position });
    return this.sections.length - 1;
  }

  private merge(roots: Anum[]) {
    const sectionIds: number[] = [];
    const sorted: number[] = [];
    let sortedIndex = 0;
    let rootIndex = 0;
    while (sortedIndex < this.sortedSections.length && rootIndex < roots.length) {
      const sectionId = this.sortedSections[sortedIndex];
      const section = this.sections[sectionId];
      const sign = this.am.compare(section.root, roots[rootIndex]);
      if (sign <= 0) {
        sorted.push(sectionId);
        if (sign === 0) {
          sectionIds.push(sectionId);
          rootIndex++;
        }
        section.position = sorted.length - 1;
        sortedIndex++;
      } else {
        const id = this.mkSection(roots[rootIndex], sorted.length);
        sorted.push(id);
        sectionIds.push(id);
        rootIndex++;
      }
    }
    for (; sortedIndex < this.sortedSections.length; sortedIndex++) {
      this.sections[this.sortedSections[sortedIndex]].position = sorted.length;
      sorted.push(this.sortedSections[sortedIndex]);
    }
    for (; rootIndex < roots.length; rootIndex++) {
      const id = this.mkSection(roots[rootIndex], sorted.length);
      sorted.push(id);
      sectionIds.push(id);
    }
    this.sortedSections = sorted;
    return sectionIds;
  }

  add(roots: Anum[], signs: number[]) {
    const sectionIds = roots.length === 0 ? [] : this.merge(roots);
    this.infos.push({
      rootCount: roots.length,
      firstSection: this.polynomialSections.length,
      firstSign: this.polynomialSigns.length,
    });
    this.polynomialSigns.push(...signs);
    this.polynomialSections.push(...sectionIds);
  }

  addConst(sign: number) {
    this.infos.push({
      rootCount: 0,
      firstSection: this.polynomialSections.length,
      firstSign: this.polynomialSigns.length,
    });
    this.polynomialSigns.push(sign);
  }

  get cellCount() {
    return this.sections.length * 2 + 1;
  }

  isSection(cell: number) {
    return cell % 2 === 1;
  }

  getRoot(cell: number) {
    return this.sections[this.sortedSections[Math.floor(cell / 2)]].root;
  }

  private getCellId(info: PolynomialInfo, index: number) {
    return this.sections[this.polynomialSections[info.firstSection + index]].position * 2 + 1;
  }

  private getSign(info: PolynomialInfo, index: number) {
    return this.polynomialSigns[info.firstSign + index];
  }

  // sign_at: the sign of the infoId-th polynomial in the cell.
  signAt(infoId: number, cell: number) {
    const info = this.infos[infoId];
    const rootCount = info.rootCount;
    if (rootCount < LINEAR_SEARCH_THRESHOLD) {
      let index = 0;
      for (; index < rootCount; index++) {
        const sectionCell = this.getCellId(info, index);
        if (sectionCell === cell) return 0;
        if (sectionCell > cell) break;
      }
      return this.getSign(info, index);
    }
    const firstCell = this.getCellId(info, 0);
    const lastCell = this.getCellId(info, rootCount - 1);
    if (cell < firstCell) return this.getSign(info, 0);
    if (cell === firstCell || cell === lastCell) return 0;
    if (cell > lastCell) return this.getSign(info, rootCount);
    let low = 0;
    let high = rootCount - 1;
    while (high !== low + 1) {
      const middle = low + Math.floor((high - low) / 2);
      const middleCell = this.getCellId(info, middle);
      if (middleCell === cell) return 0;
      if (cell < middleCell) high = middle;
      else low = middle;
    }
    return this.getSign(info, low + 1);
  }
}

const isSatisfied = (sign: number, kind: Atom["kind"], isNeg: boolean) => {
  const isTrue =
    (sign === 0 &&
      (kind === "EQ" || kind === "ROOT_EQ" || kind === "ROOT_LE" || kind === "ROOT_GE")) ||
    (sign < 0 && (kind === "LT" || kind === "ROOT_LT" || kind === "ROOT_LE")) ||
    (sign > 0 && (kind === "GT" || kind === "ROOT_GT" || kind === "ROOT_GE"));
  return isNeg ? !isTrue : isTrue;
};

const getLiteral = (atom: Atom, isNeg: boolean) => 2 * atom.boolVar + (isNeg ? 1 : 0);

export class Evaluator {
  readonly ism: IntervalSetManager;

  constructor(
    private pm: PolynomialManager,
    private am: AlgebraicManager,
    private assignment: (Anum | undefined)[],
  ) {
    this.ism = new IntervalSetManager(am);
  }

  private getValuesWithout(variable: number) {
    return this.assignment.map((value, index) => (index === variable ? undefined : value));
  }

  eval(atom: Atom, isNeg: boolean) {
    return isIneqAtom(atom) ? this.evalIneq(atom, isNeg) : this.evalRoot(atom, isNeg);
  }

  private evalIneq(atom: IneqAtom, isNeg: boolean) {
    let sign = 1;
    for (const [index, polynomial] of atom.polynomials.entries()) {
      const currentSign = this.am.evalSignAt(this.pm, polynomial, this.assignment);
      sign *= atom.isEven[index] && currentSign < 0 ? 1 : currentSign;
      if (sign === 0) break;
    }
    return isSatisfied(sign, atom.kind, isNeg);
  }

  private evalRoot(atom: RootAtom, isNeg: boolean) {
    const roots = this.am.isolateRoots(
      this.pm,
      atom.polynomial,
      this.getValuesWithout(atom.maxVar),
    );
    if (atom.index > roots.length) return isNeg;
    const sign = this.am.compare(this.assignment[atom.maxVar]!, roots[atom.index - 1]);
    return isSatisfied(sign, atom.kind, isNeg);
  }

  infeasibleIntervals(atom: Atom, isNeg: boolean, clause: Clause | null) {
    return isIneqAtom(atom)
      ? this.getIneqInfeasibleIntervals(atom, isNeg, clause)
      : this.getRootInfeasibleIntervals(atom, isNeg, clause);
  }

  private addToTable(polynomial: Polynomial, variable: number, table: SignTable) {
    if (this.pm.maxVar(polynomial) < variable) {
      table.addConst(this.am.evalSignAt(this.pm, polynomial, this.assignment));
      return;
    }
    const signed = this.am.isolateRootsWithSigns(
      this.pm,
      polynomial,
      this.getValuesWithout(variable),
    );
    table.add(signed.roots, signed.signs);
  }

  // The maximal runs of cells where the literal is false, as a union of intervals.
  private getIneqInfeasibleIntervals(atom: IneqAtom, isNeg: boolean, clause: Clause | null) {
    const table = new SignTable(this.am);
    for (const polynomial of atom.polynomials) this.addToTable(polynomial, atom.maxVar, table);
    const justification = getLiteral(atom, isNeg);
    const getSign = (cell: number) => {
      let sign = 1;
      for (let index = 0; index < atom.polynomials.length; index++) {
        const currentSign = table.signAt(index, cell);
        sign *= atom.isEven[index] && currentSign < 0 ? 1 : currentSign;
        if (sign === 0) break;
      }
      return sign;
    };
    let result: IntervalSet | null = null;
    let isPreviousSat = true;
    let isPreviousOpen = true;
    let previousRoot: Anum | null = null;
    const cellCount = table.cellCount;
    for (let cell = 0; cell < cellCount; cell++) {
      if (isSatisfied(getSign(cell), atom.kind, isNeg)) {
        if (!isPreviousSat) {
          const set = this.ism.mk(
            isPreviousOpen,
            previousRoot,
            table.isSection(cell),
            table.getRoot(table.isSection(cell) ? cell : cell - 1),
            justification,
            clause,
          );
          result = this.ism.mkUnion(result, set);
          isPreviousSat = true;
        }
        continue;
      }
      if (isPreviousSat) {
        if (cell === 0) {
          if (cellCount === 1) result = this.ism.mk(true, null, true, null, justification, clause);
          isPreviousOpen = true;
          previousRoot = null;
        } else {
          isPreviousOpen = !table.isSection(cell);
          previousRoot = table.getRoot(table.isSection(cell) ? cell : cell - 1);
        }
        isPreviousSat = false;
      }
      if (cell === cellCount - 1) {
        const set = this.ism.mk(isPreviousOpen, previousRoot, true, null, justification, clause);
        result = this.ism.mkUnion(result, set);
      }
    }
    return result;
  }

  private getRootInfeasibleIntervals(atom: RootAtom, isNeg: boolean, clause: Clause | null) {
    const justification = getLiteral(atom, isNeg);
    const roots = this.am.isolateRoots(
      this.pm,
      atom.polynomial,
      this.getValuesWithout(atom.maxVar),
    );
    if (atom.index > roots.length)
      return isNeg ? null : this.ism.mk(true, null, true, null, justification, clause);
    const root = roots[atom.index - 1];
    const mk = (
      isLowerOpen: boolean,
      lower: Anum | null,
      isUpperOpen: boolean,
      upper: Anum | null,
    ) => this.ism.mk(isLowerOpen, lower, isUpperOpen, upper, justification, clause);
    switch (atom.kind) {
      case "ROOT_EQ":
        return isNeg
          ? mk(false, root, false, root)
          : this.ism.mkUnion(mk(true, null, true, root), mk(true, root, true, null));
      case "ROOT_LT":
        return isNeg ? mk(true, null, true, root) : mk(false, root, true, null);
      case "ROOT_GT":
        return isNeg ? mk(true, root, true, null) : mk(true, null, false, root);
      case "ROOT_LE":
        return isNeg ? mk(true, null, false, root) : mk(true, root, true, null);
      case "ROOT_GE":
        return isNeg ? mk(false, root, true, null) : mk(true, null, true, root);
    }
  }
}
