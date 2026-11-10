/*---
description: Ported from TypeScript's tests/cases/compiler/idInProp.ts.
outcome: success
source: tests/cases/compiler/idInProp.ts
---*/
// @target: es2015
function f() {

var t: { (f: any) : any; };

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
