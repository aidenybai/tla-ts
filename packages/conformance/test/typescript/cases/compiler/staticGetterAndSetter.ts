/*---
description: Ported from TypeScript's tests/cases/compiler/staticGetterAndSetter.ts.
outcome: success
source: tests/cases/compiler/staticGetterAndSetter.ts
---*/
// @target: es2015
class Foo {
    static get Foo():number { return 0; }
    static set Foo(n: number) {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
