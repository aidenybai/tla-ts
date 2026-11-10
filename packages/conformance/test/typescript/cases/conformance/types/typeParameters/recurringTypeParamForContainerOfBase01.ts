/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeParameters/recurringTypeParamForContainerOfBase01.ts.
outcome: success
source: tests/cases/conformance/types/typeParameters/recurringTypeParamForContainerOfBase01.ts
---*/
// @target: es2015
// @declaration: true

interface BoxOfFoo<T extends Foo<T>> {
    item: T
}

interface Foo<T extends Foo<T>> {
    self: T;
}

interface Bar<T extends Bar<T>> extends Foo<T> {
    other: BoxOfFoo<T>;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
