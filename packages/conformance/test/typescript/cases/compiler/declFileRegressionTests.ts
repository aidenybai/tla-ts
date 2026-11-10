/*---
description: Ported from TypeScript's tests/cases/compiler/declFileRegressionTests.ts.
outcome: success
source: tests/cases/compiler/declFileRegressionTests.ts
---*/
// @target: es2015
// @strict: false
// @declaration: true
// 'null' not converted to 'any' in d.ts
// function types not piped through correctly
var n = { w: null, x: '', y: () => { }, z: 32 };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
