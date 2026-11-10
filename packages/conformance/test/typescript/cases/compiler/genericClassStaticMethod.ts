/*---
description: Ported from TypeScript's tests/cases/compiler/genericClassStaticMethod.ts.
outcome: success
source: tests/cases/compiler/genericClassStaticMethod.ts
---*/
// @target: es2015
class Foo<T> {
    static getFoo() {
    }
}

class Bar<T> extends Foo<T> {
    static getFoo() {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
