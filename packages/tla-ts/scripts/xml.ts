export interface XmlElement {
  name: string;
  children: XmlElement[];
  text: string;
}

const ENTITIES = new Map([
  ["lt", "<"],
  ["gt", ">"],
  ["amp", "&"],
  ["quot", '"'],
  ["apos", "'"],
]);

const decode = (text: string) => {
  const parts: string[] = [];
  for (let index = 0; index < text.length; index++) {
    const end = text[index] === "&" ? text.indexOf(";", index) : -1;
    const entity = end === -1 ? undefined : ENTITIES.get(text.slice(index + 1, end));
    if (entity === undefined) {
      parts.push(text[index]);
      continue;
    }
    parts.push(entity);
    index = end;
  }
  return parts.join("");
};

const CDATA_START = "<![CDATA[";
const CDATA_END = "]]>";
const COMMENT_START = "<!--";
const COMMENT_END = "-->";

const isNameCharacter = (character: string) =>
  character !== " " && character !== ">" && character !== "/" && character !== "\n";

// Parses the elements, text, and CDATA of a document without attributes, like the XML that SANY's
// XMLExporter writes.
export const parseXml = (source: string): XmlElement => {
  const cursor = { index: 0 };
  const root: XmlElement = { name: "", children: [], text: "" };
  const open = [root];
  while (cursor.index < source.length) {
    const tag = source.indexOf("<", cursor.index);
    const current = open[open.length - 1];
    if (tag === -1) break;
    if (tag > cursor.index) current.text += decode(source.slice(cursor.index, tag));
    if (source.startsWith(CDATA_START, tag)) {
      const end = source.indexOf(CDATA_END, tag);
      current.text += source.slice(tag + CDATA_START.length, end);
      cursor.index = end + CDATA_END.length;
      continue;
    }
    if (source.startsWith(COMMENT_START, tag)) {
      cursor.index = source.indexOf(COMMENT_END, tag) + COMMENT_END.length;
      continue;
    }
    const close = source.indexOf(">", tag);
    if (source[tag + 1] === "?") {
      cursor.index = close + 1;
      continue;
    }
    if (source[tag + 1] === "/") {
      open.pop();
      cursor.index = close + 1;
      continue;
    }
    const nameEnd = { index: tag + 1 };
    while (isNameCharacter(source[nameEnd.index])) nameEnd.index++;
    const element: XmlElement = {
      name: source.slice(tag + 1, nameEnd.index),
      children: [],
      text: "",
    };
    current.children.push(element);
    if (source[close - 1] !== "/") open.push(element);
    cursor.index = close + 1;
  }
  return root.children[0];
};

export const getChild = (element: XmlElement, name: string) =>
  element.children.find((child) => child.name === name);

export const getChildren = (element: XmlElement, name: string) =>
  element.children.filter((child) => child.name === name);
