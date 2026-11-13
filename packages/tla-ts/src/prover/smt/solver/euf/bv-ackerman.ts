// Ported from Z3 (src/sat/smt/bv_ackerman.h, src/sat/smt/bv_ackerman.cpp, src/util/dlist.h), MIT
// license, see z3-license.txt.
import type { BvInternalize } from "./bv-internalize";

const UINT_MAX = 0xffffffff;

// dyn_ack_params: dack.factor, dack.threshold and dack.gc.
const DACK_FACTOR = 0.1;
const DACK_THRESHOLD = 10;
const DACK_GC = 2000;
const PROPAGATE_HIGH_WATERMARK = 10000;

interface Vv {
  v1: number;
  v2: number;
  count: number;
  glue: number;
  next: Vv;
  prev: Vv;
}

const mkVv = (v1: number, v2: number) => {
  const vv = { v1, v2, count: 0, glue: UINT_MAX } as Vv;
  vv.next = vv;
  vv.prev = vv;
  return vv;
};

export class BvAckerman {
  private table = new Map<string, Vv>();
  private queue: Vv | null = null;
  private gcThreshold = 100;
  private propagateLowWatermark = DACK_THRESHOLD;
  private numPropagationsSinceLastGc = 0;
  private diffLevels: boolean[] = [];

  constructor(private solver: BvInternalize) {}

  private pushToFront(elem: Vv) {
    const queue = this.queue;
    if (queue === null) {
      this.queue = elem;
      elem.next = elem;
      elem.prev = elem;
      return;
    }
    if (queue === elem) return;
    elem.prev.next = elem.next;
    elem.next.prev = elem.prev;
    queue.prev.next = elem;
    elem.prev = queue.prev;
    elem.next = queue;
    queue.prev = elem;
    this.queue = elem;
  }

  private removeFromQueue(elem: Vv) {
    const queue = this.queue as Vv;
    if (queue.next === queue) {
      this.queue = null;
      return;
    }
    if (queue === elem) this.queue = elem.next;
    elem.prev.next = elem.next;
    elem.next.prev = elem.prev;
  }

  private remove(vv: Vv) {
    this.removeFromQueue(vv);
    this.table.delete(`${vv.v1},${vv.v2}`);
  }

  private insertIfNotThere(v1: number, v2: number) {
    const key = `${v1},${v2}`;
    const existing = this.table.get(key);
    if (existing !== undefined) return { vv: existing, isNew: false };
    const vv = mkVv(v1, v2);
    this.table.set(key, vv);
    return { vv, isNew: true };
  }

  usedEqEh(inputV1: number, inputV2: number) {
    if (inputV1 === inputV2) return;
    const v1 = Math.min(inputV1, inputV2);
    const v2 = Math.max(inputV1, inputV2);
    const inserted = this.insertIfNotThere(v1, v2);
    const other = inserted.vv;
    other.count++;
    this.updateGlue(other);
    this.pushToFront(other);
    let isGc = inserted.isNew;
    if (other.glue === 0) {
      isGc = false;
      this.remove(other);
      this.addCc(v1, v2);
    } else if (other.count > 2 * PROPAGATE_HIGH_WATERMARK) this.propagate();
    if (isGc) this.gc();
  }

  private updateGlue(vv: Vv) {
    const s = this.solver.s;
    const firstBits = this.solver.bits[vv.v1];
    const secondBits = this.solver.bits[vv.v2];
    const size = firstBits.length;
    const diffLevels = this.diffLevels;
    while (diffLevels.length <= s.scopeLvl) diffLevels.push(false);
    let glue = 0;
    const maxGlue = vv.glue;
    let index = 0;
    for (; index < size && index < maxGlue; index++) {
      const first = firstBits[index];
      const second = secondBits[index];
      if (first === second) continue;
      const firstLvl = s.lvl(first);
      const secondLvl = s.lvl(second);
      if (!diffLevels[firstLvl]) {
        diffLevels[firstLvl] = true;
        glue++;
      }
      if (!diffLevels[secondLvl]) {
        diffLevels[secondLvl] = true;
        glue++;
      }
    }
    while (index-- > 0) {
      const first = firstBits[index];
      const second = secondBits[index];
      if (first === second) continue;
      diffLevels[s.lvl(first)] = false;
      diffLevels[s.lvl(second)] = false;
    }
    if (glue < maxGlue) vv.glue = glue;
  }

  private gc() {
    this.numPropagationsSinceLastGc++;
    if (this.numPropagationsSinceLastGc <= DACK_GC) return;
    this.numPropagationsSinceLastGc = 0;
    if (this.table.size > this.gcThreshold) this.propagate();
    while (this.table.size > this.gcThreshold) this.remove((this.queue as Vv).prev);
    this.gcThreshold = Math.trunc((this.gcThreshold * 110) / 100) + 1;
  }

  propagate() {
    let current = this.queue;
    const numProp = Math.min(Math.trunc(this.solver.s.conflicts * DACK_FACTOR), this.table.size);
    for (let index = 0; index < numProp; index++) {
      const vv = current as Vv;
      current = vv.next;
      if (vv.count < this.propagateLowWatermark && vv.glue !== 0) continue;
      this.addCc(vv.v1, vv.v2);
      this.remove(vv);
    }
  }

  private addCc(v1: number, v2: number) {
    const solver = this.solver;
    if (v2 >= solver.numVars) return;
    const manager = solver.manager;
    const sort = manager.sorts[solver.var2expr(v1)];
    if (sort !== manager.sorts[solver.var2expr(v2)] || !manager.isBvSort(sort)) return;
    solver.assertAckerman(v1, v2);
  }
}
