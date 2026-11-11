export interface ViewPosition {
  line: number;
  column: number;
  index: number;
}

export interface ViewLocation {
  start: ViewPosition;
  end: ViewPosition;
}

export type Pane = "code" | "module";

export interface GraphNode {
  id: string;
  pane: Pane;
  kind: "variable" | "init" | "action" | "next" | "check" | "definition" | "read" | "write";
  // The state variable or definition the node belongs to, which picks its color.
  name: string;
  label: string;
  loc: ViewLocation;
  // Where a multi-line region takes the pointer and its arrows, such as the name it defines.
  anchor?: ViewLocation;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: "compiles" | "reads" | "writes";
}

export interface ViewSource {
  file: string;
  source: string;
}

// The TypeScript, the TLA+ it compiles to, and a source map from regions of one to the other.
export interface ViewFile extends ViewSource {
  module: ViewSource;
  // The TLC configuration that checks the module.
  config: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Example {
  file: string;
  name: string;
}
