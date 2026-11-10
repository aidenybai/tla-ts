/*---
description: Ported from TypeScript's tests/cases/compiler/staticInheritance.ts.
outcome: success
source: tests/cases/compiler/staticInheritance.ts
---*/
// @target: es2015
function doThing(x: { n: string }) { }
class A {
    static n: string;
    p = doThing(A); // OK
}
class B extends A {
    p1 = doThing(A); // OK
    p2 = doThing(B); // OK
}
doThing(B); //OK

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
