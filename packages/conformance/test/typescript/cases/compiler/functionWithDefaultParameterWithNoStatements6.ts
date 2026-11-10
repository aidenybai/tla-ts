/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements6.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements6.ts
---*/
// @target: es2015
function foo(a = true) { }

function bar(a = true) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
