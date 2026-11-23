// As Effect keeps Error.stackTraceLimit: a constant that a call gives, where the call makes a
// property's descriptor, which is an object.
interface ErrorWithLimit {
  stackTraceLimit?: number;
}

const isLimitWritable = (): boolean => {
  const descriptor = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (descriptor === undefined) return Object.isExtensible(Error);
  return Object.hasOwn(descriptor, "writable")
    ? descriptor.writable === true
    : descriptor.set !== undefined;
};

const canWriteLimit = isLimitWritable();

export const getLimit = (): number | undefined => (Error as ErrorWithLimit).stackTraceLimit;

export const setLimit = (value: number | undefined): void => {
  if (canWriteLimit) (Error as ErrorWithLimit).stackTraceLimit = value;
};
