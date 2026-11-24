import type { GCProfiler } from "node:v8";
import { SmtCanceledError, SmtMemoryOutError } from "../../../errors";

export class ResourceLimit {
  count = 0;
  isSuspended = false;
  private isCanceled = false;
  private limit = Infinity;
  private limits: number[] = [];
  private profiler: GCProfiler | null = null;
  maxHeapSize = 0;
  private tableBytes = 0;

  constructor(
    private deadline: number,
    private signal?: AbortSignal,
  ) {}

  inc(offset = 1) {
    this.count += offset;
    if (!this.isCanceled) {
      if (Date.now() > this.deadline || this.signal?.aborted === true) {
        this.isCanceled = true;
        this.release();
      } else if ((this.count & HEAP_CHECK_MASK) < offset && this.isHeapNearlyFull()) {
        // Z3's memory::allocate throws out_of_memory_error under scoped_suspend_rlimit too.
        throw new SmtMemoryOutError();
      }
    }
    return this.isSuspended || (!this.isCanceled && this.count <= this.limit);
  }

  isExhausted() {
    return !this.isSuspended && (this.isCanceled || this.count > this.limit);
  }

  getCancelMessage() {
    return this.isCanceled ? "canceled" : "max. resource limit exceeded";
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

  pushChild(child: ResourceLimit) {
    child.limit = Math.min(child.limit, this.limit - Math.min(this.limit, this.count));
    child.count = 0;
    child.deadline = this.deadline;
    child.signal = this.signal;
    child.maxHeapSize = this.maxHeapSize;
    child.tableBytes = this.tableBytes;
  }

  popChild(child: ResourceLimit) {
    this.count += child.count;
    child.count = 0;
    child.release();
  }

  restart(deadline: number) {
    this.deadline = deadline;
    this.isCanceled = false;
  }

  checkpoint() {
    if (!this.inc()) throw new SmtCanceledError();
  }

  allocate(bytes: number) {
    this.tableBytes += bytes;
    if (this.maxHeapSize > 0 && this.isHeapNearlyFull()) throw new SmtMemoryOutError();
  }

  private isHeapNearlyFull() {
    if (v8 === undefined) return false;
    const statistics = v8.getHeapStatistics();
    if (this.maxHeapSize > 0) return statistics.used_heap_size + this.tableBytes > this.maxHeapSize;
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
const HEAP_CHECK_MASK = 255;
// HACK: Bun's getHeapStatistics walks every live object, which made a proof 100 times slower.
const v8 =
  typeof process === "undefined" || process.versions.bun !== undefined
    ? undefined
    : process.getBuiltinModule?.("node:v8");
