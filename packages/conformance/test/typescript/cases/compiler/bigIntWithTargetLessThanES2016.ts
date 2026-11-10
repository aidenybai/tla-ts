/*---
description: Ported from TypeScript's tests/cases/compiler/bigIntWithTargetLessThanES2016.ts.
outcome: success
source: tests/cases/compiler/bigIntWithTargetLessThanES2016.ts
---*/
// @target: es2015
// @lib: esnext

BigInt(1) ** BigInt(1); // should error

let foo = BigInt(2);
foo **= BigInt(2); // should error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
