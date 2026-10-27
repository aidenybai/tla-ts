// A port of OCaml's Format module, which tlapm uses to lay out obligations. Only the parts tlapm
// reaches are ported: boxes, breaks, forced newlines and text.

type BoxKind = "h" | "v" | "hv" | "hov" | "b" | "fits";

type Token =
  | { kind: "Text"; text: string }
  | { kind: "Break"; width: number; offset: number }
  | { kind: "Begin"; indent: number; box: BoxKind }
  | { kind: "End" }
  | { kind: "Newline" };

interface QueueElement {
  size: number;
  token: Token;
  length: number;
}

interface ScanElement {
  leftTotal: number;
  element: QueueElement;
}

interface FormatElement {
  box: BoxKind;
  width: number;
}

interface Formatter {
  queue: QueueElement[];
  queueStart: number;
  scanStack: ScanElement[];
  formatStack: FormatElement[];
  margin: number;
  maxIndent: number;
  spaceLeft: number;
  currentIndent: number;
  isNewLine: boolean;
  leftTotal: number;
  rightTotal: number;
  depth: number;
  output: string[];
}

const INFINITY = 1000000010;

const UNKNOWN = -1;

const getLength = (text: string) => {
  for (let index = 0; index < text.length; index++) {
    if (text.charCodeAt(index) > 0x7f) return Buffer.byteLength(text);
  }
  return text.length;
};

const getSentinel = (): ScanElement => ({
  leftTotal: -1,
  element: { size: UNKNOWN, token: { kind: "Text", text: "" }, length: 0 },
});

const createFormatter = (): Formatter => {
  const systemBox: QueueElement = {
    size: UNKNOWN,
    token: { kind: "Begin", indent: 0, box: "hov" },
    length: 0,
  };
  return {
    queue: [systemBox],
    queueStart: 0,
    scanStack: [getSentinel(), { leftTotal: 1, element: systemBox }],
    formatStack: [],
    margin: 78,
    maxIndent: 68,
    spaceLeft: 78,
    currentIndent: 0,
    isNewLine: true,
    leftTotal: 1,
    rightTotal: 1,
    depth: 1,
    output: [],
  };
};

const enqueue = (formatter: Formatter, element: QueueElement) => {
  formatter.rightTotal += element.length;
  formatter.queue.push(element);
};

const breakNewLine = (formatter: Formatter, offset: number, width: number) => {
  formatter.output.push("\n");
  formatter.isNewLine = true;
  formatter.currentIndent = Math.min(formatter.maxIndent, formatter.margin - width + offset);
  formatter.spaceLeft = formatter.margin - formatter.currentIndent;
  formatter.output.push(" ".repeat(formatter.currentIndent));
};

const breakSameLine = (formatter: Formatter, width: number) => {
  formatter.spaceLeft -= width;
  formatter.output.push(" ".repeat(width));
};

const forceBreakLine = (formatter: Formatter) => {
  const top = formatter.formatStack.at(-1);
  if (!top) {
    formatter.output.push("\n");
    return;
  }
  if (top.width > formatter.spaceLeft && top.box !== "fits" && top.box !== "h") {
    breakNewLine(formatter, 0, top.width);
  }
};

const formatToken = (formatter: Formatter, size: number, token: Token) => {
  switch (token.kind) {
    case "Text":
      formatter.spaceLeft -= size;
      formatter.output.push(token.text);
      formatter.isNewLine = false;
      return;
    case "Begin": {
      if (formatter.margin - formatter.spaceLeft > formatter.maxIndent) forceBreakLine(formatter);
      const width = formatter.spaceLeft - token.indent;
      const box = token.box === "v" || size > formatter.spaceLeft ? token.box : "fits";
      formatter.formatStack.push({ box, width });
      return;
    }
    case "End":
      formatter.formatStack.pop();
      return;
    case "Newline": {
      const top = formatter.formatStack.at(-1);
      if (top) breakNewLine(formatter, 0, top.width);
      else formatter.output.push("\n");
      return;
    }
    case "Break": {
      const top = formatter.formatStack.at(-1);
      if (!top) return;
      const width = top.width;
      switch (top.box) {
        case "hov":
          if (size > formatter.spaceLeft) breakNewLine(formatter, token.offset, width);
          else breakSameLine(formatter, token.width);
          return;
        case "b":
          if (formatter.isNewLine) breakSameLine(formatter, token.width);
          else if (size > formatter.spaceLeft) breakNewLine(formatter, token.offset, width);
          else if (formatter.currentIndent > formatter.margin - width + token.offset) {
            breakNewLine(formatter, token.offset, width);
          } else breakSameLine(formatter, token.width);
          return;
        case "hv":
        case "v":
          breakNewLine(formatter, token.offset, width);
          return;
        case "fits":
        case "h":
          breakSameLine(formatter, token.width);
          return;
      }
    }
  }
};

const advanceLeft = (formatter: Formatter) => {
  while (formatter.queueStart < formatter.queue.length) {
    const element = formatter.queue[formatter.queueStart];
    const isKnown = element.size >= 0;
    if (!isKnown && formatter.rightTotal - formatter.leftTotal < formatter.spaceLeft) return;
    formatter.queueStart++;
    formatToken(formatter, isKnown ? element.size : INFINITY, element.token);
    formatter.leftTotal += element.length;
  }
  formatter.queue.length = 0;
  formatter.queueStart = 0;
};

const enqueueAdvance = (formatter: Formatter, element: QueueElement) => {
  enqueue(formatter, element);
  advanceLeft(formatter);
};

const setSize = (formatter: Formatter, isBreak: boolean) => {
  const top = formatter.scanStack.at(-1);
  if (!top) return;
  if (top.leftTotal < formatter.leftTotal) {
    formatter.scanStack = [getSentinel()];
    return;
  }
  const kind = top.element.token.kind;
  if ((kind === "Break") === isBreak && (kind === "Break" || kind === "Begin")) {
    top.element.size = formatter.rightTotal + top.element.size;
    formatter.scanStack.pop();
  }
};

const scanPush = (formatter: Formatter, isBreak: boolean, element: QueueElement) => {
  enqueue(formatter, element);
  if (isBreak) setSize(formatter, true);
  formatter.scanStack.push({ leftTotal: formatter.rightTotal, element });
};

const openBox = (formatter: Formatter, box: BoxKind, indent: number) => {
  formatter.depth++;
  scanPush(formatter, false, {
    size: -formatter.rightTotal,
    token: { kind: "Begin", indent, box },
    length: 0,
  });
};

const closeBox = (formatter: Formatter) => {
  if (formatter.depth <= 1) return;
  enqueue(formatter, { size: 0, token: { kind: "End" }, length: 0 });
  setSize(formatter, true);
  setSize(formatter, false);
  formatter.depth--;
};

const printAs = (formatter: Formatter, size: number, text: string) =>
  enqueueAdvance(formatter, { size, token: { kind: "Text", text }, length: size });

const printBreak = (formatter: Formatter, width: number, offset: number) =>
  scanPush(formatter, true, {
    size: -formatter.rightTotal,
    token: { kind: "Break", width, offset },
    length: width,
  });

const forceNewline = (formatter: Formatter) =>
  enqueueAdvance(formatter, { size: 0, token: { kind: "Newline" }, length: 0 });

const flush = (formatter: Formatter) => {
  while (formatter.depth > 1) closeBox(formatter);
  formatter.rightTotal = INFINITY;
  advanceLeft(formatter);
  return formatter.output.join("");
};

// pp_print_newline: flush, print a newline, and start over with no open boxes.
const flushNewline = (formatter: Formatter) => {
  flush(formatter);
  const output = [...formatter.output, "\n"];
  Object.assign(formatter, createFormatter());
  formatter.output = output;
};

// Printers build a document of layout commands first and render it once, so names resolve while
// the printer still knows the context they were bound in.
type Command =
  | { kind: "Open"; box: BoxKind; indent: number }
  | { kind: "Close" }
  | { kind: "Text"; text: string; size: number }
  | { kind: "Break"; width: number; offset: number }
  | { kind: "Newline" }
  | { kind: "Flush" };

export type Doc = (Command | Doc)[];

type FormatArgument = string | Doc;

const BOX_KINDS: Record<string, BoxKind> = { h: "h", v: "v", hv: "hv", hov: "hov", b: "b" };

const getText = (value: string): Command => ({ kind: "Text", text: value, size: getLength(value) });

// Prints a string as is, where format would read @ and % in it as directives.
export const text = (value: string): Doc => (value === "" ? [] : [getText(value)]);

const SPACE: Command = { kind: "Break", width: 1, offset: 0 };

const CUT: Command = { kind: "Break", width: 0, offset: 0 };

const parseOpen = (directive: string): Command => {
  let split = 0;
  while (split < directive.length && !(directive[split] >= "0" && directive[split] <= "9")) {
    split++;
  }
  return {
    kind: "Open",
    box: BOX_KINDS[directive.slice(0, split)],
    indent: Number(directive.slice(split) || 0),
  };
};

// Interprets the subset of OCaml format strings that tlapm's printers use, so ported printers read
// like the OCaml they come from. Each %s or %a consumes one argument.
export const format = (pattern: string, ...args: FormatArgument[]): Doc => {
  const doc: Doc = [];
  let argumentIndex = 0;
  let pending = "";
  const flushText = () => {
    if (pending === "") return;
    doc.push(getText(pending));
    pending = "";
  };
  const pushArgument = () => {
    const argument = args[argumentIndex++];
    if (typeof argument === "string") {
      if (argument !== "") doc.push(getText(argument));
    } else doc.push(argument);
  };
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index];
    const next = pattern[index + 1];
    if (character === "%") {
      flushText();
      pushArgument();
      index++;
      continue;
    }
    if (character !== "@") {
      pending += character;
      continue;
    }
    flushText();
    if (next === "[" && pattern[index + 2] === "<") {
      const end = pattern.indexOf(">", index);
      doc.push(parseOpen(pattern.slice(index + 3, end)));
      index = end;
    } else if (next === "[") {
      doc.push({ kind: "Open", box: "b", indent: 0 });
      index++;
    } else if (next === "]") {
      doc.push({ kind: "Close" });
      index++;
    } else if (next === " ") {
      doc.push(SPACE);
      index++;
    } else if (next === ",") {
      doc.push(CUT);
      index++;
    } else if (next === "\n") {
      doc.push({ kind: "Newline" });
      index++;
    } else if (next === ".") {
      doc.push({ kind: "Flush" });
      index++;
    } else if (next === ";") {
      const end = pattern.indexOf(">", index);
      const values = pattern.slice(index + 3, end).split(" ");
      doc.push({ kind: "Break", width: Number(values[0]), offset: Number(values[1]) });
      index = end;
    } else if (next === "<") {
      const end = pattern.indexOf(">", index);
      doc.push({
        kind: "Text",
        text: String(args[argumentIndex++]),
        size: Number(pattern.slice(index + 2, end)),
      });
      index = end + 2;
    }
  }
  flushText();
  return doc;
};

export const formatDelimited = <Item>(
  items: Item[],
  formatItem: (item: Item) => Doc,
  separator: Doc = [getText(","), SPACE],
): Doc =>
  items.flatMap((item, index) =>
    index === 0 ? [formatItem(item)] : [separator, formatItem(item)],
  );

const renderInto = (formatter: Formatter, doc: Doc) => {
  for (const entry of doc) {
    if (Array.isArray(entry)) {
      renderInto(formatter, entry);
      continue;
    }
    switch (entry.kind) {
      case "Open":
        openBox(formatter, entry.box, entry.indent);
        break;
      case "Close":
        closeBox(formatter);
        break;
      case "Text":
        printAs(formatter, entry.size, entry.text);
        break;
      case "Break":
        printBreak(formatter, entry.width, entry.offset);
        break;
      case "Newline":
        forceNewline(formatter);
        break;
      case "Flush":
        flushNewline(formatter);
        break;
    }
  }
};

export const renderDoc = (doc: Doc) => {
  const formatter = createFormatter();
  renderInto(formatter, doc);
  return flush(formatter);
};
