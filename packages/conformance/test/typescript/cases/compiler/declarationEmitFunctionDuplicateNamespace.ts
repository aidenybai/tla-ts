/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitFunctionDuplicateNamespace.ts.
outcome: success
source: tests/cases/compiler/declarationEmitFunctionDuplicateNamespace.ts
---*/
// @target: es2015
// @declaration: true
function f(a: 0): 0;
function f(a: 1): 1;
function f(a: 0 | 1) {
    return a;
}

f.x = 2;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
