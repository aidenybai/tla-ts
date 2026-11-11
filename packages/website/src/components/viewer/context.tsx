import { createContext, useContext, useState, type ReactNode } from "react";
import { getColorByNodeId } from "@/lib/colors";
import { navigate, usePathname } from "@/lib/navigation";
import { getPathMode, getRouteHref } from "@/lib/route";
import type { ViewMode } from "@/lib/view-mode";
import type { Example, ViewFile } from "@/model";
import { useRun } from "../../use-run";
import { ViewerStoreContext, createViewerStore } from "@/store/viewer";

interface ViewerState {
  examples: Example[];
  name: string;
  mode: ViewMode;
  view: ViewFile;
  json: string;
  setMode: (mode: ViewMode) => void;
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
  json: string;
  children: ReactNode;
}

export const ViewerProvider = ({ examples, name, view, json, children }: ViewerProviderProps) => {
  const mode = getPathMode(usePathname());
  const [store] = useState(() => createViewerStore(view));
  const colorByNodeId = getColorByNodeId(view);
  const runner = useRun();
  const [isResultOpen, setResultOpen] = useState(false);
  const setMode = (next: ViewMode) => navigate(getRouteHref(name, next), true);
  return (
    <ViewerContext
      value={{
        examples,
        name,
        mode,
        view,
        json,
        setMode,
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
