/*---
description: Ported from TypeScript's tests/cases/compiler/redeclarationOfVarWithGenericType.ts.
outcome: success
source: tests/cases/compiler/redeclarationOfVarWithGenericType.ts
---*/
// @target: es2015
var a1: { fn<T>(x: T): T };
var a1: { fn<T>(x: T): T };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
