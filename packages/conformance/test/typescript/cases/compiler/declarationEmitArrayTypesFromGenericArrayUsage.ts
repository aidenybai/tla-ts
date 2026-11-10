/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitArrayTypesFromGenericArrayUsage.ts.
outcome: success
source: tests/cases/compiler/declarationEmitArrayTypesFromGenericArrayUsage.ts
---*/
// @target: es2015
// @declaration: true
interface A extends Array<string> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
