/*---
description: Ported from TypeScript's tests/cases/compiler/prefixedNumberLiteralAssignToNumberLiteralType.ts.
outcome: success
source: tests/cases/compiler/prefixedNumberLiteralAssignToNumberLiteralType.ts
---*/
// @target: es2015
let x: 1 = +1;

let y: -1 = -1;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
