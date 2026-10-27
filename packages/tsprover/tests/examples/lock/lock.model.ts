// A port of Lock.tla from tlaplus/Examples, from its PlusCal translation.
type Proc = 1 | 2;
type Label = "l0" | "l1" | "cs" | "l2";

const procs = new Set<Proc>([1, 2]);

let lock = 1;
let pc = new Map<Proc, Label>([
  [1, "l0"],
  [2, "l0"],
]);

export const l0 = (self: Proc) => {
  if (pc.get(self) !== "l0") return;
  pc.set(self, "l1");
};

export const l1 = (self: Proc) => {
  if (pc.get(self) !== "l1" || lock !== 1) return;
  lock = 0;
  pc.set(self, "cs");
};

export const cs = (self: Proc) => {
  if (pc.get(self) !== "cs") return;
  pc.set(self, "l2");
};

export const l2 = (self: Proc) => {
  if (pc.get(self) !== "l2") return;
  lock = 1;
  pc.set(self, "l0");
};

const isLocked = (proc: Proc) => pc.get(proc) === "cs" || pc.get(proc) === "l2";

export const typeOK = () =>
  (lock === 0 || lock === 1) &&
  new Set(pc.keys()) === procs &&
  pc.values().every((label) => ["l0", "l1", "cs", "l2"].includes(label));

export const lockInv = () =>
  procs
    .values()
    .every((first) =>
      procs.values().every((second) => first === second || !(isLocked(first) && isLocked(second))),
    ) &&
  (!procs.values().some((proc) => isLocked(proc)) || lock === 0);
