// A port of Peterson.tla from tlaplus/Examples, from its PlusCal translation.
type Proc = 1 | 2;
type Label = "a0" | "a1" | "a2" | "a3" | "cs" | "a4";
type LockLabel = "l0" | "l1" | "cs" | "l2";

interface State {
  pc: Map<Proc, Label>;
}

const procs = new Set<Proc>([1, 2]);

const other = (proc: Proc): Proc => (proc === 1 ? 2 : 1);

let c = new Map<Proc, boolean>([
  [1, false],
  [2, false],
]);
let turn: Proc = 1;
let pc = new Map<Proc, Label>([
  [1, "a0"],
  [2, "a0"],
]);

export const a0 = (self: Proc) => {
  if (pc.get(self) !== "a0") return;
  pc.set(self, "a1");
};

export const a1 = (self: Proc) => {
  if (pc.get(self) !== "a1") return;
  c.set(self, true);
  pc.set(self, "a2");
};

export const a2 = (self: Proc) => {
  if (pc.get(self) !== "a2") return;
  turn = other(self);
  pc.set(self, "a3");
};

export const a3 = (self: Proc) => {
  if (pc.get(self) !== "a3") return;
  if (!c.get(other(self))! || turn === self) {
    pc.set(self, "cs");
  }
};

export const cs = (self: Proc) => {
  if (pc.get(self) !== "cs") return;
  pc.set(self, "a4");
};

export const a4 = (self: Proc) => {
  if (pc.get(self) !== "a4") return;
  c.set(self, false);
  pc.set(self, "a0");
};

const isLocked = (proc: Proc) => pc.get(proc) === "cs" || pc.get(proc) === "a4";

export const typeOK = () =>
  new Set(c.keys()) === procs &&
  procs.has(turn) &&
  new Set(pc.keys()) === procs &&
  pc.values().every((label) => ["a0", "a1", "a2", "a3", "cs", "a4"].includes(label));

export const inv = () =>
  procs
    .values()
    .every((proc) => c.get(proc) === ["a2", "a3", "cs", "a4"].includes(pc.get(proc)!)) &&
  procs
    .values()
    .every(
      (proc) =>
        !isLocked(proc) || turn === proc || ["a0", "a1", "a2"].includes(pc.get(other(proc))!),
    ) &&
  procs
    .values()
    .every((first) =>
      procs.values().every((second) => first === second || !(isLocked(first) && isLocked(second))),
    );

const translateLabel = (label: Label): LockLabel =>
  label === "a0" ? "l0" : label === "cs" ? "cs" : label === "a4" ? "l2" : "l1";

const translatePc = (labels: Map<Proc, Label>) =>
  new Map(procs.values().map((proc) => [proc, translateLabel(labels.get(proc)!)]));

const translateLock = (labels: Map<Proc, Label>) =>
  procs.values().some((proc) => labels.get(proc) === "cs" || labels.get(proc) === "a4") ? 0 : 1;

const isLockStep = (
  lockPc: Map<Proc, LockLabel>,
  nextLockPc: Map<Proc, LockLabel>,
  self: Proc,
  from: LockLabel,
  to: LockLabel,
) =>
  lockPc.get(self) === from &&
  nextLockPc.get(self) === to &&
  nextLockPc.get(other(self)) === lockPc.get(other(self));

// LSpec, the refinement of Lock: each step is a step of Lock under the translation.
/** @always */
export const lSpec = (before: State) => {
  const lockPc = translatePc(before.pc);
  const nextLockPc = translatePc(pc);
  const lock = translateLock(before.pc);
  const nextLock = translateLock(pc);
  return (
    (nextLockPc === lockPc && nextLock === lock) ||
    procs
      .values()
      .some(
        (self) =>
          (isLockStep(lockPc, nextLockPc, self, "l0", "l1") && nextLock === lock) ||
          (isLockStep(lockPc, nextLockPc, self, "l1", "cs") && lock === 1 && nextLock === 0) ||
          (isLockStep(lockPc, nextLockPc, self, "cs", "l2") && nextLock === lock) ||
          (isLockStep(lockPc, nextLockPc, self, "l2", "l0") && nextLock === 1),
      )
  );
};
