/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/destructuringObjectAssignmentPatternWithNestedSpread.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/destructuringObjectAssignmentPatternWithNestedSpread.ts
---*/
// @target: es5, es2015, es2018
// @noTypesAndSymbols: true
let a: any, b: any, c: any = {x: {a: 1, y: 2}}, d: any;
({x: {a, ...b} = d} = c);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
