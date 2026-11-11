// test262's harness/testTypedArray.js, typed so that tla-ts can compile it. A test calls only some
// of its functions.
/* oxlint-disable no-unused-vars */

type TypedArrayConstructor =
  | Float64ArrayConstructor
  | Float32ArrayConstructor
  | Float16ArrayConstructor
  | Int32ArrayConstructor
  | Int16ArrayConstructor
  | Int8ArrayConstructor
  | Uint32ArrayConstructor
  | Uint16ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor;

type AnyTypedArrayConstructor =
  | TypedArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

type ArgFactory = (TA: AnyTypedArrayConstructor, primitiveOrIterable: unknown) => unknown;

// A test passes what a factory gives to a typed array's constructor, which JavaScript doesn't type.
// oxlint-disable-next-line typescript/no-explicit-any
type BoundArgFactory = (primitiveOrIterable: unknown) => any;

type TypedArrayTest<C> = (TA: C, makeCtorArg: BoundArgFactory) => void;

interface Indexed {
  [index: number]: unknown;
  length: number;
}

// 2 ** 53, past which a test's number maps to no typed array's contents. TLC's numbers are
// integers of 32 bits, so any that's finite is below it.
const MAX_LENGTH = Infinity;

function isPrimitive(value: unknown) {
  return !value || (typeof value !== "object" && typeof value !== "function");
}

let floatArrayConstructors: TypedArrayConstructor[] = [Float64Array, Float32Array];

const nonClampedIntArrayConstructors: TypedArrayConstructor[] = [
  Int32Array,
  Int16Array,
  Int8Array,
  Uint32Array,
  Uint16Array,
  Uint8Array,
];

const intArrayConstructors = nonClampedIntArrayConstructors.concat([Uint8ClampedArray]);

if (typeof Float16Array !== "undefined") {
  floatArrayConstructors.push(Float16Array);
}

let bigIntArrayConstructors: AnyTypedArrayConstructor[] = [];
if (typeof BigInt64Array !== "undefined") {
  bigIntArrayConstructors.push(BigInt64Array);
}
if (typeof BigUint64Array !== "undefined") {
  bigIntArrayConstructors.push(BigUint64Array);
}

const typedArrayConstructors = floatArrayConstructors.concat(intArrayConstructors);

const allTypedArrayConstructors: AnyTypedArrayConstructor[] = [
  ...typedArrayConstructors,
  ...bigIntArrayConstructors,
];

// %TypedArray%, whose prototype holds the methods of Int8Array's.
const TypedArray: Int8ArrayConstructor = Object.getPrototypeOf(Int8Array);

function makePassthrough(TA: AnyTypedArrayConstructor, primitiveOrIterable: unknown) {
  return primitiveOrIterable;
}

// Array.from of a length's array-like with a function that gives "0", and of an iterable, as a
// loop and a spread.
function makeArray(TA: AnyTypedArrayConstructor, primitiveOrIterable: unknown) {
  if (isPrimitive(primitiveOrIterable)) {
    const n = Number(primitiveOrIterable);
    if (!(n >= 0 && n < MAX_LENGTH)) return primitiveOrIterable;
    let zeros: string[] = [];
    for (let i = 0; i < n; i++) zeros = [...zeros, "0"];
    return zeros;
  }
  return [...(primitiveOrIterable as unknown[])];
}

function makeArrayLike(TA: AnyTypedArrayConstructor, primitiveOrIterable: unknown) {
  const arr = makeArray(TA, primitiveOrIterable);
  if (isPrimitive(arr)) return arr;
  const elements = arr as unknown[];
  const obj: Indexed = { length: elements.length };
  for (let i = 0; i < obj.length; i++) obj[i] = elements[i];
  return obj;
}

// makeIterable's object gives the array's own iterator from a closure over the array. tla-ts holds
// no closure as a value, so the object holds the array, and its iterator reads the array's
// elements as an array's iterator does.
interface ArrayValues {
  src: unknown[];
  index: number;
  next: (this: ArrayValues) => IteratorResult<unknown>;
}

interface ArrayIterable {
  src: unknown[];
  [Symbol.iterator]: (this: ArrayIterable) => ArrayValues;
}

function stepArrayValues(this: ArrayValues): IteratorResult<unknown> {
  if (this.index < this.src.length) {
    const value = this.src[this.index];
    this.index += 1;
    return { value, done: false };
  }
  return { value: undefined, done: true };
}

function openArrayValues(this: ArrayIterable): ArrayValues {
  return { src: this.src, index: 0, next: stepArrayValues };
}

let makeIterable: ArgFactory | undefined;
if (typeof Symbol !== "undefined" && Symbol.iterator) {
  makeIterable = function makeIterable(TA: AnyTypedArrayConstructor, primitiveOrIterable: unknown) {
    const src = makeArray(TA, primitiveOrIterable);
    if (isPrimitive(src)) return src;
    const obj: ArrayIterable = { src: src as unknown[], [Symbol.iterator]: openArrayValues };
    return obj;
  };
}

function makeArrayBuffer(TA: AnyTypedArrayConstructor, primitiveOrIterable: unknown) {
  const arr = makeArray(TA, primitiveOrIterable);
  if (isPrimitive(arr)) return arr;
  return new TA(arr as never).buffer;
}

let makeResizableArrayBuffer: ArgFactory | undefined;
let makeGrownArrayBuffer: ArgFactory | undefined;
let makeShrunkArrayBuffer: ArgFactory | undefined;
let makeImmutableArrayBuffer: ArgFactory | undefined;

if (typeof ArrayBuffer.prototype.resize === "function") {
  const copyIntoArrayBuffer = function (destBuffer: ArrayBuffer, srcBuffer: ArrayBuffer) {
    const destView = new Uint8Array(destBuffer);
    const srcView = new Uint8Array(srcBuffer);
    for (let i = 0; i < srcView.length; i++) destView[i] = srcView[i];
    return destBuffer;
  };

  makeResizableArrayBuffer = function makeResizableArrayBuffer(
    TA: AnyTypedArrayConstructor,
    primitiveOrIterable: unknown,
  ) {
    if (isPrimitive(primitiveOrIterable)) {
      const n = Number(primitiveOrIterable) * TA.BYTES_PER_ELEMENT;
      if (!(n >= 0 && n < MAX_LENGTH)) return primitiveOrIterable;
      return new ArrayBuffer(n, { maxByteLength: n * 2 });
    }
    const fixed = makeArrayBuffer(TA, primitiveOrIterable) as ArrayBuffer;
    const byteLength = fixed.byteLength;
    const resizable = new ArrayBuffer(byteLength, { maxByteLength: byteLength * 2 });
    return copyIntoArrayBuffer(resizable, fixed);
  };

  makeGrownArrayBuffer = function makeGrownArrayBuffer(
    TA: AnyTypedArrayConstructor,
    primitiveOrIterable: unknown,
  ) {
    if (isPrimitive(primitiveOrIterable)) {
      const n = Number(primitiveOrIterable) * TA.BYTES_PER_ELEMENT;
      if (!(n >= 0 && n < MAX_LENGTH)) return primitiveOrIterable;
      const grown = new ArrayBuffer(Math.floor(n / 2), { maxByteLength: n });
      grown.resize(n);
    }
    const fixed = makeArrayBuffer(TA, primitiveOrIterable) as ArrayBuffer;
    const byteLength = fixed.byteLength;
    const grown = new ArrayBuffer(Math.floor(byteLength / 2), { maxByteLength: byteLength });
    grown.resize(byteLength);
    return copyIntoArrayBuffer(grown, fixed);
  };

  makeShrunkArrayBuffer = function makeShrunkArrayBuffer(
    TA: AnyTypedArrayConstructor,
    primitiveOrIterable: unknown,
  ) {
    if (isPrimitive(primitiveOrIterable)) {
      const n = Number(primitiveOrIterable) * TA.BYTES_PER_ELEMENT;
      if (!(n >= 0 && n < MAX_LENGTH)) return primitiveOrIterable;
      const shrunk = new ArrayBuffer(n * 2, { maxByteLength: n * 2 });
      shrunk.resize(n);
    }
    const fixed = makeArrayBuffer(TA, primitiveOrIterable) as ArrayBuffer;
    const byteLength = fixed.byteLength;
    const shrunk = new ArrayBuffer(byteLength * 2, { maxByteLength: byteLength * 2 });
    copyIntoArrayBuffer(shrunk, fixed);
    shrunk.resize(byteLength);
    return shrunk;
  };
}

if ("transferToImmutable" in ArrayBuffer.prototype) {
  makeImmutableArrayBuffer = function makeImmutableArrayBuffer(
    TA: AnyTypedArrayConstructor,
    primitiveOrIterable: unknown,
  ) {
    throw new Test262Error("tla-ts has no immutable ArrayBuffer");
  };
}

let typedArrayCtorArgFactories: ArgFactory[] = [makePassthrough, makeArray, makeArrayLike];
if (makeIterable) typedArrayCtorArgFactories.push(makeIterable);
typedArrayCtorArgFactories.push(makeArrayBuffer);
if (makeResizableArrayBuffer) typedArrayCtorArgFactories.push(makeResizableArrayBuffer);
if (makeGrownArrayBuffer) typedArrayCtorArgFactories.push(makeGrownArrayBuffer);
if (makeShrunkArrayBuffer) typedArrayCtorArgFactories.push(makeShrunkArrayBuffer);
if (makeImmutableArrayBuffer) typedArrayCtorArgFactories.push(makeImmutableArrayBuffer);

function ctorArgFactoryMatchesSome(argFactory: unknown, features: string[]) {
  for (let i = 0; i < features.length; ++i) {
    switch (features[i]) {
      case "passthrough":
        if (argFactory === makePassthrough) return true;
        break;
      case "arraylike":
        if (argFactory === makeArray || argFactory === makeArrayLike) return true;
        break;
      case "iterable":
        if (argFactory === makeIterable) return true;
        break;
      case "arraybuffer":
        if (
          argFactory === makeArrayBuffer ||
          argFactory === makeResizableArrayBuffer ||
          argFactory === makeGrownArrayBuffer ||
          argFactory === makeShrunkArrayBuffer ||
          argFactory === makeImmutableArrayBuffer
        ) {
          return true;
        }
        break;
      case "resizable":
        if (
          argFactory === makeResizableArrayBuffer ||
          argFactory === makeGrownArrayBuffer ||
          argFactory === makeShrunkArrayBuffer
        ) {
          return true;
        }
        break;
      case "immutable":
        if (argFactory === makeImmutableArrayBuffer) return true;
        break;
      default:
        throw new Test262Error("unknown feature: " + features[i]);
    }
  }
  return false;
}

function testWithAllTypedArrayConstructors<C extends AnyTypedArrayConstructor>(
  f: TypedArrayTest<C>,
  constructors?: C[] | null,
  includeArgFactories?: string[] | null,
  excludeArgFactories?: string[] | null,
) {
  const ctors = constructors || (allTypedArrayConstructors as C[]);
  // A copy, which tla-ts needs where a variable may hold an array that changes in place. The
  // function changes only arrays that it makes.
  let ctorArgFactories = typedArrayCtorArgFactories.slice();
  if (includeArgFactories) {
    ctorArgFactories = [];
    for (let i = 0; i < typedArrayCtorArgFactories.length; ++i) {
      if (ctorArgFactoryMatchesSome(typedArrayCtorArgFactories[i], includeArgFactories)) {
        ctorArgFactories.push(typedArrayCtorArgFactories[i]);
      }
    }
  }
  if (excludeArgFactories) {
    // The loop that splices out each factory that matches, which tla-ts runs as a filter.
    const excluded = excludeArgFactories;
    ctorArgFactories = ctorArgFactories.filter(
      (argFactory) => !ctorArgFactoryMatchesSome(argFactory, excluded),
    );
  }
  if (ctorArgFactories.length === 0) {
    throw new Test262Error(
      "no arg factories match include " +
        (includeArgFactories
          ? includeArgFactories.join()
          : includeArgFactories === null
            ? "null"
            : "undefined") +
        " and exclude " +
        (excludeArgFactories
          ? excludeArgFactories.join()
          : excludeArgFactories === null
            ? "null"
            : "undefined"),
    );
  }
  for (let k = 0; k < ctorArgFactories.length; ++k) {
    const argFactory = ctorArgFactories[k];
    for (let i = 0; i < ctors.length; ++i) {
      const constructor = ctors[i];
      // argFactory.bind(undefined, constructor), which tla-ts binds only where it knows the function.
      f(constructor, function (primitiveOrIterable: unknown) {
        return argFactory(constructor, primitiveOrIterable);
      });
    }
  }
}

function testWithTypedArrayConstructors(
  f: TypedArrayTest<TypedArrayConstructor>,
  constructors?: TypedArrayConstructor[] | null,
  includeArgFactories?: string[] | null,
  excludeArgFactories?: string[] | null,
) {
  const ctors = constructors || typedArrayConstructors;
  testWithAllTypedArrayConstructors(f, ctors, includeArgFactories, excludeArgFactories);
}

function testWithBigIntTypedArrayConstructors(
  f: TypedArrayTest<BigInt64ArrayConstructor | BigUint64ArrayConstructor>,
  constructors?: (BigInt64ArrayConstructor | BigUint64ArrayConstructor)[] | null,
  includeArgFactories?: string[] | null,
  excludeArgFactories?: string[] | null,
) {
  const ctors = constructors || [BigInt64Array, BigUint64Array];
  testWithAllTypedArrayConstructors(f, ctors, includeArgFactories, excludeArgFactories);
}

const nonAtomicsFriendlyTypedArrayConstructors = floatArrayConstructors.concat([Uint8ClampedArray]);

function testWithNonAtomicsFriendlyTypedArrayConstructors(
  f: TypedArrayTest<TypedArrayConstructor>,
  includeArgFactories?: string[] | null,
  excludeArgFactories?: string[] | null,
) {
  testWithAllTypedArrayConstructors(
    f,
    nonAtomicsFriendlyTypedArrayConstructors,
    includeArgFactories,
    excludeArgFactories,
  );
}

function testWithAtomicsFriendlyTypedArrayConstructors(
  f: TypedArrayTest<TypedArrayConstructor>,
  includeArgFactories?: string[] | null,
  excludeArgFactories?: string[] | null,
) {
  testWithAllTypedArrayConstructors(
    f,
    [Int32Array, Int16Array, Int8Array, Uint32Array, Uint16Array, Uint8Array],
    includeArgFactories,
    excludeArgFactories,
  );
}

function isFloatTypedArrayConstructor(arg: unknown) {
  return floatArrayConstructors.indexOf(arg as TypedArrayConstructor) !== -1;
}

interface ByteConversionValues {
  values: unknown[];
  expected: { [name: string]: unknown[] };
}

function testTypedArrayConversions(
  byteConversionValues: ByteConversionValues,
  fn: (TA: TypedArrayConstructor, value: unknown, exp: unknown, initial: number) => void,
) {
  const values = byteConversionValues.values;
  const expected = byteConversionValues.expected;
  testWithTypedArrayConstructors(
    function (TA) {
      const name = TA.name.slice(0, -5);
      return values.forEach(function (value, index) {
        const exp = expected[name][index];
        let initial = 0;
        if (exp === 0) {
          initial = 1;
        }
        fn(TA, value, exp, initial);
      });
    },
    null,
    ["passthrough"],
  );
}

function floatTypedArrayConstructorPrecision(FA: TypedArrayConstructor) {
  if (typeof Float16Array !== "undefined" && FA === Float16Array) {
    return "half";
  } else if (FA === Float32Array) {
    return "single";
  } else if (FA === Float64Array) {
    return "double";
  } else {
    throw new Error(
      "Malformed test - floatTypedArrayConstructorPrecision called with non-float TypedArray",
    );
  }
}
