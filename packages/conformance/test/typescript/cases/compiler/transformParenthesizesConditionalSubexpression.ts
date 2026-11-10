/*---
description: Ported from TypeScript's tests/cases/compiler/transformParenthesizesConditionalSubexpression.ts.
outcome: success
source: tests/cases/compiler/transformParenthesizesConditionalSubexpression.ts
---*/
// @target: es5, es2015
var K = 'k'
var a = { p  : (true ? { [K] : 'v'}        : null) }
var b = { p  : (true ? { [K] : 'v'} as any : null) }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
