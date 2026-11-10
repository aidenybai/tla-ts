/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements12.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements12.ts
---*/
// @target: es2015
var v: any[];

function foo(a = (v)) { }

function bar(a = (v)) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
