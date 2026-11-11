// Ported from Z3 (src/util/rlimit.h, src/util/rlimit.cpp, src/util/memory_manager.cpp), MIT
// license, see z3-license.txt.
import type { GCProfiler } from "node:v8";
import { SmtCanceledError } from "../../../errors";

export class ResourceLimit {
  // MBQI also uses the step count as a random seed.
  count = 0;
  isSuspended = false;
  private isCanceled = false;
  private limit = Infinity;
  private limits: number[] = [];
  private profiler: GCProfiler | null = null;

  constructor(
    private deadline: number,
    private signal?: AbortSignal,
  ) {}

  // The clock and the heap are read on every 256th step, since a step costs less than reading
  // them. A step can allocate kilobytes, so reading the heap less often lets it fill between
  // readings.
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
    return this.isSuspended || (!this.isCanceled && this.count <= this.limit);
  }

  isExhausted() {
    return !this.isSuspended && (this.isCanceled || this.count > this.limit);
  }

  push(delta: number) {
    this.limits.push(this.limit);
    this.limit = Math.min(delta === 0 ? Infinity : this.count + delta, this.limit);
    this.isCanceled = false;
  }

  pop() {
    this.count = Math.min(this.count, this.limit);
    this.limit = this.limits.pop() ?? Infinity;
    this.isCanceled = false;
  }

  restart(deadline: number) {
    this.deadline = deadline;
    this.isCanceled = false;
  }

  checkpoint() {
    if (!this.inc()) throw new SmtCanceledError();
  }

  // The used size counts garbage, such as what earlier work left, until the collector runs. So once
  // it passes the threshold, the size after the next full collection decides.
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

// Z3 runs in its own process, but the solver shares its caller's, so it stops before the heap
// fills, like Z3's max_memory. In V8 the used and available sizes add up to the heap limit. Bun's
// getHeapStatistics walks every live object, which made a proof 100 times slower, so the check is
// off there.
const HEAP_FRACTION = 0.8;
const CLOCK_CHECK_MASK = 255;
const v8 =
  typeof process === "undefined" || process.versions.bun !== undefined
    ? undefined
    : process.getBuiltinModule?.("node:v8");
