/*---
description: Ported from TypeScript's tests/cases/compiler/bigIntWithTargetES2016.ts.
outcome: success
source: tests/cases/compiler/bigIntWithTargetES2016.ts
---*/
// @target: es2016
// @lib: esnext

BigInt(1) ** BigInt(1); // should not error

let num = BigInt(2);
num **= BigInt(2); // should not error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
