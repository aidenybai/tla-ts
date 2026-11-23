// test262's harness/sm/non262-TypedArray-shell.js, typed so that tla-ts can compile it.
/* oxlint-disable no-var, eqeqeq, constructor-super -- the include's var declarations, loose comparisons and constructor that returns another array, kept as it writes them */

type TypedArrayConstructor = (new (...args: unknown[]) => ArrayLike<unknown> & {
  buffer: ArrayBufferLike;
  byteOffset: number;
}) & { BYTES_PER_ELEMENT: number; name: string };

interface TypedArrayShellGlobal {
  Float16Array?: TypedArrayConstructor;
  Float32Array: TypedArrayConstructor;
  Float64Array: TypedArrayConstructor;
  Object: ObjectConstructor;
  Reflect: typeof Reflect;
  SharedArrayBuffer: SharedArrayBufferConstructor;
  WeakMap: WeakMapConstructor;
  [name: string]: unknown;
}

(function (global: TypedArrayShellGlobal) {
  "use strict";

  const { Float16Array, Float32Array, Float64Array, Object, Reflect, SharedArrayBuffer, WeakMap } =
    global;
  const { apply: Reflect_apply, construct: Reflect_construct } = Reflect;
  const { get: WeakMap_prototype_get, has: WeakMap_prototype_has } = WeakMap.prototype;

  const sharedConstructors = new WeakMap<object, TypedArrayConstructor>();

  // Synthesize a constructor for a shared memory array from the constructor
  // for unshared memory. This has "good enough" fidelity for many uses. In
  // cases where it's not good enough, call isSharedConstructor for local
  // workarounds.
  function sharedConstructor(baseConstructor: TypedArrayConstructor) {
    // Create SharedTypedArray as a subclass of %TypedArray%, following the
    // built-in %TypedArray% subclasses.
    class SharedTypedArray extends (Object.getPrototypeOf(baseConstructor) as new () => object) {
      constructor(...args: unknown[]) {
        var array = Reflect_construct(baseConstructor, args) as Record<number, unknown> & {
          buffer: ArrayBufferLike;
          byteOffset: number;
          length: number;
        };
        var { buffer, byteOffset, length } = array;
        var sharedBuffer = new SharedArrayBuffer(buffer.byteLength);
        var sharedArray = Reflect_construct(
          baseConstructor,
          [sharedBuffer, byteOffset, length],
          new.target,
        ) as Record<number, unknown> & { buffer: ArrayBufferLike };
        for (var i = 0; i < length; i++) sharedArray[i] = array[i];
        assert.sameValue(sharedArray.buffer, sharedBuffer);
        // oxlint-disable-next-line no-constructor-return
        return sharedArray;
      }
    }

    // 22.2.5.1 TypedArray.BYTES_PER_ELEMENT
    Object.defineProperty(SharedTypedArray, "BYTES_PER_ELEMENT", {
      __proto__: null,
      value: baseConstructor.BYTES_PER_ELEMENT,
    } as PropertyDescriptor);

    // 22.2.6.1 TypedArray.prototype.BYTES_PER_ELEMENT
    Object.defineProperty(SharedTypedArray.prototype, "BYTES_PER_ELEMENT", {
      __proto__: null,
      value: baseConstructor.BYTES_PER_ELEMENT,
    } as PropertyDescriptor);

    // Share the same name with the base constructor to avoid calling
    // isSharedConstructor() in multiple places.
    Object.defineProperty(SharedTypedArray, "name", {
      __proto__: null,
      value: baseConstructor.name,
    } as PropertyDescriptor);

    sharedConstructors.set(SharedTypedArray, baseConstructor);

    return SharedTypedArray;
  }

  /**
   * All TypedArray constructors for unshared memory.
   */
  const typedArrayConstructors = Object.freeze(
    [
      Int8Array,
      Uint8Array,
      Uint8ClampedArray,
      Int16Array,
      Uint16Array,
      Int32Array,
      Uint32Array,
      Float32Array,
      Float64Array,
    ].concat(Float16Array ?? []),
  );

  /**
   * All TypedArray constructors for shared memory.
   */
  const sharedTypedArrayConstructors = Object.freeze(
    typeof SharedArrayBuffer === "function"
      ? typedArrayConstructors.map((constructor) =>
          sharedConstructor(constructor as TypedArrayConstructor),
        )
      : [],
  );

  /**
   * All TypedArray constructors for unshared and shared memory.
   */
  const anyTypedArrayConstructors = Object.freeze([
    ...typedArrayConstructors,
    ...sharedTypedArrayConstructors,
  ]);

  /**
   * Returns `true` if `constructor` is a TypedArray constructor for shared
   * memory.
   */
  function isSharedConstructor(constructor: unknown) {
    return Reflect_apply(WeakMap_prototype_has, sharedConstructors, [constructor]) as boolean;
  }

  /**
   * Returns `true` if `constructor` is a TypedArray constructor for shared
   * or unshared memory, with an underlying element type of one of Float16, Float32
   * or Float64.
   */
  function isFloatConstructor(constructor: unknown) {
    if (isSharedConstructor(constructor))
      constructor = Reflect_apply(WeakMap_prototype_get, sharedConstructors, [constructor]);
    return (
      constructor == Float32Array ||
      constructor == Float64Array ||
      (Float16Array && constructor == Float16Array)
    );
  }

  /**
   * Returns `true` if `constructor` is a TypedArray constructor for shared
   * or unshared memory, with an underlying element type of one of Uint8,
   * Uint8Clamped, Uint16, or Uint32.
   */
  function isUnsignedConstructor(constructor: unknown) {
    if (isSharedConstructor(constructor))
      constructor = Reflect_apply(WeakMap_prototype_get, sharedConstructors, [constructor]);
    return (
      constructor == Uint8Array ||
      constructor == Uint8ClampedArray ||
      constructor == Uint16Array ||
      constructor == Uint32Array
    );
  }

  global.typedArrayConstructors = typedArrayConstructors;
  global.sharedTypedArrayConstructors = sharedTypedArrayConstructors;
  global.anyTypedArrayConstructors = anyTypedArrayConstructors;
  global.isSharedConstructor = isSharedConstructor;
  global.isFloatConstructor = isFloatConstructor;
  global.isUnsignedConstructor = isUnsignedConstructor;
})(this as unknown as TypedArrayShellGlobal);
