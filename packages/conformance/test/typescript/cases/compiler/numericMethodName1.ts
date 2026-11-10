/*---
description: Ported from TypeScript's tests/cases/compiler/numericMethodName1.ts.
outcome: success
source: tests/cases/compiler/numericMethodName1.ts
---*/
// @target: es2015
class C {
  1 = 2;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
