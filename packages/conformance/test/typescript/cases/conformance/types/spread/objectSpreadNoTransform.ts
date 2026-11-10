/*---
description: Ported from TypeScript's tests/cases/conformance/types/spread/objectSpreadNoTransform.ts.
outcome: success
source: tests/cases/conformance/types/spread/objectSpreadNoTransform.ts
---*/
// @target: esnext
const y = { a: 'yes', b: 'no' };
const o = { x: 1, ...y };
var b;
var rest: any;
({ b, ...rest } = o);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
