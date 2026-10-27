// A port of TLC's tlc2.pprint package, which re-parses a printed value and breaks it across
// lines of at most 80 columns. TLC prints the original text whenever the parse fails.

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

const parsePrinted = (text: string) => {
  const skipWhitespace = (index: number) => {
    const position = { index };
    while (isWhitespace(text[position.index])) position.index++;
    return text[position.index] === undefined ? undefined : position.index;
  };

  const parseItems = (
    kind: PrintedNode["kind"],
    first: number,
    start: number,
    close: string,
    parseItem: (index: number) => PrintedNode | undefined,
    separator: string,
  ) => {
    const node: PrintedNode = { kind, first, last: first, children: [] };
    const position = { index: skipWhitespace(start) };
    while (position.index !== undefined && text[position.index] !== close) {
      const item = parseItem(position.index);
      if (!item) return undefined;
      node.children.push(item);
      const afterItem = skipWhitespace(item.last + 1);
      if (afterItem === undefined) return undefined;
      const afterSeparator = text.startsWith(separator, afterItem)
        ? afterItem + separator.length
        : afterItem;
      position.index = skipWhitespace(afterSeparator);
    }
    if (position.index === undefined) return undefined;
    node.last = position.index;
    return node;
  };

  const parsePair = (index: number, divider: string): PrintedNode | undefined => {
    const left = parse(index);
    if (!left) return undefined;
    const dividerIndex = skipWhitespace(left.last + 1);
    if (dividerIndex === undefined || !text.startsWith(divider, dividerIndex)) return undefined;
    const rightIndex = skipWhitespace(dividerIndex + divider.length);
    const right = rightIndex === undefined ? undefined : parse(rightIndex);
    if (!right) return undefined;
    return { kind: "Pair", first: index, last: right.last, children: [left, right] };
  };

  const parseInterval = (first: number): PrintedNode | undefined => {
    const position = { index: first };
    while (position.index < text.length && isDigit(text[position.index])) position.index++;
    if (!text.startsWith("..", position.index)) return undefined;
    position.index += 2;
    if (!isDigit(text[position.index])) return undefined;
    while (isDigit(text[position.index])) position.index++;
    return { kind: "Constant", first, last: position.index - 1, children: [] };
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
      const position = { index: first + 1 };
      while (isDigit(text[position.index])) position.index++;
      return { kind: "Constant", first, last: position.index - 1, children: [] };
    }
    if (!isLetterOrDigit(character)) return undefined;
    const position = { index: first };
    while (isLetterOrDigit(text[position.index])) position.index++;
    return { kind: "Constant", first, last: position.index - 1, children: [] };
  };

  const parse = (index: number): PrintedNode | undefined => {
    const first = skipWhitespace(index);
    if (first === undefined) return undefined;
    switch (text[first]) {
      case "{":
        return parseItems("Set", first, first + 1, "}", parse, ",");
      case "<": {
        const node = parseItems("Sequence", first, first + 2, ">", parse, ",");
        if (!node || node.last + 1 >= text.length) return undefined;
        return { ...node, last: node.last + 1 };
      }
      case "[":
        return parseItems("Record", first, first + 1, "]", (item) => parsePair(item, "|->"), ",");
      case "(":
        return parseItems("Function", first, first + 1, ")", (item) => parsePair(item, ":>"), "@@");
      default: {
        if (!text.startsWith("SUBSET", first)) return parseConstant(first);
        const elementIndex = skipWhitespace(first + 6);
        const element = elementIndex === undefined ? undefined : parse(elementIndex);
        return element
          ? { kind: "Subset", first, last: element.last, children: [element] }
          : undefined;
      }
    }
  };

  return parse(0);
};

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
  ): string | undefined => {
    if (getLength(node) <= columnWidth - trailerWidth || node.kind === "Constant") {
      return getText(node);
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
    return inner === undefined ? undefined : delimiters.open + inner + delimiters.close;
  };

  const formatItems = (
    items: PrintedNode[],
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
    separator: string,
  ) => {
    const parts = items.map((item, index) => {
      const isLast = index === items.length - 1;
      const formatted = format(
        item,
        columnWidth,
        isLast ? trailerWidth : separator.length,
        leftPad,
      );
      return formatted === undefined || isLast ? formatted : `${formatted}${separator}\n${leftPad}`;
    });
    return parts.includes(undefined) ? undefined : parts.join("");
  };

  const formatPairs = (
    pairs: PrintedNode[],
    columnWidth: number,
    trailerWidth: number,
    leftPad: string,
    delimiters: Delimiters,
  ) => {
    const divider = delimiters.divider;
    const dividerPad = delimiters.dividerPad;
    const separator = delimiters.separator;
    const parts = pairs.map((pair, index) => {
      const isLast = index === pairs.length - 1;
      const left = pair.children[0];
      const right = pair.children[1];
      const valueTrailer = isLast ? trailerWidth : separator.length;
      const ending = isLast ? "" : `${separator}\n${leftPad}`;
      const fitsOnOneLine = isLast
        ? getLength(left) + divider.length + 1 + getLength(right) <= columnWidth - trailerWidth
        : getLength(left) + divider.length + 1 + getLength(right) + separator.length <= columnWidth;
      if (fitsOnOneLine) return `${getText(left)}${divider} ${getText(right)}${ending}`;
      const formattedLeft =
        getLength(left) + divider.length <= columnWidth
          ? getText(left)
          : format(left, columnWidth, trailerWidth + divider.length, leftPad);
      const formattedRight = format(
        right,
        columnWidth - dividerPad.length,
        valueTrailer,
        leftPad + dividerPad,
      );
      return formattedLeft === undefined || formattedRight === undefined
        ? undefined
        : `${formattedLeft}${divider}\n${leftPad}${dividerPad}${formattedRight}${ending}`;
    });
    return parts.includes(undefined) ? undefined : parts.join("");
  };

  return format(tree, WIDTH, 0, "") ?? text;
};
