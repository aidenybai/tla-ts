export interface Token {
  content: string;
  style: Record<string, string>;
}

export interface Source {
  code: string;
  lines: Token[][];
}

export interface CompiledExample {
  fileName: string;
  name: string;
  config: string;
  modules: Record<string, string>;
  typescript: Source;
  tla: Source;
  highlightNames: string[];
  // Where each declaration of the TypeScript is, and where the TLA+ it compiles to is.
  sourceMarks: Mark[];
  outputMarks: Mark[];
}

export interface Benchmark {
  name: string;
  tlcSeconds: number;
  tlaTsSeconds: number;
  speedup: string;
}

export interface Mark {
  start: number;
  end: number;
  name: string;
}

export interface HeadingBlock {
  kind: "heading";
  text: string;
}

export interface ParagraphBlock {
  kind: "paragraph";
  text: string;
}

export interface CodeBlock {
  kind: "code";
  source: Source;
}

export interface TableBlock {
  kind: "table";
  header: string[];
  rows: string[][];
}

export type ContentBlock = HeadingBlock | ParagraphBlock | CodeBlock | TableBlock;

export interface ContentSection {
  title: string;
  blocks: ContentBlock[];
}
