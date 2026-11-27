declare module "virtual:site-data" {
  export const examples: import("@/lib/site-data").CompiledExample[];
  export const benchmarks: import("@/lib/site-data").Benchmark[];
  export const prompt: string;
  export const install: import("@/lib/site-data").Source;
  export const likesTest: import("@/lib/site-data").Source;
  export const likesRule: import("@/lib/site-data").Source;
  export const reference: import("@/lib/site-data").ContentSection[];
}

declare module "virtual:compilations" {
  export const initial: import("@/lib/compilation").Precompiled;
  export const compilations: Record<string, () => Promise<import("@/lib/compilation").Precompiled>>;
}

declare module "virtual:outlines" {
  const outlines: Record<string, string>;
  export default outlines;
}

declare module "virtual:typescript-libraries" {
  const libraries: ReadonlyMap<string, string>;
  export default libraries;
}

declare module "virtual:package-files" {
  const files: ReadonlyMap<string, string>;
  export default files;
}
