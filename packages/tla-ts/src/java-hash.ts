export const getJavaHashCode = (text: string): number => {
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
  }
  return hash;
};

export const getLongHash = (value: bigint) =>
  Number(BigInt.asIntN(32, value ^ (BigInt.asUintN(64, value) >> 32n)));

export const getHashMapOrder = <Key>(keys: Key[], getHashCode: (key: Key) => number) => {
  const unique = [...new Set(keys)];
  const capacity = 2 ** Math.max(4, Math.ceil(Math.log2(unique.length / 0.75)));
  return unique
    .map((key, index) => {
      const hash = getHashCode(key);
      return { key, index, bucket: (hash ^ (hash >>> 16)) & (capacity - 1) };
    })
    .sort((left, right) => left.bucket - right.bucket || left.index - right.index)
    .map((entry) => entry.key);
};
