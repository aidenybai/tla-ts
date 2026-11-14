export interface Lazy {
  apply: (key: number) => number;
}

const doubled: number[] = [];

export const makeLazy = (offset: number): Lazy => ({ apply: (key) => key + offset });

export const getDoubled = (key: number) => {
  const cached = doubled[key];
  if (cached !== undefined) return cached;
  doubled[key] = key * 2;
  return key * 2;
};

export const applyAll = (lazy: Lazy, keys: number[]) => keys.map((key) => lazy.apply(key));
