/*---
description: Ported from TypeScript's tests/cases/conformance/types/tuple/wideningTuples5.ts.
outcome: success
source: tests/cases/conformance/types/tuple/wideningTuples5.ts
---*/
// @target: es2015
//@strict: false
//@noImplicitAny: true
var [a, b] = [undefined, null];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
