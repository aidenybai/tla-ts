/*---
description: Ported from TypeScript's tests/cases/compiler/instantiatedBaseTypeConstraints.ts.
outcome: success
source: tests/cases/compiler/instantiatedBaseTypeConstraints.ts
---*/
// @target: es2015
interface Foo<T extends Foo<T, C>, C> {
  foo(bar: C): void;
}

class Bar implements Foo<Bar, string> {
  foo(bar: string): void {
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
