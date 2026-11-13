import counter from "./examples/counter.ts?raw";

const fixtures = import.meta.glob<string>(
  [
    "../../tla-ts/tests/fixtures/typescript/examples/*/*.ts",
    "../../tla-ts/tests/fixtures/typescript/cli/failing/overdraft.ts",
  ],
  { query: "?raw", import: "default", eager: true },
);

export const PLAYGROUND_EXAMPLES = [
  { fileName: "counter.ts", source: counter.trim() },
  ...Object.entries(fixtures)
    .map(([path, source]) => ({
      fileName: path.slice(path.lastIndexOf("/") + 1),
      source: source.trim(),
    }))
    .toSorted((left, right) => left.fileName.localeCompare(right.fileName)),
];
