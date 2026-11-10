/*---
description: Ported from TypeScript's tests/cases/compiler/thisInLambda.ts.
outcome: success
source: tests/cases/compiler/thisInLambda.ts
---*/
// @target: es2015
class Foo {
    x = "hello";
    bar() {
        this.x; // 'this' is type 'Foo'
        var f = () => this.x; // 'this' should be type 'Foo' as well
    }
}

function myFn(a:any) { }
class myCls {
    constructor () {
        myFn(() => {
            myFn(() => {
                var x = this;
            });
        });
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
