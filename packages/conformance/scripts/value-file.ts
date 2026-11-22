import { gunzipSync } from "node:zlib";

const TAGS = {
  boolean: 0,
  integer: 1,
  string: 3,
  record: 4,
  set: 5,
  tuple: 7,
  function: 9,
  modelValue: 21,
  interval: 23,
  handle: 26,
};

interface ListFrame {
  kind: "record" | "set" | "tuple" | "function";
  index: number;
  count: number;
  parts: string[];
}

interface IntervalFrame {
  kind: "interval";
  index: number;
  count: number;
  parts: string[];
  low: number;
}

type Frame = ListFrame | IntervalFrame;

const getPairs = (parts: string[], separator: string) =>
  parts.flatMap((part, index) =>
    index % 2 === 0 ? [`${part}${separator}${parts[index + 1]}`] : [],
  );

const formatFrame = (frame: Frame) => {
  if (frame.kind === "interval") {
    return `(${frame.parts.map((part, offset) => `${frame.low + offset} :> ${part}`).join(" @@ ")})`;
  }
  if (frame.kind === "set") return `{${frame.parts.join(", ")}}`;
  if (frame.kind === "tuple") return `<<${frame.parts.join(", ")}>>`;
  if (frame.kind === "record") return `[${getPairs(frame.parts, " |-> ").join(", ")}]`;
  return `(${getPairs(frame.parts, " :> ").join(" @@ ")})`;
};

const decodeValues = (bytes: Uint8Array) => {
  const data = gunzipSync(bytes);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const handles: (string | undefined)[] = [];
  const frames: Frame[] = [];
  const strings = new Set<string>();
  const values: string[] = [];
  let position = 0;
  const readByte = () => view.getInt8(position++);
  const readShort = () => {
    const short = view.getInt16(position);
    position += 2;
    return short;
  };
  const readInt = () => {
    const int = view.getInt32(position);
    position += 4;
    return int;
  };
  const readNat = () => {
    const first = readShort();
    return first >= 0 ? first : -((first << 16) | (readShort() & 0xffff));
  };
  const readString = () => {
    // UniqueString#readExternal skips the intern token, an index into the writing TLC's own table.
    readInt();
    const loc = readInt();
    const length = readInt();
    if (length < 0 || position + length > data.length) {
      throw new Error(`The string at byte ${position} has length ${length}`);
    }
    let text = "";
    for (let offset = 0; offset < length; offset++) {
      text += String.fromCharCode(data[position + offset]);
    }
    position += length;
    strings.add(`${JSON.stringify(text)} loc ${loc}`);
    return text;
  };
  const readHandle = () => {
    const index = readNat();
    const handle = handles[index];
    if (handle === undefined) throw new Error(`Value ${index} is used before it is defined`);
    return handle;
  };
  const readFieldName = () => {
    if (readByte() === TAGS.handle) return readHandle();
    const name = readString();
    handles.push(name);
    return name;
  };
  const openFrame = (frame: Frame) => {
    frames.push(frame);
    return undefined;
  };
  const readValue = () => {
    const kind = readByte();
    if (kind === TAGS.boolean) return readByte() === 0 ? "FALSE" : "TRUE";
    if (kind === TAGS.integer) return String(readInt());
    if (kind === TAGS.modelValue) return `<model value ${readShort()}>`;
    if (kind === TAGS.interval) return `${readInt()}..${readInt()}`;
    if (kind === TAGS.handle) return readHandle();
    if (kind === TAGS.string) {
      const text = JSON.stringify(readString());
      handles.push(text);
      return text;
    }
    const index = handles.push(undefined) - 1;
    if (kind === TAGS.record) {
      return openFrame({ kind: "record", index, count: 2 * Math.abs(readInt()), parts: [] });
    }
    if (kind === TAGS.set) {
      return openFrame({ kind: "set", index, count: Math.abs(readInt()), parts: [] });
    }
    if (kind === TAGS.tuple)
      return openFrame({ kind: "tuple", index, count: readNat(), parts: [] });
    if (kind !== TAGS.function) throw new Error(`Unknown value kind ${kind}`);
    const count = readNat();
    if (readByte() !== 0)
      return openFrame({ kind: "function", index, count: 2 * count, parts: [] });
    const low = readInt();
    readInt();
    return openFrame({ kind: "interval", index, count, parts: [], low });
  };
  const readTopValue = () => {
    const first = readValue();
    if (first !== undefined) return first;
    while (true) {
      const frame = frames[frames.length - 1];
      if (frame.parts.length < frame.count) {
        const part =
          frame.kind === "record" && frame.parts.length % 2 === 0 ? readFieldName() : readValue();
        if (part !== undefined) frame.parts.push(part);
        continue;
      }
      frames.pop();
      const text = formatFrame(frame);
      handles[frame.index] = text;
      if (frames.length === 0) return text;
      frames[frames.length - 1].parts.push(text);
    }
  };
  while (position < data.length) values.push(readTopValue());
  return [`values: ${values.length}`, ...values, "strings:", ...strings].join("\n");
};

export const getValueFileText = (bytes: Uint8Array) => {
  try {
    return decodeValues(bytes);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return `undecodable: ${error.message}`;
  }
};
