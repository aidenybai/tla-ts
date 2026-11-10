export const OUT_DEGREE_BUCKETS = 32;

export const getOptimisticProbability = (distinctStates: number, generatedStates: number) =>
  distinctStates * ((generatedStates - distinctStates) / 2 ** 64);

const ACTUAL_PROBABILITY_THRESHOLD = 1e-10;

const withDecimalPoint = (text: string) => (text.includes(".") ? text : `${text}.0`);

const toJavaString = (value: number) => {
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-3 && magnitude < 1e7) return withDecimalPoint(String(value));
  const [mantissa, exponent] = value.toExponential().split("e");
  return `${withDecimalPoint(mantissa)}E${exponent.replace("+", "")}`;
};

const isDigit = (character: string | undefined) =>
  character !== undefined && character >= "0" && character <= "9";

export const formatProbability = (value: number) => {
  if (value === 0) return "0.0";
  const text = toJavaString(value);
  let next = 0;
  let digits = 0;
  let result = "";
  while (text[next] === "0") next++;
  while (isDigit(text[next])) {
    result += text[next++];
    digits++;
  }
  if (next === text.length) return result;
  if (text[next] !== ".") return text;
  next++;
  if (digits >= 2) {
    while (isDigit(text[next])) next++;
  } else {
    result += ".";
    if (digits === 0) {
      while (text[next] === "0") result += text[next++];
    }
    while (isDigit(text[next]) && digits < 2) {
      result += text[next++];
      digits++;
    }
    if (isDigit(text[next]) && Number(text[next]) >= 5) {
      result = roundUp(result);
    }
    while (isDigit(text[next])) next++;
  }
  if (next >= text.length) return result;
  if (text[next] === "E") return `${result}${text.slice(next)}`;
  return text;
};

const roundUp = (digits: string): string => {
  const position = digits.length - 1;
  if (position < 0) return "1";
  const last = digits[position];
  const front = digits.slice(0, position);
  if (last === ".") return `${roundUp(front)}.`;
  if (last === "9") return `${roundUp(front)}0`;
  return `${front}${Number(last) + 1}`;
};

export const getActualProbability = (distance: bigint) => {
  let exponent = 0;
  while (10n ** BigInt(exponent + 1) < distance * 10n) exponent++;
  const scale = 10n ** BigInt(exponent + 1);
  const quotient = scale / distance;
  const isRoundedUp = (scale % distance) * 2n >= distance;
  return Number(`${quotient + (isRoundedUp ? 1n : 0n)}e-${exponent + 1}`);
};

export const getFingerprintDistance = (
  distinctStates: number,
  generatedStates: number,
  getFingerprints: () => BigInt64Array,
) => {
  const probability = getOptimisticProbability(distinctStates, generatedStates);
  if (probability < ACTUAL_PROBABILITY_THRESHOLD) return undefined;
  const fingerprints = getFingerprints().sort();
  const words = new Int32Array(fingerprints.buffer);
  let narrowGap = Number.POSITIVE_INFINITY;
  let wideGap = 0x7fff_ffff_ffff_ffffn;
  for (let index = 1; index < fingerprints.length; index++) {
    const high = words[2 * index + 1];
    const previousHigh = words[2 * index - 1];
    if (high < 0 !== previousHigh < 0) continue;
    const highGap = high - previousHigh;
    if (highGap <= 0x10_0000) {
      const gap = highGap * 0x1_0000_0000 + (words[2 * index] >>> 0) - (words[2 * index - 2] >>> 0);
      narrowGap = Math.min(narrowGap, gap);
    } else {
      const gap = fingerprints[index] - fingerprints[index - 1];
      if (gap < wideGap) wideGap = gap;
    }
  }
  if (narrowGap === Number.POSITIVE_INFINITY) return wideGap;
  const narrow = BigInt(narrowGap);
  return narrow < wideGap ? narrow : wideGap;
};

export const getOutDegreeSummary = (buckets: number[]) => {
  const observations = buckets.reduce((sum, count) => sum + count, 0);
  if (observations === 0) return undefined;
  const degrees = buckets.flatMap((count, degree) => (count > 0 ? [degree] : []));
  const total = buckets.reduce((sum, count, degree) => sum + count * degree, 0);
  const position = Math.floor(observations * 0.95);
  let cumulativeCount = 0;
  const percentile = degrees.find((degree) => {
    cumulativeCount += buckets[degree];
    return cumulativeCount > position;
  });
  return `The average outdegree of the complete state graph is ${Math.round(total / observations)} (minimum is ${degrees[0]}, the maximum ${degrees[degrees.length - 1]} and the 95th percentile is ${percentile}).`;
};
