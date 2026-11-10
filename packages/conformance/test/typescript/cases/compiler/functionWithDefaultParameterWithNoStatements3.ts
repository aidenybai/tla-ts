/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements3.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements3.ts
---*/
// @target: es2015
function foo(a = "") { }

function bar(a = "") {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
