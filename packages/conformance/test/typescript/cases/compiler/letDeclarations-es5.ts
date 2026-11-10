/*---
description: Ported from TypeScript's tests/cases/compiler/letDeclarations-es5.ts.
outcome: success
source: tests/cases/compiler/letDeclarations-es5.ts
---*/
// @target: ES5, ES2015

let l1;
let l2: number;
let l3, l4, l5 :string, l6;

let l7 = false;
let l8: number = 23;
let l9 = 0, l10 :string = "", l11 = null;

for(let l11 in {}) { }

for(let l12 = 0; l12 < 9; l12++) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
