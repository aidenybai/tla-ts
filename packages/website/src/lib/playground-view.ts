import { create } from "zustand";

interface PlaygroundView {
  hoveredName: string | undefined;
  hoveredStateId: string | undefined;
  isArrowsShown: boolean;
  isResultShown: boolean;
  hoverName: (name: string | undefined) => void;
  hoverState: (stateId: string | undefined) => void;
  setIsArrowsShown: (isArrowsShown: boolean) => void;
  setIsResultShown: (isResultShown: boolean) => void;
}

// What the visitor is pointing at and has toggled. Each part of the playground reads only the
// fields it draws, so moving the pointer re-renders the code and not the header or the result.
export const usePlaygroundView = create<PlaygroundView>()((set) => ({
  hoveredName: undefined,
  hoveredStateId: undefined,
  isArrowsShown: true,
  isResultShown: false,
  hoverName: (hoveredName) => set({ hoveredName }),
  hoverState: (hoveredStateId) => set({ hoveredStateId }),
  setIsArrowsShown: (isArrowsShown) => set({ isArrowsShown }),
  setIsResultShown: (isResultShown) => set({ isResultShown }),
}));
