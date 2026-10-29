// Runs a synchronous backend until it has used its time limit in both wall-clock and CPU time. A
// loaded machine stretches wall-clock time, so the CPU time estimates a run on an idle core.

export interface CpuLimitedRun<Result> {
  result: Result;
  wallMilliseconds: number;
  cpuMilliseconds: number;
}

export const runWithCpuLimit = <Result>(
  limitMs: number,
  run: (options: { timeLimitMs: number; signal: AbortSignal }) => Result,
): CpuLimitedRun<Result> => {
  const started = performance.now();
  const startedCpu = process.cpuUsage();
  const getCpuMilliseconds = () => {
    const cpu = process.cpuUsage(startedCpu);
    return Math.round((cpu.user + cpu.system) / 1000);
  };
  // HACK: the backends run synchronously, so no timer can abort one once the CPU time runs out.
  // Their limit checks read signal.aborted, which this getter answers instead. It reads the CPU
  // time on every 4096th check only, because each read is a system call.
  const signal = new AbortController().signal;
  const state = { checks: 0 };
  Object.defineProperty(signal, "aborted", {
    get: () =>
      performance.now() - started > limitMs &&
      state.checks++ % 4096 === 0 &&
      getCpuMilliseconds() > limitMs,
  });
  const result = run({ timeLimitMs: 100 * limitMs, signal });
  return {
    result,
    wallMilliseconds: Math.round(performance.now() - started),
    cpuMilliseconds: getCpuMilliseconds(),
  };
};
