import { SmtInvariantError } from "../../../errors";
import type { AstManager } from "./ast";

const SET = 0;
const PUSH_BACK = 1;
const POP_BACK = 2;
const MAX_TRAIL = 16;
const FACTOR = 2;

// A root keeps its size in index and its values in link.
interface Cell {
  refCount: number;
  kind: number;
  index: number;
  elem: number;
  link: Cell | number[];
}

const mkRoot = (values: number[]): Cell => ({
  refCount: 1,
  kind: SET,
  index: values.length,
  elem: -1,
  link: values,
});

export class ExprParray {
  private cell: Cell | undefined = undefined;
  private updateCounter = 0;

  constructor(private readonly manager: AstManager) {}

  private get top() {
    if (this.cell === undefined) throw new SmtInvariantError("an empty goal has no formula");
    return this.cell;
  }

  private decRefCell(cell: Cell | undefined) {
    if (cell === undefined) return;
    cell.refCount--;
    if (cell.refCount === 0) this.deleteCell(cell);
  }

  private deleteCell(start: Cell) {
    const manager = this.manager;
    for (let cell = start; ;) {
      const link = cell.link;
      if (Array.isArray(link)) {
        for (let index = 0; index < cell.index; index++) manager.decRef(link[index]);
        return;
      }
      if (cell.kind !== POP_BACK) manager.decRef(cell.elem);
      link.refCount--;
      if (link.refCount > 0) return;
      cell = link;
    }
  }

  private getValues(start: Cell) {
    const manager = this.manager;
    const cells: Cell[] = [];
    let cell = start;
    let link = cell.link;
    while (!Array.isArray(link)) {
      cells.push(cell);
      cell = link;
      link = cell.link;
    }
    const values = link.slice(0, cell.index);
    for (const value of values) manager.incRef(value);
    for (let index = cells.length - 1; index >= 0; index--) {
      const diff = cells[index];
      if (diff.kind === SET) {
        manager.incRef(diff.elem);
        manager.decRef(values[diff.index]);
        values[diff.index] = diff.elem;
      } else if (diff.kind === POP_BACK) {
        manager.decRef(values[values.length - 1]);
        values.length--;
      } else {
        manager.incRef(diff.elem);
        values.push(diff.elem);
      }
    }
    return values;
  }

  private unfold(cell: Cell) {
    const link = cell.link;
    if (Array.isArray(link)) return link;
    const values = this.getValues(cell);
    this.decRefCell(link);
    if (cell.kind !== POP_BACK) this.manager.decRef(cell.elem);
    cell.index = values.length;
    cell.link = values;
    return values;
  }

  get size() {
    for (let cell = this.cell; cell !== undefined;) {
      const link: Cell | number[] = cell.link;
      if (Array.isArray(link)) return cell.index;
      if (cell.kind === PUSH_BACK) return cell.index + 1;
      if (cell.kind === POP_BACK) return cell.index - 1;
      cell = link;
    }
    return 0;
  }

  get(index: number) {
    let trail = 0;
    for (let cell = this.top; ; trail++) {
      if (trail > MAX_TRAIL) return this.reroot()[index];
      const link = cell.link;
      if (Array.isArray(link)) return link[index];
      if (cell.kind !== POP_BACK && cell.index === index) return cell.elem;
      cell = link;
    }
  }

  // Z3 reads a goal one formula at a time, and a read down a long trail reroots the array.
  get items() {
    const cell = this.cell;
    if (cell === undefined) return [];
    if (Array.isArray(cell.link)) return cell.link;
    const size = this.size;
    const items: number[] = [];
    for (let index = 0; index < size; index++) items.push(this.get(index));
    return items;
  }

  reset() {
    this.decRefCell(this.cell);
    this.cell = undefined;
    this.updateCounter = 0;
  }

  copyFrom(source: ExprParray) {
    if (source.cell !== undefined) source.cell.refCount++;
    this.decRefCell(this.cell);
    this.cell = source.cell;
    this.updateCounter = 0;
  }

  private moveRoot(cell: Cell, values: number[], kind: number, index: number, elem: number) {
    this.updateCounter++;
    const root = mkRoot(values);
    root.refCount++;
    cell.kind = kind;
    cell.index = index;
    cell.elem = elem;
    if (kind !== POP_BACK) this.manager.incRef(elem);
    cell.link = root;
    this.decRefCell(cell);
    this.cell = root;
    return root;
  }

  set(index: number, value: number) {
    const cell = this.top;
    const link = cell.link;
    if (Array.isArray(link)) {
      if (cell.refCount === 1) return this.setRoot(link, index, value);
      if (this.updateCounter > this.size) return this.setRoot(this.unshare(), index, value);
      this.moveRoot(cell, link, SET, index, link[index]);
      return this.setRoot(link, index, value);
    }
    this.manager.incRef(value);
    this.cell = { refCount: 1, kind: SET, index, elem: value, link: cell };
  }

  private setRoot(values: number[], index: number, value: number) {
    this.manager.incRef(value);
    this.manager.decRef(values[index]);
    values[index] = value;
  }

  push(value: number) {
    if (this.cell === undefined) {
      this.cell = mkRoot([]);
      this.updateCounter = 0;
    }
    const cell = this.cell;
    const link = cell.link;
    if (Array.isArray(link)) {
      if (cell.refCount === 1) return this.pushRoot(cell, link, value);
      if (this.updateCounter > this.size) {
        const values = this.unshare();
        return this.pushRoot(this.top, values, value);
      }
      return this.pushRoot(this.moveRoot(cell, link, POP_BACK, cell.index + 1, -1), link, value);
    }
    const index = this.size;
    this.manager.incRef(value);
    this.cell = { refCount: 1, kind: PUSH_BACK, index, elem: value, link: cell };
  }

  private pushRoot(root: Cell, values: number[], value: number) {
    this.manager.incRef(value);
    values.push(value);
    root.index++;
  }

  pop() {
    const cell = this.top;
    const link = cell.link;
    if (Array.isArray(link)) {
      if (cell.refCount === 1) return this.popRoot(cell, link);
      if (this.updateCounter > this.size) {
        const values = this.unshare();
        return this.popRoot(this.top, values);
      }
      const index = cell.index - 1;
      return this.popRoot(this.moveRoot(cell, link, PUSH_BACK, index, link[index]), link);
    }
    const index = this.size;
    this.cell = { refCount: 1, kind: POP_BACK, index, elem: -1, link: cell };
  }

  private popRoot(root: Cell, values: number[]) {
    root.index--;
    this.manager.decRef(values[root.index]);
    values.length = root.index;
  }

  private unshare() {
    const cell = this.top;
    if (Array.isArray(cell.link) && cell.refCount === 1) return cell.link;
    const values = this.getValues(cell);
    this.decRefCell(cell);
    this.cell = mkRoot(values);
    this.updateCounter = 0;
    return values;
  }

  private reroot() {
    const top = this.top;
    if (Array.isArray(top.link)) return top.link;
    const cells: Cell[] = [];
    const split = Math.floor(this.size / FACTOR);
    let cell = top;
    for (let link = cell.link; !Array.isArray(link) && cells.length < split; link = cell.link) {
      cells.push(cell);
      cell = link;
    }
    const values = this.unfold(cell);
    for (let index = cells.length - 1; index >= 0; index--) {
      const parent = cells[index];
      let size = cell.index;
      if (parent.kind === SET) {
        cell.kind = SET;
        cell.index = parent.index;
        cell.elem = values[parent.index];
        values[parent.index] = parent.elem;
      } else if (parent.kind === PUSH_BACK) {
        cell.kind = POP_BACK;
        values.push(parent.elem);
        size++;
        cell.index = size;
      } else {
        cell.kind = PUSH_BACK;
        size--;
        cell.index = size;
        cell.elem = values[size];
        values.length = size;
      }
      parent.refCount++;
      cell.link = parent;
      parent.index = size;
      parent.link = values;
      this.decRefCell(cell);
      cell = parent;
    }
    this.updateCounter = 0;
    return values;
  }
}
