export const TEST262_TOTAL = 53_755;

export const TEST262_RUNS = [
  { date: "Nov 8", passed: 831 },
  { date: "Nov 8", passed: 4_606 },
  { date: "Nov 8", passed: 5_436 },
  { date: "Nov 8", passed: 9_932 },
  { date: "Nov 9", passed: 12_507 },
  { date: "Nov 9", passed: 12_898 },
  { date: "Nov 9", passed: 13_149 },
  { date: "Nov 9", passed: 15_353 },
  { date: "Nov 9", passed: 16_681 },
  { date: "Nov 10", passed: 17_262 },
  { date: "Nov 10", passed: 17_372 },
  { date: "Nov 15", passed: 29_488 },
  { date: "Nov 15", passed: 31_324 },
  { date: "Nov 15", passed: 31_829 },
  { date: "Nov 16", passed: 32_104 },
  { date: "Nov 16", passed: 32_416 },
  { date: "Nov 16", passed: 35_792 },
];

export const getTest262Percent = (passed: number): string =>
  `${((passed / TEST262_TOTAL) * 100).toFixed(2)}%`;
