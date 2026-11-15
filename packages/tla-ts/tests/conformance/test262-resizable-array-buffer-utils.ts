// test262's harness/resizableArrayBufferUtils.js, typed so that tla-ts can compile it. The original
// makes its subclasses with Function, so that a parse without classes doesn't fail, and compares
// BigInt64Array to a string, which always differs. A test calls only some of its functions.
/* oxlint-disable no-unused-vars */

type ResizableTypedArrayConstructor =
  | Float64ArrayConstructor
  | Float32ArrayConstructor
  | Float16ArrayConstructor
  | Int32ArrayConstructor
  | Int16ArrayConstructor
  | Int8ArrayConstructor
  | Uint32ArrayConstructor
  | Uint16ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

class MyUint8Array extends Uint8Array {}
class MyFloat32Array extends Float32Array {}
class MyBigInt64Array extends BigInt64Array {}

const builtinCtors: ResizableTypedArrayConstructor[] = [
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
  Float32Array,
  Float64Array,
  Uint8ClampedArray,
];

if (typeof Float16Array !== "undefined") {
  builtinCtors.push(Float16Array);
}

if (typeof BigUint64Array !== "undefined") {
  builtinCtors.push(BigUint64Array);
}

if (typeof BigInt64Array !== "undefined") {
  builtinCtors.push(BigInt64Array);
}

const floatCtors: ResizableTypedArrayConstructor[] = [Float32Array, Float64Array, MyFloat32Array];

if (typeof Float16Array !== "undefined") {
  floatCtors.push(Float16Array);
}

const ctors = builtinCtors.concat(MyUint8Array, MyFloat32Array);

if (typeof MyBigInt64Array !== "undefined") {
  ctors.push(MyBigInt64Array);
}

function CreateResizableArrayBuffer(byteLength: number, maxByteLength: number) {
  return new ArrayBuffer(byteLength, { maxByteLength: maxByteLength });
}

function Convert(item: unknown) {
  if (typeof item === "bigint") {
    return Number(item);
  }
  return item;
}

function ToNumbers(array: ArrayLike<unknown>) {
  let result: unknown[] = [];
  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    result.push(Convert(item));
  }
  return result;
}

// A typed array of either kind takes what this gives, which JavaScript doesn't type.
// oxlint-disable-next-line typescript/no-explicit-any
function MayNeedBigInt(ta: unknown, n: number): any {
  assert.sameValue(typeof n, "number");
  if (ta instanceof BigInt64Array || ta instanceof BigUint64Array) {
    return BigInt(n);
  }
  return n;
}

function CreateRabForTest(ctor: ResizableTypedArrayConstructor) {
  const rab = CreateResizableArrayBuffer(4 * ctor.BYTES_PER_ELEMENT, 8 * ctor.BYTES_PER_ELEMENT);
  // Write some data into the array.
  const taWrite = new ctor(rab);
  for (let i = 0; i < 4; ++i) {
    taWrite[i] = MayNeedBigInt(taWrite, 2 * i);
  }
  return rab;
}

function CollectValuesAndResize(
  n: unknown,
  values: unknown[],
  rab: ArrayBuffer,
  resizeAfter: number,
  resizeTo: number,
) {
  if (typeof n === "bigint") {
    values.push(Number(n));
  } else {
    values.push(n);
  }
  if (values.length === resizeAfter) {
    rab.resize(resizeTo);
  }
  return true;
}

function TestIterationAndResize(
  iterable: Iterable<unknown>,
  expected: ArrayLike<unknown> | null,
  rab: ArrayBuffer,
  resizeAfter: number,
  newByteLength: number,
) {
  let values: unknown[] = [];
  let resized = false;
  let arrayValues = false;

  for (let value of iterable) {
    if (Array.isArray(value)) {
      arrayValues = true;
      values.push([value[0], Number(value[1])]);
    } else {
      values.push(Number(value));
    }
    if (!resized && values.length === resizeAfter) {
      rab.resize(newByteLength);
      resized = true;
    }
  }
  if (!arrayValues) {
    assert.compareArray(
      ([] as unknown[]).concat(values),
      expected,
      "TestIterationAndResize: list of iterated values",
    );
  } else {
    for (let i = 0; i < expected!.length; i++) {
      assert.compareArray(
        values[i],
        expected![i],
        "TestIterationAndResize: list of iterated lists of values",
      );
    }
  }
  assert(resized, "TestIterationAndResize: resize condition should have been hit");
}
