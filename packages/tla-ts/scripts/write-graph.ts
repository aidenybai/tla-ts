import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { EncodedGraph } from "../src/graph-codec";

// Writes a graph into each bundle of the directories given that holds the strings that stand for
// it, its tables as JSON and its stream as it is, but the bundles of the names left out, and tells
// whether any did. A bundler may quote each string in any of three ways.
export const writeGraph = (
  directories: string[],
  name: string,
  getGraph: () => EncodedGraph,
  isLeftOut: (bundleName: string) => boolean = () => false,
) => {
  const tablesPattern = new RegExp(
    `'"tla-ts:${name}-tables"'|"\\\\"tla-ts:${name}-tables\\\\""|\`"tla-ts:${name}-tables"\``,
    "g",
  );
  const streamPattern = new RegExp(`(["'\`])tla-ts:${name}-stream\\1`, "g");
  const bundles = directories
    .flatMap((directory) =>
      readdirSync(directory)
        .filter((file) => (file.endsWith(".js") || file.endsWith(".cjs")) && !isLeftOut(file))
        .map((file) => join(directory, file)),
    )
    .map((path) => ({ path, text: readFileSync(path, "utf8") }))
    .filter((bundle) => bundle.text.search(tablesPattern) !== -1);
  if (bundles.length === 0) return false;
  const graph = getGraph();
  const tables = JSON.stringify(JSON.stringify(graph.tables));
  const stream = JSON.stringify(graph.stream);
  bundles.forEach((bundle) =>
    writeFileSync(
      bundle.path,
      bundle.text.replaceAll(tablesPattern, () => tables).replaceAll(streamPattern, () => stream),
    ),
  );
  return true;
};
