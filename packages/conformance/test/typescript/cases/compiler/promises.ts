/*---
description: Ported from TypeScript's tests/cases/compiler/promises.ts.
outcome: success
source: tests/cases/compiler/promises.ts
---*/
// @target: es2015
interface Promise<T> {
    then<U>(success?: (value: T) => U): Promise<U>;
    then<U>(success?: (value: T) => Promise<U>): Promise<U>;
    value: T;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
