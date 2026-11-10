/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements11.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements11.ts
---*/
// @target: es2015
var v: any[];

function foo(a = v[0]) { }

function bar(a = v[0]) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
