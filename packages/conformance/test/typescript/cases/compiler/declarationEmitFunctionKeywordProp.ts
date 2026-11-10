/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitFunctionKeywordProp.ts.
outcome: success
source: tests/cases/compiler/declarationEmitFunctionKeywordProp.ts
---*/
// @target: es2015
// @declaration: true
function foo() {}
foo.null = true;

function bar() {}
bar.async = true;
bar.normal = false;

function baz() {}
baz.class = true;
baz.normal = false;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
