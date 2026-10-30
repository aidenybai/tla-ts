// MD5 (RFC 1321) of a string's UTF-8 bytes, as OCaml's Digest computes it, in plain TypeScript so
// it runs without node:crypto.

const SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const CONSTANTS = Array.from(
  { length: 64 },
  (_value, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0,
);

export const getMd5Hex = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  const paddedLength = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, (bytes.length * 8) >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bytes.length / 2 ** 29), true);
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  const words = new Uint32Array(16);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index++)
      words[index] = view.getUint32(offset + index * 4, true);
    let [first, second, third, fourth] = state;
    for (let round = 0; round < 64; round++) {
      const quarter = round >> 4;
      const mixed =
        quarter === 0
          ? (second & third) | (~second & fourth)
          : quarter === 1
            ? (fourth & second) | (~fourth & third)
            : quarter === 2
              ? second ^ third ^ fourth
              : third ^ (second | ~fourth);
      const wordIndex =
        quarter === 0
          ? round
          : quarter === 1
            ? (5 * round + 1) % 16
            : quarter === 2
              ? (3 * round + 5) % 16
              : (7 * round) % 16;
      const sum = (first + mixed + CONSTANTS[round] + words[wordIndex]) | 0;
      const shift = SHIFTS[round];
      first = fourth;
      fourth = third;
      third = second;
      second = (second + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
    }
    state[0] = (state[0] + first) | 0;
    state[1] = (state[1] + second) | 0;
    state[2] = (state[2] + third) | 0;
    state[3] = (state[3] + fourth) | 0;
  }
  return state
    .map((word) =>
      [0, 8, 16, 24].map((bits) => ((word >>> bits) & 0xff).toString(16).padStart(2, "0")).join(""),
    )
    .join("");
};
