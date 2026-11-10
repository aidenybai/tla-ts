/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads12.ts.
outcome: success
source: tests/cases/compiler/functionOverloads12.ts
---*/
// @target: es2015
// @strict: false
// @allowUnreachableCode: true

function foo():string;
function foo():number;
function foo():any { if (true) return ""; else return 0;}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
