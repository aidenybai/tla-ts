const MESSAGE_START = /^@!@!@STARTMSG (\d+):(\d+) @!@!@$/;
const MESSAGE_END = /^@!@!@ENDMSG \d+ @!@!@$/;

const VOLATILE_CODES = new Set([2185, 2186, 2187, 2188, 2189, 2200, 2219, 2220, 2262, 2271, 2401]);

const VOLATILE_LINE = /^(Parsing file |Semantic processing of module |Linting of module )/;
const STACK_FRAME = /^\s+at [\w.$<>]+\(.*\)$/;
const TIMESTAMP = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g;
const BUILD_VERSION = /\bVersion \d{4}\.\d{2}\.\d{2}\.\d{6}\b/g;
const DURATION = /\b(in) (\d+h )?(\d+min )?\d+(s|ms)\b/g;
const OBJECT_IDENTITY = /\b([\w.$]+)@[0-9a-f]{5,8}\b/g;
const GENERATED_NAME = /\b(__DebuggerExpr__|__DebuggerModule__|_PossibleModule_|neg_prop_)\d+/g;
const INSTALL_FIELD = /install \|->\s+"[^"]*"/g;

const STATE_SPACE_CODES = new Set([2190, 2192, 2193, 2194, 2199, 2267, 2268]);

export interface TranscriptOptions {
  directory: string;
  isStateSpaceRelevant: boolean;
}

const cleanLine = (line: string, directories: string[]) =>
  directories
    .reduce((text, directory) => text.replaceAll(`${directory}/`, ""), line)
    .replace(TIMESTAMP, "<date>")
    .replace(BUILD_VERSION, "Version <build>")
    .replace(DURATION, "$1 <time>")
    .replace(GENERATED_NAME, "$1<id>")
    .replace(OBJECT_IDENTITY, "$1@<id>");

export const normalizeTranscript = (output: string, options: TranscriptOptions) => {
  const directories = [options.directory, options.directory.replace(/^\/private/, "")];
  const kept: string[] = [];
  const message = { code: 0, severity: 0, lines: [] as string[], isOpen: false };
  output.split("\n").forEach((line) => {
    const start = MESSAGE_START.exec(line);
    if (start) {
      message.code = Number(start[1]);
      message.severity = Number(start[2]);
      message.lines = [];
      message.isOpen = true;
      return;
    }
    if (MESSAGE_END.test(line)) {
      message.isOpen = false;
      const isDropped =
        VOLATILE_CODES.has(message.code) ||
        (!options.isStateSpaceRelevant && STATE_SPACE_CODES.has(message.code));
      if (!isDropped) {
        const body = message.lines
          .filter((inner) => !STACK_FRAME.test(inner))
          .map((inner) => cleanLine(inner, directories))
          .join("\n")
          .replace(INSTALL_FIELD, 'install |-> "<install>"')
          .trimEnd();
        kept.push(`${message.code}:${message.severity} ${body}`);
      }
      return;
    }
    if (message.isOpen) {
      message.lines.push(line);
      return;
    }
    if (line.trim() !== "" && !VOLATILE_LINE.test(line) && !STACK_FRAME.test(line)) {
      kept.push(`| ${cleanLine(line, directories)}`);
    }
  });
  return kept.join("\n");
};

export const getMessageCodes = (transcript: string) =>
  [...transcript.matchAll(/^(\d+):\d+ /gm)].map((match) => match[1]).join(" ");
