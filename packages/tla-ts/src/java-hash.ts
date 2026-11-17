export const getJavaHashCode = (text: string): number => {
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
  }
  return hash;
};

const getHashMapHash = (text: string) => {
  const hash = getJavaHashCode(text);
  return hash ^ (hash >>> 16);
};

export const getHashMapOrder = (names: string[]) => {
  const unique = [...new Set(names)];
  const capacity = 2 ** Math.max(4, Math.ceil(Math.log2(unique.length / 0.75)));
  return unique
    .map((name, index) => ({ name, index, bucket: getHashMapHash(name) & (capacity - 1) }))
    .sort((left, right) => left.bucket - right.bucket || left.index - right.index)
    .map((entry) => entry.name);
};
