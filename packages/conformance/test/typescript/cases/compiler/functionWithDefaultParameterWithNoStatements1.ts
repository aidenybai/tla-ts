/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements1.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements1.ts
---*/
// @target: es2015
function foo(x = 0) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
