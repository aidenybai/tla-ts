/*---
description: Ported from TypeScript's tests/cases/compiler/collisionSuperAndParameter1.ts.
outcome: success
source: tests/cases/compiler/collisionSuperAndParameter1.ts
---*/
// @target: es2015
// @strict: false
class Foo {
}

class Foo2 extends Foo {
    x() {
        var lambda = (_super: number) => { // Error 
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
