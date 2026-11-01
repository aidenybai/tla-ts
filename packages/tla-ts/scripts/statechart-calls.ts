// The calls to TLC and SANY that pstack's statechart skill makes for each spec of its corpus, which
// record-statechart.ts records from Java and tests/unit/statechart.test.ts replays with tla-ts.
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

export const STATECHART_DIRECTORY = join(import.meta.dirname, "../tests/fixtures/statechart");

export interface StatechartCall {
  // The arguments the skill passes to java, with {jar}, {spec}, and {work} for the jar, the folder
  // of the spec, and the folder the skill writes its modules and configurations to.
  args: string[];
  status: number;
}

// A folder for each spec, next to pstack's license.
export const getStatechartSpecs = () =>
  readdirSync(STATECHART_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

export const readStatechartCalls = (spec: string): StatechartCall[] =>
  JSON.parse(readFileSync(join(STATECHART_DIRECTORY, spec, "calls.json"), "utf8"));

// What a call printed, and the state graph it dumped. SANY's XML is large, so the fixture keeps it
// compressed.
const getExpectedPath = (spec: string, call: StatechartCall, index: number, kind: "out" | "dot") =>
  join(
    STATECHART_DIRECTORY,
    spec,
    call.args.includes("tla2sany.xml.XMLExporter") ? `${index}.${kind}.gz` : `${index}.${kind}`,
  );

export const readExpected = (
  spec: string,
  call: StatechartCall,
  index: number,
  kind: "out" | "dot",
) => {
  const path = getExpectedPath(spec, call, index, kind);
  if (!existsSync(path)) return undefined;
  const content = readFileSync(path);
  return (path.endsWith(".gz") ? gunzipSync(content) : content).toString("utf8");
};

export const writeExpected = (
  spec: string,
  call: StatechartCall,
  index: number,
  kind: "out" | "dot",
  text: string,
) => {
  const path = getExpectedPath(spec, call, index, kind);
  writeFileSync(path, path.endsWith(".gz") ? gzipSync(text) : text);
};

// The file -dump writes the state graph to.
export const getDumpPath = (args: string[]) => {
  const index = args.indexOf("-dump");
  return index === -1 ? undefined : `${args[index + 2]}.dot`;
};

// Copies a spec's folders to a new folder, where each call runs in the work folder. The skill writes
// nothing to the work folder of a spec it stops at before checking, and git keeps no empty folder.
export const prepareStatechart = (spec: string, jar: string) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "statechart-")));
  const folders = { spec: join(root, "spec"), work: join(root, "work") };
  cpSync(join(STATECHART_DIRECTORY, spec, "spec"), folders.spec, { recursive: true });
  mkdirSync(folders.work);
  const work = join(STATECHART_DIRECTORY, spec, "work");
  if (existsSync(work)) cpSync(work, folders.work, { recursive: true });
  const placeholders = [
    ["{jar}", jar],
    ["{spec}", folders.spec],
    ["{work}", folders.work],
  ] as const;
  return {
    root,
    work: folders.work,
    // The skill creates the folder it names as Java's temporary directory before each call.
    getArgs: (call: StatechartCall) => {
      const args = call.args.map((arg) =>
        placeholders.reduce((text, [placeholder, path]) => text.replaceAll(placeholder, path), arg),
      );
      const temporary = args.find((arg) => arg.startsWith(TEMPORARY_DIRECTORY));
      if (temporary) mkdirSync(temporary.slice(TEMPORARY_DIRECTORY.length), { recursive: true });
      return args;
    },
    // What a run prints, without what depends on the machine, the time, or the folders.
    normalize: (output: string) =>
      placeholders
        .reduce((text, [placeholder, path]) => text.replaceAll(path, placeholder), output)
        .replace(ENVIRONMENT_MESSAGE, "")
        .replace(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/g, "DATE")
        .replace(/\[pid: \d+\]/g, "[pid]")
        .replace(/\([\d,]+ (d?s)\/min\)/g, "(N $1/min)")
        .replace(/Finished in \d+ms/g, "Finished in T")
        .replace(/in [\dhmins ]+ at/g, "in T at")
        .replace(/\/tlc-\d+\//g, "/tlc-N/"),
  };
};

const TEMPORARY_DIRECTORY = "-Djava.io.tmpdir=";

// The messages in which TLC names its version, warns about the Java VM, and describes the machine.
const ENVIRONMENT_MESSAGE = /@!@!@STARTMSG (2262|2401|2187):\d @!@!@\n.*?@!@!@ENDMSG \1 @!@!@\n/gs;
