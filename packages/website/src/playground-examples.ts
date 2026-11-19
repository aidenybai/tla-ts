const sources = import.meta.glob<string>(
  ["./examples/*.ts", "../../tla-ts/tests/fixtures/typescript/examples/two-phase/*.ts"],
  { query: "?raw", import: "default", eager: true },
);

// Code from real libraries comes first, and the port of a TLA+ spec last.
const FILE_NAMES = [
  "likes.ts",
  "search-box.ts",
  "react-scheduler.ts",
  "react-lanes.ts",
  "solid-signals.ts",
  "effect-semaphore.ts",
  "typescript-queue.ts",
  "two-phase.ts",
];

export const PLAYGROUND_EXAMPLES = FILE_NAMES.map((fileName) => ({
  fileName,
  source:
    Object.entries(sources)
      .find((entry) => entry[0].endsWith(`/${fileName}`))?.[1]
      .trim() ?? "",
}));
