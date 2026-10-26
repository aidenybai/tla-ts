const WIDTH = 80;

type NodeType = "Constant" | "Set" | "Sequence" | "Function" | "Record" | "Subset" | "Pair";

interface Node {
  type: NodeType;
  first: number;
  last: number;
  children: Node[];
}

interface Delimiters {
  open: string;
  close: string;
  pad: string;
  separator: string;
  divider?: string;
}

const DELIMITERS: Partial<Record<NodeType, Delimiters>> = {
  Set: { open: "{ ", close: " }", pad: "  ", separator: "," },
  Sequence: { open: "<< ", close: " >>", pad: "   ", separator: "," },
  Function: { open: "( ", close: " )", pad: "  ", separator: " @@", divider: " :>" },
  Record: { open: "[ ", close: " ]", pad: "  ", separator: ",", divider: " |->" },
  Subset: { open: "SUBSET ", close: " ", pad: " ", separator: "," },
};

const DIVIDER_PAD = "    ";

const isDigit = (character: string | undefined) =>
  character !== undefined && /\p{Nd}/u.test(character);

const isLetterOrDigit = (character: string | undefined) =>
  character !== undefined && /[\p{L}\p{Nd}]/u.test(character);

const parseValue = (text: string) => {
  const skipWhitespace = (index: number) => {
    const next = text.slice(index).search(/\S/);
    return next === -1 ? undefined : index + next;
  };

  const parseList = (
    type: NodeType,
    index: number,
    openLength: number,
    close: string,
    parseItem: (start: number) => Node | undefined,
    separator: string,
  ): Node | undefined => {
    const children: Node[] = [];
    const cursor = { value: skipWhitespace(index + openLength) };
    while (cursor.value !== undefined && text[cursor.value] !== close) {
      const item = parseItem(cursor.value);
      if (item === undefined) return undefined;
      children.push(item);
      const afterItem = skipWhitespace(item.last + 1);
      if (afterItem === undefined) return undefined;
      const afterSeparator = text.startsWith(separator, afterItem)
        ? afterItem + separator.length
        : afterItem;
      cursor.value = skipWhitespace(afterSeparator);
    }
    if (cursor.value === undefined) return undefined;
    const last = type === "Sequence" ? cursor.value + 1 : cursor.value;
    return last < text.length ? { type, first: index, last, children } : undefined;
  };

  const parsePair = (index: number, divider: string): Node | undefined => {
    const argument = parse(index);
    if (argument === undefined) return undefined;
    const afterArgument = skipWhitespace(argument.last + 1);
    if (afterArgument === undefined || !text.startsWith(divider, afterArgument)) return undefined;
    const valueStart = skipWhitespace(afterArgument + divider.length);
    const value = valueStart === undefined ? undefined : parse(valueStart);
    if (value === undefined) return undefined;
    return { type: "Pair", first: index, last: value.last, children: [argument, value] };
  };

  const parseInterval = (index: number): Node | undefined => {
    const low = { value: index };
    if (!isDigit(text[low.value])) return undefined;
    while (isDigit(text[low.value])) low.value++;
    if (!text.startsWith("..", low.value)) return undefined;
    const high = { value: low.value + 2 };
    if (!isDigit(text[high.value])) return undefined;
    while (isDigit(text[high.value])) high.value++;
    return { type: "Constant", first: index, last: high.value - 1, children: [] };
  };

  const parseConstant = (index: number): Node | undefined => {
    const first = skipWhitespace(index);
    if (first === undefined) return undefined;
    const constant = (last: number): Node => ({ type: "Constant", first, last, children: [] });
    if (text[first] === '"') {
      const closing = text.indexOf('"', first + 1);
      return closing === -1 ? undefined : constant(closing);
    }
    const interval = isDigit(text[first]) ? parseInterval(index) : undefined;
    if (interval !== undefined) return interval;
    if (text[first] === "-") {
      if (first + 1 >= text.length) return undefined;
      const last = { value: first + 1 };
      while (isDigit(text[last.value])) last.value++;
      return constant(last.value - 1);
    }
    if (!isLetterOrDigit(text[first])) return undefined;
    const last = { value: first };
    while (isLetterOrDigit(text[last.value])) last.value++;
    return constant(last.value - 1);
  };

  const parse = (index: number): Node | undefined => {
    const start = skipWhitespace(index);
    if (start === undefined) return undefined;
    switch (text[start]) {
      case "{":
        return parseList("Set", start, 1, "}", parse, ",");
      case "<":
        return parseList("Sequence", start, 2, ">", parse, ",");
      case "[":
        return parseList("Record", start, 1, "]", (item) => parsePair(item, "|->"), ",");
      case "(":
        return parseList("Function", start, 1, ")", (item) => parsePair(item, ":>"), "@@");
    }
    if (text.startsWith("SUBSET", start)) {
      const elementStart = skipWhitespace(start + 6);
      const element = elementStart === undefined ? undefined : parse(elementStart);
      if (element === undefined) return undefined;
      return { type: "Subset", first: start, last: element.last, children: [element] };
    }
    return parseConstant(start);
  };

  return parse(0);
};

export const prettyPrint = (text: string, width = WIDTH) => {
  const tree = text.length === 0 ? undefined : parseValue(text);
  if (tree === undefined || tree.last < text.length - 1) return text;
  const getText = (node: Node) => text.slice(node.first, node.last + 1);
  const getLength = (node: Node) => node.last - node.first + 1;

  const format = (node: Node, columns: number, trailer: number, padding: string): string => {
    if (getLength(node) <= columns - trailer) return getText(node);
    const delimiters = DELIMITERS[node.type];
    if (delimiters === undefined) return getText(node);
    const innerColumns = columns - Math.max(delimiters.open.length, delimiters.pad.length);
    const innerTrailer = trailer + delimiters.close.length;
    const innerPadding = padding + delimiters.pad;
    const separator = delimiters.separator;
    const divider = delimiters.divider;
    const items = node.children.map((child, index) => {
      const isLast = index === node.children.length - 1;
      const itemTrailer = isLast ? innerTrailer : separator.length;
      const suffix = isLast ? "" : `${separator}\n${innerPadding}`;
      if (divider === undefined)
        return format(child, innerColumns, itemTrailer, innerPadding) + suffix;
      const argument = child.children[0];
      const value = child.children[1];
      const lineLength = getLength(argument) + divider.length + 1 + getLength(value);
      const isOneLine = isLast
        ? lineLength <= innerColumns - innerTrailer
        : lineLength + separator.length <= innerColumns;
      if (isOneLine) return `${getText(argument)}${divider} ${getText(value)}${suffix}`;
      const formattedArgument =
        getLength(argument) + divider.length <= innerColumns
          ? getText(argument)
          : format(argument, innerColumns, innerTrailer + divider.length, innerPadding);
      const formattedValue = format(
        value,
        innerColumns - DIVIDER_PAD.length,
        itemTrailer,
        innerPadding + DIVIDER_PAD,
      );
      return `${formattedArgument}${divider}\n${innerPadding}${DIVIDER_PAD}${formattedValue}${suffix}`;
    });
    return `${delimiters.open}${items.join("")}${delimiters.close}`;
  };

  return format(tree, width, 0, "");
};
