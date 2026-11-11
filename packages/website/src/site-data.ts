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
