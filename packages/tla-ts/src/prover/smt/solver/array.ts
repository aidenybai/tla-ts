// Shrinking an array by setting its length takes V8's slow path, many times slower than pop.
export const shrink = <T>(values: T[], size: number) => {
  while (values.length > size) values.pop();
};

// Writing far past an array's end turns it into a dictionary in V8, which makes every access a hash
// lookup. So this fills the gap first.
export const setAt = <T>(values: (T | undefined)[], index: number, value: T | undefined) => {
  while (values.length < index) values.push(undefined);
  values[index] = value;
};

// A typed array of twice the length with the same contents.
export const grow = <
  T extends Uint8Array<ArrayBuffer> | Int32Array<ArrayBuffer> | Uint32Array<ArrayBuffer>,
>(
  array: T,
): T => {
  const grown = new (array.constructor as new (length: number) => T)(2 * array.length);
  grown.set(array);
  return grown;
};
