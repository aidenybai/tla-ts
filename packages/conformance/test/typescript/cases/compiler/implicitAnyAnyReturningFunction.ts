/*---
description: Ported from TypeScript's tests/cases/compiler/implicitAnyAnyReturningFunction.ts.
outcome: success
source: tests/cases/compiler/implicitAnyAnyReturningFunction.ts
---*/
// @target: es2015
// @declaration: true
function A() {
    return <any>"";
}

function B() {
    var someLocal: any = {};
    return someLocal;
}

class C {
    public A() {
        return <any>"";
    }

    public B() {
        var someLocal: any = {};
        return someLocal;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
