// test262's harness/decimalToHexString.js, typed so that tla-ts can compile it. Tests pass it
// variables that may be undefined, which Number converts as >>> does.

// oxlint-disable-next-line no-unused-vars
function decimalToHexString(n: number | undefined) {
  const hex = "0123456789ABCDEF";
  let rest = Number(n) >>> 0;
  let s = "";
  while (rest) {
    s = hex[rest & 0xf] + s;
    rest >>>= 4;
  }
  while (s.length < 4) {
    s = "0" + s;
  }
  return s;
}

// oxlint-disable-next-line no-unused-vars
function decimalToPercentHexString(n: number) {
  const hex = "0123456789ABCDEF";
  return "%" + hex[(n >> 4) & 0xf] + hex[n & 0xf];
}
