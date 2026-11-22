// TLC prints the original text whenever the parse fails.

import { skipWhile } from "./lexer";

interface PrintedNode {
  kind: "Constant" | "Set" | "Sequence" | "Record" | "Function" | "Subset" | "Pair";
  first: number;
  last: number;
  children: PrintedNode[];
}

interface Delimiters {
  open: string;
  close: string;
  pad: string;
  separator: string;
  divider: string;
  dividerPad: string;
}

const WIDTH = 80;

const DELIMITERS: Record<string, Delimiters> = {
  Set: { open: "{ ", close: " }", pad: "  ", separator: ",", divider: "", dividerPad: "" },
  Sequence: { open: "<< ", close: " >>", pad: "   ", separator: ",", divider: "", dividerPad: "" },
  Subset: { open: "SUBSET ", close: " ", pad: " ", separator: ",", divider: "", dividerPad: "" },
  Function: {
    open: "( ",
    close: " )",
    pad: "  ",
    separator: " @@",
    divider: " :>",
    dividerPad: "    ",
  },
  Record: {
    open: "[ ",
    close: " ]",
    pad: "  ",
    separator: ",",
    divider: " |->",
    dividerPad: "    ",
  },
};

const isWhitespace = (character: string | undefined) => {
  if (character === undefined) return false;
  const code = character.charCodeAt(0);
  return (
    (code >= 0x09 && code <= 0x0d) ||
    (code >= 0x1c && code <= 0x20) ||
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a && code !== 0x2007) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x205f ||
    code === 0x3000
  );
};

const isDigit = (character: string | undefined) =>
  character !== undefined && /^\p{Nd}$/u.test(character);

const isLetterOrDigit = (character: string | undefined) =>
  character !== undefined && /^[\p{L}\p{Nd}]$/u.test(character);

interface ParseFrame {
  kind: "Set" | "Sequence" | "Record" | "RecordPair" | "Function" | "Subset" | "FunctionPair";
  node: PrintedNode;
  last: number;
}

const PARSED = "Parsed";

interface FormatFrame {
  node: PrintedNode;
  columnWidth: number;
  trailerWidth: number;
  leftPad: string;
}

type FormatPart = string | FormatFrame;

const parsePrinted = (text: string) => {
  const skipWhitespace = (index: number) => {
    const end = skipWhile(text, index, isWhitespace);
    return text[end] === undefined ? undefined : end;
  };

  const openFrame = (
    kind: ParseFrame["kind"],
    nodeKind: PrintedNode["kind"],
    first: number,
    last: number,
  ): ParseFrame => ({ kind, node: { kind: nodeKind, first, last: first, children: [] }, last });

  const resumeItems = (
    frame: ParseFrame,
    item: PrintedNode | undefined,
    close: string,
    parseItem: (index: number) => PrintedNode | ParseFrame | undefined,
    separator: string,
  ) => {
    if (item) {
      frame.node.children.push(item);
      const afterItem = skipWhitespace(item.last + 1);
      if (afterItem === undefined) return undefined;
      frame.last = text.startsWith(separator, afterItem) ? afterItem + separator.length : afterItem;
    }
    const position = skipWhitespace(frame.last);
    if (position === undefined) return undefined;
    if (text[position] !== close) return parseItem(position);
    frame.node.last = position;
    return PARSED;
  };

  const resumePair = (frame: ParseFrame, part: PrintedNode | undefined, divider: string) => {
    if (!part) return parse(frame.last);
    frame.node.children.push(part);
    if (frame.node.children.length === 2) {
      frame.node.last = part.last;
      return PARSED;
    }
    const dividerIndex = skipWhitespace(part.last + 1);
    if (dividerIndex === undefined || !text.startsWith(divider, dividerIndex)) return undefined;
    const rightIndex = skipWhitespace(dividerIndex + divider.length);
    return rightIndex === undefined ? undefined : parse(rightIndex);
  };

  const resume = (frame: ParseFrame, child: PrintedNode | undefined) => {
    switch (frame.kind) {
      case "Set":
        return resumeItems(frame, child, "}", parse, ",");
      case "Sequence": {
        const step = resumeItems(frame, child, ">", parse, ",");
        if (step !== PARSED) return step;
        if (frame.node.last + 1 >= text.length) return undefined;
        frame.node.last++;
        return PARSED;
      }
      case "Record":
        return resumeItems(
          frame,
          child,
          "]",
          (item) => openFrame("RecordPair", "Pair", item, item),
          ",",
        );
      case "RecordPair":
        return resumePair(frame, child, "|->");
      case "Function":
        return resumeItems(
          frame,
          child,
          ")",
          (item) => openFrame("FunctionPair", "Pair", item, item),
          "@@",
        );
      case "Subset": {
        if (child) {
          frame.node.children.push(child);
          frame.node.last = child.last;
          return PARSED;
        }
        const elementIndex = skipWhitespace(frame.last);
        return elementIndex === undefined ? undefined : parse(elementIndex);
      }
      case "FunctionPair":
        return resumePair(frame, child, ":>");
    }
  };

  const parseInterval = (first: number): PrintedNode | undefined => {
    const lowEnd = skipWhile(text, first, isDigit);
    if (!text.startsWith("..", lowEnd) || !isDigit(text[lowEnd + 2])) return undefined;
    return {
      kind: "Constant",
      first,
      last: skipWhile(text, lowEnd + 2, isDigit) - 1,
      children: [],
    };
  };

  const parseConstant = (first: number): PrintedNode | undefined => {
    const character = text[first];
    if (character === '"') {
      const closing = text.indexOf('"', first + 1);
      return closing === -1 ? undefined : { kind: "Constant", first, last: closing, children: [] };
    }
    const interval = isDigit(character) ? parseInterval(first) : undefined;
    if (interval) return interval;
    if (character === "-") {
      if (first + 1 >= text.length) return undefined;
      return {
        kind: "Constant",
        first,
        last: skipWhile(text, first + 1, isDigit) - 1,
        children: [],
      };
    }
    if (!isLetterOrDigit(character)) return undefined;
    return {
      kind: "Constant",
      first,
      last: skipWhile(text, first, isLetterOrDigit) - 1,
      children: [],
    };
  };

  const parse = (index: number): PrintedNode | ParseFrame | undefined => {
    const first = skipWhitespace(index);
    if (first === undefined) return undefined;
    switch (text[first]) {
      case "{":
        return openFrame("Set", "Set", first, first + 1);
      case "<":
        return openFrame("Sequence", "Sequence", first, first + 2);
      case "[":
        return openFrame("Record", "Record", first, first + 1);
      case "(":
        return openFrame("Function", "Function", first, first + 1);
      default:
        return text.startsWith("SUBSET", first)
          ? openFrame("Subset", "Subset", first, first + 6)
          : parseConstant(first);
    }
  };

  const frames: ParseFrame[] = [];
  let opened = parse(0);
  while (opened !== undefined) {
    let child: PrintedNode | undefined;
    if ("node" in opened) frames.push(opened);
    else child = opened;
    while (true) {
      const frame = frames.at(-1);
      if (frame === undefined) return child;
      const step = resume(frame, child);
      if (step !== PARSED) {
        opened = step;
        break;
      }
      frames.pop();
      child = frame.node;
    }
  }
  return undefined;
};

// Deviation from TLC: tlc2.pprint's Parse and Format recurse once per nesting level, so a default TLC run overflows printing a value about 1,700 levels deep and drops the rest of the trace.
export const prettyPrint = (text: string) => {
  const tree = text.length === 0 ? undefined : parsePrinted(text);
  if (!tree || tree.last < text.length - 1) return text;

  const getText = (node: PrintedNode) => text.slice(node.first, node.last + 1);
  const getLength = (node: PrintedNode) => node.last - node.first + 1;

  const format = (
    node: PrintedNode,
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
  ): FormatPart[] | undefined => {
    if (getLength(node) <= columnWidth - trailerWidth || node.kind === "Constant") {
      return [getText(node)];
    }
    if (node.kind === "Pair") return undefined;
    const delimiters = DELIMITERS[node.kind];
    const innerWidth = columnWidth - Math.max(delimiters.open.length, delimiters.pad.length);
    const innerTrailer = trailerWidth + delimiters.close.length;
    const innerPad = leftPad + delimiters.pad;
    const inner =
      node.kind === "Function" || node.kind === "Record"
        ? formatPairs(node.children, innerWidth, innerTrailer, innerPad, delimiters)
        : formatItems(node.children, innerWidth, innerTrailer, innerPad, delimiters.separator);
    return [delimiters.open, ...inner, delimiters.close];
  };

  const formatItems = (
    items: PrintedNode[],
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
    separator: string,
  ) =>
    items.flatMap((item, index): FormatPart[] => {
      const isLast = index === items.length - 1;
      const formatted = {
        node: item,
        columnWidth,
        trailerWidth: isLast ? trailerWidth : separator.length,
        leftPad,
      };
      return isLast ? [formatted] : [formatted, `${separator}\n${leftPad}`];
    });

  const formatPairs = (
    pairs: PrintedNode[],
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
    delimiters: Delimiters,
  ) =>
    pairs.flatMap((pair, index): FormatPart[] => {
      const isLast = index === pairs.length - 1;
      const left = pair.children[0];
      const right = pair.children[1];
      const ending = isLast ? "" : `${delimiters.separator}\n${leftPad}`;
      const pairLength = getLength(left) + delimiters.divider.length + 1 + getLength(right);
      const fitsOnOneLine = isLast
        ? pairLength <= columnWidth - trailerWidth
        : pairLength + delimiters.separator.length <= columnWidth;
      if (fitsOnOneLine)
        return [`${getText(left)}${delimiters.divider} ${getText(right)}${ending}`];
      const formattedLeft =
        getLength(left) + delimiters.divider.length <= columnWidth
          ? getText(left)
          : {
              node: left,
              columnWidth,
              trailerWidth: trailerWidth + delimiters.divider.length,
              leftPad,
            };
      const formattedRight = {
        node: right,
        columnWidth: columnWidth - delimiters.dividerPad.length,
        trailerWidth: isLast ? trailerWidth : delimiters.separator.length,
        leftPad: leftPad + delimiters.dividerPad,
      };
      return [
        formattedLeft,
        `${delimiters.divider}\n${leftPad}${delimiters.dividerPad}`,
        formattedRight,
        ending,
      ];
    });

  let formatted = "";
  const pending: FormatPart[] = [{ node: tree, columnWidth: WIDTH, trailerWidth: 0, leftPad: "" }];
  for (let part = pending.pop(); part !== undefined; part = pending.pop()) {
    if (typeof part === "string") {
      formatted += part;
      continue;
    }
    const parts = format(part.node, part.columnWidth, part.trailerWidth, part.leftPad);
    if (parts === undefined) return text;
    for (let index = parts.length - 1; index >= 0; index--) pending.push(parts[index]);
  }
  return formatted;
};

// TLC writes the value of PrintT to -userFile with a line break, which PrettyPrint#mypp leaves unformatted.
export const prettyPrintT = (text: string, hasUserFile: boolean) =>
  hasUserFile ? text : prettyPrint(text);
