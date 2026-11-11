import { useEffect, useId, useRef, useState, type MouseEvent, type RefObject } from "react";
import { File } from "@pierre/diffs/react";
import { ClientSuspense } from "@/components/ui/client-suspense";
import { useFileOptions } from "@/hooks/use-file-options";
import { useHighlighter } from "@/hooks/use-highlighter";
import { useTokenBoxes, type PlacedToken } from "@/hooks/use-token-boxes";
import { revealLine, type Box } from "@/lib/positions";
import { getFileTitle } from "@/lib/source";
import type { GraphNode, Pane } from "@/model";
import { getCausalNodeIds } from "@/lib/graph";
import { useViewerStore } from "@/store/viewer";
import { useViewer } from "./context";
import { TokenMark } from "./token-mark";

const contains = (box: Box, x: number, y: number): boolean =>
  x >= box.x - 2 && x <= box.x + box.width + 2 && y >= box.y && y <= box.y + box.height;

// A multi-line region is under the pointer only at its anchor, such as the name it defines.
const findTokenAt = (tokens: PlacedToken[], x: number, y: number): PlacedToken | null =>
  tokens.find((token) =>
    token.isMultiLine
      ? token.anchorBox !== null && contains(token.anchorBox, x, y)
      : token.rows.some((row) => contains(row, x, y)),
  ) ?? null;

const getTokenAtEvent = (wrapper: HTMLElement, tokens: PlacedToken[], event: MouseEvent) => {
  const origin = wrapper.getBoundingClientRect();
  return findTokenAt(tokens, event.clientX - origin.left, event.clientY - origin.top);
};

const usePointerTracking = (
  wrapperRef: RefObject<HTMLDivElement | null>,
  tokens: PlacedToken[],
): ((event: MouseEvent) => void) => {
  const hover = useViewerStore((state) => state.hover);
  const leave = useViewerStore((state) => state.leave);
  return (event: MouseEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper || event.buttons !== 0) return;
    const token = getTokenAtEvent(wrapper, tokens, event);
    if (token) hover(token.node.id);
    else leave();
  };
};

const useColoredNodes = (pane: Pane): GraphNode[] => {
  const { view, colorByNodeId } = useViewer();
  return view.nodes.filter((node) => node.pane === pane && colorByNodeId.has(node.id));
};

// Selecting a node brings its first linked line in this pane into view.
const useRevealLinked = (wrapperRef: RefObject<HTMLDivElement | null>, pane: Pane): void => {
  const index = useViewerStore((state) => state.index);
  const selectedNodeId = useViewerStore((state) => state.selectedNodeId);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const host = wrapper?.querySelector<HTMLElement>("diffs-container");
    const selected = selectedNodeId === null ? undefined : index.nodes.get(selectedNodeId);
    if (!wrapper?.parentElement || !host || !selected) return;
    const linked = [...getCausalNodeIds(index, selected.id)]
      .flatMap((nodeId) => index.nodes.get(nodeId) ?? [])
      .filter((node) => node.pane === pane)
      .map((node) => (node.anchor ?? node.loc).start.line);
    if (linked.length > 0) revealLine(host, wrapper.parentElement, Math.min(...linked));
  }, [wrapperRef, pane, index, selectedNodeId]);
};

const getRowKey = (row: Box): string => `${row.x}-${row.y}-${row.width}`;

const getFocusRows = (tokens: PlacedToken[], nodeIds: Set<string> | null): Box[] => {
  const rows = tokens.filter((token) => nodeIds?.has(token.node.id)).flatMap((token) => token.rows);
  return [...new Map(rows.map((row) => [getRowKey(row), row])).values()];
};

const FocusScrim = ({ tokens }: { tokens: PlacedToken[] }) => {
  const maskId = useId();
  const causalNodeIds = useViewerStore((state) => state.causalNodeIds);
  const [focusNodeIds, setFocusNodeIds] = useState(causalNodeIds);
  if (causalNodeIds !== null && causalNodeIds !== focusNodeIds) setFocusNodeIds(causalNodeIds);
  return (
    <g
      className="transition-opacity duration-150"
      style={{ opacity: causalNodeIds === null ? 0 : 1 }}
    >
      <mask id={maskId}>
        <rect width="100%" height="100%" fill="white" />
        {getFocusRows(tokens, focusNodeIds).map((row) => (
          <rect
            key={getRowKey(row)}
            x={row.x - 2}
            y={row.y}
            width={row.width + 4}
            height={row.height}
            rx={2}
            fill="black"
          />
        ))}
      </mask>
      <rect
        width="100%"
        height="100%"
        style={{ fill: "var(--color-background)" }}
        fillOpacity={0.6}
        mask={`url(#${maskId})`}
      />
    </g>
  );
};

const Overlay = ({ tokens }: { tokens: PlacedToken[] }) => {
  const { colorByNodeId } = useViewer();
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-hidden"
      width="100%"
      height="100%"
    >
      <FocusScrim tokens={tokens} />
      {tokens.map((token) => (
        <TokenMark
          key={token.node.id}
          {...token}
          color={colorByNodeId.get(token.node.id) ?? "transparent"}
        />
      ))}
    </svg>
  );
};

interface CodeViewProps {
  pane: Pane;
  fileName: string;
  source: string;
}

const CodeView = ({ pane, fileName, source }: CodeViewProps) => {
  useHighlighter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [renderCount, setRenderCount] = useState(0);
  const options = useFileOptions(() => setRenderCount((count) => count + 1));
  const file = { name: getFileTitle(fileName), contents: source };
  const tokens = useTokenBoxes(wrapperRef, useColoredNodes(pane), renderCount);
  const trackPointer = usePointerTracking(wrapperRef, tokens);
  const leave = useViewerStore((state) => state.leave);
  const select = useViewerStore((state) => state.select);
  const selectedNodeId = useViewerStore((state) => state.selectedNodeId);
  useRevealLinked(wrapperRef, pane);
  return (
    <div
      ref={wrapperRef}
      className="relative min-h-full min-w-0 py-1 pr-4 text-[13px]/[19px] sm:pr-8"
      onMouseMove={trackPointer}
      onMouseLeave={leave}
      onClick={(event) => {
        const wrapper = wrapperRef.current;
        const nodeId = wrapper ? getTokenAtEvent(wrapper, tokens, event)?.node.id : undefined;
        // A second click on the selected token, or a click on empty space, clears the selection.
        select(nodeId === undefined || nodeId === selectedNodeId ? null : nodeId);
      }}
    >
      <File file={file} options={options} disableWorkerPool />
      <Overlay tokens={tokens} />
    </div>
  );
};

export const SourcePane = ({ pane }: { pane: Pane }) => {
  const { view } = useViewer();
  const file = pane === "code" ? view : view.module;
  return (
    <div className="scroll-pane">
      <ClientSuspense>
        <CodeView pane={pane} fileName={file.file} source={file.source} />
      </ClientSuspense>
    </div>
  );
};
