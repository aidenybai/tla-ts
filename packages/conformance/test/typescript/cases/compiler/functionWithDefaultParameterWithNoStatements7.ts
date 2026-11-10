/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements7.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements7.ts
---*/
// @target: es2015
function foo(a = false) { }

function bar(a = false) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
