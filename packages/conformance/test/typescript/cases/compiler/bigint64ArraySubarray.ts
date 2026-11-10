/*---
description: Ported from TypeScript's tests/cases/compiler/bigint64ArraySubarray.ts.
outcome: success
source: tests/cases/compiler/bigint64ArraySubarray.ts
---*/
// @target: es2020

function bigInt64ArraySubarray() {
    var arr = new BigInt64Array(10);
    arr.subarray();
    arr.subarray(0);
    arr.subarray(0, 10);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
