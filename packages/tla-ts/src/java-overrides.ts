import type { Definition, Expression, Module, SourceLocation } from "./ast";
import { TlaSyntaxError, TlaUnsupportedError } from "./errors";

interface PoolEntry {
  tag: number;
  text: string;
  value: number;
  first: number;
  second: number;
}

interface JavaMethod {
  name: string;
  arity: number;
  // Method#toString, which TLC prints as the signature of an override.
  signature: string;
  code: Uint8Array | undefined;
}

// A public static method of the class named after a module, which TLC reports as it loads the
// class, with whether it overrides an operator.
export interface JavaOverride {
  module: string;
  operator: string;
  signature: string;
  isMatched: boolean;
}

interface ObjectReference {
  className: string;
  value: Expression | undefined;
}

type StackItem = number | string | Expression | ObjectReference;

const CLASS_MAGIC = 0xcafebabe;
const ACCESS_PUBLIC = 0x0001;
const ACCESS_STATIC = 0x0008;
const VALUE_PACKAGE = "tlc2/value/impl/";

const createReader = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const cursor = { offset: 0 };
  const advance = (length: number) => {
    const start = cursor.offset;
    cursor.offset += length;
    return start;
  };
  return {
    readUint8: () => view.getUint8(advance(1)),
    readUint16: () => view.getUint16(advance(2)),
    readUint32: () => view.getUint32(advance(4)),
    readInt32: () => view.getInt32(advance(4)),
    readBytes: (length: number) => bytes.subarray(advance(length), cursor.offset),
  };
};

const PRIMITIVE_TYPES = new Map([
  ["B", "byte"],
  ["C", "char"],
  ["D", "double"],
  ["F", "float"],
  ["I", "int"],
  ["J", "long"],
  ["S", "short"],
  ["Z", "boolean"],
  ["V", "void"],
]);

// The modifiers Method#toString prints, in the order of Modifier#toString.
const METHOD_MODIFIERS: [number, string][] = [
  [0x0001, "public"],
  [0x0004, "protected"],
  [0x0002, "private"],
  [0x0400, "abstract"],
  [0x0008, "static"],
  [0x0010, "final"],
  [0x0020, "synchronized"],
  [0x0100, "native"],
  [0x0800, "strictfp"],
];

const getTypeNames = (descriptor: string) =>
  [...descriptor.matchAll(/(\[*)(?:L([^;]*);|([BCDFIJSZV]))/g)].map(
    (match) =>
      `${match[2]?.replaceAll("/", ".") ?? PRIMITIVE_TYPES.get(match[3])}${"[]".repeat(match[1].length)}`,
  );

const getClassName = (pool: PoolEntry[], index: number) => pool[pool[index].first].text;

const getJavaClassName = (pool: PoolEntry[], index: number) =>
  getClassName(pool, index).replaceAll("/", ".");

// The public static methods of a class file and their bytecode, in the order of the class file.
// Class#getDeclaredMethods orders them by where HotSpot allocated the symbols of their names.
const readMethods = (bytes: Uint8Array) => {
  const reader = createReader(bytes);
  if (reader.readUint32() !== CLASS_MAGIC)
    throw new TlaSyntaxError("A module override is not a class file");
  reader.readUint16();
  reader.readUint16();
  const pool: PoolEntry[] = [];
  const count = reader.readUint16();
  const decoder = new TextDecoder();
  for (let index = 1; index < count; index++) {
    const tag = reader.readUint8();
    const entry = { tag, text: "", value: 0, first: 0, second: 0 };
    pool[index] = entry;
    if (tag === 1) entry.text = decoder.decode(reader.readBytes(reader.readUint16()));
    else if (tag === 3) entry.value = reader.readInt32();
    else if (tag === 4) reader.readUint32();
    else if (tag === 5 || tag === 6) {
      reader.readBytes(8);
      index++;
    } else if (tag === 7 || tag === 8 || tag === 16 || tag === 19 || tag === 20) {
      entry.first = reader.readUint16();
    } else if (tag === 15) {
      reader.readUint8();
      entry.first = reader.readUint16();
    } else {
      entry.first = reader.readUint16();
      entry.second = reader.readUint16();
    }
  }
  reader.readUint16();
  const className = getJavaClassName(pool, reader.readUint16());
  reader.readUint16();
  reader.readBytes(reader.readUint16() * 2);
  for (let fields = reader.readUint16(); fields > 0; fields--) {
    reader.readBytes(6);
    for (let attributes = reader.readUint16(); attributes > 0; attributes--) {
      reader.readUint16();
      reader.readBytes(reader.readUint32());
    }
  }
  const methods: JavaMethod[] = [];
  for (let remaining = reader.readUint16(); remaining > 0; remaining--) {
    const access = reader.readUint16();
    const name = pool[reader.readUint16()].text;
    const descriptor = pool[reader.readUint16()].text;
    const close = descriptor.indexOf(")");
    const parameters = getTypeNames(descriptor.slice(1, close));
    const attributes = Array.from({ length: reader.readUint16() }, () => ({
      name: pool[reader.readUint16()].text,
      reader: createReader(reader.readBytes(reader.readUint32())),
    }));
    const isOverride = (access & ACCESS_PUBLIC) !== 0 && (access & ACCESS_STATIC) !== 0;
    if (!isOverride) continue;
    const code = attributes.find((attribute) => attribute.name === "Code")?.reader;
    // A Code attribute holds max_stack and max_locals before the length of the bytecode.
    code?.readBytes(4);
    const thrown = attributes.find((attribute) => attribute.name === "Exceptions")?.reader;
    const exceptions = thrown
      ? Array.from({ length: thrown.readUint16() }, () =>
          getJavaClassName(pool, thrown.readUint16()),
        )
      : [];
    const modifiers = METHOD_MODIFIERS.filter(([flag]) => (access & flag) !== 0).map(
      ([, modifier]) => modifier,
    );
    const returnType = getTypeNames(descriptor.slice(close + 1))[0];
    const throwsClause = exceptions.length === 0 ? "" : ` throws ${exceptions.join(",")}`;
    methods.push({
      name,
      arity: parameters.length,
      code: code?.readBytes(code.readUint32()),
      signature: `${modifiers.join(" ")} ${returnType} ${className}.${name}(${parameters.join(",")})${throwsClause}`,
    });
  }
  return { pool, methods };
};

const getMember = (pool: PoolEntry[], index: number) => {
  const reference = pool[index];
  const nameAndType = pool[reference.second];
  return {
    className: getClassName(pool, reference.first),
    name: pool[nameAndType.first].text,
  };
};

// Runs the bytecode of an override that returns a constant TLC value, such as
// BoolValue.ValTrue, IntValue.gen(3), or new StringValue("a"), and returns that value as a
// literal.
const getReturnedLiteral = (
  method: JavaMethod,
  pool: PoolEntry[],
  className: string,
  location: SourceLocation,
) => {
  const unsupported = () =>
    new TlaUnsupportedError(
      `The Java override ${className}.${method.name} computes its value, which tla-ts cannot run`,
    );
  const code = method.code;
  if (!code) throw unsupported();
  const stack: StackItem[] = [];
  const pop = () => {
    const item = stack.pop();
    if (item === undefined) throw unsupported();
    return item;
  };
  const getConstant = (index: number) => {
    const entry = pool[index];
    if (entry.tag === 3) return entry.value;
    if (entry.tag === 8) return pool[entry.first].text;
    throw unsupported();
  };
  for (let offset = 0; offset < code.length;) {
    const opcode = code[offset];
    const getIndex = () => (code[offset + 1] << 8) | code[offset + 2];
    if (opcode >= 0x02 && opcode <= 0x08) {
      stack.push(opcode - 0x03);
      offset += 1;
    } else if (opcode === 0x10) {
      stack.push((code[offset + 1] << 24) >> 24);
      offset += 2;
    } else if (opcode === 0x11) {
      stack.push((getIndex() << 16) >> 16);
      offset += 3;
    } else if (opcode === 0x12) {
      stack.push(getConstant(code[offset + 1]));
      offset += 2;
    } else if (opcode === 0x13) {
      stack.push(getConstant(getIndex()));
      offset += 3;
    } else if (opcode === 0x59) {
      const top = pop();
      stack.push(top, top);
      offset += 1;
    } else if (opcode === 0xb2) {
      const field = getMember(pool, getIndex());
      if (field.className !== `${VALUE_PACKAGE}BoolValue`) throw unsupported();
      if (field.name !== "ValTrue" && field.name !== "ValFalse") throw unsupported();
      stack.push({
        kind: "Identifier",
        name: field.name === "ValTrue" ? "TRUE" : "FALSE",
        location,
      });
      offset += 3;
    } else if (opcode === 0xb8) {
      const callee = getMember(pool, getIndex());
      const value = pop();
      if (callee.className !== `${VALUE_PACKAGE}IntValue` || callee.name !== "gen") {
        throw unsupported();
      }
      if (typeof value !== "number") throw unsupported();
      stack.push({ kind: "Number", value, location });
      offset += 3;
    } else if (opcode === 0xbb) {
      stack.push({ className: getClassName(pool, getIndex()), value: undefined });
      offset += 3;
    } else if (opcode === 0xb7) {
      const constructor = getMember(pool, getIndex());
      const text = pop();
      const instance = pop();
      const isStringValue =
        constructor.className === `${VALUE_PACKAGE}StringValue` &&
        constructor.name === "<init>" &&
        typeof text === "string" &&
        typeof instance === "object" &&
        "className" in instance;
      if (!isStringValue) throw unsupported();
      instance.value = { kind: "String", value: text, location };
      offset += 3;
    } else if (opcode === 0xb0) {
      const returned = pop();
      if (typeof returned !== "object") throw unsupported();
      if ("className" in returned) {
        if (!returned.value) throw unsupported();
        return returned.value;
      }
      return returned;
    } else {
      throw unsupported();
    }
  }
  throw unsupported();
};

// TLC loads a class named after each module and replaces each operator of the module that the
// root module sees with the public static method of the same name and arity. It reports whether
// each method matched an operator.
export const overrideDefinitions = (
  module: Module,
  bytes: Uint8Array | undefined,
  isRoot: boolean,
): { module: Module; overrides: JavaOverride[] } => {
  if (!bytes) return { module, overrides: [] };
  const classFile = readMethods(bytes);
  const arities = new Map(
    module.definitions
      .filter((definition) => isRoot || !definition.isLocal)
      .map((definition) => [
        definition.name,
        definition.kind === "Operator" ? definition.params.length : 0,
      ]),
  );
  const isMatched = (method: JavaMethod) => arities.get(method.name) === method.arity;
  const definitions = module.definitions.map((definition): Definition => {
    if (definition.kind !== "Operator") return definition;
    const method = classFile.methods.find(
      (candidate) => candidate.name === definition.name && isMatched(candidate),
    );
    if (!method) return definition;
    return {
      ...definition,
      body: getReturnedLiteral(method, classFile.pool, module.name, definition.location),
    };
  });
  return {
    module: { ...module, definitions },
    overrides: classFile.methods.map((method) => ({
      module: module.name,
      operator: method.name,
      signature: method.signature,
      isMatched: isMatched(method),
    })),
  };
};
