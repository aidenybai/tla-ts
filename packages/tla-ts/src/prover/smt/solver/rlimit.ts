// Ported from Z3 (src/util/rlimit.h, src/util/rlimit.cpp, src/util/memory_manager.cpp), MIT license, see z3-license.txt.
import type { GCProfiler } from "node:v8";
import { SmtCanceledError } from "../../../errors";

export class ResourceLimit {
  count = 0;
  private isCanceled = false;
  private profiler: GCProfiler | null = null;

  constructor(
    private deadline: number,
    private signal?: AbortSignal,
  ) {}

  inc() {
    this.count++;
    if (
      !this.isCanceled &&
      (this.count & CLOCK_CHECK_MASK) === 0 &&
      (Date.now() > this.deadline || this.signal?.aborted === true || this.isHeapNearlyFull())
    ) {
      this.isCanceled = true;
      this.release();
    }
    return !this.isCanceled;
  }

  checkpoint() {
    if (!this.inc()) throw new SmtCanceledError();
  }

  private isHeapNearlyFull() {
    if (v8 === undefined) return false;
    const statistics = v8.getHeapStatistics();
    const threshold = HEAP_FRACTION * (statistics.used_heap_size + statistics.total_available_size);
    if (statistics.used_heap_size <= threshold) {
      this.release();
      return false;
    }
    if (this.profiler === null) {
      this.profiler = new v8.GCProfiler();
      this.profiler.start();
      return false;
    }
    const collection = this.profiler
      .stop()
      .statistics.findLast((event) => event.gcType === "MarkSweepCompact");
    this.profiler.start();
    if (collection === undefined) return false;
    this.release();
    return collection.afterGC.heapStatistics.usedHeapSize > threshold;
  }

  release() {
    this.profiler?.stop();
    this.profiler = null;
  }
}

const HEAP_FRACTION = 0.8;
const CLOCK_CHECK_MASK = 255;
// HACK: Bun's getHeapStatistics walks every live object, which made a proof 100 times slower.
const v8 =
  typeof process === "undefined" || process.versions.bun !== undefined
    ? undefined
    : process.getBuiltinModule?.("node:v8");
