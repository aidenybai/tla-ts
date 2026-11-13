import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getToolPath } from "./corpora";
import {
  getDumpPath,
  getStatechartSpecs,
  prepareStatechart,
  readStatechartCalls,
  STATECHART_DIRECTORY,
  writeExpected,
} from "./statechart-calls";

const jarPath = getToolPath("TLA2TOOLS_JAR", "tla2tools.jar");

for (const spec of getStatechartSpecs()) {
  const calls = readStatechartCalls(spec);
  const statechart = prepareStatechart(spec, jarPath);
  const recorded = calls.map((call, index) => {
    const args = statechart.getArgs(call);
    const result = spawnSync("java", args, {
      cwd: statechart.work,
      encoding: "utf8",
      maxBuffer: 1 << 30,
    });
    writeExpected(spec, call, index, "out", statechart.normalize(result.stdout + result.stderr));
    const dump = getDumpPath(args);
    if (dump && existsSync(dump)) {
      writeExpected(spec, call, index, "dot", statechart.normalize(readFileSync(dump, "utf8")));
    }
    return { ...call, status: result.status ?? 1 };
  });
  writeFileSync(
    join(STATECHART_DIRECTORY, spec, "calls.json"),
    `${JSON.stringify(recorded, undefined, 2)}\n`,
  );
  rmSync(statechart.root, { recursive: true, force: true });
  console.log(`Recorded ${calls.length} calls for ${spec}`);
}
