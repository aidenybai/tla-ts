export interface Token {
  content: string;
  style: Record<string, string>;
}

export interface Source {
  code: string;
  lines: Token[][];
}

// An example of the home page, whose compilation the page loads apart, as the playground does.
export interface CompiledExample {
  fileName: string;
  typescript: Source;
  sourceMarks: Mark[];
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
