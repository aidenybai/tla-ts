/*---
description: Ported from TypeScript's tests/cases/compiler/implementsInClassExpression.ts.
outcome: success
source: tests/cases/compiler/implementsInClassExpression.ts
---*/
// @target: es2015
interface Foo {
    doThing(): void;
}

let cls = class implements Foo {
    doThing() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
