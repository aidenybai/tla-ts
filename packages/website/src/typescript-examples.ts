export interface TypeScriptExample {
  fileName: string;
  source: string;
}

// The TypeScript ports of tlaplus/Examples that tla-ts tests against the original specs.
const sources = import.meta.glob<string>("../../tla-ts/tests/fixtures/typescript/examples/*/*.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const TYPESCRIPT_EXAMPLES: TypeScriptExample[] = Object.entries(sources)
  .map((entry) => ({ fileName: entry[0].slice(entry[0].lastIndexOf("/") + 1), source: entry[1] }))
  .toSorted((left, right) => left.fileName.localeCompare(right.fileName));
