import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findTests, listFiles } from "./test-file";
import { getMessageCodes } from "./transcript";

const SOURCE_DIRECTORY = join(process.argv[2], "tlatools/org.lamport.tlatools/src");

const codeSource = readFileSync(join(SOURCE_DIRECTORY, "tlc2/output/EC.java"), "utf8");
const toolSource = readFileSync(join(SOURCE_DIRECTORY, "tlc2/TLC.java"), "utf8");
const allSource = listFiles(SOURCE_DIRECTORY, false)
  .filter((path) => path.endsWith(".java") && !path.endsWith("/EC.java"))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

const codes = [...codeSource.matchAll(/public static final int (\w+)\s*=\s*(\d+);/g)]
  .map((match) => ({ name: match[1], value: match[2] }))
  .filter((code) => allSource.includes(`EC.${code.name}`));
const flags = [
  ...new Set(
    [...toolSource.matchAll(/equals(?:IgnoreCase)?\("(-\w+)"\)/g)].map((match) => match[1]),
  ),
];

const tests = findTests([]);
const seenCodes = new Set(
  tests.flatMap((test) =>
    Object.values(test.recordings ?? {}).flatMap((recording) =>
      getMessageCodes(recording.transcript ?? "").split(" "),
    ),
  ),
);
const seenFlags = new Set(tests.flatMap((test) => test.metadata.args ?? []));

const missingCodes = codes.filter((code) => !seenCodes.has(code.value));
const missingFlags = flags.filter((flag) => !seenFlags.has(flag));

console.log(`${tests.length} tests`);
console.log(`Message codes: ${codes.length - missingCodes.length}/${codes.length}`);
missingCodes.forEach((code) => console.log(`  ${code.value} ${code.name}`));
console.log(`Flags: ${flags.length - missingFlags.length}/${flags.length}`);
console.log(`  ${missingFlags.join(" ")}`);
