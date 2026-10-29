// MD5 (RFC 1321), as OCaml's Digest computes it. tlapm names the operators it coalesces by
// the digest of their printed form, so matching its SMT-LIB output needs the same digest.
const SHIFTS = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

const CONSTANTS = Array.from({ length: 64 }, (_value, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32),
);

const rotate = (value: number, count: number) => (value << count) | (value >>> (32 - count));

export const getMd5 = (text: string): string => {
  const message = new TextEncoder().encode(text);
  const length = Math.ceil((message.length + 9) / 64) * 64;
  const bytes = new Uint8Array(length);
  bytes.set(message);
  bytes[message.length] = 0x80;
  const view = new DataView(bytes.buffer);
  view.setUint32(length - 8, (message.length * 8) >>> 0, true);
  view.setUint32(length - 4, Math.floor(message.length / 2 ** 29), true);
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let offset = 0; offset < length; offset += 64) {
    const words = Array.from({ length: 16 }, (_value, index) =>
      view.getUint32(offset + index * 4, true),
    );
    const [a, b, c, d] = Array.from({ length: 64 }).reduce<number[]>(
      ([innerA, innerB, innerC, innerD], _value, index) => {
        const round = Math.floor(index / 16);
        const mixed =
          round === 0
            ? (innerB & innerC) | (~innerB & innerD)
            : round === 1
              ? (innerD & innerB) | (~innerD & innerC)
              : round === 2
                ? innerB ^ innerC ^ innerD
                : innerC ^ (innerB | ~innerD);
        const word =
          round === 0
            ? index
            : round === 1
              ? (5 * index + 1) % 16
              : round === 2
                ? (3 * index + 5) % 16
                : (7 * index) % 16;
        const sum = (innerA + mixed + CONSTANTS[index] + words[word]) | 0;
        return [
          innerD,
          (innerB + rotate(sum, SHIFTS[round * 4 + (index % 4)])) | 0,
          innerB,
          innerC,
        ];
      },
      state,
    );
    state.splice(
      0,
      4,
      (state[0] + a) | 0,
      (state[1] + b) | 0,
      (state[2] + c) | 0,
      (state[3] + d) | 0,
    );
  }
  return state
    .flatMap((word) => [word, word >>> 8, word >>> 16, word >>> 24])
    .map((byte) => (byte & 0xff).toString(16).padStart(2, "0"))
    .join("");
};
