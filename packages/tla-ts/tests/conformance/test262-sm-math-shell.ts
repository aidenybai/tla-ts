// test262's harness/sm/non262-Math-shell.js, typed so that tla-ts can compile it.

// The nearest representable values to +1.0.
const ONE_PLUS_EPSILON = 1 + Math.pow(2, -52); // 0.9999999999999999
const ONE_MINUS_EPSILON = 1 - Math.pow(2, -53); // 1.0000000000000002

{
  const fail = function (msg: string) {
    const exc: Error & { fileName?: string; lineNumber?: number } = new Error(msg);
    try {
      // Try to improve on exc.fileName and .lineNumber; leave exc.stack
      // alone. We skip two frames: fail() and its caller, an assertX()
      // function.
      const frames = (exc.stack as string).trim().split("\n");
      if (frames.length > 2) {
        const m = /@([^@:]*):([0-9]+)$/.exec(frames[2]);
        if (m) {
          exc.fileName = m[1];
          exc.lineNumber = +m[2];
        }
      }
      // oxlint-disable-next-line no-useless-catch
    } catch (ignore) {
      throw ignore;
    }
    throw exc;
  };

  let ENDIAN: number; // 0 for little-endian, 1 for big-endian.

  // Return the difference between the IEEE 754 bit-patterns for a and b.
  //
  // This is meaningful when a and b are both finite and have the same
  // sign. Then the following hold:
  //
  //   * If a === b, then diff(a, b) === 0.
  //
  //   * If a !== b, then diff(a, b) === 1 + the number of representable values
  //                                         between a and b.
  //
  const f = new Float64Array([0, 0]);
  const u = new Uint32Array(f.buffer);
  const diff = function (a: number, b: number) {
    f[0] = a;
    f[1] = b;
    return Math.abs((u[3 - ENDIAN] - u[1 - ENDIAN]) * 0x100000000 + u[2 + ENDIAN] - u[0 + ENDIAN]);
  };

  // Set ENDIAN to the platform's endianness.
  ENDIAN = 0; // try little-endian first
  if (diff(2, 4) === 0x100000)
    // exact wrong answer we'll get on a big-endian platform
    ENDIAN = 1;
  // For test262-harness compatibility,
  // avoid `assert.sameValue` while still defining functions.
  // https://github.com/bocoup/test262-stream/issues/34
  const assertDiffResult = (a: number, b: number, expect: number, detail: string) => {
    const result = diff(a, b);
    if (result === expect) return;
    throw new Error(`Expected diff(${a}, ${b}) to be ${expect} but got ${result} [${detail}]`);
  };
  assertDiffResult(2, 4, 0x10000000000000, "wanted 0x10000000000000");
  assertDiffResult(0, Number.MIN_VALUE, 1, "0 vs. Number.MIN_VALUE");
  assertDiffResult(1, ONE_PLUS_EPSILON, 1, "1 vs. ONE_PLUS_EPSILON");
  assertDiffResult(1, ONE_MINUS_EPSILON, 1, "1 vs. ONE_MINUS_EPSILON");

  // oxlint-disable-next-line no-var, no-unused-vars
  var assertNear = function assertNear(a: number, b: number, tolerance = 1) {
    if (!Number.isFinite(b)) {
      fail("second argument to assertNear (expected value) must be a finite number");
    } else if (Number.isNaN(a)) {
      fail("got NaN, expected a number near " + b);
    } else if (!Number.isFinite(a)) {
      if (b * Math.sign(a) < Number.MAX_VALUE) fail("got " + a + ", expected a number near " + b);
    } else {
      // When the two arguments do not have the same sign bit, diff()
      // returns some huge number. So if b is positive or negative 0,
      // make target the zero that has the same sign bit as a.
      // oxlint-disable-next-line erasing-op
      const target = b === 0 ? a * 0 : b;
      const err = diff(a, target);
      if (err > tolerance) {
        fail("got " + a + ", expected a number near " + b + " (relative error: " + err + ")");
      }
    }
  };
}
