/*---
description: Ported from TypeScript's tests/cases/compiler/declFileObjectLiteralWithAccessors.ts.
outcome: success
source: tests/cases/compiler/declFileObjectLiteralWithAccessors.ts
---*/
// @declaration: true
// @target: es5, es2015

function /*1*/makePoint(x: number) { 
    return {
        b: 10,
        get x() { return x; },
        set x(a: number) { this.b = a; }
    };
};
var /*4*/point = makePoint(2);
var /*2*/x = point.x;
point./*3*/x = 30;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
