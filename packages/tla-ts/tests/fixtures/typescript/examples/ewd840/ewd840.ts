// A port of EWD840.tla from tlaplus/Examples.
type Node = 0 | 1 | 2;
type Color = "white" | "black";

interface State {
  active: [boolean, boolean, boolean];
  color: [Color, Color, Color];
  tpos: Node;
  tcolor: Color;
}

const N = 3;

/** @noDeadlock */
let active!: State["active"];
let color!: State["color"];
let tpos!: Node;
let tcolor: Color = "black";

/** @fair */
export const initiateProbe = () => {
  if (tpos !== 0) return;
  if (tcolor === "black" || color[0] === "black") {
    tpos = (N - 1) as Node;
    tcolor = "white";
    color[0] = "white";
  }
};

/** @fair */
export const passToken = (node: Node) => {
  if (node === 0 || tpos !== node) return;
  if (!active[node] || color[node] === "black" || tcolor === "black") {
    tpos = (node - 1) as Node;
    if (color[node] === "black") tcolor = "black";
    color[node] = "white";
  }
};

export const sendMsg = (sender: Node, receiver: Node) => {
  if (!active[sender] || receiver === sender) return;
  active[receiver] = true;
  if (receiver > sender) color[sender] = "black";
};

export const deactivate = (node: Node) => {
  if (!active[node]) return;
  active[node] = false;
};

const isTerminated = (nodes: State["active"]) => nodes.every((isActive) => !isActive);

const isTerminationDetected = (state: State) =>
  state.tpos === 0 && state.tcolor === "white" && state.color[0] === "white" && !state.active[0];

const terminationDetected = () => isTerminationDetected({ active, color, tpos, tcolor });

export const typeOK = () =>
  active.length === N &&
  color.length === N &&
  color.every((nodeColor) => nodeColor === "white" || nodeColor === "black") &&
  tpos >= 0 &&
  tpos < N &&
  (tcolor === "white" || tcolor === "black");

export const terminationDetection = () => !terminationDetected() || isTerminated(active);

export const inv = () =>
  active.every((isActive, node) => tpos >= node || !isActive) ||
  color.slice(0, tpos + 1).some((nodeColor) => nodeColor === "black") ||
  tcolor === "black";

/** @leadsTo terminationDetected */
export const liveness = () => isTerminated(active);

// TDSpec, the refinement of SyncTerminationDetection: its steps, and its fairness.
/** @always */
export const tdNext = (before: State) => {
  const wasDetected = isTerminationDetected({
    active: before.active,
    color: before.color,
    tpos: before.tpos,
    tcolor: before.tcolor,
  });
  const isDetected = terminationDetected();
  return (
    (active === before.active && isDetected === wasDetected) ||
    before.active.some(
      (isActive, node) =>
        isActive &&
        active === before.active.with(node, false) &&
        (isDetected === wasDetected || isDetected === isTerminated(active)),
    ) ||
    (before.active.some((isActive) => isActive) &&
      before.active.some((_, node) => active === before.active.with(node, true)) &&
      isDetected === wasDetected) ||
    (isTerminated(before.active) && isDetected && active === before.active)
  );
};

/** @alwaysEventually */
export const tdFairness = () => !isTerminated(active) || terminationDetected();
