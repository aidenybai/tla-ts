/*---
description: Ported from TypeScript's tests/cases/compiler/duplicateVariableDeclaration1.ts.
outcome: success
source: tests/cases/compiler/duplicateVariableDeclaration1.ts
---*/
// @target: es2015
var v
var v

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
