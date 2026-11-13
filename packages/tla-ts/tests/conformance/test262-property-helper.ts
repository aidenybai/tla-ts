// test262's harness/propertyHelper.js, typed so that tla-ts can compile it. A test calls only some
// of its functions.
/* oxlint-disable no-unused-vars */

interface Properties {
  [key: PropertyKey]: unknown;
}

interface VerifyOptions {
  label?: string;
  restore?: boolean;
}

function verifyProperty(
  obj: object,
  name: PropertyKey,
  desc: PropertyDescriptor | undefined,
  options?: VerifyOptions,
) {
  const label =
    options === undefined || options.label === undefined || options.label === ""
      ? String(name)
      : options.label;
  const originalDesc = Object.getOwnPropertyDescriptor(obj, name);
  if (desc === undefined) {
    assert.sameValue(originalDesc, undefined, label + " descriptor should be undefined");
    return true;
  }
  assert(Object.prototype.hasOwnProperty.call(obj, name), label + " should be an own property");
  const names = Object.getOwnPropertyNames(desc);
  for (let i = 0; i < names.length; i++) {
    assert(
      names[i] === "value" ||
        names[i] === "writable" ||
        names[i] === "enumerable" ||
        names[i] === "configurable" ||
        names[i] === "get" ||
        names[i] === "set",
      "Invalid descriptor field: " + names[i],
    );
  }
  let failures: string[] = [];
  if (Object.prototype.hasOwnProperty.call(desc, "value")) {
    if (!isSameValue(desc.value, originalDesc!.value)) {
      failures.push(label + " descriptor value should be " + String(desc.value));
    }
    if (!isSameValue(desc.value, (obj as Properties)[name])) {
      failures.push(label + " value should be " + String(desc.value));
    }
  }
  if (Object.prototype.hasOwnProperty.call(desc, "enumerable") && desc.enumerable !== undefined) {
    if (
      desc.enumerable !== originalDesc!.enumerable ||
      desc.enumerable !== isEnumerable(obj, name)
    ) {
      failures.push(
        label + " descriptor should " + (desc.enumerable ? "" : "not ") + "be enumerable",
      );
    }
  }
  // tla-ts changes objects only in statements, so isWritable and isConfigurable run as their
  // own statements, where propertyHelper.js calls them as the right side of an ||.
  if (Object.prototype.hasOwnProperty.call(desc, "writable") && desc.writable !== undefined) {
    let isFailed = desc.writable !== originalDesc!.writable;
    if (!isFailed) {
      const writable = isWritable(obj, name);
      isFailed = desc.writable !== writable;
    }
    if (isFailed) {
      failures.push(label + " descriptor should " + (desc.writable ? "" : "not ") + "be writable");
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(desc, "configurable") &&
    desc.configurable !== undefined
  ) {
    let isFailed = desc.configurable !== originalDesc!.configurable;
    if (!isFailed) {
      const configurable = isConfigurable(obj, name);
      isFailed = desc.configurable !== configurable;
    }
    if (isFailed) {
      failures.push(
        label + " descriptor should " + (desc.configurable ? "" : "not ") + "be configurable",
      );
    }
  }
  if (failures.length > 0) {
    assert(false, failures.join("; "));
  }
  if (options !== undefined && options.restore === true) {
    Object.defineProperty(obj, name, originalDesc!);
  }
  return true;
}

function isConfigurable(obj: object, name: PropertyKey) {
  try {
    delete (obj as Properties)[name];
  } catch (e) {
    if (!(e instanceof TypeError)) {
      throw new Test262Error("Expected TypeError, got " + String(e));
    }
  }
  return !Object.prototype.hasOwnProperty.call(obj, name);
}

// for-in visits every own enumerable key, so propertyHelper.js's for-in that looks for name
// agrees with propertyIsEnumerable, and a function that computes a value can't loop.
function isEnumerable(obj: object, name: PropertyKey) {
  return (
    Object.prototype.hasOwnProperty.call(obj, name) &&
    Object.prototype.propertyIsEnumerable.call(obj, name)
  );
}

function isSameValue(a: unknown, b: unknown) {
  return Object.is(a, b);
}

// propertyHelper.js tells whether a caller gave value by arguments.length, which only
// verifyWritable does.
function isWritable(obj: object, name: PropertyKey, verifyProp?: string | null, value?: unknown) {
  const properties = obj as Properties;
  // propertyHelper.js writes 2 ** 32 - 1 to an array's length, which TLC's integers can't hold,
  // and tla-ts can't read an array's properties by name, so it never verifies one.
  const unlikelyValue = "unlikelyValue";
  const hadValue = Object.prototype.hasOwnProperty.call(obj, name);
  const oldValue = properties[name];
  const newValue =
    value === undefined && unlikelyValue === oldValue
      ? String(unlikelyValue) + "2"
      : value === undefined || value === null || value === false || value === 0 || value === ""
        ? unlikelyValue
        : value;
  try {
    properties[name] = newValue;
  } catch (e) {
    if (!(e instanceof TypeError)) {
      throw new Test262Error("Expected TypeError, got " + String(e));
    }
  }
  const writeSucceeded = isSameValue(
    properties[
      verifyProp === undefined || verifyProp === null || verifyProp === "" ? name : verifyProp
    ],
    newValue,
  );
  if (writeSucceeded) {
    if (hadValue) {
      properties[name] = oldValue;
    } else {
      delete properties[name];
    }
  }
  return writeSucceeded;
}

function verifyEqualTo(obj: object, name: PropertyKey, value: unknown) {
  if (!isSameValue((obj as Properties)[name], value)) {
    throw new Test262Error(
      "Expected obj[" +
        String(name) +
        "] to equal " +
        String(value) +
        ", actually " +
        String((obj as Properties)[name]),
    );
  }
}

function verifyWritable(
  obj: object,
  name: PropertyKey,
  verifyProp?: string | null,
  value?: unknown,
) {
  if (verifyProp === undefined || verifyProp === null || verifyProp === "") {
    assert(
      Object.getOwnPropertyDescriptor(obj, name)!.writable,
      "Expected obj[" + String(name) + "] to have writable:true.",
    );
  }
  const writable = isWritable(obj, name, verifyProp, value);
  if (!writable) {
    throw new Test262Error("Expected obj[" + String(name) + "] to be writable, but was not.");
  }
}

// propertyHelper.js takes a value here too, which it doesn't use.
function verifyNotWritable(
  obj: object,
  name: PropertyKey,
  verifyProp?: string | null,
  value?: unknown,
) {
  if (verifyProp === undefined || verifyProp === null || verifyProp === "") {
    assert(
      Object.getOwnPropertyDescriptor(obj, name)!.writable !== true,
      "Expected obj[" + String(name) + "] to have writable:false.",
    );
  }
  const writable = isWritable(obj, name, verifyProp);
  if (writable) {
    throw new Test262Error("Expected obj[" + String(name) + "] NOT to be writable, but was.");
  }
}

function verifyEnumerable(obj: object, name: PropertyKey) {
  assert(
    Object.getOwnPropertyDescriptor(obj, name)!.enumerable,
    "Expected obj[" + String(name) + "] to have enumerable:true.",
  );
  if (!isEnumerable(obj, name)) {
    throw new Test262Error("Expected obj[" + String(name) + "] to be enumerable, but was not.");
  }
}

function verifyNotEnumerable(obj: object, name: PropertyKey) {
  assert(
    Object.getOwnPropertyDescriptor(obj, name)!.enumerable !== true,
    "Expected obj[" + String(name) + "] to have enumerable:false.",
  );
  if (isEnumerable(obj, name)) {
    throw new Test262Error("Expected obj[" + String(name) + "] NOT to be enumerable, but was.");
  }
}

function verifyConfigurable(obj: object, name: PropertyKey) {
  assert(
    Object.getOwnPropertyDescriptor(obj, name)!.configurable,
    "Expected obj[" + String(name) + "] to have configurable:true.",
  );
  const configurable = isConfigurable(obj, name);
  if (!configurable) {
    throw new Test262Error("Expected obj[" + String(name) + "] to be configurable, but was not.");
  }
}

function verifyNotConfigurable(obj: object, name: PropertyKey) {
  assert(
    Object.getOwnPropertyDescriptor(obj, name)!.configurable !== true,
    "Expected obj[" + String(name) + "] to have configurable:false.",
  );
  const configurable = isConfigurable(obj, name);
  if (configurable) {
    throw new Test262Error("Expected obj[" + String(name) + "] NOT to be configurable, but was.");
  }
}

function verifyPrimordialProperty(
  obj: object,
  name: PropertyKey,
  desc: PropertyDescriptor | undefined,
  options?: VerifyOptions,
) {
  verifyProperty(obj, name, desc, options);
  return true;
}
