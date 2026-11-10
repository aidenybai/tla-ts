/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/thisTypeInBasePropertyAndDerivedContainerOfBase01.ts.
outcome: success
source: tests/cases/conformance/types/thisType/thisTypeInBasePropertyAndDerivedContainerOfBase01.ts
---*/
// @target: es2015
// @declaration: true

interface BoxOfFoo<T extends Foo> {
    item: T
}

interface Foo {
    self: this;
}

interface Bar extends Foo {
    other: BoxOfFoo<this>;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
