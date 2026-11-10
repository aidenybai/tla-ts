/*---
description: Ported from TypeScript's tests/cases/compiler/optionalParamReferencingOtherParams1.ts.
outcome: success
source: tests/cases/compiler/optionalParamReferencingOtherParams1.ts
---*/
// @target: es2015
function strange(x: number, y = x * 1, z = x + y) {
    return z;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
