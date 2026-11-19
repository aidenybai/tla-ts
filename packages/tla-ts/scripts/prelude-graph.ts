// Writes the prepared JavaScript module's graph into each bundle of the directories given, in place
// of the string that stands for it, so that a process reads the module rather than prepares it.
// With --if-present, directories whose bundles leave the module out are fine.
import { getPreludeGraph, prepareJavaScriptModule } from "../src/typescript/javascript";
import { writeGraph } from "./write-graph";

const isOptional = process.argv.includes("--if-present");
const directories = process.argv.slice(2).filter((argument) => argument !== "--if-present");
const isWritten = writeGraph(directories, "prelude", () =>
  getPreludeGraph(prepareJavaScriptModule()),
);
if (!isWritten && !isOptional) {
  throw new Error(`No bundle in ${directories.join(", ")} holds the prelude graph`);
}
