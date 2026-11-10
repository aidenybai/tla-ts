/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMap-InterfacePrecedingVariableDeclaration1.ts.
outcome: success
source: tests/cases/compiler/sourceMap-InterfacePrecedingVariableDeclaration1.ts
---*/
// @target: ES5, ES2015
// @sourcemap: true

interface I {}
var x = 0;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
