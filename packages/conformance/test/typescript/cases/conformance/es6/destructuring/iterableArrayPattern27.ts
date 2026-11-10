/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/iterableArrayPattern27.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/iterableArrayPattern27.ts
---*/
//@target: ES6
function takeFirstTwoEntries(...[[k1, v1], [k2, v2]]: [string, number][]) { }
takeFirstTwoEntries(...new Map([["", 0], ["hello", 1]]));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
