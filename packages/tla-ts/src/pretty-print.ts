// TLC prints the original text whenever the parse fails.

import { skipWhile } from "./lexer";

type CompositeKind =
  | "Set"
  | "Sequence"
  | "Record"
  | "RecordPair"
  | "Function"
  | "Subset"
  | "FunctionPair";

interface PrintedNode {
  kind: "Constant" | CompositeKind;
  first: number;
  last: number;
  children: PrintedNode[];
}

interface CompositeNode extends PrintedNode {
  kind: CompositeKind;
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

const MAXIMUM_RECURSION_DEPTH = 1000;

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

const isComposite = (node: PrintedNode): node is CompositeNode => node.kind !== "Constant";

const openNode = (kind: CompositeKind, first: number, last: number): CompositeNode => ({
  kind,
  first,
  last,
  children: [],
});

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

  const resumeItems = (
    node: CompositeNode,
    item: PrintedNode | undefined,
    close: string,
    pairKind: "RecordPair" | "FunctionPair" | undefined,
    separator: string,
  ) => {
    if (item) {
      node.children.push(item);
      const afterItem = skipWhitespace(item.last + 1);
      if (afterItem === undefined) return undefined;
      node.last = text.startsWith(separator, afterItem) ? afterItem + separator.length : afterItem;
    }
    const position = skipWhitespace(node.last);
    if (position === undefined) return undefined;
    if (text[position] !== close) {
      return pairKind === undefined ? parse(position) : openNode(pairKind, position, position);
    }
    node.last = position;
    return PARSED;
  };

  const resumePair = (node: CompositeNode, part: PrintedNode | undefined, divider: string) => {
    if (!part) return parse(node.last);
    if (node.children.length === 1) {
      node.children = [node.children[0], part];
      node.last = part.last;
      return PARSED;
    }
    node.children = [part];
    const dividerIndex = skipWhitespace(part.last + 1);
    if (dividerIndex === undefined || !text.startsWith(divider, dividerIndex)) return undefined;
    const rightIndex = skipWhitespace(dividerIndex + divider.length);
    return rightIndex === undefined ? undefined : parse(rightIndex);
  };

  const resume = (node: CompositeNode, child: PrintedNode | undefined) => {
    switch (node.kind) {
      case "Set":
        return resumeItems(node, child, "}", undefined, ",");
      case "Sequence": {
        const step = resumeItems(node, child, ">", undefined, ",");
        if (step !== PARSED) return step;
        if (node.last + 1 >= text.length) return undefined;
        node.last++;
        return PARSED;
      }
      case "Record":
        return resumeItems(node, child, "]", "RecordPair", ",");
      case "RecordPair":
        return resumePair(node, child, "|->");
      case "Function":
        return resumeItems(node, child, ")", "FunctionPair", "@@");
      case "Subset": {
        if (child) {
          node.children = [child];
          node.last = child.last;
          return PARSED;
        }
        const elementIndex = skipWhitespace(node.last);
        return elementIndex === undefined ? undefined : parse(elementIndex);
      }
      case "FunctionPair":
        return resumePair(node, child, ":>");
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

  const parse = (index: number): PrintedNode | undefined => {
    const first = skipWhitespace(index);
    if (first === undefined) return undefined;
    switch (text[first]) {
      case "{":
        return openNode("Set", first, first + 1);
      case "<":
        return openNode("Sequence", first, first + 2);
      case "[":
        return openNode("Record", first, first + 1);
      case "(":
        return openNode("Function", first, first + 1);
      default:
        return text.startsWith("SUBSET", first)
          ? openNode("Subset", first, first + 6)
          : parseConstant(first);
    }
  };

  const parseComposite = (first: CompositeNode, depth: number): PrintedNode | undefined => {
    let child: PrintedNode | undefined;
    if (depth < MAXIMUM_RECURSION_DEPTH) {
      while (true) {
        const step = resume(first, child);
        if (step === PARSED) return first;
        if (step === undefined) return undefined;
        child = isComposite(step) ? parseComposite(step, depth + 1) : step;
        if (child === undefined) return undefined;
      }
    }
    const opened = [first];
    for (let node = opened.at(-1); node !== undefined; node = opened.at(-1)) {
      const step = resume(node, child);
      if (step === undefined) return undefined;
      if (step === PARSED) {
        opened.pop();
        child = node;
        continue;
      }
      if (!isComposite(step)) {
        child = step;
        continue;
      }
      opened.push(step);
      child = undefined;
    }
    return child;
  };

  const tree = parse(0);
  return tree && isComposite(tree) ? parseComposite(tree, 0) : tree;
};

// Deviation from TLC: tlc2.pprint's Parse and Format recurse once per nesting level, so TLC at its default stack can overflow printing a value about 1,700 levels deep, at a depth its JIT decides, and drops the rest of the trace.
export const prettyPrint = (text: string) => {
  const tree = text.length === 0 ? undefined : parsePrinted(text);
  if (!tree || tree.last < text.length - 1) return text;

  const getText = (node: PrintedNode) => text.slice(node.first, node.last + 1);
  const getLength = (node: PrintedNode) => node.last - node.first + 1;

  let formatted = "";
  let depth = 0;
  let pending: FormatPart[] | undefined;

  const write = (part: string) => {
    if (pending === undefined) formatted += part;
    else pending.push(part);
  };

  const formatInner = (
    node: PrintedNode,
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
  ) => {
    if (pending !== undefined) {
      pending.push({ node, columnWidth, trailerWidth, leftPad });
      return true;
    }
    if (depth < MAXIMUM_RECURSION_DEPTH) {
      depth++;
      const isFormatted = format(node, columnWidth, trailerWidth, leftPad);
      depth--;
      return isFormatted;
    }
    const stack: FormatPart[] = [{ node, columnWidth, trailerWidth, leftPad }];
    pending = stack;
    for (let part = stack.pop(); part !== undefined; part = stack.pop()) {
      if (typeof part === "string") {
        formatted += part;
        continue;
      }
      const start = stack.length;
      if (!format(part.node, part.columnWidth, part.trailerWidth, part.leftPad)) return false;
      for (let low = start, high = stack.length - 1; low < high; low++, high--) {
        const written = stack[low];
        stack[low] = stack[high];
        stack[high] = written;
      }
    }
    pending = undefined;
    return true;
  };

  const format = (
    node: PrintedNode,
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
  ): boolean => {
    if (getLength(node) <= columnWidth - trailerWidth || node.kind === "Constant") {
      write(getText(node));
      return true;
    }
    if (node.kind === "RecordPair" || node.kind === "FunctionPair") return false;
    const delimiters = DELIMITERS[node.kind];
    const innerWidth = columnWidth - Math.max(delimiters.open.length, delimiters.pad.length);
    const innerTrailer = trailerWidth + delimiters.close.length;
    const innerPad = leftPad + delimiters.pad;
    write(delimiters.open);
    const isFormatted =
      node.kind === "Function" || node.kind === "Record"
        ? formatPairs(node.children, innerWidth, innerTrailer, innerPad, delimiters)
        : formatItems(node.children, innerWidth, innerTrailer, innerPad, delimiters.separator);
    write(delimiters.close);
    return isFormatted;
  };

  const formatItems = (
    items: PrintedNode[],
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
    separator: string,
  ) => {
    for (let index = 0; index < items.length; index++) {
      const isLast = index === items.length - 1;
      if (
        !formatInner(items[index], columnWidth, isLast ? trailerWidth : separator.length, leftPad)
      ) {
        return false;
      }
      if (!isLast) write(`${separator}\n${leftPad}`);
    }
    return true;
  };

  const formatPairs = (
    pairs: PrintedNode[],
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
    delimiters: Delimiters,
  ) => {
    for (let index = 0; index < pairs.length; index++) {
      const isLast = index === pairs.length - 1;
      const left = pairs[index].children[0];
      const right = pairs[index].children[1];
      const ending = isLast ? "" : `${delimiters.separator}\n${leftPad}`;
      const pairLength = getLength(left) + delimiters.divider.length + 1 + getLength(right);
      const fitsOnOneLine = isLast
        ? pairLength <= columnWidth - trailerWidth
        : pairLength + delimiters.separator.length <= columnWidth;
      if (fitsOnOneLine) {
        write(`${getText(left)}${delimiters.divider} ${getText(right)}${ending}`);
        continue;
      }
      if (getLength(left) + delimiters.divider.length <= columnWidth) write(getText(left));
      else if (!formatInner(left, columnWidth, trailerWidth + delimiters.divider.length, leftPad)) {
        return false;
      }
      write(`${delimiters.divider}\n${leftPad}${delimiters.dividerPad}`);
      if (
        !formatInner(
          right,
          columnWidth - delimiters.dividerPad.length,
          isLast ? trailerWidth : delimiters.separator.length,
          leftPad + delimiters.dividerPad,
        )
      ) {
        return false;
      }
      write(ending);
    }
    return true;
  };

  return format(tree, WIDTH, 0, "") ? formatted : text;
};

// TLC writes the value of PrintT to -userFile with a line break, which PrettyPrint#mypp leaves unformatted.
export const prettyPrintT = (text: string, hasUserFile: boolean) =>
  hasUserFile ? text : prettyPrint(text);
