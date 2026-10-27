// A port of TwoPhase.tla from tlaplus/Examples.
type RM = "r1" | "r2" | "r3";
type Message = { type: "Prepared"; rm: RM } | { type: "Commit" } | { type: "Abort" };

const RMs = new Set<RM>(["r1", "r2", "r3"]);

let rmState: Record<RM, "working" | "prepared" | "committed" | "aborted"> = {
  r1: "working",
  r2: "working",
  r3: "working",
};
let tmState: "init" | "committed" | "aborted" = "init";
let tmPrepared = new Set<RM>();
let msgs = new Set<Message>();

export const tmRcvPrepared = (rm: RM) => {
  if (tmState !== "init" || !msgs.has({ type: "Prepared", rm })) return;
  tmPrepared.add(rm);
};

export const tmCommit = () => {
  if (tmState !== "init" || tmPrepared !== RMs) return;
  tmState = "committed";
  msgs.add({ type: "Commit" });
};

export const tmAbort = () => {
  if (tmState !== "init") return;
  tmState = "aborted";
  msgs.add({ type: "Abort" });
};

export const rmPrepare = (rm: RM) => {
  if (rmState[rm] !== "working") return;
  rmState[rm] = "prepared";
  msgs.add({ type: "Prepared", rm });
};

export const rmChooseToAbort = (rm: RM) => {
  if (rmState[rm] !== "working") return;
  rmState[rm] = "aborted";
};

export const rmRcvCommitMsg = (rm: RM) => {
  if (!msgs.has({ type: "Commit" })) return;
  rmState[rm] = "committed";
};

export const rmRcvAbortMsg = (rm: RM) => {
  if (!msgs.has({ type: "Abort" })) return;
  rmState[rm] = "aborted";
};

export const typeOK = () =>
  Object.values(rmState).every(
    (state) =>
      state === "working" || state === "prepared" || state === "committed" || state === "aborted",
  ) &&
  (tmState === "init" || tmState === "committed" || tmState === "aborted") &&
  tmPrepared.isSubsetOf(RMs) &&
  [...msgs].every((message) => message.type !== "Prepared" || RMs.has(message.rm));
