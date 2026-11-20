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

export interface CompareBlock {
  kind: "compare";
  typescript: Source;
  tla: Source;
}

export type ContentBlock = HeadingBlock | ParagraphBlock | CodeBlock | TableBlock | CompareBlock;

export interface ContentSection {
  title: string;
  blocks: ContentBlock[];
}
