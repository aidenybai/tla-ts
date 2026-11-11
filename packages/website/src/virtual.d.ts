declare module "virtual:site-data" {
  export const examples: import("./site-data").CompiledExample[];
  export const benchmarks: import("./site-data").Benchmark[];
  export const install: import("./site-data").Source;
}

declare module "virtual:typescript-libraries" {
  const libraries: ReadonlyMap<string, string>;
  export default libraries;
}
