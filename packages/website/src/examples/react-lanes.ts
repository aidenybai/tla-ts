// From React's reconciler: packages/react-reconciler/src/ReactFiberLane.js.
// A root tracks its pending updates as bits, and renders the highest priority bit first.
type Lane = 1 | 2 | 4 | 8;

const NoLanes = 0;

let pendingLanes = NoLanes;
let renderLanes = NoLanes;

const getHighestPriorityLane = (lanes: number) => lanes & -lanes;

const mergeLanes = (a: number, b: number) => a | b;

const removeLanes = (set: number, subset: number) => set & ~subset;

export const markRootUpdated = (updateLane: Lane) => {
  pendingLanes = mergeLanes(pendingLanes, updateLane);
};

export const getNextLanes = () => {
  if (pendingLanes === NoLanes || renderLanes !== NoLanes) return;
  renderLanes = getHighestPriorityLane(pendingLanes);
};

export const markRootFinished = () => {
  if (renderLanes === NoLanes) return;
  pendingLanes = removeLanes(pendingLanes, renderLanes);
  renderLanes = NoLanes;
};

export const rendersOneLane = () => renderLanes === getHighestPriorityLane(renderLanes);

export const rendersTheMostUrgentLane = () =>
  renderLanes === NoLanes || renderLanes <= getHighestPriorityLane(pendingLanes);
