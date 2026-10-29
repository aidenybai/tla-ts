// Ported from Z3 (src/util/rlimit.h, src/util/rlimit.cpp), MIT license, see z3-license.txt. The
// resource limit of an ast_manager, shared by every context and rewriter that uses the manager. It
// cancels the work at the deadline, in milliseconds since the epoch, or when the signal aborts.
export class ResourceLimit {
  private isCanceled = false;

  constructor(
    private deadline: number,
    private signal?: AbortSignal,
  ) {}

  // inc: whether the work may go on.
  inc() {
    if (!this.isCanceled && (Date.now() > this.deadline || this.signal?.aborted === true))
      this.isCanceled = true;
    return !this.isCanceled;
  }
}
