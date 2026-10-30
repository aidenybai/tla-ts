// Ported from Z3 (src/math/lp/static_matrix.h, src/math/lp/static_matrix_def.h), MIT license, see
// z3-license.txt. The sparse tableau: every row cell knows the offset of its column cell and back,
// and cells are removed by moving the last cell of the strip into their place, so the order of
// the cells is Z3's.
import { Rational } from "../rational";
import type { LarTerm } from "./lar-term";

export interface RowCell {
  column: number;
  offset: number;
  coeff: Rational;
}

export interface ColumnCell {
  row: number;
  offset: number;
}

export class StaticMatrix {
  rows: RowCell[][] = [];
  columns: ColumnCell[][] = [];
  private rowOffsets: number[] = [];

  getRowCount() {
    return this.rows.length;
  }

  getColumnCount() {
    return this.columns.length;
  }

  getVal(cell: ColumnCell) {
    return this.rows[cell.row][cell.offset].coeff;
  }

  addRow() {
    this.rows.push([]);
  }

  addColumn() {
    this.columns.push([]);
    this.rowOffsets.push(-1);
  }

  popColumn() {
    this.columns.pop();
    this.rowOffsets.pop();
  }

  // set: appends a nonzero cell to the row and to the column.
  set(row: number, column: number, coeff: Rational) {
    if (coeff.isZero()) return;
    this.addNewElement(row, column, coeff);
  }

  private addNewElement(row: number, column: number, coeff: Rational) {
    const rowCells = this.rows[row];
    const columnCells = this.columns[column];
    rowCells.push({ column, offset: columnCells.length, coeff });
    columnCells.push({ row, offset: rowCells.length - 1 });
  }

  removeElement(rowCells: RowCell[], cell: RowCell) {
    const columnOffset = cell.offset;
    const columnCells = this.columns[cell.column];
    const rowOffset = columnCells[columnOffset].offset;
    if (columnOffset !== columnCells.length - 1) {
      const moved = columnCells[columnCells.length - 1];
      columnCells[columnOffset] = moved;
      this.rows[moved.row][moved.offset].offset = columnOffset;
    }
    if (rowOffset !== rowCells.length - 1) {
      const tail = rowCells[rowCells.length - 1];
      rowCells[rowOffset] = tail;
      this.columns[tail.column][tail.offset].offset = rowOffset;
    }
    columnCells.pop();
    rowCells.pop();
  }

  private scanRowToOffsets(rowCells: RowCell[]) {
    for (let index = 0; index < rowCells.length; index++)
      this.rowOffsets[rowCells[index].column] = index;
  }

  // pivot_row_to_row_given_cell: eliminates the pivot column from the row of the cell by adding a
  // multiple of the pivot row.
  pivotRowToRowGivenCell(pivotRow: number, cell: ColumnCell, pivotColumn: number) {
    const target = cell.row;
    const targetCells = this.rows[target];
    const alpha = this.getVal(cell).neg();
    this.removeElement(targetCells, targetCells[cell.offset]);
    this.scanRowToOffsets(targetCells);
    const previousSize = targetCells.length;
    let cancelled = 0;
    for (const pivotCell of this.rows[pivotRow]) {
      const column = pivotCell.column;
      if (column === pivotColumn) continue;
      const offset = this.rowOffsets[column];
      if (offset === -1) {
        this.addNewElement(target, column, alpha.mul(pivotCell.coeff));
        continue;
      }
      const targetCell = targetCells[offset];
      targetCell.coeff = targetCell.coeff.add(pivotCell.coeff.mul(alpha));
      if (targetCell.coeff.isZero()) cancelled++;
    }
    for (let index = 0; index < previousSize; index++)
      this.rowOffsets[targetCells[index].column] = -1;
    for (let index = previousSize; index-- > 0 && cancelled > 0;) {
      if (!targetCells[index].coeff.isZero()) continue;
      this.removeElement(targetCells, targetCells[index]);
      cancelled--;
    }
  }

  transposeRows(first: number, second: number) {
    const saved = this.rows[first];
    this.rows[first] = this.rows[second];
    this.rows[second] = saved;
    for (const cell of this.rows[first]) this.columns[cell.column][cell.offset].row = first;
    for (const cell of this.rows[second]) this.columns[cell.column][cell.offset].row = second;
  }

  // fill_last_row_with_pivoting: the row of a new basic column for a term, with the basic columns
  // of the term substituted by their rows.
  fillLastRowWithPivoting(term: LarTerm, basic: number, basisHeading: number[]) {
    const work: Rational[] = [];
    const index: number[] = [];
    const getWork = (column: number) => work[column] ?? Rational.zero;
    const eraseFromIndex = (column: number) => {
      const position = index.indexOf(column);
      if (position !== -1) index.splice(position, 1);
    };
    work[basic] = Rational.one;
    index.push(basic);
    for (const entry of term.coeffs) {
      work[entry[0]] = entry[1].neg();
      index.push(entry[0]);
    }
    const pivotOut = (column: number) => {
      const rowIndex = basisHeading[column];
      if (rowIndex < 0) return;
      const alpha = getWork(column);
      if (alpha.isZero()) return;
      for (const cell of this.rows[rowIndex]) {
        if (cell.column === column) continue;
        const wasZero = getWork(cell.column).isZero();
        work[cell.column] = getWork(cell.column).sub(alpha.mul(cell.coeff));
        if (wasZero) index.push(cell.column);
        else if (getWork(cell.column).isZero()) eraseFromIndex(cell.column);
      }
      work[column] = Rational.zero;
      eraseFromIndex(column);
    };
    pivotOut(basic);
    for (const entry of term.coeffs) pivotOut(entry[0]);
    const lastRow = this.rows.length - 1;
    for (const column of index) this.set(lastRow, column, getWork(column));
    this.set(lastRow, this.columns.length - 1, Rational.one);
  }
}
