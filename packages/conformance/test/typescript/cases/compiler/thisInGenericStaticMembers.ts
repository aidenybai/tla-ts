/*---
description: Ported from TypeScript's tests/cases/compiler/thisInGenericStaticMembers.ts.
outcome: success
source: tests/cases/compiler/thisInGenericStaticMembers.ts
---*/
﻿// @target: es2015
// this.call in static generic method not resolved correctly

class A {

    static one<T>(source:T, value: number): T {
        return source;
    }

    static two<T>(source: T): T {
        return this.one<T>(source, 42);
    }
}

class B {

    static one(source: B, value: number): B {
        return source;
    }

    static two(source: B): B {
        return this.one(source, 42);
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
