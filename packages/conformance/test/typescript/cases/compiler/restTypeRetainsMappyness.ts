/*---
description: Ported from TypeScript's tests/cases/compiler/restTypeRetainsMappyness.ts.
outcome: success
source: tests/cases/compiler/restTypeRetainsMappyness.ts
---*/
// @target: es2015
type Foo<T extends any[]> = {
    [P in keyof T]: T[P]
}

function test<T extends any[]>(fn: (...args: Foo<T>) => void) {
    const arr: Foo<T> = {} as any
    fn(...arr) // Error: Argument of type 'any[]' is not assignable to parameter of type 'Foo<T>'
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
