/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements14.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements14.ts
---*/
// @target: es2015
var v: any[];

function foo(a = v[1 + 1]) { }

function bar(a = v[1 + 1]) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
