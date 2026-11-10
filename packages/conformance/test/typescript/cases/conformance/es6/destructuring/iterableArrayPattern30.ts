/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/iterableArrayPattern30.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/iterableArrayPattern30.ts
---*/
// @strict: false
//@target: ES6
const [[k1, v1], [k2, v2]] = new Map([["", true], ["hello", true]])

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
