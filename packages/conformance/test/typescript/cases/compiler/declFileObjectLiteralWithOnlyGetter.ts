/*---
description: Ported from TypeScript's tests/cases/compiler/declFileObjectLiteralWithOnlyGetter.ts.
outcome: success
source: tests/cases/compiler/declFileObjectLiteralWithOnlyGetter.ts
---*/
// @declaration: true
// @target: es5, es2015

function /*1*/makePoint(x: number) { 
    return {
        get x() { return x; },
    };
};
var /*4*/point = makePoint(2);
var /*2*/x = point./*3*/x;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
