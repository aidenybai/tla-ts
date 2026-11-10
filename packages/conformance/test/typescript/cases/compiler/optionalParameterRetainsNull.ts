/*---
description: Ported from TypeScript's tests/cases/compiler/optionalParameterRetainsNull.ts.
outcome: success
source: tests/cases/compiler/optionalParameterRetainsNull.ts
---*/
// @target: es2015
// @strictNullChecks: true
interface Bar {  bar: number; foo: object | null;  }

let a = {
  test<K extends keyof Bar> (a: K,  b?: Bar[K]  |  null)  { }
};
a.test("bar", null); // ok, null is assignable to number | null | undefined

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
