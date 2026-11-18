declare module "virtual:site-data" {
  export const examples: import("./site-data").CompiledExample[];
  export const benchmarks: import("./site-data").Benchmark[];
  export const prompt: string;
  export const install: import("./site-data").Source;
  export const reference: import("./site-data").ReferenceSection[];
}

declare module "virtual:compilations" {
  export const initial: import("./compilation").Precompiled;
  export const compilations: Record<string, () => Promise<import("./compilation").Precompiled>>;
}

declare module "virtual:outlines" {
  const outlines: Record<string, string>;
  export default outlines;
}

declare module "virtual:typescript-libraries" {
  const libraries: ReadonlyMap<string, string>;
  export default libraries;
}
