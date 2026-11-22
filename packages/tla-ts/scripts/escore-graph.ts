// Writes the graph of ESCore's prepared runtime into each bundle of the directories given that
// holds the strings that stand for it, so that a process reads the runtime rather than prepares
// it. The runtime's realm is the host's, so this runs on the host that runs the bundles, whose
// processes read the graph only where their runtime's texts are the graph's.
import { join } from "node:path";
import { getRuntimeGraphs } from "../src/typescript/spec/prepare";
import { writeGraph } from "./write-graph";

// The runtime's graph and its extensions' graph come of one preparation, which the second write
// reads as the first left it.
let graphs: ReturnType<typeof getRuntimeGraphs> | undefined;
const getGraphs = () => (graphs ??= getRuntimeGraphs(join(import.meta.dirname, "../ecmascript")));
const isLeftOut = (file: string) => file.startsWith("escore-graph.");
writeGraph(process.argv.slice(2), "escore", () => getGraphs().runtime, isLeftOut);
writeGraph(process.argv.slice(2), "escore-extensions", () => getGraphs().extensions, isLeftOut);
