/*---
description: Ported from TypeScript's tests/cases/compiler/declFileObjectLiteralWithOnlySetter.ts.
outcome: success
source: tests/cases/compiler/declFileObjectLiteralWithOnlySetter.ts
---*/
// @declaration: true
// @target: es5, es2015

function /*1*/makePoint(x: number) { 
    return {
        b: 10,
        set x(a: number) { this.b = a; }
    };
};
var /*3*/point = makePoint(2);
point./*2*/x = 30;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
