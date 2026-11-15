// The script checks that the namespace object refuses these writes.
// oxlint-disable no-import-assign
import * as values from "./exports";

const isSet = Reflect.set(values, "limit", 4);
const isSame = Reflect.defineProperty(values, "limit", { value: 3 });
const isChanged = Reflect.defineProperty(values, "limit", { value: 4 });
const isFrozen = Reflect.defineProperty(values, "limit", { writable: false });
const isDeleted = Reflect.deleteProperty(values, "limit");
const isOtherDeleted = Reflect.deleteProperty(values, "other");
const descriptor = Object.getOwnPropertyDescriptor(values, "local");
const seen = [
  Object.keys(values).join(),
  Object.getPrototypeOf(values) === null,
  Object.isExtensible(values),
  Object.prototype.toString.call(values),
  isSet,
  isSame,
  isChanged,
  isFrozen,
  isDeleted,
  isOtherDeleted,
  descriptor?.value,
  descriptor?.writable,
  descriptor?.enumerable,
  descriptor?.configurable,
];
const expected =
  "default,limit,local,renamed,true,false,[object Module],false,true,false,false,false,true,Test262,true,true,false";
if (seen.join() !== expected) throw new Error(seen.join());
