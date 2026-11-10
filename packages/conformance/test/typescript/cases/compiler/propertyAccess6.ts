/*---
description: Ported from TypeScript's tests/cases/compiler/propertyAccess6.ts.
outcome: throws
source: tests/cases/compiler/propertyAccess6.ts
---*/
// @target: es2015
// @strict: false
var foo: any;
foo.bar = 4;

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
