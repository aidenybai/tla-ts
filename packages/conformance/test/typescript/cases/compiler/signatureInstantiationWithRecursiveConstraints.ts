/*---
description: Ported from TypeScript's tests/cases/compiler/signatureInstantiationWithRecursiveConstraints.ts.
outcome: success
source: tests/cases/compiler/signatureInstantiationWithRecursiveConstraints.ts
---*/
// @target: es2015
// @strict: true

// Repro from #17148

class Foo {
  myFunc<T extends Foo>(arg: T) {}
}

class Bar {
  myFunc<T extends Bar>(arg: T) {}
}

const myVar: Foo = new Bar();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
