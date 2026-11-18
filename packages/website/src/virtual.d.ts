declare module "virtual:site-data" {
  export const examples: import("./site-data").CompiledExample[];
  export const benchmarks: import("./site-data").Benchmark[];
  export const prompt: string;
  export const install: import("./site-data").Source;
  export const reference: import("./site-data").ReferenceSection[];
}

declare module "virtual:outlines" {
  const outlines: Record<string, string>;
  export default outlines;
}

declare module "virtual:typescript-libraries" {
  const libraries: ReadonlyMap<string, string>;
  export default libraries;
}
