/*---
description: Ported from TypeScript's tests/cases/compiler/functionTypeArgumentArrayAssignment.ts.
outcome: success
source: tests/cases/compiler/functionTypeArgumentArrayAssignment.ts
---*/
// @target: es2015
namespace test {
    interface Array<T> {
        foo: T;
        length: number;
    }

    function map<U>() {
        var ys: U[] = [];
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
