// test262's harness/nans.js, typed so that tla-ts can compile it. NaN * 0 is one of its NaNs.
/* oxlint-disable no-unused-vars, erasing-op */

const NaNs = [
  NaN,
  Number.NaN,
  NaN * 0,
  0 / 0,
  Infinity / Infinity,
  -(0 / 0),
  Math.pow(-1, 0.5),
  -Math.pow(-1, 0.5),
  Number("Not-a-Number"),
];
