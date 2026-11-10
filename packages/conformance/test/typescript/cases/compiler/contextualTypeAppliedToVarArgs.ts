/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTypeAppliedToVarArgs.ts.
outcome: success
source: tests/cases/compiler/contextualTypeAppliedToVarArgs.ts
---*/
// @target: es2015
function delegate(instance: any, method: (...args: any[]) => any, data?: any): (...args: any[]) => any {
    return function () { };
}

class Foo{


    Bar() {
        delegate(this, function (source, args2)
        {
            var a = source.node;
            var b = args2.node;
        } );
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
