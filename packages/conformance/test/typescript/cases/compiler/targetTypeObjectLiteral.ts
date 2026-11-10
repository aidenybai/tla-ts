/*---
description: Ported from TypeScript's tests/cases/compiler/targetTypeObjectLiteral.ts.
outcome: success
source: tests/cases/compiler/targetTypeObjectLiteral.ts
---*/
// @target: es2015
var z: { x: number; y: (w:string)=>number;} = {

    x: 12,

    y: function(w) {

        return 0;

    }

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
