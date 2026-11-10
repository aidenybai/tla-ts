/*---
description: Ported from TypeScript's tests/cases/compiler/genericStaticAnyTypeFunction.ts.
outcome: success
source: tests/cases/compiler/genericStaticAnyTypeFunction.ts
---*/
// @target: es2015
class A {

    static one<T>(source: T, value: number): T {

        return source;

    }
    static goo() { return 0; }

    static two<T>(source: T): T {
        return this.one<T>(source, 42); // should not error

    }

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
