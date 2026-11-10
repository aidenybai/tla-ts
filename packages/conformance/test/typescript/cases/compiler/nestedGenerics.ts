/*---
description: Ported from TypeScript's tests/cases/compiler/nestedGenerics.ts.
outcome: success
source: tests/cases/compiler/nestedGenerics.ts
---*/
// @target: es2015
interface Foo<T> {
	t: T;
}

var f: Foo<Foo<number>>;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
