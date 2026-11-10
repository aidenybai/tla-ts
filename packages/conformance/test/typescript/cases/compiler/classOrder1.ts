/*---
description: Ported from TypeScript's tests/cases/compiler/classOrder1.ts.
outcome: success
source: tests/cases/compiler/classOrder1.ts
---*/
// @target: es2015
class A {
    public foo() {
        /*WScript.Echo("Here!");*/
    }
}

var a = new A();
a.foo();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
