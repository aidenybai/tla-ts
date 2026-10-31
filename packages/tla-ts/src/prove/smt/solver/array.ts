// Shrinking an array by setting its length takes V8's slow path, many times slower than pop.
export const shrink = <T>(values: T[], size: number) => {
  while (values.length > size) values.pop();
};
