import { describe, expect, it } from "vite-plus/test";
import {
  formatProbability,
  getActualProbability,
  getFingerprintDistance,
  getOutDegreeSummary,
  OUT_DEGREE_BUCKETS,
} from "../../src/tlc-summary";

// Each pair is a value and what TLC's AbstractChecker.ProbabilityToString(value, 2) prints for it.
const PROBABILITIES: [number, string][] = [
  [0, "0.0"],
  [3.1e-8, "3.1E-8"],
  [1.234e-5, "1.2E-5"],
  [0.00095, "9.5E-4"],
  [0.5, ".5"],
  [0.0123, ".012"],
  [0.999, "1.00"],
  [1, "1.0"],
  [9.96e-4, "10.0E-4"],
  [2.5e-10, "2.5E-10"],
  [1.95e-7, "2.0E-7"],
  [0.007, ".007"],
  [0.0995, ".100"],
];

// Each pair is a distance and 1 divided by it as TLC computes it with BigDecimal and MathContext(2).
const DISTANCES: [bigint, number][] = [
  [1n, 1],
  [3n, 0.33],
  [7n, 0.14],
  [15n, 0.067],
  [95n, 0.011],
  [142355914n, 7.0e-9],
  [250000001n, 4.0e-9],
  [666666667n, 1.5e-9],
  [0x7fff_ffff_ffff_ffffn, 1.1e-19],
];

const getBuckets = (degrees: number[]) =>
  degrees.reduce(
    (buckets, degree) => {
      buckets[Math.min(degree, OUT_DEGREE_BUCKETS - 1)]++;
      return buckets;
    },
    Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0),
  );

describe("TLC's summary of a completed check", () => {
  it.each(PROBABILITIES)("prints the probability %d as %s", (value, text) => {
    expect(formatProbability(value)).toBe(text);
  });

  it.each(DISTANCES)("estimates a collision at distance %d as %d", (distance, probability) => {
    expect(getActualProbability(distance)).toBe(probability);
  });

  it("measures the distance only within each half of the fingerprints split by the top bit", () => {
    const fingerprints = [-9n, -2n, 4n, 20n, 0x7fff_ffff_ffff_fff0n];
    const getDistance = () =>
      getFingerprintDistance(1e5, 1e5 + 1e5, () => BigInt64Array.from(fingerprints));
    expect(getDistance()).toBe(7n);
    fingerprints.push(1n);
    expect(getDistance()).toBe(3n);
  });

  it("skips the distance while the optimistic estimate is below TLC's threshold", () => {
    expect(getFingerprintDistance(10, 20, () => BigInt64Array.of(1n, 2n))).toBeUndefined();
  });

  it("summarizes the outdegrees and caps the last bucket", () => {
    expect(getOutDegreeSummary(getBuckets([]))).toBeUndefined();
    expect(getOutDegreeSummary(getBuckets([0, 1, 1, 2, 40]))).toBe(
      "The average outdegree of the complete state graph is 7 (minimum is 0, the maximum 31 and the 95th percentile is 31).",
    );
    expect(getOutDegreeSummary(getBuckets([...Array.from({ length: 19 }, () => 1), 5]))).toBe(
      "The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 5 and the 95th percentile is 5).",
    );
  });
});
