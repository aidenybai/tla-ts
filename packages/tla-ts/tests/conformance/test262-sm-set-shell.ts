// test262's harness/sm/non262-Set-shell.js, typed so that tla-ts can compile it.

interface SetShellGlobal {
  Array: ArrayConstructor;
  Error: ErrorConstructor;
  Object: ObjectConstructor;
  Proxy: ProxyConstructor;
  Reflect: typeof Reflect;
  Set: SetConstructor;
  [name: string]: unknown;
}

(function (global: SetShellGlobal) {
  // Save the primordial values.
  const { Array, Error, Object, Proxy, Reflect, Set } = global;

  const ArrayIsArray = Array.isArray;
  const ReflectApply = Reflect.apply;
  const ReflectDefineProperty = Reflect.defineProperty;
  const ReflectGet = Reflect.get;
  const ReflectGetPrototypeOf = Reflect.getPrototypeOf;
  const SetPrototype = Set.prototype;
  const SetPrototypeHas = SetPrototype.has;
  const SetPrototypeSize = (
    Object.getOwnPropertyDescriptor(SetPrototype, "size") as PropertyDescriptor
  ).get as () => number;
  const SetPrototypeKeys = SetPrototype.keys;
  const SetIteratorPrototypeNext = new Set().values().next;

  function assertSetContainsExactOrderedItems(actual: Set<unknown>, expected: unknown[]) {
    assert.sameValue(ReflectGetPrototypeOf(actual), SetPrototype, "actual is a native Set object");
    assert.sameValue(ArrayIsArray(expected), true, "expected is an Array object");

    assert.sameValue(ReflectApply(SetPrototypeSize, actual, []), expected.length);

    let index = 0;
    const keys = ReflectApply(SetPrototypeKeys, actual, []);

    while (true) {
      const { done, value: item } = ReflectApply(SetIteratorPrototypeNext, keys, []);
      if (done) {
        break;
      }
      assert.sameValue(item, expected[index], `Element at index ${index}:`);
      index++;
    }
  }
  global.assertSetContainsExactOrderedItems = assertSetContainsExactOrderedItems;

  class SetLike {
    #set: Set<unknown>;

    constructor(values?: Iterable<unknown>) {
      this.#set = new Set(values);
    }

    get size() {
      return ReflectApply(SetPrototypeSize, this.#set, []);
    }

    has(value: unknown) {
      return ReflectApply(SetPrototypeHas, this.#set, [value]);
    }

    keys() {
      const keys = ReflectApply(SetPrototypeKeys, this.#set, []);
      return new SetIteratorLike(keys);
    }
  }
  global.SetLike = SetLike;

  class SetIteratorLike {
    #keys: SetIterator<unknown>;

    constructor(keys: SetIterator<unknown>) {
      this.#keys = keys;
    }

    next() {
      return ReflectApply(SetIteratorPrototypeNext, this.#keys, []);
    }

    // The |return| method of the iterator protocol is never called.
    return() {
      throw new Error("Unexpected call to |return| method");
    }

    // The |throw| method of the iterator protocol is never called.
    throw() {
      throw new Error("Unexpected call to |throw| method");
    }
  }

  function LoggingProxy(obj: object, log: unknown[]) {
    assert.sameValue(ArrayIsArray(log), true);

    const handler = new Proxy(
      {
        get(t: object, pk: PropertyKey, r: unknown) {
          ReflectDefineProperty(log, log.length, {
            value: pk,
            writable: true,
            enumerable: true,
            configurable: true,
          });
          return ReflectGet(t, pk, r);
        },
      },
      {
        // A symbol key throws here, as the template literal converts it.
        get(t: object, pk: string, r: unknown) {
          ReflectDefineProperty(log, log.length, {
            value: `[[${pk}]]`,
            writable: true,
            enumerable: true,
            configurable: true,
          });
          return ReflectGet(t, pk, r);
        },
      },
    );

    return { obj, proxy: new Proxy(obj, handler) };
  }
  global.LoggingProxy = LoggingProxy;
})(this as unknown as SetShellGlobal);
