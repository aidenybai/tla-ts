// Ported from Z3 (src/util/rlimit.h, src/util/rlimit.cpp, src/util/memory_manager.cpp), MIT
// license, see z3-license.txt. The resource limit of an ast_manager, shared by every context and
// rewriter that uses the manager. It cancels the work at the deadline, in milliseconds since the
// epoch, when the signal aborts, or when the heap is nearly full.
export class ResourceLimit {
  private isCanceled = false;
  private numChecks = 0;

  constructor(
    private deadline: number,
    private signal?: AbortSignal,
  ) {}

  // inc: whether the work may go on.
  inc() {
    if (
      !this.isCanceled &&
      (Date.now() > this.deadline ||
        this.signal?.aborted === true ||
        ((++this.numChecks & HEAP_CHECK_MASK) === 0 && isHeapNearlyFull()))
    )
      this.isCanceled = true;
    return !this.isCanceled;
  }
}

// Z3 runs as its own process, where running out of memory ends only that process and tlapm counts
// the obligation as failed. The solver shares its caller's process instead, which running out of
// heap would end, so it stops before the heap fills, like Z3's max_memory in memory::allocate. The
// heap statistics come from node:v8, which Node, Deno and Bun provide. In V8 the used and the
// available size add up to the heap limit, and in Bun to the memory of the machine.
const HEAP_FRACTION = 0.8;
// The heap is checked on every 128th call, since reading its statistics costs more than the clock.
const HEAP_CHECK_MASK = 127;
const v8 = typeof process === "undefined" ? undefined : process.getBuiltinModule?.("node:v8");

const isHeapNearlyFull = () => {
  if (v8 === undefined) return false;
  const statistics = v8.getHeapStatistics();
  return (
    statistics.used_heap_size >
    HEAP_FRACTION * (statistics.used_heap_size + statistics.total_available_size)
  );
};
