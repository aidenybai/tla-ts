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
  args: string[];
  status: number;
}

export const getStatechartSpecs = () =>
  readdirSync(STATECHART_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

export const readStatechartCalls = (spec: string): StatechartCall[] =>
  JSON.parse(readFileSync(join(STATECHART_DIRECTORY, spec, "calls.json"), "utf8"));

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

export const getDumpPath = (args: string[]) => {
  const index = args.indexOf("-dump");
  return index === -1 ? undefined : `${args[index + 2]}.dot`;
};

export const prepareStatechart = (spec: string, jar: string) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "statechart-")));
  const specFolder = join(root, "spec");
  const workFolder = join(root, "work");
  cpSync(join(STATECHART_DIRECTORY, spec, "spec"), specFolder, { recursive: true });
  mkdirSync(workFolder);
  const recordedWork = join(STATECHART_DIRECTORY, spec, "work");
  if (existsSync(recordedWork)) cpSync(recordedWork, workFolder, { recursive: true });
  const placeholders = [
    ["{jar}", jar],
    ["{spec}", specFolder],
    ["{work}", workFolder],
  ] as const;
  return {
    root,
    work: workFolder,
    getArgs: (call: StatechartCall) => {
      const args = call.args.map((arg) =>
        placeholders.reduce((text, [placeholder, path]) => text.replaceAll(placeholder, path), arg),
      );
      const temporary = args.find((arg) => arg.startsWith(TEMPORARY_DIRECTORY));
      if (temporary) mkdirSync(temporary.slice(TEMPORARY_DIRECTORY.length), { recursive: true });
      return args;
    },
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

const ENVIRONMENT_MESSAGE = /@!@!@STARTMSG (2262|2401|2187):\d @!@!@\n.*?@!@!@ENDMSG \1 @!@!@\n/gs;
