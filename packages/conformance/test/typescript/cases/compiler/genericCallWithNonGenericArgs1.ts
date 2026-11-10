/*---
description: Ported from TypeScript's tests/cases/compiler/genericCallWithNonGenericArgs1.ts.
outcome: success
source: tests/cases/compiler/genericCallWithNonGenericArgs1.ts
---*/
// @target: es2015
function f<T>(x: any) { }
f<any>(null)

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
