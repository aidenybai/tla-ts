// Writes the graph of ESCore's prepared runtime into each bundle of the directories given that
// holds the strings that stand for it, so that a process reads the runtime rather than prepares
// it. The runtime's realm is the host's, so this runs on the host that runs the bundles, whose
// processes read the graph only where their runtime's texts are the graph's.
import { join } from "node:path";
import { getRuntimeGraph } from "../src/typescript/spec/prepare";
import { writeGraph } from "./write-graph";

writeGraph(
  process.argv.slice(2),
  "escore",
  () => getRuntimeGraph(join(import.meta.dirname, "../ecmascript")),
  (file) => file.startsWith("escore-graph."),
);
