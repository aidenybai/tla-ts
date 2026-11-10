/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements8.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements8.ts
---*/
// @target: es2015
// @strict: false
function foo(a = undefined) { }

function bar(a = undefined) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
