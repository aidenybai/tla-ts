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
];

export const getTest262Percent = (passed: number): string =>
  `${((passed / TEST262_TOTAL) * 100).toFixed(2)}%`;
