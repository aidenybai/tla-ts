// Records what Java's TLC and SANY print for each call of pstack's statechart skill in
// tests/fixtures/statechart, and the state graph -dump writes.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  getDumpPath,
  getStatechartSpecs,
  prepareStatechart,
  readStatechartCalls,
  STATECHART_DIRECTORY,
  writeExpected,
} from "./statechart-calls";

const jarPath = process.env.TLA2TOOLS_JAR;
if (!jarPath || !existsSync(jarPath)) {
  console.error("Set TLA2TOOLS_JAR to the path of tla2tools.jar");
  process.exit(1);
}

for (const spec of getStatechartSpecs()) {
  const calls = readStatechartCalls(spec);
  const { root, work, getArgs, normalize } = prepareStatechart(spec, jarPath);
  const recorded = calls.map((call, index) => {
    const args = getArgs(call);
    const result = spawnSync("java", args, { cwd: work, encoding: "utf8", maxBuffer: 1 << 30 });
    writeExpected(spec, call, index, "out", normalize(result.stdout + result.stderr));
    const dump = getDumpPath(args);
    if (dump && existsSync(dump)) {
      writeExpected(spec, call, index, "dot", normalize(readFileSync(dump, "utf8")));
    }
    return { ...call, status: result.status ?? 1 };
  });
  writeFileSync(
    join(STATECHART_DIRECTORY, spec, "calls.json"),
    `${JSON.stringify(recorded, undefined, 2)}\n`,
  );
  rmSync(root, { recursive: true, force: true });
  console.log(`Recorded ${calls.length} calls for ${spec}`);
}
