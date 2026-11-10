/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements5.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements5.ts
---*/
// @target: es2015
function foo(a = 0) { }

function bar(a = 0) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
