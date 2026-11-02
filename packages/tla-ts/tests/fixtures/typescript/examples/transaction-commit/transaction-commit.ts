// A port of TCommit.tla from tlaplus/Examples.
/** @noDeadlock */
type RM = "r1" | "r2" | "r3";
type RMState = "working" | "prepared" | "committed" | "aborted";

let rmState: Record<RM, RMState> = { r1: "working", r2: "working", r3: "working" };

const canCommit = () =>
  Object.values(rmState).every((state) => state === "prepared" || state === "committed");

const notCommitted = () => Object.values(rmState).every((state) => state !== "committed");

export const prepare = (rm: RM) => {
  if (rmState[rm] !== "working") return;
  rmState[rm] = "prepared";
};

export const decideCommit = (rm: RM) => {
  if (rmState[rm] !== "prepared" || !canCommit()) return;
  rmState[rm] = "committed";
};

export const decideAbort = (rm: RM) => {
  if ((rmState[rm] !== "working" && rmState[rm] !== "prepared") || !notCommitted()) return;
  rmState[rm] = "aborted";
};

export const typeOK = () =>
  Object.values(rmState).every(
    (state) =>
      state === "working" || state === "prepared" || state === "committed" || state === "aborted",
  );

export const isConsistent = () =>
  !(Object.values(rmState).includes("aborted") && Object.values(rmState).includes("committed"));
