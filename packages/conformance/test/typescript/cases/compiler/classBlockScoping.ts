/*---
description: Ported from TypeScript's tests/cases/compiler/classBlockScoping.ts.
outcome: success
source: tests/cases/compiler/classBlockScoping.ts
---*/
// @target: es2015
function f(b: boolean) {
  let Foo: any;
  if (b) {
    Foo = class Foo {
      static y = new Foo();

      static x() {
        new Foo();
      }

      m() {
        new Foo();
      }
    };

    new Foo();
  }
  else {
    class Foo {
      static y = new Foo();

      static x() {
        new Foo();
      }

      m() {
        new Foo();
      }
    }

    new Foo();
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
