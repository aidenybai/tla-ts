import {
  getStringRank,
  isFunctionValue,
  isModelValue,
  toFiniteFunction,
  toFiniteSet,
  type ModelValue,
  type Value,
} from "../values";

// TLC's FP64.Polys, the irreducible polynomials that -fp picks from.
const POLYNOMIALS = [
  0x911498ae0e66bad6n,
  0xda8a0ba66dae0181n,
  0xc02f176b8f268d9fn,
  0xd617bb1220fc7812n,
  0xc6fd951ad34f9f74n,
  0xdd1897bd991704d4n,
  0xf5394c541cbfd343n,
  0xb1dded37b5c7b8f7n,
  0xb713ff61039dc632n,
  0xdfb340cb2fb03d43n,
  0xbc3e7e4c5ecb76a3n,
  0xdbb4b1349cd7058an,
  0xf53e9dcb9e915cdfn,
  0xca5f58e90dd01848n,
  0x80e7ff4406891aa1n,
  0xab541bf881fa8571n,
  0xbf274e07ac5499d5n,
  0x939b1ea933040a4en,
  0xb791a595448d75b1n,
  0x8bf88d6ef85563a2n,
  0xecb33ec339513a53n,
  0xfa2d3e722db5208an,
  0xb4e2058aac479d24n,
  0xafbd6474e7213b82n,
  0x98c1694d14ffaeefn,
  0xe188fb5c0a125e24n,
  0xfa71cc3865487d80n,
  0x891135f7c1c94569n,
  0xcf77cdd16d22e3e6n,
  0xeb5e3a1d2e2bb4b5n,
  0x92f7f5b69cd00c55n,
  0xa9fbbe40ca3b9ae9n,
  0x84a7b33d85295bden,
  0xebd4680dbb6fdee2n,
  0xa31fc46a0583b4d0n,
  0xa792c94f15de3e49n,
  0xd9d60a9feff4521an,
  0x9227ba31dfdda04bn,
  0xfb4c89c607ce162dn,
  0xa89b3b2e01479cc0n,
  0xb35a0c2a28b89f7dn,
  0x91d0b700b99d9ec2n,
  0xf0646bbda05020b0n,
  0xcb5d5f63ce043056n,
  0xd276b6a04f42a1b8n,
  0xbc1a7a7dbfeb47a3n,
  0xe138acff7a963036n,
  0xed860223c1557ee7n,
  0x9b2491e980150ab6n,
  0xe7e03dd8a5b4e59en,
  0xaaa3f5eac516783cn,
  0xfe78cc267a724180n,
  0xc22519a21edfac64n,
  0xcdb2941933fec60fn,
  0xc5f485551ef38aa1n,
  0xa19293d250bd3335n,
  0xa4d4c215a50b7afen,
  0xc1155176406a5070n,
  0xecadaa8200e123ecn,
  0xbacfe629d58b2f08n,
  0xded991082148cb42n,
  0x9a0ccbe5deaa88dbn,
  0x9a83246f342061bbn,
  0xb71482842297ab05n,
  0xf2407eeb997592bdn,
  0xb7b43d4b5c4c4bccn,
  0xb339a2568221ffe7n,
  0xdb4b6b379446ef9en,
  0xe43c205bb5c0b2b6n,
  0xe8e1d141f19d6db0n,
  0xd19e8710a4ea1c86n,
  0x9704cecfa8d6d07bn,
  0xb0a35716162c3f26n,
  0xa2a68c0cf56390acn,
  0xe4a74bc601c95b46n,
  0xe668fff675595e56n,
  0xe0ea77ebe06fabbbn,
  0xa8bb94f585279523n,
  0xbeb667b42b684f21n,
  0xd7b65410189e28afn,
  0x85722037beffc5b9n,
  0xe7e7c5f773426204n,
  0xa5fd0cc8e060c6f4n,
  0xb8f91ee9065dcf95n,
  0xb4047008040f8b50n,
  0xecb9ab6291c8cfccn,
  0xe08bb9b70caad6dfn,
  0xd6e086a301d95d56n,
  0xf6a808f5f3fb9da3n,
  0xfa74b8a8ef86fbc5n,
  0xa0b6b33ba9e6381cn,
  0x8c78703427873dbbn,
  0xc5516ea423011021n,
  0xb075cce8528ae7e2n,
  0x92e4a37979e2b13bn,
  0xafc9ab000ed81026n,
  0xf1873f2a861a518an,
  0xf885d6b35770192cn,
  0xd2a82f27f71f5f7en,
  0xd5e7a4dd8beb2d9fn,
  0xbab9e7e65dc23e0fn,
  0xd5fc877c0bdf5b85n,
  0xab428169b9f31c02n,
  0xb7b1351f9266d3ean,
  0xfad564914328f635n,
  0x9623ecb1000db9bdn,
  0x88d371ec6644c892n,
  0xd0a71270573e271cn,
  0xbd200d763f9d81b4n,
  0x8484fd96374bf2ean,
  0xe0d0810749432294n,
  0x8ebe9dadc88658ban,
  0xf6268c58993ae542n,
  0xd6cc88fed0d359c9n,
  0xbcaddb8d40a16690n,
  0x92817c6db421cbf6n,
  0xac63721120a371b5n,
  0xd6cc137fdced0820n,
  0xf1c5fbaebb617bd7n,
  0xac35d78c765237a5n,
  0xbd0a471fa9a23116n,
  0x943a7031b946a5aen,
  0xe4e83520cb1aaebbn,
  0xe92a4b73246dd124n,
  0xafc1e070787c4c86n,
  0xdfe84d42cf06286bn,
  0x8b29ec962e4b964bn,
  0x807eb5de812ede0fn,
  0xa3cd71299c8b3bfdn,
  0x845b8031ef886f35n,
  0x91f5a5fa9c5515a5n,
];

let selectedPolynomial = POLYNOMIALS[0];

export const getFingerprintPolynomial = () => selectedPolynomial;

const SLICE_HIGH_0 = new Int32Array(256);
const SLICE_HIGH_1 = new Int32Array(256);
const SLICE_HIGH_2 = new Int32Array(256);
const SLICE_HIGH_3 = new Int32Array(256);
const SLICE_LOW_0 = new Int32Array(256);
const SLICE_LOW_1 = new Int32Array(256);
const SLICE_LOW_2 = new Int32Array(256);
const SLICE_LOW_3 = new Int32Array(256);
let initialHigh = 0;
let initialLow = 0;
let high = 0;
let low = 0;

const extendByte = (byte: number) => {
  const index = (byte ^ low) & 0xff;
  low = ((low >>> 8) | (high << 24)) ^ SLICE_LOW_0[index];
  high = (high >>> 8) ^ SLICE_HIGH_0[index];
};

export const setFingerprintPolynomial = (index: number) => {
  const polynomial = POLYNOMIALS[index];
  selectedPolynomial = polynomial;
  const powers: bigint[] = [];
  for (let power = 1n << 63n; powers.length < 72;) {
    powers.push(power);
    power = (power >> 1n) ^ ((power & 1n) === 0n ? 0n : polynomial);
  }
  const bytePowers = powers.slice(64, 72).reverse();
  for (let byte = 0; byte < 256; byte++) {
    const entry = bytePowers.reduce(
      (value, power, bit) => ((byte >> bit) & 1 ? value ^ power : value),
      0n,
    );
    SLICE_HIGH_0[byte] = Number(BigInt.asIntN(32, entry >> 32n));
    SLICE_LOW_0[byte] = Number(BigInt.asIntN(32, entry));
  }
  const highs = [SLICE_HIGH_0, SLICE_HIGH_1, SLICE_HIGH_2, SLICE_HIGH_3];
  const lows = [SLICE_LOW_0, SLICE_LOW_1, SLICE_LOW_2, SLICE_LOW_3];
  for (let zeros = 1; zeros < 4; zeros++) {
    const previousHigh = highs[zeros - 1];
    const previousLow = lows[zeros - 1];
    for (let byte = 0; byte < 256; byte++) {
      const index = previousLow[byte] & 0xff;
      lows[zeros][byte] =
        ((previousLow[byte] >>> 8) | (previousHigh[byte] << 24)) ^ SLICE_LOW_0[index];
      highs[zeros][byte] = (previousHigh[byte] >>> 8) ^ SLICE_HIGH_0[index];
    }
  }
  initialHigh = Number(BigInt.asIntN(32, polynomial >> 32n));
  initialLow = Number(BigInt.asIntN(32, polynomial));
};

setFingerprintPolynomial(0);

const extendInt = (word: number) => {
  const mixed = low ^ word;
  const first = mixed & 0xff;
  const second = (mixed >>> 8) & 0xff;
  const third = (mixed >>> 16) & 0xff;
  const fourth = mixed >>> 24;
  low = high ^ SLICE_LOW_3[first] ^ SLICE_LOW_2[second] ^ SLICE_LOW_1[third] ^ SLICE_LOW_0[fourth];
  high = SLICE_HIGH_3[first] ^ SLICE_HIGH_2[second] ^ SLICE_HIGH_1[third] ^ SLICE_HIGH_0[fourth];
};

const BOOL_VALUE = 0;
const INT_VALUE = 1;
const STRING_VALUE = 3;
const SET_ENUM_VALUE = 5;
const FCN_RCD_VALUE = 9;
const MODEL_VALUE = 21;

const extendScalar = (value: boolean | number | string | ModelValue) => {
  if (typeof value === "boolean") {
    extendByte(BOOL_VALUE);
    extendByte(value ? 116 : 102);
    return 2;
  }
  if (typeof value === "number") {
    extendByte(INT_VALUE);
    extendInt(value);
    return 5;
  }
  if (typeof value === "string") {
    extendByte(STRING_VALUE);
    extendInt(value.length);
    const whole = value.length & ~3;
    for (let index = 0; index < whole; index += 4) {
      extendInt(
        (value.charCodeAt(index) & 0xff) |
          ((value.charCodeAt(index + 1) & 0xff) << 8) |
          ((value.charCodeAt(index + 2) & 0xff) << 16) |
          ((value.charCodeAt(index + 3) & 0xff) << 24),
      );
    }
    for (let index = whole; index < value.length; index++) extendByte(value.charCodeAt(index));
    return 5 + value.length;
  }
  extendByte(MODEL_VALUE);
  extendInt(getStringRank(value.name) + 1);
  return 5;
};

const extendValue = (value: Value) => {
  if (typeof value !== "object" || isModelValue(value)) {
    extendScalar(value);
  } else if (isFunctionValue(value)) {
    const functionValue = toFiniteFunction(value);
    extendByte(FCN_RCD_VALUE);
    extendInt(functionValue.domain.length);
    for (let index = 0; index < functionValue.domain.length; index++) {
      extendValue(functionValue.domain[index]);
      extendValue(functionValue.range[index]);
    }
  } else {
    const elements = toFiniteSet(value).elements;
    extendByte(SET_ENUM_VALUE);
    extendInt(elements.length);
    for (const element of elements) extendValue(element);
  }
};

export const getTlcFingerprint = (state: Value[]) => {
  const outerHigh = high;
  const outerLow = low;
  high = initialHigh;
  low = initialLow;
  for (const value of state) extendValue(value);
  const fingerprint = (BigInt(high >>> 0) << 32n) | BigInt(low >>> 0);
  high = outerHigh;
  low = outerLow;
  return fingerprint;
};

export const getTlcFingerprints = (states: Value[][], order: number[]) => {
  const fingerprints = new BigInt64Array(states.length);
  const words = new Int32Array(fingerprints.buffer);
  const outerHigh = high;
  const outerLow = low;
  states.forEach((state, position) => {
    high = initialHigh;
    low = initialLow;
    for (const index of order) extendValue(state[index]);
    words[2 * position] = low;
    words[2 * position + 1] = high;
  });
  high = outerHigh;
  low = outerLow;
  return fingerprints;
};
