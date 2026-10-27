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
  code: Uint8Array | undefined;
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
    u1: () => view.getUint8(advance(1)),
    u2: () => view.getUint16(advance(2)),
    u4: () => view.getUint32(advance(4)),
    i4: () => view.getInt32(advance(4)),
    bytes: (length: number) => bytes.subarray(advance(length), cursor.offset),
  };
};

const getParameterCount = (descriptor: string) => {
  const parameters = descriptor.slice(1, descriptor.indexOf(")"));
  return [...parameters.matchAll(/\[*(?:L[^;]*;|[BCDFIJSZ])/g)].length;
};

// The public static methods of a class file and their bytecode, as java.lang.Class lists them.
const readMethods = (bytes: Uint8Array) => {
  const reader = createReader(bytes);
  if (reader.u4() !== CLASS_MAGIC)
    throw new TlaSyntaxError("A module override is not a class file");
  reader.u2();
  reader.u2();
  const pool: PoolEntry[] = [];
  const count = reader.u2();
  const decoder = new TextDecoder();
  for (let index = 1; index < count; index++) {
    const tag = reader.u1();
    const entry = { tag, text: "", value: 0, first: 0, second: 0 };
    pool[index] = entry;
    if (tag === 1) entry.text = decoder.decode(reader.bytes(reader.u2()));
    else if (tag === 3) entry.value = reader.i4();
    else if (tag === 4) reader.u4();
    else if (tag === 5 || tag === 6) {
      reader.bytes(8);
      index++;
    } else if (tag === 7 || tag === 8 || tag === 16 || tag === 19 || tag === 20) {
      entry.first = reader.u2();
    } else if (tag === 15) {
      reader.u1();
      entry.first = reader.u2();
    } else {
      entry.first = reader.u2();
      entry.second = reader.u2();
    }
  }
  reader.u2();
  reader.u2();
  reader.u2();
  reader.bytes(reader.u2() * 2);
  for (let fields = reader.u2(); fields > 0; fields--) {
    reader.bytes(6);
    for (let attributes = reader.u2(); attributes > 0; attributes--) {
      reader.u2();
      reader.bytes(reader.u4());
    }
  }
  const methods: JavaMethod[] = [];
  for (let remaining = reader.u2(); remaining > 0; remaining--) {
    const access = reader.u2();
    const name = pool[reader.u2()].text;
    const descriptor = pool[reader.u2()].text;
    const method: JavaMethod = { name, arity: getParameterCount(descriptor), code: undefined };
    for (let attributes = reader.u2(); attributes > 0; attributes--) {
      const attributeName = pool[reader.u2()].text;
      const attribute = reader.bytes(reader.u4());
      if (attributeName === "Code") {
        const length = new DataView(attribute.buffer, attribute.byteOffset + 4, 4).getUint32(0);
        method.code = attribute.subarray(8, 8 + length);
      }
    }
    const isOverride = (access & ACCESS_PUBLIC) !== 0 && (access & ACCESS_STATIC) !== 0;
    if (isOverride) methods.push(method);
  }
  return { pool, methods };
};

const getMember = (pool: PoolEntry[], index: number) => {
  const reference = pool[index];
  const nameAndType = pool[reference.second];
  return {
    className: pool[pool[reference.first].first].text,
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
      stack.push({ className: pool[pool[getIndex()].first].text, value: undefined });
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

const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : -1;

// TLC loads a class named after each module and replaces every operator the module defines
// with the public static method of the same name and arity.
export const overrideDefinitions = (module: Module, bytes: Uint8Array | undefined): Module => {
  if (!bytes) return module;
  const { pool, methods } = readMethods(bytes);
  const definitions = module.definitions.map((definition): Definition => {
    const method = methods.find(
      (candidate) => candidate.name === definition.name && candidate.arity === getArity(definition),
    );
    if (!method || definition.kind !== "Operator") return definition;
    return {
      ...definition,
      body: getReturnedLiteral(method, pool, module.name, definition.location),
    };
  });
  return { ...module, definitions };
};
