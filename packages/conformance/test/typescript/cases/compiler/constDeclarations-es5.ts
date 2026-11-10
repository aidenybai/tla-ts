/*---
description: Ported from TypeScript's tests/cases/compiler/constDeclarations-es5.ts.
outcome: success
source: tests/cases/compiler/constDeclarations-es5.ts
---*/
// @strict: false
// @target: ES5, ES2015

const z7 = false;
const z8: number = 23;
const z9 = 0, z10 :string = "", z11 = null;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
