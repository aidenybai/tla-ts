const MARKER = /@!@!@(?:STARTMSG (\d+):(\d+)|ENDMSG \d+) @!@!@/g;

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

interface OpenMessage {
  code: number;
  severity: number;
  lines: string[];
  slot: number;
}

interface MarkerSplit {
  parts: (string | RegExpExecArray)[];
  offset: number;
}

// A message can embed another's full text, so its markers can open mid-line.
const splitAtMarkers = (line: string) =>
  [...line.matchAll(MARKER)].reduce<MarkerSplit>(
    (state, match) => ({
      parts: [...state.parts, line.slice(state.offset, match.index), match],
      offset: match.index + match[0].length,
    }),
    { parts: [], offset: 0 },
  );

export const normalizeTranscript = (output: string, options: TranscriptOptions) => {
  const directories = [options.directory, options.directory.replace(/^\/private/, "")];
  const kept: (string | undefined)[] = [];
  const open: OpenMessage[] = [];
  const addText = (text: string) => {
    const message = open.at(-1);
    if (message) {
      message.lines.push(text);
      return;
    }
    if (text.trim() !== "" && !VOLATILE_LINE.test(text) && !STACK_FRAME.test(text)) {
      kept.push(`| ${cleanLine(text, directories)}`);
    }
  };
  const closeMessage = () => {
    const message = open.pop();
    if (!message) return;
    const isDropped =
      VOLATILE_CODES.has(message.code) ||
      (!options.isStateSpaceRelevant && STATE_SPACE_CODES.has(message.code));
    const body = message.lines
      .filter((inner) => !STACK_FRAME.test(inner))
      .map((inner) => cleanLine(inner, directories))
      .join("\n")
      .replace(INSTALL_FIELD, 'install |-> "<install>"')
      .trimEnd();
    kept[message.slot] = isDropped ? undefined : `${message.code}:${message.severity} ${body}`;
  };
  output.split("\n").forEach((line) => {
    const split = splitAtMarkers(line);
    split.parts.forEach((part) => {
      if (typeof part === "string") {
        if (part !== "") addText(part);
        return;
      }
      if (part[1] === undefined) {
        closeMessage();
        return;
      }
      open.push({ code: Number(part[1]), severity: Number(part[2]), lines: [], slot: kept.length });
      kept.push(undefined);
    });
    const rest = line.slice(split.offset);
    if (split.parts.length === 0 || rest !== "") addText(rest);
  });
  return kept.filter((entry) => entry !== undefined).join("\n");
};

export const getMessageCodes = (transcript: string) =>
  [...transcript.matchAll(/^(\d+):\d+ /gm)].map((match) => match[1]).join(" ");
