import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { buildGraphIndex, getCausalNodeIds, type GraphIndex } from "@/lib/graph";
import type { GraphNode, ViewFile } from "@/model";

interface ViewerStoreState {
  index: GraphIndex;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  causalNodeIds: Set<string> | null;
  hover: (nodeId: string) => void;
  leave: () => void;
  select: (nodeId: string | null) => void;
}

export type ViewerStore = StoreApi<ViewerStoreState>;

// Hovering a node focuses it and everything linked to it. A selected node stays focused after the
// pointer leaves.
export const createViewerStore = (view: ViewFile): ViewerStore => {
  const index = buildGraphIndex(view);
  const getFocus = (nodeId: string | null) =>
    nodeId === null ? null : getCausalNodeIds(index, nodeId);
  return createStore<ViewerStoreState>()((set, get) => ({
    index,
    hoveredNodeId: null,
    selectedNodeId: null,
    causalNodeIds: null,
    hover: (nodeId) => {
      if (get().hoveredNodeId !== nodeId)
        set({ hoveredNodeId: nodeId, causalNodeIds: getFocus(nodeId) });
    },
    leave: () => {
      if (get().hoveredNodeId !== null)
        set({ hoveredNodeId: null, causalNodeIds: getFocus(get().selectedNodeId) });
    },
    select: (selectedNodeId) =>
      set({ selectedNodeId, causalNodeIds: getFocus(get().hoveredNodeId ?? selectedNodeId) }),
  }));
};

export const ViewerStoreContext = createContext<ViewerStore | null>(null);

export const useViewerStoreApi = (): ViewerStore => {
  const store = useContext(ViewerStoreContext);
  if (!store) throw new Error("useViewerStore must be used inside <Viewer>");
  return store;
};

export const useViewerStore = <Selected>(
  selector: (state: ViewerStoreState) => Selected,
): Selected => useStore(useViewerStoreApi(), selector);

export const useIsHovered = (nodeId: string): boolean =>
  useViewerStore((state) => (state.hoveredNodeId ?? state.selectedNodeId) === nodeId);

export const useFocusedNode = (): GraphNode | null =>
  useViewerStore((state) => {
    const nodeId = state.hoveredNodeId ?? state.selectedNodeId;
    return nodeId === null ? null : (state.index.nodes.get(nodeId) ?? null);
  });

export const useIsDimmed = (nodeIds: string[]): boolean =>
  useViewerStore(
    (state) =>
      state.causalNodeIds !== null &&
      nodeIds.length > 0 &&
      !nodeIds.some((nodeId) => state.causalNodeIds?.has(nodeId)),
  );
