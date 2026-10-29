// The parts of OCaml's standard library whose exact behavior steers Zenon's search.
//
// Hashtbl.hash on the values Zenon hashes: strings, and the (int, string list) pairs that Expr
// hashes. Zenon orders record fields by these hashes. Ints are 63-bit in OCaml, so an int is a
// high part in [-2^30, 2^30) and a low part in [0, 2^32).

const TWO_32 = 4294967296;
const TWO_31 = 2147483648;
const TWO_30 = 1073741824;

// A block's header with its color bits cleared: two fields and tag 0, for a pair or a list cell.
const PAIR_HEADER = 0x800;

const MEANINGFUL_LIMIT = 10;

const encoder = new TextEncoder();

const rotateLeft = (value: number, count: number) => (value << count) | (value >>> (32 - count));

const mix = (hash: number, data: number) => {
  const scrambled = Math.imul(rotateLeft(Math.imul(data, 0xcc9e2d51), 15), 0x1b873593);
  return (Math.imul(rotateLeft(hash ^ scrambled, 13), 5) + 0xe6546b64) | 0;
};

const finalMix = (hash: number) => {
  const first = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  const second = Math.imul(first ^ (first >>> 13), 0xc2b2ae35);
  return ((second ^ (second >>> 16)) >>> 0) & 0x3fffffff;
};

// A string's UTF-8 bytes as the little-endian words that caml_hash_mix_string mixes, the last one
// partial.
interface StringWords {
  words: number[];
  length: number;
}

const getStringWords = (value: string): StringWords => {
  const bytes = encoder.encode(value);
  const words: number[] = [];
  for (let index = 0; index < bytes.length; index += 4)
    words.push(
      bytes[index] |
        ((bytes[index + 1] ?? 0) << 8) |
        ((bytes[index + 2] ?? 0) << 16) |
        ((bytes[index + 3] ?? 0) << 24),
    );
  return { words, length: bytes.length };
};

const mixWords = (hash: number, encoded: StringWords) => {
  let mixed = hash;
  for (const word of encoded.words) mixed = mix(mixed, word);
  return mixed ^ encoded.length;
};

// caml_hash_mix_intnat on the tagged value 2n + 1 of the int n.
const mixInt = (hash: number, high: number, low: number) => {
  const taggedLow = (low * 2 + 1) % TWO_32;
  const taggedHigh = high * 2 + Math.floor((low * 2 + 1) / TWO_32);
  return mix(hash, (taggedHigh ^ (taggedHigh < 0 ? -1 : 0) ^ taggedLow) | 0);
};

// Hashtbl.hash on strings and on (int, string list) pairs. It keeps each string's words and hash,
// because Zenon hashes the same variable names over and over.
export const createHasher = () => {
  const stringWords = new Map<string, StringWords>();
  const stringHashes = new Map<string, number>();
  const mixString = (hash: number, value: string) => {
    const cached = stringWords.get(value);
    const encoded = cached ?? getStringWords(value);
    if (cached === undefined) stringWords.set(value, encoded);
    return mixWords(hash, encoded);
  };
  return {
    hashString: (value: string) => {
      const cached = stringHashes.get(value);
      if (cached !== undefined) return cached;
      const hash = finalMix(mixString(0, value));
      stringHashes.set(value, hash);
      return hash;
    },
    hashIntAndStrings: (high: number, low: number, strings: string[]) => {
      let hash = mixInt(mix(0, PAIR_HEADER), high, low);
      let meaningful = MEANINGFUL_LIMIT - 1;
      for (const value of strings) {
        if (meaningful === 0) return finalMix(hash);
        hash = mixString(mix(hash, PAIR_HEADER), value);
        meaningful--;
      }
      return finalMix(meaningful === 0 ? hash : mixInt(hash, 0, 0));
    },
  };
};

const wrapHigh = (value: number) => {
  const wrapped = ((value % TWO_31) + TWO_31) % TWO_31;
  return wrapped >= TWO_30 ? wrapped - TWO_31 : wrapped;
};

export interface Int63 {
  high: number;
  low: number;
}

// Expr's combine: x + y * 131 + 1, wrapping like OCaml's 63-bit ints.
export const combine = (left: Int63, right: Int63): Int63 => {
  const product = right.low * 131;
  const productCarry = Math.floor(product / TWO_32);
  const sum = left.low + (product - productCarry * TWO_32) + 1;
  const sumCarry = Math.floor(sum / TWO_32);
  return {
    high: wrapHigh(left.high + right.high * 131 + productCarry + sumCarry),
    low: sum - sumCarry * TWO_32,
  };
};

export const toInt63 = (value: number): Int63 => ({ high: 0, low: value });

// The merges of OCaml's List.stable_sort, on arrays. Each returns its result reversed, as OCaml's
// rev_merge and rev_merge_rev do.
const mergeReversed = <Item>(
  first: Item[],
  second: Item[],
  takesFirst: (left: Item, right: Item) => boolean,
) => {
  const merged: Item[] = [];
  let firstIndex = 0;
  let secondIndex = 0;
  while (firstIndex < first.length && secondIndex < second.length) {
    if (takesFirst(first[firstIndex], second[secondIndex])) merged.push(first[firstIndex++]);
    else merged.push(second[secondIndex++]);
  }
  while (firstIndex < first.length) merged.push(first[firstIndex++]);
  while (secondIndex < second.length) merged.push(second[secondIndex++]);
  return merged.reverse();
};

// OCaml's List.sort, step for step, so that a comparison that isn't a total order still gives
// Zenon's result.
export const stableSort = <Item>(items: Item[], compare: (left: Item, right: Item) => number) => {
  const sortRun = (count: number, start: number, isReversed: boolean): Item[] => {
    const isBefore = (left: Item, right: Item) =>
      isReversed ? compare(left, right) > 0 : compare(left, right) <= 0;
    if (count === 2) {
      const first = items[start];
      const second = items[start + 1];
      return isBefore(first, second) ? [first, second] : [second, first];
    }
    if (count === 3) {
      const first = items[start];
      const second = items[start + 1];
      const third = items[start + 2];
      if (isBefore(first, second)) {
        if (isBefore(second, third)) return [first, second, third];
        return isBefore(first, third) ? [first, third, second] : [third, first, second];
      }
      if (isBefore(first, third)) return [second, first, third];
      return isBefore(second, third) ? [second, third, first] : [third, second, first];
    }
    const firstCount = count >> 1;
    const left = sortRun(firstCount, start, !isReversed);
    const right = sortRun(count - firstCount, start + firstCount, !isReversed);
    return isReversed
      ? mergeReversed(left, right, (first, second) => compare(first, second) <= 0)
      : mergeReversed(left, right, (first, second) => compare(first, second) > 0);
  };
  return items.length < 2 ? [...items] : sortRun(items.length, 0, false);
};
