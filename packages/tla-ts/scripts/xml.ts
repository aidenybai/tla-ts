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

export const parseXml = (source: string): XmlElement => {
  let position = 0;
  const root: XmlElement = { name: "", children: [], text: "" };
  const open = [root];
  while (position < source.length) {
    const tag = source.indexOf("<", position);
    const current = open[open.length - 1];
    if (tag === -1) break;
    if (tag > position) current.text += decode(source.slice(position, tag));
    if (source.startsWith(CDATA_START, tag)) {
      const end = source.indexOf(CDATA_END, tag);
      current.text += source.slice(tag + CDATA_START.length, end);
      position = end + CDATA_END.length;
      continue;
    }
    if (source.startsWith(COMMENT_START, tag)) {
      position = source.indexOf(COMMENT_END, tag) + COMMENT_END.length;
      continue;
    }
    const close = source.indexOf(">", tag);
    if (source[tag + 1] === "?") {
      position = close + 1;
      continue;
    }
    if (source[tag + 1] === "/") {
      open.pop();
      position = close + 1;
      continue;
    }
    let nameEnd = tag + 1;
    while (isNameCharacter(source[nameEnd])) nameEnd++;
    const element: XmlElement = {
      name: source.slice(tag + 1, nameEnd),
      children: [],
      text: "",
    };
    current.children.push(element);
    if (source[close - 1] !== "/") open.push(element);
    position = close + 1;
  }
  return root.children[0];
};

export const getChild = (element: XmlElement, name: string) =>
  element.children.find((child) => child.name === name);

export const getChildren = (element: XmlElement, name: string) =>
  element.children.filter((child) => child.name === name);
