// Writes the prepared JavaScript module's graph into each bundle of the directories given, in place
// of the string that stands for it, so that a process reads the module rather than prepares it.
// With --if-present, directories whose bundles leave the module out are fine.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getPreludeGraph, prepareJavaScriptModule } from "../src/typescript/javascript";

// The strings in each quoting a bundler may write them with: the tables' JSON, and the stream.
const TABLES = /'"tla-ts:prelude-tables"'|"\\"tla-ts:prelude-tables\\""|`"tla-ts:prelude-tables"`/;
const STREAM = /(["'`])tla-ts:prelude-stream\1/;

const isOptional = process.argv.includes("--if-present");
const directories = process.argv.slice(2).filter((argument) => argument !== "--if-present");
const bundles = directories
  .flatMap((directory) =>
    readdirSync(directory)
      .filter((name) => name.endsWith(".js") || name.endsWith(".cjs"))
      .map((name) => join(directory, name)),
  )
  .map((path) => ({ path, text: readFileSync(path, "utf8") }))
  .filter((bundle) => TABLES.test(bundle.text));
if (bundles.length === 0 && !isOptional) {
  throw new Error(`No bundle in ${directories.join(", ")} holds the prelude graph`);
}
if (bundles.length > 0) {
  const graph = getPreludeGraph(prepareJavaScriptModule());
  const tables = JSON.stringify(JSON.stringify(graph.tables));
  const stream = JSON.stringify(graph.stream);
  bundles.forEach((bundle) =>
    writeFileSync(
      bundle.path,
      bundle.text
        .replaceAll(new RegExp(TABLES, "g"), () => tables)
        .replaceAll(new RegExp(STREAM, "g"), () => stream),
    ),
  );
}
