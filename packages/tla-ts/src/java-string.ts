export const trimJava = (text: string) => text.replace(/^[\0-\x20]+|[\0-\x20]+$/g, "");

const JAVA_DECIMAL = /^[+-]?(?:NaN|Infinity|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fFdD]?)$/;
const JAVA_HEXADECIMAL = /^([+-]?)0[xX]([0-9a-fA-F]*)(?:\.([0-9a-fA-F]*))?[pP]([+-]?\d+)[fFdD]?$/;

export const parseJavaDouble = (text: string) => {
  const trimmed = trimJava(text);
  if (JAVA_DECIMAL.test(trimmed)) return Number(trimmed.replace(/[fFdD]$/, ""));
  const hexadecimal = JAVA_HEXADECIMAL.exec(trimmed);
  if (!hexadecimal) return undefined;
  const fraction = hexadecimal[3] ?? "";
  const digits = `${hexadecimal[2]}${fraction}`;
  if (digits === "") return undefined;
  const magnitude =
    Number.parseInt(digits, 16) * 2 ** (Number(hexadecimal[4]) - 4 * fraction.length);
  return hexadecimal[1] === "-" ? -magnitude : magnitude;
};

const REPLACEMENT_CHARACTER = 0xfffd;

const CHUNK_SIZE = 8192;

const isNotContinuation = (b: number) => (b & 0xc0) !== 0x80;

const isMalformed3 = (b1: number, b2: number, b3: number) =>
  (b1 === 0xe0 && (b2 & 0xe0) === 0x80) || (b2 & 0xc0) !== 0x80 || (b3 & 0xc0) !== 0x80;

const isMalformed3_2 = (b1: number, b2: number) =>
  (b1 === 0xe0 && (b2 & 0xe0) === 0x80) || (b2 & 0xc0) !== 0x80;

const isMalformed4 = (b2: number, b3: number, b4: number) =>
  (b2 & 0xc0) !== 0x80 || (b3 & 0xc0) !== 0x80 || (b4 & 0xc0) !== 0x80;

const isMalformed4_2 = (b1: number, b2: number) =>
  (b1 === 0xf0 && (b2 < 0x90 || b2 > 0xbf)) ||
  (b1 === 0xf4 && (b2 & 0xf0) !== 0x80) ||
  (b2 & 0xc0) !== 0x80;

const isMalformed4_3 = (b3: number) => (b3 & 0xc0) !== 0x80;

const getMalformedLength = (bytes: Uint8Array, sp: number, nb: 3 | 4) => {
  const b1 = bytes[sp];
  const b2 = bytes[sp + 1];
  if (nb === 3) return (b1 === 0xe0 && (b2 & 0xe0) === 0x80) || isNotContinuation(b2) ? 1 : 2;
  if (
    b1 > 0xf4 ||
    (b1 === 0xf0 && (b2 < 0x90 || b2 > 0xbf)) ||
    (b1 === 0xf4 && (b2 & 0xf0) !== 0x80) ||
    isNotContinuation(b2)
  ) {
    return 1;
  }
  return isNotContinuation(bytes[sp + 2]) ? 2 : 3;
};

// Java's UTF-8 decoder replaces ED A0..BF, the start of an encoded surrogate, and a continuation byte after it with one U+FFFD, where TextDecoder writes one per byte.
export const decodeJavaUtf8 = (bytes: Uint8Array) => {
  const units = new Uint16Array(bytes.length);
  const sl = bytes.length;
  let sp = 0;
  let dp = 0;
  const replace = (length: number) => {
    units[dp++] = REPLACEMENT_CHARACTER;
    sp += length;
  };
  while (sp < sl) {
    const b1 = bytes[sp];
    const remaining = sl - sp;
    if (b1 < 0x80) {
      units[dp++] = b1;
      sp++;
    } else if (b1 >> 5 === 0x6 && (b1 & 0x1e) !== 0) {
      if (remaining < 2) replace(remaining);
      else if (isNotContinuation(bytes[sp + 1])) replace(1);
      else {
        units[dp++] = ((b1 & 0x1f) << 6) | (bytes[sp + 1] & 0x3f);
        sp += 2;
      }
    } else if (b1 >> 4 === 0xe) {
      if (remaining < 3) {
        replace(remaining > 1 && isMalformed3_2(b1, bytes[sp + 1]) ? 1 : remaining);
      } else {
        const b2 = bytes[sp + 1];
        const b3 = bytes[sp + 2];
        const c = ((b1 & 0xf) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
        if (isMalformed3(b1, b2, b3)) replace(getMalformedLength(bytes, sp, 3));
        else if (c >= 0xd800 && c <= 0xdfff) replace(3);
        else {
          units[dp++] = c;
          sp += 3;
        }
      }
    } else if (b1 >> 3 === 0x1e) {
      if (remaining < 4) {
        replace(
          b1 > 0xf4 || (remaining > 1 && isMalformed4_2(b1, bytes[sp + 1]))
            ? 1
            : remaining > 2 && isMalformed4_3(bytes[sp + 2])
              ? 2
              : remaining,
        );
      } else {
        const b2 = bytes[sp + 1];
        const b3 = bytes[sp + 2];
        const b4 = bytes[sp + 3];
        const uc = ((b1 & 0x7) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
        if (isMalformed4(b2, b3, b4) || uc < 0x10000 || uc > 0x10ffff) {
          replace(getMalformedLength(bytes, sp, 4));
        } else {
          units[dp++] = 0xd7c0 + (uc >> 10);
          units[dp++] = 0xdc00 + (uc & 0x3ff);
          sp += 4;
        }
      }
    } else replace(1);
  }
  let text = "";
  for (let start = 0; start < dp; start += CHUNK_SIZE) {
    text += String.fromCharCode(...units.subarray(start, Math.min(start + CHUNK_SIZE, dp)));
  }
  return text;
};
