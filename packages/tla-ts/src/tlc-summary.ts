// TLC counts how many new states each expanded state yields in 32 buckets, the last of which
// holds every count from 31 up.
export const OUT_DEGREE_BUCKETS = 32;

// TLC's optimistic estimate of a fingerprint collision, from AbstractChecker.
export const getOptimisticProbability = (distinctStates: number, generatedStates: number) =>
  distinctStates * ((generatedStates - distinctStates) / 2 ** 64);

// TLC computes the estimate from the actual fingerprints only when the optimistic one is this high.
const ACTUAL_PROBABILITY_THRESHOLD = 1e-10;

const withDecimalPoint = (text: string) => (text.includes(".") ? text : `${text}.0`);

// Java's Double.toString, which prints a number below 1E-3 or from 1E7 up in scientific notation.
const toJavaString = (value: number) => {
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-3 && magnitude < 1e7) return withDecimalPoint(String(value));
  const [mantissa, exponent] = value.toExponential().split("e");
  return `${withDecimalPoint(mantissa)}E${exponent.replace("+", "")}`;
};

const isDigit = (character: string | undefined) =>
  character !== undefined && character >= "0" && character <= "9";

// TLC's ProbabilityToString, which keeps two significant digits and drops a leading zero.
export const formatProbability = (value: number) => {
  if (value === 0) return "0.0";
  const text = toJavaString(value);
  const cursor = { next: 0, digits: 0, result: "" };
  while (text[cursor.next] === "0") cursor.next++;
  while (isDigit(text[cursor.next])) {
    cursor.result += text[cursor.next++];
    cursor.digits++;
  }
  if (cursor.next === text.length) return cursor.result;
  if (text[cursor.next] !== ".") return text;
  cursor.next++;
  if (cursor.digits >= 2) {
    while (isDigit(text[cursor.next])) cursor.next++;
  } else {
    cursor.result += ".";
    if (cursor.digits === 0) {
      while (text[cursor.next] === "0") cursor.result += text[cursor.next++];
    }
    while (isDigit(text[cursor.next]) && cursor.digits < 2) {
      cursor.result += text[cursor.next++];
      cursor.digits++;
    }
    if (isDigit(text[cursor.next]) && Number(text[cursor.next]) >= 5) {
      cursor.result = roundUp(cursor.result);
    }
    while (isDigit(text[cursor.next])) cursor.next++;
  }
  if (cursor.next >= text.length) return cursor.result;
  if (text[cursor.next] === "E") return `${cursor.result}${text.slice(cursor.next)}`;
  return text;
};

// Adds one to the last digit and carries it over nines and the decimal point.
const roundUp = (digits: string): string => {
  const position = digits.length - 1;
  if (position < 0) return "1";
  const last = digits[position];
  const front = digits.slice(0, position);
  if (last === ".") return `${roundUp(front)}.`;
  if (last === "9") return `${roundUp(front)}0`;
  return `${front}${Number(last) + 1}`;
};

// 1 divided by the distance, rounded half up to two significant digits like Java's BigDecimal.
export const getActualProbability = (distance: bigint) => {
  const exponent = { value: 0 };
  while (10n ** BigInt(exponent.value + 1) < distance * 10n) exponent.value++;
  const scale = 10n ** BigInt(exponent.value + 1);
  const quotient = scale / distance;
  const isRoundedUp = (scale % distance) * 2n >= distance;
  return Number(`${quotient + (isRoundedUp ? 1n : 0n)}e-${exponent.value + 1}`);
};

// TLC splits its fingerprints into two sets by their top bit and reports the smallest distance
// between two fingerprints in the same set. Sorted as signed integers, each set is contiguous.
export const getFingerprintDistance = (
  distinctStates: number,
  generatedStates: number,
  getFingerprints: () => BigInt64Array,
) => {
  const probability = getOptimisticProbability(distinctStates, generatedStates);
  if (probability < ACTUAL_PROBABILITY_THRESHOLD) return undefined;
  const fingerprints = getFingerprints().sort();
  return fingerprints.reduce((distance, fingerprint, index) => {
    const previous = fingerprints[index - 1];
    const isSameSet = index > 0 && previous < 0n === fingerprint < 0n;
    return isSameSet && fingerprint - previous < distance ? fingerprint - previous : distance;
  }, 0x7fff_ffff_ffff_ffffn);
};

export const getOutDegreeSummary = (buckets: number[]) => {
  const observations = buckets.reduce((sum, count) => sum + count, 0);
  if (observations === 0) return undefined;
  const degrees = buckets.flatMap((count, degree) => (count > 0 ? [degree] : []));
  const total = buckets.reduce((sum, count, degree) => sum + count * degree, 0);
  const position = Math.floor(observations * 0.95);
  const cumulative = { count: 0 };
  const percentile = degrees.find((degree) => {
    cumulative.count += buckets[degree];
    return cumulative.count > position;
  });
  return `The average outdegree of the complete state graph is ${Math.round(total / observations)} (minimum is ${degrees[0]}, the maximum ${degrees[degrees.length - 1]} and the 95th percentile is ${percentile}).`;
};
