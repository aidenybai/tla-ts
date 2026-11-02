// OCaml's Marshal format, ported from runtime/intern.c and runtime/extern.c, for the values in
// tlapm's fingerprints file. It writes no sharing, which OCaml reads the same.

import { TlaProofError } from "../../errors";

interface OcamlBlock {
  tag: number;
  fields: OcamlValue[];
}

interface OcamlFloat {
  float: number;
}

export type OcamlValue = number | string | OcamlBlock | OcamlFloat;

const MAGIC_NUMBER_SMALL = 0x8495a6be;

const CODE = {
  int8: 0x0,
  int16: 0x1,
  int32: 0x2,
  shared8: 0x4,
  shared16: 0x5,
  shared32: 0x6,
  block32: 0x8,
  string8: 0x9,
  string32: 0xa,
  doubleLittle: 0xc,
};

const PREFIX = { smallInt: 0x40, smallString: 0x20, smallBlock: 0x80 };

const HEADER_SIZE = 20;

export const block = (tag: number, ...fields: OcamlValue[]): OcamlBlock => ({ tag, fields });

export const isBlock = (value: OcamlValue): value is OcamlBlock =>
  typeof value === "object" && "tag" in value;

// Returns the value marshaled at offset, and where the next one starts.
export const readMarshaled = (bytes: Uint8Array, offset: number) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < offset + HEADER_SIZE || view.getUint32(offset) !== MAGIC_NUMBER_SMALL)
    throw new TlaProofError("corrupted fingerprint file");
  const end = offset + HEADER_SIZE + view.getUint32(offset + 4);
  const objects: OcamlValue[] = [];
  const state = { position: offset + HEADER_SIZE };
  const take = (length: number) => {
    const start = state.position;
    state.position += length;
    if (state.position > end) throw new TlaProofError("corrupted fingerprint file");
    return start;
  };
  const decoder = new TextDecoder();
  const readString = (length: number) => {
    const start = take(length);
    const value = decoder.decode(bytes.subarray(start, start + length));
    objects.push(value);
    return value;
  };
  const readBlock = (tag: number, size: number): OcamlBlock => {
    const value = block(tag);
    if (size > 0) objects.push(value);
    for (let index = 0; index < size; index++) value.fields.push(read());
    return value;
  };
  const readShared = (distance: number) => objects[objects.length - distance];
  const read = (): OcamlValue => {
    const code = bytes[take(1)];
    if (code >= PREFIX.smallBlock) return readBlock(code & 0xf, (code >> 4) & 0x7);
    if (code >= PREFIX.smallInt) return code & 0x3f;
    if (code >= PREFIX.smallString) return readString(code & 0x1f);
    switch (code) {
      case CODE.int8:
        return view.getInt8(take(1));
      case CODE.int16:
        return view.getInt16(take(2));
      case CODE.int32:
        return view.getInt32(take(4));
      case CODE.shared8:
        return readShared(view.getUint8(take(1)));
      case CODE.shared16:
        return readShared(view.getUint16(take(2)));
      case CODE.shared32:
        return readShared(view.getUint32(take(4)));
      case CODE.block32: {
        const header = view.getUint32(take(4));
        return readBlock(header & 0xff, header >>> 10);
      }
      case CODE.string8:
        return readString(view.getUint8(take(1)));
      case CODE.string32:
        return readString(view.getUint32(take(4)));
      case CODE.doubleLittle: {
        const value = { float: view.getFloat64(take(8), true) };
        objects.push(value);
        return value;
      }
    }
    throw new TlaProofError("corrupted fingerprint file");
  };
  return { value: read(), next: end };
};

export const writeMarshaled = (value: OcamlValue) => {
  const bytes: number[] = [];
  const sizes = { objects: 0, words32: 0, words64: 0 };
  const pushInteger = (integer: number, length: number) => {
    for (let shift = (length - 1) * 8; shift >= 0; shift -= 8)
      bytes.push((integer >>> shift) & 0xff);
  };
  const encoder = new TextEncoder();
  const write = (inner: OcamlValue) => {
    if (typeof inner === "number") {
      if (inner >= 0 && inner < 0x40) return bytes.push(PREFIX.smallInt + inner);
      if (inner >= -0x80 && inner < 0x80) return bytes.push(CODE.int8, inner & 0xff);
      if (inner >= -0x8000 && inner < 0x8000) {
        bytes.push(CODE.int16);
        return pushInteger(inner, 2);
      }
      bytes.push(CODE.int32);
      return pushInteger(inner, 4);
    }
    sizes.objects++;
    if (typeof inner === "string") {
      const encoded = encoder.encode(inner);
      if (encoded.length < 0x20) bytes.push(PREFIX.smallString + encoded.length);
      else if (encoded.length < 0x100) bytes.push(CODE.string8, encoded.length);
      else {
        bytes.push(CODE.string32);
        pushInteger(encoded.length, 4);
      }
      bytes.push(...encoded);
      sizes.words32 += 1 + Math.floor((encoded.length + 4) / 4);
      sizes.words64 += 1 + Math.floor((encoded.length + 8) / 8);
      return;
    }
    if (!isBlock(inner)) {
      const float = new DataView(new ArrayBuffer(8));
      float.setFloat64(0, inner.float, true);
      bytes.push(CODE.doubleLittle, ...new Uint8Array(float.buffer));
      sizes.words32 += 3;
      sizes.words64 += 2;
      return;
    }
    const size = inner.fields.length;
    if (size === 0) sizes.objects--;
    else {
      sizes.words32 += 1 + size;
      sizes.words64 += 1 + size;
    }
    if (inner.tag < 16 && size < 8) bytes.push(PREFIX.smallBlock + inner.tag + (size << 4));
    else {
      bytes.push(CODE.block32);
      pushInteger(size * 1024 + inner.tag, 4);
    }
    inner.fields.forEach(write);
  };
  write(value);
  const header = new DataView(new ArrayBuffer(HEADER_SIZE));
  [MAGIC_NUMBER_SMALL, bytes.length, sizes.objects, sizes.words32, sizes.words64].forEach(
    (field, index) => header.setUint32(index * 4, field),
  );
  return new Uint8Array([...new Uint8Array(header.buffer), ...bytes]);
};
