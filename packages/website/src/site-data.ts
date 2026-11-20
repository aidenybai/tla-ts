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
  /** The line of the TypeScript that declares each name. */
  lines: Record<string, number>;
  /** The same code once its bug is fixed. */
  fixed?: CompiledExample;
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

export type ReferenceBlock = HeadingBlock | ParagraphBlock | CodeBlock | TableBlock;

export interface ReferenceSection {
  title: string;
  blocks: ReferenceBlock[];
}
