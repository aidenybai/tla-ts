/*---
description: Ported from TypeScript's tests/cases/compiler/restElementWithNumberPropertyName.ts.
outcome: success
source: tests/cases/compiler/restElementWithNumberPropertyName.ts
---*/
// @target: es5, es2015
const { 0: a, ...b } = [0, 1, 2];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
