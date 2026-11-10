/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithDefaultParameterWithNoStatements16.ts.
outcome: success
source: tests/cases/compiler/functionWithDefaultParameterWithNoStatements16.ts
---*/
// @target: es2015
var v: any[];

function foo(a = bar()) { }

function bar(a = foo()) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
