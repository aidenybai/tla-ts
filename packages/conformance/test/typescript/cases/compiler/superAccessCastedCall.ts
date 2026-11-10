/*---
description: Ported from TypeScript's tests/cases/compiler/superAccessCastedCall.ts.
outcome: success
source: tests/cases/compiler/superAccessCastedCall.ts
---*/
// @target: es2015
class Foo {
    bar(): void {}
}

class Bar extends Foo {
    x: Number;

    constructor() {
        super();
        this.x = 2;
    }

    bar() {
        super.bar();
        (super.bar as any)();
    }
} 

let b = new Bar();
b.bar()

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
