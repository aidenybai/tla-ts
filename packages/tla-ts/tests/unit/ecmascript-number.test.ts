import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const ECMASCRIPT_DIRECTORY = join(import.meta.dirname, "../../ecmascript");

const CHECKS_PER_ASSUME = 100;

interface NumberCheck {
  name: string;
  actual: string;
  expected: string;
}

const encodeBigNat = (value: bigint) => {
  const limbs: bigint[] = [];
  for (let rest = value; rest > 0n; rest >>= 15n) limbs.push(rest & 32767n);
  return `<<${limbs.join(", ")}>>`;
};

const encodeInteger = (value: number) =>
  value === -(2 ** 31) ? "(-2147483647 - 1)" : `(${value})`;

const encodeRecord = (
  kind: string,
  isNegative: boolean,
  integer: number,
  mantissa: bigint,
  exponent: number,
) =>
  `[k |-> "${kind}", neg |-> ${isNegative ? "TRUE" : "FALSE"}, i |-> ${encodeInteger(integer)}, m |-> ${encodeBigNat(mantissa)}, e |-> ${exponent}]`;

// The canonical record of a Number, read from its IEEE 754 bits.
const encodeNumber = (value: number) => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const bits = view.getBigUint64(0);
  const isNegative = bits >> 63n === 1n;
  const biasedExponent = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  if (biasedExponent === 0x7ff) {
    return fraction === 0n
      ? encodeRecord("inf", isNegative, 0, 0n, 0)
      : encodeRecord("nan", false, 0, 0n, 0);
  }
  if (Object.is(value, -0)) return encodeRecord("nzero", true, 0, 0n, 0);
  if (Number.isInteger(value) && Math.abs(value) < 2 ** 30) {
    return encodeRecord("int", value < 0, value, 0n, 0);
  }
  const significand = biasedExponent === 0 ? fraction : fraction | (1n << 52n);
  const zeros = significand.toString(2).length - significand.toString(2).replace(/0+$/, "").length;
  return encodeRecord(
    "fin",
    isNegative,
    0,
    significand >> BigInt(zeros),
    Math.max(biasedExponent, 1) - 1075 + zeros,
  );
};

const encodeString = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

const encodeLessThan = (left: number, right: number) =>
  Number.isNaN(left) || Number.isNaN(right) ? '"undefined"' : `${left < right}`.toUpperCase();

// mulberry32, so the generated values are the same on every run.
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    const mixed = Math.imul(state ^ (state >>> 15), state | 1);
    const remixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)) ^ mixed;
    return (remixed ^ (remixed >>> 14)) >>> 0;
  };
};

// The Number nearest a positive numerator / denominator, ties to even, subnormals included.
const roundQuotient = (numerator: bigint, denominator: bigint) => {
  const magnitude = numerator.toString(2).length - denominator.toString(2).length;
  // The quotient in units of 2 ** shift has at least 54 bits, or reaches 2 ** -1076 if smaller.
  const shift = Math.max(magnitude - 55, -1076);
  const scaledNumerator = shift < 0 ? numerator << BigInt(-shift) : numerator;
  const scaledDenominator = shift > 0 ? denominator << BigInt(shift) : denominator;
  const quotient = scaledNumerator / scaledDenominator;
  const isExact = quotient * scaledDenominator === scaledNumerator;
  const dropped = Math.max(quotient.toString(2).length - 53, -1074 - shift);
  const kept = quotient >> BigInt(dropped);
  const rest = quotient - (kept << BigInt(dropped));
  const half = 1n << BigInt(dropped - 1);
  const isRoundedUp = rest > half || (rest === half && (!isExact || kept % 2n === 1n));
  return Number(kept + (isRoundedUp ? 1n : 0n)) * 2 ** (shift + dropped);
};

// The correctly rounded base ** exponent for a finite base and a small integral exponent, which
// V8 computes with the platform's pow: Linux gives 10 ** 23 as 1.0000000000000001e23.
const getExactPower = (base: number, exponent: number) => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, Math.abs(base));
  const bits = view.getBigUint64(0);
  const biasedExponent = Number(bits >> 52n);
  const significand = (bits & ((1n << 52n) - 1n)) | (biasedExponent === 0 ? 0n : 1n << 52n);
  const binaryExponent = Math.max(biasedExponent, 1) - 1075;
  const numerator = significand << BigInt(Math.max(binaryExponent, 0));
  const denominator = 1n << BigInt(Math.max(-binaryExponent, 0));
  const power = BigInt(Math.abs(exponent));
  const magnitude =
    exponent >= 0
      ? roundQuotient(numerator ** power, denominator ** power)
      : roundQuotient(denominator ** power, numerator ** power);
  return base < 0 && exponent % 2 !== 0 ? -magnitude : magnitude;
};

const random = createRandom(262);

const getRandomDouble = () => {
  const view = new DataView(new ArrayBuffer(8));
  view.setUint32(0, random());
  view.setUint32(4, random());
  return view.getFloat64(0);
};

const getRandomModerateDouble = () =>
  ((random() - 2 ** 31) / 2 ** (random() % 32)) * 2 ** ((random() % 40) - 20);

const getRandomDecimal = () => (random() % 2000000) / 10 ** (random() % 9) - 1000;

const SPECIAL_VALUES = [
  0,
  -0,
  NaN,
  Infinity,
  -Infinity,
  1,
  -1,
  2,
  3,
  -7,
  10,
  0.5,
  -0.5,
  1.5,
  2.5,
  -2.5,
  0.1,
  0.2,
  0.3,
  1 / 3,
  -2 / 3,
  255.5,
  Number.MAX_VALUE,
  -Number.MAX_VALUE,
  Number.MIN_VALUE,
  -Number.MIN_VALUE,
  Number.EPSILON,
  2 ** -1022,
  2 ** -1022 - 2 ** -1074,
  2 ** 53,
  2 ** 53 - 1,
  -(2 ** 53 + 2),
  2 ** 30,
  2 ** 30 - 1,
  -(2 ** 30),
  -(2 ** 30) + 1,
  2 ** 31,
  2 ** 31 - 1,
  -(2 ** 31),
  2 ** 32 - 1,
  2 ** 32 + 1,
  -4294967297.75,
  32767,
  32768,
  -32768,
  65535,
  1e21,
  1e-7,
  1.5e-7,
  123456789.125,
  1e308,
  2 ** 1023,
  2 ** -1074 * 3,
  2 ** 100,
];

const RANDOM_VALUES = [
  ...Array.from({ length: 24 }, getRandomDouble),
  ...Array.from({ length: 24 }, getRandomModerateDouble),
  ...Array.from({ length: 16 }, getRandomDecimal),
];

const VALUES = [...SPECIAL_VALUES, ...RANDOM_VALUES];

const PAIR_VALUES = [
  ...SPECIAL_VALUES.slice(0, 28),
  ...RANDOM_VALUES.filter((_, index) => index % 4 === 0),
];

const PAIRS = PAIR_VALUES.flatMap((left) => PAIR_VALUES.map((right) => [left, right] as const));

const loadModule = (name: string) => {
  const path = join(ECMASCRIPT_DIRECTORY, `${name}.tla`);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

// Evaluates every check in one module and returns the names of those that fail.
const getFailures = async (checks: NumberCheck[]) => {
  const assumptions = Array.from(
    { length: Math.ceil(checks.length / CHECKS_PER_ASSUME) },
    (_, index) =>
      `ASSUME PrintT(<<${checks
        .slice(index * CHECKS_PER_ASSUME, (index + 1) * CHECKS_PER_ASSUME)
        .map((innerCheck) => `${innerCheck.actual} = ${innerCheck.expected}`)
        .join(",\n")}>>)`,
  );
  const printed: string[] = [];
  const result = await check({
    source: `---- MODULE NumberChecks ----\nEXTENDS ESNumber, TLC\n${assumptions.join("\n")}\n====`,
    config: "",
    loadModule,
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("success");
  const outcomes = printed.join("\n").match(/TRUE|FALSE/g) ?? [];
  expect(outcomes).toHaveLength(checks.length);
  return checks
    .filter((_, index) => outcomes[index] === "FALSE")
    .map((innerCheck) => innerCheck.name);
};

const createUnaryChecks = (
  operator: string,
  getExpected: (value: number) => string,
  values: number[] = VALUES,
) =>
  values.map((value) => ({
    name: `${operator}(${Object.is(value, -0) ? "-0" : value})`,
    actual: `${operator}(${encodeNumber(value)})`,
    expected: getExpected(value),
  }));

const createBinaryChecks = (
  operator: string,
  getExpected: (left: number, right: number) => string,
  pairs: (readonly [number, number])[] = PAIRS,
) =>
  pairs.map(([left, right]) => ({
    name: `${operator}(${Object.is(left, -0) ? "-0" : left}, ${Object.is(right, -0) ? "-0" : right})`,
    actual: `${operator}(${encodeNumber(left)}, ${encodeNumber(right)})`,
    expected: getExpected(left, right),
  }));

// The host is the reference, so the checks need Node 24 or later, whose V8 rounds ** correctly and
// has Math.f16round. Each check evaluates hundreds of Numbers in TLA+, which takes seconds on CI.
describe("ESNumber matches JavaScript's Number semantics", { timeout: 60_000 }, () => {
  it("encodes constants and integers in the canonical form", async () => {
    const failures = await getFailures([
      { name: "NaN", actual: "NaN", expected: encodeNumber(NaN) },
      { name: "PosInf", actual: "PosInf", expected: encodeNumber(Infinity) },
      { name: "NegInf", actual: "NegInf", expected: encodeNumber(-Infinity) },
      { name: "PosZero", actual: "PosZero", expected: encodeNumber(0) },
      { name: "NegZero", actual: "NegZero", expected: encodeNumber(-0) },
      ...[
        0,
        1,
        -1,
        2 ** 30 - 1,
        -(2 ** 30) + 1,
        2 ** 30,
        -(2 ** 30),
        2 ** 31 - 1,
        -(2 ** 31),
        3 << 28,
      ].map((value) => ({
        name: `NumFromInt(${value})`,
        actual: `NumFromInt(${encodeInteger(value)})`,
        expected: encodeNumber(value),
      })),
    ]);
    expect(failures).toEqual([]);
  });

  it.each<[string, (left: number, right: number) => string]>([
    ["NumAdd", (left, right) => encodeNumber(left + right)],
    ["NumSubtract", (left, right) => encodeNumber(left - right)],
    ["NumMultiply", (left, right) => encodeNumber(left * right)],
    ["NumDivide", (left, right) => encodeNumber(left / right)],
    ["NumRemainder", (left, right) => encodeNumber(left % right)],
    ["NumLessThan", encodeLessThan],
    ["NumEqual", (left, right) => `${left === right}`.toUpperCase()],
    ["NumSameValue", (left, right) => `${Object.is(left, right)}`.toUpperCase()],
    [
      "NumSameValueZero",
      (left, right) =>
        `${left === right || (Number.isNaN(left) && Number.isNaN(right))}`.toUpperCase(),
    ],
    ["MathMin2", (left, right) => encodeNumber(Math.min(left, right))],
    ["MathMax2", (left, right) => encodeNumber(Math.max(left, right))],
    ["NumLeftShift", (left, right) => encodeNumber(left << right)],
    ["NumSignedRightShift", (left, right) => encodeNumber(left >> right)],
    ["NumUnsignedRightShift", (left, right) => encodeNumber(left >>> right)],
    ["NumBitwiseAND", (left, right) => encodeNumber(left & right)],
    ["NumBitwiseOR", (left, right) => encodeNumber(left | right)],
    ["NumBitwiseXOR", (left, right) => encodeNumber(left ^ right)],
  ])("computes %s", async (operator, getExpected) => {
    expect(await getFailures(createBinaryChecks(operator, getExpected))).toEqual([]);
  });

  it("converts to integers", async () => {
    const failures = await getFailures([
      ...createUnaryChecks("NumBitwiseNOT", (value) => encodeNumber(~value)),
      ...createUnaryChecks("NumToInt32", (value) => encodeInteger(value | 0)),
      ...createUnaryChecks("NumFitsInt", (value) =>
        `${Number.isInteger(value) && value >= -(2 ** 31) && value < 2 ** 31}`.toUpperCase(),
      ),
      ...createUnaryChecks(
        "NumToInt",
        (value) => encodeInteger(value + 0),
        VALUES.filter((value) => Number.isInteger(value) && value >= -(2 ** 31) && value < 2 ** 31),
      ),
      ...createUnaryChecks("NumToUint32", (value) => encodeNumber(value >>> 0)),
      ...createUnaryChecks("NumToUint16", (value) => encodeInteger(Uint16Array.of(value)[0])),
      ...createUnaryChecks("NumToInt16", (value) => encodeInteger(Int16Array.of(value)[0])),
      ...createUnaryChecks("NumToUint8", (value) => encodeInteger(Uint8Array.of(value)[0])),
      ...createUnaryChecks("NumToInt8", (value) => encodeInteger(Int8Array.of(value)[0])),
      ...createUnaryChecks("NumToUint8Clamp", (value) =>
        encodeInteger(Uint8ClampedArray.of(value)[0]),
      ),
      ...createUnaryChecks("NumToIntegerOrInfinity", (value) =>
        encodeNumber(Number.isNaN(value) ? 0 : Math.trunc(value) + 0),
      ),
      ...createUnaryChecks("NumToLength", (value) =>
        encodeNumber(
          Math.min(Math.max(Number.isNaN(value) ? 0 : Math.trunc(value), 0), 2 ** 53 - 1),
        ),
      ),
    ]);
    expect(failures).toEqual([]);
  });

  it("computes Math functions", async () => {
    const failures = await getFailures([
      ...createUnaryChecks("NumUnaryMinus", (value) => encodeNumber(-value)),
      ...createUnaryChecks("MathAbs", (value) => encodeNumber(Math.abs(value))),
      ...createUnaryChecks("MathSign", (value) => encodeNumber(Math.sign(value))),
      ...createUnaryChecks("MathFloor", (value) => encodeNumber(Math.floor(value))),
      ...createUnaryChecks("MathCeil", (value) => encodeNumber(Math.ceil(value))),
      ...createUnaryChecks("MathTrunc", (value) => encodeNumber(Math.trunc(value))),
      ...createUnaryChecks("MathRound", (value) => encodeNumber(Math.round(value))),
      ...createUnaryChecks("MathFround", (value) => encodeNumber(Math.fround(value))),
      ...createUnaryChecks("MathSqrt", (value) => encodeNumber(Math.sqrt(value))),
    ]);
    expect(failures).toEqual([]);
  });

  it("takes the minimum and maximum of sequences", async () => {
    const sequences = [
      [],
      [1],
      [3, -1, 2],
      [0, -0],
      [-0, 0],
      [1, NaN, -Infinity],
      VALUES.slice(0, 40),
    ];
    const failures = await getFailures(
      sequences.flatMap((numbers) =>
        (["MathMin", "MathMax"] as const).map((operator) => ({
          name: `${operator}(${numbers.join(", ")})`,
          actual: `${operator}(<<${numbers.map(encodeNumber).join(", ")}>>)`,
          expected: encodeNumber(Math[operator === "MathMin" ? "min" : "max"](...numbers)),
        })),
      ),
    );
    expect(failures).toEqual([]);
  });

  it("converts to strings in radix 10", async () => {
    const failures = await getFailures(
      createUnaryChecks("NumToString", (value) => encodeString(String(value)), [
        ...VALUES,
        1e-6,
        1e-7,
        123e-20,
        1e20,
        123456789012345680000,
        5e-324,
        1.7976931348623157e308,
        2 ** 53 + 4,
        0.000001234,
        2 ** -1022,
        2 ** 52,
        2 ** 63,
        -1e100,
      ]),
    );
    expect(failures).toEqual([]);
  });

  it.each([2, 3, 7, 16, 36])("converts to strings in radix %i", async (radix) => {
    const failures = await getFailures(
      VALUES.map((value) => ({
        name: `NumToStringRadix(${value}, ${radix})`,
        actual: `NumToStringRadix(${encodeNumber(value)}, ${radix})`,
        expected: encodeString(value.toString(radix)),
      })),
    );
    expect(failures).toEqual([]);
  });

  it("converts strings to Numbers", async () => {
    const strings = [
      ...VALUES.map(String),
      "",
      "   ",
      " 12 ",
      "\t\n\v\f\r 42\u00a0\u1680\u2000\u200a\u2028\u2029\u202f\u205f\u3000\ufeff",
      "\u180e1",
      "\u200b1",
      "+0",
      "-0",
      "-0.0e-5",
      "Infinity",
      "+Infinity",
      "-Infinity",
      "infinity",
      "INFINITY",
      "Inf",
      "0x1F",
      "0X1f",
      "0o17",
      "0O17",
      "0b101",
      "0B101",
      "0x",
      "0b2",
      "0o8",
      "-0x10",
      "+0x10",
      "0x1fffffffffffff",
      "0x20000000000001",
      "0x20000000000003",
      "0xFFFFFFFFFFFFFFFFFFFF",
      `0b${"1".repeat(60)}`,
      "1e",
      "1e+",
      "e5",
      "1.e5",
      ".5",
      "5.",
      ".",
      "+.5",
      "-.5e-3",
      "1_000",
      "12abc",
      "+-1",
      "--1",
      "1 2",
      "1e1000",
      "-1e1000",
      "1e-1000",
      "1e-400",
      "1e99999999999",
      "2.4703282292062327e-324",
      "2.4703282292062328e-324",
      "4.9406564584124654e-324",
      "2.2250738585072011e-308",
      "2.2250738585072012e-308",
      "1.7976931348623158e308",
      "1.7976931348623159e308",
      "9007199254740993",
      "9007199254740995",
      "0.1",
      "0.30000000000000004",
      "123456789012345678901234567890",
      `1${"0".repeat(400)}e-400`,
      `0.${"1".repeat(500)}`,
      `1.${"0".repeat(850)}1`,
      `9007199254740993${"0".repeat(820)}e-820`,
      `9007199254740993${"0".repeat(820)}1e-821`,
      "00012",
      "0012.5e1",
      "1E2",
      "1e+2",
      "1e-2",
      "1.5E-7",
      ...Array.from(
        { length: 40 },
        () => `${random() % 2 === 0 ? "-" : ""}${random()}${random()}e${(random() % 660) - 345}`,
      ),
    ];
    const failures = await getFailures(
      strings.map((text) => ({
        name: `StringToNumber(${JSON.stringify(text)})`,
        actual: `StringToNumber(${encodeString(text)})`,
        expected: encodeNumber(Number(text)),
      })),
    );
    expect(failures).toEqual([]);
  });

  it.each([
    [
      "integral",
      [
        0,
        -0,
        NaN,
        Infinity,
        -Infinity,
        1,
        -1,
        2,
        3,
        -3,
        4,
        5,
        10,
        22,
        23,
        -300,
        2 ** 31,
        1e300,
        -1e300,
      ],
    ],
    ["half-integral", [0.5, -0.5, 1.5, 2.5, -2.5]],
    ["other nonintegral", [0.1, 1 / 3, -2 / 3, 0.25, Number.EPSILON, 1e-300]],
  ])("exponentiates with %s exponents", async (_, exponents) => {
    const bases = [
      ...SPECIAL_VALUES.slice(0, 22),
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      1.1,
      -1.1,
      0.9,
      1 + 2 ** -52,
      10,
      1e10,
      1e-10,
    ];
    const failures = await getFailures(
      createBinaryChecks(
        "NumExponentiate",
        (left, right) =>
          encodeNumber(
            Number.isInteger(right) && Math.abs(right) <= 300 && Number.isFinite(left) && left !== 0
              ? getExactPower(left, right)
              : left ** right,
          ),
        bases.flatMap((base) => exponents.map((exponent) => [base, exponent] as const)),
      ),
    );
    expect(failures).toEqual([]);
  });

  // JavaScript leaves these to the platform's libm, which can be an ulp off, so the expected
  // values are the correctly rounded ones, from bc at 1300 digits.
  it("computes the transcendental Math functions correctly rounded", async () => {
    const expectations: [string, number, number][] = [
      ["MathExp", 0.5, 1.6487212707001282],
      ["MathExp", -0.5, 0.6065306597126334],
      ["MathExp", 2, 7.38905609893065],
      ["MathExp", 10, 22026.465794806718],
      ["MathExp", 0.00001, 1.00001000005],
      ["MathExpm1", 0.5, 0.6487212707001282],
      ["MathExpm1", -0.5, -0.3934693402873666],
      ["MathExpm1", 2, 6.38905609893065],
      ["MathExpm1", 10, 22025.465794806718],
      ["MathExpm1", 0.00001, 0.000010000050000166668],
      ["MathCosh", 0.5, 1.1276259652063807],
      ["MathCosh", -0.5, 1.1276259652063807],
      ["MathCosh", 2, 3.7621956910836314],
      ["MathCosh", 10, 11013.232920103323],
      ["MathCosh", 0.00001, 1.00000000005],
      ["MathSinh", 0.5, 0.5210953054937474],
      ["MathSinh", -0.5, -0.5210953054937474],
      ["MathSinh", 2, 3.6268604078470186],
      ["MathSinh", 10, 11013.232874703393],
      ["MathSinh", 0.00001, 0.000010000000000166668],
      ["MathTanh", 0.5, 0.46211715726000974],
      ["MathTanh", -0.5, -0.46211715726000974],
      ["MathTanh", 2, 0.9640275800758169],
      ["MathTanh", 10, 0.9999999958776927],
      ["MathTanh", 0.00001, 0.000009999999999666668],
      ["MathLog1p", 0.5, 0.4054651081081644],
      ["MathLog1p", -0.5, -0.6931471805599453],
      ["MathLog1p", 2, 1.0986122886681098],
      ["MathLog1p", 10, 2.3978952727983707],
      ["MathLog1p", 0.00001, 0.000009999950000333332],
      ["MathAsinh", 0.5, 0.48121182505960347],
      ["MathAsinh", -0.5, -0.48121182505960347],
      ["MathAsinh", 2, 1.4436354751788103],
      ["MathAsinh", 10, 2.99822295029797],
      ["MathAsinh", 0.00001, 0.000009999999999833334],
      ["MathAcosh", 2, 1.3169578969248168],
      ["MathAcosh", 10, 2.993222846126381],
      ["MathAcosh", 709.7, 7.257989029737802],
      ["MathAcosh", 1.0000000000000002, 2.1073424255447014e-8],
      ["MathAcosh", 1e22, 51.35001922642895],
      ["MathAtanh", 0.5, 0.5493061443340549],
      ["MathAtanh", -0.5, -0.5493061443340549],
      ["MathAtanh", 0.00001, 0.000010000000000333334],
      ["MathAtanh", 0.9999, 4.951718775643099],
      ["MathAtanh", 0.9999999999999999, 18.714973875118524],
      ["MathAtan", 0.5, 0.4636476090008061],
      ["MathAtan", -0.5, -0.4636476090008061],
      ["MathAtan", 2, 1.1071487177940904],
      ["MathAtan", 10, 1.4711276743037347],
      ["MathAtan", 0.00001, 0.000009999999999666668],
      ["MathAsin", 0.5, 0.5235987755982989],
      ["MathAsin", -0.5, -0.5235987755982989],
      ["MathAsin", 0.00001, 0.000010000000000166668],
      ["MathAsin", 0.9999, 1.5566540733173846],
      ["MathAsin", 0.9999999999999999, 1.5707963118937354],
      ["MathAcos", 0.5, 1.0471975511965979],
      ["MathAcos", -0.5, 2.0943951023931957],
      ["MathAcos", 0.00001, 1.5707863267948965],
      ["MathAcos", 0.9999, 0.014142253477512098],
      ["MathAcos", 0.9999999999999999, 1.4901161193847656e-8],
      ["MathSin", 0.5, 0.479425538604203],
      ["MathSin", -0.5, -0.479425538604203],
      ["MathSin", 2, 0.9092974268256817],
      ["MathSin", 10, -0.5440211108893698],
      ["MathSin", 0.00001, 0.000009999999999833334],
      ["MathCos", 0.5, 0.8775825618903728],
      ["MathCos", -0.5, 0.8775825618903728],
      ["MathCos", 2, -0.4161468365471424],
      ["MathCos", 10, -0.8390715290764524],
      ["MathCos", 0.00001, 0.99999999995],
      ["MathTan", 0.5, 0.5463024898437905],
      ["MathTan", -0.5, -0.5463024898437905],
      ["MathTan", 2, -2.185039863261519],
      ["MathTan", 10, 0.6483608274590866],
      ["MathTan", 0.00001, 0.000010000000000333334],
      ["MathCbrt", 0.5, 0.7937005259840998],
      ["MathCbrt", 2, 1.2599210498948732],
      ["MathCbrt", 10, 2.154434690031884],
      ["MathCbrt", 0.00001, 0.02154434690031884],
      ["MathCbrt", 0.9999, 0.9999666655554938],
      ['MathLogarithm("log",', 0.5, -0.6931471805599453],
      ['MathLogarithm("log",', 2, 0.6931471805599453],
      ['MathLogarithm("log",', 10, 2.302585092994046],
      ['MathLogarithm("log",', 0.00001, -11.512925464970229],
      ['MathLogarithm("log",', 0.9999, -0.00010000500033334732],
      ['MathLogarithm("log2",', 0.5, -1],
      ['MathLogarithm("log2",', 2, 1],
      ['MathLogarithm("log2",', 10, 3.321928094887362],
      ['MathLogarithm("log2",', 0.00001, -16.609640474436812],
      ['MathLogarithm("log2",', 0.9999, -0.00014427671804501932],
      ['MathLogarithm("log10",', 0.5, -0.3010299956639812],
      ['MathLogarithm("log10",', 2, 0.3010299956639812],
      ['MathLogarithm("log10",', 10, 1],
      ['MathLogarithm("log10",', 0.00001, -5],
      ['MathLogarithm("log10",', 0.9999, -0.000043431619807505604],
    ];
    const failures = await getFailures(
      expectations.map(([operator, value, expected]) => ({
        name: `${operator}(${value})`,
        actual: operator.endsWith(",")
          ? `${operator} ${encodeNumber(value)})`
          : `${operator}(${encodeNumber(value)})`,
        expected: encodeNumber(expected),
      })),
    );
    expect(failures).toEqual([]);
  });

  it("computes the special values of the transcendental Math functions", async () => {
    const operators: [string, (value: number) => number][] = [
      ["MathExp", Math.exp],
      ["MathExpm1", Math.expm1],
      ["MathCosh", Math.cosh],
      ["MathSinh", Math.sinh],
      ["MathTanh", Math.tanh],
      ["MathLog1p", Math.log1p],
      ["MathAsinh", Math.asinh],
      ["MathAcosh", Math.acosh],
      ["MathAtanh", Math.atanh],
      ["MathAtan", Math.atan],
      ["MathAsin", Math.asin],
      ["MathAcos", Math.acos],
      ["MathSin", Math.sin],
      ["MathCos", Math.cos],
      ["MathTan", Math.tan],
      ['MathLogarithm("log",', Math.log],
      ['MathLogarithm("log2",', Math.log2],
      ['MathLogarithm("log10",', Math.log10],
    ];
    const values = [0, -0, NaN, Infinity, -Infinity, 2 ** -40, -(2 ** -60), 5e-324];
    const failures = await getFailures(
      operators.flatMap(([operator, compute]) =>
        values.map((value) => ({
          name: `${operator}(${Object.is(value, -0) ? "-0" : value})`,
          actual: operator.endsWith(",")
            ? `${operator} ${encodeNumber(value)})`
            : `${operator}(${encodeNumber(value)})`,
          expected: encodeNumber(compute(value)),
        })),
      ),
    );
    expect(failures).toEqual([]);
  });

  it("computes the exact Math functions", async () => {
    const failures = await getFailures([
      ...createUnaryChecks("MathF16round", (value) => encodeNumber(Math.f16round(value))),
      ...createUnaryChecks("MathClz32", (value) => encodeNumber(Math.clz32(value))),
      ...createBinaryChecks("MathImul", (left, right) => encodeNumber(Math.imul(left, right))),
      ...createUnaryChecks("MathCbrt", (value) => encodeNumber(Math.cbrt(value)), [
        0,
        -0,
        NaN,
        Infinity,
        -Infinity,
        8,
        -27,
        1e-300,
        5e-324,
        2 ** 300,
        0.001,
      ]),
      ...[
        [3, 4],
        [],
        [0, -0],
        [NaN, Infinity],
        [NaN, 1],
        [1e300, 1e300],
        [5e-324, 5e-324],
        [1e-300, 1],
      ].map((numbers) => ({
        name: `MathHypot(${numbers.join(", ")})`,
        actual: `MathHypot(<<${numbers.map(encodeNumber).join(", ")}>>)`,
        expected: encodeNumber(Math.hypot(...numbers)),
      })),
      // sqrt(14), which Math.hypot rounds wrongly.
      {
        name: "MathHypot(1, 2, 3)",
        actual: `MathHypot(<<${[1, 2, 3].map(encodeNumber).join(", ")}>>)`,
        expected: encodeNumber(Math.sqrt(14)),
      },
    ]);
    expect(failures).toEqual([]);
  });

  it("formats Numbers with toFixed, toExponential, and toPrecision", async () => {
    const values = [
      ...SPECIAL_VALUES.filter((value) => Number.isFinite(value)),
      1.005,
      1.45,
      999.995,
      1e21,
      9.999e20,
      0.000001234,
      -0.0000001,
      25,
    ];
    const failures = await getFailures(
      values.flatMap((value) => [
        ...[0, 2, 20, 100].map((digits) => ({
          name: `(${value}).toFixed(${digits})`,
          actual: `NumToFixed(${encodeNumber(value)}, ${digits})`,
          expected: encodeString(value.toFixed(digits)),
        })),
        ...[0, 3, 100].map((digits) => ({
          name: `(${value}).toExponential(${digits})`,
          actual: `NumToExponential(${encodeNumber(value)}, ${digits})`,
          expected: encodeString(value.toExponential(digits)),
        })),
        {
          name: `(${value}).toExponential()`,
          actual: `NumToShortestExponential(${encodeNumber(value)})`,
          expected: encodeString(value.toExponential()),
        },
        ...[1, 5, 21, 100].map((precision) => ({
          name: `(${value}).toPrecision(${precision})`,
          actual: `NumToPrecision(${encodeNumber(value)}, ${precision})`,
          expected: encodeString(value.toPrecision(precision)),
        })),
      ]),
    );
    expect(failures).toEqual([]);
  });

  it("parses Numbers with parseFloat and parseInt", async () => {
    const floats = [
      "",
      "  12",
      "12abc",
      "-0",
      "+.5",
      "-.5e-3",
      ".",
      "1e",
      "1e+",
      "1.e5",
      "Infinityx",
      "-Infinity",
      "infinity",
      "0x10",
      "1_000",
      "\u00a0 3.25e2z",
      "9007199254740993",
      `1${"0".repeat(400)}`,
      "e5",
      "5.",
      "  -12.5e-1e2",
    ];
    const integers: [string, number][] = [
      ["123", 0],
      [" -0x1F", 0],
      ["0x1F", 16],
      ["0x1F", 10],
      ["-0", 0],
      ["11", 2],
      ["12", 2],
      ["z", 36],
      ["Z", 36],
      ["9007199254740993", 10],
      [`1${"0".repeat(400)}`, 10],
      ["", 10],
      ["-", 10],
      ["10", 1],
      ["10", 37],
      ["  +77", 8],
      ["0X", 0],
      ["1fffffffffffff1", 16],
    ];
    const failures = await getFailures([
      ...floats.map((text) => ({
        name: `parseFloat(${JSON.stringify(text)})`,
        actual: `ParseFloatUnits(${encodeString(text)})`,
        expected: encodeNumber(parseFloat(text)),
      })),
      ...integers.map(([text, radix]) => ({
        name: `parseInt(${JSON.stringify(text)}, ${radix})`,
        actual: `ParseIntUnits(${encodeString(text)}, ${radix})`,
        expected: encodeNumber(parseInt(text, radix)),
      })),
    ]);
    expect(failures).toEqual([]);
  });

  // JavaScript leaves these to the platform's pow, which can round them wrongly, so the expected
  // values are the correctly rounded ones.
  it.each([
    [-1, 1 + 2 ** -52],
    [1.5, 1 - 2 ** -53],
    [2.5, 1 - 2 ** -52],
  ])(
    "rounds (1 - 2^-53) ** %d, which lies near a midpoint, correctly",
    async (exponent, expected) => {
      const failures = await getFailures([
        {
          name: `NumExponentiate(1 - 2 ** -53, ${exponent})`,
          actual: `NumExponentiate(${encodeNumber(1 - 2 ** -53)}, ${encodeNumber(exponent)})`,
          expected: encodeNumber(expected),
        },
      ]);
      expect(failures).toEqual([]);
    },
  );
});
