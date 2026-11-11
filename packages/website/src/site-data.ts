export interface CompiledExample {
  fileName: string;
  typescript: string;
  name: string;
  tla: string;
  config: string;
  highlightNames: string[];
}

export interface Benchmark {
  name: string;
  tlcSeconds: number;
  tlaTsSeconds: number;
  speedup: string;
}
