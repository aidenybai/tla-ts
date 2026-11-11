import { createContext, useContext, useState, type ReactNode } from "react";
import { getColorByNodeId } from "@/lib/colors";
import type { Example, ViewFile } from "@/model";
import { useRun } from "../../use-run";
import { ViewerStoreContext, createViewerStore } from "@/store/viewer";

interface ViewerState {
  examples: Example[];
  name: string;
  view: ViewFile;
  colorByNodeId: Map<string, string>;
  runner: ReturnType<typeof useRun>;
  isResultOpen: boolean;
  setResultOpen: (isResultOpen: boolean) => void;
}

const ViewerContext = createContext<ViewerState | null>(null);

interface ViewerProviderProps {
  examples: Example[];
  name: string;
  view: ViewFile;
  children: ReactNode;
}

export const ViewerProvider = ({ examples, name, view, children }: ViewerProviderProps) => {
  const [store] = useState(() => createViewerStore(view));
  const colorByNodeId = getColorByNodeId(view);
  const runner = useRun();
  const [isResultOpen, setResultOpen] = useState(false);
  return (
    <ViewerContext
      value={{
        examples,
        name,
        view,
        colorByNodeId,
        runner,
        isResultOpen,
        setResultOpen,
      }}
    >
      <ViewerStoreContext value={store}>{children}</ViewerStoreContext>
    </ViewerContext>
  );
};

export const useViewer = (): ViewerState => {
  const state = useContext(ViewerContext);
  if (!state) throw new Error("useViewer must be used inside <Viewer>");
  return state;
};
